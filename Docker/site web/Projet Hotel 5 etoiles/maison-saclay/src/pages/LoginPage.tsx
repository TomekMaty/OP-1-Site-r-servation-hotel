import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SEO } from "@/components/seo/SEO";
import { useAuth } from "@/lib/auth-context";
import { apiLogin, apiRegister } from "@/services/api";
import { cn } from "@/lib/utils";

type Tab = "login" | "register";

export function LoginPage() {
  const [tab, setTab]       = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  // Login fields
  const [email, setEmail]   = useState("");
  const [pwd, setPwd]       = useState("");

  // Register fields
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [regEmail,  setRegEmail]  = useState("");
  const [regPwd,    setRegPwd]    = useState("");

  const { login } = useAuth();
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const redirect  = params.get("redirect") ?? "/mon-espace";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { token, user } = await apiLogin(email, pwd);
      login(token, user);
      navigate(redirect);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { token, user } = await apiRegister(firstName, lastName, regEmail, regPwd);
      login(token, user);
      navigate(redirect);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Espace client" description="Connectez-vous à votre espace client Maison Saclay." />

      <div className="min-h-screen flex overflow-hidden bg-charcoal">

        {/* ── Photo gauche ── */}
        <div className="hidden lg:block flex-1 relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1400&q=85"
            alt="Maison Saclay"
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-charcoal/40 to-transparent" />
          <motion.div
            className="absolute bottom-12 left-12 right-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-2xs tracking-luxury uppercase text-gold block mb-3">Maison Saclay</span>
            <h2 className="font-serif text-4xl font-light text-ivory leading-tight">
              L'art de recevoir<br />
              <em className="italic text-ivory/50">depuis 1924</em>
            </h2>
          </motion.div>
        </div>

        {/* ── Formulaire droite ── */}
        <motion.div
          className="w-full lg:w-[560px] flex-shrink-0 flex flex-col justify-center px-10 lg:px-16 py-16 lg:py-20 border-l border-white/10"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <div className="mb-12">
            <p className="font-serif text-2xl font-light text-ivory">Maison Saclay</p>
            <p className="text-2xs tracking-luxury uppercase text-gold mt-1">Espace client</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-10">
            {(["login","register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={cn(
                  "flex-1 pb-3.5 text-2xs tracking-luxury uppercase relative transition-colors duration-200",
                  tab === t ? "text-ivory" : "text-ivory/30 hover:text-ivory/60"
                )}
              >
                {t === "login" ? "Connexion" : "Créer un compte"}
                {tab === t && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-gold" />
                )}
              </button>
            ))}
          </div>

          {/* Erreur */}
          {error && (
            <div className="mb-6 px-4 py-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-light">
              {error}
            </div>
          )}

          {/* ── Connexion ── */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-2xs tracking-luxury uppercase text-ivory/40 mb-2">Email</label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.fr"
                  className="w-full bg-white/5 border border-white/10 text-ivory font-light text-sm px-4 py-3.5 outline-none focus:border-gold placeholder:text-ivory/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-2xs tracking-luxury uppercase text-ivory/40 mb-2">Mot de passe</label>
                <input
                  type="password" required value={pwd} onChange={e => setPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 text-ivory font-light text-sm px-4 py-3.5 outline-none focus:border-gold placeholder:text-ivory/20 transition-colors"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full mt-2 py-4 bg-gold text-charcoal text-2xs tracking-luxury uppercase font-light hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Connexion…" : "Se connecter"}
              </button>
            </form>
          )}

          {/* ── Inscription ── */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs tracking-luxury uppercase text-ivory/40 mb-2">Prénom</label>
                  <input
                    type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Marie"
                    className="w-full bg-white/5 border border-white/10 text-ivory font-light text-sm px-4 py-3.5 outline-none focus:border-gold placeholder:text-ivory/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-2xs tracking-luxury uppercase text-ivory/40 mb-2">Nom</label>
                  <input
                    type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="Dupont"
                    className="w-full bg-white/5 border border-white/10 text-ivory font-light text-sm px-4 py-3.5 outline-none focus:border-gold placeholder:text-ivory/20 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-2xs tracking-luxury uppercase text-ivory/40 mb-2">Email</label>
                <input
                  type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  placeholder="votre@email.fr"
                  className="w-full bg-white/5 border border-white/10 text-ivory font-light text-sm px-4 py-3.5 outline-none focus:border-gold placeholder:text-ivory/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-2xs tracking-luxury uppercase text-ivory/40 mb-2">Mot de passe</label>
                <input
                  type="password" required value={regPwd} onChange={e => setRegPwd(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full bg-white/5 border border-white/10 text-ivory font-light text-sm px-4 py-3.5 outline-none focus:border-gold placeholder:text-ivory/20 transition-colors"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full mt-2 py-4 bg-gold text-charcoal text-2xs tracking-luxury uppercase font-light hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Création…" : "Créer mon compte"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </>
  );
}
