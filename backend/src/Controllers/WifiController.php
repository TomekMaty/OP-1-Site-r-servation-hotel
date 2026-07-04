<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\AdminMiddleware;
use App\Core\Response;
use App\Models\WifiSession;
use App\Models\WifiRadiusSession;
use App\Models\WifiRadiusActivityLog;

/**
 * WifiController — Données du portail captif WiFi.
 *
 * Routes (toutes admin uniquement) :
 *   GET /api/wifi-sessions         → ancien portail custom (conservé, table legacy)
 *   GET /api/wifi-radius-sessions  → sessions du portail EAP330 + FreeRADIUS (actif)
 *   GET /api/wifi-activity         → activité réseau (DNS) — données de démonstration
 *
 * Architecture WiFi :
 *   Téléphone client
 *       ↓ se connecte à OP1_Wifi
 *   Borne TP-Link EAP330
 *       ↓ portail captif intégré (login chambre / mot de passe)
 *       ↓ envoie requête RADIUS UDP → 192.168.30.104:18120
 *   Relay UDP (udp_relay.ps1 sur Windows)
 *       ↓ relaie vers 127.0.0.1:1812
 *   FreeRADIUS (container Docker maison_freeradius)
 *       ↓ vérifie identifiants (chambre = identifiant = mot de passe)
 *       ↓ répond Access-Accept ou Access-Reject
 *   EAP330 → autorise ou bloque l'accès Internet
 *
 *   Script sync_radius_sessions.sh parse les logs FreeRADIUS → table wifi_radius_sessions
 *   Ce controller lit cette table et la renvoie au frontend React (onglet WiFi de l'admin).
 */
class WifiController
{
    /**
     * GET /api/wifi-sessions — Admin uniquement.
     *
     * Retourne les sessions de l'ANCIEN portail captif custom (abandonné).
     * Conservé pour ne pas casser la route existante.
     * La table wifi_sessions contient des données historiques (63 lignes).
     */
    public function index(): void
    {
        AdminMiddleware::require();

        $model    = new WifiSession();
        $sessions = $model->findAll();
        $stats    = $model->stats();

        Response::success([
            'sessions' => $sessions,
            'stats'    => $stats,
        ]);
    }

    /**
     * GET /api/wifi-radius-sessions — Admin uniquement.
     *
     * Retourne les connexions WiFi réelles du portail EAP330 intégré.
     * Source : logs FreeRADIUS parsés par sync_radius_sessions.sh → table wifi_radius_sessions.
     *
     * Données retournées par appareil :
     *   - room_number  : numéro de chambre utilisé pour le login
     *   - mac_address  : adresse MAC de l'appareil (identifiant unique)
     *   - auth_status  : Access-Accept (autorisé) ou Access-Reject (refusé)
     *   - auth_count   : nombre d'authentifications de cet appareil
     *   - connected_at : première connexion observée
     *   - last_seen_at : dernière connexion observée
     */
    public function radiusSessions(): void
    {
        AdminMiddleware::require();

        $model    = new WifiRadiusSession();
        $sessions = $model->findAll();
        $stats    = $model->stats();

        Response::success([
            'sessions' => $sessions,
            'stats'    => $stats,
        ]);
    }

    /**
     * GET /api/wifi-activity — Admin uniquement.
     *
     * Retourne l'activité réseau des clients WiFi (domaines DNS consultés).
     *
     * Important : dans ce projet, les données sont de DÉMONSTRATION (is_demo = 1).
     * En production réelle, un DNS local (Pi-hole, dnsmasq) alimenterait cette table
     * avec les vraies requêtes DNS des appareils connectés.
     *
     * La colonne is_demo permet de distinguer :
     *   - is_demo = 0 → données réelles collectées par le DNS
     *   - is_demo = 1 → données de démonstration insérées par seed_activity_demo.sh
     *
     * Le frontend affiche un badge "démo" sur chaque ligne pour l'honnêteté.
     */
    public function activityLogs(): void
    {
        AdminMiddleware::require();

        $model = new WifiRadiusActivityLog();

        Response::success([
            'logs'  => $model->findRecent(200),
            'stats' => $model->stats(),
        ]);
    }
}
