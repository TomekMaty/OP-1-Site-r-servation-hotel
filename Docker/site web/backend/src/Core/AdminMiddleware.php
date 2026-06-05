<?php

declare(strict_types=1);

namespace App\Core;

class AdminMiddleware
{
    public static function require(): array
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (!str_starts_with($header, 'Bearer ')) {
            Response::error('Authentification administrateur requise', 401);
            exit();
        }

        try {
            $data = JWT::decode(substr($header, 7), JWT::getSecret());
        } catch (\RuntimeException $e) {
            Response::error($e->getMessage(), 500);
            exit();
        }

        if (!$data || ($data['role'] ?? null) !== 'admin') {
            Response::error('Accès administrateur refusé', 403);
            exit();
        }

        return $data;
    }
}
