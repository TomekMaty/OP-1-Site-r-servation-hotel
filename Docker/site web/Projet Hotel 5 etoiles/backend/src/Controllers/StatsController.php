<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Core\AdminMiddleware;
use App\Core\Response;

class StatsController
{
    public function index(): void
    {
        AdminMiddleware::require();
        $db = Database::getInstance();

        // ── Revenus par mois (6 derniers mois) ──────────────────
        $stmt = $db->query(
            'SELECT DATE_FORMAT(check_in, "%Y-%m") AS month,
                    COUNT(*) AS bookings,
                    ROUND(SUM(total_price), 2) AS revenue
             FROM bookings
             WHERE status != "cancelled"
               AND check_in >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY month
             ORDER BY month ASC'
        );
        $rawMonths = $stmt->fetchAll();

        // Formater les labels en français
        $monthsFr = ['01'=>'Jan','02'=>'Fév','03'=>'Mar','04'=>'Avr',
                     '05'=>'Mai','06'=>'Jun','07'=>'Jul','08'=>'Aoû',
                     '09'=>'Sep','10'=>'Oct','11'=>'Nov','12'=>'Déc'];
        $revenueByMonth = array_map(function($row) use ($monthsFr) {
            [, $m] = explode('-', $row['month']);
            return [
                'month'    => $monthsFr[$m] ?? $row['month'],
                'bookings' => (int)$row['bookings'],
                'revenue'  => (float)$row['revenue'],
            ];
        }, $rawMonths);

        // ── Réservations par type de chambre ─────────────────────
        $stmt2 = $db->query(
            'SELECT r.category, r.name AS room_name,
                    COUNT(*) AS bookings,
                    ROUND(SUM(b.total_price), 2) AS revenue
             FROM bookings b
             JOIN rooms r ON r.id = b.room_id
             WHERE b.status != "cancelled"
             GROUP BY r.category, r.name
             ORDER BY revenue DESC'
        );
        $byCategory = array_map(function($row) {
            return [
                'category'  => $row['category'],
                'room_name' => $row['room_name'],
                'bookings'  => (int)$row['bookings'],
                'revenue'   => (float)$row['revenue'],
            ];
        }, $stmt2->fetchAll());

        // ── Stats globales réservations ───────────────────────────
        $stmt3 = $db->query(
            'SELECT
               COUNT(*) AS total,
               SUM(status="confirmed") AS confirmed,
               SUM(status="pending")   AS pending,
               SUM(status="cancelled") AS cancelled,
               ROUND(SUM(CASE WHEN status!="cancelled" THEN total_price ELSE 0 END), 2) AS revenue
             FROM bookings'
        );
        $bs = $stmt3->fetch();
        $bookingStats = [
            'total'     => (int)$bs['total'],
            'confirmed' => (int)$bs['confirmed'],
            'pending'   => (int)$bs['pending'],
            'cancelled' => (int)$bs['cancelled'],
            'revenue'   => (float)$bs['revenue'],
        ];

        // ── Stats commandes room service ──────────────────────────
        $stmt4 = $db->query(
            'SELECT
               COUNT(*) AS total,
               SUM(status="delivered")  AS delivered,
               SUM(status IN ("pending","preparing")) AS active,
               ROUND(SUM(CASE WHEN status!="cancelled" THEN total_price ELSE 0 END), 2) AS revenue
             FROM orders'
        );
        $os = $stmt4->fetch();
        $orderStats = [
            'total'     => (int)$os['total'],
            'delivered' => (int)$os['delivered'],
            'active'    => (int)$os['active'],
            'revenue'   => (float)$os['revenue'],
        ];

        // ── Activité du jour ──────────────────────────────────────
        $stmt5 = $db->query(
            'SELECT
               (SELECT COUNT(*) FROM bookings
                WHERE check_in = CURDATE() AND status != "cancelled") AS checkins_today,
               (SELECT COUNT(*) FROM bookings
                WHERE check_out = CURDATE() AND status != "cancelled") AS checkouts_today,
               (SELECT COUNT(*) FROM orders
                WHERE DATE(created_at) = CURDATE() AND status != "cancelled") AS orders_today,
               (SELECT IFNULL(ROUND(SUM(total_price),2),0) FROM orders
                WHERE DATE(created_at) = CURDATE() AND status != "cancelled") AS room_service_today'
        );
        $today = $stmt5->fetch();

        Response::success([
            'revenue_by_month' => $revenueByMonth,
            'by_category'      => $byCategory,
            'booking_stats'    => $bookingStats,
            'order_stats'      => $orderStats,
            'today'            => [
                'checkins'         => (int)$today['checkins_today'],
                'checkouts'        => (int)$today['checkouts_today'],
                'orders'           => (int)$today['orders_today'],
                'room_service_revenue' => (float)$today['room_service_today'],
            ],
        ]);
    }
}
