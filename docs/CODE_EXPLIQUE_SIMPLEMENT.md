# Code expliqué simplement
## Maison Saclay — Lecture fichier par fichier

---

## `backend/public/index.php`

### Rôle
Point d'entrée unique de toute l'API. Toutes les requêtes HTTP arrivent ici en premier.

### Ce que fait ce fichier

```php
// 1. Autorise les requêtes cross-origin (frontend React → backend PHP)
header('Access-Control-Allow-Origin: *');

// 2. Charge automatiquement les classes PHP selon leur nom (PSR-4)
spl_autoload_register(function (string $class): void { ... });

// 3. Lit les variables du fichier .env (SMTP, JWT_SECRET, ADMIN_PASSWORD...)
foreach (file($envFile) as $line) {
    [$key, $val] = explode('=', $line, 2);
    $_ENV[$key] = $val;
}

// 4. Définit toutes les routes de l'API
$router->get('/rooms', fn() => (new RoomController())->index());
$router->post('/bookings', fn() => (new BookingController())->store());
// ... etc.

// 5. Analyse l'URL reçue et appelle le bon controller
$router->dispatch();
```

### Phrase orale
"C'est le chef d'orchestre de toute l'API. Il lit l'URL, trouve la route qui correspond, et appelle le bon controller PHP. Toutes les requêtes passent par ici."

---

## `backend/src/Core/Router.php`

### Rôle
Traduit une URL en appel de fonction. C'est le GPS de l'API.

### Comment ça marche

```php
// Quand on écrit dans index.php :
$router->get('/rooms/:slug', fn($p) => (new RoomController())->show($p));

// Le Router convertit "/rooms/:slug" en expression régulière :
// /rooms/:slug → #^/rooms/(?P<slug>[^/]+)$#

// Quand l'URL "/api/rooms/deluxe" arrive :
// 1. Le Router retire le préfixe /api → "/rooms/deluxe"
// 2. Il compare avec chaque regex enregistrée
// 3. Il trouve le match → extrait {slug: "deluxe"}
// 4. Il appelle le handler avec ces paramètres
```

### Points importants
- `:slug` dans la route = paramètre nommé capturé automatiquement
- La méthode HTTP (GET, POST, PUT) doit correspondre
- Si aucune route ne correspond → HTTP 404

### Phrase orale
"Le routeur convertit les URLs comme `/api/rooms/deluxe` en appels de fonctions comme `RoomController::show(['slug' => 'deluxe'])`. Il utilise des expressions régulières pour extraire les paramètres."

---

## `backend/src/Core/MailService.php`

### Rôle
Service centralisé pour envoyer tous les e-mails du projet. Implémentation SMTP manuelle (sans bibliothèque externe).

### Comment on l'utilise

```php
// E-mail simple :
MailService::send('client@gmail.com', 'Sujet', 'Corps du message');

// E-mail avec fichier audio joint :
MailService::sendWithAttachment($to, $sujet, $corps, '/var/spool/asterisk/msg.wav', 'message.wav');
```

### Le protocole SMTP en étapes

```
1. PHP ouvre une connexion TCP vers smtp.gmail.com:587
2. PHP envoie "EHLO localhost" → le serveur répond "bonjour"
3. PHP envoie "STARTTLS" → connexion chiffrée (TLS) activée
4. PHP envoie "AUTH LOGIN" + user + password en base64
5. PHP envoie "MAIL FROM:", "RCPT TO:", "DATA"
6. PHP envoie les headers MIME + le corps du message
7. Si pièce jointe : contenu du fichier encodé en base64 dans le corps MIME
8. PHP envoie "QUIT"
```

### Points importants
- Si `SMTP_HOST` est vide dans `.env` → le mail est ignoré sans erreur
- Chaque envoi est loggué dans `backend/logs/mail.log`
- Le `.wav` est encodé en base64 pour être transporté dans l'e-mail

### Phrase orale
"J'ai implémenté le protocole SMTP directement en PHP, sans bibliothèque externe. Le service lit la configuration dans `.env` et peut envoyer un e-mail simple ou avec un fichier audio joint. Tout est loggué."

---

## `backend/src/Controllers/AuthController.php`

### Rôle
Gère l'inscription et la connexion des clients, et la connexion de l'admin.

### Les 3 fonctions

**`register()` — Inscription**
```php
// 1. Vérifie les champs obligatoires (first_name, last_name, email, password)
// 2. Vérifie le format de l'email (filter_var)
// 3. Vérifie que le mot de passe fait au moins 6 caractères
// 4. Vérifie que l'email n'existe pas déjà
// 5. Crée le compte (mot de passe hashé en bcrypt dans User::create)
// 6. Envoie un e-mail de bienvenue
// 7. Retourne un token JWT (connexion immédiate après inscription)
```

