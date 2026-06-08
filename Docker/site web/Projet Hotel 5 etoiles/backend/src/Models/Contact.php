<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;

class Contact
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT id, first_name, last_name, email, subject, created_at, read_at
             FROM contacts ORDER BY created_at DESC'
        );
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO contacts (first_name, last_name, email, phone, subject, message)
             VALUES (:first_name, :last_name, :email, :phone, :subject, :message)'
        );
        $stmt->execute([
            'first_name' => $data['first_name'],
            'last_name'  => $data['last_name'],
            'email'      => $data['email'],
            'phone'      => $data['phone'] ?? null,
            'subject'    => $data['subject'],
            'message'    => $data['message'],
        ]);
        return (int) $this->db->lastInsertId();
    }
}
