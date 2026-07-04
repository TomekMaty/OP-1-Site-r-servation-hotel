#!/usr/bin/env bash
# seed_activity_demo.sh — Insère des données de démonstration dans wifi_radius_activity_logs
# Re-exécutable sans doublons (TRUNCATE + INSERT).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
DBUSER=$(grep '^DB_USER='     "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
DBPW=$(grep   '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
DBNAME=$(grep '^DB_NAME='     "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
DB_CONTAINER="maison_mysql"

SQL_FILE=$(mktemp)
cat > "$SQL_FILE" <<'EOSQL'
DELETE FROM wifi_radius_activity_logs WHERE is_demo=1;
INSERT INTO wifi_radius_activity_logs
  (room_number, mac_address, client_ip, domain, destination_ip, protocol, log_source, is_demo, visited_at)
VALUES
  ('201','F8:9E:94:E3:7B:B4','192.168.30.121','google.com',           '142.251.39.206', 'DNS','demo',1, NOW() - INTERVAL 40 MINUTE),
  ('201','F8:9E:94:E3:7B:B4','192.168.30.121','maps.google.com',      '142.250.74.100', 'DNS','demo',1, NOW() - INTERVAL 35 MINUTE),
  ('201','F8:9E:94:E3:7B:B4','192.168.30.121','www.youtube.com',      '142.250.74.110', 'DNS','demo',1, NOW() - INTERVAL 28 MINUTE),
  ('201','F8:9E:94:E3:7B:B4','192.168.30.121','instagram.com',        '157.240.241.174','DNS','demo',1, NOW() - INTERVAL 20 MINUTE),
  ('201','F8:9E:94:E3:7B:B4','192.168.30.121','weather.com',          '184.29.66.228',  'DNS','demo',1, NOW() - INTERVAL 12 MINUTE),
  ('201','F8:9E:94:E3:7B:B4','192.168.30.121','gmaps.googleapis.com', '142.250.74.120', 'DNS','demo',1, NOW() - INTERVAL 5 MINUTE),
  ('101','92:9C:8D:12:7C:F5','192.168.30.122','google.com',           '142.251.39.206', 'DNS','demo',1, NOW() - INTERVAL 90 MINUTE),
  ('101','92:9C:8D:12:7C:F5','192.168.30.122','tripadvisor.com',      '34.117.188.166', 'DNS','demo',1, NOW() - INTERVAL 80 MINUTE),
  ('101','92:9C:8D:12:7C:F5','192.168.30.122','www.booking.com',      '104.18.27.193',  'DNS','demo',1, NOW() - INTERVAL 70 MINUTE),
  ('101','92:9C:8D:12:7C:F5','192.168.30.122','translate.google.com', '142.251.39.206', 'DNS','demo',1, NOW() - INTERVAL 60 MINUTE);
SELECT CONCAT('Lignes demo inserees: ', COUNT(*)) AS resultat FROM wifi_radius_activity_logs WHERE is_demo=1;
EOSQL

docker exec -i "$DB_CONTAINER" mysql -u"$DBUSER" -p"$DBPW" "$DBNAME" < "$SQL_FILE" 2>&1 | grep -v "Using a password" || true
rm -f "$SQL_FILE"
