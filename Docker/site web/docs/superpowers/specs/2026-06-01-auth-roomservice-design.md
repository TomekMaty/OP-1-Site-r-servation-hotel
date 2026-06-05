# Architecture complète — Auth + Room Service + Telegram
**Date :** 2026-06-01
**Projet :** Maison Saclay — Phase 3
**Statut :** En attente de validation

---

## 1. PARCOURS UTILISATEUR COMPLET

```
[Visiteur] → /chambres → choisit une chambre → /chambres/suite-panoramique
     ↓
Clique "Réserver" → redirigé vers /connexion?redirect=booking
     ↓
Crée un compte (ou se connecte)
     ↓
Retour sur la page chambre → formulaire de réservation
→ La réservation est liée à son compte (user_id)
     ↓
[Pendant le séjour]
     ↓
Va sur /room-service → menu brunch / plats / boissons
→ Ajoute des items au panier
→ Saisit son numéro de chambre
→ Valide la commande
     ↓
[Admin reçoit une notification Telegram]
🏨 Nouvelle commande
📍 Chambre 204
🍳 Brunch Signature x1 — 38€
☕ Café Arabica x2 — 12€
💰 Total : 50€
⏱ 09:23
     ↓
[Client] → /mon-espace → voit ses réservations + historique commandes
```

---

## 2. TABLES SQL NOUVELLES

### `users` — comptes clients
```sql
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(80)  NOT NULL,
  last_name     VARCHAR(80)  NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

### `menu_items` — carte room service
```sql
CREATE TABLE menu_items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT         NOT NULL,
  price       DECIMAL(8,2) NOT NULL,
  category    ENUM('brunch','plat','boisson','dessert') NOT NULL,
  image_url   VARCHAR(500),
  available   TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB;
