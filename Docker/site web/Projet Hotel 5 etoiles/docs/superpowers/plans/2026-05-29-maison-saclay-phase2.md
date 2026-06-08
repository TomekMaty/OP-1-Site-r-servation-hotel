# Plan Phase 2 — Chambres & Détail
**Date :** 2026-05-29
**Scope :** Page `/chambres` (catalogue + filtres) + Page `/chambres/:slug` (détail + galerie + widget réservation)

---

## Fichiers à créer

```
src/
  components/
    sections/
      PageHero.tsx          ← T1 — Hero mini réutilisable (toutes pages intérieures)
    rooms/
      FilterBar.tsx         ← T2 — Filtres catégorie + tri prix
    room/
      RoomGallery.tsx       ← T4 — Galerie images + thumbnails
      RoomAmenities.tsx     ← T5 — Grille équipements
      BookingWidget.tsx     ← T6 — Formulaire réservation RHF + Zod
  pages/
    RoomsPage.tsx           ← T3 — Page catalogue
    RoomDetailPage.tsx      ← T7 — Page détail
```

## Fichiers à modifier

```
src/App.tsx                 ← T8 — Ajout routes /chambres et /chambres/:slug
```

## Fichiers à NE PAS toucher

```
src/data/rooms.ts
src/data/images.ts
src/brand/
src/components/layout/
src/components/room/RoomCard.tsx
src/components/sections/ (Hero, About, etc.)
src/pages/HomePage.tsx
```

---

## Tâche 1 — PageHero (hero mini réutilisable)
**Fichier :** `src/components/sections/PageHero.tsx`
**Durée :** 8 min

```tsx
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  label?: string;
  title: string;
  titleItalic?: string;        // partie en italique du titre
  subtitle?: string;
  image?: string;
  size?: "sm" | "md" | "lg";  // hauteur du hero
  align?: "left" | "center";
  className?: string;
}

const heights = {
  sm: "h-[35vh] min-h-[240px]",
  md: "h-[48vh] min-h-[320px]",
  lg: "h-[60vh] min-h-[400px]",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=2000&q=85";

export function PageHero({
  label,
  title,
  titleItalic,
  subtitle,
  image = DEFAULT_IMAGE,
  size = "md",
  align = "center",
  className,
}: PageHeroProps) {
  return (
    <section className={cn("relative flex items-end overflow-hidden pt-24", heights[size], className)}>
      {/* Image de fond */}
      <div className="absolute inset-0">
        <img src={image} alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/40 to-charcoal/20" />
      </div>

      {/* Contenu */}
      <div
        className={cn(
          "relative z-10 max-w-8xl mx-auto px-6 lg:px-12 pb-12 lg:pb-16 w-full",
          align === "center" && "text-center"
        )}
      >
        {label && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xs tracking-luxury uppercase text-gold mb-4"
          >
            {label}
          </motion.p>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-display-lg font-serif font-light text-ivory leading-tight"
        >
          {title}
          {titleItalic && (
            <>
              {" "}
              <em className="italic">{titleItalic}</em>
            </>
          )}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "mt-4 text-base font-light text-ivory/60 leading-relaxed",
              align === "center" ? "max-w-xl mx-auto" : "max-w-lg"
            )}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
}
```

**Vérification :** Import sans erreur TS, render propre avec image de fond + gradient

---

## Tâche 2 — FilterBar
**Fichier :** `src/components/rooms/FilterBar.tsx`
**Durée :** 10 min

```tsx
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

          {/* Filtres catégorie */}
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

          {/* Droite : compteur + tri */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-charcoal/40 font-light whitespace-nowrap">
              {total} hébergement{total > 1 ? "s" : ""}
            </span>
            <select
              value={filters.sort}
              onChange={(e) => onChange({ ...filters, sort: e.target.value as SortOrder })}
              className="text-xs font-light text-charcoal/70 bg-transparent border-none outline-none cursor-pointer hover:text-charcoal transition-colors duration-200 pr-2"
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
```

**Vérification :** Pill animée au changement de filtre, compteur correct

---

## Tâche 3 — RoomsPage
**Fichier :** `src/pages/RoomsPage.tsx`
**Durée :** 12 min

