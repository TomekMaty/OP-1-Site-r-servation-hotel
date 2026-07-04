# Fiche technique orale — Maison Saclay
## Hôtel 5 étoiles — Projet MRT

---

## Architecture générale

```
┌─────────────────────────────────────────────────┐
│                 CLIENT (navigateur)              │
│              React.js — Maison Saclay            │
└───────────────────────┬─────────────────────────┘
                        │ HTTP/JSON
                        ▼
┌─────────────────────────────────────────────────┐
│              NGINX (container Docker)            │
│    Sert le frontend React (dist/)               │
│    Redirige /api/* vers PHP-FPM                 │
└───────────┬──────────────────┬──────────────────┘
            │                  │
            ▼                  ▼
┌─────────────────┐   ┌─────────────────────────┐
│   PHP 8.2-FPM   │   │    MySQL 8.0            │
│   API REST      │──▶│    Base de données      │
│   (backend/)    │   │    (volumes Docker)     │
└────────┬────────┘   └─────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│              TELEGRAM BOT API                    │
│   Notifications réservations + commandes        │
│   Boutons interactifs Confirmer/Refuser         │
└─────────────────────────────────────────────────┘

RÉSEAU HÔTEL (192.168.30.x)
┌─────────────────────────────────────────────────┐
│  Téléphone client                               │
│       ↓ WiFi OP1_Wifi                          │
│  Borne EAP330 (192.168.30.253)                 │
│       ↓ portail captif intégré (login chambre) │
│       ↓ RADIUS UDP → 192.168.30.2:1812      │
│  FreeRADIUS (Docker Linux natif)                        │
│       ↓ → 127.0.0.1:1812                       │
│  FreeRADIUS (Docker)                           │
│       ↓ Access-Accept / Access-Reject           │
│  EAP330 → Internet autorisé ou bloqué          │
└─────────────────────────────────────────────────┘

TÉLÉPHONIE
┌─────────────────────────────────────────────────┐
│  Asterisk 16 (container Docker, mode host)      │
│  10 extensions SIP : 1001-1009 + réception 1099│
│  Clients connectés → extensions de chambre     │
└─────────────────────────────────────────────────┘
```

---

## 1. Frontend React

**Rôle :**
Interface utilisateur du site hôtel. Pages publiques pour les clients + tableau de bord admin.

**Fichiers principaux :**
- `maison-saclay/src/App.tsx` — routeur principal (react-router)
- `maison-saclay/src/pages/AdminPage.tsx` — tableau de bord admin complet
- `maison-saclay/src/services/api.ts` — tous les appels API vers le backend
- `maison-saclay/src/pages/` — pages publiques (accueil, chambres, restaurant...)

**Pages disponibles :**
- `/` → Accueil
- `/chambres` → Catalogue des types de chambres
- `/chambres/:slug` → Détail + formulaire de réservation
- `/confirmation` → Confirmation après réservation
- `/restaurant` → Menu et room service
- `/connexion` → Login/inscription client
- `/mon-espace` → Espace client (mes réservations, mes commandes)
- `/admin` → Tableau de bord admin (protégé par mot de passe)

**Ce que je peux montrer au prof :**
- Page d'accueil et navigation
- Réservation complète : chambres → détail → formulaire → confirmation
- Tableau de bord admin avec tous les onglets
- Onglet WiFi avec sessions RADIUS et activité réseau

**Phrase orale :**
"Le frontend est une SPA React construite avec TypeScript et Tailwind CSS. Elle communique avec le backend PHP via une API REST. Le build de production est servi par nginx dans Docker."

---

## 2. Backend PHP

**Rôle :**
API REST — reçoit les requêtes du frontend, les traite, interroge MySQL, retourne du JSON.

**Fichiers principaux :**
- `backend/public/index.php` — routeur central + autoloader
- `backend/src/Controllers/BookingController.php` — réservations
- `backend/src/Controllers/OrderController.php` — room service
- `backend/src/Controllers/WifiController.php` — données WiFi
- `backend/src/Controllers/AuthController.php` — authentification JWT
- `backend/src/Core/JWT.php` — génération/vérification des tokens
- `backend/src/Config/Database.php` — connexion MySQL (singleton PDO)

**Architecture MVC simplifiée :**
```
Requête HTTP → index.php (Router) → Controller → Model → MySQL
                                              ↓
                                          Response::json()
```

