# Portail captif WiFi — Maison Saclay

Documentation technique du portail captif invité (réseau **OP1_Wifi**).

> ⚠️ Cette doc remplace la version précédente (qui décrivait un portail externe PHP
> finalement abandonné — voir §2).

---

## 1. Principe

Le WiFi invité est contrôlé par un **portail captif intégré** à la borne **TP-Link EAP330**.
Le client saisit son **numéro de chambre**, la borne interroge **FreeRADIUS**, et si la chambre
est valide, l'accès Internet est autorisé.

```
Téléphone ──OP1_Wifi──▶ Borne EAP330 ──RADIUS──▶ Relay UDP ──▶ FreeRADIUS
   (chambre 201)          (192.168.30.253)      (port 18120)    (valide 201)
        ▲                                                            │
        └───────────────── Internet autorisé ◀───── Access-Accept ──┘
```

---

## 2. Pourquoi le portail **intégré** et pas une page custom externe

On a d'abord tenté le mode **External Web Portal** (page PHP custom `/wifi`).
**Résultat : Internet n'était jamais débloqué.**

- La borne redirigeait bien le client vers la page (avec le MAC).
- Mais le renvoi d'autorisation vers la borne (`/portal/entry`) répondait **« unknown error! »**.
- Le client restait bloqué en pré-authentification → « Pas de connexion à Internet ».

**Cause :** le mode *External Web Portal* de l'EAP330 **en standalone** (sans contrôleur Omada)
ne libère pas le client de façon fiable. C'est une limite du firmware.

**Décision :** on utilise le **portail intégré** (*Local Web Portal*) de la borne, qui fait
lui-même l'appel RADIUS. C'est la seule méthode stable sur ce matériel — et elle fonctionne.

---

## 3. Configuration de la borne EAP330

Interface : `http://192.168.30.253` — Wireless → **Portal**

| Champ | Valeur |
|---|---|
| Authentication Type | **External Radius Server** |
| RADIUS Server IP | `192.168.30.2` (PC hôte) |
| **Port** | **`18120`** ⚠️ (port direct FreeRADIUS) |
| RADIUS Password | `Azerty1234.` |
| Portal Customization | **Local Web Portal** |
| Titre | `Maison Saclay — Accès WiFi clients` |
| Term of Use | conditions d'utilisation |
| Authentication Timeout | 1 heure |

Le client tape son **numéro de chambre** dans **Username** ET **Password** (ex : `201` / `201`).

> **Design du portail :** le *Local Web Portal* de l'EAP330 est volontairement simple. La
> personnalisation possible se limite au **titre**, au **texte des conditions** et (selon
> firmware) à une image de fond / un logo. On ne peut pas y injecter du HTML/CSS complet —
> ce serait le mode External, justement abandonné car il ne donne pas Internet.

---

## 4. Le relay UDP (pourquoi le port 18120)

Docker Desktop sous Windows **ne transmet pas** l'UDP externe vers les conteneurs.
La borne ne pouvait donc pas joindre FreeRADIUS directement.

**Solution :** un relay UDP natif Windows (`portail-captif/udp_relay.ps1`) :

```
Borne EAP330 ──▶ 192.168.30.2:1812 (FreeRADIUS Linux natif (port 1812))
                        │
                        └──▶ 127.0.0.1:1812 (proxy Docker) ──▶ FreeRADIUS
```

