<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;

class WifiSession
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT id, first_name, last_name, room_number, phone_extension,
                    client_ip, user_agent, mac_address, status,
                    accepted_terms, connected_at, disconnected_at, created_at
             FROM wifi_sessions
             ORDER BY connected_at DESC
             LIMIT 200'
        );
        return $stmt->fetchAll();
    }

    public function findWithLogs(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT s.*, GROUP_CONCAT(l.domain ORDER BY l.visited_at SEPARATOR ",") AS domains
             FROM wifi_sessions s
             LEFT JOIN wifi_activity_logs l ON l.wifi_session_id = s.id
             WHERE s.id = ?
             GROUP BY s.id'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function stats(): array
    {
        $stmt = $this->db->query(
            'SELECT
                COUNT(*) AS total,
                SUM(status = "active")  AS active,
                SUM(status = "expired") AS expired,
                SUM(status = "blocked") AS blocked
             FROM wifi_sessions'
        );
        return $stmt->fetch();
    }
}
