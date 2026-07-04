# Comment comprendre et modifier le projet
## Maison Saclay — Guide pratique pour l'oral

---

## OBJECTIF DE CE DOCUMENT

Ce guide répond à toutes les questions qu'un professeur pourrait poser sur le projet :
"À quoi sert ce dossier ?", "Comment tu ajoutes une page ?", "Comment tu testes ?"

**Règle d'or : comprendre avant de modifier. Ne jamais changer un fichier au hasard.**

---

## PARTIE 1 — Structure complète du projet

### Vue d'ensemble des dossiers

```
Projet Hotel 5 etoiles/
│
├── backend/                  ← API PHP (le "cerveau" du projet)
├── maison-saclay/            ← Frontend React (ce que le client voit)
├── Asterisk16/               ← Téléphonie IP
├── portail-captif/           ← Scripts Wi-Fi RADIUS
├── freeradius/               ← Configuration FreeRADIUS
├── sql/                      ← Fichiers de base de données
├── docs/                     ← Documentation
├── docker-compose.yml        ← Lance tout le projet en une commande
└── .env                      ← Secrets (mots de passe, clés)
```

---

### `backend/`

**Rôle :** Le serveur PHP. Il reçoit les requêtes du frontend, les traite, et renvoie des réponses JSON.

**Contenu :**
```
backend/
├── public/
│   └── index.php       ← POINT D'ENTRÉE UNIQUE de toute l'API
├── src/
│   ├── Core/           ← Classes techniques de base
│   ├── Controllers/    ← Logique métier (réservations, commandes, etc.)
│   ├── Models/         ← Accès à la base de données
│   └── Config/         ← Configuration (connexion MySQL)
└── logs/
    ├── mail.log        ← Historique de tous les e-mails envoyés
    └── voicemail.log   ← Historique de tous les événements voicemail
```

**Quand le modifier :** Quand on veut ajouter une fonctionnalité côté serveur, une nouvelle route API, ou changer un e-mail.

**Ce qu'il ne faut PAS toucher sans comprendre :**
- `backend/src/Core/JWT.php` — gère la sécurité des tokens
- `backend/src/Core/AdminMiddleware.php` — protège les routes admin
- `backend/src/Config/Database.php` — connexion MySQL

---

### `backend/public/`

**Rôle :** Dossier servi par nginx. Contient uniquement `index.php`.

**`index.php` :**
- Configure les headers CORS (autorise les requêtes depuis le frontend)
- Charge les classes PHP automatiquement (autoloader PSR-4)
- Lit les variables du fichier `.env`
- Définit toutes les routes de l'API
- Appelle `$router->dispatch()` qui analyse l'URL et appelle le bon controller

**Quand le modifier :** Seulement pour ajouter une nouvelle route.

---

### `backend/src/Core/`

**Rôle :** Outils techniques utilisés par tous les controllers.

| Fichier | Rôle |
|---|---|
| `Router.php` | Analyse l'URL et appelle le bon controller |
| `MailService.php` | Envoie tous les e-mails (SMTP natif) |
| `JWT.php` | Crée et vérifie les tokens d'authentification |
| `AuthMiddleware.php` | Vérifie que le client est connecté |
| `AdminMiddleware.php` | Vérifie que c'est bien l'admin |
| `Response.php` | Standardise les réponses JSON (`{"success":true,"data":...}`) |
| `Telegram.php` | Envoie des messages au bot Telegram |

**Quand le modifier :** Rarement. Ce sont des outils qui fonctionnent. Seulement si on change le protocole SMTP ou le format des réponses.

---

### `backend/src/Controllers/`

**Rôle :** Contient la logique métier de chaque fonctionnalité. Un controller reçoit une requête API, vérifie les données, appelle la base si besoin, puis renvoie une réponse JSON.

| Fichier | Rôle |
|---|---|
| `AuthController.php` | Inscription, connexion client, connexion admin |
| `BookingController.php` | Réservations (créer, lister, changer statut) |
| `OrderController.php` | Commandes room service |
| `MeController.php` | Espace client (profil, réservations, commandes, e-mail) |
| `VoicemailController.php` | Reçoit la notification Asterisk, envoie l'e-mail |
| `WifiController.php` | Données du portail captif pour l'admin |
| `RoomController.php` | Types de chambres (Deluxe, Suite, Penthouse) |
| `MenuController.php` | Carte du restaurant |
| `StatsController.php` | Statistiques pour le tableau de bord admin |
| `TelegramController.php` | Bot Telegram (webhooks, boutons) |