```

### `orders` — commandes room service
```sql
CREATE TABLE orders (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  booking_id   INT UNSIGNED NULL,
  room_number  VARCHAR(20)  NOT NULL,
  status       ENUM('pending','preparing','delivered','cancelled') DEFAULT 'pending',
  total_price  DECIMAL(10,2) NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE RESTRICT,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
) ENGINE=InnoDB;
```

### `order_items` — lignes de commande
```sql
CREATE TABLE order_items (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id     INT UNSIGNED     NOT NULL,
  menu_item_id INT UNSIGNED     NOT NULL,
  quantity     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  unit_price   DECIMAL(8,2)     NOT NULL,
  FOREIGN KEY (order_id)     REFERENCES orders(id)     ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
```

### Modification `bookings`
```sql
ALTER TABLE bookings ADD COLUMN user_id INT UNSIGNED NULL AFTER id;
ALTER TABLE bookings ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
```

---

## 3. ROUTES API NOUVELLES

### Auth
```
POST /api/auth/register   → { first_name, last_name, email, password }
                          ← { token, user }

POST /api/auth/login      → { email, password }
                          ← { token, user }
```

### Espace client (JWT requis)
```
GET  /api/me              → profil de l'utilisateur connecté
GET  /api/me/bookings     → ses réservations (triées par check_in desc)
GET  /api/me/orders       → son historique commandes
```

### Menu
```
GET  /api/menu            → tous les items disponibles, groupés par catégorie
```

### Commandes (JWT requis)
```
POST /api/orders          → { room_number, booking_id?, items[], notes? }
                          ← { id, total_price, status }
                          → [side effect] notification Telegram

GET  /api/orders/:id      → détail d'une commande
```

### Admin (existant, à enrichir)
```
GET  /api/bookings        → (déjà existant) — AJOUTER champ user_name
GET  /api/orders          → toutes les commandes (admin)
POST /api/orders/:id/status → pending | preparing | delivered | cancelled
```

---

## 4. PAGES REACT NOUVELLES

| Route | Composant | Description |
|---|---|---|
| `/connexion` | `LoginPage` | Split layout : photo gauche + form droite. Tabs : Connexion / Créer un compte |
| `/mon-espace` | `MyAccountPage` | Dashboard client : réservations actives + historique commandes |
| `/room-service` | `RoomServicePage` | Menu editorial : categories + grande photo + panier flottant |

### Pages modifiées
| Page | Changement |
|---|---|
| `RoomDetailPage` | Bouton "Réserver" → redirect /connexion si non connecté |
| `Header` | Avatar/initiales + lien "Mon espace" si connecté |
| `AdminPage` | Nouvel onglet "Commandes" |

---

## 5. MENU ROOM SERVICE — CONTENU

### Brunch (7h – 11h)
| Item | Prix | Description |
|---|---|---|
| Brunch Signature | 38€ | Viennoiseries, œufs Benedict, saumon fumé, fruits frais |
| Continental | 22€ | Jus fraîchement pressé, pain grillé, confiture maison, beurre |
| Healthy Bowl | 28€ | Granola, yaourt grec, fruits de saison, miel d'acacia |

### Plats (11h – 22h)
| Item | Prix | Description |
|---|---|---|
| Club sandwich | 24€ | Poulet rôti, bacon, avocat, tomate, frites maison |
| Tartare de bœuf | 32€ | Bœuf façonné minute, câpres, cornichons, toast |
| Salade niçoise | 26€ | Thon, olives, haricots verts, œuf parfait |
| Soupe du jour | 14€ | Selon arrivage, croutons dorés, crème fraîche |

### Boissons
| Item | Prix | Description |
|---|---|---|
| Café Arabica | 6€ | Sélection single origin, mouture fraîche |
| Thé Dammann Frères | 8€ | Sélection grand cru |
| Jus frais | 10€ | Pressé à la commande (orange, pomme, carotte-gingembre) |
| Smoothie maison | 12€ | Fruits frais, lait d'amande |

### Desserts
| Item | Prix | Description |
|---|---|---|
| Plateau de fromages | 22€ | Sélection affinée, confiture de figues |
| Paris-Brest | 16€ | Praliné noisette, chantilly légère |
| Coupe de glaces | 14€ | 3 boules, sorbets maison |

---

## 6. TELEGRAM — FONCTIONNEMENT

### Setup requis
- `TELEGRAM_BOT_TOKEN` → token obtenu via @BotFather
- `TELEGRAM_CHAT_ID` → ID du chat/groupe admin

### Format du message
```
🏨 *Nouvelle commande Room Service*

📍 Chambre : 204
👤 Client : Marie Dupont
🕘 09:23

🍽 *Commande :*
• Brunch Signature x1 — 38€
• Café Arabica x2 — 12€

💬 Note : "Sans gluten si possible"

💰 *Total : 50€*
⚡ Statut : En attente
```

---

## 7. AUTHENTIFICATION — APPROCHE JWT

- Token JWT signé côté PHP (HS256, secret dans .env)
- Durée : 7 jours
- Stocké dans `localStorage` côté React
- Envoyé dans `Authorization: Bearer <token>` sur les routes protégées
- Middleware PHP `AuthMiddleware` vérifie le token sur les routes `/me/*` et `/orders`

---

## 8. FICHIERS À CRÉER / MODIFIER

### Backend PHP (nouveaux)
```
backend/src/
  Controllers/
    AuthController.php      ← register + login
    MeController.php        ← /me, /me/bookings, /me/orders
    MenuController.php      ← GET /menu
    OrderController.php     ← POST /orders + GET /orders/:id
  Models/
    User.php
    MenuItem.php
    Order.php
  Core/
    AuthMiddleware.php      ← vérifie JWT
    Telegram.php            ← helper envoi notif
```

### SQL
```
sql/
  schema.sql                ← MODIFIER (ajouter 4 tables)
  seed.sql                  ← MODIFIER (ajouter menu items)
```

### Frontend React (nouveaux)
```
src/
  pages/
    LoginPage.tsx
    MyAccountPage.tsx
    RoomServicePage.tsx
  components/
    auth/
      AuthContext.tsx        ← contexte global auth
      ProtectedRoute.tsx
    roomservice/
      MenuCategory.tsx
      MenuItemCard.tsx
      Cart.tsx               ← panier flottant
  services/
    api.ts                  ← MODIFIER (ajouter auth headers, nouvelles fonctions)
```

### .env (à ajouter)
```
JWT_SECRET=<random_secret>
TELEGRAM_BOT_TOKEN=<bot_token>
TELEGRAM_CHAT_ID=<chat_id>
```

---

## 9. FICHIERS SENSIBLES — NE PAS TOUCHER
- `app/routes.py` (projet MonDevisSimple — autre projet)
- `docker-compose.yml` — SAUF pour ajouter les env vars Telegram

---

## 10. ORDRE D'IMPLÉMENTATION

1. SQL — nouvelles tables + seed menu
2. PHP Auth (register + login + middleware JWT)
3. PHP Menu endpoint
4. PHP Orders endpoint + Telegram
5. PHP Me endpoints
6. React AuthContext
7. React LoginPage
8. React MyAccountPage
9. React RoomServicePage (menu + panier)
10. React Header (état connecté)
11. React AdminPage (onglet commandes)
12. Tests complets