**`login()` — Connexion client**
```php
// 1. Cherche l'utilisateur par email
// 2. password_verify($motPasseSaisi, $hashEnBase) → true ou false
// 3. Si OK → retourne un JWT valide 7 jours
// 4. Le hash du mot de passe n'est JAMAIS renvoyé au client
```

**`adminLogin()` — Connexion admin**
```php
// L'admin n'a pas de compte en base
// Son mot de passe est dans .env (ADMIN_PASSWORD)
// hash_equals() compare en temps constant (protection timing attack)
// Retourne un JWT avec role = "admin" et user_id = 0
```

### Phrase orale
"Pour les clients, on utilise bcrypt via `password_hash`. Pour l'admin, le mot de passe est dans `.env` — pas de compte en base. Dans les deux cas, on retourne un JWT qui servira pour toutes les requêtes suivantes."

---

## `backend/src/Controllers/BookingController.php`

### Rôle
Gère tout le cycle de vie d'une réservation.

### Fonction `store()` — Créer une réservation

```php
// ÉTAPE 1 — Sécurité : vérifier le token JWT du client
$auth = AuthMiddleware::require();   // lève une erreur si pas connecté

// ÉTAPE 2 — Validation des données reçues
// Champs requis : room_id, check_in, check_out, guests
// Dates : check_out doit être après check_in

// ÉTAPE 3 — Trouver une chambre physique disponible
// Requête SQL : chercher dans physical_rooms une chambre du bon type
// dont AUCUNE réservation ne chevauche les dates demandées
$physicalRoom = $this->findAvailablePhysicalRoom($db, $roomTypeId, $checkIn, $checkOut);

// ÉTAPE 4 — Calculer le prix
$nights     = $checkIn->diff($checkOut)->days;
$totalPrice = $nights * $room['price'];

// ÉTAPE 5 — Insérer en base
$id = $this->model->create([...]);

// ÉTAPE 6 — Notifier l'admin via Telegram (avec boutons)
Telegram::sendWithKeyboard($msg, [['✅ Confirmer', '❌ Annuler']]);

// ÉTAPE 7 — Envoyer les e-mails
MailService::send($clientEmail, "Confirmation #$id", $bodyClient);
MailService::send($adminEmail, "Nouvelle réservation #$id", $bodyAdmin);
```

### La requête SQL clé — détection de chevauchement

```sql
-- Trouve une chambre LIBRE : aucune réservation ne chevauche les dates
SELECT pr.id, pr.room_number, pr.phone_extension
FROM physical_rooms pr
WHERE pr.room_type_id = :type_id
  AND pr.id NOT IN (
    SELECT b.physical_room_id
    FROM bookings b
    WHERE b.status != "cancelled"
      AND b.check_in  < :check_out    -- la résa existante commence avant notre départ
      AND b.check_out > :check_in     -- la résa existante finit après notre arrivée
  )
LIMIT 1
```

### Phrase orale
"La partie la plus complexe est la détection de chevauchement de dates. La requête SQL trouve une chambre physique qui n'est pas occupée pendant les dates demandées, en couvrant tous les cas (partiel avant, partiel après, englobant)."

---

## `backend/src/Controllers/OrderController.php`

### Rôle
Gère les commandes room service.

### Fonction `store()` — Créer une commande

```php
// ÉTAPE 1 — Identifier le client via JWT
$auth = AuthMiddleware::require();

// ÉTAPE 2 — Trouver automatiquement la chambre du client
// On cherche une réservation active aujourd'hui pour cet utilisateur
$activeBooking = $this->findActiveBooking($db, $auth['user_id']);
// → retourne le room_number de la chambre physique

// ÉTAPE 3 — Valider chaque article commandé
foreach ($body['items'] as $line) {
    $item = $this->menuModel->findById($line['menu_item_id']);
    if (!$item || !$item['available']) { erreur(); }
    $total += $item['price'] * $line['quantity'];
}

// ÉTAPE 4 — Insérer la commande + ses lignes
$orderId = $this->model->create([...]);
foreach ($validated as $line) {
    $this->model->addItem($orderId, $line['item']['id'], $line['qty'], $line['item']['price']);
}

// ÉTAPE 5 — Telegram + e-mails (même pattern que BookingController)
```

### Phrase orale
"Le client n'a pas besoin de saisir son numéro de chambre. Le système le retrouve automatiquement depuis sa réservation active — la réservation pour laquelle `check_in <= aujourd'hui < check_out`."

---

