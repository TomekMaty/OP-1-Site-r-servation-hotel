# ============================================================
#  MAISON SACLAY - Script de lancement soutenance
#  Double-clic pour lancer avant la presentation
# ============================================================

Write-Host ""
Write-Host "  MAISON SACLAY - Preparation soutenance" -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Detecter l'IP du PC sur le reseau de la fac ──────────
Write-Host "  [1/4] Detection de l'IP reseau..." -ForegroundColor Yellow

$ip = $null

$allIps = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*"    -and
    $_.IPAddress -notlike "169.*"    -and
    $_.IPAddress -notlike "172.30.*" -and
    $_.IPAddress -notlike "172.16.*" -and
    $_.IPAddress -ne "172.20.10.1"
}

# Priorite : reseau scolaire 192.168 ou 10.x en premier, hotspot ensuite
$sorted = $allIps | Sort-Object {
    $addr = $_.IPAddress
    if     ($addr -like "192.168.*") { 0 }
    elseif ($addr -like "10.*")      { 1 }
    elseif ($addr -like "172.20.*")  { 2 }
    else                             { 3 }
}

if ($sorted) {
    $best  = @($sorted)[0]
    $ip    = $best.IPAddress
    $iface = $best.InterfaceAlias
    Write-Host "  OK  IP detectee : $ip  ($iface)" -ForegroundColor Green
} else {
    Write-Host "  ATTENTION : Aucune IP trouvee, utilisation de 127.0.0.1" -ForegroundColor Red
    $ip = "127.0.0.1"
}

# ── 2. Mettre a jour le .env ─────────────────────────────────
Write-Host ""
Write-Host "  [2/4] Mise a jour de APP_URL dans .env..." -ForegroundColor Yellow

$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envPath) {
    $content    = Get-Content $envPath -Raw
    $newContent = $content -replace "APP_URL=[^\r\n]*", "APP_URL=http://$ip"
    [System.IO.File]::WriteAllText($envPath, $newContent, [System.Text.Encoding]::UTF8)
    Write-Host "  OK  APP_URL=http://$ip" -ForegroundColor Green
} else {
    Write-Host "  ERREUR : fichier .env introuvable dans $PSScriptRoot" -ForegroundColor Red
    pause
    exit 1
}

# ── 3. Demarrer / redemarrer Docker ──────────────────────────
Write-Host ""
Write-Host "  [3/4] Verification des containers Docker..." -ForegroundColor Yellow

$running = docker ps --format "{{.Names}}" 2>$null
if ($running -match "maison_php") {
    Write-Host "  OK  Containers actifs, redemarrage PHP + Worker..." -ForegroundColor Green
    docker restart maison_php maison_worker | Out-Null
    Start-Sleep -Seconds 4
} else {
    Write-Host "  Demarrage de Docker Compose (peut prendre 20s)..." -ForegroundColor Yellow
    Set-Location $PSScriptRoot
    docker compose up -d 2>&1 | Out-Null
    Start-Sleep -Seconds 20
}

# Verifier que le worker Telegram tourne
$workerRunning = docker ps --format "{{.Names}}" 2>$null | Select-String "maison_worker"
if ($workerRunning) {
    Write-Host "  OK  Worker Telegram actif (repond aux boutons en temps reel)" -ForegroundColor Green
} else {
    Write-Host "  Worker non demarre, tentative..." -ForegroundColor Yellow
    Set-Location $PSScriptRoot
    docker compose up -d worker 2>&1 | Out-Null
    Start-Sleep -Seconds 5
}

# ── 4. Verifier que l'API repond ─────────────────────────────
Write-Host ""
Write-Host "  [4/4] Verification de l'API..." -ForegroundColor Yellow

$ok    = $false
$tries = 0
do {
    Start-Sleep -Seconds 2
    $tries++
    try {
        $r = Invoke-WebRequest -Uri "http://localhost/api/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $ok = $true }
    } catch {}
} while (-not $ok -and $tries -lt 10)

if ($ok) {
    Write-Host "  OK  API repond correctement" -ForegroundColor Green
} else {
    Write-Host "  ATTENTION : API lente, attends encore 15 secondes puis recharge" -ForegroundColor Red
}

# ── Resume ───────────────────────────────────────────────────
Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "  PRET POUR LA SOUTENANCE !" -ForegroundColor Green
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Site hotel   : http://localhost" -ForegroundColor White
Write-Host "  Admin        : http://localhost/admin  (mdp: maison2026)" -ForegroundColor White
Write-Host "  Telegram     : boutons pointent vers http://$ip" -ForegroundColor White
Write-Host ""
Write-Host "  RAPPEL : ton telephone doit etre sur le meme WiFi que ce PC" -ForegroundColor Yellow
Write-Host "  pour que les boutons Telegram fonctionnent." -ForegroundColor Yellow
Write-Host ""
pause
