-- ═══════════════════════════════════════════════════════════════
-- MAISON SACLAY — Requêtes SQL pour la soutenance
-- Ouvrir ce fichier dans VS Code, sélectionner une requête,
-- et appuyer sur Ctrl+Enter pour l'exécuter
-- ═══════════════════════════════════════════════════════════════

USE maison_saclay;

-- ────────────────────────────────────────────────────────────────
-- 1. Structure de la base : toutes les tables
-- ────────────────────────────────────────────────────────────────
SHOW TABLES;

-- ────────────────────────────────────────────────────────────────
-- 2. Les types de chambres (catalogue)
-- ────────────────────────────────────────────────────────────────
SELECT id, name, capacity, price_per_night, description
FROM rooms
ORDER BY price_per_night;

-- ────────────────────────────────────────────────────────────────
-- 3. Les chambres physiques avec leur extension téléphonique
-- ────────────────────────────────────────────────────────────────
SELECT
    pr.room_number        AS "Numéro chambre",
    r.name                AS "Type",
    pr.floor              AS "Étage",
    pr.sip_extension      AS "Poste tél."
FROM physical_rooms pr
JOIN rooms r ON r.id = pr.room_type_id
ORDER BY pr.room_number;

-- ────────────────────────────────────────────────────────────────
-- 4. Toutes les réservations avec client + chambre attribuée
--    → Montre le JOIN entre 3 tables
-- ────────────────────────────────────────────────────────────────
SELECT
    b.id                  AS "N° réservation",
    CONCAT(b.first_name, ' ', b.last_name) AS "Client",
    r.name                AS "Type de chambre",
    pr.room_number        AS "Chambre attribuée",
    b.check_in            AS "Arrivée",
    b.check_out           AS "Départ",
    b.guests              AS "Voyageurs",
    b.total_price         AS "Prix (€)",
    b.status              AS "Statut"
FROM bookings b
JOIN rooms r          ON r.id  = b.room_id
LEFT JOIN physical_rooms pr ON pr.id = b.physical_room_id
ORDER BY b.id DESC;

-- ────────────────────────────────────────────────────────────────
-- 5. Commandes room service avec le détail des articles
--    → Montre la relation orders ↔ order_items ↔ menu_items
-- ────────────────────────────────────────────────────────────────
SELECT
    o.id              AS "N° commande",
    o.room_number     AS "Chambre",
    o.status          AS "Statut",
    m.name            AS "Article commandé",
    oi.quantity       AS "Qté",
    oi.unit_price     AS "Prix unitaire (€)",
    o.total_price     AS "Total commande (€)"
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN menu_items  m  ON m.id        = oi.menu_item_id
ORDER BY o.id DESC, m.name;

-- ────────────────────────────────────────────────────────────────
-- 6. Sessions WiFi RADIUS (connexions réelles des appareils)
-- ────────────────────────────────────────────────────────────────
SELECT
    room_number       AS "Chambre",
    mac_address       AS "Adresse MAC",
    auth_status       AS "Statut RADIUS",
    total_sessions    AS "Sessions",
    total_accept      AS "Access-Accept",
    total_reject      AS "Access-Reject",
    last_seen         AS "Dernière connexion"
FROM wifi_radius_sessions
ORDER BY last_seen DESC;

-- ────────────────────────────────────────────────────────────────
-- 7. Requête SQL anti-double-réservation
--    → C'est exactement ce que fait le code PHP dans BookingController
--    → Explication pour le prof : trouver une chambre libre sur des dates données
-- ────────────────────────────────────────────────────────────────
-- Paramètres exemple : chambre type 1, du 2026-07-01 au 2026-07-05
SET @room_type_id = 1;
SET @check_in     = '2026-07-01';
SET @check_out    = '2026-07-05';

SELECT pr.room_number AS "Chambre disponible"
FROM physical_rooms pr
WHERE pr.room_type_id = @room_type_id
  AND pr.id NOT IN (
      -- Exclure les chambres déjà réservées sur ces dates
      -- Condition de chevauchement : une réservation chevauche si
      -- elle commence avant notre départ ET finit après notre arrivée
      SELECT b.physical_room_id
      FROM bookings b
      WHERE b.physical_room_id IS NOT NULL
        AND b.status NOT IN ('cancelled')
        AND b.check_in  < @check_out   -- commence avant notre départ
        AND b.check_out > @check_in    -- finit après notre arrivée
  )
LIMIT 1;

-- ────────────────────────────────────────────────────────────────
-- 8. Statistiques globales (ce que voit l'admin dans l'onglet Stats)
-- ────────────────────────────────────────────────────────────────
SELECT
    (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed')  AS "Réservations confirmées",
    (SELECT COUNT(*) FROM bookings WHERE status = 'pending')    AS "En attente",
    (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled')  AS "Annulées",
    (SELECT COUNT(*) FROM orders   WHERE status = 'preparing')  AS "Commandes en prép.",
    (SELECT COUNT(*) FROM orders   WHERE status = 'delivered')  AS "Livrées",
    (SELECT SUM(total_price) FROM bookings WHERE status = 'confirmed') AS "Revenus réservations (€)",
    (SELECT COUNT(*) FROM users)                                AS "Clients inscrits";
