<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use App\Models\Order;
use App\Config\Database;
use App\Core\AdminMiddleware;
use App\Core\AuthMiddleware;
use App\Core\MailService;
use App\Core\Response;

/**
 * MeController — Espace personnel du client connecté.
 *
 * Routes :
 *   GET  /api/me           → profil de l'utilisateur connecté
 *   GET  /api/me/bookings  → ses réservations
 *   GET  /api/me/orders    → ses commandes room service
 *   PUT  /api/me/email     → mettre à jour son adresse e-mail
 *   POST /api/admin/mail-test → envoyer un e-mail de test (admin uniquement)
 *
 * Toutes les routes GET/PUT nécessitent un token JWT client valide.
 * mail-test nécessite un token JWT admin.
 *
 * À l'oral : "Ce controller donne accès à l'espace client.
 *             La route PUT /me/email est utilisée par la modal d'e-mail
 *             pour les comptes qui n'en avaient pas encore."
 */
class MeController
{
    /** GET /api/me — Retourne le profil de l'utilisateur connecté. */
    public function profile(): void
    {
        $auth = AuthMiddleware::require();
        $user = (new User())->findById($auth['user_id']);

        if (!$user) { Response::error('Utilisateur introuvable', 404); return; }

        Response::success($user);
    }

    /** GET /api/me/bookings — Retourne toutes les réservations du client, avec chambre physique. */
    public function bookings(): void
    {
        $auth = AuthMiddleware::require();
        $db   = Database::getInstance();

        $stmt = $db->prepare(
            'SELECT b.id, r.name AS room_name, r.slug AS room_slug, r.images,
                    b.check_in, b.check_out, b.guests, b.total_price, b.status, b.created_at,
                    pr.room_number, pr.floor
             FROM bookings b
             JOIN rooms r ON r.id = b.room_id
             LEFT JOIN physical_rooms pr ON pr.id = b.physical_room_id
             WHERE b.user_id = :user_id
             ORDER BY b.check_in DESC'
        );
        $stmt->execute(['user_id' => $auth['user_id']]);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$row) {
            if (is_string($row['images'])) {
                $row['images'] = json_decode($row['images'], true);
            }
            $row['total_price'] = (float) $row['total_price'];
        }

        Response::success($rows);
    }

    /** GET /api/me/orders */
    public function orders(): void
    {
        $auth   = AuthMiddleware::require();
        $orders = (new Order())->findByUser($auth['user_id']);
        Response::success($orders);
    }

    /**
     * PUT /api/me/email — Met à jour l'adresse e-mail du client connecté.
     *
     * Utilisé par la pop-up frontend pour les comptes sans e-mail ou pour modifier l'adresse.
     * Vérifie que le format est valide et que l'adresse n'est pas déjà prise.
     */
    public function updateEmail(): void
    {
        $auth  = AuthMiddleware::require();
        $body  = json_decode(file_get_contents('php://input'), true) ?? [];
        $email = strtolower(trim((string) ($body['email'] ?? '')));

        if ($email === '') {
            Response::error('Email requis');
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Format email invalide');
            return;
        }

        $model = new User();

        // Vérifie que l'email n'est pas déjà utilisé par un autre compte
        $existing = $model->findByEmail($email);
        if ($existing && (int) $existing['id'] !== (int) $auth['user_id']) {
            Response::error('Cette adresse email est deja utilisee', 409);
            return;
        }

        $db = Database::getInstance();
        $db->prepare('UPDATE users SET email = :email WHERE id = :id')
           ->execute(['email' => $email, 'id' => $auth['user_id']]);

        Response::success(['email' => $email], 'Email mis a jour');
    }

    /**
     * POST /api/admin/mail-test — Envoi d'un email de test (admin uniquement).
     *
     * Body JSON : { "to": "email@exemple.com" }
     *
     * Nécessite un token admin dans le header Authorization.
     * Utilisation POST (et non GET) pour éviter le déclenchement accidentel via un lien.
     */
    public function mailTest(): void
    {
        AdminMiddleware::require();

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $to   = trim((string) ($body['to'] ?? ''));

        if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            Response::error('Champ "to" manquant ou invalide dans le body JSON');
            return;
        }

        $ok = MailService::send(
            $to,
            'Test SMTP — Maison Saclay',
            "Bonjour,\n\nCe message confirme que la configuration SMTP de Maison Saclay fonctionne correctement.\n\nDate du test : " . date('d/m/Y a H:i') . "\n\nCordialement,\nMaison Saclay"
        );

        if ($ok) {
            Response::success(['to' => $to, 'sent' => true], 'Email de test envoye avec succes');
        } else {
            Response::success(['to' => $to, 'sent' => false], 'Email ignore — configurez SMTP_USER/SMTP_PASSWORD dans .env');
        }
    }
}
