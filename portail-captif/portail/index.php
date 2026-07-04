<?php
// ============================================================
// Portail Captif WiFi — Maison Saclay
// Flux correct EAP330 :
//   1. EAP → redirect → notre page (GET avec clientMAC)
//   2. Hôte entre sa chambre → soumet à notre PHP
//   3. PHP valide → page auto-submit vers EAP /portal/entry
//      avec username=chambre, password=chambre, clientMac=MAC
//   4. EAP fait RADIUS lui-même → accorde Internet
// ============================================================

ob_start();

// ── Logging ──────────────────────────────────────────────────
$logDir  = '/tmp/portal_logs';
$logFile = $logDir . '/captive_debug.log';
@mkdir($logDir, 0777, true);

function plog(string $msg): void {
    global $logFile;
    @file_put_contents($logFile, '[' . date('Y-m-d H:i:s') . '] ' . $msg . "\n", FILE_APPEND | LOCK_EX);
}

// ── Constantes ───────────────────────────────────────────────
define('EAP_IP',      '192.168.30.253');
define('EAP_ENTRY',   'http://' . EAP_IP . '/portal/entry');
define('VALID_ROOMS', ['101','102','103','201','202','203','601','602','603']);

// ── Extraction MAC ───────────────────────────────────────────
function getClientMAC(): string {
    $all  = array_merge($_GET, $_POST);
    $keys = ['clientMAC','clientMac','client_mac','staMac','sta_mac','wlanUserMac','mac','apMac'];
    $re   = '/^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$/';
    foreach ($keys as $k) {
        $v = trim($all[$k] ?? '');
        if ($v !== '' && preg_match($re, $v))
            return strtoupper(str_replace('-', ':', $v));
    }
    foreach ($keys as $k) {
        $v = trim($all[$k] ?? '');
        if ($v !== '') return $v;
    }
    return '';
}

// ── Lecture paramètres ───────────────────────────────────────
$method    = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$clientMAC = getClientMAC();
$apMAC     = trim($_GET['apMAC'] ?? $_GET['ap'] ?? $_POST['ap'] ?? '');
$target    = trim($_GET['target'] ?? $_GET['redirect'] ?? $_POST['target'] ?? '');
$ssid      = trim($_GET['ssid']    ?? $_POST['ssid']    ?? '');
$radioId   = trim($_GET['radioId'] ?? $_POST['radioId'] ?? '');

plog("{$method} " . ($_SERVER['REQUEST_URI'] ?? ''));
plog("IP:" . ($_SERVER['REMOTE_ADDR'] ?? '') . " MAC:[{$clientMAC}] ap:[{$apMAC}]");
if ($_GET)  plog("GET:"  . json_encode($_GET,  JSON_UNESCAPED_SLASHES));
if ($_POST) plog("POST:" . json_encode($_POST, JSON_UNESCAPED_SLASHES));

// ── Debug ────────────────────────────────────────────────────
if (isset($_GET['debug'])) {
    ob_end_clean();
    header('Content-Type: text/plain; charset=utf-8');
    echo "═══ PORTAIL DEBUG " . date('Y-m-d H:i:s') . " ═══\n";
    echo "IP  : " . ($_SERVER['REMOTE_ADDR'] ?? '') . "\n";
    echo "MAC : {$clientMAC}\n";
    echo "AP  : {$apMAC}\n";
    echo "\nGET:\n";
    foreach ($_GET as $k => $v) echo "  {$k} = {$v}\n";
    echo "\nLOG:\n" . (@file_get_contents($logFile) ?: '(vide)');
    exit;
}

// ── Traitement soumission ────────────────────────────────────
$error = '';
$room  = trim($_GET['room'] ?? $_POST['room'] ?? '');
$showRelay = false; // si true : afficher la page auto-submit vers EAP

if ($room !== '') {
    plog("SUBMIT room:[{$room}] mac:[{$clientMAC}]");

    if (empty($clientMAC)) {
        $error = "Appareil non identifié. Connectez-vous au réseau <strong>OP1_Wifi</strong> puis réessayez.";
        plog("ERR: MAC absent");
    } elseif (!in_array($room, VALID_ROOMS, true)) {
        $error = "Numéro de chambre invalide. Vérifiez votre numéro ou contactez la réception.";
        plog("ERR: chambre invalide [{$room}]");
    } else {
        // ✅ Chambre valide → on va auto-submit vers l'EAP
        plog("VALID → relay vers EAP room:[{$room}] mac:[{$clientMAC}]");
        $showRelay = true;
    }
}

ob_end_flush();

