<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use App\Models\Order;
use App\Config\Database;
use App\Core\AuthMiddleware;
use App\Core\Response;

class MeController
{
    /** GET /api/me */
    public function profile(): void
    {
        $auth = AuthMiddleware::require();
        $user = (new User())->findById($auth['user_id']);

        if (!$user) { Response::error('Utilisateur introuvable', 404); return; }

        Response::success($user);
    }

    /** GET /api/me/bookings */
    public function bookings(): void
    {
        $auth = AuthMiddleware::require();
        $db   = Database::getInstance();

        $stmt = $db->prepare(
            'SELECT b.id, r.name AS room_name, r.slug AS room_slug, r.images,
                    b.check_in, b.check_out, b.guests, b.total_price, b.status, b.created_at
             FROM bookings b
             JOIN rooms r ON r.id = b.room_id
             WHERE b.user_id = :user_id
             ORDER BY b.check_in DESC'
        );
        $stmt->execute(['user_id' => $auth['user_id']]);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$row) {
            if (is_string($row['images'])) {
                $row['images'] = json_decode($row['images'], true);
            }
            $row['total_price'] = (float) $row['total_price'];
        }

        Response::success($rows);
    }

    /** GET /api/me/orders */
    public function orders(): void
    {
        $auth   = AuthMiddleware::require();
        $orders = (new Order())->findByUser($auth['user_id']);
        Response::success($orders);
    }
}
