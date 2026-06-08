<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\AdminMiddleware;
use App\Core\AuthMiddleware;
use App\Core\Response;
use App\Models\Contact;
use App\Models\User;

class ContactController
{
    private Contact $model;

    public function __construct()
    {
        $this->model = new Contact();
    }

    /** GET /api/contacts */
    public function index(): void
    {
        AdminMiddleware::require();
        Response::success($this->model->findAll());
    }

    /** POST /api/contacts */
    public function store(): void
    {
        $auth = AuthMiddleware::require();
        $user = (new User())->findById((int) $auth['user_id']);
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        if (!$user) {
            Response::error('Utilisateur introuvable', 404);
            return;
        }

        $required = ['subject', 'message'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                Response::error("Champ requis manquant : {$field}");
                return;
            }
        }

        if (mb_strlen(trim($body['message'])) < 20) {
            Response::error('Message trop court (20 caracteres minimum)');
            return;
        }

        $id = $this->model->create([
            'first_name' => trim((string) $user['first_name']),
            'last_name' => trim((string) $user['last_name']),
            'email' => trim((string) $user['email']),
            'phone' => $body['phone'] ?? null,
            'subject' => trim($body['subject']),
            'message' => trim($body['message']),
        ]);

        Response::success(['id' => $id], 'Message envoye avec succes', 201);
    }
}