// ══════════════════════════════════════════════════════════════
// PAGE RELAY — auto-submit vers EAP (si chambre valide)
// ══════════════════════════════════════════════════════════════
if ($showRelay):
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>Connexion en cours… · Maison Saclay</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{min-height:100vh;background:#1A1714;color:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;}
.wrap{text-align:center;padding:40px 24px;}
.spinner{width:36px;height:36px;border:2px solid rgba(196,168,130,0.2);border-top-color:#C4A882;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 24px;}
@keyframes spin{to{transform:rotate(360deg)}}
p{font-family:Georgia,serif;font-style:italic;font-size:1.1rem;color:rgba(245,240,232,0.6);letter-spacing:0.02em;}
small{display:block;margin-top:10px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#C4A882;opacity:0.7;}
</style>
</head>
<body>
<div class="wrap">
  <div class="spinner"></div>
  <p>Connexion en cours…</p>
  <small>Maison Saclay · WiFi</small>
</div>

<!-- Formulaire silencieux vers l'EAP — soumis automatiquement depuis le navigateur du téléphone -->
<form id="eap" method="POST" action="<?= htmlspecialchars(EAP_ENTRY) ?>" style="display:none">
  <input name="username"  value="<?= htmlspecialchars($room) ?>">
  <input name="password"  value="<?= htmlspecialchars($room) ?>">
  <input name="clientMac" value="<?= htmlspecialchars($clientMAC) ?>">
  <?php if ($apMAC):   ?><input name="ap"      value="<?= htmlspecialchars($apMAC) ?>"><?php endif; ?>
  <?php if ($target):  ?><input name="target"  value="<?= htmlspecialchars($target) ?>"><?php endif; ?>
  <?php if ($ssid):    ?><input name="ssid"    value="<?= htmlspecialchars($ssid) ?>"><?php endif; ?>
  <?php if ($radioId): ?><input name="radioId" value="<?= htmlspecialchars($radioId) ?>"><?php endif; ?>
</form>

<script>
// Auto-submit immédiat
document.getElementById('eap').submit();

// Fallback si JS bloqué (rare) : lien manuel
setTimeout(function(){
  document.querySelector('p').innerHTML =
    'Si la page ne se charge pas : <a href="#" onclick="document.getElementById(\'eap\').submit();return false" style="color:#C4A882">cliquez ici</a>';
}, 3000);
</script>
</body>
</html>
<?php
exit;
endif;
// ══════════════════════════════════════════════════════════════
// PAGE PRINCIPALE — formulaire chambre
// ══════════════════════════════════════════════════════════════
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="robots" content="noindex">
<title>WiFi · Maison Saclay</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --ch:   #1A1714;
  --ch2:  #232018;
  --iv:   #F5F0E8;
  --iv55: rgba(245,240,232,0.55);
  --iv18: rgba(245,240,232,0.18);
  --go:   #C4A882;
  --gol:  #D4BC99;
  --god:  rgba(196,168,130,0.15);
  --brd:  rgba(245,240,232,0.08);
  --brg:  rgba(196,168,130,0.35);
}

html,body{
  min-height:100%;
  background:var(--ch);
  color:var(--iv);
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  font-weight:300;
  -webkit-font-smoothing:antialiased;
}

body{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  min-height:100vh;
  padding:24px 20px;
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%,rgba(196,168,130,0.06) 0%,transparent 70%),
    var(--ch);
}

/* ── CARD ── */
.card{
  width:100%;max-width:400px;
  background:var(--ch2);
  border:1px solid var(--brd);
  padding:48px 40px 44px;
  position:relative;
}
.card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,var(--go),transparent);
}

/* ── LOGO ── */
.logo{text-align:center;margin-bottom:44px;}
.logo-mark{
  display:inline-flex;align-items:center;justify-content:center;
  width:48px;height:48px;margin-bottom:16px;
}
.logo-mark svg{width:48px;height:48px;}
.logo-name{
  display:block;
  font-family:Georgia,'Times New Roman',serif;
  font-size:1.3rem;font-weight:400;font-style:italic;
  color:var(--iv);letter-spacing:0.04em;
}
.logo-sub{
  display:block;
  font-size:9px;font-weight:400;letter-spacing:0.28em;
  text-transform:uppercase;color:var(--go);margin-top:5px;opacity:0.8;
}

/* ── DIVIDER ── */
.sep{display:flex;align-items:center;gap:12px;margin-bottom:28px;}
.sep::before,.sep::after{content:'';flex:1;height:1px;background:var(--brd);}
.sep span{font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:var(--iv18);}

