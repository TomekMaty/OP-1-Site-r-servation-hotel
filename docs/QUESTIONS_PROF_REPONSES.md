# Questions du professeur — Réponses préparées
## Maison Saclay — Hôtel 5 étoiles

---

## INFRASTRUCTURE & OUTILS

### C'est quoi Docker ?
Docker permet de faire tourner plusieurs services (PHP, MySQL, nginx, Asterisk...) dans des environnements isolés appelés containers, sur un seul PC. Une seule commande `docker compose up -d` lance tout le projet. Sans Docker, il faudrait installer chaque service manuellement sur chaque machine.

### C'est quoi un container ?
Un container est un service isolé qui tourne de façon indépendante. Il a son propre système de fichiers, ses propres processus, mais partage le noyau Linux du PC hôte. C'est plus léger qu'une machine virtuelle.

### Pourquoi Docker ?
1. Démarrer tout le projet en une commande.
2. Fonctionne identiquement sur n'importe quelle machine (PC dev, serveur, Debian fac).
3. Les services sont isolés : si PHP plante, MySQL continue.
4. Les données MySQL sont dans un volume persistant qui survit aux redémarrages.

### C'est quoi un volume Docker ?
Un volume est un dossier partagé entre le PC et un container. Les données y sont persistantes. Exemple : `mysql_data:/var/lib/mysql` = les données MySQL sont sur le PC, pas dans le container. Si on supprime le container, les données restent.

### C'est quoi React ?
React est une bibliothèque JavaScript qui permet de créer des interfaces web dynamiques. On divise l'interface en composants réutilisables. Quand une donnée change, React ne recharge que la partie concernée (pas toute la page). On appelle ça une SPA — Single Page Application.

### C'est quoi PHP backend ?
PHP est le langage côté serveur. Il reçoit les requêtes HTTP du frontend, les valide, interroge MySQL, et retourne des réponses JSON. On a choisi PHP car il est simple à déployer et s'intègre naturellement avec MySQL via PDO.

### C'est quoi une API ?
API = Application Programming Interface. C'est une interface de communication entre le frontend React et le backend PHP. Le frontend envoie des requêtes HTTP (`GET /api/rooms`, `POST /api/bookings`...) et le backend répond en JSON.

### C'est quoi une route API ?
Une route est l'association entre une URL + une méthode HTTP et une fonction PHP. Exemple : `POST /api/bookings` → `BookingController::store()`. Si l'URL ne correspond à aucune route, l'API retourne 404.

### C'est quoi un contrôleur ?
Un contrôleur est un fichier PHP qui contient la logique d'une fonctionnalité. Il reçoit la requête, valide les données, interroge la base, et renvoie une réponse. Par exemple, `BookingController` gère tout ce qui concerne les réservations.

### C'est quoi MySQL ?
MySQL est une base de données relationnelle. Elle stocke les données dans des tables (users, bookings, orders...) avec des relations entre elles (une réservation référence un client et une chambre). On y accède via SQL et via la librairie PDO en PHP.

### C'est quoi `.env` ?
Un fichier `.env` contient les secrets du projet : mots de passe, clés API, credentials SMTP. Il n'est pas dans Git (pas versionné). Chaque machine a son propre `.env`. En PHP, on lit ces valeurs avec `$_ENV['SMTP_PASSWORD']`. Ça évite de mettre des mots de passe dans le code.

### C'est quoi SMTP ?
SMTP (Simple Mail Transfer Protocol) est le protocole pour envoyer des e-mails. On s'y connecte via une socket TCP (port 587), on s'authentifie, et on envoie le message. On utilise Gmail comme serveur SMTP. Les identifiants Gmail sont dans `.env`.

---

## FONCTIONNALITÉS

### C'est quoi Asterisk ?
Asterisk est un PABX open source — un système téléphonique en logiciel. Il gère les extensions SIP (les postes IP), les appels entre postes, la messagerie vocale, l'alarme incendie et les notifications visiteur. Il tourne dans Docker en mode réseau "host" car SIP et RTP utilisent des ports dynamiques.

### Comment fonctionne l'alarme incendie ?
La réception compose `*99`. Asterisk déclenche 10 `Originate` simultanés grâce au flag `async` — tous les téléphones de l'hôtel sonnent en même temps. Chaque poste décroche automatiquement et affiche **"Alarme incendie"** via `SendText()`. Le message reste 10 secondes puis l'appel se coupe.

### Comment la réception prévient une chambre qu'un visiteur est arrivé ?
La réception compose `*9812001` pour la chambre 201 par exemple. Asterisk extrait `${EXTEN:4}` pour obtenir l'extension `2001`, puis sonne ce poste. L'écran affiche **"Votre contact est arrivé"** pendant 5 secondes — sans que le client ait besoin de décrocher.

