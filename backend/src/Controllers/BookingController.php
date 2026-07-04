<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Core\AdminMiddleware;
use App\Core\AuthMiddleware;
use App\Core\MailService;
use App\Core\Response;
use App\Core\Telegram;
use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use DateTime;

/**
 * BookingController — Gestion des réservations hôtel.
 *
 * Routes :
 *   GET  /api/bookings          → liste toutes les réservations (admin)
 *   POST /api/bookings          → crée une réservation (client connecté)
 *   POST /api/bookings/:id/status → met à jour le statut (admin)
 *
 * Flux complet d'une réservation :
 *   1. Le client choisit une chambre et des dates dans le frontend React.
 *   2. Le frontend envoie POST /api/bookings avec son token JWT.
 *   3. Ce controller vérifie les dates, trouve une chambre physique libre,
 *      calcule le total, insère en base et envoie une notification Telegram.
 *   4. L'admin confirme ou annule via Telegram ou l'onglet Réservations.
 */
class BookingController
{
    private Booking $model;
    private Room $roomModel;

    public function __construct()
    {
        $this->model     = new Booking();
        $this->roomModel = new Room();
    }

    /**
     * GET /api/bookings — Admin uniquement.
     * Retourne toutes les réservations avec le numéro de chambre physique attribué.
     */
    public function index(): void
    {
        AdminMiddleware::require();
        Response::success($this->model->findAll());
    }

    /**
     * POST /api/bookings — Client connecté.
     *
     * Étapes :
     *   1. Vérifie le JWT utilisateur.
     *   2. Valide les champs obligatoires et les dates.
     *   3. Vérifie que la chambre (type) est disponible.
     *   4. Attribue automatiquement une chambre physique libre.
     *   5. Calcule le prix total (nuits × tarif).
     *   6. Insère la réservation en base MySQL.
     *   7. Notifie l'admin via Telegram avec boutons Confirmer/Annuler.
     */
    public function store(): void
    {
        $body = $this->getBody();

        // Vérification du token JWT — identifie le client connecté
        $auth = AuthMiddleware::require();
        $user = (new User())->findById((int) $auth['user_id']);

        if (!$user) {
            Response::error('Utilisateur introuvable', 404);
            return;
        }

        // Validation des champs obligatoires
        $required = ['room_id', 'check_in', 'check_out', 'guests'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                Response::error("Champ requis manquant : {$field}");
                return;
            }
        }

        // Validation des dates : le départ doit être après l'arrivée
        $checkIn  = DateTime::createFromFormat('Y-m-d', $body['check_in']);
        $checkOut = DateTime::createFromFormat('Y-m-d', $body['check_out']);

        if (!$checkIn || !$checkOut || $checkOut <= $checkIn) {
            Response::error("Dates invalides : le depart doit etre apres l'arrivee");
            return;
        }