## `backend/src/Controllers/MeController.php`

### Rôle
Donne accès à l'espace personnel du client connecté : profil, réservations, commandes, mise à jour de l'e-mail.

### Les 4 fonctions

```php
// GET /api/me — Retourne le profil de l'utilisateur connecté
public function profile(): void { ... }

// GET /api/me/bookings — Retourne toutes les réservations du client
public function bookings(): void { ... }

// GET /api/me/orders — Retourne toutes les commandes du client
public function orders(): void { ... }

// PUT /api/me/email — Met à jour l'e-mail
public function updateEmail(): void {
    // 1. Vérifie le JWT du client
    // 2. Vérifie le format de l'e-mail
    // 3. Vérifie que l'e-mail n'appartient pas à un autre compte
    // 4. UPDATE users SET email = :email WHERE id = :id
    // 5. Retourne {email: "nouveau@email.com"}
}

// POST /api/admin/mail-test — Envoie un e-mail de test (admin)
public function mailTest(): void { ... }
```

### Phrase orale
"MeController donne accès à tout ce qui est personnel au client connecté. La route `PUT /me/email` est utilisée par la modal d'e-mail pour les anciens comptes."

---

## `backend/src/Controllers/VoicemailController.php`

### Rôle
Reçoit la notification d'Asterisk quand un message vocal est laissé, retrouve le bon destinataire, et envoie l'e-mail.

### Fonction `notify()` — Le flux principal

```php
// 1. Reçoit : mailbox=2001, context=hotel, new_count=1
// 2. Si new_count = 0 → ignorer (Asterisk envoie aussi quand count revient à 0)
// 3. Appelle resolveRecipient("2001") :
//      → cherche dans physical_rooms WHERE phone_extension = "2001" → chambre 201
//      → cherche réservation active pour chambre 201 aujourd'hui
//      → récupère l'email du client lié à cette réservation
// 4. Si pas de client → email = ADMIN_EMAIL (fallback)
// 5. Cherche le fichier .wav dans /var/spool/asterisk/voicemail/hotel/2001/INBOX/
// 6. Lit le fichier .txt pour trouver qui a appelé (callerID)
// 7. Envoie l'e-mail avec le .wav joint
// 8. Logue tout dans voicemail.log
```

### Les 5 cas possibles

```
extension = "1099"          → e-mail réception (c'est la réception qui a reçu le message)
extension = "2001" + client → e-mail au client de la chambre 201
extension = "2001" + pas de réservation → fallback → e-mail réception
extension inconnue          → fallback → e-mail réception
client sans e-mail          → fallback → e-mail réception
```

### Phrase orale
"VoicemailController est le plus complexe du projet. Il résout une chaîne : extension → chambre → réservation active → e-mail client. S'il échoue à n'importe quelle étape, il envoie à la réception pour ne jamais perdre le message."

---

## `maison-saclay/src/services/api.ts`

### Rôle
Fichier central qui contient toutes les fonctions de communication avec le backend PHP.

### La fonction centrale `apiFetch`

```typescript
async function apiFetch<T>(path, options, authMode = "none"): Promise<T> {
  const headers = { "Content-Type": "application/json" };

  // Ajoute automatiquement le token JWT si nécessaire
  if (authMode === "user") {
    headers.Authorization = `Bearer ${localStorage.getItem("ms_token")}`;
  }
  if (authMode === "admin") {
    headers.Authorization = `Bearer ${sessionStorage.getItem("ms_admin_token")}`;
  }

  // Fait l'appel HTTP
  const res = await fetch(`/api${path}`, { headers, ...options });
  const json = JSON.parse(await res.text());

  // Si success=false → throw une erreur (capturée dans le composant)
  if (!json.success) throw new Error(json.error);

  return json.data;  // retourne seulement la partie data
}
```

### Exemples d'utilisation

```typescript
// Sans authentification :
const rooms = await apiFetch<Room[]>('/rooms');

// En tant que client connecté :
const result = await apiFetch<BookingResult>('/bookings', {
  method: 'POST',
  body: JSON.stringify({ room_id: 1, check_in: '2026-07-01', ... }),
}, 'user');

// En tant qu'admin :
const bookings = await apiFetch<AdminBooking[]>('/bookings', {}, 'admin');
```

### Phrase orale
"api.ts est le seul endroit où on fait des appels HTTP dans le frontend. Il gère automatiquement le token JWT selon le type d'utilisateur. Les composants React appellent ces fonctions sans se soucier des détails HTTP."

---

## `maison-saclay/src/components/EmailModal.tsx`

### Rôle
Modal qui s'affiche automatiquement après connexion si le compte n'a pas d'e-mail.

