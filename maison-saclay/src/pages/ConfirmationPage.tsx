import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Calendar,
  Moon,
  Users,
  ArrowRight,
  UtensilsCrossed,
  BedDouble,
  Check,
  Clock,
  Phone,
  Wifi,
} from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { formatPrice } from "@/lib/utils";
import { fetchMyBookings, type BookingStatus } from "@/services/api";
import { cn } from "@/lib/utils";

interface BookingState {
  id: number;
  room_number: string;
  phone_extension?: string;
  room_name: string;
  room_category: string;
  room_image: string;
  check_in: string;
  check_out: string;
  nights: number;
  total: number;
}

function fdate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const CATEGORY_BG: Record<string, string> = {
  chambre:   "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=85",
  suite:     "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=85",
  penthouse: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1600&q=85",
};

const JOURNEY = [
  { label: "Demande envoyée",     sub: "Votre réservation est reçue" },
  { label: "Confirmation hôtel", sub: "En cours de traitement"      },
  { label: "Votre séjour",        sub: "Nous vous attendons"          },
];

export function ConfirmationPage() {
  const { state } = useLocation() as { state: BookingState | null };
  const navigate  = useNavigate();

  const [liveStatus, setLiveStatus] = useState<BookingStatus>("pending");
  const [lastCheck,  setLastCheck]  = useState<Date>(new Date());

  // Si on arrive sans state (accès direct à l'URL), on redirige
  if (!state) {
    navigate("/chambres", { replace: true });
    return null;
  }

  const bg = CATEGORY_BG[state.room_category] ?? state.room_image;

  // ── Polling toutes les 5s pour détecter la confirmation admin ──
  useEffect(() => {
    if (liveStatus === "confirmed") return;

    const poll = async () => {
      try {
        const bookings = await fetchMyBookings();
        const found    = bookings.find((b) => b.id === state.id);
        if (found && found.status !== liveStatus) {
          setLiveStatus(found.status as BookingStatus);
        }
        setLastCheck(new Date());
      } catch {
        // silently ignore network errors
      }
    };

    const timer = setInterval(() => { void poll(); }, 5000);
    return () => clearInterval(timer);
  }, [liveStatus, state.id]);

  const isConfirmed = liveStatus === "confirmed";
  const isCancelled = liveStatus === "cancelled";

  // step : 0 = envoyée, 1 = confirmation, 2 = séjour
  const currentStep = isConfirmed ? 1 : 0;

  const timeSince = Math.round((new Date().getTime() - lastCheck.getTime()) / 1000);

  return (
    <>
      <SEO
        title="Réservation confirmée"
        description="Votre réservation à Maison Saclay a bien été enregistrée."
      />

      <div className="min-h-screen bg-ivory">

        {/* ── Hero plein écran ── */}
        <div className="relative h-[55vh] min-h-[380px] overflow-hidden flex items-end">
          <img
            src={bg}
            alt={state.room_name}
            className="absolute inset-0 w-full h-full object-cover brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" />

          <div className="relative w-full px-6 lg:px-20 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Icône succès */}
              <div className="flex items-center gap-3 mb-5">
                <CheckCircle size={22} className="text-gold" strokeWidth={1.5} />
                <span className="text-2xs tracking-luxury uppercase text-gold font-light">
                  Réservation enregistrée
                </span>
              </div>

              <h1 className="font-serif text-4xl lg:text-6xl font-light text-ivory leading-tight mb-4">
                Bienvenue à<br />
                <em className="italic text-ivory/55">Maison Saclay</em>
              </h1>

              {/* Badge chambre */}
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center gap-2.5 bg-gold px-5 py-2.5">
                  <BedDouble size={15} className="text-charcoal" />
                  <span className="font-serif text-lg font-light text-charcoal">
                    Chambre {state.room_number}
                  </span>
                </div>
                <span className="text-ivory/40 font-light text-sm">#{state.id}</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="max-w-5xl mx-auto px-6 lg:px-20 -mt-8 relative z-10">

          {/* ── Card détails ── */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-border"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-border bg-charcoal">
              <p className="text-2xs tracking-luxury uppercase text-gold mb-1">{state.room_name}</p>
              <p className="font-serif text-2xl font-light text-ivory">Détails de votre séjour</p>
            </div>

            {/* Grid infos */}
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
              {[
                {
                  icon: Calendar,
                  label: "Arrivée",
                  value: fdate(state.check_in).replace(/^\w/, (c) => c.toUpperCase()),
                },
                {
                  icon: Calendar,
                  label: "Départ",
                  value: fdate(state.check_out).replace(/^\w/, (c) => c.toUpperCase()),
                },
                {
                  icon: Moon,
                  label: "Durée",
                  value: `${state.nights} nuit${state.nights > 1 ? "s" : ""}`,
                },
                {
                  icon: Users,
                  label: "Montant",
                  value: formatPrice(state.total),
                  gold: true,
                },
              ].map(({ icon: Icon, label, value, gold }) => (
                <div key={label} className="px-6 py-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={12} className="text-charcoal/30" />
                    <p className="text-2xs tracking-luxury uppercase text-charcoal/40">{label}</p>
                  </div>
                  <p
                    className={cn(
                      "font-serif text-base font-light leading-tight",
                      gold ? "text-gold text-xl" : "text-charcoal"
                    )}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Statut live ── */}
            {isCancelled ? (
              <div className="px-8 py-5 bg-red-50 border-t border-red-100 flex items-start gap-3">
                <span className="text-red-500 mt-0.5 text-lg">✕</span>
                <div>
                  <p className="text-sm font-light text-red-900 font-medium">Réservation annulée</p>
                  <p className="text-xs font-light text-red-600 mt-0.5">
                    Cette réservation a été annulée. Contactez notre équipe pour toute question.
                  </p>
                </div>
              </div>
            ) : isConfirmed ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.5 }}
                className="px-8 py-5 bg-emerald-50 border-t border-emerald-100 flex items-start gap-3"
              >
                <CheckCircle size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-light text-emerald-900 font-medium">
                    Réservation confirmée par l'hôtel
                  </p>
                  <p className="text-xs font-light text-emerald-700 mt-0.5">
                    Votre séjour est confirmé. Nous vous attendons à Maison Saclay.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="px-8 py-5 bg-amber-50 border-t border-amber-100 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Clock size={17} className="text-amber-600 mt-0.5 flex-shrink-0 animate-pulse" />
                  <div>
                    <p className="text-sm font-light text-amber-900">
                      En attente de confirmation par notre équipe
                    </p>
                    <p className="text-xs font-light text-amber-700 mt-0.5">
                      Délai habituel : moins de 2h · Mise à jour automatique
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-amber-700 rounded-full animate-spin" />
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Téléphonie + WiFi ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 bg-charcoal border border-charcoal"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
              {/* Poste chambre */}
              <div className="px-7 py-6 flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center border border-gold/30 flex-shrink-0">
                  <Phone size={15} className="text-gold" />
                </div>
                <div>
                  <p className="text-2xs tracking-luxury uppercase text-ivory/35 mb-1">Téléphone de votre chambre</p>
                  <p className="font-serif text-2xl font-light text-gold leading-none">
                    {state.phone_extension ?? "—"}
                  </p>
                </div>
              </div>

              {/* Réception */}
              <div className="px-7 py-6 flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center border border-ivory/20 flex-shrink-0">
                  <Phone size={15} className="text-ivory/50" />
                </div>
                <div>
                  <p className="text-2xs tracking-luxury uppercase text-ivory/35 mb-1">Réception 24h/24</p>
                  <p className="font-serif text-2xl font-light text-ivory leading-none">1099</p>
                </div>
              </div>

              {/* WiFi instructions */}
              <div className="px-7 py-5 border-t border-white/10">
                <div className="flex items-start gap-3">
                  <Wifi size={15} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-light text-ivory/50 uppercase tracking-widest mb-2">WiFi invité</p>
                    <ol className="space-y-1 text-sm font-light text-ivory/80 leading-relaxed">
                      <li>1. Ouvrez les paramètres WiFi de votre téléphone</li>
                      <li>2. Connectez-vous au réseau <span className="text-gold font-medium">OP1_Wifi</span></li>
                      <li>3. Identifiant : <span className="text-ivory font-medium">{state.room_number ?? "votre chambre"}</span></li>
                      <li>4. Mot de passe : <span className="text-ivory font-medium">{state.room_number ?? "votre chambre"}</span></li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Parcours de réservation ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 bg-white border border-border px-8 py-7"
          >
            <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-8">Votre parcours</p>

            <div className="flex items-start gap-0">
              {JOURNEY.map((step, i) => {
                const done   = i < currentStep || (i === 1 && isConfirmed);
                const active = !isConfirmed && i === 0;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center relative">
                    {/* Ligne de connexion */}
                    {i < JOURNEY.length - 1 && (
                      <div
                        className={cn(
                          "absolute top-4 left-1/2 right-0 h-px transition-colors duration-700",
                          done ? "bg-charcoal" : "bg-border"
                        )}
                      />
                    )}

                    {/* Cercle */}
                    <div
                      className={cn(
                        "relative z-10 w-8 h-8 flex items-center justify-center transition-all duration-500 mb-4",
                        done  ? "bg-charcoal border-2 border-charcoal"
                              : active ? "bg-white border-2 border-gold"
                              : "bg-white border-2 border-border"
                      )}
                    >
                      {done ? (
                        <Check size={13} className="text-ivory" strokeWidth={2.5} />
                      ) : active ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-border" />
                      )}
                    </div>

                    {/* Labels */}
                    <p
                      className={cn(
                        "text-xs font-light text-center px-2 transition-colors duration-500",
                        done  ? "text-charcoal font-medium"
                              : active ? "text-charcoal"
                              : "text-charcoal/30"
                      )}
                    >
                      {step.label}
                    </p>
                    <p
                      className={cn(
                        "text-2xs text-center px-2 mt-1 transition-colors duration-500",
                        done ? "text-charcoal/50"
                             : active
                               ? isConfirmed ? "text-emerald-600" : "text-amber-600"
                               : "text-charcoal/20"
                      )}
                    >
                      {i === 1 && isConfirmed ? "✓ Confirmée" : step.sub}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Indicateur de dernière mise à jour */}
            {!isConfirmed && !isCancelled && (
              <p className="text-center text-2xs text-charcoal/25 font-light mt-6">
                Vérification auto · {timeSince < 5 ? "maintenant" : `il y a ${timeSince}s`}
              </p>
            )}
          </motion.div>

          {/* ── Prochaines étapes ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-16"
          >
            {/* Mon espace */}
            <Link
              to="/mon-espace"
              className="group bg-charcoal p-7 flex items-center justify-between hover:bg-charcoal/90 transition-colors"
            >
              <div>
                <p className="text-2xs tracking-luxury uppercase text-gold mb-2">Prochaine étape</p>
                <p className="font-serif text-xl font-light text-ivory mb-1">Mon espace client</p>
                <p className="text-xs font-light text-ivory/40">
                  Suivez l'état de votre réservation en temps réel
                </p>
              </div>
              <ArrowRight
                size={20}
                className="text-gold group-hover:translate-x-1 transition-transform"
              />
            </Link>

            {/* Room service */}
            <Link
              to="/room-service"
              className="group bg-white border border-border p-7 flex items-center justify-between hover:border-charcoal transition-colors"
            >
              <div>
                <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-2">
                  Pendant votre séjour
                </p>
                <p className="font-serif text-xl font-light text-charcoal mb-1">Room Service</p>
                <p className="text-xs font-light text-charcoal/40">
                  Chambre {state.room_number} — Livraison 20–35 min
                </p>
              </div>
              <UtensilsCrossed
                size={20}
                className="text-charcoal/30 group-hover:text-charcoal transition-colors"
              />
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
}
