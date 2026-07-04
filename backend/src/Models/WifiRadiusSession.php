<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;

/**
 * WifiRadiusSession — Modèle des connexions WiFi via FreeRADIUS.
 *
 * Table MySQL : wifi_radius_sessions
 *
 * Cette table est alimentée par le script portail-captif/sync_radius_sessions.sh
 * qui parse les logs de FreeRADIUS et insère / met à jour les connexions.
 *
 * Chaque ligne représente un APPAREIL connecté (couple chambre + adresse MAC).
 * Si le même téléphone se reconnecte, auth_count est incrémenté (pas de doublon).
 *
 * Colonnes principales :
 *   room_number   → numéro de chambre utilisé pour le login (ex: "201")
 *   mac_address   → adresse MAC de l'appareil (identifiant unique physique)
 *   auth_status   → Access-Accept (autorisé) ou Access-Reject (mauvais mot de passe)
 *   auth_count    → combien de fois cet appareil s'est authentifié
 *   connected_at  → première fois vue
 *   last_seen_at  → dernière fois vue
 *   nas_ip        → IP de la borne WiFi (EAP330 = 192.168.30.253)
 *
 * Clé unique : (room_number, mac_address, auth_status)
 * → garantit qu'un même appareil avec le même statut = une seule ligne.
 */
class WifiRadiusSession
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Retourne toutes les sessions connues, les plus récentes d'abord.
     * Limité à 300 entrées pour éviter de surcharger la réponse JSON.
     */
    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT id, username, room_number, mac_address, client_ip,
                    nas_ip, nas_identifier, auth_status, auth_message,
                    user_agent, auth_count, connected_at, last_seen_at, created_at
             FROM wifi_radius_sessions
             ORDER BY last_seen_at DESC
             LIMIT 300'
        );
        return $stmt->fetchAll();
    }

    /**
     * Calcule les statistiques de synthèse pour l'onglet WiFi de l'admin.
     *
     * Retourne :
     *   total       → nombre total de lignes (appareils vus)
     *   devices     → nombre d'adresses MAC distinctes (appareils uniques)
     *   rooms       → nombre de chambres distinctes ayant utilisé le WiFi
     *   accepted    → nombre de connexions autorisées (Access-Accept)
     *   rejected    → nombre de connexions refusées (Access-Reject)
     *   total_auths → somme de tous les auth_count (total d'authentifications)
     *   last_activity → date/heure de la dernière activité
     */
    public function stats(): array
    {
        $stmt = $this->db->query(
            'SELECT
                COUNT(*)                             AS total,
                COUNT(DISTINCT mac_address)          AS devices,
                COUNT(DISTINCT room_number)          AS rooms,
                SUM(auth_status = "Access-Accept")   AS accepted,
                SUM(auth_status = "Access-Reject")   AS rejected,
                SUM(auth_count)                      AS total_auths,
                MAX(last_seen_at)                    AS last_activity
             FROM wifi_radius_sessions'
        );
        return $stmt->fetch() ?: [];
    }
}
