# FUSION DOCKER — Maison Saclay

## Architecture complète (7 services)

```
docker compose up -d --build
```

| Service          | Container          | Port(s)       | Rôle                                |
|------------------|--------------------|---------------|-------------------------------------|
| `mysql`          | maison_mysql       | 3306          | Base de données MySQL 8             |
| `php`            | maison_php         | 9000 (interne)| API backend PHP 8.2 (FastCGI)       |
| `portail-captif` | maison_portail     | 9000 (interne)| Portail WiFi PHP (FastCGI)          |
| `nginx`          | maison_nginx       | **80**        | Reverse proxy + site + portail WiFi |
| `worker`         | maison_worker      | —             | Worker Telegram (polling boucle)    |
| `phpmyadmin`     | maison_phpmyadmin  | **8080**      | Interface admin base de données     |
| `asterisk`       | maison_asterisk    | 5060 / 5000-20000 | PBX téléphonie IP (SIP/RTP)    |

## URLs d'accès

| Service       | URL                        |
|---------------|----------------------------|
| Site hôtel    | http://localhost            |
| Admin         | http://localhost/admin      |
| Portail WiFi  | http://localhost/wifi       |
| phpMyAdmin    | http://localhost:8080       |
| API REST      | http://localhost/api/rooms  |

## Commandes utiles

```bash
# Lancer tout le projet
docker compose up -d --build

# Vérifier l'état des conteneurs
docker compose ps

# Voir les logs d'un service
docker compose logs nginx
docker compose logs php
docker compose logs asterisk
docker compose logs portail-captif

# Suivre les logs en temps réel
docker compose logs -f worker

# Stopper tout
docker compose down

# Reset complet (ATTENTION : supprime la base)
docker compose down -v
docker compose up -d --build
```

## Réseau Docker

Tous les services (sauf Asterisk) sont dans le réseau bridge **hotel-net**.
Asterisk utilise `network_mode: host` pour accéder directement aux ports SIP/RTP de la machine hôte.

## Initialisation de la base de données

MySQL charge automatiquement au premier démarrage :
1. `sql/schema.sql` — création des 8 tables
2. `sql/seed.sql` — données initiales (14 articles menu, 3 types de chambres)
3. `sql/03-physical-rooms.sql` — 9 chambres physiques avec postes téléphoniques

Si la base existe déjà (volume mysql_data persistant), ces fichiers ne sont PAS rejoués.
Pour forcer un rechargement : `docker compose down -v && docker compose up -d --build`
