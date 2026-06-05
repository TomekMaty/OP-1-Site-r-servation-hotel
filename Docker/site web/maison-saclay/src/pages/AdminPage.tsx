import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, RefreshCw, CheckCircle, XCircle, Clock, Mail, Calendar, Users, Euro } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import {
  apiAdminLogin,
  fetchAdminBookings,
  fetchAdminContacts,
  updateBookingStatus,
  type AdminBooking,
  type AdminContact,
  type BookingStatus,
} from "@/services/api";

const ADMIN_TOKEN_KEY = "ms_admin_token";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function nights(checkIn: string, checkOut: string) {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.round(diff / 86400000);
}

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "En attente", color: "text-amber-600 bg-amber-50 border-amber-200", icon: Clock },
  confirmed: { label: "Confirmée", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle },
  cancelled: { label: "Annulée", color: "text-red-600 bg-red-50 border-red-200", icon: XCircle },
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, color, icon: Icon } = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-2xs font-light border tracking-wide", color)}>
      <Icon size={11} />
      {label}
    </span>
  );
}

function LoginScreen({ onLogin }: { onLogin: (password: string) => Promise<void> }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onLogin(pwd);
    } catch {
      setError(true);
      setPwd("");
      setTimeout(() => setError(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <p className="font-serif text-3xl font-light text-ivory mb-1">Maison Saclay</p>
          <p className="text-2xs tracking-luxury uppercase text-gold">Administration</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Mot de passe"
              autoFocus
              className={cn(
                "w-full px-4 py-3 bg-charcoal-400 border text-ivory font-light text-sm",
                "placeholder:text-ivory/30 outline-none focus:border-gold transition-colors duration-200",
                error ? "border-red-500" : "border-ivory/20"
              )}
            />
            {error && <p className="text-red-400 text-2xs mt-1.5 font-light">Mot de passe incorrect</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gold text-charcoal text-sm font-light tracking-wide hover:bg-gold-400 transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn size={14} />
            {loading ? "Connexion..." : "Accéder au tableau de bord"}
          </button>
        </form>
        <p className="text-center text-2xs text-ivory/20 mt-8 font-light">Accès réservé au personnel de Maison Saclay</p>
      </motion.div>
    </div>
  );
}

export function AdminPage() {
  const [authenticated, setAuthenticated] = useState(() => !!sessionStorage.getItem(ADMIN_TOKEN_KEY));
  const [tab, setTab] = useState<"bookings" | "contacts">("bookings");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [contacts, setContacts] = useState<AdminContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [copiedContactId, setCopiedContactId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [nextBookings, nextContacts] = await Promise.all([fetchAdminBookings(), fetchAdminContacts()]);
      setBookings(nextBookings);
      setContacts(nextContacts);
    } catch (e) {
      console.error("Erreur chargement admin:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      queueMicrotask(() => {
        void load();
      });
    }
  }, [authenticated]);

  const handleLogin = async (password: string) => {
    const { token } = await apiAdminLogin(password);
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    setAuthenticated(true);
  };

  const handleStatus = async (id: number, status: BookingStatus) => {
    setUpdating(id);
    try {
      await updateBookingStatus(id, status);
      setBookings((prev) =>
        status === "cancelled"
          ? prev.filter((booking) => booking.id !== id)
          : prev.map((booking) => (booking.id === id ? { ...booking, status } : booking))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(null);
    }
  };

  const handleReply = async (contact: AdminContact) => {
    const replyText = `${contact.email}\nSujet: Re: ${contact.subject}`;

    try {
      await navigator.clipboard.writeText(replyText);
      setCopiedContactId(contact.id);
      setTimeout(() => {
        setCopiedContactId((current) => (current === contact.id ? null : current));
      }, 2000);
    } catch (error) {
      console.error("Impossible de copier les informations du contact", error);
    }
  };

  if (!authenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const visibleBookings = bookings.filter((booking) => booking.status !== "cancelled");

  const stats = {
    total: visibleBookings.length,
    pending: visibleBookings.filter((booking) => booking.status === "pending").length,
    confirmed: visibleBookings.filter((booking) => booking.status === "confirmed").length,
    revenue: visibleBookings.reduce((sum, booking) => sum + Number(booking.total_price), 0),
  };

  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-charcoal px-6 lg:px-12 py-5 flex items-center justify-between">
        <div>
          <p className="font-serif text-xl font-light text-ivory">Maison Saclay</p>
          <p className="text-2xs tracking-luxury uppercase text-gold">Administration</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-light text-ivory/60 hover:text-ivory transition-colors duration-200"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem(ADMIN_TOKEN_KEY);
              setAuthenticated(false);
            }}
            className="text-xs font-light text-ivory/40 hover:text-ivory/70 transition-colors duration-200"
          >
            Deconnexion
          </button>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Réservations", value: stats.total, icon: Calendar, color: "text-charcoal" },
            { label: "En attente", value: stats.pending, icon: Clock, color: "text-amber-600" },
            { label: "Confirmées", value: stats.confirmed, icon: CheckCircle, color: "text-emerald-600" },
            { label: "Chiffre d'affaires", value: formatPrice(stats.revenue), icon: Euro, color: "text-gold" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white border border-border p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-2xs tracking-luxury uppercase text-charcoal/40">{stat.label}</p>
                <stat.icon size={14} className={stat.color} />
              </div>
              <p className={cn("font-serif text-2xl font-light", stat.color)}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-1 mb-8 border-b border-border">
          {(["bookings", "contacts"] as const).map((nextTab) => (
            <button
              key={nextTab}
              onClick={() => setTab(nextTab)}
              className={cn(
                "relative px-6 py-3 text-sm font-light transition-colors duration-200",
                tab === nextTab ? "text-charcoal" : "text-charcoal/40 hover:text-charcoal"
              )}
            >
              {nextTab === "bookings" ? `Réservations (${visibleBookings.length})` : `Messages (${contacts.length})`}
              {tab === nextTab && <motion.div layoutId="admin-tab" className="absolute bottom-0 left-0 right-0 h-px bg-charcoal" />}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "bookings" && (
            <motion.div key="bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {visibleBookings.length === 0 ? (
                <div className="text-center py-20">
                  <p className="font-serif text-2xl font-light text-charcoal/30">Aucune réservation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleBookings.map((booking) => (
                    <motion.div
                      key={booking.id}
                      layout
                      className="bg-white border border-border p-5 lg:p-6 hover:border-charcoal/20 transition-colors duration-200"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 lg:gap-6">
                          <div>
                            <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-1">Client</p>
                            <p className="font-serif text-base font-light text-charcoal">
                              {booking.first_name} {booking.last_name}
                            </p>
                            <p className="text-xs text-charcoal/40 font-light">{booking.email}</p>
                          </div>
                          <div>
                            <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-1">Chambre</p>
                            <p className="text-sm font-light text-charcoal">{booking.room_name}</p>
                            <p className="text-xs text-charcoal/40 font-light flex items-center gap-1">
                              <Users size={10} /> {booking.guests} pers.
                            </p>
                          </div>
                          <div>
                            <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-1">Dates</p>
                            <p className="text-sm font-light text-charcoal">
                              {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                            </p>
                            <p className="text-xs text-charcoal/40 font-light">{nights(booking.check_in, booking.check_out)} nuit(s)</p>
                          </div>
                          <div>
                            <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-1">Total</p>
                            <p className="font-serif text-lg font-light text-gold">{formatPrice(Number(booking.total_price))}</p>
                            <p className="text-xs text-charcoal/40 font-light">Reçu le {formatDate(booking.created_at)}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-start lg:items-end gap-3 flex-shrink-0">
                          <StatusBadge status={booking.status} />
                          <div className="flex gap-2">
                            {booking.status !== "confirmed" && (
                              <button
                                onClick={() => handleStatus(booking.id, "confirmed")}
                                disabled={updating === booking.id}
                                className="px-3 py-1.5 text-2xs font-light tracking-wide bg-emerald-600 text-white hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50"
                              >
                                {updating === booking.id ? "..." : "Confirmer"}
                              </button>
                            )}
                            {booking.status !== "cancelled" && (
                              <button
                                onClick={() => handleStatus(booking.id, "cancelled")}
                                disabled={updating === booking.id}
                                className="px-3 py-1.5 text-2xs font-light tracking-wide border border-red-300 text-red-600 hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
                              >
                                {updating === booking.id ? "..." : "Annuler"}
                              </button>
                            )}
                            {booking.status !== "pending" && (
                              <button
                                onClick={() => handleStatus(booking.id, "pending")}
                                disabled={updating === booking.id}
                                className="px-3 py-1.5 text-2xs font-light tracking-wide border border-border text-charcoal/50 hover:text-charcoal transition-colors duration-200 disabled:opacity-50"
                              >
                                En attente
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "contacts" && (
            <motion.div key="contacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {contacts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="font-serif text-2xl font-light text-charcoal/30">Aucun message</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="bg-white border border-border p-5 lg:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
                          <div>
                          <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-1">Expéditeur</p>
                            <p className="font-serif text-base font-light text-charcoal">
                              {contact.first_name} {contact.last_name}
                            </p>
                            <a href={`mailto:${contact.email}`} className="text-xs text-gold font-light hover:underline flex items-center gap-1">
                              <Mail size={10} /> {contact.email}
                            </a>
                          </div>
                          <div>
                            <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-1">Sujet</p>
                            <p className="text-sm font-light text-charcoal">{contact.subject}</p>
                          </div>
                          <div>
                            <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-1">Reçu le</p>
                            <p className="text-sm font-light text-charcoal">{formatDate(contact.created_at)}</p>
                            {!contact.read_at && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-2xs bg-gold/20 text-gold-500 border border-gold/30 font-light">
                                Non lu
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleReply(contact)}
                          className="flex-shrink-0 px-4 py-2 border border-border text-xs font-light text-charcoal/70 hover:border-charcoal hover:text-charcoal transition-colors duration-200 flex items-center gap-1.5"
                        >
                          <Mail size={12} /> {copiedContactId === contact.id ? "Copié" : "Répondre"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
