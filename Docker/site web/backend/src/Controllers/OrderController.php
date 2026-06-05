<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\AdminMiddleware;
use App\Core\AuthMiddleware;
use App\Core\Response;
use App\Core\Telegram;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;

class OrderController
{
    private Order $model;
    private MenuItem $menuModel;

    public function __construct()
    {
        $this->model = new Order();
        $this->menuModel = new MenuItem();
    }

    /** GET /api/orders */
    public function index(): void
    {
        AdminMiddleware::require();
        Response::success($this->model->findAll());
    }

    /** POST /api/orders */
    public function store(): void
    {
        $auth = AuthMiddleware::require();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($body['room_number'])) {
            Response::error('Numero de chambre requis');
            return;
        }

        if (empty($body['items']) || !is_array($body['items'])) {
            Response::error('La commande doit contenir au moins un article');
            return;
        }

        $total = 0.0;
        $validated = [];

        foreach ($body['items'] as $line) {
            $qty = max(1, (int) ($line['quantity'] ?? 1));
            $item = $this->menuModel->findById((int) ($line['menu_item_id'] ?? 0));

            if (!$item || !$item['available']) {
                Response::error('Article introuvable ou indisponible');
                return;
            }

            $total += $item['price'] * $qty;
            $validated[] = ['item' => $item, 'qty' => $qty];
        }

        $orderId = $this->model->create([
            'user_id' => $auth['user_id'],
            'booking_id' => $body['booking_id'] ?? null,
            'room_number' => $body['room_number'],
            'total_price' => $total,
            'notes' => $body['notes'] ?? null,
        ]);

        foreach ($validated as $line) {
            $this->model->addItem($orderId, (int) $line['item']['id'], $line['qty'], $line['item']['price']);
        }

        $order = $this->model->findById($orderId);
        $user = (new User())->findById($auth['user_id']);
        $name = "{$user['first_name']} {$user['last_name']}";

        Telegram::notify(Telegram::orderMessage($order, $order['items'], $name));

        Response::success([
            'id' => $orderId,
            'total_price' => $total,
            'status' => 'pending',
        ], 'Commande passee avec succes', 201);
    }

    /** POST /api/orders/:id/status */
    public function updateStatus(array $params): void
    {
        AdminMiddleware::require();

        $id = (int) ($params['id'] ?? 0);
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $status = $body['status'] ?? '';

        $allowed = ['pending', 'preparing', 'delivered', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            Response::error('Statut invalide : ' . implode(', ', $allowed));
            return;
        }

        $this->model->updateStatus($id, $status);
        Response::success(['id' => $id, 'status' => $status], 'Statut mis a jour');
    }
}
