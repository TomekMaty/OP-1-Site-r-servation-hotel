<?php
$ctx = stream_context_create(['http'=>['timeout'=>3,'ignore_errors'=>true]]);
$url = 'http://192.168.30.253/portal/auth?mac=AA:BB:CC:DD:EE:FF&ap=D4:6E:0E:AE:57:45&type=0';
$r = @file_get_contents($url, false, $ctx);
if ($r === false) {
    $e = error_get_last();
    echo 'ECHEC: ' . ($e['message'] ?? 'inconnu');
} else {
    echo 'OK - longueur:' . strlen($r) . ' - reponse:[' . $r . ']';
}
