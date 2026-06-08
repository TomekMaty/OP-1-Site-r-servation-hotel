<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;

class Order
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO orders (user_id, booking_id, room_number, total_price, notes, status)
             VALUES (:user_id, :booking_id, :room_number, :total_price, :notes, "pending")'
        );
        $stmt->execute([
            'user_id'     => $data['user_id'],
            'booking_id'  => $data['booking_id'] ?? null,
            'room_number' => trim($data['room_number']),
            'total_price' => $data['total_price'],
            'notes'       => $data['notes'] ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function addItem(int $orderId, int $menuItemId, int $qty, float $unitPrice): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES (:order_id, :menu_item_id, :quantity, :unit_price)'
        );
        $stmt->execute([
            'order_id'     => $orderId,
            'menu_item_id' => $menuItemId,
            'quantity'     => $qty,
            'unit_price'   => $unitPrice,
        ]);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT o.*, u.first_name, u.last_name FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $order = $stmt->fetch();
        if (!$order) return null;

        $order['items'] = $this->getItems($id);
        return $order;
    }

    public function findByUser(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM orders WHERE user_id = :user_id ORDER BY created_at DESC'
        );
        $stmt->execute(['user_id' => $userId]);
        $orders = $stmt->fetchAll();

        foreach ($orders as &$order) {
            $order['items'] = $this->getItems((int)$order['id']);
            $order['total_price'] = (float) $order['total_price'];
        }
        return $orders;
    }

    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT o.*, u.first_name, u.last_name, u.email
             FROM orders o JOIN users u ON u.id = o.user_id
             ORDER BY o.created_at DESC'
        );
        $orders = $stmt->fetchAll();
        foreach ($orders as &$order) {
            $order['items'] = $this->getItems((int)$order['id']);
            $order['total_price'] = (float) $order['total_price'];
        }
        return $orders;
    }

    public function updateStatus(int $id, string $status): void
    {
        $stmt = $this->db->prepare('UPDATE orders SET status = :status WHERE id = :id');
        $stmt->execute(['status' => $status, 'id' => $id]);
    }

    private function getItems(int $orderId): array
    {
        $stmt = $this->db->prepare(
            'SELECT oi.quantity, oi.unit_price, mi.name, mi.category, mi.image_url
             FROM order_items oi JOIN menu_items mi ON mi.id = oi.menu_item_id
             WHERE oi.order_id = :order_id'
        );
        $stmt->execute(['order_id' => $orderId]);
        return array_map(function($row) {
            $row['unit_price'] = (float) $row['unit_price'];
            $row['quantity']   = (int)   $row['quantity'];
            return $row;
        }, $stmt->fetchAll());
    }
}
