import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-md"
      >
        <p className="font-serif text-8xl font-light text-charcoal/10 mb-6">404</p>
        <p className="text-2xs tracking-luxury uppercase text-gold mb-4">Page introuvable</p>
        <h1 className="text-display-md font-serif font-light text-charcoal mb-6 leading-tight">
          Cette page
          <br /><em className="italic">n'existe pas</em>
        </h1>
        <p className="text-base font-light text-charcoal/50 mb-10 leading-relaxed">
          La page que vous cherchez a peut-être été déplacée ou supprimée.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-charcoal text-sm font-light tracking-wide hover:bg-gold-400 transition-all duration-300 group"
        >
          Retour à l'accueil
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Link>
      </motion.div>
    </div>
  );
}
