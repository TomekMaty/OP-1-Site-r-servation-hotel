-- ============================================================
-- wifi_radius_activity_logs — Activité réseau clients WiFi (RADIUS)
-- Indépendant de l'ancien portail custom (wifi_activity_logs).
-- Source réelle : logs DNS ou firewall (non connecté pour soutenance)
-- Source démo   : données marquées is_demo=1
-- ============================================================

CREATE TABLE IF NOT EXISTS wifi_radius_activity_logs (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_number    VARCHAR(10)  NOT NULL,
    mac_address    VARCHAR(17)  NULL,
    client_ip      VARCHAR(45)  NULL,
    domain         VARCHAR(255) NULL,
    destination_ip VARCHAR(45)  NULL,
    protocol       ENUM('DNS','HTTP','HTTPS','OTHER') NOT NULL DEFAULT 'DNS',
    log_source     ENUM('dns','firewall','demo')      NOT NULL DEFAULT 'demo',
    is_demo        TINYINT(1)   NOT NULL DEFAULT 0,
    visited_at     DATETIME     NOT NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_room_visited (room_number, visited_at),
    KEY idx_visited      (visited_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
