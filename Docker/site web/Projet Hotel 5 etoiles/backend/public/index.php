<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    $base = __DIR__ . '/../src/';

    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $file = $base . str_replace('\\', '/', $relative) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#')) {
            continue;
        }

        [$key, $val] = explode('=', $line, 2) + [1 => ''];
        $_ENV[trim($key)] = trim($val);
    }
}

use App\Controllers\AuthController;
use App\Controllers\BookingController;
use App\Controllers\ContactController;
use App\Controllers\InventoryController;
use App\Controllers\MeController;
use App\Controllers\MenuController;
use App\Controllers\OrderController;
use App\Controllers\RoomController;
use App\Controllers\StatsController;
use App\Controllers\TelegramController;
use App\Core\Router;

$router = new Router();

$router->get('/rooms', fn() => (new RoomController())->index());
$router->get('/rooms/:slug', fn($p) => (new RoomController())->show($p));

$router->get('/bookings', fn() => (new BookingController())->index());
$router->post('/bookings', fn() => (new BookingController())->store());
$router->post('/bookings/:id/status', fn($p) => (new BookingController())->updateStatus($p));

$router->get('/contacts', fn() => (new ContactController())->index());
$router->post('/contacts', fn() => (new ContactController())->store());

$router->post('/auth/register', fn() => (new AuthController())->register());
$router->post('/auth/login', fn() => (new AuthController())->login());
$router->post('/auth/admin/login', fn() => (new AuthController())->adminLogin());

$router->get('/menu', fn() => (new MenuController())->index());

// Inventaire chambres (admin)
$router->get('/admin/inventory', fn() => (new InventoryController())->index());

// Stats dashboard (admin)
$router->get('/admin/stats', fn() => (new StatsController())->index());

$router->get('/orders', fn() => (new OrderController())->index());
$router->post('/orders', fn() => (new OrderController())->store());
$router->post('/orders/:id/status', fn($p) => (new OrderController())->updateStatus($p));

$router->get('/me', fn() => (new MeController())->profile());
$router->get('/me/bookings', fn() => (new MeController())->bookings());
$router->get('/me/orders', fn() => (new MeController())->orders());

// Telegram
$router->post('/telegram/webhook', fn() => (new TelegramController())->webhook());
$router->get('/telegram/setup',    fn() => (new TelegramController())->setup());
$router->get('/telegram/action',   fn() => (new TelegramController())->action());
$router->get('/telegram/poll',     fn() => (new TelegramController())->poll());

$router->get('/health', fn() => \App\Core\Response::success([
    'status' => 'ok',
    'service' => 'Maison Saclay API',
]));

$router->dispatch();
