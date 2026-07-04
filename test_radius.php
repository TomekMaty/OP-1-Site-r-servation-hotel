<?php
$sock   = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
$auth   = random_bytes(16);
$secret = 'hotelmrt2026';
$user   = '201';
$pass   = '201';

// Chiffrement mot de passe RFC 2865
$padded = str_pad($pass, (int)ceil(max(1, strlen($pass)) / 16) * 16, chr(0));
$enc = '';
$b = md5($secret . $auth, true);
for ($i = 0; $i < strlen($padded); $i += 16) {
    $chunk = substr($padded, $i, 16);
    $b = $chunk ^ $b;
    $enc .= $b;
    $b = md5($secret . $b, true);
}

// Attributs RADIUS
$attrs  = chr(1) . chr(2 + strlen($user)) . $user;
$attrs .= chr(2) . chr(2 + strlen($enc))  . $enc;
$attrs .= chr(4) . chr(6) . chr(127) . chr(0) . chr(0) . chr(1);
$attrs .= chr(5) . chr(6) . pack('N', 0);

$len = 20 + strlen($attrs);
$pkt = chr(1) . chr(rand(1, 255)) . pack('n', $len) . $auth . $attrs;

socket_set_option($sock, SOL_SOCKET, SO_RCVTIMEO, ['sec' => 4, 'usec' => 0]);
socket_sendto($sock, $pkt, strlen($pkt), 0, 'freeradius', 1812);

$resp = '';
$from = '';
$fp   = 0;
$r    = socket_recvfrom($sock, $resp, 1024, 0, $from, $fp);
socket_close($sock);

$code = ($r !== false && strlen($resp) >= 1) ? ord($resp[0]) : 0;
echo match($code) {
    2       => "Access-Accept OK - RADIUS valide la chambre 201",
    3       => "Access-Reject - chambre refusee",
    default => "Code=$code (0=timeout/pas de reponse)"
} . "\n";
