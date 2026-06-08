import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { IMAGES } from "@/data/images";

export function CallToAction() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={IMAGES.cta.main}
          alt="Maison Saclay — Terrasse"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-charcoal/75" />
      </div>

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 28 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-2xl mx-auto text-center px-6"
      >
        <p className="text-2xs tracking-luxury uppercase text-gold mb-6">Réservation</p>
        <h2 className="text-display-lg font-serif font-light text-ivory mb-6 leading-tight">
          Votre prochain séjour
          <br />
          <em className="italic">commence ici</em>
        </h2>
        <p className="text-base font-light text-ivory/60 mb-10 leading-relaxed">
          Nos équipes sont disponibles 7j/7 pour vous accompagner dans la préparation d'un séjour d'exception.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/chambres"
            className="px-8 py-4 bg-gold text-charcoal text-sm font-light tracking-wide hover:bg-gold-400 transition-colors duration-300 inline-flex items-center justify-center"
          >
            Voir les disponibilités
          </Link>
          <a
            href="tel:+33169000000"
            className="px-8 py-4 border border-ivory/40 text-ivory text-sm font-light tracking-wide hover:border-ivory hover:bg-white/10 transition-all duration-300 inline-flex items-center justify-center"
          >
            Nous appeler
          </a>
        </div>
      </motion.div>
    </section>
  );
}
