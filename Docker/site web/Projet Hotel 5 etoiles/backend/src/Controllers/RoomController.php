<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\Room;
use App\Core\Response;

class RoomController
{
    private Room $model;

    public function __construct()
    {
        $this->model = new Room();
    }

    /** GET /api/rooms */
    public function index(): void
    {
        $rooms = $this->model->findAll();
        Response::success($rooms);
    }

    /** GET /api/rooms/:slug */
    public function show(array $params): void
    {
        $slug = $params['slug'] ?? '';
        $room = $this->model->findBySlug($slug);

        if (!$room) {
            Response::notFound("Chambre introuvable : {$slug}");
            return;
        }

        Response::success($room);
    }
}