```tsx
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SEO }         from "@/components/seo/SEO";
import { PageHero }    from "@/components/sections/PageHero";
import { FilterBar, type RoomFilters } from "@/components/rooms/FilterBar";
import { RoomCard }    from "@/components/room/RoomCard";
import { rooms }       from "@/data/rooms";
import { IMAGES }      from "@/data/images";

export function RoomsPage() {
  const [filters, setFilters] = useState<RoomFilters>({
    category: "tous",
    sort: "default",
  });

  const filtered = useMemo(() => {
    let result = [...rooms];

    if (filters.category !== "tous") {
      result = result.filter((r) => r.category === filters.category);
    }

    if (filters.sort === "asc")  result.sort((a, b) => a.price - b.price);
    if (filters.sort === "desc") result.sort((a, b) => b.price - a.price);

    return result;
  }, [filters]);

  return (
    <>
      <SEO
        title="Chambres & Suites"
        description="Découvrez nos chambres, suites et penthouse à Maison Saclay. De 380€ à 1 800€ la nuit."
      />

      <PageHero
        label="Nos hébergements"
        title="Chambres"
        titleItalic="& Suites"
        subtitle="48 hébergements d'exception entre le plateau de Saclay et les forêts de l'Île-de-France."
        image={IMAGES.rooftop.main}
        size="md"
      />

      <FilterBar
        filters={filters}
        total={filtered.length}
        onChange={setFilters}
      />

      <section className="py-16 lg:py-20 bg-ivory">
        <div className="max-w-8xl mx-auto px-6 lg:px-12">
          <AnimatePresence mode="wait">
            {filtered.length > 0 ? (
              <motion.div
                key={filters.category + filters.sort}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14"
              >
                {filtered.map((room, i) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    variant="catalog"
                    index={i}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24"
              >
                <p className="font-serif text-2xl font-light text-charcoal/50">
                  Aucun hébergement disponible
                </p>
                <button
                  onClick={() => setFilters({ category: "tous", sort: "default" })}
                  className="mt-6 text-sm font-light text-gold underline hover:text-gold-400 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
```

**Vérification :** Filtres fonctionnels, animation au changement, grille 3 colonnes

---

## Tâche 4 — RoomGallery
**Fichier :** `src/components/room/RoomGallery.tsx`
**Durée :** 12 min

```tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RoomGalleryProps {
  images: string[];
  name: string;
}

export function RoomGallery({ images, name }: RoomGalleryProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="w-full">
      {/* Image principale */}
      <div className="relative aspect-[16/9] lg:aspect-[21/9] overflow-hidden bg-surface">
        <AnimatePresence mode="wait">
          <motion.img
            key={active}
            src={images[active]}
            alt={`${name} — vue ${active + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            loading="eager"
          />
        </AnimatePresence>

        {/* Compteur */}
        <div className="absolute bottom-4 right-4 bg-charcoal/60 backdrop-blur-sm px-3 py-1.5">
          <span className="text-2xs text-ivory/80 font-light tracking-wide">
            {active + 1} / {images.length}
          </span>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "flex-shrink-0 w-24 h-16 lg:w-32 lg:h-20 overflow-hidden transition-all duration-300",
                active === i
                  ? "ring-1 ring-gold opacity-100"
                  : "opacity-50 hover:opacity-80"
              )}
            >
              <img
                src={src}
                alt={`${name} miniature ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Vérification :** Crossfade entre images, thumbnail active avec ring doré

---

## Tâche 5 — RoomAmenities
**Fichier :** `src/components/room/RoomAmenities.tsx`
**Durée :** 6 min

```tsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check } from "lucide-react";

interface RoomAmenitiesProps {
  amenities: string[];
  highlights: string[];
}