**Quand le modifier :** Quand on veut changer la logique d'une fonctionnalité existante ou en ajouter une nouvelle.

---

### `backend/logs/`

**Rôle :** Contient les fichiers de log. Ne pas modifier manuellement.

- `mail.log` → chaque ligne = un e-mail envoyé (OK ou erreur)
- `voicemail.log` → chaque ligne = un événement voicemail (extension, chambre, destinataire)

**Quand le consulter :** Pour vérifier qu'un mail a bien été envoyé, ou débugger un problème de voicemail.

```bash
# Lire les derniers logs mail
docker exec maison_php tail -20 /var/www/backend/logs/mail.log

# Lire les derniers logs voicemail
docker exec maison_php tail -20 /var/www/backend/logs/voicemail.log
```

---

### `maison-saclay/`

**Rôle :** Le frontend React. C'est ce que les clients voient dans leur navigateur.

**Technologie :** React + TypeScript + Tailwind CSS + Vite

```
maison-saclay/
├── src/
│   ├── pages/          ← Une page = un fichier .tsx
│   ├── components/     ← Composants réutilisables (EmailModal, etc.)
│   ├── services/
│   │   └── api.ts      ← TOUS les appels vers l'API PHP
│   ├── lib/
│   │   └── auth-context.tsx ← Gestion de la session utilisateur
│   └── App.tsx         ← Routeur principal (quelle page afficher ?)
├── dist/               ← Build de production (généré par npm run build)
└── package.json        ← Dépendances Node.js
```

**Important :** Le dossier `dist/` est servi par nginx. Après chaque modification du code React, il faut rebuilder (`npm run build`) sinon les changements ne s'affichent pas.

---

### `maison-saclay/src/pages/`

**Rôle :** Chaque fichier correspond à une page du site.

| Fichier | URL | Contenu |
|---|---|---|
| `HomePage.tsx` | `/` | Page d'accueil |
| `RoomsPage.tsx` | `/chambres` | Liste des chambres |
| `RoomDetailPage.tsx` | `/chambres/:slug` | Détail + réservation |
| `ConfirmationPage.tsx` | `/confirmation` | Confirmation réservation |
| `RestaurantPage.tsx` | `/restaurant` | Menu + room service |
| `RoomServicePage.tsx` | `/room-service` | Commander en chambre |
| `LoginPage.tsx` | `/connexion` | Connexion / Inscription |
| `MyAccountPage.tsx` | `/mon-espace` | Espace client |
| `AdminPage.tsx` | `/admin` | Tableau de bord admin |
| `ContactPage.tsx` | `/contact` | Formulaire contact |
| `NotFoundPage.tsx` | `*` | Page 404 |

---

### `maison-saclay/src/services/`

**Rôle :** `api.ts` est le fichier qui fait tous les appels HTTP vers le backend PHP. Chaque action (réserver, commander, se connecter) a sa propre fonction ici.

**Règle :** On ne fait jamais de `fetch()` directement dans une page. On appelle toujours une fonction de `api.ts`.

---

### `Asterisk16/`

**Rôle :** Configuration de la téléphonie IP.

```
Asterisk16/
├── config/
│   ├── sip.conf              ← Déclaration des extensions SIP (les postes)
│   ├── extensions.conf       ← Logique des appels (que faire quand on compose X)
│   ├── voicemail.conf        ← Configuration messagerie vocale
│   └── scripts/
│       └── voicemail_notify.sh ← Script appelé automatiquement après chaque voicemail
└── spool/                    ← Fichiers audio .wav des messages vocaux (géré par Asterisk)
```

**Ce qu'il ne faut PAS toucher sans faire attention :**
- `sip.conf` — si on modifie une extension, les téléphones ne s'enregistrent plus
- `extensions.conf` — si on casse le dialplan, les appels ne fonctionnent plus
- `voicemail.conf` ligne `externnotify=` — c'est ce qui déclenche les notifications par e-mail

**Quand le modifier :** Seulement pour ajouter/supprimer des extensions ou changer la logique d'appel.

---

### `docs/`

**Rôle :** Documentation du projet. Ces fichiers ne sont pas servis par le site, ils sont uniquement pour les développeurs.

