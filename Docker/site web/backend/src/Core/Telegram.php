<?php

declare(strict_types=1);

namespace App\Core;

class Telegram
{
    public static function notify(string $message): bool
    {
        $token  = $_ENV['TELEGRAM_BOT_TOKEN'] ?? '';
        $chatId = $_ENV['TELEGRAM_CHAT_ID']   ?? '';

        if (!$token || !$chatId) return false;

        $url  = "https://api.telegram.org/bot{$token}/sendMessage";
        $body = json_encode([
            'chat_id'    => $chatId,
            'text'       => $message,
            'parse_mode' => 'Markdown',
        ]);

        $ctx = stream_context_create([
            'http' => [
                'method'  => 'POST',
                'header'  => "Content-Type: application/json\r\nContent-Length: " . strlen($body) . "\r\n",
                'content' => $body,
                'timeout' => 5,
                'ignore_errors' => true,
            ],
        ]);

        $result = @file_get_contents($url, false, $ctx);
        return $result !== false;
    }

    public static function orderMessage(array $order, array $items, string $clientName): string
    {
        $lines = [];
        foreach ($items as $item) {
            $subtotal = $item['unit_price'] * $item['quantity'];
            $lines[]  = "• {$item['name']} ×{$item['quantity']} — " . number_format($subtotal, 2) . "€";
        }
        $itemsList = implode("\n", $lines);
        $total     = number_format((float)$order['total_price'], 2);
        $time      = date('H\hi', strtotime($order['created_at']));
        $note      = !empty($order['notes']) ? "\n\n💬 *Note :* _{$order['notes']}_" : '';

        return <<<MSG
🏨 *Nouvelle commande Room Service*

📍 Chambre : *{$order['room_number']}*
👤 Client : {$clientName}
🕐 {$time}

🍽 *Détail :*
{$itemsList}{$note}

💰 *Total : {$total}€*
⚡ Statut : En attente
MSG;
    }
}
