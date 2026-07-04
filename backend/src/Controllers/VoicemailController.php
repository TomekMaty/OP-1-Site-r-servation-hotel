<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Core\MailService;
use App\Core\Response;

class VoicemailController
{
    private const SPOOL_BASE = '/var/spool/asterisk/voicemail';

    /** POST /api/voicemail-notify */
    public function notify(): void
    {
        $body     = json_decode(file_get_contents('php://input'), true) ?? [];
        $mailbox  = trim((string) ($body['mailbox']   ?? ''));
        $context  = trim((string) ($body['context']   ?? 'hotel'));
        $newCount = (int) ($body['new_count'] ?? 0);
        $callTime = trim((string) ($body['call_time'] ?? date('Y-m-d H:i:s')));

        if ($mailbox === '') {
            Response::error('Parametre mailbox manquant', 400);
            return;
        }

        if ($newCount === 0) {
            $this->vmLog($mailbox, '-', '-', '-', '-', 'SKIP', 'new_count=0, rien a faire');
            Response::success(['sent' => false, 'reason' => 'new_count = 0']);
            return;
        }

        // Etape 1 — Resoudre le destinataire
        $recipient  = $this->resolveRecipient($mailbox);
        $toEmail    = $recipient['email'];
        $roomNum    = $recipient['room']       ?? null;
        $type       = $recipient['type'];
        $reason     = $recipient['reason']     ?? '';
        $clientName = $recipient['first_name'] ?? null;

        // Etape 2 — Fallback reception si aucun email client
        $usedFallback = false;
        if ($toEmail === '') {
            $toEmail      = MailService::adminEmail();
            $usedFallback = true;
        }

        if ($toEmail === '') {
            $this->vmLog($mailbox, $roomNum ?? '?', '-', 'VIDE', '-', 'ECHEC', 'ADMIN_EMAIL vide et aucun client');
            Response::success(['sent' => false, 'reason' => 'aucun destinataire trouvable']);
            return;
        }

        // Etape 3 — Trouver le fichier audio et les infos appelant
        $audioFile  = $this->findAudioFile($mailbox, $context);
        $audioName  = 'message_vocal_' . date('Ymd_His') . '.wav';
        $callerInfo = $this->findCallerInfo($mailbox, $context);

        // Etape 4 — Construire et envoyer l'email
        if ($usedFallback) {
            $subject   = "Message vocal — " . ($roomNum ? "Chambre {$roomNum}" : "Extension {$mailbox}") . " n'a pas repondu";
            $emailBody = $this->buildFallbackEmail($mailbox, $roomNum, $callTime, $reason, $audioFile !== null, $callerInfo);
        } elseif ($type === 'reception') {
            $subject   = "Nouveau message vocal — Reception (poste 1099)";
            $emailBody = $this->buildReceptionEmail($callTime, $audioFile !== null, $callerInfo);
        } else {
            $subject   = "Vous avez un message vocal — Chambre {$roomNum}";
            $emailBody = $this->buildClientEmail($roomNum ?? $mailbox, $callTime, $clientName, $audioFile !== null, $callerInfo);
        }

        // Etape 5 — Envoyer avec piece jointe ou sans
        if ($audioFile !== null) {
            $sent = MailService::sendWithAttachment($toEmail, $subject, $emailBody, $audioFile, $audioName);
            $audioStatus = 'joint';
        } else {
            $sent        = MailService::send($toEmail, $subject, $emailBody);
            $audioStatus = 'introuvable';
        }

        $this->vmLog(
            $mailbox,
            $roomNum       ?? ($type === 'reception' ? 'reception' : '?'),
            $type === 'client' ? 'oui' : '-',
            $toEmail,
            $audioStatus,
            $usedFallback ? 'FALLBACK' : 'OK',
            $usedFallback ? $reason : ($type === 'reception' ? 'extension reception' : "client trouve chambre {$roomNum}")
        );

        Response::success([
            'sent'          => $sent,
            'to'            => $toEmail,
            'mailbox'       => $mailbox,
            'room'          => $roomNum,
            'type'          => $type,
            'audio'         => $audioStatus,
            'caller'        => $callerInfo,
            'used_fallback' => $usedFallback,
        ], $sent ? "Email envoye (audio: {$audioStatus})" : 'Email ignore (SMTP non configure)');
    }

    // --- Recherche du fichier audio ---

