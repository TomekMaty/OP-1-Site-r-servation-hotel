# Rapport Technique — Maison Saclay
## Application de gestion hôtelière 5 étoiles
**Projet développé — juin 2026**

---

## TABLE DES MATIÈRES

1. [Présentation du projet](#1)
2. [Architecture technique](#2)
3. [Base de données et API](#3)
4. [Interface publique client](#4)
5. [Système de réservation](#5)
6. [Room Service en temps réel](#6)
7. [Notifications Telegram](#7)
8. [Dashboard administrateur](#8)
9. [Inventaire des chambres](#9)
10. [Statistiques et graphiques](#10)
11. [Défis techniques et solutions](#11)
12. [Guide de démarrage](#12)

---

## 1. Présentation du projet

### Contexte

Maison Saclay est une application web complète de gestion hôtelière pour un hôtel 5 étoiles. Le projet simule un environnement professionnel réel avec deux interfaces : une interface client publique pour la navigation et les réservations, et un panel d'administration complet pour la gestion opérationnelle en temps réel.

### Objectifs fonctionnels

- Permettre à un client de découvrir les chambres, effectuer une réservation et commander le room service depuis son téléphone ou ordinateur
- Permettre à l'équipe hôtelière de gérer réservations, commandes et chambres depuis un dashboard en temps réel
- Recevoir des alertes instantanées sur Telegram avec confirmation en un clic
- Offrir une expérience visuelle haut de gamme (niveau 5 étoiles) sur tous les appareils

### Chiffres clés

| Indicateur | Valeur |
|---|---|
| Fichiers PHP backend | 15 fichiers |
| Fichiers TypeScript/React frontend | 18 fichiers |
| Routes API | 19 endpoints |
| Tables en base de données | 8 tables |
| Containers Docker | 5 services |
| Bibliothèques majeures | React 19, Framer Motion, Recharts, Tailwind CSS v4 |

---

## 2. Architecture technique

### Stack technologique

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVIGATEUR CLIENT                         │
│   React 19 + TypeScript + Tailwind CSS v4                   │
│   Framer Motion · Recharts · Lucide Icons                   │
│   React Hook Form + Zod (validation formulaires)            │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/JSON
┌────────────────────────▼────────────────────────────────────┐
│                    NGINX (port 80)                           │
│  /          →  Frontend React (fichiers dist/)              │
│  /api/*     →  PHP-FPM via FastCGI                         │
└──────────┬──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│              PHP 8.2-FPM (architecture MVC custom)          │
│   Router → Middleware → Controller → Model → Response JSON  │
└──────────┬─────────────────────┬───────────────────────────-┘
           │                     │
┌──────────▼──────────┐  ┌───────▼─────────────────────────── ┐
│     MySQL 8.0       │  │  Worker Telegram (container dédié) │
│   PDO + requêtes    │  │  PHP loop · getUpdates · poll 2s   │
│   préparées         │  │  Répond aux clics de boutons        │
└─────────────────────┘  └─────────────────────────────────────┘
```

### Containerisation Docker Compose (5 services)

| Container | Image | Rôle |
|---|---|---|
| `maison_nginx` | nginx:alpine | Reverse proxy, sert le frontend + route /api vers PHP |
| `maison_php` | php:8.2-fpm custom | Exécute l'API backend (PHP-FPM) |
| `maison_worker` | php:8.2-fpm custom | Worker Telegram en arrière-plan (permanent) |
| `maison_mysql` | mysql:8.0 | Base de données relationnelle |
| `maison_phpmyadmin` | phpmyadmin | Interface d'administration DB (port 8080) |

### Architecture backend PHP (MVC custom, sans framework)

```
backend/
├── public/
│   └── index.php          ← Front controller unique, autoloader, router
├── src/
│   ├── Config/
│   │   └── Database.php   ← Singleton PDO (connexion MySQL)
│   ├── Core/
│   │   ├── Router.php     ← Routing par regex (/:param dynamique)
│   │   ├── Response.php   ← JSON standardisé {success, data, message}
│   │   ├── Telegram.php   ← Client Telegram Bot API complet
│   │   ├── AuthMiddleware.php    ← Vérifie JWT utilisateur
│   │   └── AdminMiddleware.php   ← Vérifie JWT admin
│   ├── Controllers/       ← 1 controller par ressource
│   └── Models/            ← 1 model par table
└── worker.php             ← Worker Telegram (process autonome)
```

### Architecture frontend React

```
maison-saclay/src/
├── pages/                  ← 1 fichier par page
│   ├── HomePage.tsx
│   ├── RoomsPage.tsx
│   ├── RoomDetailPage.tsx
│   ├── ConfirmationPage.tsx  ← Live polling statut réservation
│   ├── RoomServicePage.tsx
│   ├── MyAccountPage.tsx     ← Auto-refresh commandes actives
│   └── AdminPage.tsx         ← Dashboard complet (900+ lignes)
├── components/
│   ├── room/BookingWidget.tsx ← Formulaire réservation
│   └── StatsTab.tsx           ← Graphiques Recharts
└── services/
    └── api.ts                 ← Toutes les fonctions fetch vers /api
```

### Authentification JWT

**Clients** : JWT HS256, stocké en `localStorage`, durée 24h
- Nécessaire pour : réservations, commandes, espace client

**Admin** : JWT séparé, stocké en `sessionStorage` (expire à la fermeture du navigateur)
- Mot de passe hashé bcrypt dans `.env`
- Nécessaire pour : dashboard, inventaire, statistiques

---

## 3. Base de données et API

### Schéma complet (8 tables)

```sql
-- Types de chambres (3 : chambre deluxe, suite, penthouse)
rooms (id, slug, name, category ENUM, tagline, description,
       price, surface, max_guests, floor,
       images JSON, amenities JSON, highlights JSON, available)

-- Chambres physiques (9 : 3 par type)
physical_rooms (id, room_type_id FK→rooms, room_number, floor)

-- Réservations
bookings (id, user_id FK→users, room_id FK→rooms,
          physical_room_id FK→physical_rooms,
          check_in DATE, check_out DATE, guests,
          first_name, last_name, email, total_price,
          status ENUM(pending|confirmed|cancelled),
          notes, telegram_msg_id, created_at)

-- Comptes clients
users (id, first_name, last_name, email, password_hash, created_at)

-- Menu room service (14 articles)
menu_items (id, name, description, price,
            category ENUM(brunch|plat|boisson|dessert),
            image_url, available, sort_order)

-- Commandes room service
orders (id, user_id FK→users, booking_id FK→bookings,
        room_number, status ENUM(pending|preparing|delivered|cancelled),
        total_price, notes, telegram_msg_id, created_at)

-- Détail des articles commandés
order_items (id, order_id FK→orders, menu_item_id FK→menu_items,
             quantity, unit_price)

-- Messages de contact
contacts (id, first_name, last_name, email, phone,
          subject, message, read_at, created_at)
```

### Attribution automatique des chambres physiques

Lors d'une réservation, une chambre physique disponible est attribuée automatiquement :

```sql
-- Trouver la première chambre du bon type sans chevauchement de dates
SELECT pr.id, pr.room_number FROM physical_rooms pr
WHERE pr.room_type_id = :type_id
  AND pr.id NOT IN (
    SELECT b.physical_room_id FROM bookings b
    WHERE b.status != 'cancelled'
      AND b.check_in  < :check_out   -- les 2 conditions ensemble couvrent
      AND b.check_out > :check_in    -- TOUS les cas de chevauchement
  )
ORDER BY pr.room_number ASC LIMIT 1
```

### API REST — 19 endpoints

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | /api/rooms | — | Liste des chambres |
| GET | /api/rooms/:slug | — | Détail chambre |
| POST | /api/auth/register | — | Inscription client |
| POST | /api/auth/login | — | Connexion client |
| POST | /api/auth/admin/login | — | Connexion admin |
| POST | /api/bookings | User | Créer une réservation |
| GET | /api/bookings | Admin | Liste des réservations |
| POST | /api/bookings/:id/status | Admin | Modifier statut |
| POST | /api/orders | User | Passer une commande |
| GET | /api/orders | Admin | Liste des commandes |
| POST | /api/orders/:id/status | Admin | Modifier statut |
| GET | /api/menu | — | Menu room service |
| GET | /api/me/bookings | User | Mes réservations |
| GET | /api/me/orders | User | Mes commandes |
| GET | /api/me | User | Mon profil |
| GET | /api/admin/inventory | Admin | Inventaire chambres |
| GET | /api/admin/stats | Admin | Statistiques globales |
| GET | /api/telegram/action | — | Action bouton Telegram |
| GET | /api/health | — | Santé de l'API |

---

## 4. Interface publique client

### Description

SPA (Single Page Application) React avec routing côté client. Expérience visuelle premium inspirée de Apple, Linear et Stripe, avec transitions fluides entre pages (Framer Motion AnimatePresence).

### Pages développées

**Page d'accueil (`/`)** — Hero plein écran, présentation des 3 types de chambres, section services, CTA vers réservation

**Catalogue (`/chambres`)** — Grille des chambres avec photos Unsplash, prix, surface, capacité

**Fiche chambre (`/chambres/:slug`)** :
- Galerie d'images interactive plein écran
- Description complète, liste d'équipements (JSON), points forts
- Widget de réservation sticky avec sélection de dates
- Validation côté client : React Hook Form + Zod
- Section "Autres chambres" en bas de page

**Espace client (`/mon-espace`)** — Réservations et commandes avec statuts

**Room Service (`/room-service`)** — Menu interactif avec panier

### Design system

- Charcoal `#1A1714` — fonds sombres, titres
- Gold `#C4A882` — accents, prix, CTA
- Ivory `#FAF8F5` — fond des pages
- Police serif pour les titres (effet luxe), sans-serif pour le corps
- Responsive mobile-first avec breakpoints Tailwind CSS

---

## 5. Système de réservation

### Flux complet de réservation

```
1. Client choisit chambre + dates + voyageurs
2. BookingWidget valide les dates (départ > arrivée, utilisateur connecté)
3. POST /api/bookings
     → Vérifie disponibilité (chevauchement SQL)
     → Attribue chambre physique automatiquement
     → Calcule prix total (nuits × tarif)
     → Crée réservation (status: pending)
     → Envoie notification Telegram avec boutons
4. Redirect vers /confirmation
5. Admin confirme depuis Telegram (clic bouton) ou /admin
6. Page confirmation détecte le changement via polling 5s
     → Bandeau amber "En attente" → vert "Confirmée"
```

### Page de confirmation avec live polling

```typescript
// Polling toutes les 5s, s'arrête automatiquement quand confirmé
useEffect(() => {
  if (liveStatus === "confirmed") return; // Auto-stop
  const timer = setInterval(async () => {
    const bookings = await fetchMyBookings();
    const found = bookings.find(b => b.id === state.id);
    if (found && found.status !== liveStatus) {
      setLiveStatus(found.status as BookingStatus);
    }
  }, 5000);
  return () => clearInterval(timer);
}, [liveStatus, state.id]);
```

### Journey stepper animé (3 étapes)

- **Étape 1** — Demande envoyée : toujours cochée (cercle noir + ✓)
- **Étape 2** — Confirmation hôtel : pulse amber (pending) → coche noire (confirmed)
- **Étape 3** — Votre séjour : grisé jusqu'à confirmation

---

## 6. Room Service en temps réel

### Interface de commande

- 14 articles en 4 catégories : Brunch, Plats, Boissons, Desserts
- Panier interactif (ajout/retrait/quantités)
- Note optionnelle pour la cuisine
- **Détection automatique du numéro de chambre** depuis la réservation active

### Suivi de commande (LiveOrderBanner)

Affiché automatiquement dans l'espace client dès qu'une commande est active :

```
● COMMANDE EN COURS  ·  Chambre 601  ·  #0013
──────────────────────────────────────────────
●──────────────●──────────────○
✓ Reçue    ⚙ En préparation   Livraison
Votre commande est en cours de préparation · ~20-35 min
```

- Dot gold animé (CSS pulse) pour indiquer une commande active
- 3 étapes animées : Clock → ChefHat → Truck
- Auto-refresh toutes les 10 secondes uniquement si commande active
- Badge pulsant sur l'onglet même si le client est sur un autre onglet

---

## 7. Notifications Telegram avec boutons d'action

### Flux global

```
[Client réserve]
      ↓
[PHP crée la réservation + envoie message Telegram avec boutons]
      ↓
[Admin reçoit la notification sur Telegram]
      ↓
[Admin clique ✅ Confirmer ou ❌ Annuler]
      ↓
[Worker PHP détecte le clic via getUpdates (< 2 secondes)]
      ↓
[Worker met à jour la DB + édite le message pour enlever les boutons]
      ↓
[Page de confirmation du client se met à jour automatiquement en 5s]
```

### Le Worker Telegram — solution 100% locale sans HTTPS

**Problème initial :** Telegram impose HTTPS pour les webhooks. Les boutons URL avec "localhost" sont rejetés par l'API Telegram.

**Solution :** Worker PHP autonome dans un container Docker dédié qui poll `getUpdates` toutes les 2 secondes :

```php
// backend/worker.php — tourne en permanence dans Docker
while (true) {
    $updates = Telegram::getUpdates(); // Appel API Telegram

    foreach ($updates as $update) {
        $cb = $update['callback_query'] ?? null;
        if (!$cb) continue;

        // Données : "booking:13:confirm" ou "order:10:accept"
        [$type, $id, $action] = explode(':', $cb['data']);

        // 1. Répondre immédiatement → ferme le spinner Telegram
        Telegram::answerCallback($cb['id'], "Traité !");

        // 2. Mettre à jour la base de données
        // 3. Éditer le message pour enlever les boutons
    }
    sleep(2);
}
```

**Avantages :**
- Aucune URL publique nécessaire (pas de webhook, pas d'ngrok)
- Fonctionne 100% en local, quel que soit le réseau
- Le spinner Telegram disparaît en moins de 2 secondes
- Indépendant du navigateur admin (tourne même si /admin est fermé)
- `restart: unless-stopped` dans Docker → redémarre automatiquement

### Format des messages Telegram

**Notification réservation (avec boutons) :**
```
📅 Nouvelle réservation #13

🛏 Penthouse Saclay · Chambre 601
👤 Jean Dupont (jean@email.fr)
📆 10/06/2026 → 13/06/2026 · 3 nuits · 2 pers.

💰 Total : 5 400€
⏳ En attente de confirmation

[✅ Confirmer]     [❌ Annuler]
```

**Message édité après clic ✅ (boutons supprimés) :**
```
✅ Réservation #13 Confirmée
🛏 Penthouse Saclay
👤 Jean Dupont · 10/06 → 13/06
🕐 Traité à 14h32
```

### Sécurité des liens d'action

Chaque lien d'action est signé par HMAC-SHA256 :
```
/api/telegram/action?k=a4b66fb32345dac7&type=booking&id=13&action=confirm
                       ↑ 16 premiers chars du HMAC-SHA256(JWT_SECRET)
                       → Impossible à forger sans connaître le secret
```

---

## 8. Dashboard administrateur

### Accès et sécurité

- URL : `http://localhost/admin`
- Mot de passe hashé bcrypt dans `.env`
- Token JWT en `sessionStorage` (expire à la fermeture du navigateur)
- Auto-refresh des données toutes les 12 secondes

### 5 KPIs en haut de page

Total réservations · En attente · Confirmées · Commandes actives · CA total

### Onglet Réservations

- Liste complète des réservations actives (non annulées)
- Colonnes : client, chambre, dates, durée, voyageurs, montant, statut
- 3 actions : Confirmer / Annuler / Remettre en attente
- Badges colorés : amber (attente) / vert (confirmée) / rouge (annulée)
- Mise à jour optimiste de l'interface (sans rechargement)

### Onglet Commandes

- Liste de toutes les commandes room service
- Détail des articles avec photos, quantités, sous-totaux, notes
- Pipeline : En attente → En préparation → Livré
- Actions contextuelles selon le statut actuel

### Onglet Messages

- Messages de contact reçus
- Badge "Non lu" tant que non consulté
- Copie de l'email en presse-papiers

---

## 9. Inventaire des chambres

### Vue d'ensemble

L'inventaire offre une vision complète et instantanée de l'état opérationnel de l'hôtel avec 6 niveaux de statut, des prévisions sur 7 jours et des actions rapides.

### Panel "Activité du jour"

Affiché automatiquement si des événements ont lieu le jour courant :

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Arrivées · 2     │  │ Départs · 1      │  │ En attente · 1   │
│                  │  │                  │  │                  │
│ Jean Dupont      │  │ Marie Martin     │  │ Paul Bernard     │
│ Ch.601 · 3 nuits │  │ Ch.101           │  │ Ch.201  [✓] [✕] │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Bande statistiques (fond charcoal)

6 métriques en temps réel :
1. Anneau SVG animé — taux d'occupation en %
2. Total chambres
3. Disponibles (libres immédiatement)
4. Occupées (séjour en cours)
5. Réservées (séjours à venir)
6. CA actif (somme des réservations en cours, en euros)

### 3 colonnes par type de chambre

Chaque colonne contient :

**Header photo (128px)** : photo assombrie + overlay gradient + nom/surface/étage + compteur occupées/total + CA actif de la catégorie

**Barre tricolore (4px)** : rouge (occupé) + vert (disponible) + bleu (réservé), proportionnels

**Prévision 7 jours** :
- 7 barres verticales = aujourd'hui + 6 jours suivants
- Hauteur proportionnelle au taux d'occupation prévu
- Couleur : vert (0-40%) → orange (40-80%) → rouge (>80%)

**Cards individuelles** par chambre physique :
- Bande couleur verticale selon statut
- Numéro de chambre (police serif)
- Badge statut coloré
- Nom du client, personnes, dates, montant total
- "Départ dans Xj" pour les séjours actifs
- Boutons Confirmer/Annuler si réservation en attente

### 6 statuts gérés

| Statut | Couleur | Condition |
|---|---|---|
| Libre | Vert | Aucune réservation active |
| Occupée | Rose | check_in ≤ aujourd'hui < check_out |
| Arrivée aujourd'hui | Amber | check_in = aujourd'hui |
| Départ aujourd'hui | Violet | check_out = aujourd'hui |
| Arrivée prochaine | Bleu clair | check_in dans ≤ 3 jours |
| Réservée | Sky | check_in dans > 3 jours |

---

## 10. Statistiques et graphiques

Onglet dédié dans l'admin, construit avec **Recharts** (bibliothèque React incluse dans les dépendances).

### Panel "Activité du jour"

4 métriques en temps réel (bande charcoal) :
- Check-ins du jour · Check-outs du jour
- Commandes room service du jour · CA room service du jour

### 4 KPIs globaux (grille de cartes)

1. CA total = réservations + room service
2. Panier moyen par réservation
3. Taux de confirmation en %
4. CA Room Service + nb de livraisons

### BarChart — Revenus par mois

Données issues d'une requête SQL GROUP BY mois, 6 derniers mois, couleur gold, tooltip custom fond charcoal.

### PieChart donut — Statuts réservations

Donut chart avec 3 segments : confirmées (vert) / en attente (amber) / annulées (rouge) + légende.

### Barres horizontales — Performance par type de chambre

Barre proportionnelle au CA (max = 100%), couleur propre à chaque catégorie, montant CA affiché.

---

## 11. Défis techniques et solutions

### Défi 1 — Boutons Telegram fonctionnels en local sans HTTPS

**Problème :**
Telegram rejette les boutons inline dont l'URL contient "localhost" :
```
Bad Request: inline keyboard button URL 'http://localhost/...' is invalid
```
Les webhooks nécessitent HTTPS. Les boutons URL avec IP privée nécessitent
que le téléphone soit sur le même réseau que le PC.

**Tentatives intermédiaires :**
- Liens texte Markdown → non cliquables dans les groupes Telegram
- Boutons URL avec IP locale (172.20.10.2) → dépendance réseau
- callback_data avec poll depuis le navigateur admin → spinner 30 secondes si admin panel fermé

**Solution finale :**
Worker PHP autonome dans Docker dédié (`maison_worker`) qui poll `getUpdates` toutes les 2 secondes. Boutons `callback_data` (natifs Telegram, sans URL). Le spinner disparaît en < 2 secondes, sans aucune dépendance réseau.

### Défi 2 — Attribution automatique des chambres

**Problème :** 9 chambres physiques pour 3 types. Comment éviter les conflits de dates ?

**Solution :** Requête SQL avec exclusion par chevauchement :
```sql
AND b.check_in  < :check_out
AND b.check_out > :check_in
-- Ces 2 conditions couvrent TOUS les cas de chevauchement possibles
```

### Défi 3 — Temps réel sans WebSockets

**Problème :** La page de confirmation doit se mettre à jour quand l'admin confirme, sans infrastructure WebSocket.

**Solution :** Polling léger toutes les 5 secondes sur l'API REST existante, avec arrêt automatique une fois la confirmation reçue (`if (liveStatus === "confirmed") return`). Aucune infrastructure supplémentaire.

### Défi 4 — Prévision 7 jours sans appel API supplémentaire

**Problème :** Afficher l'occupation prévue pour 7 jours sans surcharger l'API.

**Solution :** Calcul côté client à partir des données d'inventaire déjà chargées :
```typescript
const days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d.toISOString().split("T")[0];
});
const occ = rooms.filter(r =>
  r.booking?.check_in <= day && r.booking?.check_out > day
).length;
```

### Défi 5 — Démarrage automatique à la fac

**Problème :** À la fac, l'IP WiFi sera différente. Les boutons URL généreraient des liens incorrects.

**Solution :** Script `LANCER-SOUTENANCE.ps1` qui détecte automatiquement l'IP actuelle, met à jour `.env`, redémarre les containers et vérifie que l'API répond.

---

## 12. Guide de démarrage

### Lancement initial

```powershell
cd "Projet Hotel 5 etoiles"
docker compose up -d
# Attendre ~20 secondes → ouvrir http://localhost
```

### Lancement pour la soutenance

Double-clic sur **`LANCER-SOUTENANCE.ps1`** — ce script :
1. Détecte l'IP réseau actuelle (WiFi scolaire prioritaire sur hotspot)
2. Met à jour `.env` avec la bonne IP
3. Redémarre PHP + Worker Telegram
4. Vérifie que l'API répond
5. Affiche le résumé

### URLs et accès

| Service | URL | Identifiants |
|---|---|---|
| Site hôtel | http://localhost | — |
| Panel admin | http://localhost/admin | mdp : maison2026 |
| phpMyAdmin | http://localhost:8080 | saclay_user / saclay_pass |
| API health | http://localhost/api/health | — |

### Scénario de démonstration recommandé

1. Ouvrir `http://localhost` → naviguer dans le site
2. S'inscrire en tant que client (nom, email, mot de passe)
3. Choisir une chambre → sélectionner des dates → Réserver
4. Observer la notification Telegram arriver sur le téléphone
5. Cliquer ✅ Confirmer dans Telegram → boutons disparaissent en < 2 secondes
6. Revenir sur la page de confirmation → bandeau vert "Confirmée" automatiquement
7. Commander un room service depuis `/room-service`
8. Observer dans l'espace client le tracker de commande en temps réel
9. Ouvrir `/admin` → voir la commande → cliquer "En préparation"
10. Explorer l'inventaire (prévision 7 jours, activité du jour, actions rapides)
11. Explorer les statistiques (graphiques BarChart et PieChart)

---

## Bilan

### Points techniques remarquables

- Architecture MVC PHP from scratch (sans framework — maîtrise du langage)
- Worker Telegram autonome dans Docker (problème HTTPS résolu proprement)
- Attribution automatique de chambres avec vérification SQL de chevauchement
- Temps réel sans WebSocket (polling intelligent avec arrêt automatique)
- Sécurité des liens d'action (HMAC-SHA256 signé avec le secret JWT)
- Dashboard admin complet avec 5 onglets fonctionnels
- Inventaire dynamique avec prévision 7 jours calculée côté client
- Graphiques Recharts (BarChart + PieChart) avec données réelles

### Stack maîtrisée

Backend : PHP 8.2, MySQL 8, PDO, JWT, bcrypt, Docker, Nginx, FastCGI

Frontend : React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts, React Hook Form, Zod

DevOps : Docker Compose, multi-container, volumes, healthchecks, process autonome

### Améliorations possibles

- Paiement en ligne (Stripe API)
- Notifications push navigateur (Web Push API)
- Application mobile native (React Native)
- WebSockets pour un vrai temps réel
- Multi-hôtels avec gestion des rôles

---

*Rapport technique — Maison Saclay Hotel Management System — Juin 2026*
