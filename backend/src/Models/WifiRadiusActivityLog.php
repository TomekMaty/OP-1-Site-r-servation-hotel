<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;

/**
 * WifiRadiusActivityLog — Modèle de l'activité réseau des clients WiFi.
 *
 * Table MySQL : wifi_radius_activity_logs
 *
 * Ce modèle représente les domaines DNS consultés par les clients WiFi.
 * Dans ce projet, les données sont de DÉMONSTRATION (is_demo = 1),
 * insérées par le script portail-captif/seed_activity_demo.sh.
 *
 * En production réelle, un résolveur DNS local (Pi-hole, dnsmasq) sur le serveur
 * alimenterait cette table avec les vraies requêtes DNS des appareils connectés.
 *
 * Colonnes principales :
 *   room_number     → chambre du client qui a fait la requête
 *   mac_address     → adresse MAC de son appareil
 *   client_ip       → IP locale de l'appareil sur le réseau hôtel
 *   domain          → nom de domaine consulté (ex: google.com)
 *   destination_ip  → IP publique résolue par le DNS
 *   protocol        → DNS / HTTP / HTTPS / OTHER
 *   log_source      → "dns" (réel) ou "demo" (démonstration)
 *   is_demo         → 1 si données de démo, 0 si données réelles
 *   visited_at      → date/heure de la consultation
 *
 * Note : le contenu HTTPS n'est PAS visible (chiffrement TLS côté client).
 * On ne voit que le domaine, jamais les pages ni les mots de passe.
 */
class WifiRadiusActivityLog
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Retourne les activités réseau récentes, les plus récentes d'abord.
     * Limite à 200 lignes pour ne pas surcharger la réponse JSON.
     */
    public function findRecent(int $limit = 200): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM wifi_radius_activity_logs ORDER BY visited_at DESC LIMIT :lim'
        );
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Calcule les statistiques pour l'onglet Activité réseau de l'admin.
     *
     * Retourne :
     *   total        → nombre total de lignes d'activité
     *   real         → nombre de lignes réelles (is_demo = 0)
     *   demo         → nombre de lignes de démonstration (is_demo = 1)
     *   has_real_data → vrai si au moins une donnée réelle existe
     *   last_activity → date/heure de la dernière activité enregistrée
     *
     * Le frontend utilise has_real_data pour afficher une bannière
     * "mode démonstration" si aucune donnée réelle n'est disponible.
     */
    public function stats(): array
    {
        $row = $this->db->query(
            'SELECT
                COUNT(*)         AS total,
                SUM(is_demo = 0) AS real_count,
                SUM(is_demo = 1) AS demo_count,
                MAX(visited_at)  AS last_activity
             FROM wifi_radius_activity_logs'
        )->fetch(PDO::FETCH_ASSOC);

        $real = (int) ($row['real_count'] ?? 0);

        return [
            'total'         => (int) ($row['total']      ?? 0),
            'real'          => $real,
            'demo'          => (int) ($row['demo_count'] ?? 0),
            'has_real_data' => $real > 0,
            'last_activity' => $row['last_activity'],
        ];
    }
}
