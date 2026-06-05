import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { IMAGES } from "@/data/images";

export function About() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="about" ref={ref} className="py-section bg-ivory overflow-hidden">
      <div className="max-w-8xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -48 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={IMAGES.about.interior}
                alt="Maison Saclay — Intérieur"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            </div>
            {/* Badge */}
            <div className="absolute -bottom-6 -right-4 lg:-right-8 bg-charcoal p-6 hidden sm:block">
              <p className="font-serif text-3xl font-light text-ivory">48</p>
              <p className="text-2xs tracking-luxury uppercase text-gold mt-1">Chambres</p>
            </div>
          </motion.div>

          {/* Texte */}
          <motion.div
            initial={{ opacity: 0, x: 48 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-2xs tracking-luxury uppercase text-gold mb-6">Notre histoire</p>
            <h2 className="text-display-md font-serif font-light text-charcoal leading-tight mb-8">
              L'art de recevoir,
              <br />
              <em className="italic">réinventé</em>
            </h2>
            <div className="space-y-5 text-charcoal/60 font-light leading-relaxed text-base">
              <p>
                Fondée en 2018 par une famille de passionnés d'hospitalité, Maison Saclay est née d'une vision simple : offrir un havre de paix d'exception à celles et ceux qui façonnent le monde de demain.
              </p>
              <p>
                Nichée sur le plateau de Saclay, notre maison allie l'élégance intemporelle de la tradition hôtelière française à une modernité subtile et raffinée. Chaque détail a été pensé pour que votre séjour soit une expérience mémorable.
              </p>
            </div>

            {/* Awards */}
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-2xs tracking-luxury uppercase text-gold mb-6">Distinctions</p>
              <div className="flex flex-wrap gap-3">
                {["Condé Nast Traveler 2024", "Relais & Châteaux", "Forbes Travel Guide"].map((award) => (
                  <span
                    key={award}
                    className="px-4 py-2 border border-border text-xs font-light text-charcoal/70 tracking-wide"
                  >
                    {award}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
