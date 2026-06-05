import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { HeroBackground } from "./HeroBackground";
import { IMAGES } from "@/data/images";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen min-h-[680px] flex items-end overflow-hidden">

      <HeroBackground
        type="image"
        src={IMAGES.hero.main}
        alt="Maison Saclay — Façade de l'hôtel"
        overlayIntensity="medium"
      />

      {/* Contenu hero */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-8xl mx-auto px-6 lg:px-12 pb-20 lg:pb-28 w-full"
      >
        <div className="max-w-3xl">

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xs tracking-luxury uppercase text-gold mb-6"
          >
            Saclay, Île-de-France &mdash; Hôtel ★★★★★
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-display-xl font-serif font-light text-ivory leading-[1.05] mb-6"
          >
            Un refuge
            <br />
            <em className="italic">d'exception</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg font-sans font-light text-ivory/70 max-w-md mb-10 leading-relaxed"
          >
            À deux pas de Paris, Maison Saclay redéfinit l'art de l'hospitalité de luxe au cœur du plateau.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/chambres"
              className="inline-flex items-center justify-center px-8 py-4 bg-gold text-charcoal text-sm font-light tracking-wide hover:bg-gold-400 transition-all duration-300 group"
            >
              Découvrir nos chambres
              <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            <a
              href="#about"
              className="inline-flex items-center justify-center px-8 py-4 border border-ivory/40 text-ivory text-sm font-light tracking-wide hover:border-ivory hover:bg-white/10 transition-all duration-300"
            >
              Notre histoire
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-16 pt-8 border-t border-ivory/20 grid grid-cols-3 gap-8 max-w-sm"
          >
            {[
              { value: "48",    label: "Chambres & Suites" },
              { value: "2018",  label: "Fondé en" },
              { value: "★★★★★", label: "Classement" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-serif text-2xl font-light text-ivory">{stat.value}</p>
                <p className="text-2xs text-ivory/50 tracking-wide mt-1 font-light">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute bottom-8 right-10 z-10 flex flex-col items-center gap-1 hidden lg:flex"
      >
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
          <ChevronDown size={18} className="text-ivory/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
