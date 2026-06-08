<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Core\Telegram;

class TelegramController
{
    /**
     * GET /api/telegram/action?k=HASH&type=order|booking&id=N&action=accept|refuse|confirm|cancel
     * Appelé quand l'admin clique un bouton dans Telegram.
     * Retourne une page HTML de confirmation.
     */
    public function action(): void
    {
        // Headers HTML (pas JSON)
        header('Content-Type: text/html; charset=UTF-8');

        $k      = trim((string)($_GET['k']      ?? ''));
        $type   = trim((string)($_GET['type']   ?? ''));
        $id     = (int)($_GET['id']             ?? 0);
        $action = trim((string)($_GET['action'] ?? ''));

        // ── Validation du hash ────────────────────────────────────
        $expected = Telegram::actionHash($type, $id, $action);
        if (!hash_equals($expected, $k)) {
            echo self::page('❌ Lien invalide', 'red', 'Ce lien est invalide ou a expiré.');
            return;
        }

        if ($id <= 0 || !in_array($type, ['order','booking'], true)) {
            echo self::page('❌ Paramètres invalides', 'red', 'Requête malformée.');
            return;
        }

        $db     = Database::getInstance();
        $chatId = trim((string)($_ENV['TELEGRAM_CHAT_ID'] ?? ''));

        // ── Traitement commande ───────────────────────────────────
        if ($type === 'order') {
            if (!in_array($action, ['accept','refuse'], true)) {
                echo self::page('❌ Action inconnue', 'red', 'Action non reconnue.');
                return;
            }
            $status = $action === 'accept' ? 'preparing' : 'cancelled';

            $stmt = $db->prepare('SELECT status, room_number, telegram_msg_id FROM orders WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $order = $stmt->fetch();

            if (!$order) {
                echo self::page('❌ Introuvable', 'red', "Commande #{$id} introuvable.");
                return;
            }
            if (!in_array($order['status'], ['pending'], true)) {
                echo self::page(
                    '⚠️ Déjà traitée',
                    'orange',
                    "Commande #{$id} déjà {$order['status']}. Statut inchangé.",
                    'orange'
                );
                return;
            }

            // Mettre à jour en base
            $db->prepare('UPDATE orders SET status = :s WHERE id = :id')
               ->execute(['s' => $status, 'id' => $id]);

            $emoji    = $action === 'accept' ? '✅' : '❌';
            $label    = $action === 'accept' ? 'Acceptée — En préparation 👨‍🍳' : 'Refusée ❌';
            $time     = date('H\hi');

            // ── Éditer le message Telegram : enlever les boutons ──
            if ($order['telegram_msg_id'] && $chatId) {
                Telegram::editMessage(
                    $chatId,
                    (int)$order['telegram_msg_id'],
                    $emoji . ' *Commande ' . $label . '*' . "\n" .
                    '📍 Chambre *' . $order['room_number'] . '* · #{' . $id . '}' . "\n" .
                    '🕐 Traité à ' . $time
                );
            }

            echo self::page(
                "{$emoji} {$label}",
                $action === 'accept' ? 'green' : 'red',
                "Commande #{$id} · Chambre {$order['room_number']}\nLe message Telegram a été mis à jour."
            );
            return;
        }

        // ── Traitement réservation ────────────────────────────────
        if ($type === 'booking') {
            if (!in_array($action, ['confirm','cancel'], true)) {
                echo self::page('❌ Action inconnue', 'red', 'Action non reconnue.');
                return;
            }
            $status = $action === 'confirm' ? 'confirmed' : 'cancelled';

            $stmt = $db->prepare(
                'SELECT b.status, b.first_name, b.last_name, b.telegram_msg_id,
                        b.check_in, b.check_out, r.name AS room
                 FROM bookings b JOIN rooms r ON r.id = b.room_id
                 WHERE b.id = :id LIMIT 1'
            );
            $stmt->execute(['id' => $id]);
            $booking = $stmt->fetch();

            if (!$booking) {
                echo self::page('❌ Introuvable', 'red', "Réservation #{$id} introuvable.");
                return;
            }
            if ($booking['status'] !== 'pending') {
                echo self::page(
                    '⚠️ Déjà traitée',
                    'orange',
                    "Réservation #{$id} déjà {$booking['status']}.",
                    'orange'
                );
                return;
            }

            $db->prepare('UPDATE bookings SET status = :s WHERE id = :id')
               ->execute(['s' => $status, 'id' => $id]);

            $emoji    = $action === 'confirm' ? '✅' : '❌';
            $label    = $action === 'confirm' ? 'Confirmée ✅' : 'Annulée ❌';
            $guest    = $booking['first_name'] . ' ' . $booking['last_name'];
            $room     = $booking['room'];
            $dateIn   = date('d/m', strtotime($booking['check_in']));
            $dateOut  = date('d/m', strtotime($booking['check_out']));
            $time     = date('H\hi');

            // ── Éditer le message Telegram : enlever les boutons ──
            if ($booking['telegram_msg_id'] && $chatId) {
                Telegram::editMessage(
                    $chatId,
                    (int)$booking['telegram_msg_id'],
                    $emoji . ' *Réservation ' . $label . '*' . "\n" .
                    '🛏 ' . $room . "\n" .
                    '👤 ' . $guest . "\n" .
                    '📆 ' . $dateIn . ' → ' . $dateOut . "\n" .
                    '🕐 Traité à ' . $time
                );
            }

            echo self::page(
                "{$emoji} Réservation {$label}",
                $action === 'confirm' ? 'green' : 'red',
                "#{$id} · {$guest} · {$room}\nLe message Telegram a été mis à jour."
            );
            return;
        }

        echo self::page('❌ Erreur', 'red', 'Requête invalide.');
    }

    // ── Page HTML de confirmation (simple et propre) ──────────────
    private static function page(string $title, string $color, string $body, string $colorOverride = ''): string
    {
        $colors = [
            'green'  => '#2D6A4F',
            'red'    => '#C0392B',
            'orange' => '#D35400',
        ];
        $hex = $colors[$colorOverride ?: $color] ?? '#1C1C1C';
        $bodyHtml = nl2br(htmlspecialchars($body));
        $date = date('d/m/Y à H:i');

        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Maison Saclay — Admin</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #F5F0E8;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    background: white;
    max-width: 400px;
    width: 100%;
    padding: 40px 32px;
    text-align: center;
    box-shadow: 0 2px 20px rgba(0,0,0,0.08);
  }
  .hotel { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #C9A96E; margin-bottom: 24px; }
  .icon { font-size: 48px; margin-bottom: 16px; }
  h1 { font-size: 20px; font-weight: 400; color: $hex; margin-bottom: 12px; }
  p { font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 24px; }
  .time { font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; margin-top: 8px; }
  a { display: inline-block; margin-top: 16px; padding: 10px 24px; background: #1C1C1C; color: white; text-decoration: none; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; }
</style>
</head>
<body>
<div class="card">
  <p class="hotel">Maison Saclay · Administration</p>
  <div class="icon">{$title}</div>
  <p>{$bodyHtml}</p>
  <p class="time">Action enregistrée le {$date}</p>
</div>
</body>
</html>
HTML;
    }

    /**
     * GET /api/telegram/poll
     * Récupère les callback_query en attente et les traite.
     * Appelé automatiquement par le frontend admin.
     */
    public function poll(): void
    {
        \App\Core\AdminMiddleware::require();
        header('Content-Type: application/json; charset=UTF-8');

        $updates   = \App\Core\Telegram::getUpdates();
        $db        = Database::getInstance();
        $chatId    = trim((string)($_ENV['TELEGRAM_CHAT_ID'] ?? ''));
        $processed = [];

        foreach ($updates as $update) {
            $cb = $update['callback_query'] ?? null;
            if (!$cb) continue;

            $cbId  = (string)($cb['id'] ?? '');
            $data  = (string)($cb['data'] ?? '');
            $msgId = (int)($cb['message']['message_id'] ?? 0);
            $time  = date('H\hi');

            // Format attendu : "type:id:action"
            $parts = explode(':', $data);
            if (count($parts) !== 3) {
                \App\Core\Telegram::answerCallback($cbId, '⚠️ Données invalides');
                // Supprimer les boutons même en cas d'erreur
                if ($msgId && $chatId) {
                    \App\Core\Telegram::editMessage($chatId, $msgId, "⚠️ Action invalide");
                }
                continue;
            }

            [$type, $rawId, $action] = $parts;
            $id = (int)$rawId;

            if ($type === 'booking') {
                $status = match($action) {
                    'confirm' => 'confirmed',
                    'cancel'  => 'cancelled',
                    default   => null,
                };
                if (!$status) continue;

                $stmt = $db->prepare(
                    'SELECT b.status, b.first_name, b.last_name, b.check_in, b.check_out, r.name AS room
                     FROM bookings b JOIN rooms r ON r.id = b.room_id
                     WHERE b.id = :id LIMIT 1'
                );
                $stmt->execute(['id' => $id]);
                $booking = $stmt->fetch();

                if (!$booking) {
                    \App\Core\Telegram::answerCallback($cbId, '⚠️ Réservation introuvable');
                    if ($msgId && $chatId) {
                        \App\Core\Telegram::editMessage($chatId, $msgId, "⚠️ Réservation #{$id} introuvable");
                    }
                    continue;
                }

                if ($booking['status'] !== 'pending') {
                    $emoji = $booking['status'] === 'confirmed' ? '✅' : '❌';
                    \App\Core\Telegram::answerCallback($cbId, "{$emoji} Déjà traitée");
                    // Supprimer quand même les boutons restants
                    if ($msgId && $chatId) {
                        \App\Core\Telegram::editMessage(
                            $chatId, $msgId,
                            "{$emoji} *Réservation #{$id}*\n👤 {$booking['first_name']} {$booking['last_name']}\nStatut : {$booking['status']}"
                        );
                    }
                    continue;
                }

                $db->prepare('UPDATE bookings SET status = :s WHERE id = :id')
                   ->execute(['s' => $status, 'id' => $id]);

                $emoji = $status === 'confirmed' ? '✅' : '❌';
                $label = $status === 'confirmed' ? 'Confirmée' : 'Annulée';
                $guest = $booking['first_name'] . ' ' . $booking['last_name'];
                $dateIn  = date('d/m', strtotime($booking['check_in']));
                $dateOut = date('d/m', strtotime($booking['check_out']));

                \App\Core\Telegram::answerCallback($cbId, "{$emoji} Réservation {$label} !");

                if ($msgId && $chatId) {
                    \App\Core\Telegram::editMessage(
                        $chatId, $msgId,
                        "{$emoji} *Réservation #{$id} {$label}*\n" .
                        "🛏 {$booking['room']}\n" .
                        "👤 {$guest}\n" .
                        "📆 {$dateIn} → {$dateOut}\n" .
                        "🕐 Traité à {$time}"
                    );
                }

                $processed[] = ['type' => 'booking', 'id' => $id, 'status' => $status];

            } elseif ($type === 'order') {
                $status = match($action) {
                    'accept' => 'preparing',
                    'refuse' => 'cancelled',
                    default  => null,
                };
                if (!$status) continue;

                $stmt = $db->prepare('SELECT status, room_number FROM orders WHERE id = :id LIMIT 1');
                $stmt->execute(['id' => $id]);
                $order = $stmt->fetch();

                if (!$order) {
                    \App\Core\Telegram::answerCallback($cbId, '⚠️ Commande introuvable');
                    if ($msgId && $chatId) {
                        \App\Core\Telegram::editMessage($chatId, $msgId, "⚠️ Commande #{$id} introuvable");
                    }
                    continue;
                }

                if ($order['status'] !== 'pending') {
                    $emoji = $order['status'] === 'preparing' ? '✅' : '❌';
                    \App\Core\Telegram::answerCallback($cbId, "{$emoji} Déjà traitée");
                    if ($msgId && $chatId) {
                        \App\Core\Telegram::editMessage(
                            $chatId, $msgId,
                            "{$emoji} *Commande #{$id}*\n📍 Chambre {$order['room_number']}\nStatut : {$order['status']}"
                        );
                    }
                    continue;
                }

                $db->prepare('UPDATE orders SET status = :s WHERE id = :id')
                   ->execute(['s' => $status, 'id' => $id]);

                $emoji = $status === 'preparing' ? '✅' : '❌';
                $label = $status === 'preparing' ? 'Acceptée — En préparation 👨‍🍳' : 'Refusée';

                \App\Core\Telegram::answerCallback($cbId, "{$emoji} {$label}");

                if ($msgId && $chatId) {
                    \App\Core\Telegram::editMessage(
                        $chatId, $msgId,
                        "{$emoji} *Commande #{$id} {$label}*\n" .
                        "📍 Chambre {$order['room_number']}\n" .
                        "🕐 Traité à {$time}"
                    );
                }

                $processed[] = ['type' => 'order', 'id' => $id, 'status' => $status];
            }
        }

        echo json_encode(['ok' => true, 'processed' => $processed, 'count' => count($processed)]);
    }

    /**
     * GET /api/telegram/setup
     */
    public function setup(): void
    {
        header('Content-Type: application/json; charset=UTF-8');
        $webhookUrl = trim((string)($_GET['url'] ?? ''));
        if (!$webhookUrl) {
            $info = Telegram::getWebhookInfo();
            echo json_encode(['ok' => true, 'data' => $info]);
            return;
        }
        $result = Telegram::setWebhook($webhookUrl);
        echo json_encode(['ok' => true, 'data' => $result]);
    }
}
