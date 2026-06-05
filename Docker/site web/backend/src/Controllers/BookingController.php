<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Core\AdminMiddleware;
use App\Core\AuthMiddleware;
use App\Core\Response;
use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use DateTime;

class BookingController
{
    private Booking $model;
    private Room $roomModel;

    public function __construct()
    {
        $this->model = new Booking();
        $this->roomModel = new Room();
    }

    /** GET /api/bookings */
    public function index(): void
    {
        AdminMiddleware::require();
        Response::success($this->model->findAll());
    }

    /** POST /api/bookings */
    public function store(): void
    {
        $body = $this->getBody();
        $auth = AuthMiddleware::require();
        $user = (new User())->findById((int) $auth['user_id']);

        if (!$user) {
            Response::error('Utilisateur introuvable', 404);
            return;
        }

        $required = ['room_id', 'check_in', 'check_out', 'guests'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                Response::error("Champ requis manquant : {$field}");
                return;
            }
        }

        $checkIn = DateTime::createFromFormat('Y-m-d', $body['check_in']);
        $checkOut = DateTime::createFromFormat('Y-m-d', $body['check_out']);

        if (!$checkIn || !$checkOut || $checkOut <= $checkIn) {
            Response::error("Dates invalides : le depart doit etre apres l'arrivee");
            return;
        }

        $room = $this->roomModel->findBySlug($body['room_slug'] ?? '');
        if (!$room) {
            $stmt = Database::getInstance()->prepare('SELECT * FROM rooms WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $body['room_id']]);
            $room = $stmt->fetch();
        }

        if (!$room) {
            Response::error('Chambre introuvable');
            return;
        }

        if (!$this->roomModel->isAvailable((int) $room['id'], $body['check_in'], $body['check_out'])) {
            Response::error("Cette chambre n'est pas disponible pour ces dates", 409);
            return;
        }

        $nights = $checkIn->diff($checkOut)->days;
        $totalPrice = $nights * (float) $room['price'];

        $id = $this->model->create([
            'user_id' => $auth['user_id'],
            'room_id' => (int) $room['id'],
            'check_in' => $body['check_in'],
            'check_out' => $body['check_out'],
            'guests' => (int) $body['guests'],
            'first_name' => trim((string) $user['first_name']),
            'last_name' => trim((string) $user['last_name']),
            'email' => trim((string) $user['email']),
            'total_price' => $totalPrice,
        ]);

        Response::success([
            'id' => $id,
            'total_price' => $totalPrice,
            'nights' => $nights,
            'status' => 'pending',
        ], 'Reservation creee avec succes', 201);
    }

    /** POST /api/bookings/:id/status */
    public function updateStatus(array $params): void
    {
        AdminMiddleware::require();

        $id = (int) ($params['id'] ?? 0);
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $status = $body['status'] ?? '';

        $allowed = ['pending', 'confirmed', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            Response::error('Statut invalide. Valeurs : ' . implode(', ', $allowed));
            return;
        }

        $this->model->updateStatus($id, $status);
        Response::success(['id' => $id, 'status' => $status], 'Statut mis a jour');
    }

    private function getBody(): array
    {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
