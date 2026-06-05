import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { RoomCategory } from "@/types/room";

export type SortOrder = "default" | "asc" | "desc";

export interface RoomFilters {
  category: RoomCategory | "tous";
  sort: SortOrder;
}

interface FilterBarProps {
  filters: RoomFilters;
  total: number;
  onChange: (filters: RoomFilters) => void;
}

const categories: Array<{ value: RoomFilters["category"]; label: string }> = [
  { value: "tous",      label: "Tous" },
  { value: "chambre",   label: "Chambres" },
  { value: "suite",     label: "Suites" },
  { value: "penthouse", label: "Penthouse" },
];

const sorts: Array<{ value: SortOrder; label: string }> = [
  { value: "default", label: "Recommandés" },
  { value: "asc",     label: "Prix croissant" },
  { value: "desc",    label: "Prix décroissant" },
];

export function FilterBar({ filters, total, onChange }: FilterBarProps) {
  return (
    <div className="bg-ivory border-b border-border sticky top-20 lg:top-24 z-30">
      <div className="max-w-8xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => {
              const active = filters.category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => onChange({ ...filters, category: cat.value })}
                  className={cn(
                    "relative px-4 py-2 text-xs font-light tracking-wide whitespace-nowrap transition-colors duration-200",
                    active ? "text-charcoal" : "text-charcoal/50 hover:text-charcoal"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="filter-pill"
                      className="absolute inset-0 bg-charcoal/8 border border-border"
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                  <span className="relative">{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-charcoal/40 font-light whitespace-nowrap">
              {total} hébergement{total > 1 ? "s" : ""}
            </span>
            <select
              value={filters.sort}
              onChange={(e) => onChange({ ...filters, sort: e.target.value as SortOrder })}
              className="text-xs font-light text-charcoal/70 bg-transparent border-none outline-none cursor-pointer hover:text-charcoal transition-colors duration-200"
            >
              {sorts.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
