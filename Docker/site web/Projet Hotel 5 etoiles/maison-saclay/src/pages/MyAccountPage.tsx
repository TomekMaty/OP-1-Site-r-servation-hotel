import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Calendar,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Truck,
  RefreshCw,
} from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { useAuth } from "@/lib/auth-context";
import { fetchMyBookings, fetchMyOrders, type MyBooking, type MyOrder } from "@/services/api";
import { cn, formatPrice } from "@/lib/utils";

type Tab = "bookings" | "orders";

const bookingStatus: Record<string, { label: string; cls: string }> = {
  pending:   { label: "En attente",  cls: "text-amber-700 bg-amber-50 border-amber-200" },
  confirmed: { label: "Confirmée",   cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  cancelled: { label: "Annulée",     cls: "text-red-600 bg-red-50 border-red-200" },
};

const ORDER_STEPS: Array<{
  key: string;
  label: string;
  icon: React.ElementType;
  doneFor: string[];
}> = [
  { key: "pending",   label: "Reçue",           icon: Clock,      doneFor: ["pending","preparing","delivered"] },
  { key: "preparing", label: "En préparation",   icon: ChefHat,    doneFor: ["preparing","delivered"] },
  { key: "delivered", label: "Livrée",           icon: Truck,      doneFor: ["delivered"] },
];

function nights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000);
}

function fdate(d: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(d).toLocaleDateString("fr-FR", opts ?? { day: "2-digit", month: "short", year: "numeric" });
}

// ── Bandeau live pour commande active ────────────────────────
function LiveOrderBanner({ order }: { order: MyOrder }) {
  const isActive = order.status === "pending" || order.status === "preparing";

  if (!isActive) return null;

  const currentStepIndex = order.status === "pending" ? 0 : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-charcoal border border-charcoal/80 p-6 mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold" />
          </span>
          <p className="text-2xs tracking-luxury uppercase text-gold font-light">Commande en cours</p>
        </div>
        <span className="text-xs font-light text-ivory/40">
          Chambre {order.room_number} · #{String(order.id).padStart(4, "0")}
        </span>
      </div>

      {/* Progress steps */}
      <div className="flex items-start">
        {ORDER_STEPS.map((step, i) => {
          const done   = step.doneFor.includes(order.status);
          const active = i === currentStepIndex;
          const Icon   = step.icon;

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative">
              {/* Ligne de connexion */}
              {i < ORDER_STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute top-4 left-1/2 right-0 h-px transition-all duration-700",
                    done ? "bg-gold/60" : "bg-white/10"
                  )}
                />
              )}

              {/* Cercle */}
              <div
                className={cn(
                  "relative z-10 w-8 h-8 flex items-center justify-center mb-3 transition-all duration-500",
                  done && !active ? "bg-gold/20 border border-gold/60"
                  : active ? "bg-gold border-gold border"
                  : "bg-white/5 border border-white/15"
                )}
              >
                <Icon
                  size={13}
                  className={cn(
                    "transition-colors",
                    done && !active ? "text-gold"
                    : active ? "text-charcoal"
                    : "text-white/20"
                  )}
                />
                {active && (
                  <span className="absolute inset-0 animate-pulse bg-gold/30" />
                )}
              </div>

              {/* Label */}
              <p
                className={cn(
                  "text-2xs text-center font-light leading-tight px-1",
                  done ? "text-gold/80"
                  : "text-ivory/20"
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Estimation */}
      <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
        <p className="text-xs font-light text-ivory/40">
          {order.status === "pending"
            ? "Votre commande est transmise à la cuisine"
            : "Votre commande est en cours de préparation"}
        </p>
        <p className="text-2xs text-ivory/25 font-light">~20–35 min</p>
      </div>
    </motion.div>
  );
}

