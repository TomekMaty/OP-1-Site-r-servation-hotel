<?php

declare(strict_types=1);

namespace App\Core;

class AuthMiddleware
{
    /**
     * VÃ©rifie le JWT dans Authorization: Bearer <token>
     * Retourne le payload ou stoppe avec 401.
     */
    public static function require(): array
    {
        $data = self::optional();

        if (!$data || empty($data['user_id']) || ($data['role'] ?? 'user') !== 'user') {
            Response::error('Token invalide ou expirÃ©', 401);
            exit();
        }

        return $data;
    }

    public static function optional(): ?array
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (!str_starts_with($header, 'Bearer ')) {
            return null;
        }

        try {
            return JWT::decode(substr($header, 7), JWT::getSecret());
        } catch (\RuntimeException $e) {
            return null;
        }
    }
}
