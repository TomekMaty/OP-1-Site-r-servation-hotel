import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { SEO }      from "@/components/seo/SEO";
import { PageHero } from "@/components/sections/PageHero";
import { IMAGES }   from "@/data/images";

const menus = [
  {
    name: "Menu Déjeuner",
    price: "58€",
    note: "Du mardi au vendredi",
    courses: [
      { label: "Entrée", description: "Carpaccio de saint-jacques, huile de truffe, câpres et citron confit" },
      { label: "Plat", description: "Filet de sole meunière, légumes primeurs glacés au beurre noisette" },
      { label: "Dessert", description: "Mille-feuille à la vanille de Madagascar, caramel beurre salé" },
    ],
  },
  {
    name: "Menu Découverte",
    price: "110€",
    note: "Dîner · 5 services",
    courses: [
      { label: "Amuse-bouche", description: "Créations éphémères du chef selon le marché du jour" },
      { label: "Entrée froide", description: "Céviche de daurade, lait de coco, coriandre et mangue verte" },
      { label: "Entrée chaude", description: "Velouté de champignons sauvages, œuf poché et chips de parmesan" },
      { label: "Plat", description: "Côte de veau de lait rôtie, pomme dauphine, jus corsé aux herbes" },
      { label: "Dessert", description: "Soufflé au Grand Marnier, glace à la vanille Bourbon" },
    ],
  },
  {
    name: "Menu Prestige",
    price: "185€",
    note: "Dîner · 7 services · Accords mets-vins en option (+80€)",
    courses: [
      { label: "Amuse-bouche", description: "Trilogie de créations du chef" },
      { label: "Caviar", description: "Caviar Osciètre, blinis chauds et crème fraîche fermière" },
      { label: "Poisson", description: "Turbot sauvage en croûte de sel, beurre blanc aux algues" },
      { label: "Trou normand", description: "Granité au champagne et zestes de yuzu" },
      { label: "Viande", description: "Filet de bœuf Wagyu, truffe noire, purée Robuchon" },
      { label: "Fromages", description: "Sélection affinée par notre maître fromager, pain de campagne maison" },
      { label: "Dessert", description: "Composition chocolate noir Valrhona, or 24 carats" },
    ],
  },
];

const hours = [
  { service: "Petit-déjeuner",  time: "7h00 – 10h30" },
  { service: "Déjeuner",        time: "12h30 – 14h30" },
  { service: "Bar & Lounge",    time: "15h00 – 23h00" },
  { service: "Dîner",           time: "19h30 – 22h30" },
];