/* ── ERREUR ── */
.err{
  background:rgba(180,50,50,0.12);
  border:1px solid rgba(180,50,50,0.3);
  padding:12px 16px;font-size:13px;
  color:#F4A0A0;line-height:1.5;margin-bottom:24px;
}

/* ── FORM ── */
.flabel{
  display:block;font-size:9px;font-weight:400;
  letter-spacing:0.2em;text-transform:uppercase;
  color:var(--iv55);margin-bottom:10px;
}
input[type=text]{
  width:100%;background:rgba(255,255,255,0.03);
  border:1px solid var(--brd);color:var(--iv);
  font-family:Georgia,serif;font-size:2rem;font-weight:400;
  letter-spacing:0.15em;text-align:center;
  padding:18px 16px;outline:none;
  -webkit-appearance:none;appearance:none;border-radius:0;
  transition:border-color .2s,background .2s;
}
input[type=text]:focus{border-color:var(--go);background:var(--god);}
input::placeholder{color:rgba(245,240,232,0.15);font-style:italic;font-size:1.1rem;letter-spacing:0.05em;}

.btn{
  display:block;width:100%;padding:17px 24px;
  background:var(--go);color:var(--ch);
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  font-size:10px;font-weight:500;letter-spacing:0.22em;
  text-transform:uppercase;border:none;cursor:pointer;
  margin-top:16px;border-radius:0;-webkit-appearance:none;
  transition:background .2s,opacity .15s;
}
.btn:hover{background:var(--gol);}
.btn:active{opacity:.85;}

/* ── MAC ── */
.mac-line{
  margin-top:28px;padding-top:22px;
  border-top:1px solid var(--brd);
  display:flex;align-items:center;gap:8px;
}
.dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.dot.ok{background:#4CAF50;}
.dot.ko{background:#F44336;}
.mac-txt{font-size:11px;color:var(--iv55);line-height:1.4;}

/* ── FOOTER ── */
.foot{margin-top:28px;text-align:center;}
.foot a{font-size:10px;color:rgba(245,240,232,0.12);text-decoration:none;letter-spacing:0.1em;}
.foot a:hover{color:var(--iv18);}

@media(max-width:480px){
  .card{padding:36px 24px 32px;}
  input[type=text]{font-size:1.6rem;padding:16px;}
}
</style>
</head>
<body>

<div class="card">

  <div class="logo">
    <div class="logo-mark">
      <!-- Losange Maison Saclay -->
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 4L44 24L24 44L4 24L24 4Z" stroke="#C4A882" stroke-width="1.2" fill="none" opacity="0.7"/>
        <path d="M24 10L38 24L24 38L10 24L24 10Z" stroke="#C4A882" stroke-width="0.6" fill="none" opacity="0.4"/>
        <circle cx="24" cy="24" r="3" fill="#C4A882" opacity="0.9"/>
      </svg>
    </div>
    <span class="logo-name">Maison Saclay</span>
    <span class="logo-sub">Accès WiFi</span>
  </div>

  <div class="sep"><span>Connexion</span></div>

  <?php if ($error): ?>
    <div class="err"><?= $error ?></div>
  <?php endif; ?>

  <form method="POST" action="/wifi">
    <input type="hidden" name="mac"       value="<?= htmlspecialchars($clientMAC) ?>">
    <input type="hidden" name="clientMAC" value="<?= htmlspecialchars($clientMAC) ?>">
    <input type="hidden" name="ap"        value="<?= htmlspecialchars($apMAC) ?>">
    <input type="hidden" name="target"    value="<?= htmlspecialchars($target) ?>">
    <input type="hidden" name="ssid"      value="<?= htmlspecialchars($ssid) ?>">
    <input type="hidden" name="radioId"   value="<?= htmlspecialchars($radioId) ?>">

    <label class="flabel" for="room">Numéro de chambre</label>

    <input
      type="text"
      id="room"
      name="room"
      placeholder="201"
      value="<?= htmlspecialchars($room ?: '') ?>"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      inputmode="numeric"
      maxlength="3"
      required
      autofocus
    >

    <button type="submit" class="btn">Accéder à Internet</button>
  </form>

  <div class="mac-line">
    <?php if ($clientMAC): ?>
      <div class="dot ok"></div>
      <span class="mac-txt">Appareil identifié · <?= htmlspecialchars($clientMAC) ?></span>
    <?php else: ?>
      <div class="dot ko"></div>
      <span class="mac-txt">Non identifié — connectez-vous à <strong style="color:var(--iv)">OP1_Wifi</strong></span>
    <?php endif; ?>
  </div>

</div>

<div class="foot"><a href="/wifi?debug=1">debug</a></div>

</body>
</html>