### C'est quoi FreeRADIUS ?
FreeRADIUS est le serveur qui gère l'authentification Wi-Fi via le protocole RADIUS. La borne EAP330 lui envoie le login/mot de passe du client, FreeRADIUS vérifie et répond "oui" (Access-Accept) ou "non" (Access-Reject). C'est le standard dans les hôtels et les entreprises.

### C'est quoi Access-Accept ?
C'est la réponse positive que FreeRADIUS envoie à la borne quand les identifiants sont corrects. La borne EAP330 reçoit Access-Accept et débloque l'accès Internet pour cet appareil.

### Comment le portail captif marche ?
1. Client connecte son téléphone au Wi-Fi OP1_Wifi.
2. La borne EAP330 affiche une page de login.
3. Client entre son numéro de chambre (ex: 201) comme login ET mot de passe.
4. La borne envoie une requête RADIUS UDP vers notre serveur.
5. Un relay reçoit et retransmet vers FreeRADIUS dans Docker.
6. FreeRADIUS vérifie → Access-Accept ou Access-Reject.
7. Selon la réponse, Internet est autorisé ou bloqué pour cet appareil.

### Comment les mails marchent ?
Tous les e-mails passent par `MailService.php`. On ouvre une connexion TCP vers smtp.gmail.com:587, on active STARTTLS (chiffrement), on s'authentifie, et on envoie le message. La configuration SMTP est dans `.env`. Chaque envoi est loggué dans `mail.log`.

### Comment le voicemail arrive par mail ?
1. Personne ne répond à un appel → Asterisk enregistre le message.
2. Asterisk appelle `voicemail_notify.sh` automatiquement.
3. Le script envoie l'extension à notre API PHP via HTTP (avec Python3).
4. `VoicemailController` cherche la chambre, la réservation, l'e-mail du client.
5. Il joint le fichier `.wav` et envoie l'e-mail via `MailService`.

### Comment le système sait quel client reçoit le message vocal ?
Il fait une chaîne de 3 requêtes SQL :
1. `physical_rooms WHERE phone_extension = '2001'` → chambre 201
2. `bookings WHERE physical_room_id = X AND check_in <= TODAY AND check_out > TODAY` → la réservation active
3. `users WHERE id = booking.user_id` → l'e-mail du client

### Que se passe-t-il si aucun client n'est trouvé pour le voicemail ?
Il y a un fallback : le message est envoyé à l'adresse `ADMIN_EMAIL` (la réception). On ne perd jamais un message vocal. C'est écrit dans `voicemail.log` avec le statut `FALLBACK`.

### Comment fonctionne une réservation ?
1. Client choisit chambre + dates sur le site React.
2. Frontend envoie `POST /api/bookings` avec token JWT.
3. Backend vérifie les dates, trouve une chambre physique libre (requête SQL anti-chevauchement).
4. Calcule le prix (nuits × tarif), insère en base, envoie e-mails + notification Telegram.
5. L'admin confirme ou annule via Telegram ou le tableau de bord.

### Comment le room service marche ?
Le client choisit des plats dans la page Restaurant. Le backend retrouve automatiquement son numéro de chambre depuis sa réservation active. Il calcule le total, insère la commande, notifie l'admin. L'admin met à jour le statut : pending → preparing → delivered.

---

## TECHNIQUE

### C'est quoi un JWT ?
JSON Web Token. Un standard pour transmettre des informations de façon sécurisée. Il contient 3 parties en base64 : header (algorithme), payload (données : user_id, role, expiration), signature HMAC-SHA256. Si quelqu'un modifie le payload, la signature ne correspond plus → rejet.

### Comment on vérifie un JWT ?
On recalcule la signature avec notre clé secrète (`JWT_SECRET` dans `.env`). Si la signature calculée correspond à la signature du token, il est valide. Si quelqu'un a modifié le payload (ex: changer role de "user" à "admin"), la signature ne correspond plus.

### C'est quoi PDO ?
PHP Data Objects — la couche d'abstraction PHP pour accéder aux bases de données. Il supporte les requêtes préparées avec paramètres bindés, ce qui empêche les injections SQL. On ne concatène jamais des données utilisateur dans le SQL.

### Comment sont protégés les mots de passe ?
Avec bcrypt via `password_hash()`. On ne stocke jamais le mot de passe en clair. Pour la vérification, `password_verify($saisi, $hash)` compare le mot de passe saisi avec le hash stocké.

### Comment sont protégées les routes admin ?
`AdminMiddleware::require()` est appelé en premier dans chaque fonction admin. Il lit le header `Authorization: Bearer <token>`, décode le JWT, vérifie la signature et que `role === "admin"`. Si ça échoue → HTTP 401 ou 403, arrêt immédiat.

### C'est quoi CORS ?
Cross-Origin Resource Sharing. Un mécanisme de sécurité des navigateurs qui bloque les requêtes entre domaines différents. On configure `Access-Control-Allow-Origin: *` dans le backend pour autoriser le frontend React (qui tourne sur le même domaine via nginx, mais qui serait bloqué en développement).

