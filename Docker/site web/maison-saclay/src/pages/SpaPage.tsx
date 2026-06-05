import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { SEO }      from "@/components/seo/SEO";
import { PageHero } from "@/components/sections/PageHero";
import { IMAGES }   from "@/data/images";

const treatments = [
  {
    category: "Soins du corps",
    items: [
      { name: "Rituel Saclay",                  duration: "90 min",   price: "180€", description: "Gommage aux sels de l'Atlantique, enveloppement à l'argile verte, massage californien." },
      { name: "Enveloppement miel & gingembre", duration: "60 min",   price: "130€", description: "Soin réchauffant et détoxifiant pour une peau soyeuse et lumineuse." },
      { name: "Massage pierres chaudes",        duration: "75 min",   price: "160€", description: "Basalte volcanique chauffé à 55°C pour une relaxation musculaire profonde." },
    ],
  },
  {
    category: "Soins du visage",
    items: [
      { name: "Soin signature Maison",   duration: "60 min", price: "140€", description: "Diagnostic personnalisé, nettoyage profond, modelage lifting et sérum sur mesure." },
      { name: "Hydra-lumière",           duration: "45 min", price: "110€", description: "Masque à l'acide hyaluronique et vitamines C. Éclat immédiat garanti." },
      { name: "Soin anti-âge caviar",    duration: "75 min", price: "190€", description: "Extrait de caviar, or 24 carats et collagène marin. Résultats visibles dès la première séance." },
    ],
  },
  {
    category: "Bien-être",
    items: [
      { name: "Massage duo",        duration: "90 min",   price: "300€", description: "Massage en cabine privative pour deux personnes, avec champagne et fruits frais." },
      { name: "Circuit aquatique",  duration: "Illimité", price: "80€",  description: "Accès piscine intérieure chauffée, hammam, sauna finlandais et bain nordique froid." },
      { name: "Yoga privé",         duration: "60 min",   price: "120€", description: "Séance personnalisée avec notre professeur certifié, en studio ou sur la terrasse." },
    ],
  },
];

const stats = [
  { value: "1 200 m²", label: "Espace dédié" },
  { value: "12",        label: "Cabines de soins" },
  { value: "3",         label: "Bassins aquatiques" },
  { value: "8",         label: "Thérapeutes certifiés" },
];

// ── Composant extrait pour éviter le hook dans .map() ─────────
function TreatmentCategory({ cat, delay = 0 }: { cat: typeof treatments[0]; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref}>
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay }}
        className="text-2xs tracking-luxury uppercase text-gold mb-8 pb-4 border-b border-border"
      >
        {cat.category}
      </motion.p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cat.items.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: delay + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-ivory p-7 border border-border hover:border-gold/40 transition-colors duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-serif text-lg font-light text-charcoal group-hover:text-gold transition-colors duration-300 leading-snug flex-1 pr-4">
                {item.name}
              </h3>
              <span className="font-serif text-lg font-light text-gold flex-shrink-0">{item.price}</span>
            </div>
            <p className="text-sm font-light text-charcoal/50 leading-relaxed mb-4">{item.description}</p>
            <p className="text-2xs tracking-luxury uppercase text-charcoal/40">{item.duration}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function SpaPage() {
  const introRef  = useRef<HTMLDivElement>(null);
  const introInView = useInView(introRef, { once: true, margin: "-80px" });

  return (
    <>
      <SEO
        title="Spa & Bien-être"
        description="1 200 m² de sérénité au cœur de Maison Saclay. Soins signature, circuit aquatique, massages et rituels de bien-être sur mesure."
        image={IMAGES.spa.main}
      />

      <PageHero
        label="Spa & Bien-être"
        title="L'art de"
        titleItalic="prendre soin"
        subtitle="Un sanctuaire de 1 200 m² conçu pour restaurer corps et esprit dans une quiétude absolue."
        image={IMAGES.spa.main}
        size="lg"
      />

      {/* Intro + stats */}
      <section ref={introRef} className="py-section bg-ivory overflow-hidden">
        <div className="max-w-8xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={introInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-2xs tracking-luxury uppercase text-gold mb-6">Notre philosophie</p>
              <h2 className="text-display-md font-serif font-light text-charcoal leading-tight mb-8">
                Un refuge pour
                <br /><em className="italic">chaque sens</em>
              </h2>
              <div className="space-y-4 text-charcoal/60 font-light leading-relaxed text-base">
                <p>Le Spa de Maison Saclay s'inspire des traditions de bien-être du monde entier, revisitées avec l'élégance française. Chaque soin est une expérience totale — un rituel pensé pour vous.</p>
                <p>Des soins du corps aux rituels du visage, du yoga privé au circuit aquatique, notre équipe compose votre programme sur mesure.</p>
              </div>
              <Link to="/contact" className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-gold text-charcoal text-sm font-light tracking-wide hover:bg-gold-400 transition-all duration-300 group">
                Réserver un soin
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={introInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img src={IMAGES.spa.pool} alt="Piscine intérieure — Spa Maison Saclay" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
              </div>
              <div className="grid grid-cols-4 gap-0 border border-border">
                {stats.map((s, i) => (
                  <div key={s.label} className={`p-5 text-center ${i < 3 ? "border-r border-border" : ""}`}>
                    <p className="font-serif text-xl font-light text-charcoal">{s.value}</p>
                    <p className="text-2xs text-charcoal/40 tracking-wide mt-1 font-light">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Menu soins — utilise le composant extrait */}
      <section className="py-section bg-surface">
        <div className="max-w-8xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="text-2xs tracking-luxury uppercase text-gold mb-4">Menu des soins</p>
            <h2 className="text-display-md font-serif font-light text-charcoal">Nos prestations</h2>
          </div>
          <div className="space-y-16">
            {treatments.map((cat, i) => (
              <TreatmentCategory key={cat.category} cat={cat} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMAGES.spa.main} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-charcoal/75" />
        </div>
        <div className="relative z-10 max-w-xl mx-auto text-center px-6">
          <p className="text-2xs tracking-luxury uppercase text-gold mb-6">Réservation</p>
          <h2 className="text-display-lg font-serif font-light text-ivory mb-6">Offrez-vous<br /><em className="italic">un moment</em></h2>
          <p className="text-base font-light text-ivory/60 mb-10">Nos thérapeutes composent votre programme sur mesure. Réservation conseillée 48h à l'avance.</p>
          <Link to="/contact" className="inline-flex items-center justify-center px-8 py-4 bg-gold text-charcoal text-sm font-light tracking-wide hover:bg-gold-400 transition-colors duration-300">
            Prendre rendez-vous
          </Link>
        </div>
      </section>
    </>
  );
}
