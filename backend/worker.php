<?php

declare(strict_types=1);

/**
 * Maison Saclay — Worker Telegram
 *
 * Ce script tourne EN CONTINU dans le container Docker "maison_worker".
 * Il vérifie toutes les 2 secondes si l'admin a cliqué un bouton dans Telegram.
 *
 * ═══════════════════════════════════════════════════════════
 * COMMENT ÇA MARCHE (pour l'oral) :
 * ═══════════════════════════════════════════════════════════
 *
 * 1. L'admin reçoit un message Telegram avec des boutons (Confirmer / Annuler)
 * 2. L'admin clique un bouton
 * 3. Telegram crée un "callback_query" et le met en file d'attente
 * 4. Ce worker appelle getUpdates() toutes les 2s pour récupérer ce clic
 * 5. Le worker extrait l'action (confirm, cancel, accept, refuse) et l'ID
 * 6. Il met à jour le statut dans MySQL (UPDATE bookings / orders SET status = ...)
 * 7. Il répond à Telegram via answerCallbackQuery → le bouton arrête de charger
 * 8. Il modifie le message Telegram (enlève les boutons, affiche le nouveau statut)
 *
 * ═══════════════════════════════════════════════════════════
 * FORMAT DES callback_data :
 * ═══════════════════════════════════════════════════════════
 *   Réservation : "booking:{id}:confirm" ou "booking:{id}:cancel"
 *   Commande    : "order:{id}:accept"    ou "order:{id}:refuse"
 *
 *   Exemple : "booking:42:confirm"
 *     → parts[0] = "booking"  (type)
 *     → parts[1] = "42"       (ID MySQL de la réservation)
 *     → parts[2] = "confirm"  (action demandée)
 *
 * ═══════════════════════════════════════════════════════════
 * POURQUOI answerCallbackQuery EST OBLIGATOIRE :
 * ═══════════════════════════════════════════════════════════
 *   Telegram attend cette réponse pour fermer le spinner du bouton.
 *   Si on ne répond pas dans ~30s, le bouton affiche une erreur côté admin.
 *   C'est pourquoi on appelle answerCallback() MÊME en cas d'erreur.
 *
 * ═══════════════════════════════════════════════════════════
 * GESTION DE L'OFFSET TELEGRAM :
 * ═══════════════════════════════════════════════════════════
 *   L'offset est stocké dans /var/www/backend/tg_offset (volume persistant).
 *   Chaque update_id traité est confirmé en passant offset = last_id + 1.
 *   Cela évite de retraiter le même callback deux fois.
 *   Au démarrage, on nettoie aussi les boutons des anciens messages.
 */

// ── Charger les variables d'environnement depuis .env ────────────────────────
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        [$key, $val] = explode('=', $line, 2) + [1 => ''];
        $_ENV[trim($key)] = trim($val);
    }
}

// ── Autoloader PSR-4 : charge les classes App\* automatiquement ──────────────
spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    $base   = __DIR__ . '/src/';
    if (!str_starts_with($class, $prefix)) return;
    $file = $base . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (file_exists($file)) require_once $file;
});

use App\Config\Database;
use App\Core\Telegram;

log_worker('Worker Telegram demarre');

// Au démarrage : nettoyer les boutons des vieux messages Telegram
// (évite que l'admin reclique sur un ancien bouton d'une réservation déjà traitée)
try {
    $dbStartup = get_db();
    $chatId    = trim((string)($_ENV['TELEGRAM_CHAT_ID'] ?? ''));
    startup_cleanup($dbStartup, $chatId);
} catch (\Throwable $e) {
    log_worker('Avertissement cleanup demarrage: ' . $e->getMessage());
}