| Fichier | Contenu |
|---|---|
| `EXPLICATION_CODE_ORAL.md` | Documentation complète de tout le projet |
| `RESUME_ORAL_5_MINUTES.md` | Fiche courte pour l'oral (5 minutes) |
| `COMMENT_COMPRENDRE_ET_MODIFIER_LE_PROJET.md` | Ce fichier — guide pratique |
| `CODE_EXPLIQUE_SIMPLEMENT.md` | Explication fichier par fichier |
| `QUESTIONS_PROF_REPONSES.md` | Questions/réponses pour l'oral |
| `FICHE_ORAL_TECHNIQUE.md` | Fiche technique avec schémas |
| `TELEPHONIE.md` | Doc spécifique Asterisk |
| `PORTAIL_CAPTIF.md` | Doc spécifique Wi-Fi RADIUS |

---

### `docker-compose.yml`

**Rôle :** Lance tous les services en une seule commande. C'est l'orchestrateur du projet.

**Ce qu'il ne faut PAS toucher :**
- Les noms des containers (d'autres fichiers les référencent)
- Les ports exposés (le frontend pointe dessus)
- Les volumes (ils contiennent les données)

---

### `.env`

**Rôle :** Contient tous les secrets du projet. N'est JAMAIS versionnée (pas dans Git).

```
DB_HOST=mysql
DB_NAME=maison_saclay
JWT_SECRET=...            ← Clé secrète pour signer les tokens
ADMIN_PASSWORD=...        ← Mot de passe du tableau de bord admin
SMTP_USER=...             ← Adresse Gmail pour envoyer les mails
SMTP_PASSWORD=...         ← Mot de passe d'application Gmail
ADMIN_EMAIL=...           ← E-mail de la réception
TELEGRAM_BOT_TOKEN=...    ← Token du bot Telegram
TELEGRAM_CHAT_ID=...      ← ID du chat Telegram admin
```

**Règle absolue :** Ne jamais mettre le contenu de `.env` dans le code, dans Git, ou dans une doc publique.

---

### `sql/`

**Rôle :** Scripts SQL qui créent et peuplent la base de données au démarrage Docker.

| Fichier | Exécuté quand |
|---|---|
| `schema.sql` | Au 1er démarrage Docker (crée les tables) |
| `seed.sql` | Idem (insère les données initiales) |
| `03-physical-rooms.sql` | Idem (chambres physiques + extensions tél.) |

**Ce qu'il ne faut PAS toucher :** Si on modifie `schema.sql` après que Docker a déjà créé la base, rien ne change. Il faudrait recréer le volume (ce qui efface les données).

---

## PARTIE 2 — Fichiers principaux et leur rôle

### `backend/public/index.php`

- **Reçoit :** Toutes les requêtes HTTP de l'API (`/api/*`)
- **Renvoie :** Appelle le bon controller selon l'URL
- **Communique avec :** `Router.php`, tous les controllers
- **Phrase orale :** "C'est le point d'entrée unique de toute l'API. Il lit l'URL, trouve la bonne route, et appelle le bon controller."

---

### `backend/src/Core/Router.php`

- **Reçoit :** Les définitions de routes (`get('/rooms', ...)`, `post('/bookings', ...)`)
- **Renvoie :** Appelle le handler correspondant à l'URL reçue
- **Communique avec :** `index.php`, tous les controllers
- **Phrase orale :** "Le routeur convertit les URLs en appels de fonctions. `/api/bookings` → `BookingController::store()`."

---

### `backend/src/Core/MailService.php`

- **Reçoit :** Un e-mail destinataire, un sujet, un corps de message
- **Renvoie :** `true` si envoyé, `false` si ignoré ou erreur
- **Communique avec :** SMTP Gmail (réseau externe), `logs/mail.log`
- **Phrase orale :** "Tous les e-mails du projet passent par ce service. Il est centralisé pour éviter la répétition et faciliter la configuration."

---

### `backend/src/Controllers/AuthController.php`

- **Reçoit :** Email + mot de passe (POST JSON)
- **Renvoie :** Un token JWT + les infos utilisateur
- **Communique avec :** `User` model, `JWT.php`, `MailService.php`
- **Phrase orale :** "Ce controller gère l'inscription et la connexion. À la connexion, il vérifie le mot de passe bcrypt et retourne un JWT."

---

### `backend/src/Controllers/BookingController.php`

- **Reçoit :** Token JWT + dates + type de chambre
- **Renvoie :** ID réservation, numéro de chambre attribué, prix total
- **Communique avec :** DB (bookings, physical_rooms), `MailService.php`, `Telegram.php`
- **Phrase orale :** "Ce controller gère tout le processus de réservation : trouver une chambre libre, calculer le prix, notifier l'admin."

---

### `backend/src/Controllers/OrderController.php`

- **Reçoit :** Token JWT + liste d'articles du menu
- **Renvoie :** ID commande, total, statut
- **Communique avec :** DB (orders, bookings, menu_items), `MailService.php`, `Telegram.php`
- **Phrase orale :** "Ce controller gère le room service. Il retrouve automatiquement la chambre du client depuis sa réservation active."

---

### `backend/src/Controllers/MeController.php`

- **Reçoit :** Token JWT du client connecté
- **Renvoie :** Profil, réservations, commandes, ou confirmation de mise à jour e-mail
- **Communique avec :** DB (users, bookings, orders)
- **Phrase orale :** "Ce controller donne accès à l'espace personnel du client connecté."

---

### `backend/src/Controllers/VoicemailController.php`

- **Reçoit :** POST de `voicemail_notify.sh` (extension + contexte + nombre de messages)
- **Renvoie :** Confirmation d'envoi de l'e-mail
- **Communique avec :** DB (physical_rooms, bookings, users), spool Asterisk (fichiers .wav), `MailService.php`
- **Phrase orale :** "Ce controller reçoit la notification d'Asterisk, retrouve le bon client via la base, et envoie l'e-mail avec le message vocal joint."

---

### `maison-saclay/src/services/api.ts`

- **Reçoit :** Les paramètres de chaque action (email, dates, articles...)
- **Renvoie :** Les données JSON renvoyées par le backend
- **Communique avec :** Backend PHP via HTTP fetch
- **Phrase orale :** "Ce fichier centralise tous les appels API. Il ajoute automatiquement le token JWT à chaque requête."

---

### `maison-saclay/src/components/EmailModal.tsx`

- **Reçoit :** L'état d'authentification (via `useAuth()`)
- **Renvoie :** Une modale React ou rien (si email déjà renseigné)
- **Communique avec :** `api.ts` (PUT /me/email), `auth-context.tsx`
- **Phrase orale :** "Ce composant s'affiche automatiquement si le compte n'a pas d'e-mail. Le bouton Plus tard le ferme pour la session."

---

### `Asterisk16/config/extensions.conf`

- **Rôle :** Définit ce qu'Asterisk fait quand quelqu'un compose un numéro
- **Logique principale :** Dial(SIP/EXTEN, 20) → si pas de réponse → VoiceMail → Hangup
- **Alarme incendie :** `*99` → `Originate` sur les 10 postes en parallèle (flag `async`) → contexte `[alarme]` → `SendText(Alarme incendie)` sur chaque écran
- **Notification visiteur :** `*9812001` → `Originate` sur le poste `${EXTEN:4}` = `2001` → contexte `[visiteur]` → `SendText(Votre contact est arrive)` sur l'écran de la chambre
- **Phrase orale :** "C'est le dialplan. Il gère 3 cas : les appels normaux (voicemail si pas de réponse), l'alarme incendie qui sonne tous les postes en même temps via `Originate async`, et la notification visiteur qui affiche un message sur l'écran de la chambre concernée."

---

### `Asterisk16/config/voicemail.conf`

- **Rôle :** Configure la messagerie vocale (formats audio, boîtes vocales, script externe)
- **Ligne clé :** `externnotify=/bin/sh /etc/asterisk/scripts/voicemail_notify.sh`
- **Phrase orale :** "La ligne `externnotify` dit à Asterisk d'appeler notre script shell après chaque message vocal. C'est le déclencheur de toute la chaîne e-mail."

---

### `Asterisk16/config/scripts/voicemail_notify.sh`

- **Reçoit :** Extension (mailbox), contexte, nombre de nouveaux messages
- **Fait :** Envoie un POST HTTP à l'API PHP via Python3
- **Phrase orale :** "Ce script est le pont entre Asterisk et notre API PHP. On utilise Python3 car curl pose des problèmes d'initialisation dans les sous-processus Asterisk."

---

## PARTIE 3 — Docker simplement expliqué

### Qu'est-ce que Docker ?

Docker permet de faire tourner plusieurs services (PHP, MySQL, nginx...) dans des environnements isolés appelés **containers**, sur un seul PC.

**Sans Docker :** Il faudrait installer PHP, MySQL, nginx, Asterisk, FreeRADIUS sur chaque machine. C'est long et risque de casser d'autres projets.

**Avec Docker :** Une seule commande lance tout. Les services ne se mélangent pas.

---

### Vocabulaire Docker

**Container :** Un service qui tourne de façon isolée. Comme une "mini machine virtuelle" légère.
> Exemple : `maison_php` est un container qui fait tourner PHP.

**Image :** Le modèle à partir duquel on crée un container. C'est comme un blueprint.
> Exemple : `mysql:8.0` est l'image officielle de MySQL version 8.

**Volume :** Un dossier partagé entre le PC et un container. Les données survivent au redémarrage.
> Exemple : `mysql_data:/var/lib/mysql` = les données MySQL sont sur le PC, pas dans le container.

**Port exposé :** Un container "ouvre" un port pour qu'on puisse y accéder depuis l'extérieur.
> Exemple : `"80:80"` = le port 80 du container est accessible via le port 80 du PC → `http://localhost`

**Réseau interne :** Les containers communiquent entre eux via un réseau Docker nommé `hotel-net`. PHP accède à MySQL en utilisant `mysql` comme hostname (pas `localhost`).

---

### Pourquoi `.env` avec Docker ?

Le fichier `.env` contient les secrets (mots de passe, clés API). Docker lit ce fichier et l'injecte dans les containers comme variables d'environnement. Ainsi :
- Les secrets ne sont pas dans le code
- On peut changer un mot de passe sans toucher au code
- Chaque environnement (dev, prod) peut avoir ses propres valeurs

---

### Les 10 commandes Docker à connaître

```bash
# 1. Voir les containers qui tournent
docker ps

# 2. Lancer tous les services
docker compose up -d

# 3. Arrêter tous les services (SANS supprimer les données)
docker compose stop

# 4. Arrêter ET supprimer les containers (données conservées car volumes séparés)
docker compose down

# 5. Redémarrer un service spécifique
docker compose restart php
docker compose restart asterisk
docker compose restart freeradius

# 6. Voir les logs d'un service
docker compose logs php --tail 50
docker compose logs asterisk --tail 30

# 7. Entrer dans un container (shell bash)
docker exec -it maison_php bash

# 8. Entrer dans un container (shell sh, si bash n'existe pas)
docker exec -it maison_asterisk sh

# 9. Exécuter une commande dans un container sans entrer dedans
docker exec maison_asterisk asterisk -rx "sip show peers"

# 10. Vérifier que l'API répond
curl http://localhost/api/health
```

---

### Comment les services communiquent

```
Navigateur client
    ↓ port 80/443
nginx (maison_nginx)
    ↓ /api/* → PHP-FPM
PHP (maison_php)
    ↓ mysql:3306
MySQL (maison_mysql)

Téléphone SIP
    ↓ port 5060/UDP
Asterisk (maison_asterisk) — mode host réseau
    ↓ voicemail_notify.sh → HTTP
nginx → PHP

Borne EAP330
    ↓ UDP 18120
Relay PowerShell (sur le PC Windows)
    ↓ → 127.0.0.1:1812
FreeRADIUS (maison_freeradius)
```

---

## PARTIE 4 — Flux Frontend → Backend → Base

### Schéma général

```
Utilisateur clique sur "Réserver"
    ↓
Page React (RoomDetailPage.tsx)
    ↓ appel fonction createBooking()
api.ts
    ↓ POST /api/bookings + token JWT
nginx (proxy)
    ↓
index.php (routeur)
    ↓
BookingController::store()
    ↓ vérifie JWT, valide dates, cherche chambre libre
MySQL (tables bookings, physical_rooms)
    ↓ retourne la chambre attribuée
BookingController → MailService → Gmail
    ↓ retourne JSON {success: true, data: {id, room_number, ...}}
api.ts reçoit la réponse
    ↓
Page React affiche la confirmation
```

### Exemple : Création de compte

```
Formulaire d'inscription rempli
    ↓ apiRegister(first_name, last_name, email, password) dans api.ts
    ↓ POST /api/auth/register
AuthController::register()
    ↓ vérifie champs requis, format email, mot de passe >= 6 chars
    ↓ vérifie que l'email n'existe pas déjà
User::create() → INSERT INTO users (avec bcrypt du mot de passe)
    ↓
MailService::send() → e-mail de bienvenue
    ↓
Response::success([token, user]) → JSON
Frontend stocke le token dans localStorage
Utilisateur est connecté
```

### Exemple : Voicemail

```
Appel entrant sur chambre 201 (extension 2001)
    ↓ personne ne répond après 20s
Asterisk → VoiceMail(2001@hotel,u)
Asterisk enregistre le .wav
    ↓
Asterisk appelle externnotify → voicemail_notify.sh
Script Python3 → POST http://nginx/api/voicemail-notify
    ↓
VoicemailController::notify()
    ↓ physical_rooms WHERE phone_extension = '2001' → chambre 201
    ↓ bookings WHERE physical_room_id = X AND check_in <= TODAY AND check_out > TODAY
    ↓ users WHERE id = booking.user_id → email client
    ↓ findAudioFile() → /var/spool/asterisk/voicemail/hotel/2001/INBOX/msg0000.wav
MailService::sendWithAttachment() → Gmail avec .wav joint
    ↓
voicemail.log écrit une ligne
```

---

## PARTIE 5 — Comment ajouter une nouvelle page frontend

**Exemple : je veux ajouter une page "Aide"**

### Étape 1 : Créer le fichier de la page

Créer `maison-saclay/src/pages/HelpPage.tsx` :

```tsx
// HelpPage.tsx — Page d'aide accessible à tous les clients

export function HelpPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif mb-8">Aide</h1>
      <p className="text-gray-600">
        Pour toute question, contactez la réception au 1099.
      </p>
    </div>
  );
}
```

### Étape 2 : Ajouter la route dans `App.tsx`

Ouvrir `maison-saclay/src/App.tsx` et ajouter la route :

```tsx
import { HelpPage } from "@/pages/HelpPage";

// Dans le bloc <Routes> :
<Route path="/aide" element={<HelpPage />} />
```

### Étape 3 : Ajouter un lien dans le menu (si besoin)

Dans le composant Navigation, ajouter :
```tsx
<Link to="/aide">Aide</Link>
```

### Étape 4 : Appeler l'API (si la page a besoin de données)

```tsx
import { fetchRooms } from "@/services/api";
import { useEffect, useState } from "react";

export function HelpPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchRooms().then(setData);
  }, []);

  // afficher data...
}
```

### Étape 5 : Rebuilder le frontend

```bash
cd maison-saclay
npm run build
```

**Pourquoi ?** React compile tout le code en fichiers JS/CSS dans `dist/`. Sans rebuild, les changements ne sont pas visibles.

### Étape 6 : Vérifier dans le navigateur

Ouvrir `http://localhost/aide` — la page doit s'afficher.

---

## PARTIE 6 — Comment ajouter une image

### Où mettre l'image

Mettre l'image dans `maison-saclay/src/assets/` :
```
maison-saclay/src/assets/
├── hero-hotel.jpg
├── chambre-deluxe.jpg
└── ma-nouvelle-image.jpg   ← ici
```

### Comment l'utiliser dans une page

```tsx
// Méthode 1 : import direct (recommandé — Vite gère le chemin)
import monImage from "@/assets/ma-nouvelle-image.jpg";

export function MaPage() {
  return (
    <img
      src={monImage}
      alt="Description de l'image"
      className="w-full h-64 object-cover"
    />
  );
}
```

```tsx
// Méthode 2 : chemin public (pour des images dans /public/)
<img src="/images/ma-nouvelle-image.jpg" alt="..." />
```

### Comment éviter les chemins cassés

- Toujours utiliser `import` avec `@/assets/` → Vite s'occupe du chemin au build
- Ne jamais écrire des chemins absolus comme `/var/www/...`
- Après le build, vérifier que l'image apparaît dans `dist/assets/`

---

## PARTIE 7 — Comment ajouter une route API backend

**Exemple : créer `GET /api/hello` qui renvoie `{"message": "Bonjour"}`**

### Étape 1 : Ajouter la route dans `index.php`

```php
// Dans backend/public/index.php, ajouter :
$router->get('/hello', function() {
    \App\Core\Response::success(['message' => 'Bonjour']);
});
```

### Étape 2 : Ou créer un controller dédié

```php
// Créer backend/src/Controllers/HelloController.php
namespace App\Controllers;

use App\Core\Response;

class HelloController
{
    public function hello(): void
    {
        // Ici on peut valider des données, appeler la DB, etc.
        Response::success(['message' => 'Bonjour']);
    }
}
```

Puis dans `index.php` :
```php
use App\Controllers\HelloController;
$router->get('/hello', fn() => (new HelloController())->hello());
```

### Étape 3 : Tester avec curl

```bash
curl http://localhost/api/hello
# Réponse : {"success":true,"data":{"message":"Bonjour"}}
```

### Les 4 méthodes HTTP

| Méthode | Usage | Exemple |
|---|---|---|
| `GET` | Récupérer des données | Lister les chambres |
| `POST` | Créer quelque chose | Créer une réservation |
| `PUT` | Modifier quelque chose | Changer un e-mail |
| `DELETE` | Supprimer quelque chose | Annuler une commande |

### Lire les données reçues (dans un controller)

```php
// Lire le corps JSON d'une requête POST ou PUT
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$email = $body['email'] ?? '';

// Lire les paramètres d'URL (ex: /bookings/:id)
public function show(array $params): void {
    $id = (int) ($params['id'] ?? 0);
}
```

### Renvoyer une réponse

```php
Response::success(['key' => 'value']);           // HTTP 200
Response::success(['key' => 'value'], 'Message', 201); // HTTP 201
Response::error('Message d erreur');              // HTTP 400
Response::error('Non autorisé', 401);             // HTTP 401
Response::error('Introuvable', 404);              // HTTP 404
```

---

## PARTIE 8 — Comment ajouter une table SQL

**Exemple : créer une table `notifications`**

### Étape 1 : Écrire le SQL

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    message    TEXT NOT NULL,
    read_at    DATETIME NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Étape 2 : Exécuter dans MySQL

```bash
# Option 1 : via phpMyAdmin → http://localhost:8080
# Aller dans la base maison_saclay → onglet SQL → coller et exécuter

# Option 2 : via ligne de commande
docker exec maison_mysql mysql -u saclay_user -psaclay_pass maison_saclay -e "
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
"

# Vérifier que la table existe
docker exec maison_mysql mysql -u saclay_user -psaclay_pass maison_saclay -e "SHOW TABLES;"
```

### Étape 3 : Créer le Model PHP

```php
// backend/src/Models/Notification.php
namespace App\Models;
use App\Config\Database;

class Notification
{
    public function create(int $userId, string $message): int
    {
        $db   = Database::getInstance();
        $stmt = $db->prepare(
            'INSERT INTO notifications (user_id, message) VALUES (:user_id, :message)'
        );
        $stmt->execute(['user_id' => $userId, 'message' => $message]);
        return (int) $db->lastInsertId();
    }

    public function findByUser(int $userId): array
    {
        $db   = Database::getInstance();
        $stmt = $db->prepare('SELECT * FROM notifications WHERE user_id = :id ORDER BY created_at DESC');
        $stmt->execute(['id' => $userId]);
        return $stmt->fetchAll();
    }
}
```

### Règle importante

**Ne jamais modifier `schema.sql` après que la base est créée.**
Le fichier `schema.sql` n'est exécuté qu'au premier démarrage du container MySQL (quand le volume est vide). Pour ajouter une table sur une base existante : exécuter le SQL directement via `docker exec` ou phpMyAdmin.

---

## PARTIE 9 — Comment modifier une fonctionnalité sans casser

**Exemple : modifier le texte de l'e-mail de réservation**

### Étape 1 : Trouver le bon fichier

E-mail de réservation → `backend/src/Controllers/BookingController.php`

### Étape 2 : Lire la fonction avant de toucher quoi que ce soit

```php
// Dans BookingController::store()
// Chercher : "Email de confirmation au client"
$bodyClient = "Bonjour {$clientName},\n\n..."
MailService::send($clientEmail, "Confirmation de votre réservation #{$id}", $bodyClient);
```

### Étape 3 : Ne changer que le texte

```php
// AVANT
$bodyClient = "Bonjour {$clientName},\n\nVotre réservation a bien été enregistrée.\n\n";

// APRÈS (modification simple du texte)
$bodyClient = "Bonjour {$clientName},\n\nNous sommes ravis de vous accueillir bientôt.\n\n";
```

### Ce qu'il ne faut PAS changer

- Les noms de variables (`$clientEmail`, `$bodyClient`)
- Le nom de la route (`/api/bookings`)
- Les noms des champs en base (`check_in`, `check_out`, `total_price`)
- La logique de validation des dates
- L'appel à Telegram (sinon l'admin ne reçoit plus les notifications)