    private function findAudioFile(string $mailbox, string $context): ?string
    {
        $inbox = self::SPOOL_BASE . "/{$context}/{$mailbox}/INBOX";

        if (!is_dir($inbox)) {
            return null;
        }

        $files = glob("{$inbox}/msg*.wav");

        if (empty($files)) {
            $files = glob("{$inbox}/msg*.WAV");
        }

        if (empty($files)) {
            return null;
        }

        usort($files, static fn($a, $b) => filemtime($b) - filemtime($a));

        return $files[0];
    }

    // --- Lecture du caller ID depuis le fichier .txt du spool Asterisk ---

    private function findCallerInfo(string $mailbox, string $context): array
    {
        $inbox = self::SPOOL_BASE . "/{$context}/{$mailbox}/INBOX";

        if (!is_dir($inbox)) {
            return ['ext' => null, 'room' => null, 'label' => null];
        }

        $files = glob("{$inbox}/msg*.txt");

        if (empty($files)) {
            return ['ext' => null, 'room' => null, 'label' => null];
        }

        usort($files, static fn($a, $b) => filemtime($b) - filemtime($a));
        $content = @file_get_contents($files[0]);

        if (!$content) {
            return ['ext' => null, 'room' => null, 'label' => null];
        }

        // Format Asterisk : callerid="Chambre 201" <2001>
        $ext = null;
        if (preg_match('/^callerid=.*?<(\d{4})>/mi', $content, $m)) {
            $ext = $m[1];
        } elseif (preg_match('/^callerid="(\d{4})"/mi', $content, $m)) {
            $ext = $m[1];
        }

        if ($ext === null) {
            return ['ext' => null, 'room' => null, 'label' => null];
        }

        // Mapper l'extension vers un numero de chambre via la DB
        $room = null;
        try {
            $db   = Database::getInstance();
            $stmt = $db->prepare('SELECT room_number FROM physical_rooms WHERE phone_extension = :ext LIMIT 1');
            $stmt->execute(['ext' => $ext]);
            $row  = $stmt->fetch();
            if ($row) {
                $room = (string) $row['room_number'];
            }
        } catch (\Throwable $e) {
            // Ne pas bloquer l'envoi si la DB echoue
        }

        if ($ext === '1099') {
            $label = 'la reception';
        } elseif ($room !== null) {
            $label = "la chambre {$room}";
        } else {
            $label = "le poste {$ext}";
        }

        return ['ext' => $ext, 'room' => $room, 'label' => $label];
    }

    // --- Resolution du destinataire ---

    private function resolveRecipient(string $mailbox): array
    {
        if ($mailbox === '1099') {
            return [
                'email'      => MailService::adminEmail(),
                'room'       => null,
                'type'       => 'reception',
                'first_name' => null,
                'reason'     => '',
            ];
        }

        try {
            $db = Database::getInstance();

            $stmt = $db->prepare(
                'SELECT id, room_number FROM physical_rooms WHERE phone_extension = :ext LIMIT 1'
            );
            $stmt->execute(['ext' => $mailbox]);
            $room = $stmt->fetch();

            if (!$room) {
                return [
                    'email'      => '',
                    'room'       => null,
                    'type'       => 'unknown_extension',
                    'first_name' => null,
                    'reason'     => "extension {$mailbox} inconnue dans physical_rooms",
                ];
            }

            $roomNumber = (string) $room['room_number'];

            $stmt = $db->prepare(
                'SELECT b.email       AS booking_email,
                        b.first_name  AS booking_first_name,
                        u.email       AS user_email,
                        u.first_name  AS user_first_name
                 FROM bookings b
                 LEFT JOIN users u ON u.id = b.user_id
                 WHERE b.physical_room_id = :pr_id
                   AND b.check_in  <= CURDATE()
                   AND b.check_out >  CURDATE()
                   AND b.status    IN ("pending", "confirmed")
                 ORDER BY b.check_in DESC
                 LIMIT 1'
            );
            $stmt->execute(['pr_id' => (int) $room['id']]);
            $booking = $stmt->fetch();

            if (!$booking) {
                return [
                    'email'      => '',
                    'room'       => $roomNumber,
                    'type'       => 'no_booking',
                    'first_name' => null,
                    'reason'     => "aucune reservation active pour la chambre {$roomNumber} aujourd'hui",
                ];
            }

            $email     = trim((string) ($booking['user_email']      ?? ''));
            $firstName = trim((string) ($booking['user_first_name'] ?? ''));

            if ($email === '') {
                $email     = trim((string) ($booking['booking_email']      ?? ''));
                $firstName = trim((string) ($booking['booking_first_name'] ?? ''));
            }

            if ($email === '') {
                return [
                    'email'      => '',
                    'room'       => $roomNumber,
                    'type'       => 'no_email',
                    'first_name' => null,
                    'reason'     => "client sans email pour la chambre {$roomNumber}",
                ];
            }

            return [
                'email'      => $email,
                'room'       => $roomNumber,
                'type'       => 'client',
                'first_name' => $firstName,
                'reason'     => '',
            ];

        } catch (\Throwable $e) {
            return [
                'email'      => '',
                'room'       => null,
                'type'       => 'db_error',
                'first_name' => null,
                'reason'     => 'erreur DB : ' . $e->getMessage(),
            ];
        }
    }