export function RestaurantPage() {
  const menuRef = useRef<HTMLDivElement>(null);
  const menuInView = useInView(menuRef, { once: true, margin: "-60px" });
  const infoRef = useRef<HTMLDivElement>(null);
  const infoInView = useInView(infoRef, { once: true, margin: "-60px" });

  return (
    <>
      <SEO
        title="Restaurant"
        description="Table gastronomique de Maison Saclay. Cuisine française d'auteur, produits d'exception, cave de 800 références. Menus de 58€ à 185€."
        image={IMAGES.restaurant.main}
      />

      <PageHero
        label="Restaurant"
        title="La table"
        titleItalic="gastronomique"
        subtitle="Une cuisine française d'auteur, portée par des produits d'exception et une cave de 800 références."
        image={IMAGES.restaurant.main}
        size="lg"
      />

      {/* Intro chef */}
      <section className="py-section bg-ivory overflow-hidden">
        <div className="max-w-8xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={IMAGES.restaurant.ambiance}
                  alt="Salle du restaurant Maison Saclay"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-2xs tracking-luxury uppercase text-gold mb-6">Notre chef</p>
              <h2 className="text-display-md font-serif font-light text-charcoal leading-tight mb-8">
                Alexandre Moreau
                <br />
                <em className="italic text-charcoal/40 text-2xl">Chef étoilé</em>
              </h2>
              <div className="space-y-4 text-charcoal/60 font-light leading-relaxed">
                <p>
                  Formé auprès des plus grandes maisons françaises — de Paris à Lyon — Alexandre Moreau a rejoint Maison Saclay en 2020 avec une vision : une gastronomie française contemporaine, ancrée dans le terroir de l'Île-de-France.
                </p>
                <p>
                  Sa cuisine s'articule autour d'une règle simple : le meilleur produit, cuisiné avec le plus grand soin, servi avec sobriété. Chaque assiette raconte une saison, un producteur, un territoire.
                </p>
              </div>

              {/* Distinctions */}
              <div className="mt-10 pt-8 border-t border-border">
                <p className="text-2xs tracking-luxury uppercase text-gold mb-5">Distinctions</p>
                <div className="space-y-2">
                  {["1 étoile Michelin 2023", "Gault & Millau — 17/20", "La Liste — Top 100 France"].map((d) => (
                    <div key={d} className="flex items-center gap-3">
                      <div className="w-1 h-1 bg-gold rounded-full" />
                      <span className="text-sm font-light text-charcoal/70">{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to="/contact"
                className="inline-flex items-center gap-2 mt-10 px-8 py-4 border border-charcoal text-charcoal text-sm font-light tracking-wide hover:bg-charcoal hover:text-ivory transition-all duration-300 group"
              >
                Réserver une table
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Menus */}
      <section className="py-section bg-charcoal">
        <div className="max-w-8xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="text-2xs tracking-luxury uppercase text-gold mb-4">Gastronomie</p>
            <h2 className="text-display-md font-serif font-light text-ivory">Nos menus</h2>
          </div>

          <div ref={menuRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {menus.map((menu, i) => (
              <motion.div
                key={menu.name}
                initial={{ opacity: 0, y: 32 }}
                animate={menuInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="border border-ivory/10 p-8 hover:border-gold/30 transition-colors duration-300"
              >
                {/* Header menu */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-serif text-xl font-light text-ivory">{menu.name}</h3>
                  <span className="font-serif text-xl font-light text-gold flex-shrink-0 ml-4">{menu.price}</span>
                </div>
                <p className="text-2xs tracking-wide text-ivory/30 font-light mb-8">{menu.note}</p>

                {/* Courses */}
                <div className="space-y-5">
                  {menu.courses.map((course) => (
                    <div key={course.label} className="border-t border-ivory/10 pt-5">
                      <p className="text-2xs tracking-luxury uppercase text-gold mb-2">{course.label}</p>
                      <p className="text-sm font-light text-ivory/60 leading-relaxed">{course.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs font-light text-ivory/30 mt-10">
            Menus adaptés aux allergies et régimes alimentaires sur demande. Carte également disponible.
          </p>
        </div>
      </section>

      {/* Horaires + CTA */}
      <section ref={infoRef} className="py-section bg-ivory">
        <div className="max-w-8xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Horaires */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              animate={infoInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-2xs tracking-luxury uppercase text-gold mb-8">Horaires d'ouverture</p>
              <div className="space-y-0 border border-border">
                {hours.map((h, i) => (
                  <div key={h.service} className={`flex items-center justify-between px-6 py-5 ${i < hours.length - 1 ? "border-b border-border" : ""}`}>
                    <span className="font-serif text-lg font-light text-charcoal">{h.service}</span>
                    <span className="text-sm font-light text-charcoal/50">{h.time}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs font-light text-charcoal/40 mt-4">
                Ouvert 7j/7 · La réservation est recommandée pour le dîner.
              </p>
            </motion.div>

            {/* CTA réservation */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={infoInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="border border-border p-10"
            >
              <p className="text-2xs tracking-luxury uppercase text-gold mb-6">Réservation de table</p>
              <h3 className="font-serif text-2xl font-light text-charcoal mb-4">
                Réservez votre
                <br />
                <em className="italic">expérience gastronomique</em>
              </h3>
              <p className="text-sm font-light text-charcoal/50 leading-relaxed mb-8">
                Pour les groupes de 8 personnes et plus, les événements privés ou les menus spéciaux, contactez directement notre équipe.
              </p>
              <div className="space-y-3">
                <Link
                  to="/contact"
                  className="flex items-center justify-center w-full py-4 bg-gold text-charcoal text-sm font-light tracking-wide hover:bg-gold-400 transition-colors duration-300"
                >
                  Réserver en ligne
                </Link>
                <a
                  href="tel:+33169000000"
                  className="flex items-center justify-center w-full py-4 border border-border text-charcoal/70 text-sm font-light tracking-wide hover:border-charcoal hover:text-charcoal transition-colors duration-300"
                >
                  +33 1 69 00 00 00
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
