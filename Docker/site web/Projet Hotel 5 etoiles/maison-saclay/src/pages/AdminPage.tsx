import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, RefreshCw, CheckCircle, XCircle, Clock, Mail, Calendar, Users, Euro, ChefHat, ShoppingBag, Truck } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { StatsTab } from "@/components/StatsTab";
import {
  apiAdminLogin,
  fetchAdminBookings,
  fetchAdminContacts,
  fetchAdminOrders,
  fetchInventory,
  updateBookingStatus,
  updateOrderStatus,
  type AdminBooking,
  type AdminContact,
  type AdminOrder,
  type BookingStatus,
  type OrderStatus,
  type PhysicalRoom,
  type InventoryData,
  type RoomInventoryStatus,
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

// ── Config statuts commandes ──────────────────────────────────
const orderStatusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "En attente",     color: "text-amber-600 bg-amber-50 border-amber-200",    icon: Clock },
  preparing: { label: "En préparation", color: "text-blue-600 bg-blue-50 border-blue-200",       icon: ChefHat },
  delivered: { label: "Livré",          color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: Truck },
  cancelled: { label: "Annulé",         color: "text-red-600 bg-red-50 border-red-200",          icon: XCircle },
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, color, icon: Icon } = orderStatusConfig[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-2xs font-light border tracking-wide", color)}>
      <Icon size={11} />
      {label}
    </span>
  );
}

