import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { updateMyEmail } from "@/services/api";

/**
 * EmailModal — S'affiche automatiquement après connexion si le compte n'a pas d'e-mail.
 *
 * Logique :
 *   - Visible si user connecté ET user.email vide/null
 *   - Disparaît une fois l'e-mail enregistré (updateUser met à jour le state global)
 *   - Le bouton "Plus tard" ferme la modal pour la session (sans bloquer le site)
 *
 * À l'oral : "Cette modal apparaît une fois pour les comptes sans e-mail.
 *             Elle est non-bloquante : on peut la fermer, mais elle revient à la prochaine connexion."
 */
export function EmailModal() {
  const { user, updateUser } = useAuth();

  const [dismissed, setDismissed] = useState(false);
  const [email,     setEmail]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  // Afficher uniquement si connecté ET email absent
  const shouldShow = !!user && !user.email && !dismissed;

  const handleSave = async () => {
    const trimmed = email.trim();
    if (!trimmed) { setError("Veuillez saisir une adresse e-mail."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Format d'adresse invalide.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await updateMyEmail(trimmed);
      updateUser({ email: trimmed }); // met à jour le state global + localStorage
      // La modal disparaît automatiquement car user.email est maintenant rempli
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <>
          {/* Overlay semi-transparent */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setDismissed(true)}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="bg-white w-full max-w-md p-8 shadow-2xl pointer-events-auto">

              {/* Fermer */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-charcoal flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-2xs tracking-luxury uppercase text-charcoal/50 mb-0.5">
                      Notifications
                    </p>
                    <h2 className="font-serif text-lg font-light text-charcoal leading-tight">
                      Ajoutez votre e-mail
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setDismissed(true)}
                  className="text-charcoal/25 hover:text-charcoal transition-colors mt-0.5"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Explication */}
              <p className="text-sm font-light text-charcoal/60 leading-relaxed mb-6">
                Votre e-mail est nécessaire pour recevoir les confirmations
                de réservation, commandes room service et messages vocaux.
              </p>

              {/* Champ e-mail */}
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
                  placeholder="votre@email.com"
                  autoFocus
                  className="w-full border border-border px-4 py-3 text-sm font-light text-charcoal placeholder:text-charcoal/25 focus:outline-none focus:border-charcoal transition-colors"
                />

                {error && (
                  <p className="text-xs text-red-500 font-light">{error}</p>
                )}

                <button
                  onClick={() => void handleSave()}
                  disabled={loading}
                  className="w-full py-3 bg-charcoal text-ivory text-2xs tracking-luxury uppercase hover:bg-charcoal/85 transition-colors disabled:opacity-50"
                >
                  {loading ? "Enregistrement…" : "Enregistrer"}
                </button>

                <button
                  onClick={() => setDismissed(true)}
                  className="w-full py-2 text-2xs tracking-wide text-charcoal/35 hover:text-charcoal/60 transition-colors"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