### Étape 4 : Tester

```bash
# 1. Créer une réservation sur le site
# 2. Vérifier le mail reçu
# 3. Vérifier les logs
docker exec maison_php tail -5 /var/www/backend/logs/mail.log
# → doit afficher "OK | to=... | subject=..."
```

### Checklist avant de considérer la modification terminée

- [ ] Fichier sauvegardé
- [ ] La route fonctionne toujours (`curl http://localhost/api/health`)
- [ ] Le mail est reçu avec le bon texte
- [ ] Les logs n'affichent pas d'erreur
- [ ] Le frontend affiche toujours le bon résultat
- [ ] Pas de `Parse error` PHP (vérifier les logs Docker)

```bash
# Vérifier les erreurs PHP
docker compose logs php --tail 20
```

---

## PARTIE 10 — Comment tester les fonctionnalités principales

### Tester que l'API répond

```bash
curl http://localhost/api/health
# Doit retourner : {"success":true,"data":{"status":"ok","service":"Maison Saclay API"}}
```

### Tester les e-mails (route admin)

```bash
# 1. Se connecter comme admin et récupérer le token
curl -s -X POST http://localhost/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"VOTRE_ADMIN_PASSWORD"}'

# 2. Utiliser le token pour envoyer un mail de test
curl -s -X POST http://localhost/api/admin/mail-test \
  -H "Authorization: Bearer TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -d '{"to":"votre@email.com"}'

# 3. Vérifier les logs
docker exec maison_php tail -5 /var/www/backend/logs/mail.log
```