export function MyAccountPage() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [tab,      setTab]      = useState<Tab>("bookings");
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [orders,   setOrders]   = useState<MyOrder[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [b, o] = await Promise.all([fetchMyBookings(), fetchMyOrders()]);
      setBookings(b);
      setOrders(o);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/connexion?redirect=/mon-espace");
      return;
    }
    void loadData();
  }, [token, navigate]);

  // Auto-refresh toutes les 10s quand sur l'onglet commandes et qu'il y a des commandes actives
  useEffect(() => {
    if (tab !== "orders") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const hasActive = orders.some(
      (o) => o.status === "pending" || o.status === "preparing"
    );

    if (!hasActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => { void loadData(true); }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tab, orders]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return null;

  const activeBooking = bookings.find(
    (b) => b.status !== "cancelled" && new Date(b.check_out) >= new Date()
  );

  const activeOrder = orders.find(
    (o) => o.status === "pending" || o.status === "preparing"
  );

  return (
    <>
      <SEO title="Mon espace" description="Consultez vos réservations et commandes room service." />

      {/* ── Mini hero ── */}
      <div className="bg-charcoal pt-24 pb-14 px-6 lg:px-16">
        <div className="max-w-5xl mx-auto flex items-end justify-between">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-2xs tracking-luxury uppercase text-gold block mb-3">
              Espace client
            </span>
            <h1 className="font-serif text-4xl lg:text-5xl font-light text-ivory leading-tight">
              Bienvenue,<br />
              <em className="italic text-ivory/45">
                {user.first_name} {user.last_name}
              </em>
            </h1>
          </motion.div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-ivory/40 hover:text-ivory text-xs tracking-wide transition-colors"
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 lg:px-16 flex items-center justify-between">
          <div className="flex">
            {([
              ["bookings", "Réservations", Calendar],
              ["orders",   "Commandes",    ShoppingBag],
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-2 py-4 mr-10 text-2xs tracking-luxury uppercase relative transition-colors",
                  tab === id ? "text-charcoal" : "text-charcoal/40 hover:text-charcoal/70"
                )}
              >
                <Icon size={13} />
                {label}
                {tab === id && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-gold" />
                )}
                {/* Badge commande active */}
                {id === "orders" && activeOrder && tab !== "orders" && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-gold animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Refresh indicator */}
          {refreshing && (
            <RefreshCw size={13} className="text-charcoal/30 animate-spin" />
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-16 py-12">

        {loading && (
          <div className="text-center py-24 text-charcoal/30 font-light text-sm tracking-wide">
            Chargement…
          </div>
        )}

        {/* ── RÉSERVATIONS ── */}
        {!loading && tab === "bookings" && (
          <div className="space-y-4">
            {bookings.length === 0 && (
              <div className="text-center py-24">
                <p className="font-serif text-2xl font-light text-charcoal/30 mb-4">
                  Aucune réservation
                </p>
                <Link
                  to="/chambres"
                  className="text-2xs tracking-luxury uppercase text-gold hover:underline"
                >
                  Découvrir nos chambres →
                </Link>
              </div>
            )}

            {bookings.map((b, i) => {
              const n   = nights(b.check_in, b.check_out);
              const st  = bookingStatus[b.status] ?? bookingStatus.pending;
              const img = Array.isArray(b.images) ? b.images[0] : b.images;

              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className="bg-white border border-border grid grid-cols-[160px_1fr_auto] overflow-hidden"
                >
                  <img
                    src={img}
                    alt={b.room_name}
                    className="w-full h-full object-cover"
                    style={{ maxHeight: 140 }}
                  />

                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xs tracking-luxury uppercase text-gold">
                        Réservation #{b.id}
                      </span>
                      {b.room_number && (
                        <span className="flex items-center gap-1.5 bg-charcoal text-ivory px-2.5 py-1 text-xs font-light">
                          🔑 Chambre {b.room_number}
                        </span>
                      )}
                    </div>
                    <p className="font-serif text-xl font-light text-charcoal mb-4">
                      {b.room_name}
                    </p>
                    <div className="flex gap-8 text-sm">
                      {[
                        ["Arrivée",      fdate(b.check_in)],
                        ["Départ",       fdate(b.check_out)],
                        ["Durée",        `${n} nuit${n > 1 ? "s" : ""}`],
                        ["Voyageurs",    `${b.guests} pers.`],
                      ].map(([lbl, val]) => (
                        <div key={lbl}>
                          <p className="text-2xs tracking-wide uppercase text-charcoal/35 mb-1">
                            {lbl}
                          </p>
                          <p className="font-light text-charcoal">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 border-l border-border flex flex-col items-end justify-between min-w-[160px]">
                    <span className={cn("text-2xs tracking-wide px-2.5 py-1 border", st.cls)}>
                      {st.label}
                    </span>
                    <div className="text-right">
                      <p className="font-serif text-2xl font-light text-charcoal">
                        {formatPrice(b.total_price)}
                      </p>
                      <p className="text-xs text-charcoal/40 font-light">{n} nuits</p>
                    </div>
                    {b.status === "confirmed" && new Date(b.check_out) >= new Date() && (
                      <Link
                        to="/room-service"
                        className="text-2xs tracking-luxury uppercase border border-charcoal text-charcoal px-3 py-2 hover:bg-charcoal hover:text-ivory transition-colors"
                      >
                        Room Service →
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── COMMANDES ── */}
        {!loading && tab === "orders" && (
          <div>
            {/* Bandeau live si commande active */}
            {activeOrder && <LiveOrderBanner order={activeOrder} />}

            {orders.length === 0 && (
              <div className="text-center py-24">
                <p className="font-serif text-2xl font-light text-charcoal/30 mb-4">
                  Aucune commande
                </p>
                <Link
                  to="/room-service"
                  className="text-2xs tracking-luxury uppercase text-gold hover:underline"
                >
                  Accéder au room service →
                </Link>
              </div>
            )}

            <div className="space-y-4">
              <AnimatePresence>
                {orders.map((order, i) => {
                  const isActive = order.status === "pending" || order.status === "preparing";
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.06 }}
                      className={cn(
                        "bg-white border overflow-hidden transition-colors duration-300",
                        isActive ? "border-gold/40" : "border-border"
                      )}
                    >
                      {/* Header commande */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-6">
                          <span className="text-2xs tracking-wide uppercase text-charcoal/40">
                            #{String(order.id).padStart(4, "0")}
                          </span>
                          <span className="text-sm font-light text-charcoal">
                            {fdate(order.created_at, {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-sm font-light text-charcoal/50">
                            Chambre {order.room_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-5">
                          <StatusPill status={order.status} />
                          <span className="font-serif text-lg font-light">
                            {formatPrice(order.total_price)}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="px-6 py-4 space-y-3">
                        {order.items.map((item, j) => (
                          <div key={j} className="flex items-center gap-4">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-10 h-10 object-cover"
                            />
                            <div className="flex-1">
                              <p className="font-serif text-sm font-light text-charcoal">
                                {item.name}
                              </p>
                              <p className="text-xs text-charcoal/40">× {item.quantity}</p>
                            </div>
                            <span className="text-sm font-light text-charcoal">
                              {formatPrice(item.unit_price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className="px-6 py-3 bg-ivory/50 border-t border-border text-xs font-light text-charcoal/50 italic">
                          Note : {order.notes}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {orders.length > 0 && (
              <div className="mt-10 bg-charcoal p-8 flex items-center justify-between">
                <div>
                  <p className="font-serif text-xl font-light text-ivory">
                    Commander à nouveau
                  </p>
                  <p className="text-xs font-light text-ivory/40 mt-1">
                    Room Service disponible 7h – 22h
                  </p>
                </div>
                <Link
                  to="/room-service"
                  className="px-6 py-3 bg-gold text-charcoal text-2xs tracking-luxury uppercase hover:bg-gold/90 transition-colors"
                >
                  Accéder au menu
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── CTA room service si séjour actif ── */}
        {!loading && tab === "bookings" && bookings.length > 0 && !activeBooking && (
          <div className="mt-10 bg-charcoal p-8 flex items-center justify-between">
            <div>
              <p className="font-serif text-xl font-light text-ivory">Room Service</p>
              <p className="text-xs font-light text-ivory/40 mt-1">
                Disponible pendant votre séjour · 7h – 22h
              </p>
            </div>
            <Link
              to="/room-service"
              className="px-6 py-3 bg-gold text-charcoal text-2xs tracking-luxury uppercase hover:bg-gold/90 transition-colors"
            >
              Voir le menu
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

// ── Pill de statut commande ───────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    pending:   { label: "En attente",     cls: "text-amber-700 bg-amber-50 border-amber-200",    icon: Clock },
    preparing: { label: "En préparation", cls: "text-blue-700 bg-blue-50 border-blue-200",       icon: ChefHat },
    delivered: { label: "Livré",          cls: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle },
    cancelled: { label: "Annulé",         cls: "text-red-600 bg-red-50 border-red-200",          icon: XCircle },
  };
  const c    = config[status] ?? config.pending;
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-2xs font-light px-2.5 py-1 border tracking-wide", c.cls)}>
      <Icon size={11} />
      {c.label}
    </span>
  );
}
