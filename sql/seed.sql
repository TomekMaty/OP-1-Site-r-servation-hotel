USE maison_saclay;

-- ── Menu room service ──────────────────────────────────────
INSERT IGNORE INTO menu_items (name, description, price, category, image_url, sort_order) VALUES
-- Brunch
('Brunch Signature',   'Viennoiseries du four, œufs Benedict, saumon fumé de Norvège, fruits frais de saison, jus pressé', 38.00, 'brunch', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80', 1),
('Continental',        'Jus fraîchement pressé, pain grillé, confiture maison, beurre de Normandie', 22.00, 'brunch', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80', 2),
('Healthy Bowl',       'Granola artisanal, yaourt grec, fruits de saison, miel d\'acacia', 28.00, 'brunch', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80', 3),
-- Plats
('Club Sandwich',      'Poulet rôti, bacon croustillant, avocat, tomate, salade, frites maison', 24.00, 'plat', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80', 4),
('Tartare de bœuf',   'Bœuf façonné minute, câpres, cornichons, échalote, toast grillé', 32.00, 'plat', 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80', 5),
('Salade Niçoise',    'Thon de ligne, olives niçoises, haricots verts, œuf parfait, anchois', 26.00, 'plat', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', 6),
('Soupe du jour',      'Préparée selon l\'arrivage du marché, croutons dorés, crème fraîche', 14.00, 'plat', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80', 7),
-- Boissons
('Café Arabica',       'Sélection single origin, mouture fraîche à la commande', 6.00, 'boisson', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', 8),
('Thé Dammann Frères', 'Sélection grand cru, infusion à la température idéale', 8.00, 'boisson', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80', 9),
('Jus frais pressé',   'Pressé à la commande — orange, pomme ou carotte-gingembre', 10.00, 'boisson', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&q=80', 10),
('Smoothie maison',    'Fruits frais du marché, lait d\'amande, miel', 12.00, 'boisson', 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=800&q=80', 11),
-- Desserts
('Plateau de fromages','Sélection affinée par notre maître fromager, confiture de figues, pain de noix', 22.00, 'dessert', 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=800&q=80', 12),
('Paris-Brest',        'Praliné noisette du Piémont, chantilly légère, pâte à choux dorée', 16.00, 'dessert', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80', 13),
('Coupe de glaces',    'Trois boules au choix, sorbets faits maison selon la saison', 14.00, 'dessert', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80', 14);


-- Vider et réinsérer proprement
TRUNCATE TABLE bookings;
TRUNCATE TABLE contacts;
DELETE FROM rooms;
ALTER TABLE rooms AUTO_INCREMENT = 1;

INSERT INTO rooms (slug, name, category, tagline, description, price, surface, max_guests, floor, images, amenities, highlights, available) VALUES

('chambre-deluxe-jardin',
 'Chambre Déluxe Jardin', 'chambre',
 'Sérénité et lumière naturelle',
 'Baignée de lumière naturelle, cette chambre ouvre sur les jardins privés de Maison Saclay. Mobilier en bois de noyer, linge de maison Rivolta Carmignani, vue apaisante sur la nature.',
 380.00, 38, 2, '2ème étage',
 '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=85","https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1600&q=85","https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1600&q=85"]',
 '["Lit King Size","Salle de bain en marbre","Douche à l\'italienne","Baignoire îlot","Minibar premium","Coffre-fort","Wi-Fi haut débit","Climatisation silencieuse","Service en chambre 24h","Vue sur jardin"]',
 '["Vue jardins privés","38 m² lumineux","Linge Rivolta Carmignani"]', 1),

('suite-panoramique',
 'Suite Panoramique', 'suite',
 "L'horizon comme tableau de chevet",
 "La Suite Panoramique offre une vue à 180° sur le plateau de Saclay et ses forêts. Salon séparé, bibliothèque privée et terrasse privative font de cet espace un refuge d'exception.",
 680.00, 72, 2, '4ème étage',
 '["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=85","https://images.unsplash.com/photo-1592229506151-845940174bb0?w=1600&q=85","https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1600&q=85"]',
 '["Lit King Size","Salon séparé","Terrasse privative","Salle de bain double vasque","Baignoire balnéo","Bar privé","Télévision 75 pouces","Système audio Bang & Olufsen","Conciergerie dédiée","Petit-déjeuner inclus"]',
 '["Terrasse privative","72 m² · Salon séparé","Vue panoramique 180°"]', 1),

('penthouse-saclay',
 'Penthouse Saclay', 'penthouse',
 'Le sommet du luxe, au-dessus du plateau',
 "Unique en son genre, le Penthouse Saclay occupe l'intégralité du dernier étage. Piscine privée, toit-terrasse panoramique, cuisine équipée et service butler personnalisé.",
 1800.00, 210, 4, '6ème étage — Niveau unique',
 '["https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1600&q=85","https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1600&q=85","https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1600&q=85"]',
 '["2 chambres King Size","Piscine privée chauffée","Toit-terrasse panoramique","Cuisine équipée complète","Salle à manger privée","Butler dédié 24h","Cave à vin privée","Salle de sport privée","Jacuzzi extérieur","Transfer aéroport inclus"]',
 '["210 m² · Niveau entier","Piscine privée","Butler dédié 24h/24"]', 1);