### C'est quoi bcrypt ?
Un algorithme de hachage conçu spécifiquement pour les mots de passe. Il est intentionnellement lent (pour résister aux attaques par force brute) et intègre un salt aléatoire (pour éviter les rainbow tables). `password_hash()` et `password_verify()` en PHP utilisent bcrypt par défaut.

---

## COMMENT MODIFIER LE PROJET

### Comment ajouter une page frontend ?
1. Créer un fichier `.tsx` dans `maison-saclay/src/pages/`
2. Ajouter la route dans `App.tsx`
3. Ajouter un lien dans la navigation si besoin
4. Rebuilder : `cd maison-saclay && npm run build`
5. Vérifier dans le navigateur

### Comment ajouter une image ?
1. Mettre l'image dans `maison-saclay/src/assets/`
2. L'importer : `import monImage from "@/assets/mon-image.jpg"`
3. L'afficher : `<img src={monImage} alt="..." />`
4. Rebuilder

### Comment ajouter une route API ?
1. Dans `backend/public/index.php` : `$router->get('/nouvelle-route', fn() => (new MonController())->maFonction());`
2. Créer le controller dans `backend/src/Controllers/`
3. Tester : `curl http://localhost/api/nouvelle-route`

### Comment ajouter une table SQL ?
1. Écrire le `CREATE TABLE` SQL
2. L'exécuter via phpMyAdmin (http://localhost:8080) ou `docker exec maison_mysql mysql ...`
3. Créer le Model PHP correspondant dans `backend/src/Models/`
4. Ne pas modifier `schema.sql` si la base est déjà créée (ne serait pas ré-exécuté)

### Comment tester que le mail marche ?
```bash
curl -X POST http://localhost/api/admin/mail-test \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"to":"votre@email.com"}'
```
Puis vérifier `docker exec maison_php tail -5 /var/www/backend/logs/mail.log`

### Comment entrer dans un container Docker ?
```bash
docker exec -it maison_php bash     # entrer dans PHP
docker exec -it maison_asterisk sh  # entrer dans Asterisk (sh car pas de bash)
docker exec -it maison_mysql bash   # entrer dans MySQL
```

### Comment rebuild le frontend ?
```bash
cd maison-saclay
npm run build
# → génère dist/ → nginx sert automatiquement le nouveau build
```

### Comment voir les logs ?
```bash
docker compose logs php --tail 30        # logs PHP
docker compose logs asterisk --tail 30   # logs Asterisk
docker compose logs freeradius --tail 20 # logs FreeRADIUS
docker exec maison_php tail -20 /var/www/backend/logs/mail.log
docker exec maison_php tail -20 /var/www/backend/logs/voicemail.log
```

### Comment redémarrer le projet ?
```bash
docker compose restart          # redémarre tous les containers
docker compose restart php      # redémarre seulement PHP
docker compose stop             # stoppe tout (sans supprimer)
docker compose up -d            # relance tout
```

---

## DIFFICULTÉS ET SOLUTIONS

### Quelle difficulté as-tu rencontrée ?
Deux principales. D'abord le portail captif Wi-Fi : Docker Desktop ne peut pas recevoir des paquets UDP depuis le réseau local (limitation Windows). On a créé un relay PowerShell pour faire le pont entre la borne et FreeRADIUS.

Ensuite, le voicemail par e-mail : curl retournait l'exit code 2 (CURLE_FAILED_INIT) quand appelé depuis les sous-processus Asterisk. On a remplacé curl par Python3 `urllib.request` qui n'utilise pas libcurl.

### Qu'est-ce que tu améliorerais ?
1. HTTPS avec Let's Encrypt
2. Interface admin pour voir l'historique des messages vocaux
3. Vraie capture DNS (Pi-hole) à la place des données de démo
4. Monitoring automatique des services
5. Double authentification pour l'admin

### Pourquoi ne pas utiliser un framework comme Laravel ou Symfony ?
On a choisi une architecture MVC légère sans framework pour pouvoir expliquer chaque ligne de code. Avec Laravel, beaucoup de choses sont cachées derrière des abstractions. Ici, on peut montrer exactement comment le routeur fonctionne, comment le JWT est construit, comment SMTP est géré.

---

## DÉMONSTRATION

### Dans quel ordre montrer le projet ?
1. `docker ps` → tous les containers Up
2. Site frontend sur http://localhost
3. Créer un compte → e-mail de bienvenue
4. Réservation → e-mail client + réception
5. Room service → e-mail client + réception
6. Portail captif Wi-Fi → login 201/201 → Internet OK
7. Asterisk : appel chambre → voicemail → e-mail avec .wav
8. Logs : `mail.log` et `voicemail.log`
9. phpMyAdmin → montrer les tables

### Que faire si quelque chose ne marche pas ?
```bash
# Vérifier les containers
docker ps

# Redémarrer si un container est Down
docker compose restart

# Vérifier les erreurs
docker compose logs php --tail 20
```
