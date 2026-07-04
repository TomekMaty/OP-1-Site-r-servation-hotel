# Documentation Soutenance — Maison Saclay
## Hôtel 5 étoiles — Projet complet

---

## CE QU'ON A FAIT EN 10 LIGNES

1. Un site web complet pour un hôtel (React + PHP + MySQL dans Docker).
2. Un système de réservation de chambre en ligne avec attribution automatique.
3. Un room service (commande de repas depuis la chambre).
4. Un portail captif Wi-Fi : les clients s'authentifient par numéro de chambre.
5. Une téléphonie IP interne avec Asterisk (extensions par chambre).
6. Un système de messagerie vocale : si personne ne répond, l'appel part en boîte vocale.
7. Les messages vocaux déclenchent un e-mail automatique au bon client (avec le fichier audio joint).
8. Un système d'e-mails automatiques pour toutes les actions (inscription, réservation, commande, voicemail).
9. Un tableau de bord admin React avec notifications Telegram en temps réel.
10. Tout tourne dans Docker : 8 services lancés en une commande.

---

## TABLE DES MATIÈRES

1. [Présentation générale](#1-présentation-générale)
2. [Architecture générale](#2-architecture-générale)
3. [Docker](#3-docker)
4. [Frontend React](#4-frontend-react)
5. [Backend PHP](#5-backend-php)
6. [Base de données](#6-base-de-données)
7. [Réservations](#7-réservations)
8. [Commandes — Room Service](#8-commandes--room-service)
9. [Système d'e-mails automatiques](#9-système-de-mails-automatiques)
10. [Modal e-mail pour anciens comptes](#10-modal-e-mail-pour-anciens-comptes)
11. [Asterisk — Téléphonie IP](#11-asterisk--téléphonie-ip)
12. [Voicemail → E-mail avec audio](#12-voicemail--e-mail-avec-audio)
13. [Portail captif Wi-Fi](#13-portail-captif-wi-fi)
14. [Problème portail captif corrigé](#14-problème-portail-captif-corrigé)
15. [Authentification et sécurité](#15-authentification-et-sécurité)
16. [Bot Telegram](#16-bot-telegram)
17. [Logs utiles](#17-logs-utiles)
18. [Procédure de démonstration](#18-procédure-de-démonstration)
19. [Questions du professeur + réponses](#19-questions-du-professeur--réponses)
20. [Limites et améliorations futures](#20-limites-et-améliorations-futures)

---

## 1. Présentation générale

### Qu'est-ce que ce projet ?

C'est une plateforme complète de gestion d'un hôtel 5 étoiles fictif nommé **Maison Saclay**.

Le projet couvre tout ce qu'un client peut faire dans un hôtel :
- Créer un compte client en ligne
- Réserver une chambre (Deluxe, Suite, Penthouse)
- Commander un service en chambre (room service)
- Se connecter au Wi-Fi via un portail captif
- Utiliser un téléphone IP interne
- Recevoir des e-mails automatiques pour chaque action

Et ce que l'hôtel peut gérer :
- Voir toutes les réservations et les confirmer / annuler
- Voir toutes les commandes et les mettre à jour
- Voir les connexions Wi-Fi des clients
- Recevoir des notifications Telegram en temps réel
- Recevoir les messages vocaux des clients par e-mail

### Phrase orale

> "Notre projet est une plateforme complète pour un hôtel. Les clients peuvent créer un compte, réserver une chambre, commander un service, se connecter au Wi-Fi via portail captif, utiliser la téléphonie interne, et recevoir des notifications par e-mail. L'hôtel gère tout depuis un tableau de bord admin."

---

## 2. Architecture générale

### Schéma texte

```
CLIENT (navigateur)
    ↓ HTTP/JSON
Frontend React (maison-saclay/)
    ↓ /api/*
Nginx (container Docker)
    ↓ proxy_pass
Backend PHP (backend/)
    ↓ PDO
MySQL (base de données)

─────────────────────────────────

Téléphone IP (SIP)
    ↓ port 5060
Asterisk 16 (container Docker)
    ↓ si pas de réponse
voicemail_notify.sh
    ↓ HTTP POST
API PHP /voicemail-notify
    ↓
VoicemailController.php
    ↓
E-mail client (avec audio joint)

─────────────────────────────────

Client Wi-Fi (téléphone)
    ↓ portail captif EAP330
Borne TP-Link EAP330
    ↓ RADIUS UDP → 192.168.30.x:18120
Relay UDP (PowerShell / Python)
    ↓ → 127.0.0.1:1812
FreeRADIUS (container Docker)
    ↓
Access-Accept → Internet autorisé
Access-Reject → Internet bloqué
```

### Les 8 containers Docker

| Container | Rôle |
|---|---|
| `maison_mysql` | Base de données MySQL (toutes les données) |
| `maison_php` | Backend PHP (API REST) |
| `maison_nginx` | Serveur web + reverse proxy vers PHP |
| `maison_phpmyadmin` | Interface web base de données (localhost:8080) |
| `maison_freeradius` | Authentification Wi-Fi RADIUS |
| `maison_asterisk` | Téléphonie IP (Asterisk 16) |
| `maison_worker` | Worker Telegram (boutons Confirmer/Refuser) |
| `maison_portail` | Ancien portail captif (conservé) |

---

## 3. Docker

### Pourquoi Docker ?

Docker permet de faire tourner tous les services en une seule commande, sur n'importe quelle machine, sans installer PHP, MySQL, FreeRADIUS ou Asterisk manuellement. Chaque service est isolé dans son container.

**Fichier principal :** `docker-compose.yml`

### Commandes à connaître

```bash
# Voir si tous les containers tournent
docker ps
# ou
docker compose ps

# Démarrer tous les services
docker compose up -d

# Redémarrer un service
docker compose restart php

# Voir les logs d'un service
docker compose logs php --tail 50
docker compose logs asterisk --tail 50
docker compose logs freeradius --tail 30

# Entrer dans un container
docker exec -it maison_php bash
docker exec -it maison_asterisk bash

# Console Asterisk (pour voir les appels en direct)
docker exec -it maison_asterisk asterisk -rvvv

# Voir les peers SIP enregistrés
docker exec maison_asterisk asterisk -rx "sip show peers"
```

### Volumes Docker (données persistantes)

Les données MySQL sont dans un volume Docker. Même si les containers s'arrêtent, les données restent.
**Ne jamais faire `docker compose down -v`** → ça supprimerait toutes les données.

### Phrase orale

> "Docker nous permet d'isoler chaque service et de relancer facilement l'environnement. Toute l'infrastructure — PHP, MySQL, nginx, FreeRADIUS, Asterisk — se lance en une seule commande. Les données MySQL sont dans un volume persistant."

---

## 4. Frontend React

### Rôle

Interface utilisateur du site hôtel. Pages publiques pour les clients + tableau de bord admin complet.

**Dossier :** `maison-saclay/`
**Technologie :** React + TypeScript + Tailwind CSS

### Pages disponibles

| URL | Page |
|---|---|
| `/` | Accueil |
| `/chambres` | Catalogue des types de chambres |
| `/chambres/:slug` | Détail + formulaire de réservation |
| `/confirmation` | Confirmation après réservation |
| `/restaurant` | Menu et room service |
| `/connexion` | Login / inscription client |
| `/mon-espace` | Espace client (mes réservations, mes commandes, mon profil) |
| `/admin` | Tableau de bord admin (protégé par mot de passe) |

### Fichiers principaux

- `maison-saclay/src/App.tsx` — routeur principal (react-router)
- `maison-saclay/src/pages/AdminPage.tsx` — tableau de bord admin
- `maison-saclay/src/services/api.ts` — tous les appels vers le backend
- `maison-saclay/src/lib/auth.tsx` — contexte d'authentification (AuthProvider)
- `maison-saclay/src/components/EmailModal.tsx` — modal e-mail anciens comptes

### Comment ça fonctionne

1. Le client ouvre le site → `App.tsx` charge la bonne page selon l'URL.
2. Le frontend appelle `api.ts` pour chaque action (réservation, commande...).
3. `api.ts` ajoute automatiquement le token JWT dans le header `Authorization`.
4. Le backend répond en JSON → React met à jour l'affichage.

### Le build React

Après chaque modification du frontend, il faut rebuilder :
```bash
cd maison-saclay
npm run build
```
Le build génère `dist/` → copié dans le container nginx pour être servi.

**Important :** Si on modifie un composant React mais qu'on ne rebuild pas, les utilisateurs voient l'ancienne version. C'est pour ça qu'on a dû rebuilder après avoir ajouté le composant EmailModal.

### Phrase orale

> "Le frontend est une SPA React. Il communique avec le backend PHP via une API REST. Le build de production est servi par nginx dans Docker. Toutes les requêtes API incluent automatiquement le token JWT."

---

## 5. Backend PHP

### Rôle

API REST : reçoit les requêtes du frontend, les valide, communique avec MySQL, retourne du JSON.

**Dossier :** `backend/`
**Technologie :** PHP 8.2 sans framework (architecture MVC légère)

### Architecture

```
Requête HTTP
    ↓
backend/public/index.php  (routeur + autoloader)
    ↓
Controller (AuthController, BookingController, etc.)
    ↓
Model (User, Booking, etc.)
    ↓
MySQL via PDO
    ↓
Response::success() ou Response::error()
    ↓
JSON au frontend
```

### Fichiers principaux

| Fichier | Rôle |
|---|---|
| `backend/public/index.php` | Point d'entrée unique, routeur, chargement .env |
| `backend/src/Core/Router.php` | Classe qui gère les routes GET/POST/PUT |
| `backend/src/Core/MailService.php` | Service centralisé d'envoi d'e-mails |
| `backend/src/Core/JWT.php` | Génération et vérification des tokens JWT |
| `backend/src/Core/Database.php` | Connexion MySQL singleton PDO |
| `backend/src/Core/AdminMiddleware.php` | Protection des routes admin |
| `backend/src/Core/Response.php` | Normalisation des réponses JSON |
| `backend/src/Controllers/AuthController.php` | Inscription, connexion client et admin |
| `backend/src/Controllers/BookingController.php` | Réservations |
| `backend/src/Controllers/OrderController.php` | Commandes room service |
| `backend/src/Controllers/MeController.php` | Espace client (profil, réservations, commandes) |
| `backend/src/Controllers/VoicemailController.php` | Réception et traitement des notifications Asterisk |
| `backend/src/Controllers/WifiController.php` | Données portail captif Wi-Fi |
| `backend/src/Controllers/TelegramController.php` | Bot Telegram |

### Routes API disponibles

```
GET  /api/rooms                  → liste des types de chambres
GET  /api/rooms/:slug            → détail d'un type de chambre
POST /api/bookings               → créer une réservation (client connecté)
GET  /api/bookings               → liste toutes les réservations (admin)
POST /api/bookings/:id/status    → changer le statut (admin)
POST /api/orders                 → créer une commande (client connecté)
GET  /api/orders                 → liste toutes les commandes (admin)
POST /api/orders/:id/status      → changer le statut (admin)
POST /api/auth/register          → créer un compte client
POST /api/auth/login             → connexion client → JWT
POST /api/auth/admin/login       → connexion admin → JWT admin
GET  /api/me                     → profil du client connecté
GET  /api/me/bookings            → mes réservations
GET  /api/me/orders              → mes commandes
PUT  /api/me/email               → mettre à jour son e-mail
POST /api/admin/mail-test        → envoyer un e-mail de test (admin)
POST /api/voicemail-notify       → notification Asterisk (voicemail)
GET  /api/health                 → vérifier que l'API répond
```

### Phrase orale

> "Le backend reçoit les requêtes du frontend, vérifie les données, communique avec la base et déclenche les actions comme les réservations, commandes ou mails. Toutes les réponses sont en JSON avec un champ `success: true` ou `false`."

---

## 6. Base de données

### Rôle

MySQL stocke toutes les données persistantes du projet.

**Fichiers SQL :**
- `sql/schema.sql` — structure des tables
- `sql/seed.sql` — données initiales (chambres, menu)
- `sql/03-physical-rooms.sql` — chambres physiques avec extensions téléphone
- `sql/05-wifi-radius-sessions.sql` — sessions Wi-Fi RADIUS
- `sql/06-wifi-activity-logs.sql` — activité réseau

### Tables principales

| Table | Contenu |
|---|---|
| `users` | Comptes clients (email + hash bcrypt du mot de passe) |
| `rooms` | Types de chambres (Deluxe, Suite, Penthouse) |
| `physical_rooms` | Chambres physiques réelles (101-103, 201-203, 601-603) + extension téléphone |
| `bookings` | Réservations (qui, quelle chambre, quelles dates, quel prix) |
| `orders` | Commandes room service |
| `order_items` | Lignes d'une commande (article + quantité + prix) |
| `menu_items` | Carte du restaurant |
| `wifi_radius_sessions` | Connexions Wi-Fi via FreeRADIUS |
| `wifi_radius_activity_logs` | Activité réseau DNS (démo) |

### La table `physical_rooms` — clé du système voicemail

C'est la table qui fait le lien entre l'extension téléphonique Asterisk et le numéro de chambre :

```sql
-- Exemples de données
room_number | phone_extension | room_id
101         | 1001            | 1  (Deluxe)
201         | 2001            | 2  (Suite)
601         | 6001            | 3  (Penthouse)
```

**Logique :** quand Asterisk nous dit "extension 2001 a reçu un appel", on cherche dans `physical_rooms` → on trouve chambre 201 → on cherche dans `bookings` la réservation active pour la chambre 201 → on trouve le client → on lui envoie l'e-mail.

### Connexion base sécurisée

La connexion est un singleton PDO. Les identifiants viennent du `.env` (jamais dans le code).
Toutes les requêtes utilisent des paramètres bindés → protection contre les injections SQL.

### Phrase orale

> "La base MySQL contient les réservations, clients, chambres et commandes. La table `physical_rooms` est cruciale : elle fait le lien entre une extension téléphonique Asterisk et un numéro de chambre. C'est grâce à elle qu'on sait quel client appeler quand un message vocal arrive."

---

## 7. Réservations

### Flux complet

1. Le client choisit un type de chambre et des dates sur le site React.
2. Le frontend envoie `POST /api/bookings` avec le token JWT.
3. `BookingController::store()` :
   - Vérifie que le départ est après l'arrivée.
   - Cherche une chambre physique disponible (SQL avec conditions de chevauchement de dates).
   - Calcule le prix : nombre de nuits × prix par nuit.
   - Insère la réservation avec statut "pending".
   - Envoie un e-mail de confirmation au client.
   - Envoie un e-mail de notification à la réception.
   - Envoie une notification Telegram à l'admin (avec boutons Confirmer/Annuler).
4. La page de confirmation affiche le numéro de chambre attribué.

### Fichiers

- `backend/src/Controllers/BookingController.php`
- `maison-saclay/src/pages/` → page réservation

### Comment tester

1. Aller sur le site → choisir une chambre → remplir le formulaire.
2. Vérifier en base : `SELECT * FROM bookings ORDER BY id DESC LIMIT 1;`
3. Vérifier e-mail client reçu.
4. Vérifier e-mail réception reçu.
5. Vérifier notification Telegram.

### Phrase orale

> "Quand un client réserve, le système trouve automatiquement une chambre physique libre en excluant les réservations qui chevauchent les mêmes dates. Il calcule le prix, enregistre en base, et envoie automatiquement une confirmation au client et à la réception."

---

## 8. Commandes — Room Service

### Flux complet

1. Le client ouvre `/restaurant` → menu s'affiche.
2. Il sélectionne des articles et valide la commande.
3. `OrderController::store()` :
   - Récupère la réservation active du client pour trouver son numéro de chambre (automatique).
   - Calcule le total.
   - Insère la commande avec statut "pending".
   - Envoie un e-mail de confirmation au client.
   - Envoie un e-mail de notification à la réception.
   - Envoie une notification Telegram à l'admin.
4. L'admin met à jour le statut : pending → preparing → delivered.

### Fichier

- `backend/src/Controllers/OrderController.php`

### Comment tester

1. Se connecter en tant que client avec une réservation active.
2. Aller sur `/restaurant` → commander.
3. Vérifier en base : `SELECT * FROM orders ORDER BY id DESC LIMIT 1;`
4. Vérifier e-mail client et réception.
5. Vérifier logs : `backend/logs/mail.log`

### Phrase orale

> "Le client commande depuis son téléphone dans la chambre. Le système retrouve automatiquement son numéro de chambre depuis sa réservation active, calcule le total et notifie l'admin."

---

## 9. Système d'e-mails automatiques

### Rôle

Envoyer automatiquement des e-mails à chaque événement important : inscription, réservation, commande, voicemail.

**Fichier central :** `backend/src/Core/MailService.php`

### Comment l'utiliser (dans le code PHP)

```php
// Envoyer un e-mail simple
MailService::send($email, "Sujet", "Corps du message");

// Envoyer un e-mail avec pièce jointe
MailService::sendWithAttachment($email, "Sujet", "Corps", $filePath, $fileName);
```

Si SMTP n'est pas configuré : l'e-mail est ignoré, le site continue de fonctionner normalement.

### Protocole SMTP (implémenté manuellement, sans bibliothèque externe)

1. Connexion TCP vers `smtp.gmail.com:587`
2. EHLO + commande `STARTTLS` → chiffrement TLS activé
3. Authentification `AUTH LOGIN` (base64)
4. Envoi des headers MIME + corps du message
5. `QUIT` → fermeture propre

### Configuration dans `.env`

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@gmail.com
SMTP_PASSWORD=mot_de_passe_application_gmail
SMTP_FROM=noreply@maison-saclay.fr
ADMIN_EMAIL=reception@maison-saclay.fr
```

**Important :** Les identifiants SMTP ne sont jamais dans le code source. Ils sont dans `.env` qui n'est pas versionné (pas dans Git). C'est une bonne pratique de sécurité.

### Les 5 types d'e-mails envoyés

| Événement | Destinataire | Sujet |
|---|---|---|
| Inscription | Client | "Bienvenue sur le portail Maison Saclay" |
| Nouvelle réservation | Client | "Confirmation de votre réservation #X" |
| Nouvelle réservation | Réception | "Nouvelle réservation — Chambre #X" |
| Nouvelle commande | Client | "Confirmation de votre commande #X" |
| Nouvelle commande | Réception | "Nouvelle commande — Chambre #X" |
| Message vocal | Client ou réception | "Vous avez un message vocal — Chambre 201" |

### Logs mail

Chaque envoi est loggué dans `backend/logs/mail.log` :
```
2026-06-29 17:20:05 | OK   | to=client@gmail.com | subject=Vous avez un message vocal — Chambre 201
2026-06-29 17:20:06 | OK   | to=reception@hotel.fr | subject=Chambre 201 n a pas repondu
```

### Test admin (pour vérifier que SMTP marche)

```bash
curl -s -X POST http://localhost/api/admin/mail-test \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@gmail.com"}'
```

Retourne `{"success":true,"message":"Email envoye"}` si tout marche.

### Phrase orale

> "Tous les e-mails passent par un service centralisé MailService.php. Cela évite de répéter le code et permet de changer la configuration SMTP dans `.env` sans modifier l'application. On a implémenté le protocole SMTP directement en PHP, sans bibliothèque externe."

---

## 10. Modal e-mail pour anciens comptes

### Pourquoi elle existe

Certains comptes créés avant qu'on ajoute le système d'e-mails n'avaient pas d'adresse e-mail enregistrée. Sans e-mail, ils ne reçoivent aucune notification (réservation, commande, voicemail).

### Comment elle fonctionne

1. Après connexion, le frontend vérifie si `user.email` est vide.
2. Si oui → la modal s'affiche automatiquement.
3. Bouton **Enregistrer** → appelle `PUT /api/me/email` → ferme la modal → l'e-mail est sauvé.
4. Bouton **Plus tard** → ferme la modal pour cette session, réapparaît à la prochaine connexion.
5. La modal ne réapparaît plus une fois l'e-mail enregistré.

### Fichiers

- `maison-saclay/src/components/EmailModal.tsx` → le composant React
- `maison-saclay/src/App.tsx` → `<EmailModal />` intégré globalement
- `backend/src/Controllers/MeController.php` → méthode `updateEmail()`

### Route backend

```
PUT /api/me/email
Authorization: Bearer <token>
Body: { "email": "nouveau@gmail.com" }
```
Le backend vérifie : format e-mail valide, unicité (pas déjà utilisé par un autre compte).

### Phrase orale

> "Pour les anciens comptes qui n'avaient pas encore d'e-mail, une fenêtre apparaît après connexion afin de récupérer l'adresse nécessaire aux notifications. Elle est non-bloquante : le bouton 'Plus tard' la ferme pour la session."

---

## 11. Asterisk — Téléphonie IP

### Rôle

Asterisk est le PABX IP de l'hôtel. Il gère toutes les communications téléphoniques internes.

**Container :** `maison_asterisk` — en mode `network_mode: host` (obligatoire pour SIP/RTP)

### Extensions téléphoniques

| Extension | Chambre / Poste |
|---|---|
| 1001 | Chambre 101 |
| 1002 | Chambre 102 |
| 1003 | Chambre 103 |
| 2001 | Chambre 201 |
| 2002 | Chambre 202 |
| 2003 | Chambre 203 |
| 6001 | Chambre 601 |
| 6002 | Chambre 602 |
| 6003 | Chambre 603 |
| 1099 | Réception |

### Fichiers de configuration

| Fichier | Rôle |
|---|---|
| `Asterisk16/config/sip.conf` | Déclaration des extensions SIP (chan_sip) |
| `Asterisk16/config/extensions.conf` | Logique des appels (dial plan) |
| `Asterisk16/config/voicemail.conf` | Configuration messagerie vocale |
| `Asterisk16/config/scripts/voicemail_notify.sh` | Script déclenché après chaque message vocal |

### Logique de l'extensions.conf

```
Si quelqu'un appelle la chambre 201 (extension 2001) :
1. Faire sonner le poste SIP pendant 20 secondes
2. Si pas de réponse → aller en boîte vocale (VoiceMail)
3. Asterisk enregistre le message
4. Asterisk appelle voicemail_notify.sh avec l'extension et le nombre de messages
```

### Alarme incendie — `*99`

La réception compose `*99`. Asterisk appelle **tous les postes simultanément** via `Originate` avec `async`.
Chaque téléphone décroche et affiche **"Alarme incendie"** (`SendText`) pendant 10 secondes.

```
exten => *99,1,Originate(SIP/1001,exten,alarme,s,1,async)
 same => n,Originate(SIP/2001,exten,alarme,s,1,async)
 ...10 postes au total...

[alarme]
exten => s,1,Answer()
 same => n,SendText(Alarme incendie)
 same => n,Wait(10)
 same => n,Hangup()
```

> **À l'oral :** "La réception compose `*99`. Asterisk déclenche 10 `Originate` en parallèle grâce au flag `async`. Tous les téléphones sonnent en même temps et affichent 'Alarme incendie' via `SendText`."

### Notification visiteur attendu — `*9811XXX`

La réception compose `*9812001` pour prévenir la chambre 201 (extension 2001).
Asterisk extrait `${EXTEN:4}` (= `2001`) et sonne ce poste qui affiche **"Votre contact est arrivé"** pendant 5 secondes.

```
exten => _*9811XXX,1,Originate(SIP/${EXTEN:4},exten,visiteur,s,1,async)

[visiteur]
exten => s,1,Answer()
 same => n,SendText(Votre contact est arrive)
 same => n,Wait(5)
 same => n,Hangup()
```

> **À l'oral :** "La réception compose `*9812001`. Asterisk extrait les 4 derniers caractères `${EXTEN:4}` pour obtenir l'extension `2001`, puis envoie un message texte à cet écran."

### Commandes utiles dans Asterisk

```bash
# Entrer dans la console Asterisk
docker exec -it maison_asterisk asterisk -rvvv

# Voir les postes SIP enregistrés
asterisk -rx "sip show peers"

# Voir les boîtes vocales
asterisk -rx "voicemail show users"

# Composer *98 depuis un téléphone pour écouter ses messages
```

### Comment tester

1. Vérifier que les postes SIP sont `Registered` : `sip show peers`
2. Appeler une chambre depuis un autre poste
3. Ne pas répondre → attendre le voicemail
4. Laisser un message
5. Vérifier les logs : `docker exec maison_asterisk cat /tmp/vm_debug.log`
6. Vérifier l'e-mail reçu

### Phrase orale

> "Asterisk gère la téléphonie interne de l'hôtel. Chaque chambre a une extension SIP. Quand un appel arrive et que personne ne répond après 20 secondes, il part en boîte vocale. Un script est automatiquement lancé par Asterisk pour notifier notre API."

---

## 12. Voicemail → E-mail avec audio

C'est l'une des fonctionnalités les plus importantes et les plus complexes du projet.

### Flux complet étape par étape

```
1. Appel vers chambre 201 (extension 2001)
2. Personne ne répond après 20 secondes
3. Asterisk enregistre le message vocal (.wav)
4. Asterisk appelle automatiquement :
   externnotify=/bin/sh /etc/asterisk/scripts/voicemail_notify.sh
5. Le script reçoit : context=hotel, mailbox=2001, new_count=1
6. Le script envoie un POST HTTP à http://nginx/api/voicemail-notify
7. VoicemailController.php reçoit la notification
8. Il cherche dans physical_rooms : extension 2001 → chambre 201
9. Il cherche dans bookings la réservation active pour la chambre 201
10. Il récupère l'e-mail du client
11. Il lit le fichier audio .wav depuis le spool Asterisk
12. Il envoie l'e-mail au client avec le .wav en pièce jointe
```

### Script voicemail_notify.sh

**Fichier :** `Asterisk16/config/scripts/voicemail_notify.sh`

Le script utilise Python3 pour faire la requête HTTP (pas curl) :
```sh
#!/bin/sh
CONTEXT="$1"
MAILBOX="$2"
NEW_COUNT="$3"
CALL_TIME="$(/usr/bin/date '+%Y-%m-%d %H:%M:%S')"

# Python3 pour éviter les problèmes OpenSSL de curl dans le sous-processus Asterisk
RESPONSE=$(/usr/bin/python3 -c "
import urllib.request, json
data = json.dumps({'mailbox':'${MAILBOX}','context':'${CONTEXT}','new_count':${NEW_COUNT},'call_time':'${CALL_TIME}'}).encode()
req = urllib.request.Request('http://nginx/api/voicemail-notify', data=data, headers={'Content-Type':'application/json'}, method='POST')
try:
    res = urllib.request.urlopen(req, timeout=10)
    print(res.read().decode())
except Exception as e:
    print('ERROR:' + str(e))
" 2>&1)
```

**Pourquoi Python3 et pas curl ?**
Curl a un bug avec OpenSSL dans les sous-processus Asterisk (`ast_safe_system()`). Python3 `urllib.request` n'utilise pas OpenSSL → aucun problème.

### VoicemailController.php — logique destinataire

| Cas | Condition | Destinataire |
|---|---|---|
| Chambre avec client | réservation active aujourd'hui | Client (email du compte) |
| Réception | extension = réception | ADMIN_EMAIL |
| Chambre vide | aucune réservation active | ADMIN_EMAIL (fallback) |
| Client sans email | compte sans email | ADMIN_EMAIL (fallback) |
| Extension inconnue | pas dans physical_rooms | ADMIN_EMAIL (fallback) |

**Principe :** on ne perd jamais un message. Le fallback garantit que la réception reçoit toujours.

### Volume Docker partagé

Le spool Asterisk est monté en lecture seule dans le container PHP :
```yaml
# Dans docker-compose.yml, service php :
volumes:
  - ./Asterisk16/config/spool:/var/spool/asterisk:ro
```

PHP lit les fichiers `.wav` mais ne peut pas les modifier (`:ro` = read-only). Asterisk continue d'écrire normalement dans ses propres fichiers.

### Logs voicemail

`backend/logs/voicemail.log` :
```
2026-06-29 17:20:05 | ext=2001 | chambre=201 | resa=oui | audio=joint | email=client@gmail.com | OK | client trouve chambre 201
2026-06-29 17:20:06 | ext=2002 | chambre=202 | resa=non | audio=- | email=reception@hotel.fr | FALLBACK | aucune reservation active pour chambre 202
```

### Problème résolu : caller ID

Le sujet de l'e-mail indique maintenant qui a appelé :
- "Chambre 201 n'a pas repondu" (envoyé à la réception)
- "Vous avez un message vocal — Chambre 101" (envoyé au client de la chambre 101)

Pour trouver l'appelant, le VoicemailController lit le fichier `.txt` du spool Asterisk :
```
callerid="Chambre 201" <2001>
```

Il parse l'extension, cherche dans `physical_rooms` → trouve le numéro de chambre.

### Phrase orale

> "Quand un message vocal est laissé, le backend retrouve automatiquement le bon destinataire grâce à l'extension et à la réservation active. Le client reçoit le message vocal en pièce jointe. Si le client n'est pas trouvé, la réception reçoit le message pour ne jamais le perdre."

---

## 13. Portail captif Wi-Fi

### Principe général

Les clients de l'hôtel doivent s'authentifier pour accéder à Internet. On utilise leur numéro de chambre comme identifiant.

### Matériel utilisé

- **Borne Wi-Fi :** TP-Link EAP330 (IP : 192.168.30.253, SSID : `OP1_Wifi`)
- **Serveur RADIUS :** FreeRADIUS dans Docker

### Flux d'authentification

```
1. Client connecte son téléphone au Wi-Fi OP1_Wifi
2. La borne EAP330 affiche le portail captif (page de login)
3. Client entre : identifiant = 201, mot de passe = 201
4. La borne envoie une requête RADIUS UDP vers 192.168.30.x:18120
5. Le relay reçoit et retransmet vers 127.0.0.1:1812 (FreeRADIUS dans Docker)
6. FreeRADIUS vérifie les identifiants dans son fichier users
7. FreeRADIUS répond : Access-Accept ou Access-Reject
8. La borne EAP330 autorise ou bloque Internet pour cet appareil
```

### Configuration EAP330

La borne est configurée en mode "Local Web Portal" avec "External RADIUS Server".
Elle pointe vers l'IP du serveur sur le port 18120.

### FreeRADIUS

FreeRADIUS vérifie les identifiants dans son fichier `users`.
Format : identifiant = mot de passe = numéro de chambre (101 à 603).

### Relay UDP

Docker Desktop sur Windows ne peut pas recevoir des paquets UDP venant du réseau local. On a donc un script de relay qui fait le pont.

**Sur Windows :** script PowerShell (`portail-captif/udp_relay.ps1`)
**Pour la migration Debian :** script Python équivalent

Le relay écoute sur `0.0.0.0:18120` et retransmet vers `127.0.0.1:1812`.

### Comment tester

1. Connecter un téléphone au SSID `OP1_Wifi`
2. Le portail captif s'affiche automatiquement
3. Entrer `201` / `201` → Access-Accept → Internet
4. Entrer un mauvais identifiant → Access-Reject → pas Internet
5. Vérifier les logs : `docker logs maison_freeradius`
6. Vérifier sessions dans l'admin : onglet Wi-Fi

### Phrase orale

> "Le portail captif utilise le protocole RADIUS, standard dans les hôtels. La borne EAP330 délègue l'authentification à FreeRADIUS. FreeRADIUS vérifie le numéro de chambre et répond Access-Accept ou Access-Reject. La borne autorise ou bloque l'accès."

---

## 14. Problème portail captif corrigé

### Le problème rencontré

La borne EAP330 affichait `Login timeout` même avec les bons identifiants. FreeRADIUS semblait fonctionner, les logs montraient qu'il répondait.

### La cause

Le **firewall Windows** bloquait les paquets UDP entrants sur le port 18120. Les paquets RADIUS de la borne arrivaient sur la carte réseau Windows mais étaient rejetés avant d'atteindre le relay PowerShell.

### La correction

Ajouter une règle de pare-feu Windows pour autoriser le trafic UDP entrant sur le port 18120 :
```powershell
New-NetFirewallRule -DisplayName "FreeRADIUS Relay" -Direction Inbound `
  -Protocol UDP -LocalPort 18120 -Action Allow
```

Une fois la règle ajoutée, les paquets passent normalement au relay, qui les retransmet à FreeRADIUS.

### Ce qu'on a appris

Le problème ne venait pas de FreeRADIUS ni des identifiants — FreeRADIUS ne recevait simplement jamais les paquets.

### Phrase orale

> "Le problème ne venait pas des identifiants mais du firewall Windows qui bloquait les paquets UDP avant qu'ils arrivent au relay. Une fois la règle de pare-feu ajoutée, tout a fonctionné immédiatement."

---

## 15. Authentification et sécurité

### JWT — JSON Web Token

Le projet utilise des JWT pour l'authentification. Implémenté manuellement dans `backend/src/Core/JWT.php`.

**Structure d'un JWT :**
```
header.payload.signature

header   = {"alg":"HS256","typ":"JWT"} en base64
payload  = {"user_id":5,"role":"user","exp":1720000000} en base64
signature = HMAC-SHA256(header + "." + payload, secret)
```

**Comment ça marche :**
1. À la connexion, le backend génère un token signé avec le secret du `.env`.
2. Le frontend stocke le token dans `localStorage`.
3. À chaque requête, le frontend l'envoie dans le header `Authorization: Bearer <token>`.
4. Le backend vérifie la signature → si quelqu'un modifie le payload, la signature ne correspond plus → rejet.

### Deux types d'utilisateurs

**Client (role: "user") :**
- Compte individuel avec email + mot de passe hashé en bcrypt
- JWT avec `user_id` et `role: "user"`
- Peut réserver, commander, voir son espace

**Admin (role: "admin") :**
- Pas de compte en base — mot de passe unique dans `.env` (ADMIN_PASSWORD)
- JWT avec `user_id: 0` et `role: "admin"`
- Donne accès à tout le tableau de bord

### Protection des routes admin

`AdminMiddleware::require()` vérifie :
1. Le header `Authorization: Bearer ...` est présent
2. Le JWT se décode correctement
3. `role === "admin"`

Si l'une de ces vérifications échoue → HTTP 401 ou 403, arrêt immédiat.

### Mots de passe clients

Les mots de passe sont hashés avec bcrypt via `password_hash()`.
La vérification utilise `password_verify()` → on ne stocke jamais le mot de passe en clair.

### Secrets jamais dans le code

- SMTP : dans `.env`
- Mot de passe admin : dans `.env`
- Clé JWT : dans `.env`
- Identifiants MySQL : dans `.env`

### Phrase orale

> "L'authentification repose sur les JWT. À la connexion, un token signé est généré. Il contient le rôle (user ou admin). Si quelqu'un modifie le token, la signature HMAC ne correspond plus et le token est rejeté. Les mots de passe sont hashés en bcrypt, jamais en clair."

---

## 16. Bot Telegram

### Rôle

Notifie l'admin en temps réel à chaque nouvelle réservation ou commande. L'admin peut confirmer ou refuser directement depuis Telegram.

### Fonctionnement

1. Nouvelle réservation → message Telegram avec boutons `✅ Confirmer` / `❌ Annuler`
2. Nouvelle commande → message avec `✅ Accepter` / `❌ Refuser`
3. Admin clique un bouton → Telegram envoie un callback_query au worker PHP
4. Le worker PHP met à jour le statut dans MySQL
5. Le message Telegram est modifié pour afficher le nouveau statut

### Le worker PHP

`maison_worker` est un container qui tourne en boucle et appelle `getUpdates()` toutes les 2 secondes. Quand un bouton est cliqué, il reçoit le callback et agit immédiatement.

**Correction importante :** MySQL ferme les connexions inactives. Le worker vérifie la connexion avant chaque utilisation (`SELECT 1`) et la recrée si elle est tombée. Sans ça, les boutons Telegram restent bloqués.

### Phrase orale

> "Le bot Telegram permet à l'admin de confirmer ou refuser une réservation directement depuis son téléphone. Un worker PHP tourne en permanence et détecte les clics sur les boutons. Il met à jour le statut en base MySQL et répond à Telegram pour fermer le spinner."

---

## 17. Logs utiles

### `backend/logs/mail.log` — Tous les e-mails envoyés

```
2026-06-29 17:20:05 | OK   | to=client@gmail.com | subject=Vous avez un message vocal — Chambre 201
2026-06-29 17:20:06 | IGNORE (SMTP non configure) | to=... | subject=...
```

**Ce qu'on regarde :** `OK` = envoyé, `IGNORE` = SMTP pas configuré, `ERROR` = problème SMTP.

### `backend/logs/voicemail.log` — Tous les événements voicemail

```
2026-06-29 17:20:05 | ext=2001 | chambre=201 | resa=oui | audio=joint | email=client@gmail.com | OK
2026-06-29 17:20:06 | ext=2002 | chambre=202 | resa=non | email=reception@hotel.fr | FALLBACK
```

**Ce qu'on regarde :** extension, chambre trouvée, réservation active ou non, audio joint ou non, destinataire final.

### Logs Docker

```bash
# Backend PHP
docker compose logs php --tail 50

# Asterisk (voir les appels SIP en direct)
docker compose logs asterisk --tail 50

# FreeRADIUS (voir les authentifications Wi-Fi)
docker compose logs freeradius --tail 30

# Tous les services
docker compose logs --tail 20
```

### Logs Asterisk dans le container

```bash
# Debug voicemail script
docker exec maison_asterisk cat /tmp/vm_debug.log

# Log des notifications envoyées
docker exec maison_asterisk cat /tmp/vm_notify.log
```

### phpMyAdmin

Accessible sur `http://localhost:8080`
Voir les tables directement, vérifier les réservations, les comptes, les sessions Wi-Fi.

---

## 18. Procédure de démonstration

### Avant de commencer

```powershell
# 1. Vérifier que tous les containers tournent
docker compose ps

# 2. Si un container est Down, le redémarrer
docker compose restart <nom_container>

# 3. Vérifier le relay UDP (pour Wi-Fi)
netstat -an | findstr 18120
# → doit afficher UDP 0.0.0.0:18120

# 4. Rafraîchir les données Wi-Fi demo (timestamps récents)
bash portail-captif/sync_radius_sessions.sh
bash portail-captif/seed_activity_demo.sh
```

### Checklist de démonstration

**1. Montrer Docker**
- [ ] `docker ps` → tous les containers `Up`
- [ ] Citer les 8 services et leur rôle

**2. Montrer le frontend**
- [ ] Ouvrir `http://localhost`
- [ ] Page d'accueil, navigation entre les pages
- [ ] Présenter les pages : chambres, restaurant, connexion

**3. Créer un compte**
- [ ] `/connexion` → créer un compte
- [ ] Vérifier que l'e-mail de bienvenue arrive

**4. Modal e-mail (anciens comptes)**
- [ ] Se connecter avec un compte sans e-mail
- [ ] La modal s'affiche automatiquement
- [ ] Cliquer "Plus tard" ou entrer un e-mail

**5. Faire une réservation**
- [ ] Choisir une chambre et des dates
- [ ] Valider → page confirmation avec numéro de chambre
- [ ] Vérifier l'e-mail client reçu
- [ ] Vérifier l'e-mail réception reçu
- [ ] Vérifier la notification Telegram

**6. Faire une commande room service**
- [ ] `/restaurant` → ajouter des articles
- [ ] Commander → confirmation
- [ ] Vérifier e-mail client et réception

**7. Portail captif Wi-Fi**
- [ ] Connecter un téléphone au SSID `OP1_Wifi`
- [ ] Le portail s'affiche → entrer `201` / `201`
- [ ] Access-Accept → Internet fonctionne
- [ ] Onglet Wi-Fi dans l'admin → session visible

**8. Téléphonie Asterisk**
- [ ] `docker exec maison_asterisk asterisk -rx "sip show peers"` → postes Registered
- [ ] Appel interne chambre → réception
- [ ] Appel réception → chambre

**9. Voicemail → E-mail avec audio**
- [ ] Appeler une chambre → ne pas répondre
- [ ] Laisser un message vocal
- [ ] Vérifier `cat /tmp/vm_debug.log` dans le container Asterisk
- [ ] Vérifier `backend/logs/voicemail.log`
- [ ] Vérifier l'e-mail reçu (avec le .wav joint)

**10. Montrer les logs**
- [ ] `backend/logs/mail.log` → tous les e-mails OK
- [ ] `backend/logs/voicemail.log` → extensions, chambres, clients
- [ ] phpMyAdmin → `http://localhost:8080`

---

## 19. Questions du professeur + réponses

### Questions générales

**Q : Qu'est-ce que vous avez fait ?**
R : Une plateforme complète pour un hôtel. Les clients réservent en ligne, commandent des services, se connectent au Wi-Fi par leur numéro de chambre, utilisent la téléphonie interne. L'hôtel gère tout depuis un tableau de bord admin avec notifications Telegram. Tout tourne dans Docker.

**Q : Pourquoi Docker ?**
R : Docker permet de lancer les 8 services en une commande sur n'importe quelle machine, sans installer PHP, MySQL ou Asterisk manuellement. Chaque service est isolé dans son container. Les données survivent aux redémarrages grâce aux volumes.

**Q : Pourquoi PHP pour le backend ?**
R : PHP est le langage web le plus répandu, simple à déployer, et s'intègre naturellement avec MySQL via PDO. On a fait une architecture MVC légère sans framework lourd pour pouvoir expliquer chaque ligne.

**Q : Pourquoi React pour le frontend ?**
R : Le tableau de bord admin nécessite beaucoup d'interactivité — onglets, mises à jour de statuts, formulaires. React permet de mettre à jour uniquement la partie concernée sans recharger toute la page. C'est une SPA.

**Q : Qu'est-ce qui est original dans votre projet ?**
R : L'intégration complète d'Asterisk avec envoi automatique du message vocal par e-mail en pièce jointe, la logique de fallback pour ne jamais perdre un message, le portail captif RADIUS, et le fait que tout tourne dans Docker avec un seul docker-compose.

---

### Questions sur l'architecture

**Q : Expliquez l'architecture générale.**
R : Client → React → Nginx → PHP → MySQL. En parallèle : Asterisk gère la téléphonie, FreeRADIUS gère le Wi-Fi, un worker PHP gère le bot Telegram. Tout communique sur le réseau Docker interne `hotel-net`.

**Q : Comment les services communiquent-ils entre eux ?**
R : Via le réseau Docker interne. Par exemple, PHP accède à MySQL en utilisant le nom de container `mysql` comme hostname. Asterisk envoie une requête HTTP à `http://nginx/api/voicemail-notify` via le réseau Docker.

---

### Questions sur le Wi-Fi

**Q : C'est quoi FreeRADIUS ?**
R : C'est le serveur qui implémente le protocole RADIUS, standard pour l'authentification Wi-Fi dans les hôtels. La borne EAP330 lui délègue la vérification des identifiants.

**Q : C'est quoi Access-Accept ?**
R : C'est la réponse positive de FreeRADIUS qui dit à la borne "cet identifiant est valide, autorise cet appareil".

**Q : Pourquoi un relay UDP ?**
R : Docker Desktop sur Windows ne peut pas recevoir de paquets UDP venant du réseau local directement dans un container. Le relay PowerShell reçoit les paquets sur la carte réseau physique et les retransmet vers FreeRADIUS.

**Q : Que se passe-t-il si le Wi-Fi ne marche pas ?**
R : Il faut vérifier 3 choses : le relay UDP est actif (`netstat -an | findstr 18120`), FreeRADIUS est Up (`docker compose ps`), et l'IP est correcte.

---

### Questions sur la téléphonie

**Q : C'est quoi Asterisk ?**
R : C'est un PABX open source — un autocommutateur téléphonique en logiciel. Il gère les extensions SIP, les appels entre postes, et la messagerie vocale.

**Q : Pourquoi le container Asterisk est en mode `network_mode: host` ?**
R : SIP et RTP utilisent des plages de ports dynamiques. Avec le mode bridge de Docker, les ports RTP seraient bloqués. Le mode host donne à Asterisk un accès direct à la pile réseau de la machine hôte.

---

### Questions sur les e-mails

**Q : Comment le système sait quel client reçoit le voicemail ?**
R : Il convertit l'extension en chambre via `physical_rooms.phone_extension`, cherche la réservation active pour cette chambre aujourd'hui dans `bookings`, puis récupère l'e-mail du client.

**Q : Que se passe-t-il si aucun client n'est trouvé ?**
R : Il y a un fallback : le message part à la réception (ADMIN_EMAIL) pour ne jamais être perdu.

**Q : Pourquoi les identifiants SMTP ne sont pas dans le code ?**
R : Pour la sécurité. Si quelqu'un accède au code source (GitHub, etc.), il ne trouvera jamais le mot de passe Gmail. Les secrets sont dans `.env` qui n'est pas versionné.

**Q : Comment tester que le mail marche ?**
R : On utilise la route admin `POST /api/admin/mail-test` et on vérifie `backend/logs/mail.log` pour voir `OK`.

**Q : Pourquoi Python3 et pas curl dans le script Asterisk ?**
R : Curl utilise libcurl/OpenSSL qui ne s'initialise pas correctement dans les sous-processus Asterisk. Python3 `urllib.request` ne dépend pas d'OpenSSL → aucun problème.

---

### Questions sur la sécurité

**Q : Qu'est-ce qu'un JWT ?**
R : JSON Web Token — un standard pour transmettre des informations de façon sécurisée. Il contient 3 parties : header (algorithme), payload (données), signature HMAC-SHA256. Si quelqu'un modifie le payload, la signature ne correspond plus et le token est rejeté.

**Q : Comment les mots de passe sont stockés ?**
R : En bcrypt via `password_hash()`. On ne stocke jamais le mot de passe en clair. La vérification utilise `password_verify()`.

**Q : Comment sont protégées les routes admin ?**
R : `AdminMiddleware::require()` vérifie le JWT dans le header `Authorization`. Si le token est absent, modifié ou expiré, la requête est rejetée avec HTTP 401/403.

**Q : Qu'est-ce que PDO et pourquoi l'utiliser ?**
R : PDO est la couche d'abstraction PHP pour accéder aux bases de données. Il support les requêtes préparées avec paramètres bindés, ce qui protège contre les injections SQL. On ne concatène jamais des données utilisateur directement dans le SQL.

---

### Questions personnelles

**Q : Quelle partie as-tu développée ?**
R : L'ensemble du projet : frontend React, backend PHP, configuration Docker, FreeRADIUS pour le Wi-Fi, Asterisk pour la téléphonie, le système d'e-mails automatiques avec voicemail, et le bot Telegram.

**Q : Quelle difficulté as-tu rencontrée ?**
R : Deux difficultés majeures. D'abord le portail captif Wi-Fi : Docker Desktop ne peut pas recevoir de paquets UDP depuis le réseau local, on a dû créer un relay PowerShell. Ensuite l'envoi du voicemail : curl exit=2 dans le sous-processus Asterisk — on a remplacé curl par Python3 `urllib.request`.

**Q : Qu'est-ce que tu améliorerais ?**
R : HTTPS avec Let's Encrypt, vraie capture DNS (Pi-hole) à la place des données démo, interface admin pour voir l'historique des messages vocaux, et monitoring automatique des services.

---

## 20. Limites et améliorations futures

| Amélioration | Description |
|---|---|
| **HTTPS** | Ajouter un certificat SSL (Let's Encrypt) pour chiffrer les échanges |
| **Vraie capture DNS** | Installer Pi-hole ou dnsmasq pour remplacer les données de démo par de vraies données réseau |
| **Historique voicemail** | Interface admin pour voir et écouter tous les messages vocaux reçus |
| **Lien sécurisé** | Permettre d'écouter le voicemail depuis un lien web sécurisé dans l'e-mail |
| **CORS restrictif** | Limiter `Access-Control-Allow-Origin` à l'URL réelle du serveur |
| **Monitoring** | Alertes automatiques si un container Docker tombe |
| **Vraie téléphonie** | Connecter des vrais téléphones SIP physiques pour une démo complète |
| **2FA admin** | Ajouter une double authentification pour l'admin |
| **Rate limiting** | Limiter les tentatives de connexion pour éviter le brute-force |
| **Interface logs** | Afficher `mail.log` et `voicemail.log` directement dans le tableau de bord admin |

---

## ANNEXE — Fichiers importants par catégorie

### Backend PHP
```
backend/public/index.php                     Routeur central
backend/src/Core/Router.php                  Gestion des routes
backend/src/Core/MailService.php             Service e-mails
backend/src/Core/JWT.php                     JWT manuel
backend/src/Core/Database.php               Singleton PDO
backend/src/Core/AdminMiddleware.php         Protection routes admin
backend/src/Controllers/AuthController.php  Inscription / connexion
backend/src/Controllers/BookingController.php  Réservations
backend/src/Controllers/OrderController.php    Commandes
backend/src/Controllers/MeController.php       Espace client
backend/src/Controllers/VoicemailController.php  Voicemail Asterisk
backend/src/Controllers/WifiController.php     Données Wi-Fi
backend/logs/mail.log                          Logs e-mails
backend/logs/voicemail.log                     Logs voicemail
```

### Frontend React
```
maison-saclay/src/App.tsx                  Routeur principal
maison-saclay/src/pages/AdminPage.tsx      Tableau de bord admin
maison-saclay/src/services/api.ts         Appels API
maison-saclay/src/lib/auth.tsx            Contexte authentification
maison-saclay/src/components/EmailModal.tsx  Modal e-mail anciens comptes
```

### Asterisk
```
Asterisk16/config/sip.conf                Extensions SIP
Asterisk16/config/extensions.conf         Dial plan (logique appels)
Asterisk16/config/voicemail.conf          Messagerie vocale
Asterisk16/config/scripts/voicemail_notify.sh  Script Python3 → API
Asterisk16/config/spool/                  Fichiers audio .wav
```

### Base de données
```
sql/schema.sql                Tables principales
sql/seed.sql                  Données initiales
sql/03-physical-rooms.sql     Chambres physiques + extensions tél.
```

### Infrastructure
```
docker-compose.yml            Orchestration des 8 containers
.env                          Secrets (SMTP, JWT, MySQL, admin)
portail-captif/udp_relay.ps1  Relay RADIUS Windows
freeradius/                   Configuration FreeRADIUS
```

---

## ANNEXE — Commandes à connaître pour la démo

```bash
# Docker
docker ps                                          # voir les containers
docker compose up -d                               # lancer tout
docker compose restart php                         # redémarrer un service
docker compose logs php --tail 30                  # voir les logs

# Asterisk
docker exec maison_asterisk asterisk -rx "sip show peers"  # voir postes
docker exec maison_asterisk cat /tmp/vm_debug.log          # debug voicemail

# Base de données
docker exec maison_mysql mysql -u root -p<password> hotel_db -e "SELECT * FROM bookings ORDER BY id DESC LIMIT 5;"

# Logs backend
cat "Projet Hotel 5 etoiles/backend/logs/mail.log"
cat "Projet Hotel 5 etoiles/backend/logs/voicemail.log"

# Wi-Fi
netstat -an | findstr 18120                       # vérifier relay actif
docker logs maison_freeradius --tail 20           # voir les auth RADIUS
```

---

*Document mis à jour le 29 juin 2026 — couvre l'intégralité du projet Maison Saclay.*
