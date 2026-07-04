<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Core\AdminMiddleware;
use App\Core\AuthMiddleware;
use App\Core\MailService;
use App\Core\Response;
use App\Core\Telegram;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;

/**
 * OrderController — Room service : commandes de repas depuis les chambres.
 *
 * Routes :
 *   GET  /api/orders              → liste toutes les commandes (admin)
 *   POST /api/orders              → crée une commande (client connecté)
 *   POST /api/orders/:id/status   → met à jour le statut (admin)
 *
 * Flux d'une commande room service :
 *   1. Le client (connecté) choisit des plats dans la page Restaurant du frontend.
 *   2. POST /api/orders est envoyé avec la liste des articles.
 *   3. Ce controller retrouve automatiquement le numéro de chambre du client
 *      depuis sa réservation active en base MySQL.
 *   4. Le total est calculé, la commande est insérée en base.
 *   5. Une notification Telegram est envoyée à l'admin avec boutons Accepter/Refuser.
 *   6. L'admin change le statut : pending → preparing → delivered.
 */
class OrderController
{
    private Order $model;
    private MenuItem $menuModel;

    public function __construct()
    {
        $this->model     = new Order();
        $this->menuModel = new MenuItem();
    }

    /**
     * GET /api/orders — Admin uniquement.
     * Retourne toutes les commandes avec leurs articles et statuts.
     */
    public function index(): void
    {
        AdminMiddleware::require();
        Response::success($this->model->findAll());
    }

    /**
     * POST /api/orders — Client connecté.
     *
     * Étapes :
     *   1. Vérifie le JWT du client.
     *   2. Trouve automatiquement sa chambre depuis sa réservation active.
     *   3. Valide chaque article commandé (existence + disponibilité).
     *   4. Calcule le total.
     *   5. Insère la commande et ses lignes en base.
     *   6. Notifie l'admin via Telegram.
     */
    public function store(): void
    {
        // Vérification du token JWT — identifie le client connecté
        $auth = AuthMiddleware::require();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($body['items']) || !is_array($body['items'])) {
            Response::error('La commande doit contenir au moins un article');
            return;
        }

        // Recherche automatique du numéro de chambre via la réservation active
        $db            = Database::getInstance();
        $activeBooking = $this->findActiveBooking($db, (int) $auth['user_id']);
        $roomNumber    = null;
        $bookingId     = null;

        if ($activeBooking) {
            // Cas normal : le client a une réservation en cours → chambre automatique
            $roomNumber = $activeBooking['room_number'];
            $bookingId  = (int) $activeBooking['booking_id'];
        } elseif (!empty($body['room_number'])) {
            // Fallback : le client fournit manuellement son numéro de chambre
            $roomNumber = trim($body['room_number']);
        } else {
            Response::error("Aucune réservation active trouvée. Veuillez contacter la réception.");
            return;
        }

        // Validation et calcul du total pour chaque article commandé
        $total     = 0.0;
        $validated = [];

        foreach ($body['items'] as $line) {
            $qty  = max(1, (int) ($line['quantity'] ?? 1));
            $item = $this->menuModel->findById((int) ($line['menu_item_id'] ?? 0));

            if (!$item || !$item['available']) {
                Response::error('Article introuvable ou indisponible');
                return;
            }

            $total      += $item['price'] * $qty;
            $validated[] = ['item' => $item, 'qty' => $qty];
        }

        // Insertion de la commande principale en base
        $orderId = $this->model->create([
            'user_id'     => $auth['user_id'],
            'booking_id'  => $bookingId,
            'room_number' => $roomNumber,
            'total_price' => $total,
            'notes'       => $body['notes'] ?? null,
        ]);

        // Insertion des lignes de commande (un INSERT par article)
        foreach ($validated as $line) {
            $this->model->addItem($orderId, (int) $line['item']['id'], $line['qty'], $line['item']['price']);
        }

        // Récupération de la commande complète pour la notification
        $order = $this->model->findById($orderId);
        $user  = (new User())->findById($auth['user_id']);
        $name  = "{$user['first_name']} {$user['last_name']}";

        // Notification Telegram à l'admin avec boutons interactifs
        $msg   = Telegram::orderMessage($order, $order['items'], $name);
        $msgId = Telegram::sendWithKeyboard($msg, [[
            ['text' => '✅ Accepter', 'callback_data' => "order:{$orderId}:accept"],
            ['text' => '❌ Refuser',  'callback_data' => "order:{$orderId}:refuse"],
        ]]);

