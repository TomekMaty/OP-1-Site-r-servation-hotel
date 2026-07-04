<?php
// Script one-shot : met à jour rmtPortalUrl sur l'EAP330
// Lance : docker exec maison_portail php /var/www/portail/eap_update.php

$eapIp   = '192.168.30.253';
$user    = 'admin';
$pass    = 'maison2026';
$newUrl  = 'http://192.168.30.2/wifi';

$baseUrl = "http://{$eapIp}";

// ── Étape 1 : login ────────────────────────────────────────────
// EAP330 attend MD5 du mot de passe (encrypt.js commenté dans cette version)
$md5pass = md5($pass);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $baseUrl . '/',
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query(['username' => $user, 'password' => $md5pass]),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_COOKIEJAR      => '/tmp/eap_cookies.txt',
    CURLOPT_COOKIEFILE     => '/tmp/eap_cookies.txt',
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_HEADER         => true,
    CURLOPT_TIMEOUT        => 10,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "LOGIN → HTTP {$code}\n";
echo substr($resp, 0, 300) . "\n---\n";

// ── Essai 2 : plain text si MD5 échoue ──────────────────────────
if ($code !== 200 && $code !== 302) {
    echo "MD5 KO — tentative plain text\n";
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $baseUrl . '/',
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query(['username' => $user, 'password' => $pass]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEJAR      => '/tmp/eap_cookies.txt',
        CURLOPT_COOKIEFILE     => '/tmp/eap_cookies.txt',
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HEADER         => true,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    echo "LOGIN plain → HTTP {$code}\n";
    echo substr($resp, 0, 300) . "\n---\n";
}

// ── Étape 2 : vérifier si on est connecté ─────────────────────
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $baseUrl . '/data/login.json?operation=read',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_COOKIEFILE     => '/tmp/eap_cookies.txt',
    CURLOPT_TIMEOUT        => 10,
]);
$check = curl_exec($ch);
curl_close($ch);
echo "Session check: {$check}\n";

if (str_contains($check, 'notLogin') || str_contains($check, '"login":false')) {
    die("❌ Login échoué — mauvais mot de passe ou format\n");
}
echo "✅ Connecté à l'EAP\n";

// ── Étape 3 : lire config portail actuelle ─────────────────────
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $baseUrl . '/data/portal_entry.json?operation=read',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_COOKIEFILE     => '/tmp/eap_cookies.txt',
    CURLOPT_TIMEOUT        => 10,
]);
$cfg = curl_exec($ch);
curl_close($ch);
echo "Config actuelle: {$cfg}\n";

// ── Étape 4 : mettre à jour rmtPortalUrl ──────────────────────
$payload = json_encode([
    'operation'      => 'write',
    'rmtPortalUrl'   => $newUrl,
]);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $baseUrl . '/data/portal_entry.json',
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_COOKIEFILE     => '/tmp/eap_cookies.txt',
    CURLOPT_TIMEOUT        => 10,
]);
$result = curl_exec($ch);
$code2  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "UPDATE → HTTP {$code2} : {$result}\n";