    // --- Corps des emails ---

    private function callerLine(array $callerInfo): string
    {
        if ($callerInfo['label'] === null) {
            return '';
        }
        return "  - Appel venant de : " . $callerInfo['label'] . "\n";
    }

    private function buildClientEmail(string $room, string $callTime, ?string $firstName, bool $hasAudio, array $callerInfo): string
    {
        $greeting  = $firstName ? "Bonjour {$firstName}," : "Bonjour,";
        $audioNote = $hasAudio
            ? "Le message vocal est joint a cet e-mail."
            : "Le message vocal n'a pas pu etre joint automatiquement.\nVous pouvez l'ecouter en composant *98 depuis le telephone de votre chambre.";

        $callerLine = $this->callerLine($callerInfo);

        return "{$greeting}\n\n"
            . "Vous avez recu un nouveau message vocal concernant votre chambre.\n\n"
            . "Details :\n"
            . "  - Chambre      : {$room}\n"
            . $callerLine
            . "  - Date / heure : {$callTime}\n\n"
            . $audioNote . "\n\n"
            . "Cordialement,\n"
            . "Reception — Maison Saclay";
    }

    private function buildReceptionEmail(string $callTime, bool $hasAudio, array $callerInfo): string
    {
        $audioNote = $hasAudio
            ? "Le message vocal est joint a cet e-mail."
            : "Le message vocal n'a pas pu etre joint automatiquement.\nComposez *98 depuis n'importe quel poste (boite vocale 1099).";

        $callerLine = $this->callerLine($callerInfo);

        return "Bonjour,\n\n"
            . "Vous avez recu un nouveau message vocal sur le poste de reception (1099).\n\n"
            . "Details :\n"
            . "  - Poste        : Reception (1099)\n"
            . $callerLine
            . "  - Date / heure : {$callTime}\n\n"
            . $audioNote . "\n\n"
            . "Cordialement,\n"
            . "Systeme telephonique — Maison Saclay";
    }

    private function buildFallbackEmail(
        string  $mailbox,
        ?string $room,
        string  $callTime,
        string  $reason,
        bool    $hasAudio,
        array   $callerInfo
    ): string {
        $audioNote = $hasAudio
            ? "Le message vocal est joint a cet e-mail."
            : "Le message vocal n'a pas pu etre joint automatiquement.\nComposez *98 depuis n'importe quel poste (boite vocale {$mailbox}).";

        $callerLine = $this->callerLine($callerInfo);

        $roomLabel = $room ? "Chambre {$room}" : "Extension {$mailbox}";

        return "Bonjour,\n\n"
            . "{$roomLabel} n'a pas repondu et aucun client n'a pu etre identifie automatiquement.\n"
            . "Le message vocal vous est transmis pour ne pas le perdre.\n\n"
            . "Details :\n"
            . "  - Extension appelee  : {$mailbox}" . ($room ? " (Chambre {$room})" : "") . "\n"
            . $callerLine
            . "  - Date / heure       : {$callTime}\n"
            . "  - Raison             : {$reason}\n\n"
            . $audioNote . "\n\n"
            . "Cordialement,\n"
            . "Systeme telephonique — Maison Saclay";
    }

    // --- Log dedie voicemail ---

    private function vmLog(
        string $mailbox,
        string $room,
        string $booking,
        string $email,
        string $audio,
        string $status,
        string $detail
    ): void {
        $logDir  = __DIR__ . '/../../logs';
        $logFile = $logDir . '/voicemail.log';
        if (!is_dir($logDir)) { @mkdir($logDir, 0755, true); }

        $line = date('Y-m-d H:i:s')
            . ' | ext='     . str_pad($mailbox, 6)
            . ' | chambre=' . str_pad($room,    8)
            . ' | resa='    . str_pad($booking, 4)
            . ' | audio='   . str_pad($audio,   12)
            . ' | email='   . str_pad($email,   38)
            . ' | '         . str_pad($status,  8)
            . ' | '         . $detail
            . "\n";

        @file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
    }
}