### Tester Asterisk

```bash
# Voir les postes SIP enregistrés
docker exec maison_asterisk asterisk -rx "sip show peers"
# → doit afficher les extensions 1001, 2001, etc. avec "OK"

# Voir les boîtes vocales
docker exec maison_asterisk asterisk -rx "voicemail show users"

# Voir les logs de notification voicemail
docker exec maison_asterisk cat /tmp/vm_debug.log
```

### Tester le portail captif Wi-Fi

```bash
# Vérifier que FreeRADIUS tourne
docker compose ps freeradius

# Voir les dernières authentifications
docker compose logs freeradius --tail 20

# Vérifier que le relay UDP écoute
netstat -an | findstr 18120
# → doit afficher UDP 0.0.0.0:18120
```

### Tester la base de données

```bash
# Accès via phpMyAdmin : http://localhost:8080
# Utilisateur : saclay_user / Mot de passe : saclay_pass

# Ou via ligne de commande :
docker exec maison_mysql mysql -u saclay_user -psaclay_pass maison_saclay \
  -e "SELECT * FROM bookings ORDER BY id DESC LIMIT 5;"
```

---

## PARTIE 11 — Procédure en cas de problème

### Le site ne répond plus

```bash
# 1. Vérifier les containers
docker ps
# Si un container est "Exited" ou "Restarting" :
docker compose restart

# 2. Regarder les erreurs
docker compose logs nginx --tail 20
docker compose logs php --tail 20
```

### Un e-mail n'arrive pas

```bash
# 1. Vérifier les logs
docker exec maison_php cat /var/www/backend/logs/mail.log

# Si la ligne dit "IGNORE (SMTP non configure)" :
# → Vérifier SMTP_USER et SMTP_PASSWORD dans .env
# → Redémarrer PHP : docker compose restart php

# Si la ligne dit "Connexion echouee" :
# → Problème réseau ou mot de passe Gmail incorrect
```

### Le voicemail ne déclenche pas d'e-mail

```bash
# 1. Vérifier que le script a été appelé
docker exec maison_asterisk cat /tmp/vm_debug.log

# 2. Vérifier la réponse de l'API
docker exec maison_asterisk cat /tmp/vm_notify.log

# 3. Vérifier les logs voicemail PHP
docker exec maison_php cat /var/www/backend/logs/voicemail.log
```

### Les téléphones SIP ne s'enregistrent plus

```bash
# Vérifier les peers
docker exec maison_asterisk asterisk -rx "sip show peers"

# Regarder les logs Asterisk
docker compose logs asterisk --tail 30

# Redémarrer Asterisk
docker compose restart asterisk
```

---

*Document créé le 29 juin 2026 — Guide pratique Maison Saclay*
