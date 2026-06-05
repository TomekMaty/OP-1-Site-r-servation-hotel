# Lancer Maison Saclay avec Docker

## Prérequis
- Docker Desktop installé et lancé

## 0. Configuration des secrets (obligatoire au premier lancement)

Les mots de passe et clés secrètes ne sont **pas** dans le dépôt Git. Il faut créer un fichier `.env` à partir du modèle fourni.

```powershell
copy .env.example .env
```

Puis ouvrir `.env` et remplir chaque valeur :

| Variable | Description | Exemple |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | Mot de passe root MySQL | `MonMotDePasse123!` |
| `MYSQL_USER` | Utilisateur MySQL de l'application | `saclay_user` |
| `MYSQL_PASSWORD` | Mot de passe de cet utilisateur | `MonMotDePasse456!` |
| `JWT_SECRET` | Clé secrète pour signer les tokens JWT (min. 32 caractères) | générer avec `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | Mot de passe du compte administrateur du site | `AdminSecret!` |
| `TELEGRAM_BOT_TOKEN` | Token du bot Telegram pour les notifications room service | obtenir via @BotFather |
| `TELEGRAM_CHAT_ID` | ID du chat Telegram qui reçoit les notifications | obtenir via @userinfobot |

> **Note :** `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID` peuvent rester vides si vous ne souhaitez pas les notifications.

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
