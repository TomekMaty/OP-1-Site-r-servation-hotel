<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;

class Booking
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT b.id, r.name AS room_name, b.first_name, b.last_name,
                    b.email, b.check_in, b.check_out, b.guests,
                    b.total_price, b.status, b.created_at
             FROM bookings b
             JOIN rooms r ON r.id = b.room_id
             ORDER BY b.created_at DESC'
        );

        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO bookings
             (user_id, room_id, physical_room_id, check_in, check_out, guests,
              first_name, last_name, email, total_price, status)
             VALUES
             (:user_id, :room_id, :physical_room_id, :check_in, :check_out, :guests,
              :first_name, :last_name, :email, :total_price, "pending")'
        );

        $stmt->execute([
            'user_id'          => $data['user_id']          ?? null,
            'room_id'          => $data['room_id'],
            'physical_room_id' => $data['physical_room_id'] ?? null,
            'check_in'         => $data['check_in'],
            'check_out'        => $data['check_out'],
            'guests'           => $data['guests'],
            'first_name'       => $data['first_name'],
            'last_name'        => $data['last_name'],
            'email'            => $data['email'],
            'total_price'      => $data['total_price'],
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function updateStatus(int $id, string $status): void
    {
        $stmt = $this->db->prepare('UPDATE bookings SET status = :status WHERE id = :id');
        $stmt->execute(['status' => $status, 'id' => $id]);
    }
}
