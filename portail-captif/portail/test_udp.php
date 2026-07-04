<?php
// Test RADIUS via IP HOST (192.168.30.2) — simule ce que l'EAP ferait
$secret = 'Azerty1234.';
$user   = '201';
$id     = 42;
$auth   = str_repeat("\x41", 16);

$uAttr = chr(1).chr(2+strlen($user)).$user;
$padded = str_pad($user, 16, "\x00");
$block = md5($secret.$auth, true);
$xored = '';
for($j=0;$j<16;$j++) $xored.=chr(ord($block[$j])^ord($padded[$j]));
$pAttr = chr(2).chr(18).$xored;
$attrs = $uAttr.$pAttr;
$pkt   = pack('CCn',1,$id,20+strlen($attrs)).$auth.$attrs;

$targets = [
    'Container direct' => 'maison_freeradius',
    'Host LAN IP'      => '192.168.30.2',
    'Host loopback'    => '172.17.0.1',
];

foreach ($targets as $label => $ip) {
    $sock = @socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
    socket_set_option($sock, SOL_SOCKET, SO_RCVTIMEO, ['sec'=>3,'usec'=>0]);
    $resolved = gethostbyname($ip);
    $sent = @socket_sendto($sock, $pkt, strlen($pkt), 0, $resolved, 1812);
    $reply=''; $recv=@socket_recv($sock, $reply, 512, 0);
    socket_close($sock);
    $result = ($recv===false || $recv<4) ? 'TIMEOUT/BLOCKED' : ('code='.ord($reply[0]).' ('.($recv.' bytes)'));
    echo "[{$label}] {$ip} ({$resolved}) → sent:{$sent}b recv:{$result}\n";
}
