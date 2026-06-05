<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;

class Room
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /** Toutes les chambres disponibles */
    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT id, slug, name, category, tagline, price, surface, max_guests,
                    floor, images, highlights, available
             FROM rooms
             ORDER BY price ASC'
        );
        return array_map([$this, 'decode'], $stmt->fetchAll());
    }

    /** Une chambre par son slug */
    public function findBySlug(string $slug): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, slug, name, category, tagline, description, price,
                    surface, max_guests, floor, images, amenities, highlights, available
             FROM rooms WHERE slug = :slug LIMIT 1'
        );
        $stmt->execute(['slug' => $slug]);
        $row = $stmt->fetch();
        return $row ? $this->decode($row) : null;
    }

    /** Vérifie si une chambre est disponible pour les dates données */
    public function isAvailable(int $roomId, string $checkIn, string $checkOut): bool
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM bookings
             WHERE room_id = :room_id
               AND status != "cancelled"
               AND check_in  < :check_out
               AND check_out > :check_in'
        );
        $stmt->execute(['room_id' => $roomId, 'check_in' => $checkIn, 'check_out' => $checkOut]);
        return (int) $stmt->fetchColumn() === 0;
    }

    /** Décode les champs JSON */
    private function decode(array $row): array
    {
        foreach (['images', 'amenities', 'highlights'] as $field) {
            if (isset($row[$field]) && is_string($row[$field])) {
                $row[$field] = json_decode($row[$field], true);
            }
        }
        $row['available']   = (bool) $row['available'];
        $row['price']       = (float) $row['price'];
        $row['surface']     = (int) $row['surface'];
        $row['max_guests']  = (int) $row['max_guests'];
        return $row;
    }
}
