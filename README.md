# Maison Saclay — Site de réservation hôtel

Projet complet : site de réservation (React/Vite + API PHP), portail captif WiFi
(Nginx + PHP + FreeRADIUS) et téléphonie interne (Asterisk 16), le tout orchestré
via Docker Compose.

## Services

| Service | Rôle |
|---|---|
| `mysql` | Base de données MySQL 8 (réservations, utilisateurs, chambres) |
| `php` | API backend PHP 8.2-FPM |
| `worker` | Worker PHP : traite les réponses des boutons Telegram |
| `portail-captif` | Portail captif WiFi (auth invités via FreeRADIUS) |
| `nginx` | Reverse proxy (sert le frontend + route l'API + le portail) |
| `phpmyadmin` | Administration de la base de données |
| `freeradius` | Authentification RADIUS pour le portail captif |
| `asterisk` | Téléphonie interne (Asterisk 16, chan_sip) |

## Prérequis

- Docker + Docker Compose
- Node.js (pour builder le frontend avant de lancer les containers)

## Configuration (à faire avant le premier lancement)

1. Copier le fichier d'exemple et renseigner tes propres valeurs :
   ```bash
   cp .env.example .env
   ```
   Variables à définir dans `.env` :
   - `JWT_SECRET` / `ADMIN_PASSWORD` : à remplacer par des valeurs fortes, ne jamais réutiliser celles de l'exemple
   - `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` : notifications de réservation via Telegram
   - `SMTP_*` / `ADMIN_EMAIL` : envoi d'emails (confirmation de réservation, etc.)

   `.env` est ignoré par git — ne jamais le committer.

2. Les identifiants MySQL (`DB_*`) sont définis en dur dans `docker-compose.yml`
   pour l'environnement de développement. À adapter/sécuriser pour une mise en prod.

## Lancer le projet

```bash
# 1. Builder le frontend React
cd maison-saclay
npm install
npm run build
cd ..

# 2. Lancer tous les containers
docker-compose up -d --build
```

| URL | Service |
|---|---|
| http://localhost | Site Maison Saclay |
| http://localhost/api/rooms | API PHP — liste des chambres |
| http://localhost/api/health | Statut de l'API |
| http://localhost:8080 | phpMyAdmin |

Arrêter les containers :
```bash
docker-compose down
```

Réinitialiser complètement la base de données :
```bash
docker-compose down -v
docker-compose up -d --build
```

## Structure du projet

```
backend/            API PHP (contrôleurs, modèles, config)
maison-saclay/       Frontend React/Vite (site de réservation)
portail-captif/       Portail captif WiFi (Nginx + PHP)
freeradius/           Config FreeRADIUS
Asterisk16/           Config téléphonie Asterisk
docker/               Dockerfiles Nginx / PHP
sql/                  Schéma et seed de la base de données
docs/                 Documentation complémentaire
```

## À savoir pour les autres contributeurs

- Ne jamais committer `.env`, les dumps SQL (`backup_mysql*.sql`) ou `node_modules/` /
  `dist/` — ils sont dans `.gitignore`.
- Les dumps SQL locaux contiennent des données de test avec de vrais emails et des
  hashs de mots de passe : à garder strictement en local, jamais sur le repo distant.
- Voir aussi `RAPPORT-TECHNIQUE.md` pour le détail technique du projet, et les
  README spécifiques dans `maison-saclay/` et `portail-captif/`.
