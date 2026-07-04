<?php

declare(strict_types=1);

namespace App\Core;

/**
 * JWT — Génération et vérification des tokens d'authentification.
 *
 * JWT = JSON Web Token. C'est un standard pour transmettre des informations
 * de manière sécurisée entre le client et le serveur.
 *
 * Structure d'un JWT : header.payload.signature
 *   - header   : algorithme utilisé (HS256)
 *   - payload  : données (user_id, role, date d'expiration)
 *   - signature : hash HMAC-SHA256 avec le secret JWT_SECRET du .env
 *
 * Fonctionnement dans ce projet :
 *   1. Le client envoie ses identifiants → POST /api/auth/login
 *   2. Le backend génère un JWT signé avec JWT::encode()
 *   3. Le frontend stocke ce token (localStorage ou sessionStorage)
 *   4. Chaque requête suivante envoie : Authorization: Bearer <token>
 *   5. Le backend vérifie la signature avec JWT::decode()
 *   6. Si valide → la requête est autorisée
 *
 * Deux types de tokens dans ce projet :
 *   - Token client : role = "user", user_id = id du compte
 *   - Token admin  : role = "admin", user_id = 0 (pas de compte individuel)
 */
class JWT
{
    /**
     * Lit le secret JWT depuis les variables d'environnement (.env).
     * Lance une exception si JWT_SECRET est absent (empêche de signer sans secret).
     */
    public static function getSecret(): string
    {
        $secret = trim((string) ($_ENV['JWT_SECRET'] ?? ''));

        if ($secret === '') {
            throw new \RuntimeException('JWT_SECRET manquant dans la configuration');
        }

        return $secret;
    }

    /**
     * Génère un token JWT signé.
     *
     * @param array  $payload    Données à stocker (user_id, role...)
     * @param string $secret     Clé secrète HMAC (depuis .env)
     * @param int    $ttlSeconds Durée de validité en secondes (défaut : 7 jours)
     * @return string            Token JWT au format header.payload.signature
     */
    public static function encode(array $payload, string $secret, int $ttlSeconds = 604800): string
    {
        // Ajout des timestamps : iat = issued at, exp = expiration
        $payload['iat'] = time();
        $payload['exp'] = time() + $ttlSeconds;

        $header = self::b64u(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $body   = self::b64u(json_encode($payload));

        // Signature HMAC-SHA256 : hash du header + payload avec le secret
        $sig = self::b64u(hash_hmac('sha256', "$header.$body", $secret, true));

        return "$header.$body.$sig";
    }

    /**
     * Vérifie et décode un token JWT.
     *
     * Retourne null si :
     *   - Le token ne contient pas 3 parties
     *   - La signature ne correspond pas (token forgé ou modifié)
     *   - Le token est expiré (exp < maintenant)
     *
     * @return array|null Payload du token si valide, null sinon
     */
    public static function decode(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        [$header, $body, $sig] = $parts;

        // Recalcul de la signature attendue pour comparer
        $expected = self::b64u(hash_hmac('sha256', "$header.$body", $secret, true));

        // hash_equals() empêche les attaques par timing (comparaison constante en temps)
        if (!hash_equals($expected, $sig)) return null;

        $data = json_decode(self::b64d($body), true);
        if (!is_array($data)) return null;

        // Vérification de l'expiration
        if (isset($data['exp']) && $data['exp'] < time()) return null;

        return $data;
    }

    /** Encode en Base64 URL-safe (remplace +/ par -_ et supprime les =). */
    private static function b64u(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /** Décode un Base64 URL-safe. */
    private static function b64d(string $data): string
    {
        $pad = (4 - strlen($data) % 4) % 4;
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', $pad));
    }
}