### Logique d'affichage

```tsx
const { user, updateUser } = useAuth();   // récupère l'état de connexion
const [dismissed, setDismissed] = useState(false);  // "Plus tard" cliqué ?

// La modal s'affiche si :
// - user est connecté (user !== null)
// - user.email est vide ou null
// - le bouton "Plus tard" n'a pas été cliqué dans cette session
const shouldShow = !!user && !user.email && !dismissed;
```

### Logique de sauvegarde

```tsx
const handleSave = async () => {
  await updateMyEmail(trimmed);     // PUT /api/me/email → met à jour en DB
  updateUser({ email: trimmed });   // met à jour le state React + localStorage
  // La modal disparaît automatiquement : user.email est maintenant rempli
  // → shouldShow devient false → AnimatePresence retire la modal
};
```

### Phrase orale
"La modal surveille `user.email`. Dès que l'e-mail est enregistré en base ET dans le state React, la condition `shouldShow` devient false et la modal disparaît. Framer Motion gère l'animation d'entrée et de sortie."

---

## `Asterisk16/config/extensions.conf`

### Rôle
Définit la logique téléphonique : que faire quand quelqu'un compose un numéro.

### Lecture du fichier

```ini
[hotel]                         ; Contexte "hotel" — où tous les téléphones sont enregistrés

; Appel vers la réception (1099)
exten => 1099,1,Dial(SIP/1099,30)    ; faire sonner le poste SIP/1099 pendant 30s
 same => n,VoiceMail(1099@hotel,u)   ; si pas de réponse → messagerie vocale
 same => n,Hangup()                  ; raccrocher

; Appels chambres etage 2 : 2001, 2002, 2003
exten => _200[1-3],1,Dial(SIP/${EXTEN},20)    ; faire sonner pendant 20s
 same => n,VoiceMail(${EXTEN}@hotel,u)        ; messagerie vocale de l'extension appelée
 same => n,Hangup()

; *98 → écouter sa messagerie vocale depuis n'importe quel poste
exten => *98,1,VoiceMailMain(@hotel)

; *99 → alarme incendie : faire sonner TOUS les téléphones simultanément
exten => *99,1,Originate(SIP/1001,exten,alarme,s,1,async)
 same => n,Originate(SIP/1002,exten,alarme,s,1,async)
 same => n,Originate(SIP/2001,exten,alarme,s,1,async)
 ... (10 postes au total)

; *9811XXX → notification visiteur pour la chambre XXX
; ex: *9812001 → prévient la chambre 201 (extension 2001)
exten => _*9811XXX,1,Originate(SIP/${EXTEN:4},exten,visiteur,s,1,async)

[alarme]
exten => s,1,Answer()
 same => n,SendText(Alarme incendie)   ; affiché sur l'écran du téléphone
 same => n,Wait(10)
 same => n,Hangup()

[visiteur]
exten => s,1,Answer()
 same => n,SendText(Votre contact est arrive)
 same => n,Wait(5)
 same => n,Hangup()
```

### Vocabulary Asterisk
- `exten =>` : définir une extension (un numéro)
- `Dial(SIP/X, 20)` : faire sonner le poste SIP X pendant 20 secondes
- `VoiceMail(X@hotel, u)` : transférer en messagerie vocale (u = unavailable = pas de réponse)
- `same => n,` : étape suivante dans la même extension
- `${EXTEN}` : variable contenant le numéro composé
- `${EXTEN:4}` : numéro composé à partir du 4ème caractère (ex: `*9812001` → `2001`)
- `Originate(SIP/X, ..., async)` : appeler le poste X en arrière-plan sans bloquer
- `SendText(msg)` : afficher un texte sur l'écran du téléphone IP
- `_*9811XXX` : pattern — `_` = pattern, `X` = n'importe quel chiffre

### Phrase orale
"Le dialplan dit exactement quoi faire à chaque appel. `*99` déclenche 10 `Originate` en parallèle grâce au flag `async` — tous les téléphones sonnent en même temps et affichent 'Alarme incendie'. Pour le visiteur, `${EXTEN:4}` extrait l'extension de la chambre depuis le numéro composé."

---

## `Asterisk16/config/voicemail.conf`

### Rôle
Configure la messagerie vocale : formats audio, boîtes vocales, script déclenché après réception.

### Lignes importantes