        // Récupération de la chambre (type de chambre, pas la chambre physique)
        $room = $this->roomModel->findBySlug($body['room_slug'] ?? '');
        if (!$room) {
            // Fallback : recherche par ID si le slug n'est pas fourni
            $stmt = Database::getInstance()->prepare('SELECT * FROM rooms WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $body['room_id']]);
            $room = $stmt->fetch();
        }

        if (!$room) {
            Response::error('Chambre introuvable');
            return;
        }

        // Attribution automatique d'une chambre physique (ex: 201, 202, 203)
        // parmi les chambres du même type non encore réservées sur ces dates
        $db           = Database::getInstance();
        $physicalRoom = $this->findAvailablePhysicalRoom(
            $db,
            (int) $room['id'],
            $body['check_in'],
            $body['check_out']
        );

        if (!$physicalRoom) {
            Response::error("Aucune chambre physique disponible pour ces dates (complet)", 409);
            return;
        }

        // Calcul du prix total : nombre de nuits × prix par nuit
        $nights     = $checkIn->diff($checkOut)->days;
        $totalPrice = $nights * (float) $room['price'];

        // Insertion en base MySQL
        $id = $this->model->create([
            'user_id'          => $auth['user_id'],
            'room_id'          => (int) $room['id'],
            'physical_room_id' => (int) $physicalRoom['id'],
            'check_in'         => $body['check_in'],
            'check_out'        => $body['check_out'],
            'guests'           => (int) $body['guests'],
            'first_name'       => trim((string) $user['first_name']),
            'last_name'        => trim((string) $user['last_name']),
            'email'            => trim((string) $user['email']),
            'total_price'      => $totalPrice,
        ]);

        $roomNumber     = $physicalRoom['room_number'];
        $phoneExtension = $physicalRoom['phone_extension'] ?? '';

        // Notification Telegram à l'admin avec boutons interactifs
        $clientName = trim($user['first_name'] . ' ' . $user['last_name']);
        $msg = Telegram::bookingMessage(
            $id,
            (string) $room['name'],
            $clientName,
            (string) $user['email'],
            $body['check_in'],
            $body['check_out'],
            (int) $body['guests'],
            $totalPrice,
            $nights,
            $roomNumber
        );
        $tgMsgId = Telegram::sendWithKeyboard($msg, [[
            ['text' => '✅ Confirmer', 'callback_data' => "booking:{$id}:confirm"],
            ['text' => '❌ Annuler',   'callback_data' => "booking:{$id}:cancel"],
        ]]);

        // Sauvegarde de l'identifiant Telegram pour pouvoir modifier le message plus tard
        if ($tgMsgId) {
            $db->prepare('UPDATE bookings SET telegram_msg_id = :mid WHERE id = :id')
               ->execute(['mid' => $tgMsgId, 'id' => $id]);
        }

        // Email de confirmation au client
        $clientEmail = trim((string) $user['email']);
        if ($clientEmail !== '') {
            $bodyClient = "Bonjour {$clientName},\n\n"
                . "Votre réservation a bien été enregistrée.\n\n"
                . "Récapitulatif :\n"
                . "  - N° réservation : #{$id}\n"
                . "  - Chambre        : {$room['name']} (n° {$roomNumber})\n"
                . "  - Arrivée        : {$body['check_in']}\n"
                . "  - Départ         : {$body['check_out']}\n"
                . "  - Durée          : {$nights} nuit(s)\n"
                . "  - Voyageurs      : {$body['guests']}\n"
                . "  - Total          : " . number_format($totalPrice, 2, ',', ' ') . " €\n"
                . "  - Statut         : En attente de confirmation\n\n"
                . "Cordialement,\nMaison Saclay";
            MailService::send($clientEmail, "Confirmation de votre réservation #{$id}", $bodyClient);
        }

        // Email de notification à la réception/admin
        $adminEmail = MailService::adminEmail();
        if ($adminEmail !== '') {
            $bodyAdmin = "Nouvelle réservation reçue.\n\n"
                . "  - N° réservation : #{$id}\n"
                . "  - Client         : {$clientName} ({$clientEmail})\n"
                . "  - Chambre        : {$room['name']} (n° {$roomNumber})\n"
                . "  - Arrivée        : {$body['check_in']}\n"
                . "  - Départ         : {$body['check_out']}\n"
                . "  - Durée          : {$nights} nuit(s)\n"
                . "  - Voyageurs      : {$body['guests']}\n"
                . "  - Total          : " . number_format($totalPrice, 2, ',', ' ') . " €\n";
            MailService::send($adminEmail, "Nouvelle réservation #{$id} — {$clientName}", $bodyAdmin);
        }

        // Réponse au frontend : id, prix, statut, numéro de chambre attribué
        Response::success([
            'id'              => $id,
            'total_price'     => $totalPrice,
            'nights'          => $nights,
            'status'          => 'pending',
            'room_number'     => $roomNumber,
            'phone_extension' => $phoneExtension,
        ], 'Reservation creee avec succes', 201);
    }

