<?php

declare(strict_types=1);

namespace App\Core;

/**
 * MailService — Envoi d'emails via SMTP natif (sans dépendance externe).
 *
 * Configuration via variables .env :
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, ADMIN_EMAIL
 *
 * Tous les envois sont loggués dans logs/mail.log.
 * Si SMTP n'est pas configuré, l'email est ignoré sans bloquer l'application.
 *
 * Utilisation :
 *   MailService::send('client@email.com', 'Bienvenue', 'Bonjour...');
 *   MailService::sendWithAttachment($to, $subject, $body, '/path/to/file.wav', 'message.wav');
 */
class MailService
{
    /**
     * Envoie un email simple en texte brut.
     *
     * @param string $to      Destinataire
     * @param string $subject Sujet
     * @param string $body    Corps du message (texte brut)
     * @return bool           true si envoyé, false sinon
     */
    public static function send(string $to, string $subject, string $body): bool
    {
        return self::sendMail($to, $subject, $body, null, null);
    }

    /**
     * Envoie un email avec pièce jointe (fichier audio voicemail par exemple).
     */
    public static function sendWithAttachment(
        string $to,
        string $subject,
        string $body,
        string $attachmentPath,
        string $attachmentName
    ): bool {
        return self::sendMail($to, $subject, $body, $attachmentPath, $attachmentName);
    }

    /**
     * Retourne l'adresse admin configurée dans .env.
     */
    public static function adminEmail(): string
    {
        return trim($_ENV['ADMIN_EMAIL'] ?? '');
    }

    // ── Implémentation SMTP ──────────────────────────────────────────────────

    private static function sendMail(
        string $to,
        string $subject,
        string $body,
        ?string $attachmentPath,
        ?string $attachmentName
    ): bool {
        $host = trim($_ENV['SMTP_HOST']     ?? '');
        $port = (int) ($_ENV['SMTP_PORT']   ?? 587);
        $user = trim($_ENV['SMTP_USER']     ?? '');
        $pass = trim($_ENV['SMTP_PASSWORD'] ?? '');
        $from = trim($_ENV['SMTP_FROM']     ?? $user);

        // Si SMTP non configuré, on logue et on retourne false sans bloquer
        if ($host === '' || $user === '') {
            self::log('IGNORE (SMTP non configure)', $to, $subject);
            return false;
        }

        try {
            // Connexion TCP vers le serveur SMTP
            $ctx    = stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]);
            $socket = @stream_socket_client(
                "tcp://{$host}:{$port}",
                $errno, $errstr, 15,
                STREAM_CLIENT_CONNECT,
                $ctx
            );

            if (!$socket) {
                self::log("Connexion echouee ({$errstr})", $to, $subject);
                return false;
            }

            stream_set_timeout($socket, 15);

            // Salutation du serveur SMTP
            self::read($socket);

            // EHLO — annonce du client
            self::cmd($socket, 'EHLO localhost');

            // STARTTLS — chiffrement de la connexion
            self::cmd($socket, 'STARTTLS');
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

            // Re-EHLO obligatoire après TLS
            self::cmd($socket, 'EHLO localhost');

            // Authentification SMTP
            self::cmd($socket, 'AUTH LOGIN');
            self::cmd($socket, base64_encode($user));
            self::cmd($socket, base64_encode($pass));

            // Expéditeur et destinataire
            self::cmd($socket, "MAIL FROM:<{$from}>");
            self::cmd($socket, "RCPT TO:<{$to}>");

            // Début du contenu
            self::cmd($socket, 'DATA');

            // Construction du message MIME
            $message = self::buildMessage($from, $to, $subject, $body, $attachmentPath, $attachmentName);
            fwrite($socket, $message . "\r\n.\r\n");
            self::read($socket);

            fwrite($socket, "QUIT\r\n");
            fclose($socket);

            self::log('OK', $to, $subject);
            return true;

        } catch (\Throwable $e) {
            self::log('ERREUR: ' . $e->getMessage(), $to, $subject);
            return false;
        }
    }

    /**
     * Construit le message MIME (texte simple ou multipart si pièce jointe).
     */
    private static function buildMessage(
        string $from,
        string $to,
        string $subject,
        string $body,
        ?string $attachmentPath,
        ?string $attachmentName
    ): string {
        $hasAttachment = $attachmentPath !== null
            && $attachmentName !== null
            && file_exists($attachmentPath);

        $headers  = "From: Maison Saclay <{$from}>\r\n";
        $headers .= "To: <{$to}>\r\n";
        $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Date: " . date('r') . "\r\n";

        if ($hasAttachment) {
            $boundary = 'boundary_' . bin2hex(random_bytes(8));
            $headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n";
            $content  = "--{$boundary}\r\n";
            $content .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
            $content .= $body . "\r\n\r\n";
            // Pièce jointe encodée en base64
            $content .= "--{$boundary}\r\n";
            $content .= "Content-Type: audio/wav; name=\"{$attachmentName}\"\r\n";
            $content .= "Content-Transfer-Encoding: base64\r\n";
            $content .= "Content-Disposition: attachment; filename=\"{$attachmentName}\"\r\n\r\n";
            $content .= chunk_split(base64_encode((string) file_get_contents($attachmentPath)));
            $content .= "--{$boundary}--\r\n";
        } else {
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $content  = $body;
        }

        return $headers . "\r\n" . $content;
    }

    /**
     * Envoie une commande SMTP et lit la réponse du serveur.
     */
    private static function cmd($socket, string $command): string
    {
        fwrite($socket, $command . "\r\n");
        return self::read($socket);
    }

    /**
     * Lit la réponse complète du serveur SMTP (plusieurs lignes possibles).
     */
    private static function read($socket): string
    {
        $response = '';
        while (!feof($socket)) {
            $line      = (string) fgets($socket, 512);
            $response .= $line;
            // La ligne finale d'une réponse SMTP a un espace au 4e caractère
            if (strlen($line) >= 4 && $line[3] === ' ') {
                break;
            }
        }
        return $response;
    }

    /**
     * Écrit une ligne dans logs/mail.log (crée le répertoire si besoin).
     */
    private static function log(string $status, string $to, string $subject): void
    {
        $logDir  = __DIR__ . '/../../logs';
        $logFile = $logDir . '/mail.log';

        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $line = date('Y-m-d H:i:s')
            . ' | ' . str_pad($status, 30)
            . ' | to=' . $to
            . ' | subject=' . $subject
            . "\n";

        file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
    }
}
