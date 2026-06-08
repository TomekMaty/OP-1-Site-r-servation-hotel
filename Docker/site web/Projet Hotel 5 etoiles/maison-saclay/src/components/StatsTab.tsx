import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { fetchAdminStats, type AdminStats } from "@/services/api";
import { cn, formatPrice } from "@/lib/utils";

const GOLD     = "#C4A882";
const CHARCOAL = "#1A1714";
const IVORY    = "#FAF8F5";
const BORDER   = "#E8E0D5";

const CAT_COLORS: Record<string, string> = {
  chambre:   "#C4A882",
  suite:     "#1A1714",
  penthouse: "#8B7355",
};

const STATUS_CONFIG = [
  { key: "confirmed", label: "Confirmées", color: "#059669" },
  { key: "pending",   label: "En attente", color: "#D97706" },
  { key: "cancelled", label: "Annulées",   color: "#DC2626" },
];

function CustomBarTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: CHARCOAL, color: IVORY, padding: "10px 14px", fontSize: 11, fontFamily: "inherit" }}>
      <p style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: GOLD }}>
          {p.name === "revenue" ? formatPrice(p.value) : `${p.value} rés.`}
        </p>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: CHARCOAL, color: IVORY, padding: "8px 12px", fontSize: 11, fontFamily: "inherit" }}>
      <p style={{ color: GOLD }}>{payload[0].name} : {payload[0].value}</p>
    </div>
  );
}

export function StatsTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-charcoal/30 font-light">
        Impossible de charger les statistiques
      </div>
    );
  }

  const { booking_stats, order_stats, today, revenue_by_month, by_category } = stats;

  const pieStatusData = STATUS_CONFIG
    .map((s) => ({
      name:  s.label,
      value: booking_stats[s.key as keyof typeof booking_stats] as number,
      color: s.color,
    }))
    .filter((d) => d.value > 0);

  const avgRevenue =
    booking_stats.confirmed + booking_stats.pending > 0
      ? booking_stats.revenue / (booking_stats.confirmed + booking_stats.pending)
      : 0;

  const confirmationRate =
    booking_stats.total > 0
      ? Math.round((booking_stats.confirmed / booking_stats.total) * 100)
      : 0;

  const maxRevenue = Math.max(...by_category.map((c) => c.revenue), 1);

  return (
    <div className="space-y-8">

      {/* ── Activité du jour ─────────────────────────────────── */}
      <div className="bg-charcoal p-6">
        <p className="text-2xs tracking-luxury uppercase text-ivory/35 mb-5">Activité du jour</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 lg:gap-0 lg:divide-x lg:divide-white/10">
          {[
            { label: "Arrivées",        value: today.checkins,             suffix: "check-in" },
            { label: "Départs",         value: today.checkouts,            suffix: "check-out" },
            { label: "Commandes RS",    value: today.orders,               suffix: "aujourd'hui" },
            { label: "CA Room Service", value: formatPrice(today.room_service_revenue), suffix: "ce jour" },
          ].map(({ label, value, suffix }) => (
            <div key={label} className="lg:px-8">
              <p className="text-2xs tracking-luxury uppercase text-ivory/35 mb-2">{label}</p>
              <p className="font-serif text-3xl font-light text-ivory leading-none">{value}</p>
              <p className="text-2xs text-ivory/25 mt-1.5 font-light">{suffix}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Chiffre d'affaires",
            value: formatPrice(booking_stats.revenue + order_stats.revenue),
            sub:   "Réservations + Room Service",
            color: "text-gold",
          },
          {
            label: "Panier moyen",
            value: formatPrice(avgRevenue),
            sub:   `sur ${booking_stats.total} réservations`,
            color: "text-charcoal",
          },
          {
            label: "Taux de confirmation",
            value: `${confirmationRate}%`,
            sub:   `${booking_stats.confirmed} confirmées`,
            color: "text-emerald-600",
          },
          {
            label: "CA Room Service",
            value: formatPrice(order_stats.revenue),
            sub:   `${order_stats.delivered} livraisons`,
            color: "text-blue-600",
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white border border-border p-6">
            <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-3">{label}</p>
            <p className={cn("font-serif text-2xl font-light", color)}>{value}</p>
            <p className="text-xs font-light text-charcoal/35 mt-1.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar chart — revenus par mois */}
        <div className="lg:col-span-2 bg-white border border-border p-6">
          <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-1">Revenus par mois</p>
          <p className="font-serif text-xl font-light text-charcoal mb-6">6 derniers mois</p>

          {revenue_by_month.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-charcoal/20 font-light text-sm">
              Aucune réservation sur cette période
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={revenue_by_month}
                margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#9E9890", fontFamily: "inherit" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9E9890", fontFamily: "inherit" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}€`}
                  width={50}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: IVORY }} />
                <Bar dataKey="revenue" name="revenue" fill={GOLD} radius={[2, 2, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart — statuts réservations */}
        <div className="bg-white border border-border p-6">
          <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-1">Réservations</p>
          <p className="font-serif text-xl font-light text-charcoal mb-6">Par statut</p>

          {pieStatusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-charcoal/20 font-light text-sm">
              Aucune réservation
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2 w-full mt-1">
                {pieStatusData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: d.color }}
                      />
                      <span className="text-xs font-light text-charcoal/60">{d.name}</span>
                    </div>
                    <span className="font-serif text-sm font-light text-charcoal">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Performance par type de chambre ──────────────────── */}
      {by_category.length > 0 && (
        <div className="bg-white border border-border p-6">
          <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-1">Performance</p>
          <p className="font-serif text-xl font-light text-charcoal mb-6">Par type de chambre</p>

          <div className="space-y-5">
            {by_category.map((cat) => {
              const pct = (cat.revenue / maxRevenue) * 100;
              const color = CAT_COLORS[cat.category] ?? GOLD;
              return (
                <div key={cat.room_name} className="grid grid-cols-[160px_1fr_100px] items-center gap-6">
                  <div>
                    <p className="text-sm font-light text-charcoal">{cat.room_name}</p>
                    <p className="text-xs text-charcoal/40 font-light mt-0.5">
                      {cat.bookings} rés.
                    </p>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <p className="text-right font-serif text-sm font-light text-charcoal">
                    {formatPrice(cat.revenue)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Commandes Room Service ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          {
            label: "Total commandes",
            value: order_stats.total,
            sub:   "depuis l'ouverture",
            color: "text-charcoal",
          },
          {
            label: "Commandes livrées",
            value: order_stats.delivered,
            sub:   `${order_stats.total > 0 ? Math.round((order_stats.delivered / order_stats.total) * 100) : 0}% taux de livraison`,
            color: "text-emerald-600",
          },
          {
            label: "Commandes en cours",
            value: order_stats.active,
            sub:   "en attente ou en préparation",
            color: order_stats.active > 0 ? "text-amber-600" : "text-charcoal/30",
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white border border-border p-6">
            <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-3">{label}</p>
            <p className={cn("font-serif text-3xl font-light", color)}>{value}</p>
            <p className="text-xs font-light text-charcoal/35 mt-1.5">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
