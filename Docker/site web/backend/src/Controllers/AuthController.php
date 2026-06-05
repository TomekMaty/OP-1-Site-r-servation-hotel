<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use App\Core\JWT;
use App\Core\Response;

class AuthController
{
    private User $model;

    public function __construct()
    {
        $this->model = new User();
    }

    /** POST /api/auth/register */
    public function register(): void
    {
        $body = $this->body();

        foreach (['first_name', 'last_name', 'email', 'password'] as $field) {
            if (empty($body[$field])) {
                Response::error("Champ requis : {$field}");
                return;
            }
        }

        if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
            Response::error('Email invalide');
            return;
        }

        if (strlen($body['password']) < 6) {
            Response::error('Mot de passe trop court (6 caracteres minimum)');
            return;
        }

        if ($this->model->emailExists($body['email'])) {
            Response::error('Cette adresse email est deja utilisee', 409);
            return;
        }

        $userId = $this->model->create($body);
        $user = $this->model->findById($userId);

        Response::success([
            'token' => $this->token($userId),
            'user' => $user,
        ], 'Compte cree avec succes', 201);
    }

    /** POST /api/auth/login */
    public function login(): void
    {
        $body = $this->body();

        if (empty($body['email']) || empty($body['password'])) {
            Response::error('Email et mot de passe requis');
            return;
        }

        $user = $this->model->findByEmail(strtolower(trim($body['email'])));

        if (!$user || !password_verify($body['password'], $user['password_hash'])) {
            Response::error('Email ou mot de passe incorrect', 401);
            return;
        }

        unset($user['password_hash']);

        Response::success([
            'token' => $this->token((int) $user['id']),
            'user' => $user,
        ], 'Connexion reussie');
    }

    /** POST /api/auth/admin/login */
    public function adminLogin(): void
    {
        $body = $this->body();
        $password = (string) ($body['password'] ?? '');
        $expected = trim((string) ($_ENV['ADMIN_PASSWORD'] ?? ''));

        if ($expected === '') {
            Response::error('ADMIN_PASSWORD manquant dans la configuration', 500);
            return;
        }

        if ($password === '' || !hash_equals($expected, $password)) {
            Response::error('Mot de passe administrateur incorrect', 401);
            return;
        }

        try {
            $token = JWT::encode(['user_id' => 0, 'role' => 'admin'], JWT::getSecret());
        } catch (\RuntimeException $e) {
            Response::error($e->getMessage(), 500);
            return;
        }

        Response::success(['token' => $token], 'Connexion administrateur reussie');
    }

    private function token(int $userId): string
    {
        return JWT::encode(['user_id' => $userId, 'role' => 'user'], JWT::getSecret());
    }

    private function body(): array
    {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
