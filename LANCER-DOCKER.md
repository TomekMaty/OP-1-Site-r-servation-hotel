# Lancer Maison Saclay avec Docker

## Prérequis
- Docker Desktop installé et lancé

## 1. Construire le frontend React
```powershell
cd "maison-saclay"
npm run build
cd ..
```

## 2. Lancer tous les containers
```powershell
docker-compose up -d --build
```

## 3. Accéder au site
| URL | Service |
|-----|---------|
| http://localhost | Site Maison Saclay |
| http://localhost/api/rooms | API PHP — liste des chambres |
| http://localhost/api/health | Statut API |
| http://localhost:8080 | phpMyAdmin (admin DB) |

## 4. Arrêter
```powershell
docker-compose down
```

## 5. Réinitialiser la base de données
```powershell
docker-compose down -v
docker-compose up -d --build
```
