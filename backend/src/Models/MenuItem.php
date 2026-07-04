<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;

class MenuItem
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT id, name, description, price, category, image_url, available, sort_order
             FROM menu_items WHERE available = 1 ORDER BY sort_order ASC'
        );
        return array_map([$this, 'cast'], $stmt->fetchAll());
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM menu_items WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? $this->cast($row) : null;
    }

    private function cast(array $row): array
    {
        $row['price']      = (float) $row['price'];
        $row['available']  = (bool)  $row['available'];
        $row['sort_order'] = (int)   $row['sort_order'];
        return $row;
    }
}
