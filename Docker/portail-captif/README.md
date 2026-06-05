# Portail Captif — OP1

## Prérequis
- Docker Desktop installé et lancé
- Le site web (collègue) doit être démarré et accessible sur le réseau

## 0. Configuration (obligatoire au premier lancement)

Les identifiants de connexion à la base de données ne sont **pas** dans le dépôt Git.

```powershell
copy .env.example .env
```

Puis ouvrir `.env` et remplir chaque valeur :

| Variable | Description | Valeur par défaut |
|---|---|---|
| `DB_HOST` | Adresse IP du serveur MySQL du site web | `192.168.30.10` |
| `DB_NAME` | Nom de la base de données | `hotel` |
| `DB_USER` | Utilisateur MySQL | à demander au collègue |
| `DB_PASSWORD` | Mot de passe MySQL | à demander au collègue |

## 1. Lancer les containers

```powershell
docker-compose up -d
```

## 2. Accéder au portail

| URL | Service |
|---|---|
| http://localhost:8081 | Portail captif WiFi |

## 3. Arrêter

```powershell
docker-compose down
```