// ── Boucle principale : tourne indéfiniment ──────────────────────────────────
while (true) {
    try {
        // Demande à Telegram les mises à jour non traitées (clics sur boutons)
        $updates = Telegram::getUpdates();

        if (!empty($updates)) {
            $chatId = trim((string)($_ENV['TELEGRAM_CHAT_ID'] ?? ''));

            foreach ($updates as $update) {
                // update_id : identifiant unique de cet événement Telegram
                $updateId = (int)($update['update_id'] ?? 0);

                // On ne traite que les callback_query (clics sur boutons inline)
                $cb = $update['callback_query'] ?? null;
                if (!$cb) continue;

                // cbId : Telegram attend qu'on réponde avec cet ID pour fermer le spinner
                $cbId  = (string)($cb['id'] ?? '');
                // data  : contient "type:id:action" — ex: "booking:42:confirm"
                $data  = (string)($cb['data'] ?? '');
                // msgId : ID du message Telegram à modifier (pour enlever les boutons)
                $msgId = (int)($cb['message']['message_id'] ?? 0);
                $time  = date('H\hi');

                log_worker("[upd=$updateId] Callback: data=$data msg=$msgId");

                // ── Valider le format attendu "type:id:action" ─────────────
                $parts = explode(':', $data);
                if (count($parts) !== 3) {
                    Telegram::answerCallback($cbId, '');
                    log_worker("[upd=$updateId] Format invalide ignore: $data");
                    continue;
                }

                [$type, $rawId, $action] = $parts;
                $id = (int)$rawId;

                // Garde-fou : un ID à 0 indique un callback corrompu ou obsolète
                if ($id <= 0) {
                    Telegram::answerCallback($cbId, '');
                    log_worker("[upd=$updateId] ID invalide ($rawId) ignore");
                    continue;
                }

                log_worker("[upd=$updateId] type=$type id=$id action=$action");

                // ── Connexion MySQL fraîche (reconnexion si timeout) ────────
                try {
                    $db = get_db();
                } catch (\Throwable $e) {
                    log_worker("[upd=$updateId] Echec DB: " . $e->getMessage());
                    Telegram::answerCallback($cbId, '');
                    continue;
                }

                // ── Traitement selon le type ────────────────────────────────
                try {
                    if ($type === 'booking') {
                        handle_booking($db, $chatId, $cbId, $id, $action, $msgId, $time, $updateId);
                    } elseif ($type === 'order') {
                        handle_order($db, $chatId, $cbId, $id, $action, $msgId, $time, $updateId);
                    } else {
                        Telegram::answerCallback($cbId, '');
                        log_worker("[upd=$updateId] Type non gere: $type — ignore");
                    }
                } catch (\Throwable $e) {
                    // Erreur inattendue — on répond TOUJOURS pour fermer le spinner
                    log_worker("[upd=$updateId] ERREUR traitement: " . $e->getMessage());
                    Telegram::answerCallback($cbId, '');
                }
            }
        }
    } catch (\Throwable $e) {
        log_worker('ERREUR boucle principale: ' . $e->getMessage());
    }

    sleep(2);
}

// ── Connexion MySQL avec reconnexion automatique ──────────────────────────────
/**
 * Retourne une connexion PDO valide.
 * Teste la connexion avec "SELECT 1" et reconnecte si MySQL a fermé le socket.
 * MySQL ferme les connexions inactives après wait_timeout (par défaut 8h).
 */
function get_db(): \PDO
{
    $db = Database::getInstance();
    try {
        $db->query('SELECT 1');
        return $db;
    } catch (\Throwable $e) {
        log_worker('Connexion MySQL perdue — reconnexion...');
        Database::reset();
        $db = Database::getInstance();
        log_worker('Reconnexion MySQL OK');
        return $db;
    }
}

// ── Nettoyage au démarrage : retire les boutons des vieux messages ───────────
/**
 * Au démarrage du worker, on retire les boutons Telegram de tous les messages
 * correspondant à des réservations et commandes déjà traitées (non "pending").
 *
 * Pourquoi : si l'admin reclique sur un vieux bouton d'un message déjà traité,
 * Telegram génère un nouveau callback_query. Sans ce nettoyage, le worker
 * traite ces vieux clics et génère des notifications parasites.
 *
 * Avec ce nettoyage : les boutons disparaissent → plus de clics accidentels.
 */
