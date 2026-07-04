# TÉLÉPHONIE IP — Maison Saclay

## Architecture

- **Serveur PBX** : Asterisk 16 (container Docker `maison_asterisk`)
- **Protocole** : SIP (Session Initiation Protocol)
- **Ports** : 5060 UDP/TCP (SIP), 5000–20000 UDP (RTP audio)
- **Réseau** : `network_mode: host` (accès direct à la carte réseau hôte)

## Correspondance Chambre → Poste téléphonique

| Chambre | Type               | Extension SIP |
|---------|--------------------|---------------|
| 101     | Chambre Déluxe     | **1001**      |
| 102     | Chambre Déluxe     | **1002**      |
| 103     | Chambre Déluxe     | **1003**      |
| 201     | Suite Panoramique  | **2001**      |
| 202     | Suite Panoramique  | **2002**      |
| 203     | Suite Panoramique  | **2003**      |
| 601     | Penthouse          | **6001**      |
| 602     | Penthouse          | **6002**      |
| 603     | Penthouse          | **6003**      |
| Réception (24h/24) | —       | **1099**      |

> Le champ `phone_extension` en base (`physical_rooms`) stocke ce numéro pour chaque chambre.
> La logique : numéro de chambre 201 → extension 2001, chambre 601 → 6001, etc.

## Fonctionnalités Asterisk configurées

### 1. Appel réception (1099)
Depuis n'importe quelle chambre, composer le **1099** pour joindre la réception.
Si pas de réponse en 30 s → boîte vocale de la réception.

### 2. Alarme incendie (*99)

**Déclenchement :** La réception compose **`*99`**

**Ce qui se passe :**
- Asterisk appelle **simultanément** tous les postes (1001, 1002, 1003, 2001, 2002, 2003, 6001, 6002, 6003, 1099) via `Originate` avec le flag `async`
- Chaque téléphone décroche automatiquement
- L'écran de chaque téléphone affiche **"Alarme incendie"** via `SendText()`
- Le message reste affiché 10 secondes (`Wait(10)`) puis l'appel se coupe

**Code dans `extensions.conf` :**
```
exten => *99,1,Originate(SIP/1001,exten,alarme,s,1,async)
 same => n,Originate(SIP/2001,exten,alarme,s,1,async)
 ...

[alarme]
exten => s,1,Answer()
 same => n,SendText(Alarme incendie)
 same => n,Wait(10)
 same => n,Hangup()
```

### 3. Notification visiteur attendu (*9811XXX)

**Déclenchement :** La réception compose **`*9811XXX`** (ex : `*9812001` pour prévenir la chambre 201)

**Ce qui se passe :**
- Asterisk sonne le poste `XXX` (extrait depuis `${EXTEN:4}`)
- L'écran du téléphone de la chambre affiche **"Votre contact est arrivé"**
- Le message reste 5 secondes puis l'appel se coupe

**Code dans `extensions.conf` :**
```
exten => _*9811XXX,1,Originate(SIP/${EXTEN:4},exten,visiteur,s,1,async)

[visiteur]
exten => s,1,Answer()
 same => n,SendText(Votre contact est arrive)
 same => n,Wait(5)
 same => n,Hangup()
```

### 4. Messagerie vocale (*98 pour écouter)
Si appel sans réponse en 20 s → boîte vocale enregistrée → email automatique avec `.wav` joint.

## Intégration avec le site de réservation

Lors d'une réservation, le backend PHP :
1. Attribue automatiquement une chambre physique disponible
2. Récupère le `phone_extension` depuis la table `physical_rooms`
3. Inclut le numéro de poste dans la réponse API
4. Le frontend affiche : **« Chambre 201 — Poste téléphonique : 1004 »**

## Pour la soutenance — phrase clé

> "Chaque chambre possède un numéro de téléphone interne enregistré en base.
> Lorsqu'une réservation est validée, le site récupère automatiquement ce numéro
> et l'affiche au client dans la page de confirmation, ainsi que le numéro de la réception : le 1099."

## Tester Asterisk

```bash
# Logs Asterisk en direct
docker compose logs -f asterisk

# Entrer dans le container Asterisk
docker compose exec asterisk asterisk -rvvv

# Commandes Asterisk CLI utiles
asterisk -rx "sip show peers"          # Liste les téléphones SIP connectés
asterisk -rx "core show channels"      # Appels en cours
asterisk -rx "dialplan show hotel"     # Contexte téléphonique
```
