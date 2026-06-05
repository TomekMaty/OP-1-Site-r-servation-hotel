import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Calendar, ShoppingBag, Clock, CheckCircle, XCircle, ChefHat } from "lucide-react";
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

const orderStatus: Record<string, { label: string; icon: React.ElementType }> = {
  pending:   { label: "En attente",    icon: Clock },
  preparing: { label: "En préparation", icon: ChefHat },
  delivered: { label: "Livré",          icon: CheckCircle },
  cancelled: { label: "Annulé",         icon: XCircle },
};

function nights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000);
}

function fdate(d: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(d).toLocaleDateString("fr-FR", opts ?? { day: "2-digit", month: "short", year: "numeric" });
}

export function MyAccountPage() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]           = useState<Tab>("bookings");
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [orders,   setOrders]   = useState<MyOrder[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!token) { navigate("/connexion?redirect=/mon-espace"); return; }
    Promise.all([fetchMyBookings(), fetchMyOrders()])
      .then(([b, o]) => { setBookings(b); setOrders(o); })
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const handleLogout = () => { logout(); navigate("/"); };

  if (!user) return null;

  const activeBooking = bookings.find(b => b.status !== "cancelled" && new Date(b.check_out) >= new Date());

  return (
    <>
      <SEO title="Mon espace" description="Consultez vos réservations et commandes room service." />

      {/* ── Mini hero ── */}
      <div className="bg-charcoal pt-24 pb-14 px-6 lg:px-16">
        <div className="max-w-5xl mx-auto flex items-end justify-between">
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8 }}>
            <span className="text-2xs tracking-luxury uppercase text-gold block mb-3">Espace client</span>
            <h1 className="font-serif text-4xl lg:text-5xl font-light text-ivory leading-tight">
              Bienvenue,<br />
              <em className="italic text-ivory/45">{user.first_name} {user.last_name}</em>
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
        <div className="max-w-5xl mx-auto px-6 lg:px-16 flex">
          {([["bookings","Réservations",Calendar],["orders","Commandes",ShoppingBag]] as const).map(([id, label, Icon]) => (
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
              {tab === id && <span className="absolute bottom-0 left-0 right-0 h-px bg-gold" />}
            </button>
          ))}
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
                <p className="font-serif text-2xl font-light text-charcoal/30 mb-4">Aucune réservation</p>
                <Link to="/chambres" className="text-2xs tracking-luxury uppercase text-gold hover:underline">
                  Découvrir nos chambres →
                </Link>
              </div>
            )}

            {bookings.map((b, i) => {
              const n = nights(b.check_in, b.check_out);
              const st = bookingStatus[b.status] ?? bookingStatus.pending;
              const img = Array.isArray(b.images) ? b.images[0] : b.images;

              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.5, delay: i*0.07 }}
                  className="bg-white border border-border grid grid-cols-[160px_1fr_auto] overflow-hidden"
                >
                  <img src={img} alt={b.room_name} className="w-full h-full object-cover" style={{ maxHeight: 140 }} />

                  <div className="p-6">
                    <span className="text-2xs tracking-luxury uppercase text-gold block mb-1.5">Réservation #{b.id}</span>
                    <p className="font-serif text-xl font-light text-charcoal mb-4">{b.room_name}</p>
                    <div className="flex gap-8 text-sm">
                      {[
                        ["Arrivée",  fdate(b.check_in)],
                        ["Départ",   fdate(b.check_out)],
                        ["Durée",    `${n} nuit${n > 1?"s":""}`],
                        ["Voyageurs",`${b.guests} pers.`],
                      ].map(([lbl, val]) => (
                        <div key={lbl}>
                          <p className="text-2xs tracking-wide uppercase text-charcoal/35 mb-1">{lbl}</p>
                          <p className="font-light text-charcoal">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 border-l border-border flex flex-col items-end justify-between min-w-[160px]">
                    <span className={cn("text-2xs tracking-wide px-2.5 py-1 border", st.cls)}>{st.label}</span>
                    <div className="text-right">
                      <p className="font-serif text-2xl font-light text-charcoal">{formatPrice(b.total_price)}</p>
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
            {orders.length === 0 && (
              <div className="text-center py-24">
                <p className="font-serif text-2xl font-light text-charcoal/30 mb-4">Aucune commande</p>
                <Link to="/room-service" className="text-2xs tracking-luxury uppercase text-gold hover:underline">
                  Accéder au room service →
                </Link>
              </div>
            )}

            <div className="space-y-4">
              {orders.map((order, i) => {
                const st = orderStatus[order.status] ?? orderStatus.pending;
                const Icon = st.icon;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.5, delay: i*0.06 }}
                    className="bg-white border border-border overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                      <div className="flex items-center gap-6">
                        <span className="text-2xs tracking-wide uppercase text-charcoal/40">#{String(order.id).padStart(4,"0")}</span>
                        <span className="text-sm font-light text-charcoal">
                          {fdate(order.created_at, { day:"2-digit", month:"long", year:"numeric" })}
                        </span>
                        <span className="text-sm font-light text-charcoal/50">Chambre {order.room_number}</span>
                      </div>
                      <div className="flex items-center gap-5">
                        <span className="flex items-center gap-1.5 text-2xs text-charcoal/50">
                          <Icon size={12} /> {st.label}
                        </span>
                        <span className="font-serif text-lg font-light">{formatPrice(order.total_price)}</span>
                      </div>
                    </div>

                    <div className="px-6 py-4 space-y-3">
                      {order.items.map((item, j) => (
                        <div key={j} className="flex items-center gap-4">
                          <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover" />
                          <div className="flex-1">
                            <p className="font-serif text-sm font-light text-charcoal">{item.name}</p>
                            <p className="text-xs text-charcoal/40">× {item.quantity}</p>
                          </div>
                          <span className="text-sm font-light text-charcoal">{formatPrice(item.unit_price * item.quantity)}</span>
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
            </div>

            {orders.length > 0 && (
              <div className="mt-10 bg-charcoal p-8 flex items-center justify-between">
                <div>
                  <p className="font-serif text-xl font-light text-ivory">Commander à nouveau</p>
                  <p className="text-xs font-light text-ivory/40 mt-1">Room Service disponible 7h – 22h</p>
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
              <p className="text-xs font-light text-ivory/40 mt-1">Disponible pendant votre séjour · 7h – 22h</p>
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