```ini
[general]
format=wav|wav49|gsm       ; Formats d'enregistrement — wav en premier (le plus compatible)

externnotify=/bin/sh /etc/asterisk/scripts/voicemail_notify.sh
; ↑ CRITIQUE : ce script est appelé automatiquement après chaque message vocal
; Arguments reçus : <context> <mailbox> <new_count> <urgent_count> <old_count>
; On utilise "/bin/sh" car les scripts avec shebang ne s'exécutent pas directement
; dans les sous-processus Asterisk (limitation Docker + volumes Windows)

[hotel]                    ; Boîtes vocales de l'hôtel
1099 => 9999,Reception Maison Saclay,reception@maison-saclay.fr
1001 => 1001,Chambre 101,
; Le champ email est laissé vide car on gère l'e-mail dynamiquement via notre API
```

### Phrase orale
"La ligne `externnotify` est le déclencheur de toute la chaîne voicemail→email. Le `/bin/sh` avant le script est obligatoire car Asterisk dans Docker sur Windows ne peut pas exécuter directement des scripts avec shebang."

---

## `Asterisk16/config/scripts/voicemail_notify.sh`

### Rôle
Script shell appelé par Asterisk après chaque nouveau message vocal. Il notifie l'API PHP via HTTP.

### Fonctionnement

```sh
#!/bin/sh
CONTEXT="$1"     # "hotel"
MAILBOX="$2"     # "2001"
NEW_COUNT="$3"   # "1"
CALL_TIME="$(...)"

# Si new_count = 0 → Asterisk appelle aussi quand les messages sont lus
# On ignore ce cas (rien à envoyer)
if [ "${NEW_COUNT}" = "0" ]; then exit 0; fi

# Python3 fait la requête HTTP (pas curl)
# Raison : curl/libcurl ne s'initialise pas correctement dans les sous-processus Asterisk
# Python3 urllib.request n'a pas ce problème
RESPONSE=$(/usr/bin/python3 -c "
import urllib.request, json
data = json.dumps({'mailbox':'${MAILBOX}','context':'${CONTEXT}','new_count':${NEW_COUNT},'call_time':'${CALL_TIME}'}).encode()
req = urllib.request.Request('http://nginx/api/voicemail-notify', data=data, headers={'Content-Type':'application/json'}, method='POST')
res = urllib.request.urlopen(req, timeout=10)
print(res.read().decode())
" 2>&1)
```

### Pourquoi Python3 et pas curl ?

Curl utilise libcurl qui dépend d'OpenSSL. Dans les sous-processus créés par `ast_safe_system()` (la fonction Asterisk qui exécute les scripts), l'initialisation OpenSSL échoue → curl exit code 2 → aucun appel HTTP n'est fait.

Python3 `urllib.request` utilise les sockets TCP directement sans passer par libcurl → aucun problème.

### Phrase orale
"On a remplacé curl par Python3 après avoir découvert que curl retournait l'exit code 2 (CURLE_FAILED_INIT) quand appelé depuis Asterisk. C'est un problème d'initialisation OpenSSL dans les sous-processus. Python3 n'a pas ce problème."

---

## `docker-compose.yml` (extraits commentés)

### Structure générale

```yaml
services:
  mysql:
    image: mysql:8.0              # Utilise l'image officielle MySQL
    container_name: maison_mysql  # Nom du container (utilisé dans les commandes docker)
    volumes:
      - mysql_data:/var/lib/mysql  # Volume persistant : les données restent si on redémarre
      - ./sql/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
      # ↑ Ce fichier SQL est exécuté au PREMIER démarrage seulement (si le volume est vide)
    networks:
      - hotel-net                  # Réseau interne : les containers communiquent entre eux

  php:
    volumes:
      - ./backend:/var/www/backend          # Le code PHP est monté en direct (pas besoin de rebuild)
      - ./.env:/var/www/.env:ro             # Les secrets sont injectés depuis le .env local
      - ./Asterisk16/config/spool:/var/spool/asterisk:ro
      # ↑ PHP peut lire les fichiers .wav d'Asterisk (lecture seule, Asterisk reste maître)
    environment:
      DB_HOST: mysql               # "mysql" = nom du container MySQL sur le réseau hotel-net
      JWT_SECRET: ${JWT_SECRET}    # Valeur lue depuis .env sur le PC hôte

  asterisk:
    network_mode: host             # Accès direct au réseau du PC (obligatoire pour SIP/RTP)
    # Sans "host", les ports RTP dynamiques seraient bloqués → pas de son dans les appels

volumes:
  mysql_data:   # Volume Docker nommé : survit aux "docker compose down"
```

### Phrase orale
"`docker-compose.yml` décrit toute l'infrastructure. Les volumes partagent des dossiers entre le PC et les containers. Le réseau `hotel-net` permet aux containers de se parler par nom (PHP accède à MySQL via le hostname `mysql`)."

---

*Document créé le 29 juin 2026 — Explication fichier par fichier*
