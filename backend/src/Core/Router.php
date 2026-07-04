<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Router — Routeur HTTP minimaliste.
 *
 * Principe : on enregistre des routes avec get/post/put,
 * puis dispatch() analyse l'URL réelle et appelle le bon handler.
 *
 * Exemple d'utilisation dans index.php :
 *   $router->get('/rooms',         fn() => (new RoomController())->index());
 *   $router->post('/bookings',     fn() => (new BookingController())->store());
 *   $router->get('/rooms/:slug',   fn($p) => (new RoomController())->show($p));
 *
 * À l'oral : "Le routeur convertit l'URL /api/rooms/deluxe en appel de
 *             RoomController::show(['slug' => 'deluxe']) grâce aux regex."
 */
class Router
{
    private array $routes = [];

    public function get(string $pattern, callable $handler): void
    {
        $this->addRoute('GET', $pattern, $handler);
    }

    public function post(string $pattern, callable $handler): void
    {
        $this->addRoute('POST', $pattern, $handler);
    }

    public function put(string $pattern, callable $handler): void
    {
        $this->addRoute('PUT', $pattern, $handler);
    }

    private function addRoute(string $method, string $pattern, callable $handler): void
    {
        // Convertit :param en groupe de capture regex nommé
        // Exemple : "/rooms/:slug" → "#^/rooms/(?P<slug>[^/]+)$#"
        // Ainsi, "/rooms/deluxe" capture {slug: "deluxe"} automatiquement
        $regex = preg_replace('/:([a-zA-Z_]+)/', '(?P<$1>[^/]+)', $pattern);
        $regex = '#^' . $regex . '$#';
        $this->routes[] = compact('method', 'regex', 'handler');
    }

    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Le frontend appelle /api/rooms — on retire le préfixe /api pour les comparaisons internes
        $uri = preg_replace('#^/api#', '', $uri) ?: '/';

        foreach ($this->routes as $route) {
            // Vérifier la méthode HTTP (GET, POST, PUT...)
            if ($route['method'] !== $method) continue;

            // Vérifier si l'URL correspond à la regex de cette route
            if (preg_match($route['regex'], $uri, $matches)) {
                // Garder seulement les paramètres nommés (clés string) — pas les index numériques
                // Exemple : ["deluxe", "slug" => "deluxe"] → ["slug" => "deluxe"]
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                call_user_func($route['handler'], $params);
                return;
            }
        }

        // Aucune route ne correspond → HTTP 404
        Response::notFound('Route not found');
    }
}
