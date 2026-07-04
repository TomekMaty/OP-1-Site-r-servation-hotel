#!/usr/bin/env bash
# ============================================================
# sync_radius_sessions.sh — Parse les logs FreeRADIUS -> MySQL
# Maison Saclay — Portail captif EAP330 + RADIUS
#
# Lit /var/log/freeradius/radius.log (conteneur maison_freeradius),
# extrait chaque authentification (chambre + MAC + statut + heure),
# et alimente la table wifi_radius_sessions (idempotent).
#
# Aucune modification de FreeRADIUS ni du reseau. Lecture seule du log.
# Usage : bash sync_radius_sessions.sh   (re-executable a volonte)
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

DBUSER=$(grep '^DB_USER='     "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
DBPW=$(grep   '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
DBNAME=$(grep '^DB_NAME='     "$ENV_FILE" | cut -d= -f2- | tr -d '\r')

EAP_NAS_IP="192.168.30.253"   # IP reelle de la borne EAP (NAS)
FR_CONTAINER="maison_freeradius"
DB_CONTAINER="maison_mysql"

sql_escape() { printf "%s" "$1" | sed "s/'/''/g"; }

# --- 1. Recuperer le log brut depuis le conteneur FreeRADIUS ---
RAW=$(docker exec "$FR_CONTAINER" bash -c 'cat /var/log/freeradius/radius.log' 2>/dev/null || true)
if [ -z "$RAW" ]; then echo "Aucun log FreeRADIUS lisible."; exit 0; fi

# --- 2. Construire le lot SQL (staging + upsert agrege) ---
SQL_FILE=$(mktemp)
cat > "$SQL_FILE" <<'EOSQL'
CREATE TABLE IF NOT EXISTS wifi_radius_staging (
    room_number  VARCHAR(10)  NOT NULL,
    username     VARCHAR(64)  NOT NULL,
    mac_address  VARCHAR(17)  NOT NULL,
    nas_id       VARCHAR(64)  NULL,
    auth_status  ENUM('Access-Accept','Access-Reject') NOT NULL,
    auth_message VARCHAR(255) NULL,
    event_at     DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
TRUNCATE wifi_radius_staging;
EOSQL

count=0
while IFS= read -r line; do
    # Ne garder que les lignes d'authentification
    case "$line" in
        *": Auth: "*"Login "*) : ;;
        *) continue ;;
    esac

    # Statut
    if [[ "$line" == *"Login OK"* ]]; then status="Access-Accept"
    elif [[ "$line" == *"Login incorrect"* ]]; then status="Access-Reject"
    else continue; fi

    # MAC obligatoire (vrais appareils uniquement) : "cli XX-XX-..."
    if [[ "$line" =~ cli\ ([0-9A-Fa-f]{2}([-:][0-9A-Fa-f]{2}){5}) ]]; then
        mac="${BASH_REMATCH[1]//-/:}"
        mac=$(printf "%s" "$mac" | tr 'a-f' 'A-F')
    else
        continue
    fi

    # Chambre / username : premier [...]
    if [[ "$line" =~ \[([^]]+)\] ]]; then room="${BASH_REMATCH[1]}"; else continue; fi

    # NAS / client RADIUS
    nasid=""
    if [[ "$line" =~ from\ client\ ([^ ]+) ]]; then nasid="${BASH_REMATCH[1]}"; fi

    # Timestamp ctime -> MySQL datetime
    ts_raw="${line%% : *}"
    event_at=$(date -d "$ts_raw" +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "")
    [ -z "$event_at" ] && continue

    msg=$([ "$status" = "Access-Accept" ] && echo "Login OK" || echo "Login incorrect")

    r=$(sql_escape "$room"); m=$(sql_escape "$mac"); n=$(sql_escape "$nasid")
    printf "INSERT INTO wifi_radius_staging (room_number,username,mac_address,nas_id,auth_status,auth_message,event_at) VALUES ('%s','%s','%s','%s','%s','%s','%s');\n" \
        "$r" "$r" "$m" "$n" "$status" "$msg" "$event_at" >> "$SQL_FILE"
    count=$((count+1))
done <<< "$RAW"

# --- 3. Upsert agrege (valeurs absolues = idempotent) ---
cat >> "$SQL_FILE" <<EOSQL
INSERT INTO wifi_radius_sessions
    (username, room_number, mac_address, nas_ip, nas_identifier,
     auth_status, auth_message, connected_at, last_seen_at, auth_count)
SELECT username, room_number, mac_address, '$EAP_NAS_IP', MAX(nas_id),
       auth_status, MAX(auth_message), MIN(event_at), MAX(event_at), COUNT(*)
FROM wifi_radius_staging
GROUP BY room_number, mac_address, auth_status, username
ON DUPLICATE KEY UPDATE
    connected_at   = VALUES(connected_at),
    last_seen_at   = VALUES(last_seen_at),
    auth_count     = VALUES(auth_count),
    nas_identifier = VALUES(nas_identifier),
    auth_message   = VALUES(auth_message);
DROP TABLE wifi_radius_staging;
SELECT CONCAT('Sessions en base: ', COUNT(*)) AS resultat FROM wifi_radius_sessions;
EOSQL

# --- 4. Executer ---
docker exec -i "$DB_CONTAINER" mysql -u"$DBUSER" -p"$DBPW" "$DBNAME" < "$SQL_FILE" 2>&1 | grep -v "Using a password" || true
rm -f "$SQL_FILE"
echo "Lignes d'auth traitees: $count"