- Écoute sur `0.0.0.0:18120`, relaie vers `127.0.0.1:1812`.
- **Doit tourner en permanence.** Lancement :
  ```powershell
  powershell -ExecutionPolicy Bypass -File portail-captif\udp_relay.ps1 `
    -ListenPort 18120 -TargetIP 127.0.0.1 -TargetPort 1812
  ```
- Règle pare-feu nécessaire : UDP 18120 entrant (`RADIUS-18120-UDP`, profil Any).

---

## 5. FreeRADIUS

- Conteneur : `maison_freeradius`
- Utilisateurs = chambres : `101 102 103 201 202 203 601 602 603`
  (username = password = numéro de chambre)
- Secret partagé : `Azerty1234.` (`freeradius/clients.conf`)
- Le log d'authentification (`/var/log/freeradius/radius.log`) contient :
  **chambre + adresse MAC (Calling-Station-Id) + statut + heure**.

> ⚠️ `clients.conf` / `users` sont intégrés à l'image (build, pas de volume).
> Après modification : `docker cp` dans le conteneur + `docker restart maison_freeradius`,
> ou rebuild de l'image `freeradius`.

---

## 6. Données disponibles (et limites)

| Donnée | Disponible | Source |
|---|---|---|
| Numéro de chambre | ✅ | User-Name RADIUS |
| Adresse MAC | ✅ | Calling-Station-Id (envoyé par la borne) |
| Statut (accepté/refusé) | ✅ | Access-Accept / Access-Reject |
| Heure de connexion | ✅ | timestamp du log |
| Adresse IP client | ❌ | non fournie par l'EAP en authentification |
| Durée de session | ❌ | l'EAP330 standalone ne fait pas d'accounting RADIUS |
| Contenu Internet (HTTPS) | ❌ | chiffré — non visible (supervision non intrusive) |

---

## 6 bis. ⚠️ IP du serveur RADIUS (point de vigilance soutenance)

L'EAP pointe vers **`192.168.30.2:1812`**. Cette IP est celle du **PC hôte** sur le VLAN30.

- L'IP correcte aujourd'hui est bien **`192.168.30.2`** (vérifié).
- ⚠️ Cette IP est attribuée en **DHCP** → elle pourrait changer après un redémarrage.
  Si elle change, l'EAP pointerait vers la mauvaise IP → **plus de RADIUS → plus d'Internet**.
- **Recommandé avant la soutenance :** fixer l'IP du PC en `192.168.30.2` (IP statique ou
  réservation DHCP sur le routeur), OU vérifier juste avant la démo que le PC est bien en `.104`
  (`ipconfig`), et que l'EAP a bien cette IP dans Port/RADIUS Server IP.
- Note : l'IP `192.168.30.103` mentionnée dans d'anciens brouillons était une **erreur** ;
  la bonne IP, réelle et configurée, est **`.104`**.

---

## 7. Conclusion finale : portail global, pas par SSID

L'EAP330 **en mode standalone** ne propose **pas** de configuration de portail **par SSID** :
la page *Portal Configuration* s'applique **globalement** à toute la borne (pas de sélecteur SSID).

Conséquence : impossible d'isoler un SSID de test (`OP1_Test`) en *External Web Portal* pendant
que `OP1_Wifi` reste en *Local Web Portal* — passer en External toucherait **toute** la borne,
donc la production. **Le test isolé d'un portail externe a donc été écarté** pour ne pas risquer
de casser la configuration fonctionnelle.

> Pour garantir une démonstration stable, nous avons conservé le **portail intégré TP-Link** avec
> authentification **FreeRADIUS**. Le client saisit son numéro de chambre ; la borne interroge
> FreeRADIUS ; si la chambre est valide, l'accès Internet est autorisé. Le portail externe custom
> (`/wifi`) est conservé comme **prototype visuel**, mais la **solution finale retenue est le
> portail intégré**, car c'est la seule qui autorise réellement l'accès Internet sur ce matériel.

---

## 8. Redirect URL EAP330 — recommandation

Après login réussi, l'EAP330 peut rediriger vers une page. **Ne plus utiliser `/wifi`** (ancien portail custom).

**Recommandé pour la soutenance :**

| Option | URL | Avantage |
|---|---|---|
| ✅ **Recommandée** | `http://neverssl.com` | Toujours accessible en HTTP, zéro configuration |
| Alternative | `http://192.168.30.2/wifi-success` | Page locale — nécessite un fichier statique servi |
| Alternative | laisser vide | Pas de redirection — l'EAP affiche juste "connecté" |

**Comment changer :** Interface EAP330 (`http://192.168.30.253`) → Wireless → Portal → champ **Redirect URL**.

> ⚠️ Ne pas mettre une URL HTTPS en Redirect URL — certains firmwares EAP ont du mal avec la redirection HTTPS immédiate.

---

## 9. Phrase pour la soutenance

> « Le WiFi invité est contrôlé par un portail captif sur la borne TP-Link. Le client saisit
> son numéro de chambre, la borne interroge FreeRADIUS, et si la chambre est valide, l'accès
> Internet est autorisé. Les connexions sont ensuite remontées dans l'administration avec les
> informations réseau disponibles : la chambre, l'heure, l'adresse MAC et le statut. »

Voir aussi : [`WIFI_ADMIN.md`](WIFI_ADMIN.md) pour la partie tableau de bord.

