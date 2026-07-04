# SIP Relay bidirectionnel - contourne le bug Docker Desktop UDP sur Windows
# Technique : reecrit les headers Via/Contact pour que Asterisk pense que
#             le telephone est au relay (192.168.30.10:5062).
# Ainsi, quand Asterisk envoie un INVITE a 1099, il l'envoie au relay
# qui le forwarde au vrai telephone.
#
# Flux :
#   Phone→Relay:5062  → reecrit Via/Contact → Asterisk:127.0.0.1:5060
#   Asterisk→Relay:5062 (car Via pointe ici) → forward → Phone

param(
    [int]$ListenPort = 5063,
    [string]$AsteriskIP = "127.0.0.1",
    [int]$AsteriskPort = 5060,
    [string]$RelayPublicIP = "192.168.30.10"
)

Write-Host "=== SIP Relay Bidirectionnel ===" -ForegroundColor Cyan
Write-Host "Ecoute     : 0.0.0.0:$ListenPort"
Write-Host "Asterisk   : ${AsteriskIP}:${AsteriskPort}"
Write-Host "Relay addr : ${RelayPublicIP}:${ListenPort}"
Write-Host "Ctrl+C pour arreter`n"

# Socket unique - ecoute et envoie depuis le meme port 5062
# - Asterisk repond via Via header → 192.168.30.10:5062 → recaptured ici
# - Asterisk envoie INVITE → 192.168.30.10:5062 → recaptured ici
$listener = [System.Net.Sockets.UdpClient]::new($ListenPort)
$listener.Client.ReceiveTimeout = 0  # Bloquant indefiniment

$asteriskEp = [System.Net.IPEndPoint]::new([System.Net.IPAddress]::Parse($AsteriskIP), $AsteriskPort)
$fromEp     = [System.Net.IPEndPoint]::new([System.Net.IPAddress]::Any, 0)

# Derniere adresse reelle du telephone (pour forwarder les INVITE d'Asterisk)
$lastPhoneEp = $null
$count = 0

function Rewrite-SipForAsterisk {
    param([string]$sip, [string]$origIP, [int]$origPort, [string]$newIP, [int]$newPort)

    # Via: SIP/2.0/UDP 192.168.30.x:PORT;params
    $sip = $sip -replace "(?m)(Via:\s*SIP/2\.0/UDP\s+)${origIP}:\d+", "`${1}${newIP}:${newPort}"
    # Via sans port
    $sip = $sip -replace "(?m)(Via:\s*SIP/2\.0/UDP\s+)${origIP}(?=[;\s\r\n])", "`${1}${newIP}:${newPort}"

    # Contact: <sip:EXT@IP:PORT>  et  Contact: sip:EXT@IP:PORT
    $sip = $sip -replace "@${origIP}:\d+", "@${newIP}:${newPort}"
    $sip = $sip -replace "@${origIP}(?=[>\s;\r\n])", "@${newIP}:${newPort}"

    return $sip
}

try {
    while ($true) {
        $data   = $listener.Receive([ref]$fromEp)
        $count++
        $ts     = Get-Date -Format "HH:mm:ss.fff"
        $srcIP  = $fromEp.Address.ToString()
        $srcPort= $fromEp.Port
        $msg    = [System.Text.Encoding]::UTF8.GetString($data)
        $first  = $msg.Substring(0, [Math]::Min(40, $msg.Length)) -replace "`r`n.*",""

        if ($srcIP -like "192.168.30.*") {
            # ── Phone → Asterisk ──────────────────────────────────────────
            $lastPhoneEp = [System.Net.IPEndPoint]::new($fromEp.Address, $srcPort)

            $rewritten = Rewrite-SipForAsterisk $msg $srcIP $srcPort $RelayPublicIP $ListenPort
            $changed   = ($rewritten -ne $msg)
            $bytes     = [System.Text.Encoding]::UTF8.GetBytes($rewritten)

            $listener.Send($bytes, $bytes.Length, $asteriskEp) | Out-Null

            $tag = if ($changed) { "[REWRITE]" } else { "" }
            Write-Host "[$ts] #$count Phone→Ast  $srcIP`:$srcPort  → ${AsteriskIP}:${AsteriskPort}  $tag  $first" -ForegroundColor Green

        } else {
            # ── Asterisk → Phone ──────────────────────────────────────────
            if ($null -ne $lastPhoneEp) {
                $listener.Send($data, $data.Length, $lastPhoneEp) | Out-Null
                Write-Host "[$ts] #$count Ast→Phone  ${srcIP}:${srcPort}  → $($lastPhoneEp.Address):$($lastPhoneEp.Port)  $first" -ForegroundColor Yellow
            } else {
                Write-Host "[$ts] #$count Ast→Phone  ${srcIP}:${srcPort}  WARN: aucun telephone connu, paquet ignore" -ForegroundColor Red
            }
        }
    }
} finally {
    $listener.Close()
    Write-Host "SIP Relay arrete."
}
