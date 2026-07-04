#!/bin/sh
# =============================================================================
# voicemail_notify.sh — Script de notification voicemail Asterisk → API PHP
#
# Appelé automatiquement par Asterisk via "externnotify" dans voicemail.conf
# dès qu'un nouveau message vocal est laissé dans une boîte.
#
# Arguments reçus depuis Asterisk :
#   $1 = context   (ex: "hotel")
#   $2 = mailbox   (ex: "2001" = chambre 201, "1099" = reception)
#   $3 = new_count (nombre de nouveaux messages)
#
# Ce script envoie ces infos à l'API PHP via HTTP POST.
# L'API se charge ensuite de :
#   - Identifier la chambre depuis l'extension (table physical_rooms)
#   - Trouver la réservation active et l'email du client
#   - Joindre le fichier .wav et envoyer l'email
#
# POURQUOI PYTHON3 ET PAS CURL ?
# curl utilise libcurl/OpenSSL qui échoue à s'initialiser dans les
# sous-processus créés par ast_safe_system() d'Asterisk (exit code 2).
# Python3 urllib.request utilise les sockets TCP directement → pas de problème.
#
# POURQUOI /bin/sh DANS externnotify ?
# Les scripts avec shebang (#!/bin/sh) ne s'exécutent pas directement depuis
# les volumes Windows montés dans Docker. Le préfixe "/bin/sh" force l'exécution.
#
# LOGS : /tmp/ est sur le filesystem natif du container (pas sur le volume Windows)
# ce qui évite les problèmes d'encodage CRLF et de permissions.
# =============================================================================

CONTEXT="$1"
MAILBOX="$2"
NEW_COUNT="$3"
CALL_TIME="$(/usr/bin/date '+%Y-%m-%d %H:%M:%S')"
DEBUG_FILE="/tmp/vm_debug.log"
LOG_FILE="/tmp/vm_notify.log"

echo "${CALL_TIME} DEBUG args: context=${CONTEXT} mailbox=${MAILBOX} new=${NEW_COUNT}" >> "${DEBUG_FILE}"

# Asterisk appelle ce script aussi quand new_count revient à 0 (messages lus)
# Dans ce cas, il n'y a rien à faire — on ignore et on sort
if [ "${NEW_COUNT}" = "0" ] || [ -z "${NEW_COUNT}" ]; then
    echo "${CALL_TIME} DEBUG: skipping new_count=0" >> "${DEBUG_FILE}"
    exit 0
fi

echo "${CALL_TIME} | mailbox=${MAILBOX} context=${CONTEXT} new=${NEW_COUNT}" >> "${LOG_FILE}"

# Appel HTTP POST vers l'API PHP via Python3
# L'URL "http://nginx" fonctionne car le container Asterisk est en mode "host"
# et nginx est accessible sur le réseau Docker hotel-net via son hostname
RESPONSE=$(/usr/bin/python3 -c "
import urllib.request, json, sys
data = json.dumps({'mailbox':'${MAILBOX}','context':'${CONTEXT}','new_count':${NEW_COUNT},'call_time':'${CALL_TIME}'}).encode()
req = urllib.request.Request('http://192.168.30.2/api/voicemail-notify', data=data, headers={'Content-Type':'application/json'}, method='POST')
try:
    res = urllib.request.urlopen(req, timeout=10)
    print(res.read().decode())
except Exception as e:
    print('ERROR:' + str(e))
" 2>&1)

echo "${CALL_TIME} DEBUG: python exit=$? response=${RESPONSE}" >> "${DEBUG_FILE}"
echo "${RESPONSE}" >> "${LOG_FILE}"
echo "" >> "${LOG_FILE}"
exit 0
