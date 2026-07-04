-- ============================================================
-- 04-wifi-tables.sql — Tables portail captif WiFi
-- Maison Saclay — Projet OP-1
-- ============================================================

CREATE TABLE IF NOT EXISTS wifi_sessions (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    room_number     VARCHAR(10)  NOT NULL,
    phone_extension VARCHAR(10)  NOT NULL DEFAULT '',
    client_ip       VARCHAR(45)  NOT NULL DEFAULT '',
    user_agent      TEXT,
    mac_address     VARCHAR(17)  NULL COMMENT 'Nullable — non accessible via navigateur web',
    status          ENUM('active','expired','blocked') NOT NULL DEFAULT 'active',
    accepted_terms  TINYINT(1)   NOT NULL DEFAULT 0,
    connected_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    disconnected_at DATETIME     NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_room   (room_number),
    INDEX idx_status (status),
    INDEX idx_connected (connected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wifi_activity_logs (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    wifi_session_id  INT UNSIGNED NOT NULL,
    domain           VARCHAR(255) NOT NULL,
    category         VARCHAR(80)  NULL COMMENT 'Catégorie DNS ex: streaming, actualités',
    visited_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (wifi_session_id),
    CONSTRAINT fk_wifi_log_session
        FOREIGN KEY (wifi_session_id) REFERENCES wifi_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
