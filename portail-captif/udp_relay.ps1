# UDP RADIUS Relay - natif Windows (contourne le bug Docker Desktop UDP)
# Ecoute sur 0.0.0.0:18120, forward vers FreeRADIUS 172.19.0.2:1812

param(
    [int]$ListenPort    = 18120,
    [string]$TargetIP   = "127.0.0.1",
    [int]$TargetPort    = 1812
)

Write-Host "=== UDP RADIUS Relay ===" -ForegroundColor Cyan
Write-Host "Ecoute : 0.0.0.0:$ListenPort"
Write-Host "Forward: ${TargetIP}:${TargetPort}"
Write-Host "Ctrl+C pour arreter`n"

$listener = [System.Net.Sockets.UdpClient]::new($ListenPort)
$fwd      = [System.Net.Sockets.UdpClient]::new()
$fwd.Client.ReceiveTimeout = 5000

$fromEp   = [System.Net.IPEndPoint]::new([System.Net.IPAddress]::Any, 0)
$targetEp = [System.Net.IPEndPoint]::new([System.Net.IPAddress]::Parse($TargetIP), $TargetPort)

$count = 0

try {
    while ($true) {
        # Recevoir paquet de l'EAP (bloquant)
        $data = $listener.Receive([ref]$fromEp)
        $count++
        $ts = Get-Date -Format "HH:mm:ss"
        Write-Host "[$ts] #$count Recu $($data.Length)b de $($fromEp.Address):$($fromEp.Port)" -ForegroundColor Green

        # Forward vers FreeRADIUS
        $fwd.Send($data, $data.Length, $targetEp) | Out-Null

        # Attendre reponse FreeRADIUS (5s timeout)
        try {
            $replyEp = [System.Net.IPEndPoint]::new([System.Net.IPAddress]::Any, 0)
            $reply   = $fwd.Receive([ref]$replyEp)
            Write-Host "[$ts]    -> FreeRADIUS repondu $($reply.Length)b (code=$([int]$reply[0]))" -ForegroundColor Yellow

            # Renvoyer la reponse a l'EAP
            $listener.Send($reply, $reply.Length, $fromEp) | Out-Null
            Write-Host "[$ts]    -> Reponse retournee a l'EAP" -ForegroundColor Cyan
        } catch [System.Net.Sockets.SocketException] {
            Write-Host "[$ts]    -> TIMEOUT FreeRADIUS (pas de reponse)" -ForegroundColor Red
        }
    }
} finally {
    $listener.Close()
    $fwd.Close()
    Write-Host "Relay arrete."
}

