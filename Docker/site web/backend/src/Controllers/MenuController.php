<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\MenuItem;
use App\Core\Response;

class MenuController
{
    private MenuItem $model;

    public function __construct()
    {
        $this->model = new MenuItem();
    }

    /** GET /api/menu */
    public function index(): void
    {
        $items = $this->model->findAll();

        // Grouper par catégorie
        $grouped = [];
        foreach ($items as $item) {
            $grouped[$item['category']][] = $item;
        }

        Response::success($grouped);
    }
}
