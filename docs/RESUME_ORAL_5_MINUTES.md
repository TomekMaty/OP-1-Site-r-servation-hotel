# Fiche orale — 5 minutes chrono
## Maison Saclay — Hôtel 5 étoiles

---

## 1. Introduction — 30 secondes

"Notre projet s'appelle Maison Saclay.
C'est une plateforme complète pour gérer un hôtel 5 étoiles.

Un client peut :
- créer un compte
- réserver une chambre en ligne
- commander un repas en chambre
- se connecter au Wi-Fi de l'hôtel
- utiliser un téléphone interne
- recevoir des e-mails automatiques pour chaque action

Tout tourne dans Docker — 8 services lancés en une seule commande."

---

## 2. Architecture — 45 secondes

"Il y a 3 grandes parties.

**Le site web** : un frontend React que les clients utilisent,
un backend PHP qui reçoit les demandes,
une base MySQL qui stocke tout.

**La téléphonie** : Asterisk gère les appels entre chambres.
Quand personne ne répond, le client reçoit le message vocal par e-mail.

**Le Wi-Fi** : la borne EAP330 de l'hôtel vérifie les identifiants
via un serveur FreeRADIUS. Si le numéro de chambre est correct, Internet est autorisé.

Tout est dans Docker. Les 8 services communiquent entre eux via un réseau interne."

---

## 3. Réservation et commandes — 45 secondes

"Quand un client veut réserver :
- il choisit un type de chambre et des dates
- le backend trouve automatiquement une chambre physique libre
- il calcule le prix, enregistre la réservation
- il envoie un e-mail de confirmation au client et un e-mail à la réception
- l'admin reçoit aussi une notification Telegram avec des boutons pour confirmer ou annuler

Pour les commandes room service, c'est le même principe :
le client commande depuis son téléphone, le système retrouve automatiquement
son numéro de chambre via sa réservation active, et notifie l'hôtel."

---

## 4. Portail captif Wi-Fi — 45 secondes

"Quand un client se connecte au Wi-Fi de l'hôtel,
une page de login s'affiche automatiquement.

Il entre son numéro de chambre comme identifiant et mot de passe.
La borne Wi-Fi envoie ces identifiants à notre serveur FreeRADIUS.
FreeRADIUS vérifie et répond Access-Accept ou Access-Reject.
Si c'est accepté, Internet est débloqué pour cet appareil.

On utilise le protocole RADIUS — c'est le standard dans les hôtels et les entreprises.

Un problème qu'on a rencontré : Docker ne peut pas recevoir directement
les paquets UDP du réseau local. On a créé un relay qui fait le pont
entre la borne et FreeRADIUS."

---

## 5. Asterisk — Téléphonie — 45 secondes

"Asterisk est le système téléphonique interne de l'hôtel.
Chaque chambre a une extension : chambre 201 = poste 2001.
La réception a le poste 1099.

Les clients peuvent s'appeler entre eux ou appeler la réception.

Si quelqu'un appelle une chambre et que personne ne répond
après 20 secondes, l'appel bascule en messagerie vocale.
Asterisk enregistre le message, déclenche automatiquement
notre script Python, et le client reçoit le message vocal
par e-mail en pièce jointe.

En plus du voicemail, on a deux fonctionnalités spéciales :

**Alarme incendie** : la réception compose `*99`.
Asterisk appelle tous les téléphones en même temps — 10 postes simultanément.
Chaque écran affiche 'Alarme incendie' automatiquement.

**Visiteur attendu** : la réception compose `*9812001` pour prévenir la chambre 201.
Le téléphone sonne et l'écran affiche 'Votre contact est arrivé'."

---

## 6. Système e-mail et voicemail — 1 minute

"On a un service d'e-mails centralisé qui s'appelle MailService.
Toutes les parties du projet l'utilisent de la même façon.

Il envoie des e-mails pour :
- l'inscription d'un client
- chaque réservation
- chaque commande
- chaque message vocal reçu

Pour la configuration SMTP, tout est dans un fichier `.env` —
jamais dans le code. C'est une bonne pratique de sécurité.

