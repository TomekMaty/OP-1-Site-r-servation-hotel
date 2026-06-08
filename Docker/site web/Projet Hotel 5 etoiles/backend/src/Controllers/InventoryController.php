<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Core\AdminMiddleware;
use App\Core\Response;

class InventoryController
{
    /** GET /api/admin/inventory */
    public function index(): void
    {
        AdminMiddleware::require();

        $db = Database::getInstance();

        // ── 1. Toutes les chambres physiques + type ───────────────
        $stmt = $db->query(
            'SELECT pr.id, pr.room_number, pr.floor, pr.room_type_id,
                    r.name AS type_name, r.category, r.price, r.images
             FROM physical_rooms pr
             JOIN rooms r ON r.id = pr.room_type_id
             ORDER BY r.id ASC, pr.room_number ASC'
        );
        $physicalRooms = $stmt->fetchAll();

        // ── 2. Réservations actives/futures (non annulées) ────────
        $stmt2 = $db->query(
            'SELECT b.id, b.room_id, b.first_name, b.last_name, b.email,
                    b.check_in, b.check_out, b.guests, b.status, b.total_price
             FROM bookings b
             WHERE b.status != "cancelled"
               AND b.check_out >= CURDATE()
             ORDER BY b.room_id ASC, b.check_in ASC'
        );
        $bookings = $stmt2->fetchAll();

        // Grouper par type de chambre
        $byType = [];
        foreach ($bookings as $b) {
            $byType[(int)$b['room_id']][] = $b;
        }

        // ── 3. Assigner les réservations aux chambres physiques ───
        // Compteur d'index par type (booking #0 → chambre physique #1 du type, etc.)
        $idx = [];
        $today = date('Y-m-d');

        $rooms = [];
        foreach ($physicalRooms as $pr) {
            $typeId = (int)$pr['room_type_id'];

            if (!isset($idx[$typeId])) $idx[$typeId] = 0;

            $booking = $byType[$typeId][$idx[$typeId]] ?? null;
            if ($booking) $idx[$typeId]++;

            // Image de couverture
            $images = is_string($pr['images']) ? json_decode($pr['images'], true) : ($pr['images'] ?? []);
            $cover  = $images[0] ?? null;

            // Statut calculé
            $status = 'available';
            if ($booking) {
                if ($booking['check_in'] <= $today && $booking['check_out'] > $today) {
                    $status = 'occupied';
                } elseif ($booking['check_in'] === $today) {
                    $status = 'checkin_today';
                } elseif ($booking['check_out'] === $today) {
                    $status = 'checkout_today';
                } elseif ($booking['check_in'] > $today) {
                    $daysUntil = (int)ceil((strtotime($booking['check_in']) - strtotime($today)) / 86400);
                    $status = $daysUntil <= 3 ? 'arriving_soon' : 'booked';
                }
            }

            $rooms[] = [
                'id'          => (int)$pr['id'],
                'room_number' => $pr['room_number'],
                'floor'       => $pr['floor'],
                'type_id'     => $typeId,
                'type_name'   => $pr['type_name'],
                'category'    => $pr['category'],
                'price'       => (float)$pr['price'],
                'cover'       => $cover,
                'status'      => $status,
                'booking'     => $booking ? [
                    'id'            => (int)$booking['id'],
                    'first_name'    => $booking['first_name'],
                    'last_name'     => $booking['last_name'],
                    'email'         => $booking['email'],
                    'check_in'      => $booking['check_in'],
                    'check_out'     => $booking['check_out'],
                    'guests'        => (int)$booking['guests'],
                    'status'        => $booking['status'],
                    'total_price'   => (float)$booking['total_price'],
                    'nights'        => (int)ceil(
                        (strtotime($booking['check_out']) - strtotime($booking['check_in'])) / 86400
                    ),
                    'days_remaining' => $booking['check_out'] > $today
                        ? (int)ceil((strtotime($booking['check_out']) - strtotime($today)) / 86400)
                        : 0,
                ] : null,
            ];
        }

        // ── 4. Stats globales ─────────────────────────────────────
        $stats = [
            'total'     => count($rooms),
            'available' => count(array_filter($rooms, fn($r) => $r['status'] === 'available')),
            'occupied'  => count(array_filter($rooms, fn($r) => in_array($r['status'], ['occupied','checkin_today','checkout_today']))),
            'booked'    => count(array_filter($rooms, fn($r) => in_array($r['status'], ['booked','arriving_soon']))),
        ];
        $stats['occupancy_rate'] = round($stats['occupied'] / max($stats['total'], 1) * 100);

        // ── 5. Revenu actif (séjours en cours ou à venir) ─────────
        $stats['active_revenue'] = array_sum(array_map(
            fn($r) => $r['booking'] ? (float)$r['booking']['total_price'] : 0.0,
            $rooms
        ));

        Response::success(['rooms' => $rooms, 'stats' => $stats]);
    }
}