    /**
     * POST /api/bookings/:id/status — Admin uniquement.
     * Permet de passer une réservation à : pending / confirmed / cancelled.
     */
    public function updateStatus(array $params): void
    {
        AdminMiddleware::require();

        $id     = (int) ($params['id'] ?? 0);
        $body   = json_decode(file_get_contents('php://input'), true) ?? [];
        $status = $body['status'] ?? '';

        $allowed = ['pending', 'confirmed', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            Response::error('Statut invalide. Valeurs : ' . implode(', ', $allowed));
            return;
        }

        $this->model->updateStatus($id, $status);

        // Synchroniser le message Telegram si le statut est définitif (pas pending)
        // Cela supprime les boutons du message même quand l'admin agit depuis le dashboard.
        if (in_array($status, ['confirmed', 'cancelled'], true)) {
            $db   = Database::getInstance();
            $stmt = $db->prepare(
                'SELECT b.telegram_msg_id, b.first_name, b.last_name,
                        b.check_in, b.check_out,
                        COALESCE(r.name, \'Chambre\') AS room
                 FROM bookings b
                 LEFT JOIN rooms r ON r.id = b.room_id
                 WHERE b.id = :id LIMIT 1'
            );
            $stmt->execute(['id' => $id]);
            $booking = $stmt->fetch();

            if ($booking && $booking['telegram_msg_id']) {
                $chatId = trim((string)($_ENV['TELEGRAM_CHAT_ID'] ?? ''));
                if ($chatId) {
                    $emoji   = $status === 'confirmed' ? '✅' : '❌';
                    $label   = $status === 'confirmed' ? 'Confirmée' : 'Annulée';
                    $guest   = $booking['first_name'] . ' ' . $booking['last_name'];
                    $dateIn  = date('d/m', strtotime($booking['check_in']));
                    $dateOut = date('d/m', strtotime($booking['check_out']));
                    Telegram::editMessage(
                        $chatId,
                        (int) $booking['telegram_msg_id'],
                        "$emoji *Réservation #$id $label*\n" .
                        "🛏 {$booking['room']}\n" .
                        "👤 $guest\n" .
                        "📆 $dateIn → $dateOut\n" .
                        "🕐 Via dashboard admin"
                    );
                }
            }
        }

        Response::success(['id' => $id, 'status' => $status], 'Statut mis a jour');
    }

    /**
     * Trouve la première chambre physique disponible du bon type pour les dates données.
     *
     * Logique SQL :
     *   - Prend toutes les chambres du type demandé (room_type_id).
     *   - Exclut celles dont une réservation non annulée chevauche les dates.
     *   - Retourne la première chambre libre par ordre de numéro.
     *
     * Condition de chevauchement : check_in < date_sortie ET check_out > date_arrivée
     * (couvre tous les cas : partiel avant, partiel après, englobant, englobé)
     */
    private function findAvailablePhysicalRoom(\PDO $db, int $roomTypeId, string $checkIn, string $checkOut): ?array
    {
        $stmt = $db->prepare(
            'SELECT pr.id, pr.room_number, pr.floor, pr.phone_extension
             FROM physical_rooms pr
             WHERE pr.room_type_id = :type_id
               AND pr.id NOT IN (
                 SELECT b.physical_room_id
                 FROM bookings b
                 WHERE b.physical_room_id IS NOT NULL
                   AND b.status != "cancelled"
                   AND b.check_in  < :check_out
                   AND b.check_out > :check_in
               )
             ORDER BY pr.room_number ASC
             LIMIT 1'
        );
        $stmt->execute([
            'type_id'   => $roomTypeId,
            'check_in'  => $checkIn,
            'check_out' => $checkOut,
        ]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** Lit le corps JSON de la requête HTTP. */
    private function getBody(): array
    {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
