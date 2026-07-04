# Administration WiFi — Maison Saclay

Tableau de bord admin des connexions du portail captif.
Onglet : **Admin → WiFi**

> L'onglet s'appelait "Portail captif" en développement. Il a été renommé et consolidé
> en un seul onglet **WiFi** montrant les données RADIUS réelles. L'ancien onglet "WiFi"
> (portail custom externe, abandonné) a été supprimé.

---

## 1. Vue d'ensemble

L'onglet « Portail captif » affiche les **connexions WiFi réelles** des clients, issues
des logs d'authentification **FreeRADIUS** du portail intégré EAP330.

Chaîne de données :

```
FreeRADIUS (radius.log)
      │  parser
      ▼
MySQL : wifi_radius_sessions
      │  API PHP
      ▼
GET /api/wifi-radius-sessions  ──▶  Onglet React « Portail captif »
```

---

## 2. Données affichées

Par appareil (couple chambre + MAC) :

| Colonne | Description | Disponible |
|---|---|---|
| Chambre | Numéro de chambre (= identifiant RADIUS) | ✅ |
| Adresse MAC | MAC du client (Calling-Station-Id) | ✅ |
| Borne (NAS) | IP de la borne EAP (`192.168.30.253`) | ✅ |
| Connexions | Nombre d'auth + dernière vue | ✅ |
| Première | Première authentification observée | ✅ |
| Statut | Accès autorisé / Refusé | ✅ |
| Adresse IP client | non fournie par RADIUS | ❌ |
| Durée de session | pas d'accounting EAP330 standalone | ❌ |

Statistiques en haut : **appareils**, **chambres**, **acceptés**, **refusés**.

---

## 2 bis. Section Activité réseau

L'onglet WiFi affiche en bas une section **Activité réseau** avec les domaines DNS consultés.

| État | Affichage |
|---|---|
| Données de démonstration (`is_demo=1`) | Badge amber "démonstration" + bannière explicative |
| Données réelles (`is_demo=0`) | Badge vert "Source réelle" |

Les colonnes : **Chambre · MAC · Domaine · Protocole · Heure**

**Règles honnêteté :**
- Chaque ligne est badgée "démo" ou "réel"
- Le contenu HTTPS n'est jamais affiché (chiffré)
- Les mots de passe et pages privées ne sont jamais collectés

**Pour connecter des données réelles :**
1. Installer un DNS local sur `192.168.30.104` (Pi-hole, dnsmasq)
2. Forcer les clients WiFi à l'utiliser via DHCP (option 6 sur le routeur Cisco)
3. Parser les logs DNS → insérer dans `wifi_radius_activity_logs` avec `is_demo=0`
4. Les vraies données apparaissent automatiquement dans l'admin

**Remettre à jour les données de démo avant soutenance :**
```bash
bash portail-captif/seed_activity_demo.sh
```

---

## 3. Composants

| Couche | Fichier |
|---|---|
| Table sessions SQL | `sql/05-wifi-radius-sessions.sql` → `wifi_radius_sessions` |
| Table activité SQL | `sql/06-wifi-activity-logs.sql` → `wifi_radius_activity_logs` |
| Parser sessions RADIUS | `portail-captif/sync_radius_sessions.sh` |
| Seed démo activité | `portail-captif/seed_activity_demo.sh` |
| Modèle sessions PHP | `backend/src/Models/WifiRadiusSession.php` |
| Modèle activité PHP | `backend/src/Models/WifiRadiusActivityLog.php` |
| Contrôleur | `backend/src/Controllers/WifiController.php` → `radiusSessions()` + `activityLogs()` |
| Routes API | `GET /api/wifi-radius-sessions` · `GET /api/wifi-activity` (admin) |
| UI React | `maison-saclay/src/pages/AdminPage.tsx` → `WifiTab` + `ActivitySection` |
| Types/fetch | `maison-saclay/src/services/api.ts` → `fetchWifiRadiusSessions()` + `fetchWifiActivity()` |

---

## 4. Mettre à jour les connexions

Le parser lit le log FreeRADIUS et alimente la table (idempotent — re-exécutable sans doublons).

```bash
cd "Projet Hotel 5 etoiles"
bash portail-captif/sync_radius_sessions.sh
```

À lancer avant une démo, ou périodiquement (Planificateur de tâches Windows / cron).
Seules les lignes avec un **vrai MAC** (vrais appareils) sont ingérées ; les tests synthétiques
sans MAC sont ignorés.

Après synchro, rafraîchir l'onglet admin (bouton recharger).

---

## 5. Table `wifi_radius_sessions`

```
id, username, room_number, mac_address, client_ip (null), nas_ip,
nas_identifier, auth_status (Access-Accept|Access-Reject), auth_message,
user_agent (null), auth_count, connected_at, last_seen_at, created_at
```

Clé d'unicité : `(room_number, mac_address, auth_status)` → un appareil = une ligne,
`auth_count` = nombre d'authentifications, `connected_at`/`last_seen_at` = première/dernière vue.

---

## 6. Activité réseau (historique Internet)

L'onglet indique honnêtement les limites :

- Le **contenu HTTPS est chiffré** → non visible (et on ne cherche pas à l'être : supervision
  non intrusive, pas de mots de passe ni de pages privées).
- Dans une infrastructure réelle, l'historique réseau (domaines, IP de destination, heure)
  serait alimenté par les **logs DNS** ou le **pare-feu**.
- Cette partie est documentée comme **structure démonstrative**, non activée par défaut pour
  ne pas modifier la configuration réseau qui fonctionne.

---

## 7. Garanties

- ✅ Aucune modification de la config FreeRADIUS, du réseau ou de docker-compose.
- ✅ Lecture seule des logs → **le portail captif fonctionnel n'est jamais impacté**.
- ✅ Tout est additif : nouvelle table, nouveau endpoint, nouvel onglet.

Voir aussi : [`PORTAIL_CAPTIF.md`](PORTAIL_CAPTIF.md).