export function RoomAmenities({ amenities, highlights }: RoomAmenitiesProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className="space-y-10">

      {/* Points forts */}
      <div>
        <p className="text-2xs tracking-luxury uppercase text-gold mb-5">Points forts</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {highlights.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="p-5 border border-border bg-surface"
            >
              <p className="font-serif text-base font-light text-charcoal leading-snug">{item}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Équipements complets */}
      <div>
        <p className="text-2xs tracking-luxury uppercase text-gold mb-5">Équipements</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {amenities.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.04 }}
              className="flex items-center gap-3"
            >
              <div className="w-4 h-4 border border-gold/40 flex items-center justify-center flex-shrink-0">
                <Check size={9} className="text-gold" />
              </div>
              <span className="text-sm font-light text-charcoal/70">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Vérification :** 3 cards highlights + liste amenities avec icônes Check

---

## Tâche 6 — BookingWidget
**Fichier :** `src/components/room/BookingWidget.tsx`
**Durée :** 15 min

```tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { differenceInDays, format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatPrice } from "@/lib/utils";
import type { Room } from "@/types/room";

const schema = z.object({
  checkIn:   z.string().min(1, "Date d'arrivée requise"),
  checkOut:  z.string().min(1, "Date de départ requise"),
  guests:    z.coerce.number().min(1, "Au moins 1 personne"),
  firstName: z.string().min(2, "Prénom requis"),
  lastName:  z.string().min(2, "Nom requis"),
  email:     z.string().email("Email invalide"),
}).refine(
  (d) => !d.checkIn || !d.checkOut || new Date(d.checkOut) > new Date(d.checkIn),
  { message: "Le départ doit être après l'arrivée", path: ["checkOut"] }
);

type FormData = z.infer<typeof schema>;

interface BookingWidgetProps {
  room: Room;
}

const today = format(new Date(), "yyyy-MM-dd");
const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

export function BookingWidget({ room }: BookingWidgetProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { checkIn: today, checkOut: tomorrow, guests: 2 },
  });

  const checkIn  = watch("checkIn");
  const checkOut = watch("checkOut");

  const nights = checkIn && checkOut
    ? Math.max(0, differenceInDays(new Date(checkOut), new Date(checkIn)))
    : 0;

  const total = nights * room.price;

  const onSubmit = async (_data: FormData) => {
    await new Promise((r) => setTimeout(r, 800)); // simule un appel API
    setSubmitted(true);
  };

  const inputClass = (hasError: boolean) =>
    cn(
      "w-full px-4 py-3 bg-ivory border text-sm font-light text-charcoal placeholder:text-charcoal/30",
      "outline-none focus:border-gold transition-colors duration-200",
      hasError ? "border-red-300" : "border-border"
    );

  const labelClass = "block text-2xs tracking-luxury uppercase text-charcoal/50 mb-2";

  return (
    <div className="border border-border p-6 lg:p-8 bg-ivory sticky top-32">
      <AnimatePresence mode="wait">

        {/* ── État succès ── */}
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-12 h-12 border border-gold flex items-center justify-center mx-auto mb-6">
              <span className="text-gold text-xl">✓</span>
            </div>
            <h3 className="font-serif text-2xl font-light text-charcoal mb-3">
              Demande envoyée
            </h3>
            <p className="text-sm font-light text-charcoal/50 leading-relaxed">
              Notre équipe vous contactera dans les 2h pour confirmer votre réservation.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-8 text-xs font-light text-gold underline hover:text-gold-400 transition-colors"
            >
              Nouvelle demande
            </button>
          </motion.div>

        ) : (

          /* ── Formulaire ── */
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            {/* En-tête */}
            <div className="pb-5 border-b border-border">
              <p className="text-2xs tracking-luxury uppercase text-gold mb-1">À partir de</p>
              <p className="font-serif text-3xl font-light text-charcoal">
                {formatPrice(room.price)}
                <span className="text-sm text-charcoal/40 font-sans font-light ml-2">/ nuit</span>
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Arrivée</label>
                <input
                  type="date"
                  min={today}
                  {...register("checkIn")}
                  className={inputClass(!!errors.checkIn)}
                />
                {errors.checkIn && (
                  <p className="text-2xs text-red-500 mt-1">{errors.checkIn.message}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Départ</label>
                <input
                  type="date"
                  min={checkIn || tomorrow}
                  {...register("checkOut")}
                  className={inputClass(!!errors.checkOut)}
                />
                {errors.checkOut && (
                  <p className="text-2xs text-red-500 mt-1">{errors.checkOut.message}</p>
                )}
              </div>
            </div>

            {/* Voyageurs */}
            <div>
              <label className={labelClass}>Voyageurs</label>
              <select
                {...register("guests")}
                className={inputClass(!!errors.guests)}
              >
                {Array.from({ length: room.maxGuests }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "personne" : "personnes"}
                  </option>
                ))}
              </select>
            </div>

            {/* Récapitulatif nuits */}
            {nights > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-surface p-4 space-y-2"
              >
                <div className="flex justify-between text-sm font-light text-charcoal/70">
                  <span>{formatPrice(room.price)} × {nights} nuit{nights > 1 ? "s" : ""}</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm font-light text-charcoal/40 border-t border-border pt-2">
                  <span>Taxes et frais</span>
                  <span>Inclus</span>
                </div>
                <div className="flex justify-between font-serif text-lg font-light text-charcoal border-t border-border pt-2">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </motion.div>
            )}

            {/* Séparateur */}
            <div className="border-t border-border pt-4">
              <p className="text-2xs tracking-luxury uppercase text-charcoal/40 mb-4">Vos informations</p>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      placeholder="Prénom"
                      {...register("firstName")}
                      className={inputClass(!!errors.firstName)}
                    />
                    {errors.firstName && (
                      <p className="text-2xs text-red-500 mt-1">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <input
                      placeholder="Nom"
                      {...register("lastName")}
                      className={inputClass(!!errors.lastName)}
                    />
                    {errors.lastName && (
                      <p className="text-2xs text-red-500 mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    {...register("email")}
                    className={inputClass(!!errors.email)}
                  />
                  {errors.email && (
                    <p className="text-2xs text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full py-4 bg-gold text-charcoal text-sm font-light tracking-wide",
                "hover:bg-gold-400 transition-all duration-300",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? "Envoi en cours…" : "Demander à réserver"}
            </button>

            <p className="text-2xs text-charcoal/40 text-center font-light leading-relaxed">
              Aucun paiement immédiat. Notre équipe confirmera la disponibilité sous 2h.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Vérification :** Calcul nuits dynamique, validation Zod, état succès animé

---

## Tâche 7 — RoomDetailPage
**Fichier :** `src/pages/RoomDetailPage.tsx`
**Durée :** 12 min

```tsx
import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Maximize2, Building2 } from "lucide-react";
import { SEO }            from "@/components/seo/SEO";
import { RoomGallery }    from "@/components/room/RoomGallery";
import { RoomAmenities }  from "@/components/room/RoomAmenities";
import { BookingWidget }  from "@/components/room/BookingWidget";
import { RoomCard }       from "@/components/room/RoomCard";
import { getRoomBySlug, rooms } from "@/data/rooms";
import { formatPrice }    from "@/lib/utils";