**Ce que je peux montrer au prof :**
- Code du BookingController (flow complet d'une réservation)
- Code JWT (algorithme HS256 implémenté manuellement)
- Requête SQL avec JOIN pour les réservations

**Phrase orale :**
"Le backend PHP reçoit les requêtes sur `/api/*`. Il vérifie l'authentification JWT, valide les données, interroge MySQL via PDO, et retourne une réponse JSON standardisée avec `success: true/false`."

---

## 3. Base de données MySQL

**Rôle :**
Stocke toutes les données persistantes du projet.

**Fichiers SQL :**
- `sql/schema.sql` — structure des tables principales
- `sql/seed.sql` — données initiales (types de chambres, menu)
- `sql/03-physical-rooms.sql` — chambres physiques (101-603)
- `sql/05-wifi-radius-sessions.sql` — table sessions WiFi RADIUS
- `sql/06-wifi-activity-logs.sql` — table activité réseau

**Tables et nombre de lignes actuels :**
| Table | Lignes | Rôle |
|---|---|---|
| `rooms` | 3 | Types de chambres (Deluxe, Suite, Penthouse) |
| `physical_rooms` | 9 | Chambres réelles (101-103, 201-203, 601-603) |
| `bookings` | 16 | Réservations clients |
| `users` | 13 | Comptes clients |
| `menu_items` | 14 | Articles du restaurant |
| `orders` | 11 | Commandes room service |
| `order_items` | 18 | Lignes des commandes |
| `wifi_radius_sessions` | 4 | Connexions WiFi réelles |
| `wifi_radius_activity_logs` | 10 | Activité réseau (démo) |
| `wifi_sessions` | 11 | Ancien portail (legacy) |

**Ce que je peux montrer au prof :**
- phpMyAdmin sur http://localhost:8080
- Table bookings avec les réservations et chambres attribuées
- Table wifi_radius_sessions avec les vraies connexions

**Phrase orale :**
"MySQL stocke toutes les données dans des tables relationnelles. Par exemple, une réservation référence le type de chambre via `room_id` ET la chambre physique précise via `physical_room_id`. MySQL tourne dans Docker avec un volume persistant : les données survivent aux redémarrages."

---

## 4. Docker

**Rôle :**
Orchestre les 8 services du projet dans des containers isolés.

**Fichier principal :** `docker-compose.yml`

**Commandes importantes :**
```bash
# Démarrer tous les services
docker compose up -d

# Vérifier l'état
docker compose ps

# Voir les logs d'un service
docker compose logs php --tail 50

# Entrer dans un container
docker exec -it maison_php bash
```

**Ce que je peux montrer au prof :**
- `docker compose ps` → tous les containers Up
- `docker compose logs` → logs sans erreur

**Phrase orale :**
"Docker nous permet de déployer l'ensemble du projet en une seule commande. Chaque service (PHP, MySQL, nginx, FreeRADIUS, Asterisk) est isolé dans son container. Ils communiquent via un réseau Docker interne nommé `hotel-net`."

---

## 5. Portail captif WiFi (EAP330 + FreeRADIUS)

**Rôle :**
Authentification WiFi des clients par numéro de chambre.

**Fichiers principaux :**
- `portail-captif/udp_relay.ps1` — relay UDP Windows → FreeRADIUS Docker
- `portail-captif/sync_radius_sessions.sh` — parse logs FreeRADIUS → MySQL
- `portail-captif/seed_activity_demo.sh` — insère données démo
- `freeradius/` — configuration FreeRADIUS (users, clients)
- `docs/PORTAIL_CAPTIF.md` — documentation technique

**Flux d'authentification :**
```
1. Client connecte son téléphone à OP1_Wifi
2. La borne EAP330 affiche le portail captif
3. Le client entre : identifiant = chambre (ex: 201), mot de passe = 201
4. La borne envoie une requête RADIUS UDP vers 192.168.30.2:1812
5. Le relay PowerShell reçoit et retransmet vers 127.0.0.1:1812 (FreeRADIUS Docker)
6. FreeRADIUS vérifie les identifiants dans son fichier users
7. Réponse : Access-Accept (autorisé) ou Access-Reject (refusé)
8. La borne EAP330 autorise ou bloque l'accès Internet
```

**Ce que je peux montrer au prof :**
- Connexion WiFi en live avec un téléphone (login chambre 201)
- Admin WiFi après connexion : session visible avec MAC et chambre
- Logs FreeRADIUS : `docker logs maison_freeradius`

**Phrase orale :**
"Le portail captif utilise le protocole RADIUS, standard dans les réseaux hôteliers. La borne TP-Link EAP330 joue le rôle de NAS (Network Access Server) et délègue l'authentification à FreeRADIUS. FreeRADIUS tourne dans Docker. On a dû créer un relay UDP PowerShell car Docker Desktop sur Windows ne peut pas recevoir de paquets UDP depuis le réseau local."

---

## 6. Téléphonie Asterisk

**Rôle :**
Système de téléphonie IP interne de l'hôtel.

**Extensions SIP (correspondance réelle) :**
- Chambres 101–103 → postes **1001, 1002, 1003**
- Chambres 201–203 → postes **2001, 2002, 2003**
- Chambres 601–603 → postes **6001, 6002, 6003**
- Réception → **1099**

**3 fonctionnalités configurées :**

1. **Appels + voicemail** : appel entre chambres, si pas de réponse en 20 s → messagerie vocale → email avec `.wav`
2. **Alarme incendie (`*99`)** : fait sonner tous les 10 postes simultanément via `Originate async`. Chaque écran affiche **"Alarme incendie"** via `SendText()`
3. **Visiteur attendu (`*9812001`)** : la réception prévient la chambre 201. L'écran affiche **"Votre contact est arrivé"** sans que le client décroche

**Container en mode `network_mode: host`** (obligatoire pour SIP/RTP)

**Ce que je peux montrer au prof :**
- `docker exec maison_asterisk asterisk -rx "sip show peers"` → peers connectés
- `Asterisk16/config/extensions.conf` → montrer les contextes `[alarme]` et `[visiteur]`

**Phrase orale :**
"Asterisk gère 3 choses : les appels normaux avec voicemail automatique par e-mail, l'alarme incendie qui sonne tous les téléphones en même temps via `Originate async`, et les notifications de visiteur qui affichent un message sur l'écran de la chambre. Tout est dans `extensions.conf`."

---

## 7. Telegram Bot

**Rôle :**
Notifie l'admin en temps réel des nouvelles réservations et commandes.

**Fonctionnement :**
- À chaque réservation : message Telegram avec boutons ✅ Confirmer / ❌ Annuler
- À chaque commande : message avec boutons ✅ Accepter / ❌ Refuser
- L'admin clique → le worker PHP reçoit le callback et met à jour le statut en base

**Ce que je peux montrer au prof :**
- Créer une réservation → notification Telegram reçue
- Cliquer "Confirmer" dans Telegram → statut mis à jour dans l'admin React

**Phrase orale :**
"On a intégré un bot Telegram pour les notifications en temps réel. À chaque réservation ou commande, l'admin reçoit un message avec des boutons interactifs. Le click sur le bouton déclenche un webhook qui met à jour le statut en base MySQL."

---

## Commandes de lancement (Jour J)

```powershell
# 1. Vérifier Docker
docker compose ps

# 2. Vérifier IP statique
ipconfig
# → Ethernet : 192.168.30.2

# 3. Vérifier relay UDP
netstat -an | findstr 18120
# → UDP 0.0.0.0:18120

# 4. Rafraîchir les données WiFi avant démo
bash portail-captif/sync_radius_sessions.sh
bash portail-captif/seed_activity_demo.sh

# 5. Ouvrir l'admin
# http://localhost/admin
# Mot de passe : dans .env → ADMIN_PASSWORD
```

---

## Scénario de démonstration recommandé

1. **Montrer le site public** → accueil, chambres, détail chambre
2. **Faire une réservation** → choisir chambre → remplir formulaire → confirmation avec numéro de chambre attribué
3. **Ouvrir l'admin** → voir la réservation apparaître → changer le statut
4. **Montrer le room service** → se connecter en tant que client → commander un plat → voir dans l'admin
5. **Montrer le WiFi** → onglet WiFi → sessions RADIUS → activité réseau
6. **Montrer l'infrastructure** → `docker compose ps` → tous Up → phpMyAdmin → tables
7. **Démo WiFi live** (si téléphone disponible) → connexion WiFi chambre 201 → Internet OK → retour admin → session visible