Pour le voicemail, le flux est le suivant :
1. Asterisk appelle notre script après chaque message vocal
2. Le script envoie l'extension téléphonique à notre API
3. L'API cherche quelle chambre correspond à cette extension
4. Elle cherche quelle réservation est active aujourd'hui pour cette chambre
5. Elle récupère l'e-mail du client
6. Elle envoie le message vocal en pièce jointe

Si le client n'est pas trouvé — par exemple pas de réservation, ou pas d'e-mail —
le message est envoyé à la réception.
On ne perd jamais un message vocal."

---

## 7. Docker et déploiement — 30 secondes

"Tout le projet tourne dans Docker.
8 services : PHP, MySQL, nginx, FreeRADIUS, Asterisk, Telegram worker, phpMyAdmin, et un ancien portail.

Pour lancer tout le projet : `docker compose up -d`
Pour vérifier : `docker ps`

Les données MySQL sont dans un volume persistant.
Même si on redémarre les containers, les données restent.

Docker nous permet de tout déployer sur n'importe quelle machine
sans installer quoi que ce soit manuellement."

---

## 8. Tests à montrer — 30 secondes

"En direct, je peux montrer :
- `docker ps` → tous les services actifs
- créer un compte → e-mail de bienvenue reçu
- faire une réservation → e-mail client et réception
- se connecter au Wi-Fi avec `201 / 201` → Internet autorisé
- appeler une chambre qui ne répond pas → message vocal → e-mail avec le fichier audio
- les logs `mail.log` et `voicemail.log` qui tracent tout"

---

## 9. Conclusion — 20 secondes

"Ce projet couvre des sujets variés : développement web, base de données,
téléphonie IP, protocole réseau RADIUS, et containerisation Docker.

Chaque partie communique avec les autres.
On a résolu des problèmes concrets sur chaque composant.
Le tout fonctionne ensemble comme un vrai système d'hôtel."

---

---

## SI LE PROF ME COUPE — Réponses ultra courtes

**C'est quoi Docker ?**
> Un outil qui fait tourner plusieurs services isolés sur un même PC, en une seule commande. Comme des petits serveurs séparés qui se parlent entre eux.

**C'est quoi FreeRADIUS ?**
> Le serveur qui vérifie les identifiants Wi-Fi. La borne lui envoie le login/mot de passe, il répond oui ou non.

**C'est quoi Access-Accept ?**
> La réponse positive de FreeRADIUS. Ça dit à la borne : "ces identifiants sont valides, autorise cet appareil."

**Comment Asterisk envoie le mail vocal ?**
> Asterisk appelle un script Python après chaque message. Ce script appelle notre API PHP. L'API envoie l'e-mail avec le fichier audio joint.

**Comment le système sait quel client reçoit le message vocal ?**
> On convertit l'extension téléphonique en numéro de chambre via la base de données. Puis on cherche quelle réservation est active aujourd'hui pour cette chambre. On récupère l'e-mail du client lié à cette réservation.

**Que se passe-t-il si le client n'a pas d'e-mail ?**
> Le message est envoyé à la réception. On ne perd jamais un message vocal — c'est le fallback.

**Pourquoi `.env` ?**
> Pour ne jamais mettre les mots de passe dans le code. Si le code est partagé ou publié, les secrets restent protégés.

**Comment tester que le mail marche ?**
> On utilise une route admin `/api/admin/mail-test` et on vérifie le fichier `mail.log` qui trace tous les envois.

---

---

## MINI CHECKLIST — À montrer devant le prof

```
[ ] docker ps               → tous les containers Up
[ ] Site frontend           → ouvrir http://localhost
[ ] Créer un compte         → e-mail de bienvenue reçu
[ ] Faire une réservation   → e-mail client + réception
[ ] Faire une commande      → e-mail client + réception
[ ] Portail captif Wi-Fi    → login 201/201 → Internet OK
[ ] Appel Asterisk          → chambre ne répond pas
[ ] Voicemail reçu          → e-mail avec .wav joint
[ ] Logs mail.log           → toutes les lignes OK
[ ] Logs voicemail.log      → extension / chambre / client / audio
```

---

*Pour les détails complets → voir `docs/EXPLICATION_CODE_ORAL.md`*
