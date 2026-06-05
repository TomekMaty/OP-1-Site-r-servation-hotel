<?php

declare(strict_types=1);

namespace App\Config;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;

    private function __construct() {}

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $host = $_ENV['DB_HOST']     ?? 'mysql';
            $port = $_ENV['DB_PORT']     ?? '3306';
            $name = $_ENV['DB_NAME']     ?? 'maison_saclay';
            $user = $_ENV['DB_USER']     ?? 'saclay_user';
            $pass = $_ENV['DB_PASSWORD'] ?? throw new \RuntimeException('DB_PASSWORD manquant dans la configuration');

            $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

            try {
                self::$instance = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database connection failed']);
                exit();
            }
        }

        return self::$instance;
    }
}