function startup_cleanup(\PDO $db, string $chatId): void
{
    if (!$chatId) return;

    // Nettoyer les messages de réservations traitées
    $stmt = $db->query(
        'SELECT b.id, b.status, b.telegram_msg_id, b.first_name, b.last_name,
                b.check_in, b.check_out,
                COALESCE(r.name, \'Chambre\') AS room
         FROM bookings b
         LEFT JOIN rooms r ON r.id = b.room_id
         WHERE b.telegram_msg_id IS NOT NULL
           AND b.status != \'pending\'
         ORDER BY b.id'
    );

    $bookingsDone = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    $cleanedCount = 0;

    foreach ($bookingsDone as $b) {
        $emoji  = $b['status'] === 'confirmed' ? '✅' : '❌';
        $label  = $b['status'] === 'confirmed' ? 'Confirmée' : 'Annulée';
        $guest  = $b['first_name'] . ' ' . $b['last_name'];
        $dIn    = date('d/m/Y', strtotime($b['check_in']));
        $dOut   = date('d/m/Y', strtotime($b['check_out']));
        $msgTxt = "$emoji *Réservation #{$b['id']} $label*\n"
                . "🛏 {$b['room']}\n"
                . "👤 $guest\n"
                . "📆 $dIn → $dOut";

        // editMessage avec inline_keyboard vide = supprime les boutons
        Telegram::editMessage($chatId, (int)$b['telegram_msg_id'], $msgTxt);
        $cleanedCount++;

        // Respecter la limite Telegram : max 30 messages/sec
        usleep(80000); // 80ms
    }

    // Nettoyer aussi les messages de commandes traitées
    $stmtO = $db->query(
        'SELECT id, status, telegram_msg_id, room_number
         FROM orders
         WHERE telegram_msg_id IS NOT NULL
           AND status != \'pending\'
         ORDER BY id'
    );
    foreach ($stmtO->fetchAll(\PDO::FETCH_ASSOC) as $o) {
        $emoji = ($o['status'] === 'preparing') ? '✅' : '❌';
        $label = ($o['status'] === 'preparing') ? 'Acceptée' : 'Refusée';
        $txt   = "$emoji Commande #{$o['id']} $label — Chambre {$o['room_number']}";
        Telegram::editMessage($chatId, (int)$o['telegram_msg_id'], $txt);
        $cleanedCount++;
        usleep(80000);
    }

    if ($cleanedCount > 0) {
        log_worker("Nettoyage demarrage: $cleanedCount message(s) Telegram mis a jour (boutons supprimes)");
    }
}

// ── Traitement d'un clic sur bouton de réservation ───────────────────────────
/**
 * Gère les clics "Confirmer" et "Annuler" d'une réservation.
 *
 * Flux complet :
 *   1. Traduit l'action (confirm/cancel) en statut MySQL (confirmed/cancelled)
 *   2. Cherche la réservation par ID dans MySQL
 *   3. Si déjà traitée → répond au spinner (idempotent, pas de double traitement)
 *   4. Si pending      → UPDATE statut + answerCallback + editMessage
 *
 * Idempotence : si Telegram renvoie le même callback deux fois (réseau, double-clic),
 * la deuxième fois le statut n'est plus "pending" → on répond sans rien changer.
 * Cela garantit qu'un seul traitement a lieu, quelle que soit la cause du doublon.
 *
 * @param \PDO   $db       Connexion MySQL
 * @param string $chatId   Chat Telegram de l'admin
 * @param string $cbId     ID du callback_query — OBLIGATOIRE pour answerCallbackQuery
 * @param int    $id       ID de la réservation dans MySQL
 * @param string $action   "confirm" ou "cancel"
 * @param int    $msgId    ID du message Telegram (pour supprimer les boutons)
 * @param string $time     Heure formatée pour affichage
 * @param int    $updateId update_id Telegram pour les logs
 */
function handle_booking(\PDO $db, string $chatId, string $cbId, int $id, string $action, int $msgId, string $time, int $updateId): void
{
    // Traduction du bouton cliqué vers le statut MySQL correspondant
    $status = match($action) {
        'confirm' => 'confirmed',
        'cancel'  => 'cancelled',
        default   => null,
    };

    if (!$status) {
        Telegram::answerCallback($cbId, '');
        log_worker("[upd=$updateId] booking #$id action inconnue: $action");
        return;
    }

    // Recherche de la réservation par ID uniquement (pas de filtre sur la date)
    // Une réservation future doit être trouvable même si check_in est dans un mois
    $stmt = $db->prepare(
        'SELECT b.status, b.first_name, b.last_name, b.check_in, b.check_out,
                COALESCE(r.name, \'Chambre\') AS room
         FROM bookings b
         LEFT JOIN rooms r ON r.id = b.room_id
         WHERE b.id = :id LIMIT 1'
    );
    $stmt->execute(['id' => $id]);
    $booking = $stmt->fetch(\PDO::FETCH_ASSOC);

    if (!$booking) {
        // La réservation n'existe pas en base (supprimée ou callback d'une ancienne session)
        // On répond silencieusement : pas de toast visible, pas de modification du message
        log_worker("[upd=$updateId] booking #$id NOT_FOUND (callback obsolete ou supprime)");
        Telegram::answerCallback($cbId, '');
        return;
    }

    $statusAvant = $booking['status'];

    // Si la réservation a déjà été traitée : on répond sans rien modifier
    // (traitement idempotent — protège contre les doubles callbacks Telegram)
    if ($statusAvant !== 'pending') {
        log_worker("[upd=$updateId] booking #$id status_avant=$statusAvant — deja traite, ignore");
        Telegram::answerCallback($cbId, "Déjà traitée ($statusAvant)");
        return;
    }

    // ── Traitement effectif : mise à jour MySQL ─────────────────────────
    $db->prepare('UPDATE bookings SET status = :s WHERE id = :id')
       ->execute(['s' => $status, 'id' => $id]);

    $emoji   = $status === 'confirmed' ? '✅' : '❌';
    $label   = $status === 'confirmed' ? 'Confirmée' : 'Annulée';
    $guest   = $booking['first_name'] . ' ' . $booking['last_name'];
    $dateIn  = date('d/m', strtotime($booking['check_in']));
    $dateOut = date('d/m', strtotime($booking['check_out']));

    log_worker("[upd=$updateId] booking #$id: $statusAvant -> $status OK ($guest)");

    // Répondre à Telegram : ferme le spinner du bouton (OBLIGATOIRE)
    Telegram::answerCallback($cbId, "$emoji Réservation $label !");

    // Modifier le message Telegram : enlève les boutons, affiche le résultat final
    if ($msgId && $chatId) {
        Telegram::editMessage(
            $chatId, $msgId,
            "$emoji *Réservation #$id $label*\n"
            . "🛏 {$booking['room']}\n"
            . "👤 $guest\n"
            . "📆 $dateIn → $dateOut\n"
            . "🕐 Traité à $time"
        );
    }
}

// ── Traitement d'un clic sur bouton de commande room service ─────────────────
/**
 * Gère les clics "Accepter" et "Refuser" d'une commande room service.
 * Même logique idempotente que handle_booking.
 *
 * @param \PDO   $db       Connexion MySQL
 * @param string $chatId   Chat Telegram de l'admin
 * @param string $cbId     ID du callback_query — OBLIGATOIRE
 * @param int    $id       ID de la commande dans MySQL
 * @param string $action   "accept" ou "refuse"
 * @param int    $msgId    ID du message Telegram
 * @param string $time     Heure formatée
 * @param int    $updateId update_id Telegram pour les logs
 */
function handle_order(\PDO $db, string $chatId, string $cbId, int $id, string $action, int $msgId, string $time, int $updateId): void
{
    $status = match($action) {
        'accept' => 'preparing',
        'refuse' => 'cancelled',
        default  => null,
    };

    if (!$status) {
        Telegram::answerCallback($cbId, '');
        log_worker("[upd=$updateId] order #$id action inconnue: $action");
        return;
    }

    $stmt = $db->prepare('SELECT status, room_number FROM orders WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $order = $stmt->fetch(\PDO::FETCH_ASSOC);

    if (!$order) {
        // Commande inexistante — réponse silencieuse
        log_worker("[upd=$updateId] order #$id NOT_FOUND (callback obsolete)");
        Telegram::answerCallback($cbId, '');
        return;
    }

    $statusAvant = $order['status'];

    if ($statusAvant !== 'pending') {
        log_worker("[upd=$updateId] order #$id status_avant=$statusAvant — deja traite, ignore");
        Telegram::answerCallback($cbId, "Deja traitee ($statusAvant)");
        return;
    }

    $db->prepare('UPDATE orders SET status = :s WHERE id = :id')
       ->execute(['s' => $status, 'id' => $id]);

    $emoji = $status === 'preparing' ? '✅' : '❌';
    $label = $status === 'preparing' ? 'Acceptée — En préparation' : 'Refusée';

    log_worker("[upd=$updateId] order #$id: $statusAvant -> $status OK (chambre {$order['room_number']})");

    Telegram::answerCallback($cbId, "$emoji $label !");

    if ($msgId && $chatId) {
        Telegram::editMessage(
            $chatId, $msgId,
            "$emoji *Commande #$id $label*\n"
            . "🍽 Chambre {$order['room_number']}\n"
            . "🕐 Traité à $time"
        );
    }
}

// ── Fonction de log ───────────────────────────────────────────────────────────
/**
 * Affiche une ligne dans les logs Docker (visible via "docker compose logs worker").
 * Format : [HH:MM:SS] message
 * Ces logs permettent au jury de suivre chaque étape du traitement des boutons.
 */
function log_worker(string $msg): void
{
    echo '[' . date('H:i:s') . '] ' . $msg . PHP_EOL;
}
