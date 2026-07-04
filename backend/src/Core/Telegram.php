<?php

declare(strict_types=1);

namespace App\Core;

class Telegram
{
    private static string $offsetFile = '/var/www/backend/tg_offset';

    // ── Méthode interne HTTP ──────────────────────────────────────
    private static function call(string $method, array $payload): ?array
    {
        $token = trim((string)($_ENV['TELEGRAM_BOT_TOKEN'] ?? ''));
        if (!$token) return null;

        $body = json_encode($payload, JSON_UNESCAPED_UNICODE);
        $url  = "https://api.telegram.org/bot{$token}/{$method}";

        $ctx = stream_context_create([
            'http' => [
                'method'        => 'POST',
                'header'        => "Content-Type: application/json\r\nContent-Length: " . strlen($body) . "\r\n",
                'content'       => $body,
                'timeout'       => 6,
                'ignore_errors' => true,
            ],
        ]);

        $result = @file_get_contents($url, false, $ctx);
        return $result ? (json_decode($result, true) ?? null) : null;
    }

    // ── Envoyer un message simple ─────────────────────────────────
    public static function notify(string $message): bool
    {
        $chatId = trim((string)($_ENV['TELEGRAM_CHAT_ID'] ?? ''));
        if (!$chatId) return false;

        $res = self::call('sendMessage', [
            'chat_id'    => $chatId,
            'text'       => $message,
            'parse_mode' => 'Markdown',
        ]);
        return ($res['ok'] ?? false) === true;
    }

    // ── Envoyer un message avec boutons inline (callback_data) ────
    public static function sendWithKeyboard(string $message, array $keyboard): ?int
    {
        $chatId = trim((string)($_ENV['TELEGRAM_CHAT_ID'] ?? ''));
        if (!$chatId) return null;

        $res = self::call('sendMessage', [
            'chat_id'      => $chatId,
            'text'         => $message,
            'parse_mode'   => 'Markdown',
            'reply_markup' => ['inline_keyboard' => $keyboard],
        ]);

        if ($res['ok'] ?? false) {
            return (int)($res['result']['message_id'] ?? 0) ?: null;
        }
        return null;
    }

    // ── Récupérer les updates en attente (callback_query) ─────────
    public static function getUpdates(): array
    {
        // Si le fichier offset n'existe pas (premier démarrage ou après suppression),
        // on initialise l'offset au dernier update connu pour ne PAS re-traiter
        // les anciens callbacks qui ont déjà été gérés dans les sessions précédentes.
        if (!file_exists(self::$offsetFile)) {
            $res = self::call('getUpdates', [
                'offset'          => -1,
                'limit'           => 1,
                'timeout'         => 0,
                'allowed_updates' => ['callback_query'],
            ]);
            $latest = $res['result'] ?? [];
            $startOffset = !empty($latest) ? (end($latest)['update_id'] + 1) : 1;
            file_put_contents(self::$offsetFile, $startOffset);
            return [];
        }

        $offset = (int)file_get_contents(self::$offsetFile);

        $res = self::call('getUpdates', [
            'offset'          => $offset,
            'limit'           => 50,
            'timeout'         => 0,
            'allowed_updates' => ['callback_query'],
        ]);

        $updates = $res['result'] ?? [];

        // Avancer l'offset pour acquitter les updates récupérés
        if (!empty($updates)) {
            $lastId = end($updates)['update_id'];
            file_put_contents(self::$offsetFile, $lastId + 1);
        }

        return $updates;
    }

    // ── Répondre à un callback (ferme le spinner sur le bouton) ───
    public static function answerCallback(string $callbackQueryId, string $text = ''): void
    {
        self::call('answerCallbackQuery', [
            'callback_query_id' => $callbackQueryId,
            'text'              => $text,
            'show_alert'        => false,
        ]);
    }

    // ── Éditer un message existant (enlever boutons + texte) ──────
    public static function editMessage(string $chatId, int $messageId, string $newText): void
    {
        self::call('editMessageText', [
            'chat_id'      => $chatId,
            'message_id'   => $messageId,
            'text'         => $newText,
            'parse_mode'   => 'Markdown',
            'reply_markup' => ['inline_keyboard' => []],
        ]);
    }

    // ── Générer un hash d'action sécurisé ────────────────────────
    public static function actionHash(string $type, int $id, string $action): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? 'fallback';
        return substr(hash_hmac('sha256', "{$type}:{$id}:{$action}", $secret), 0, 16);
    }

    // ── Construire l'URL d'action (fallback navigateur) ───────────
    public static function actionUrl(string $type, int $id, string $action): string
    {
        $base = rtrim((string)($_ENV['APP_URL'] ?? 'http://localhost'), '/');
        $k    = self::actionHash($type, $id, $action);
        return "{$base}/api/telegram/action?k={$k}&type={$type}&id={$id}&action={$action}";
    }

    // ── Configurer le webhook ─────────────────────────────────────
    public static function setWebhook(string $url): array
    {
        return self::call('setWebhook', ['url' => $url]) ?? ['ok' => false];
    }

    public static function getWebhookInfo(): array
    {
        return self::call('getWebhookInfo', []) ?? [];
    }

    // ── Construire le message commande ────────────────────────────
    public static function orderMessage(array $order, array $items, string $clientName): string
    {
        $lines = [];
        foreach ($items as $item) {
            $sub     = number_format((float)$item['unit_price'] * (int)$item['quantity'], 0, ',', ' ');
            $lines[] = "• {$item['name']} ×{$item['quantity']} — {$sub}€";
        }
        $total = number_format((float)$order['total_price'], 0, ',', ' ');
        $time  = date('H\hi', strtotime($order['created_at'] ?? 'now'));
        $note  = !empty($order['notes']) ? "\n\n💬 *Note :* _{$order['notes']}_" : '';

        return
            "🛎 *Nouvelle commande Room Service*\n\n" .
            "📍 Chambre : *{$order['room_number']}*\n" .
            "👤 {$clientName}\n" .
            "🕐 {$time}\n\n" .
            "🍽 *Commande :*\n" . implode("\n", $lines) .
            $note . "\n\n" .
            "💰 *Total : {$total}€*";
    }

    // ── Construire le message réservation ─────────────────────────
    public static function bookingMessage(
        int    $bookingId,
        string $roomName,
        string $clientName,
        string $email,
        string $checkIn,
        string $checkOut,
        int    $guests,
        float  $total,
        int    $nights,
        string $roomNumber = ''
    ): string {
        $totalFmt = number_format($total, 0, ',', ' ');
        $dateIn   = date('d/m/Y', strtotime($checkIn));
        $dateOut  = date('d/m/Y', strtotime($checkOut));
        $roomLine = $roomNumber ? "\n🔑 *Chambre attribuée : {$roomNumber}*" : '';

        return
            "📅 *Nouvelle réservation #{$bookingId}*\n\n" .
            "🛏 *{$roomName}*{$roomLine}\n" .
            "👤 {$clientName} ({$email})\n" .
            "📆 {$dateIn} → {$dateOut}\n" .
            "🌙 {$nights} nuit" . ($nights > 1 ? 's' : '') . " · {$guests} pers.\n\n" .
            "💰 *Total : {$totalFmt}€*\n" .
            "⏳ En attente de confirmation";
    }
}