// ── Config statuts inventaire ─────────────────────────────────
const INV: Record<RoomInventoryStatus, {
  label: string;
  dot: string;
  bg: string;
  border: string;
  text: string;
  badge: string;
}> = {
  available:      { label: "Libre",             dot: "bg-emerald-400",  bg: "bg-white",           border: "border-border",        text: "text-charcoal",    badge: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  occupied:       { label: "Occupée",           dot: "bg-rose-500",     bg: "bg-rose-50/30",      border: "border-rose-200",      text: "text-charcoal",    badge: "text-rose-700 bg-rose-50 border-rose-200" },
  checkin_today:  { label: "Arrivée aujourd'hui",dot:"bg-amber-400",    bg: "bg-amber-50/30",     border: "border-amber-300",     text: "text-charcoal",    badge: "text-amber-700 bg-amber-50 border-amber-200" },
  checkout_today: { label: "Départ aujourd'hui", dot:"bg-violet-400",   bg: "bg-violet-50/20",    border: "border-violet-200",    text: "text-charcoal",    badge: "text-violet-700 bg-violet-50 border-violet-200" },
  arriving_soon:  { label: "Arrivée prochaine", dot: "bg-blue-400",     bg: "bg-blue-50/20",      border: "border-blue-200",      text: "text-charcoal",    badge: "text-blue-700 bg-blue-50 border-blue-200" },
  booked:         { label: "Réservée",          dot: "bg-sky-400",      bg: "bg-sky-50/20",       border: "border-sky-200",       text: "text-charcoal",    badge: "text-sky-700 bg-sky-50 border-sky-200" },
};

const CAT_META: Record<string, { label: string; sub: string; cover: string }> = {
  chambre:   { label: "Chambre Deluxe", sub: "38 m² · 1er étage",       cover: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80" },
  suite:     { label: "Suite Panoramique", sub: "72 m² · 2ème étage",   cover: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80" },
  penthouse: { label: "Penthouse",      sub: "210 m² · 6ème étage",     cover: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600&q=80" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function RoomCard({
  room, i, onConfirm, onCancel, updating,
}: {
  room: PhysicalRoom;
  i: number;
  onConfirm: (bookingId: number) => void;
  onCancel:  (bookingId: number) => void;
  updating: number | null;
}) {
  const s = INV[room.status];
  const isOccupied  = ["occupied", "checkin_today", "checkout_today"].includes(room.status);
  const isPending   = room.booking?.status === "pending";
  const bookingId   = room.booking?.id ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: i * 0.06 }}
      className={cn("border transition-all duration-200 hover:shadow-sm", s.bg, s.border)}
    >
      <div className="flex items-stretch min-h-[88px]">
        {/* Bande couleur */}
        <div className={cn("w-1 flex-shrink-0", s.dot)} />

        {/* Numéro */}
        <div className="w-16 flex-shrink-0 flex flex-col items-center justify-center border-r border-black/5 py-3">
          <span className="font-serif text-2xl font-light text-charcoal leading-none">{room.room_number}</span>
          <span className="text-2xs text-charcoal/30 mt-1 font-light">ch.</span>
        </div>

        {/* Contenu */}
        <div className="flex-1 px-4 py-3 flex flex-col justify-center gap-1.5">
          <span className={cn(
            "self-start inline-flex items-center gap-1.5 text-2xs font-light px-2 py-0.5 border tracking-wide",
            s.badge
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
            {s.label}
          </span>

          {room.booking ? (
            <>
              <p className="text-sm font-light text-charcoal leading-tight">
                {room.booking.first_name} {room.booking.last_name}
                <span className="text-charcoal/35 text-2xs ml-2">{room.booking.guests} pers.</span>
              </p>
              <div className="flex items-center gap-2 text-2xs text-charcoal/45 font-light">
                <Calendar size={9} className="flex-shrink-0" />
                {fmtDate(room.booking.check_in)} → {fmtDate(room.booking.check_out)}
                <span className="text-charcoal/30">·</span>
                <span>{room.booking.nights} nuit{room.booking.nights > 1 ? "s" : ""}</span>
              </div>

              {/* Boutons action rapide si réservation en attente */}
              {isPending && (
                <div className="flex gap-1.5 mt-1">
                  <button
                    onClick={() => onConfirm(bookingId)}
                    disabled={updating === bookingId}
                    className="px-2 py-0.5 text-2xs font-light bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {updating === bookingId ? "…" : "✓ Confirmer"}
                  </button>
                  <button
                    onClick={() => onCancel(bookingId)}
                    disabled={updating === bookingId}
                    className="px-2 py-0.5 text-2xs font-light border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs font-light text-emerald-600/80">Disponible immédiatement</p>
          )}
        </div>

        {/* Méta droite */}
        <div className="w-24 flex-shrink-0 flex flex-col items-end justify-between py-3 pr-4 gap-1">
          <span className="font-serif text-xs font-light text-charcoal/40">
            {formatPrice(room.price)}<span className="text-2xs text-charcoal/30">/n</span>
          </span>
          {room.booking?.total_price && (
            <span className="text-2xs font-light text-gold text-right">
              {formatPrice(room.booking.total_price)}
            </span>
          )}
          {isOccupied && room.booking && room.booking.days_remaining > 0 && (
            <span className="text-2xs font-light text-charcoal/40 text-right leading-tight">
              départ<br />
              <span className="text-charcoal/60 font-medium">dans {room.booking.days_remaining}j</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function OccupancyRing({ rate }: { rate: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-charcoal/10" />
        <circle
          cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="butt"
          className="text-gold transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <span className="font-serif text-lg font-light text-charcoal leading-none">{rate}</span>
        <span className="text-2xs text-charcoal/40 block">%</span>
      </div>
    </div>
  );
}

// ── Prévision 7 jours pour un groupe de chambres ─────────────
function WeekForecast({ rooms }: { rooms: PhysicalRoom[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
  const labels = ["Auj", "Dem", ...days.slice(2).map(d =>
    new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 2)
  )];

  return (
    <div className="px-4 py-3 border-b border-border bg-ivory/30">
      <p className="text-2xs tracking-luxury uppercase text-charcoal/30 mb-2">Prévision 7 jours</p>
      <div className="flex gap-1">
        {days.map((day, i) => {
          const occ = rooms.filter(r =>
            r.booking && r.booking.check_in <= day && r.booking.check_out > day
          ).length;
          const rate = occ / Math.max(rooms.length, 1);
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div className="h-10 w-full bg-emerald-50 relative overflow-hidden rounded-sm">
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-700"
                  style={{
                    height: `${rate * 100}%`,
                    background: rate > 0.8 ? "#fb7185" : rate > 0.4 ? "#fbbf24" : "#34d399",
                    opacity: 0.85,
                  }}
                />
                {occ > 0 && (
                  <span className="absolute inset-0 flex items-end justify-center pb-0.5 text-2xs font-light text-charcoal/60">
                    {occ}
                  </span>
                )}
              </div>
              <span className="text-2xs text-charcoal/30 font-light">{labels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InventoryTab({
  data,
  onQuickConfirm,
  onQuickCancel,
  updating,
}: {
  data: InventoryData | null;
  onQuickConfirm: (bookingId: number) => void;
  onQuickCancel:  (bookingId: number) => void;
  updating: number | null;
}) {
  if (!data) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal/60 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-light text-charcoal/30">Chargement de l'inventaire…</p>
      </div>
    </div>
  );

  const { rooms, stats } = data;
  const today = new Date().toISOString().split("T")[0];

  const groups = [
    { key: "chambre",   items: rooms.filter(r => r.category === "chambre") },
    { key: "suite",     items: rooms.filter(r => r.category === "suite") },
    { key: "penthouse", items: rooms.filter(r => r.category === "penthouse") },
  ];

  // Activité du jour
  const arrivals   = rooms.filter(r => r.booking?.check_in  === today);
  const departures = rooms.filter(r => r.booking?.check_out === today);
  const pending    = rooms.filter(r => r.booking?.status === "pending");

  return (
    <div className="space-y-6">

      {/* ── Activité du jour ── */}
      {(arrivals.length > 0 || departures.length > 0 || pending.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {arrivals.length > 0 && (
            <div className="bg-white border border-emerald-200 p-4">
              <p className="text-2xs tracking-luxury uppercase text-emerald-600 mb-3">
                Arrivées aujourd'hui · {arrivals.length}
              </p>
              {arrivals.map(r => (
                <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-xs font-light text-charcoal">
                      {r.booking!.first_name} {r.booking!.last_name}
                    </p>
                    <p className="text-2xs text-charcoal/40">Ch. {r.room_number} · {r.booking!.nights} nuit{r.booking!.nights > 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-2xs font-light text-emerald-600">→ Check-in</span>
                </div>
              ))}
            </div>
          )}

          {departures.length > 0 && (
            <div className="bg-white border border-rose-200 p-4">
              <p className="text-2xs tracking-luxury uppercase text-rose-600 mb-3">
                Départs aujourd'hui · {departures.length}
              </p>
              {departures.map(r => (
                <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-xs font-light text-charcoal">
                      {r.booking!.first_name} {r.booking!.last_name}
                    </p>
                    <p className="text-2xs text-charcoal/40">Ch. {r.room_number}</p>
                  </div>
                  <span className="text-2xs font-light text-rose-600">← Check-out</span>
                </div>
              ))}
            </div>
          )}

          {pending.length > 0 && (
            <div className="bg-white border border-amber-200 p-4">
              <p className="text-2xs tracking-luxury uppercase text-amber-600 mb-3">
                En attente de confirmation · {pending.length}
              </p>
              {pending.map(r => (
                <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-xs font-light text-charcoal">
                      {r.booking!.first_name} {r.booking!.last_name}
                    </p>
                    <p className="text-2xs text-charcoal/40">Ch. {r.room_number} · {fmtDate(r.booking!.check_in)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onQuickConfirm(r.booking!.id)}
                      disabled={updating === r.booking!.id}
                      className="px-2 py-0.5 text-2xs bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => onQuickCancel(r.booking!.id)}
                      disabled={updating === r.booking!.id}
                      className="px-2 py-0.5 text-2xs border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Bande stats ── */}
      <div className="bg-charcoal p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-0 lg:divide-x lg:divide-white/10">
          {/* Taux + anneau */}
          <div className="flex items-center gap-5 lg:pr-8">
            <OccupancyRing rate={stats.occupancy_rate} />
            <div>
              <p className="text-2xs tracking-luxury uppercase text-ivory/35 mb-1">Taux d'occupation</p>
              <p className="font-serif text-sm font-light text-ivory">Ce jour</p>
              <p className="text-2xs text-ivory/30 font-light mt-0.5">sur {stats.total} chambres</p>
            </div>
          </div>

          {[
            { v: stats.total,           label: "Total",        sub: "chambres",         c: "text-ivory" },
            { v: stats.available,       label: "Disponibles",  sub: "libres maintenant", c: "text-emerald-400" },
            { v: stats.occupied,        label: "Occupées",     sub: "en séjour",         c: "text-rose-400" },
            { v: stats.booked,          label: "Réservées",    sub: "prochains séjours", c: "text-sky-400" },
            { v: formatPrice(stats.active_revenue ?? 0), label: "CA actif", sub: "séjours en cours", c: "text-gold" },
          ].map((s) => (
            <div key={s.label} className="lg:px-8 flex items-center gap-4 lg:gap-0 lg:flex-col lg:items-start">
              <p className={cn("font-serif text-2xl lg:text-3xl font-light leading-none", s.c)}>{s.v}</p>
              <div className="lg:mt-2">
                <p className="text-2xs tracking-luxury uppercase text-ivory/35">{s.label}</p>
                <p className="text-2xs text-ivory/25 font-light mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Légende ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-2xs tracking-luxury uppercase text-charcoal/35 mr-2">Légende</span>
        {(Object.entries(INV) as [RoomInventoryStatus, typeof INV[RoomInventoryStatus]][]).map(([, s]) => (
          <span key={s.label} className="flex items-center gap-1.5 text-2xs font-light text-charcoal/50">
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", s.dot)} />
            {s.label}
          </span>
        ))}
      </div>

      {/* ── 3 colonnes chambres ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {groups.map(({ key, items }) => {
          const meta          = CAT_META[key];
          const occupiedCount = items.filter(r => ["occupied","checkin_today","checkout_today"].includes(r.status)).length;
          const availableCount= items.filter(r => r.status === "available").length;
          const bookedCount   = items.filter(r => ["booked","arriving_soon"].includes(r.status)).length;
          const fillPct       = (occupiedCount / Math.max(items.length, 1)) * 100;
          const catRevenue    = items.reduce((s, r) => s + (r.booking?.total_price ?? 0), 0);

          return (
            <div key={key} className="bg-white border border-border overflow-hidden flex flex-col">

              {/* Header photo */}
              <div className="relative h-32 overflow-hidden">
                <img src={meta.cover} alt={meta.label} className="w-full h-full object-cover brightness-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" />
                <div className="absolute inset-0 flex items-end justify-between p-4">
                  <div>
                    <p className="font-serif text-lg font-light text-ivory leading-tight">{meta.label}</p>
                    <p className="text-2xs text-ivory/40 font-light">{meta.sub}</p>
                    {catRevenue > 0 && (
                      <p className="text-2xs text-gold font-light mt-1">{formatPrice(catRevenue)} · CA actif</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-2xl font-light text-gold leading-none">
                      {occupiedCount}<span className="text-sm text-ivory/40">/{items.length}</span>
                    </p>
                    <p className="text-2xs text-ivory/35 font-light mt-0.5">occupée{occupiedCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>

              {/* Barre d'occupation */}
              <div className="h-1 bg-border flex">
                <div className="h-full bg-rose-400 transition-all duration-700" style={{ width: `${fillPct}%` }} />
                <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${(availableCount / Math.max(items.length,1)) * 100}%` }} />
                <div className="h-full bg-sky-400 transition-all duration-700" style={{ width: `${(bookedCount / Math.max(items.length,1)) * 100}%` }} />
              </div>

              {/* Pills rapides */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-ivory/40">
                <span className="flex items-center gap-1 text-2xs font-light text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {availableCount} libre{availableCount !== 1 ? "s" : ""}
                </span>
                {occupiedCount > 0 && (
                  <span className="flex items-center gap-1 text-2xs font-light text-rose-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                    {occupiedCount} occupée{occupiedCount !== 1 ? "s" : ""}
                  </span>
                )}
                {bookedCount > 0 && (
                  <span className="flex items-center gap-1 text-2xs font-light text-sky-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
                    {bookedCount} réservée{bookedCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Prévision 7 jours */}
              <WeekForecast rooms={items} />

              {/* Liste des chambres */}
              <div className="flex-1 divide-y divide-border/60">
                {items.map((room, i) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    i={i}
                    onConfirm={onQuickConfirm}
                    onCancel={onQuickCancel}
                    updating={updating}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdminPage() {
  const [authenticated, setAuthenticated] = useState(() => !!sessionStorage.getItem(ADMIN_TOKEN_KEY));
  const [tab, setTab] = useState<"bookings" | "contacts" | "orders" | "inventory" | "stats">("bookings");
  const [bookings,  setBookings]  = useState<AdminBooking[]>([]);
  const [contacts,  setContacts]  = useState<AdminContact[]>([]);
  const [orders,    setOrders]    = useState<AdminOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [copiedContactId, setCopiedContactId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [nextBookings, nextContacts, nextOrders, nextInventory] = await Promise.all([
        fetchAdminBookings(),
        fetchAdminContacts(),
        fetchAdminOrders(),
        fetchInventory(),
      ]);
      setBookings(nextBookings);
      setContacts(nextContacts);
      setOrders(nextOrders);
      setInventory(nextInventory);
    } catch (e) {
      console.error("Erreur chargement admin:", e);
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    if (authenticated) {
      queueMicrotask(() => { void load(); });
    }
  }, [authenticated]);

  // Auto-refresh toutes les 12 secondes quand sur Commandes ou Réservations
  useEffect(() => {
    if (!authenticated) return;
    if (tab !== "orders" && tab !== "bookings") return;
    const interval = setInterval(() => { void load(); }, 12000);
    return () => clearInterval(interval);
  }, [authenticated, tab]);


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

  const handleOrderStatus = async (id: number, status: OrderStatus) => {
    setUpdating(id);
    try {
      await updateOrderStatus(id, status);
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, status } : order))
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
  const activeOrders    = orders.filter((o) => o.status !== "cancelled" && o.status !== "delivered");

  const stats = {
    total:     visibleBookings.length,
    pending:   visibleBookings.filter((b) => b.status === "pending").length,
    confirmed: visibleBookings.filter((b) => b.status === "confirmed").length,
    revenue:   visibleBookings.reduce((sum, b) => sum + Number(b.total_price), 0),
    ordersActive: activeOrders.length,
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          {[
            { label: "Réservations",       value: stats.total,                   icon: Calendar,     color: "text-charcoal" },
            { label: "En attente",          value: stats.pending,                 icon: Clock,        color: "text-amber-600" },
            { label: "Confirmées",          value: stats.confirmed,               icon: CheckCircle,  color: "text-emerald-600" },
            { label: "Commandes actives",   value: stats.ordersActive,            icon: ShoppingBag,  color: "text-blue-600" },
            { label: "Chiffre d'affaires",  value: formatPrice(stats.revenue),    icon: Euro,         color: "text-gold" },
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
          {([
            ["bookings",  `Réservations (${visibleBookings.length})`],
            ["orders",    `Commandes (${orders.length})`],
            ["inventory", "Inventaire"],
            ["contacts",  `Messages (${contacts.length})`],
            ["stats",     "Statistiques"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "relative px-6 py-3 text-sm font-light transition-colors duration-200",
                tab === id ? "text-charcoal" : "text-charcoal/40 hover:text-charcoal"
              )}
            >
              {label}
              {tab === id && <motion.div layoutId="admin-tab" className="absolute bottom-0 left-0 right-0 h-px bg-charcoal" />}
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

          {tab === "inventory" && (
            <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InventoryTab
                data={inventory}
                onQuickConfirm={async (bookingId) => {
                  setUpdating(bookingId);
                  try {
                    await updateBookingStatus(bookingId, "confirmed");
                    await load();
                  } catch (e) { console.error(e); }
                  finally { setUpdating(null); }
                }}
                onQuickCancel={async (bookingId) => {
                  setUpdating(bookingId);
                  try {
                    await updateBookingStatus(bookingId, "cancelled");
                    await load();
                  } catch (e) { console.error(e); }
                  finally { setUpdating(null); }
                }}
                updating={updating}
              />
            </motion.div>
          )}

          {tab === "orders" && (
            <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {orders.length === 0 ? (
                <div className="text-center py-20">
                  <p className="font-serif text-2xl font-light text-charcoal/30">Aucune commande</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      layout
                      className="bg-white border border-border p-5 lg:p-6 hover:border-charcoal/20 transition-colors duration-200"
                    >
                      {/* Header */}
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 lg:gap-6">
                          {/* Client */}
                          <div>
                            <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-1">Client</p>
                            <p className="font-serif text-base font-light text-charcoal">
                              {order.first_name} {order.last_name}
                            </p>
                            <p className="text-xs text-charcoal/40 font-light">{order.email}</p>
                          </div>
                          {/* Chambre */}
                          <div>
                            <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-1">Chambre</p>
                            <p className="font-serif text-lg font-light text-charcoal">{order.room_number}</p>
                          </div>
                          {/* Date */}
                          <div>
                            <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-1">Passée le</p>
                            <p className="text-sm font-light text-charcoal">
                              {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                            </p>
                            <p className="text-xs text-charcoal/40 font-light">
                              {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          {/* Total */}
                          <div>
                            <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-1">Total</p>
                            <p className="font-serif text-lg font-light text-gold">{formatPrice(Number(order.total_price))}</p>
                          </div>
                        </div>

                        {/* Statut + actions */}
                        <div className="flex flex-col items-start lg:items-end gap-3 flex-shrink-0">
                          <OrderStatusBadge status={order.status} />
                          <div className="flex gap-2 flex-wrap">
                            {order.status === "pending" && (
                              <button
                                onClick={() => handleOrderStatus(order.id, "preparing")}
                                disabled={updating === order.id}
                                className="px-3 py-1.5 text-2xs font-light tracking-wide bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                {updating === order.id ? "..." : "En préparation"}
                              </button>
                            )}
                            {order.status === "preparing" && (
                              <button
                                onClick={() => handleOrderStatus(order.id, "delivered")}
                                disabled={updating === order.id}
                                className="px-3 py-1.5 text-2xs font-light tracking-wide bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                              >
                                {updating === order.id ? "..." : "Marquer livré"}
                              </button>
                            )}
                            {(order.status === "pending" || order.status === "preparing") && (
                              <button
                                onClick={() => handleOrderStatus(order.id, "cancelled")}
                                disabled={updating === order.id}
                                className="px-3 py-1.5 text-2xs font-light tracking-wide border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                Annuler
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Items détail */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex flex-wrap gap-3">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs font-light text-charcoal/60">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-6 h-6 object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                              <span className="text-charcoal">{item.name}</span>
                              <span className="text-charcoal/40">×{item.quantity}</span>
                              <span className="text-charcoal/40">—</span>
                              <span>{formatPrice(item.unit_price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        {order.notes && (
                          <p className="mt-3 text-xs font-light text-charcoal/50 italic border-t border-border pt-2">
                            Note : {order.notes}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "stats" && (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StatsTab />
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