        // Sauvegarde de l'identifiant Telegram pour édition ultérieure du message
        if ($msgId) {
            $db->prepare('UPDATE orders SET telegram_msg_id = :mid WHERE id = :id')
               ->execute(['mid' => $msgId, 'id' => $orderId]);
        }

        // Email de confirmation au client
        $clientEmail = trim((string) ($user['email'] ?? ''));
        if ($clientEmail !== '') {
            $itemLines = '';
            foreach ($validated as $line) {
                $itemLines .= "  - {$line['item']['name']} × {$line['qty']} — "
                    . number_format($line['item']['price'] * $line['qty'], 2, ',', ' ') . " €\n";
            }
            $bodyClient = "Bonjour {$name},\n\n"
                . "Votre commande room service a bien été enregistrée.\n\n"
                . "Récapitulatif :\n"
                . "  - N° commande    : #{$orderId}\n"
                . "  - Chambre        : {$roomNumber}\n"
                . "  - Date           : " . date('d/m/Y à H:i') . "\n"
                . "  - Statut         : En attente\n\n"
                . "Articles commandés :\n{$itemLines}"
                . "\n  Total : " . number_format($total, 2, ',', ' ') . " €\n\n"
                . "Cordialement,\nMaison Saclay";
            MailService::send($clientEmail, "Confirmation de votre commande #{$orderId}", $bodyClient);
        }

        // Email de notification à la réception/admin
        $adminEmail = MailService::adminEmail();
        if ($adminEmail !== '') {
            $itemLines = '';
            foreach ($validated as $line) {
                $itemLines .= "  - {$line['item']['name']} × {$line['qty']}\n";
            }
            $bodyAdmin = "Nouvelle commande room service reçue.\n\n"
                . "  - N° commande : #{$orderId}\n"
                . "  - Client      : {$name} ({$clientEmail})\n"
                . "  - Chambre     : {$roomNumber}\n"
                . "  - Date        : " . date('d/m/Y à H:i') . "\n\n"
                . "Articles :\n{$itemLines}"
                . "\n  Total : " . number_format($total, 2, ',', ' ') . " €\n";
            MailService::send($adminEmail, "Nouvelle commande #{$orderId} — Chambre {$roomNumber}", $bodyAdmin);
        }

        Response::success([
            'id'          => $orderId,
            'total_price' => $total,
            'status'      => 'pending',
        ], 'Commande passee avec succes', 201);
    }

    /**
     * POST /api/orders/:id/status — Admin uniquement.
     * Statuts possibles : pending → preparing → delivered (ou cancelled).
     */
    public function updateStatus(array $params): void
    {
        AdminMiddleware::require();

        $id     = (int) ($params['id'] ?? 0);
        $body   = json_decode(file_get_contents('php://input'), true) ?? [];
        $status = $body['status'] ?? '';

        $allowed = ['pending', 'preparing', 'delivered', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            Response::error('Statut invalide : ' . implode(', ', $allowed));
            return;
        }

        $this->model->updateStatus($id, $status);
        Response::success(['id' => $id, 'status' => $status], 'Statut mis a jour');
    }

    /**
     * Cherche la réservation active de l'utilisateur pour aujourd'hui.
     *
     * Conditions :
     *   - La réservation doit être pending ou confirmed (pas annulée).
     *   - check_in <= aujourd'hui < check_out (le client est actuellement dans l'hôtel).
     *   - Une chambre physique doit être attribuée (physical_room_id non NULL).
     *
     * Retourne le numéro de chambre physique (ex: "201") et l'id de réservation.
     */
    private function findActiveBooking(\PDO $db, int $userId): ?array
    {
        $stmt = $db->prepare(
            'SELECT b.id AS booking_id, pr.room_number
             FROM bookings b
             JOIN physical_rooms pr ON pr.id = b.physical_room_id
             WHERE b.user_id = :user_id
               AND b.status IN ("pending", "confirmed")
               AND b.check_in  <= CURDATE()
               AND b.check_out >  CURDATE()
             ORDER BY b.check_in DESC
             LIMIT 1'
        );
        $stmt->execute(['user_id' => $userId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}
