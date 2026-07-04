-- ============================================================
-- 05-wifi-radius-sessions.sql — Sessions RADIUS du portail captif
-- Maison Saclay — Projet OP-1
-- Source : logs FreeRADIUS (auth) du portail intégré EAP330
-- Architecture : portail intégré TP-Link + RADIUS (port 18120 via relay)
-- ============================================================

CREATE TABLE IF NOT EXISTS wifi_radius_sessions (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(64)  NOT NULL COMMENT 'Identifiant RADIUS = numero de chambre',
    room_number     VARCHAR(10)  NOT NULL COMMENT 'Numero de chambre (= username si chambre valide)',
    mac_address     VARCHAR(17)  NULL COMMENT 'Calling-Station-Id envoye par la borne EAP',
    client_ip       VARCHAR(45)  NULL COMMENT 'Non fourni par RADIUS auth — best effort',
    nas_ip          VARCHAR(45)  NULL COMMENT 'IP de la borne EAP (NAS)',
    nas_identifier  VARCHAR(64)  NULL COMMENT 'Nom du client RADIUS / NAS',
    auth_status     ENUM('Access-Accept','Access-Reject') NOT NULL,
    auth_message    VARCHAR(255) NULL,
    user_agent      VARCHAR(255) NULL COMMENT 'Non disponible via RADIUS',
    auth_count      INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Nombre d auth pour ce couple chambre+MAC',
    connected_at    DATETIME     NOT NULL COMMENT 'Premiere authentification observee',
    last_seen_at    DATETIME     NOT NULL COMMENT 'Derniere authentification observee',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_room_mac_status (room_number, mac_address, auth_status),
    INDEX idx_room      (room_number),
    INDEX idx_mac       (mac_address),
    INDEX idx_status    (auth_status),
    INDEX idx_last_seen (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
