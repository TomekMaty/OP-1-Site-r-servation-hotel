-- ============================================================
-- Maison Saclay — Chambres physiques + extensions téléphoniques
-- Chargé automatiquement par Docker au 1er démarrage (initdb.d)
-- ============================================================
USE maison_saclay;

-- ── Table des chambres physiques ──────────────────────────────
CREATE TABLE IF NOT EXISTS physical_rooms (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_type_id   INT UNSIGNED NOT NULL,
  room_number    VARCHAR(10)  NOT NULL UNIQUE,
  floor          INT          NOT NULL DEFAULT 1,
  phone_extension VARCHAR(10) NOT NULL,
  FOREIGN KEY (room_type_id) REFERENCES rooms(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ── Colonnes manquantes dans bookings ─────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS physical_room_id INT UNSIGNED NULL AFTER room_id,
  ADD COLUMN IF NOT EXISTS telegram_msg_id  BIGINT       NULL AFTER notes;

-- ── 9 chambres physiques avec postes téléphoniques ────────────
-- room_type_id 1 = Chambre Déluxe Jardin (3 chambres, 1er étage)
-- room_type_id 2 = Suite Panoramique     (3 suites,   2ème étage)
-- room_type_id 3 = Penthouse Saclay      (3 penthouses, 6ème étage)
INSERT IGNORE INTO physical_rooms (room_type_id, room_number, floor, phone_extension) VALUES
  -- Chambres Déluxe — Étage 1
  (1, '101', 1, '1001'),
  (1, '102', 1, '1002'),
  (1, '103', 1, '1003'),
  -- Suites Panoramiques — Étage 2
  (2, '201', 2, '1004'),
  (2, '202', 2, '1005'),
  (2, '203', 2, '1006'),
  -- Penthouses — Étage 6
  (3, '601', 6, '1007'),
  (3, '602', 6, '1008'),
  (3, '603', 6, '1009');
