param([int]$ListenPort=18120,[string]$TargetIP="127.0.0.1",[int]$TargetPort=1812)
$log = "C:\Users\bobo\Desktop\Projet Hotel 5 etoiles\portail-captif\relay_debug.log"
function Log($msg) {
    $line = "$(Get-Date -Format 'HH:mm:ss.fff') $msg"
    Add-Content $log $line
    Write-Host $line
}
"" | Out-File $log  # reset log
Log "=== RELAY DEMARRE 0.0.0.0:$ListenPort -> ${TargetIP}:${TargetPort} ==="
$listener = [System.Net.Sockets.UdpClient]::new($ListenPort)
$fwd = [System.Net.Sockets.UdpClient]::new()
$fwd.Client.ReceiveTimeout = 5000
$fromEp = [System.Net.IPEndPoint]::new([System.Net.IPAddress]::Any, 0)
$targetEp = [System.Net.IPEndPoint]::new([System.Net.IPAddress]::Parse($TargetIP), $TargetPort)
Log "Relay pret - en attente de paquets..."
try {
    while ($true) {
        $data = $listener.Receive([ref]$fromEp)
        Log "RECU $($data.Length)b de $($fromEp.Address):$($fromEp.Port)"
        $fwd.Send($data, $data.Length, $targetEp) | Out-Null
        Log "FORWARD vers ${TargetIP}:${TargetPort}"
        try {
            $replyEp = [System.Net.IPEndPoint]::new([System.Net.IPAddress]::Any, 0)
            $reply = $fwd.Receive([ref]$replyEp)
            Log "REPONSE FreeRADIUS $($reply.Length)b code=$([int]$reply[0])"
            $listener.Send($reply, $reply.Length, $fromEp) | Out-Null
            Log "REPONSE RETOURNEE a $($fromEp.Address):$($fromEp.Port)"
        } catch {
            Log "TIMEOUT FreeRADIUS - pas de reponse dans 5s"
        }
    }
} finally {
    Log "Relay arrete"
    $listener.Close(); $fwd.Close()
}

