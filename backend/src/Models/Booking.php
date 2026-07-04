<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;

/**
 * Booking — Modèle des réservations hôtel.
 *
 * Table MySQL : bookings
 *
 * Colonnes principales :
 *   id, user_id, room_id, physical_room_id, check_in, check_out,
 *   guests, first_name, last_name, email, total_price,
 *   status (pending/confirmed/cancelled), telegram_msg_id, created_at
 *
 * Relation avec physical_rooms :
 *   Chaque réservation est liée à une chambre physique précise (ex: chambre 201).
 *   C'est différent du "type de chambre" (rooms) qui est le catalogue affiché en ligne.
 */
class Booking
{
    private PDO $db;

    public function __construct()
    {
        // Connexion à MySQL via le singleton PDO (une seule connexion par requête)
        $this->db = Database::getInstance();
    }

    /**
     * Retourne toutes les réservations pour l'admin, avec :
     *   - le nom du type de chambre (JOIN rooms)
     *   - le numéro de chambre physique attribuée (LEFT JOIN physical_rooms)
     *   - l'extension téléphonique de la chambre (pour appeler la réception)
     *
     * Triées par date de création, plus récentes en premier.
     */
    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT b.id, r.name AS room_name, b.first_name, b.last_name,
                    b.email, b.check_in, b.check_out, b.guests,
                    b.total_price, b.status, b.created_at,
                    pr.room_number, pr.phone_extension
             FROM bookings b
             JOIN rooms r ON r.id = b.room_id
             LEFT JOIN physical_rooms pr ON pr.id = b.physical_room_id
             ORDER BY b.created_at DESC'
        );

        return $stmt->fetchAll();
    }

    /**
     * Insère une nouvelle réservation en base.
     * Le statut initial est toujours "pending" (en attente de confirmation admin).
     * Retourne l'identifiant auto-incrémenté de la réservation créée.
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO bookings
             (user_id, room_id, physical_room_id, check_in, check_out, guests,
              first_name, last_name, email, total_price, status)
             VALUES
             (:user_id, :room_id, :physical_room_id, :check_in, :check_out, :guests,
              :first_name, :last_name, :email, :total_price, "pending")'
        );

        $stmt->execute([
            'user_id'          => $data['user_id']          ?? null,
            'room_id'          => $data['room_id'],
            'physical_room_id' => $data['physical_room_id'] ?? null,
            'check_in'         => $data['check_in'],
            'check_out'        => $data['check_out'],
            'guests'           => $data['guests'],
            'first_name'       => $data['first_name'],
            'last_name'        => $data['last_name'],
            'email'            => $data['email'],
            'total_price'      => $data['total_price'],
        ]);

        // lastInsertId() retourne l'id de la ligne que l'on vient d'insérer
        return (int) $this->db->lastInsertId();
    }

    /**
     * Met à jour le statut d'une réservation.
     * Appelé par l'admin depuis le tableau de bord ou via le bot Telegram.
     * Valeurs possibles : pending / confirmed / cancelled.
     */
    public function updateStatus(int $id, string $status): void
    {
        $stmt = $this->db->prepare('UPDATE bookings SET status = :status WHERE id = :id');
        $stmt->execute(['status' => $status, 'id' => $id]);
    }
}
