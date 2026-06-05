-- ============================================================
-- Maison Saclay — Schéma base de données
-- ============================================================

CREATE DATABASE IF NOT EXISTS maison_saclay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE maison_saclay;

-- ── Chambres ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(100)  NOT NULL UNIQUE,
  name        VARCHAR(150)  NOT NULL,
  category    ENUM('chambre','suite','penthouse') NOT NULL,
  tagline     VARCHAR(255)  NOT NULL,
  description TEXT          NOT NULL,
  price       DECIMAL(8,2)  NOT NULL,
  surface     INT UNSIGNED  NOT NULL,
  max_guests  TINYINT UNSIGNED NOT NULL DEFAULT 2,
  floor       VARCHAR(60)   NOT NULL,
  images      JSON          NOT NULL,
  amenities   JSON          NOT NULL,
  highlights  JSON          NOT NULL,
  available   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Réservations ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED  NULL,
  room_id     INT UNSIGNED  NOT NULL,
  check_in    DATE          NOT NULL,
  check_out   DATE          NOT NULL,
  guests      TINYINT UNSIGNED NOT NULL DEFAULT 2,
  first_name  VARCHAR(80)   NOT NULL,
  last_name   VARCHAR(80)   NOT NULL,
  email       VARCHAR(150)  NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status      ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  notes       TEXT,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ── Messages de contact ────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(80)  NOT NULL,
  last_name  VARCHAR(80)  NOT NULL,
  email      VARCHAR(150) NOT NULL,
  phone      VARCHAR(30),
  subject    VARCHAR(150) NOT NULL,
  message    TEXT         NOT NULL,
  read_at    TIMESTAMP    NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Comptes clients ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(80)  NOT NULL,
  last_name     VARCHAR(80)  NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Lier les réservations aux comptes (optionnel) ─────────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NULL AFTER id;

-- ── Menu room service ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT         NOT NULL,
  price       DECIMAL(8,2) NOT NULL,
  category    ENUM('brunch','plat','boisson','dessert') NOT NULL,
  image_url   VARCHAR(500),
  available   TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ── Commandes room service ─────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  booking_id  INT UNSIGNED NULL,
  room_number VARCHAR(20)  NOT NULL,
  status      ENUM('pending','preparing','delivered','cancelled') NOT NULL DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE RESTRICT,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Lignes de commande ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
  order_id     INT UNSIGNED     NOT NULL,
  menu_item_id INT UNSIGNED     NOT NULL,
  quantity     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  unit_price   DECIMAL(8,2)     NOT NULL,
  FOREIGN KEY (order_id)     REFERENCES orders(id)     ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