const categoryLabel: Record<string, string> = {
  chambre:   "Chambre",
  suite:     "Suite",
  penthouse: "Penthouse",
};

export function RoomDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const room = getRoomBySlug(slug ?? "");

  if (!room) return <Navigate to="/chambres" replace />;

  // Autres chambres (max 2)
  const others = rooms.filter((r) => r.id !== room.id).slice(0, 2);

  return (
    <>
      <SEO
        title={room.name}
        description={room.description}
        image={room.images[0]}
      />

      {/* ── Galerie plein écran ── */}
      <div className="pt-20 lg:pt-24 bg-charcoal">
        <RoomGallery images={room.images} name={room.name} />
      </div>

      {/* ── Contenu principal ── */}
      <div className="bg-ivory">
        <div className="max-w-8xl mx-auto px-6 lg:px-12 py-12 lg:py-16">

          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <Link
              to="/chambres"
              className="inline-flex items-center gap-2 text-xs font-light text-charcoal/50 hover:text-charcoal transition-colors duration-200 group"
            >
              <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-1" />
              Toutes les chambres
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">

            {/* ── Colonne gauche (2/3) ── */}
            <div className="lg:col-span-2 space-y-12">

              {/* Header chambre */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-2xs tracking-luxury uppercase text-gold mb-3">
                  {categoryLabel[room.category]} · {room.floor}
                </p>
                <h1 className="text-display-md font-serif font-light text-charcoal mb-4">
                  {room.name}
                </h1>
                <p className="text-base font-light text-charcoal/60 leading-relaxed max-w-2xl">
                  {room.description}
                </p>

                {/* Meta infos */}
                <div className="flex flex-wrap gap-6 mt-8 pt-8 border-t border-border">
                  {[
                    { Icon: Maximize2, label: `${room.surface} m²` },
                    { Icon: Users,     label: `Jusqu'à ${room.maxGuests} personnes` },
                    { Icon: Building2, label: room.floor },
                  ].map(({ Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 border border-border flex items-center justify-center">
                        <Icon size={13} className="text-gold" />
                      </div>
                      <span className="text-sm font-light text-charcoal/70">{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Équipements */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <RoomAmenities
                  amenities={room.amenities}
                  highlights={room.highlights}
                />
              </motion.div>
            </div>

            {/* ── Colonne droite — Widget (1/3) ── */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <BookingWidget room={room} />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Autres chambres ── */}
      {others.length > 0 && (
        <section className="py-section bg-surface">
          <div className="max-w-8xl mx-auto px-6 lg:px-12">
            <p className="text-2xs tracking-luxury uppercase text-gold mb-4">À découvrir aussi</p>
            <h2 className="text-display-md font-serif font-light text-charcoal mb-12">
              Autres hébergements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {others.map((r, i) => (
                <RoomCard key={r.id} room={r} variant="catalog" index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
```

**Vérification :** Redirect si slug invalide, galerie + widget + amenities visibles, 2 autres chambres en bas

---

## Tâche 8 — Mise à jour App.tsx
**Fichier :** `src/App.tsx`
**Action :** Remplacer les routes `/chambres` et ajouter `/chambres/:slug`
**Durée :** 4 min

```tsx
// Importer les nouvelles pages en haut de App.tsx :
import { RoomsPage }      from "@/pages/RoomsPage";
import { RoomDetailPage } from "@/pages/RoomDetailPage";

// Remplacer les routes dans AnimatedRoutes :
<Route path="/chambres" element={
  <PageWrapper><RoomsPage /></PageWrapper>
} />
<Route path="/chambres/:slug" element={
  <PageWrapper><RoomDetailPage /></PageWrapper>
} />
```

**Vérification :** Navigation `/chambres` → liste, clic card → `/chambres/suite-panoramique` → détail

---

## Ordre d'exécution

```
T1 → PageHero.tsx
T2 → FilterBar.tsx           (+ créer src/components/rooms/)
T3 → RoomsPage.tsx
T4 → RoomGallery.tsx
T5 → RoomAmenities.tsx
T6 → BookingWidget.tsx
T7 → RoomDetailPage.tsx
T8 → App.tsx (routes)
→  npm run build ✓
```

---

## Checklist finale Phase 2

**Page /chambres**
- [ ] PageHero avec image de fond + gradient
- [ ] FilterBar sticky sous le header
- [ ] Pill animée sur filtre actif
- [ ] Filtrage fonctionnel par catégorie
- [ ] Tri par prix (asc/desc)
- [ ] Compteur mis à jour
- [ ] État vide si 0 résultats
- [ ] RoomCard variant "catalog" : image + meta (m², guests)

**Page /chambres/:slug**
- [ ] Redirect si slug inexistant
- [ ] Galerie : crossfade + thumbnails + compteur
- [ ] Breadcrumb retour ← chambres
- [ ] Header : nom, catégorie, description, meta infos
- [ ] RoomAmenities : 3 highlights + grille équipements
- [ ] BookingWidget : calcul nuits dynamique
- [ ] BookingWidget : validation Zod (dates, email, prénom/nom)
- [ ] BookingWidget : état succès animé
- [ ] Widget sticky desktop
- [ ] 2 autres chambres en bas de page

**Global**
- [ ] npm run build sans erreur
- [ ] Page transitions fade entre routes
- [ ] Mobile 375px propre (widget en bas de page)
- [ ] SEO title/description par page
