# ============================================================
#  MAISON SACLAY — Script de démarrage automatique
#  Double-cliquer sur ce fichier pour tout lancer
# ============================================================

$ErrorActionPreference = "SilentlyContinue"
$projectDir = "C:\Users\bobo\Desktop\Projet Hotel 5 etoiles"

Write-Host ""
Write-Host "  ┌─────────────────────────────────────┐"
Write-Host "  │    MAISON SACLAY — Démarrage        │"
Write-Host "  └─────────────────────────────────────┘"
Write-Host ""

# 1. Charger PATH avec Docker
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 2. Vérifier si Docker daemon est actif
$dockerOk = (docker info 2>&1) -match "Server Version"

if (-not $dockerOk) {
    Write-Host "  [1/3] Docker inactif — Nettoyage sockets..."

    # Arrêter les processus Docker
    Get-Process -Name "*docker*","*Docker*" | Stop-Process -Force
    Start-Sleep -Seconds 2

    # Nettoyer les sockets Unix corrompus
    foreach ($path in @(
        "C:\Users\bobo\AppData\Local\Docker\run",
        "C:\Users\bobo\AppData\Local\docker-secrets-engine"
    )) {
        if (Test-Path $path) {
            try {
                Rename-Item $path "$path.bak$(Get-Date -Format 'HHmmss')" -Force
                New-Item -ItemType Directory -Force $path | Out-Null
            } catch {}
        }
    }

    Write-Host "  [2/3] Démarrage Docker Desktop..."
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

    Write-Host "  Attente du daemon (60 secondes)..." -NoNewline
    $waited = 0
    do {
        Start-Sleep -Seconds 5; $waited += 5
        $dockerOk = (docker info 2>&1) -match "Server Version"
        Write-Host "." -NoNewline
    } while (-not $dockerOk -and $waited -lt 90)

    Write-Host ""
    if (-not $dockerOk) {
        Write-Host ""
        Write-Host "  ❌ Docker n'a pas démarré. Ouvre Docker Desktop manuellement." -ForegroundColor Red
        Read-Host "  Appuie sur Entrée pour quitter"
        exit 1
    }
}

Write-Host "  ✅ Docker actif !"

# 3. Lancer les containers
Write-Host "  [3/3] Lancement des containers..."
Set-Location $projectDir
docker compose up -d --build 2>&1 | Where-Object { $_ -match "Started|Running|Healthy|Error|error" } | ForEach-Object { Write-Host "       $_" }

Start-Sleep -Seconds 5

# 4. Statut final
Write-Host ""
Write-Host "  ┌─────────────────────────────────────────────┐"
Write-Host "  │  ✅ MAISON SACLAY EST LANCÉ !               │"
Write-Host "  │                                             │"
Write-Host "  │  🌐  Site     →  http://localhost           │"
Write-Host "  │  🔐  Admin    →  http://localhost/admin     │"
Write-Host "  │  🗄️   Database →  http://localhost:8080      │"
Write-Host "  │  🔑  Mot de passe admin : maison2026        │"
Write-Host "  └─────────────────────────────────────────────┘"
Write-Host ""

# 5. Ouvrir le navigateur
Start-Process "http://localhost"

Read-Host "  Appuie sur Entrée pour quitter ce script (les containers continuent de tourner)"
