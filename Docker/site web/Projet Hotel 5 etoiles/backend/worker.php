<?php

declare(strict_types=1);

/**
 * Maison Saclay — Worker Telegram
 * Tourne en continu, poll getUpdates toutes les 2s,
 * repond aux callback_query (clic bouton) instantanement.
 */

// ── Charger le .env ──────────────────────────────────────────
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        [$key, $val] = explode('=', $line, 2) + [1 => ''];
        $_ENV[trim($key)] = trim($val);
    }
}

// ── Autoloader ───────────────────────────────────────────────
spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    $base   = __DIR__ . '/src/';
    if (!str_starts_with($class, $prefix)) return;
    $file = $base . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (file_exists($file)) require_once $file;
});

use App\Config\Database;
use App\Core\Telegram;

log_worker('Worker Telegram demarre');

// ── Boucle principale ────────────────────────────────────────
while (true) {
    try {
        $updates = Telegram::getUpdates();

        if (!empty($updates)) {
            $db     = Database::getInstance();
            $chatId = trim((string)($_ENV['TELEGRAM_CHAT_ID'] ?? ''));

            foreach ($updates as $update) {
                $cb = $update['callback_query'] ?? null;
                if (!$cb) continue;

                $cbId  = (string)($cb['id'] ?? '');
                $data  = (string)($cb['data'] ?? '');
                $msgId = (int)($cb['message']['message_id'] ?? 0);
                $time  = date('H\hi');

                log_worker("Callback: data=$data msg=$msgId");

                $parts = explode(':', $data);
                if (count($parts) !== 3) {
                    Telegram::answerCallback($cbId, 'Donnees invalides');
                    if ($msgId && $chatId) {
                        Telegram::editMessage($chatId, $msgId, 'Action invalide');
                    }
                    continue;
                }

                [$type, $rawId, $action] = $parts;
                $id = (int)$rawId;

                if ($type === 'booking') {
                    handle_booking($db, $chatId, $cbId, $id, $action, $msgId, $time);
                } elseif ($type === 'order') {
                    handle_order($db, $chatId, $cbId, $id, $action, $msgId, $time);
                } else {
                    Telegram::answerCallback($cbId, 'Type inconnu');
                }
            }
        }
    } catch (\Throwable $e) {
        log_worker('ERREUR: ' . $e->getMessage());
    }

    sleep(2);
}

// ── Traitement reservation ───────────────────────────────────
function handle_booking(\PDO $db, string $chatId, string $cbId, int $id, string $action, int $msgId, string $time): void
{
    $status = match($action) {
        'confirm' => 'confirmed',
        'cancel'  => 'cancelled',
        default   => null,
    };

    if (!$status) {
        Telegram::answerCallback($cbId, 'Action inconnue');
        return;
    }

    $stmt = $db->prepare(
        'SELECT b.status, b.first_name, b.last_name, b.check_in, b.check_out, r.name AS room
         FROM bookings b
         JOIN rooms r ON r.id = b.room_id
         WHERE b.id = :id LIMIT 1'
    );
    $stmt->execute(['id' => $id]);
    $booking = $stmt->fetch();

    if (!$booking) {
        Telegram::answerCallback($cbId, 'Reservation introuvable');
        if ($msgId && $chatId) {
            Telegram::editMessage($chatId, $msgId, "Reservation #$id introuvable");
        }
        return;
    }

    if ($booking['status'] !== 'pending') {
        $emoji = $booking['status'] === 'confirmed' ? 'OK' : 'NON';
        Telegram::answerCallback($cbId, 'Deja traitee');
        if ($msgId && $chatId) {
            Telegram::editMessage(
                $chatId, $msgId,
                "Reservation #$id — statut : {$booking['status']}\n" .
                "👤 {$booking['first_name']} {$booking['last_name']}"
            );
        }
        return;
    }

    $db->prepare('UPDATE bookings SET status = :s WHERE id = :id')
       ->execute(['s' => $status, 'id' => $id]);

    $emoji   = $status === 'confirmed' ? '✅' : '❌';
    $label   = $status === 'confirmed' ? 'Confirmee' : 'Annulee';
    $guest   = $booking['first_name'] . ' ' . $booking['last_name'];
    $dateIn  = date('d/m', strtotime($booking['check_in']));
    $dateOut = date('d/m', strtotime($booking['check_out']));

    Telegram::answerCallback($cbId, "$emoji Reservation $label !");

    if ($msgId && $chatId) {
        Telegram::editMessage(
            $chatId, $msgId,
            "$emoji *Reservation #$id $label*\n" .
            "🛏 {$booking['room']}\n" .
            "👤 $guest\n" .
            "📆 $dateIn → $dateOut\n" .
            "🕐 Traite a $time"
        );
    }

    log_worker("Reservation #$id -> $status ($guest)");
}

// ── Traitement commande room service ─────────────────────────
function handle_order(\PDO $db, string $chatId, string $cbId, int $id, string $action, int $msgId, string $time): void
{
    $status = match($action) {
        'accept' => 'preparing',
        'refuse' => 'cancelled',
        default  => null,
    };

    if (!$status) {
        Telegram::answerCallback($cbId, 'Action inconnue');
        return;
    }

    $stmt = $db->prepare('SELECT status, room_number FROM orders WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $order = $stmt->fetch();

    if (!$order) {
        Telegram::answerCallback($cbId, 'Commande introuvable');
        if ($msgId && $chatId) {
            Telegram::editMessage($chatId, $msgId, "Commande #$id introuvable");
        }
        return;
    }

    if ($order['status'] !== 'pending') {
        Telegram::answerCallback($cbId, 'Deja traitee');
        if ($msgId && $chatId) {
            Telegram::editMessage(
                $chatId, $msgId,
                "Commande #$id — statut : {$order['status']}\n" .
                "📍 Chambre {$order['room_number']}"
            );
        }
        return;
    }

    $db->prepare('UPDATE orders SET status = :s WHERE id = :id')
       ->execute(['s' => $status, 'id' => $id]);

    $emoji = $status === 'preparing' ? '✅' : '❌';
    $label = $status === 'preparing' ? 'Acceptee — En preparation 👨‍🍳' : 'Refusee';

    Telegram::answerCallback($cbId, "$emoji $label !");

    if ($msgId && $chatId) {
        Telegram::editMessage(
            $chatId, $msgId,
            "$emoji *Commande #$id $label*\n" .
            "📍 Chambre {$order['room_number']}\n" .
            "🕐 Traite a $time"
        );
    }

    log_worker("Commande #$id -> $status (chambre {$order['room_number']})");
}

// ── Helper log ───────────────────────────────────────────────
function log_worker(string $msg): void
{
    echo '[' . date('H:i:s') . '] ' . $msg . PHP_EOL;
}
