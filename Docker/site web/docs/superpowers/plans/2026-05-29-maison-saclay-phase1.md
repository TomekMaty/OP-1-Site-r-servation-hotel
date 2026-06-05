# Plan Phase 1 — Maison Saclay Frontend Premium
**Date :** 2026-05-29  
**Projet :** OP-1 Hôtel 5 étoiles  
**Stack :** React + Vite + TypeScript + TailwindCSS + Framer Motion + Shadcn UI  
**Cible :** `C:\Users\bobo\Desktop\Projet Hotel 5 etoiles\`

---

## Fichiers à créer (dans l'ordre)

```
maison-saclay/
  src/
    brand/
      Logo.tsx               ← T4.1
      tokens.ts              ← T4.1
      Button.tsx             ← T4.1
    data/
      images.ts              ← T5.1
      rooms.ts
      hotel.ts
    types/
      room.ts
    lib/
      utils.ts
    styles/
      globals.css
    components/
      layout/
        Layout.tsx
        Header.tsx
        Footer.tsx
      sections/
        HeroBackground.tsx   ← T13.1
        Hero.tsx
        About.tsx
        RoomsPreview.tsx
        Services.tsx
        Gallery.tsx
        CallToAction.tsx
      room/
        RoomCard.tsx         ← T15.1
      seo/
        SEO.tsx              ← T19.1
    pages/
      HomePage.tsx
    App.tsx
    main.tsx
  tailwind.config.ts
  index.html
```

---

## Tâche 1 — Initialisation projet Vite
**Durée :** 3 min  
**Action :** Créer le projet React TypeScript avec Vite  
**Commande :**
```powershell
cd "C:\Users\bobo\Desktop\Projet Hotel 5 etoiles"
npm create vite@latest maison-saclay -- --template react-ts
cd maison-saclay
```
**Vérification :** `ls src/` → `App.tsx`, `main.tsx` présents

---

## Tâche 2 — Installation dépendances
**Durée :** 5 min  
**Action :** Installer toutes les dépendances du projet  
**Commande :**
```powershell
npm install
npm install framer-motion react-router-dom lucide-react clsx tailwind-merge date-fns react-hook-form zod @hookform/resolvers
npm install -D tailwindcss postcss autoprefixer @tailwindcss/typography
npx tailwindcss init -p
```
**Vérification :** `cat package.json` → toutes les deps présentes

---

## Tâche 3 — Configuration Shadcn UI
**Durée :** 5 min  
**Action :** Initialiser Shadcn UI avec thème Maison Saclay  
**Commande :**
```powershell
npx shadcn@latest init
```
Répondre : Style → Default, BaseColor → Neutral, CSS variables → Yes

**Vérification :** `ls src/components/ui/` → dossier créé

---

## Tâche 4 — tailwind.config.ts — Design System complet
**Fichier :** `maison-saclay/tailwind.config.ts`  
**Durée :** 8 min

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palette Maison Saclay
        ivory: {
          50:  "#FDFCFB",
          100: "#FAF8F5",
          200: "#F5F0E8",
          300: "#EDE5D8",
          DEFAULT: "#FAF8F5",
        },
        charcoal: {
          50:  "#F2F0EE",
          100: "#D9D5D0",
          200: "#A8A19A",
          300: "#6B6560",
          400: "#3D3830",
          500: "#1A1714",
          DEFAULT: "#1A1714",
        },
        gold: {
          100: "#F0E8DA",
          200: "#DFC9A8",
          300: "#C4A882",
          400: "#B8956A",
          500: "#9E7A4F",
          DEFAULT: "#C4A882",
        },
        surface: "#F0EBE3",
        border: "#E8E0D5",
      },
      fontFamily: {
        serif:  ["Cormorant Garamond", "Georgia", "serif"],
        sans:   ["Inter", "system-ui", "sans-serif"],
        display:["Cormorant Garamond", "serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
        "display-xl": ["clamp(3rem, 8vw, 6rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2rem, 5vw, 4rem)",  { lineHeight: "1.1",  letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.5rem, 3vw, 2.5rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
        "section": "7rem",
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      transitionTimingFunction: {
        "luxury": "cubic-bezier(0.25, 0.1, 0.25, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        "fade-up": "fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 1s ease forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

**Vérification :** `npx tailwindcss --help` sans erreur

---

## Tâche 4.1 — Brand Kit Maison Saclay
**Fichiers :** `src/brand/tokens.ts` · `src/brand/Logo.tsx` · `src/brand/Button.tsx`
**Durée :** 12 min

### `src/brand/tokens.ts` — Source de vérité design
```typescript
// Tokens officiels Maison Saclay — importer depuis ici, jamais hardcoder
export const BRAND = {
  colors: {
    ivory:    { 50: "#FDFCFB", 100: "#FAF8F5", 200: "#F5F0E8", 300: "#EDE5D8", DEFAULT: "#FAF8F5" },
    charcoal: { 400: "#3D3830", 500: "#1A1714", DEFAULT: "#1A1714" },
    gold:     { 100: "#F0E8DA", 200: "#DFC9A8", 300: "#C4A882", 400: "#B8956A", DEFAULT: "#C4A882" },
    surface:  "#F0EBE3",
    border:   "#E8E0D5",
  },
  fonts: {
    serif:   "'Cormorant Garamond', Georgia, serif",
    sans:    "'Inter', system-ui, sans-serif",
  },
  spacing: {
    section: "7rem",       // py-section
    card:    "1.5rem",     // padding interne card
    base:    "0.5rem",     // base unit = 8px
  },
  radius: {
    none:  "0",
    sm:    "2px",
    DEFAULT: "4px",
  },
  shadow: {
    card:    "0 2px 20px rgba(26,23,20,0.06)",
    cardHover: "0 8px 40px rgba(26,23,20,0.12)",
    hero:    "0 32px 80px rgba(26,23,20,0.2)",
  },
  transition: {
    fast:   "150ms cubic-bezier(0.16, 1, 0.3, 1)",
    base:   "300ms cubic-bezier(0.16, 1, 0.3, 1)",
    slow:   "600ms cubic-bezier(0.16, 1, 0.3, 1)",
    luxury: "800ms cubic-bezier(0.16, 1, 0.3, 1)",
  },
  typography: {
    // Règles typo Maison Saclay
    // H1 hero  : Cormorant Garamond · Light 300 · clamp(3rem→6rem) · tracking -0.02em
    // H2 section: Cormorant Garamond · Light 300 · clamp(2rem→4rem) · tracking -0.02em
    // H3 card   : Cormorant Garamond · Light 300 · 1.25rem
    // Body      : Inter · Light 300 · 1rem · leading 1.6
    // Label     : Inter · Light 300 · 0.625rem · tracking 0.15em · uppercase
    // Prix      : Cormorant Garamond · Light 300 · 1.25rem
  },
} as const;

export type BrandColor = keyof typeof BRAND.colors;
```

### `src/brand/Logo.tsx` — Logo SVG temporaire
```tsx
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "text-lg", md: "text-xl lg:text-2xl", lg: "text-3xl" };

export function Logo({ variant = "dark", size = "md", className }: LogoProps) {
  const isDark = variant === "dark";
  return (
    <div className={cn("flex flex-col items-start", className)}>
      {/* Monogramme SVG */}
      <div className="flex items-center gap-2.5 mb-0.5">
        <svg
          width="20" height="20" viewBox="0 0 20 20" fill="none"
          className="flex-shrink-0"
        >
          {/* M stylisé — lignes fines, élégant */}
          <path
            d="M2 16V4L10 11L18 4V16"
            stroke={isDark ? "#1A1714" : "#FAF8F5"}
            strokeWidth="1"
            strokeLinecap="square"
            strokeLinejoin="miter"
            fill="none"
          />
          {/* Trait horizontal décoratif doré */}
          <line x1="2" y1="18" x2="18" y2="18" stroke="#C4A882" strokeWidth="0.8" />
        </svg>
        <span
          className={cn(
            "font-serif font-light tracking-[0.08em]",
            sizes[size],
            isDark ? "text-charcoal" : "text-ivory"
          )}
        >
          Maison Saclay
        </span>
      </div>
      <span
        className={cn(
          "text-2xs tracking-luxury uppercase font-light ml-7",
          isDark ? "text-gold" : "text-gold/80"
        )}
      >
        Hôtel & Spa ★★★★★
      </span>
    </div>
  );
}
```

### `src/brand/Button.tsx` — Composant bouton officiel Maison Saclay
```tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "outline-light";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const variants: Record<Variant, string> = {
  primary:       "bg-gold text-charcoal hover:bg-gold-400 border border-gold",
  outline:       "border border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory",
  "outline-light":"border border-ivory/40 text-ivory hover:border-ivory hover:bg-ivory/10",
  ghost:         "text-charcoal/70 hover:text-charcoal",
};

const sizes: Record<Size, string> = {
  sm: "px-5 py-2 text-xs",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-4 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-light tracking-wide",
        "transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";
```

**Vérification :** Logo visible dans le Header, tokens importables sans erreur TypeScript

---

## Tâche 5 — globals.css — Fonts + CSS Variables
**Fichier :** `maison-saclay/src/styles/globals.css`  
**Durée :** 5 min

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 40 33% 97%;
    --foreground: 24 14% 9%;
    --card: 38 30% 94%;
    --card-foreground: 24 14% 9%;
    --border: 33 24% 87%;
    --input: 33 24% 87%;
    --primary: 35 38% 64%;
    --primary-foreground: 24 14% 9%;
    --muted: 35 20% 90%;
    --muted-foreground: 24 8% 45%;
    --radius: 0.5rem;
    --gold: #C4A882;
    --ivory: #FAF8F5;
    --charcoal: #1A1714;
  }

  * {
    @apply border-border;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    @apply bg-ivory text-charcoal font-sans;
    font-size: 16px;
    line-height: 1.6;
  }

  ::selection {
    background-color: #C4A882;
    color: #1A1714;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #FAF8F5; }
  ::-webkit-scrollbar-thumb { background: #C4A882; border-radius: 3px; }
}

@layer utilities {
  .text-balance { text-wrap: balance; }
  .font-light-italic { font-style: italic; font-weight: 300; }
  .tracking-luxury { letter-spacing: 0.15em; }
  .tracking-wide-xl { letter-spacing: 0.2em; }
}
```

**Vérification :** Google Fonts charge dans le navigateur, scrollbar dorée visible

---

## Tâche 5.1 — Catalogue d'images centralisé
**Fichier :** `src/data/images.ts`
**Durée :** 6 min

```typescript
// Source unique de vérité pour toutes les images du projet
// Remplacer les URLs Unsplash par les vraies photos à la phase 2

export const IMAGES = {
  hero: {
    main:    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=2400&q=90",
    mobile:  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=85",
  },
  lobby: {
    main:    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1600&q=85",
    detail:  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80",
  },
  restaurant: {
    main:    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=85",
    ambiance:"https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80",
  },
  spa: {
    main:    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=85",
    pool:    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80",
  },
  rooftop: {
    main:    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=85",
    sunset:  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80",
  },
  about: {
    interior:"https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=85",
    team:    "https://images.unsplash.com/photo-1560250097-0dc05a977f5a?w=1200&q=80",
  },
  rooms: {
    deluxe: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=85",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1600&q=85",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1600&q=85",
    ],
    suite: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=85",
      "https://images.unsplash.com/photo-1592229506151-845940174bb0?w=1600&q=85",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1600&q=85",
    ],
    penthouse: [
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1600&q=85",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1600&q=85",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1600&q=85",
    ],
  },
  gallery: [
    { src: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80", alt: "Lobby", span: "col-span-2 row-span-2" },
    { src: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80",   alt: "Suite", span: "" },
    { src: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80", alt: "Spa",   span: "" },
    { src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", alt: "Restaurant", span: "" },
    { src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80", alt: "Piscine", span: "" },
  ],
  cta: {
    main:    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=2000&q=85",
  },
} as const;
```

**Vérification :** Toutes les images de `rooms.ts` et sections importées depuis ce fichier

---

## Tâche 6 — Types TypeScript
**Fichier :** `maison-saclay/src/types/room.ts`  
**Durée :** 5 min

```typescript
export type RoomCategory = "chambre" | "suite" | "penthouse";

export interface Room {
  id: string;
  slug: string;
  name: string;
  category: RoomCategory;
  tagline: string;
  description: string;
  price: number;          // par nuit, en EUR
  surface: number;        // en m²
  maxGuests: number;
  floor: string;
  images: string[];       // URLs Unsplash
  amenities: string[];
  highlights: string[];   // 3 points forts
  available: boolean;
}

export interface BookingDraft {
  roomId: string;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number;
  firstName: string;
  lastName: string;
  email: string;
}
```

**Vérification :** `npx tsc --noEmit` sans erreur après import

---

## Tâche 7 — Mock Data — Chambres
**Fichier :** `maison-saclay/src/data/rooms.ts`  
**Durée :** 8 min

```typescript
import type { Room } from "@/types/room";

export const rooms: Room[] = [
  {
    id: "1",
    slug: "chambre-deluxe-jardin",
    name: "Chambre Déluxe Jardin",
    category: "chambre",
    tagline: "Sérénité et lumière naturelle",
    description:
      "Baignée de lumière naturelle, cette chambre ouvre sur les jardins privés de Maison Saclay. Mobilier en bois de noyer, linge de maison Rivolta Carmignani, vue apaisante sur la nature.",
    price: 380,
    surface: 38,
    maxGuests: 2,
    floor: "2ème étage",
    images: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=85",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1600&q=85",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1600&q=85",
    ],
    amenities: [
      "Lit King Size",
      "Salle de bain en marbre",
      "Douche à l'italienne",
      "Baignoire îlot",
      "Minibar premium",
      "Coffre-fort",
      "Wi-Fi haut débit",
      "Climatisation silencieuse",
      "Service en chambre 24h",
      "Vue sur jardin",
    ],
    highlights: ["Vue jardins privés", "38 m² lumineux", "Linge Rivolta Carmignani"],
    available: true,
  },
  {
    id: "2",
    slug: "suite-panoramique",
    name: "Suite Panoramique",
    category: "suite",
    tagline: "L'horizon comme tableau de chevet",
    description:
      "La Suite Panoramique offre une vue à 180° sur le plateau de Saclay et ses forêts. Salon séparé, bibliothèque privée et terrasse privative font de cet espace un refuge d'exception.",
    price: 680,
    surface: 72,
    maxGuests: 2,
    floor: "4ème étage",
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=85",
      "https://images.unsplash.com/photo-1592229506151-845940174bb0?w=1600&q=85",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1600&q=85",
    ],
    amenities: [
      "Lit King Size",
      "Salon séparé",
      "Terrasse privative",
      "Salle de bain double vasque",
      "Baignoire balnéo",
      "Bar privé",
      "Télévision 75\"",
      "Système audio Bang & Olufsen",
      "Conciergerie dédiée",
      "Petit-déjeuner inclus",
    ],
    highlights: ["Terrasse privative", "72 m² · Salon séparé", "Vue panoramique 180°"],
    available: true,
  },
  {
    id: "3",
    slug: "penthouse-saclay",
    name: "Penthouse Saclay",
    category: "penthouse",
    tagline: "Le sommet du luxe, au-dessus du plateau",
    description:
      "Unique en son genre, le Penthouse Saclay occupe l'intégralité du dernier étage. Piscine privée, toit-terrasse panoramique, cuisine équipée et service butler personnalisé.",
    price: 1800,
    surface: 210,
    maxGuests: 4,
    floor: "6ème étage — Niveau unique",
    images: [
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1600&q=85",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1600&q=85",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1600&q=85",
    ],
    amenities: [
      "2 chambres King Size",
      "Piscine privée chauffée",
      "Toit-terrasse panoramique",
      "Cuisine équipée complète",
      "Salle à manger privée",
      "Butler dédié 24h",
      "Cave à vin privée",
      "Salle de sport privée",
      "Jacuzzi extérieur",
      "Transfer aéroport inclus",
    ],
    highlights: ["210 m² · Niveau entier", "Piscine privée", "Butler dédié 24h/24"],
    available: true,
  },
];

export const getRoomBySlug = (slug: string): Room | undefined =>
  rooms.find((r) => r.slug === slug);
```

**Vérification :** Import sans erreur TypeScript

---

## Tâche 8 — Mock Data — Hotel Info
**Fichier :** `maison-saclay/src/data/hotel.ts`  
**Durée :** 3 min

```typescript
export const hotel = {
  name: "Maison Saclay",
  tagline: "Un refuge d'exception au cœur du plateau",
  description:
    "À deux pas de Paris, Maison Saclay redéfinit l'art de l'hospitalité de luxe. Nichée dans un écrin de verdure sur le plateau de Saclay, notre maison accueille chercheurs, dirigeants et voyageurs d'exception dans un cadre unique alliant modernité et élégance intemporelle.",
  address: "1 Allée du Plateau, 91400 Saclay, Île-de-France",
  phone: "+33 1 69 XX XX XX",
  email: "contact@maison-saclay.fr",
  checkIn: "15h00",
  checkOut: "12h00",
  stars: 5,
  rooms: 48,
  founded: 2018,
  awards: ["Condé Nast Traveler 2024", "Relais & Châteaux", "Forbes Travel Guide"],
  services: [
    { icon: "Utensils",    label: "Restaurant gastronomique",  description: "Table étoilée Michelin" },
    { icon: "Waves",       label: "Spa & Bien-être",           description: "1 200 m² de sérénité" },
    { icon: "Dumbbell",    label: "Fitness center",            description: "Équipements Technogym" },
    { icon: "Car",         label: "Voiturier",                 description: "Service 24h/24" },
    { icon: "Wine",        label: "Bar lounge",                description: "Cave de 800 références" },
    { icon: "Plane",       label: "Conciergerie",              description: "Transfers & excursions" },
  ],
};
```

**Vérification :** Import sans erreur TypeScript

---

## Tâche 9 — lib/utils.ts
**Fichier :** `maison-saclay/src/lib/utils.ts`  
**Durée :** 2 min

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(price);
}

export function formatSurface(m2: number): string {
  return `${m2} m²`;
}
```

**Vérification :** `npx tsc --noEmit` sans erreur

---

## Tâche 10 — Header Premium
**Fichier :** `maison-saclay/src/components/layout/Header.tsx`  
**Durée :** 12 min

```tsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/",         label: "Accueil" },
  { href: "/chambres", label: "Chambres" },
  { href: "/spa",      label: "Spa & Bien-être" },
  { href: "/restaurant", label: "Restaurant" },
  { href: "/contact",  label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-ivory/90 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-8xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20 lg:h-24">

            {/* Logo */}
            <Link to="/" className="flex flex-col items-start group">
              <span
                className={cn(
                  "font-serif text-xl lg:text-2xl font-light tracking-[0.08em] transition-colors duration-300",
                  scrolled ? "text-charcoal" : "text-ivory"
                )}
              >
                Maison Saclay
              </span>
              <span
                className={cn(
                  "text-2xs tracking-luxury uppercase transition-colors duration-300",
                  scrolled ? "text-gold" : "text-gold/80"
                )}
              >
                Hôtel & Spa ★★★★★
              </span>
            </Link>

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "relative text-sm font-light tracking-wide transition-colors duration-300 group",
                    scrolled ? "text-charcoal/70 hover:text-charcoal" : "text-ivory/80 hover:text-ivory",
                    location.pathname === link.href && (scrolled ? "text-charcoal" : "text-ivory")
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 h-px bg-gold transition-all duration-300",
                      location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                    )}
                  />
                </Link>
              ))}
            </nav>

            {/* CTA desktop */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                to="/chambres"
                className={cn(
                  "px-6 py-2.5 text-sm font-light tracking-wide border transition-all duration-300",
                  scrolled
                    ? "border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory"
                    : "border-ivory/60 text-ivory hover:bg-ivory hover:text-charcoal"
                )}
              >
                Réserver
              </Link>
            </div>

            {/* Burger mobile */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className={cn(
                "lg:hidden p-2 transition-colors duration-300",
                scrolled ? "text-charcoal" : "text-ivory"
              )}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-charcoal/95 backdrop-blur-md flex flex-col items-center justify-center gap-8 lg:hidden"
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to={link.href}
                  className="font-serif text-3xl font-light text-ivory hover:text-gold transition-colors duration-300"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Link
                to="/chambres"
                className="mt-4 px-8 py-3 border border-gold text-gold font-light tracking-wide hover:bg-gold hover:text-charcoal transition-all duration-300"
              >
                Réserver
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

**Vérification :** Header visible en haut, transparence → fond au scroll, mobile drawer fonctionnel

---

## Tâche 11 — Footer Premium
**Fichier :** `maison-saclay/src/components/layout/Footer.tsx`  
**Durée :** 8 min

```tsx
import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin } from "lucide-react";

const links = {
  hotel: [
    { label: "Notre histoire", href: "/#about" },
    { label: "Chambres & Suites", href: "/chambres" },
    { label: "Spa & Bien-être", href: "/spa" },
    { label: "Restaurant", href: "/restaurant" },
  ],
  services: [
    { label: "Conciergerie", href: "/contact" },
    { label: "Événements privés", href: "/contact" },
    { label: "Séminaires", href: "/contact" },
    { label: "Packages luxe", href: "/chambres" },
  ],
  legal: [
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "Politique de confidentialité", href: "/confidentialite" },
    { label: "CGV", href: "/cgv" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-charcoal text-ivory/70">
      <div className="max-w-8xl mx-auto px-6 lg:px-12 pt-20 pb-10">

        {/* Top */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 pb-16 border-b border-ivory/10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <p className="font-serif text-2xl font-light text-ivory tracking-[0.06em] mb-2">
              Maison Saclay
            </p>
            <p className="text-2xs tracking-luxury uppercase text-gold mb-6">
              Hôtel & Spa ★★★★★
            </p>
            <p className="text-sm font-light leading-relaxed text-ivory/50 max-w-xs">
              Un refuge d'exception au cœur du plateau de Saclay, à deux pas de Paris.
            </p>
            <div className="flex gap-4 mt-8">
              {[Instagram, Facebook, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 border border-ivory/20 flex items-center justify-center hover:border-gold hover:text-gold transition-all duration-300"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: "L'Hôtel", items: links.hotel },
            { title: "Services", items: links.services },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-2xs tracking-luxury uppercase text-gold mb-6">{col.title}</p>
              <ul className="space-y-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      className="text-sm font-light text-ivory/50 hover:text-ivory transition-colors duration-300"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <p className="text-2xs tracking-luxury uppercase text-gold mb-6">Contact</p>
            <address className="not-italic space-y-3 text-sm font-light text-ivory/50">
              <p>1 Allée du Plateau</p>
              <p>91400 Saclay, Île-de-France</p>
              <a href="tel:+33169XXXXXX" className="block hover:text-ivory transition-colors duration-300">
                +33 1 69 XX XX XX
              </a>
              <a href="mailto:contact@maison-saclay.fr" className="block hover:text-ivory transition-colors duration-300">
                contact@maison-saclay.fr
              </a>
            </address>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8">
          <p className="text-xs text-ivory/30 font-light">
            © {new Date().getFullYear()} Maison Saclay. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            {links.legal.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-xs text-ivory/30 hover:text-ivory/60 transition-colors duration-300 font-light"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
```

**Vérification :** Footer visible, fond charcoal, colonnes alignées sur desktop

---

## Tâche 12 — Layout.tsx
**Fichier :** `maison-saclay/src/components/layout/Layout.tsx`  
**Durée :** 3 min

```tsx
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
```

**Vérification :** Page entière visible avec header + contenu + footer

---

## Tâche 13 — Hero Section Cinématique
**Fichier :** `maison-saclay/src/components/sections/Hero.tsx`  
**Durée :** 15 min

```tsx
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=2400&q=90";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y   = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen min-h-[680px] flex items-end overflow-hidden">

      {/* Image parallax */}
      <motion.div style={{ y }} className="absolute inset-0 will-change-transform">
        <img
          src={HERO_IMAGE}
          alt="Maison Saclay — Vue extérieure"
          className="w-full h-full object-cover scale-110"
          loading="eager"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-charcoal/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/40 to-transparent" />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-8xl mx-auto px-6 lg:px-12 pb-20 lg:pb-28 w-full"
      >
        <div className="max-w-3xl">

          {/* Label */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xs tracking-luxury uppercase text-gold mb-6"
          >
            Saclay, Île-de-France — Hôtel ★★★★★
          </motion.p>

          {/* Titre principal */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-display-xl font-light text-ivory leading-[1.05] mb-6"
          >
            Un refuge
            <br />
            <em className="italic">d'exception</em>
          </motion.h1>

          {/* Sous-titre */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg font-light text-ivory/70 max-w-md mb-10 leading-relaxed"
          >
            À deux pas de Paris, Maison Saclay redéfinit l'art de l'hospitalité de luxe au cœur du plateau.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/chambres"
              className="inline-flex items-center justify-center px-8 py-4 bg-gold text-charcoal text-sm font-light tracking-wide hover:bg-gold-400 transition-all duration-300 group"
            >
              Découvrir nos chambres
              <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            <a
              href="#about"
              className="inline-flex items-center justify-center px-8 py-4 border border-ivory/40 text-ivory text-sm font-light tracking-wide hover:border-ivory hover:bg-ivory/10 transition-all duration-300"
            >
              Notre histoire
            </a>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-16 pt-8 border-t border-ivory/20 grid grid-cols-3 gap-8 max-w-lg"
        >
          {[
            { value: "48",    label: "Chambres & Suites" },
            { value: "2018",  label: "Fondé en" },
            { value: "★★★★★", label: "Classement" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-serif text-2xl font-light text-ivory">{stat.value}</p>
              <p className="text-2xs text-ivory/50 tracking-wide mt-1 font-light">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 right-12 z-10 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown size={18} className="text-ivory/50" />
        </motion.div>
        <span className="text-2xs tracking-luxury uppercase text-ivory/40 rotate-90 origin-center mt-4">
          Scroll
        </span>
      </motion.div>
    </section>
  );
}
```

**Vérification :** Hero plein écran, image chargée, texte animé au chargement, parallax au scroll

---

## Tâche 13.1 — HeroBackground — Architecture flexible vidéo/image/slider
**Fichier :** `src/components/sections/HeroBackground.tsx`
**Durée :** 10 min

```tsx
// Architecture pensée pour 3 modes interchangeables :
// - "image"  → hero photo plein écran (mode actuel)
// - "video"  → boucle vidéo luxe (phase 2)
// - "slider" → slideshow premium (phase 2)
// Changer le mode = changer 1 prop dans Hero.tsx, rien d'autre.

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export type HeroBackgroundType = "image" | "video" | "slider";

interface HeroBackgroundProps {
  type: HeroBackgroundType;
  // image mode
  src?: string;
  alt?: string;
  // video mode (phase 2)
  videoSrc?: string;
  videoPoster?: string;
  // slider mode (phase 2)
  slides?: Array<{ src: string; alt: string }>;
  // overlay
  overlayIntensity?: "light" | "medium" | "heavy";
}

const overlayClasses = {
  light:  "from-charcoal/40 via-charcoal/10 to-charcoal/5",
  medium: "from-charcoal/80 via-charcoal/30 to-charcoal/10",
  heavy:  "from-charcoal/90 via-charcoal/50 to-charcoal/20",
};

export function HeroBackground({
  type = "image",
  src,
  alt = "",
  videoSrc,
  videoPoster,
  overlayIntensity = "medium",
}: HeroBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <motion.div ref={ref} style={{ y }} className="absolute inset-0 will-change-transform">

      {/* MODE IMAGE */}
      {type === "image" && src && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover scale-110"
          loading="eager"
          fetchPriority="high"
        />
      )}

      {/* MODE VIDEO (phase 2 — prêt à activer) */}
      {type === "video" && videoSrc && (
        <video
          src={videoSrc}
          poster={videoPoster}
          autoPlay muted loop playsInline
          className="w-full h-full object-cover scale-110"
        />
      )}

      {/* MODE SLIDER (phase 2 — placeholder) */}
      {type === "slider" && (
        <div className="w-full h-full bg-charcoal flex items-center justify-center">
          <span className="text-ivory/30 text-sm font-light">Slider — Phase 2</span>
        </div>
      )}

      {/* Overlay gradient */}
      <div className={`absolute inset-0 bg-gradient-to-t ${overlayClasses[overlayIntensity]}`} />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal/40 to-transparent" />
    </motion.div>
  );
}
```

**Mise à jour `Hero.tsx` pour utiliser HeroBackground :**
Remplacer le bloc `<motion.div style={{ y }}>` par :
```tsx
import { HeroBackground } from "./HeroBackground";
import { IMAGES } from "@/data/images";

// Dans le JSX de Hero :
<HeroBackground
  type="image"
  src={IMAGES.hero.main}
  alt="Maison Saclay — Vue extérieure"
  overlayIntensity="medium"
/>
```

**Vérification :** Hero identique visuellement, passage à `type="video"` ou `type="slider"` sans modifier d'autre fichier

---

## Tâche 14 — Section About
**Fichier :** `maison-saclay/src/components/sections/About.tsx`  
**Durée :** 10 min

```tsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ABOUT_IMAGE =
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=85";

export function About() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" ref={ref} className="py-section bg-ivory overflow-hidden">
      <div className="max-w-8xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={ABOUT_IMAGE}
                alt="Maison Saclay — Intérieur"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            {/* Badge flottant */}
            <div className="absolute -bottom-6 -right-6 bg-charcoal p-6 hidden lg:block">
              <p className="font-serif text-3xl font-light text-ivory">48</p>
              <p className="text-2xs tracking-luxury uppercase text-gold mt-1">Chambres</p>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-2xs tracking-luxury uppercase text-gold mb-6">Notre histoire</p>
            <h2 className="font-serif text-display-md font-light text-charcoal leading-tight mb-8">
              L'art de recevoir,
              <br />
              <em className="italic">réinventé</em>
            </h2>
            <div className="space-y-5 text-charcoal/60 font-light leading-relaxed">
              <p>
                Fondée en 2018 par une famille de passionnés d'hospitalité, Maison Saclay est née d'une vision simple : offrir un havre de paix d'exception à celles et ceux qui façonnent le monde de demain.
              </p>
              <p>
                Nichée sur le plateau de Saclay, notre maison allie l'élégance intemporelle de la tradition hôtelière française à une modernité subtile et raffinée. Chaque détail a été pensé pour que votre séjour soit une expérience mémorable.
              </p>
            </div>

            {/* Awards */}
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-2xs tracking-luxury uppercase text-gold mb-6">Distinctions</p>
              <div className="flex flex-wrap gap-4">
                {["Condé Nast Traveler 2024", "Relais & Châteaux", "Forbes Travel Guide"].map((award) => (
                  <span
                    key={award}
                    className="px-4 py-2 border border-border text-xs font-light text-charcoal/70 tracking-wide"
                  >
                    {award}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

**Vérification :** Section visible au scroll, image + texte animés en entrée

---

## Tâche 15 — Section RoomsPreview (3 cards)
**Fichier :** `maison-saclay/src/components/sections/RoomsPreview.tsx`  
**Durée :** 12 min

```tsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { rooms } from "@/data/rooms";
import { formatPrice } from "@/lib/utils";

export function RoomsPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-section bg-surface overflow-hidden">
      <div className="max-w-8xl mx-auto px-6 lg:px-12">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
          <div>
            <p className="text-2xs tracking-luxury uppercase text-gold mb-4">Nos hébergements</p>
            <h2 className="font-serif text-display-md font-light text-charcoal leading-tight">
              Chambres & Suites
            </h2>
          </div>
          <Link
            to="/chambres"
            className="inline-flex items-center gap-2 text-sm font-light text-charcoal/60 hover:text-charcoal transition-colors duration-300 group"
          >
            Voir tous les hébergements
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Grid */}
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to={`/chambres/${room.slug}`} className="group block">
                {/* Image */}
                <div className="aspect-[3/4] overflow-hidden mb-5">
                  <img
                    src={room.images[0]}
                    alt={room.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Info */}
                <div className="space-y-1.5">
                  <p className="text-2xs tracking-luxury uppercase text-gold">
                    {room.category === "chambre" ? "Chambre" : room.category === "suite" ? "Suite" : "Penthouse"}
                    {" · "}{room.surface} m²
                  </p>
                  <h3 className="font-serif text-xl font-light text-charcoal group-hover:text-gold transition-colors duration-300">
                    {room.name}
                  </h3>
                  <p className="text-sm font-light text-charcoal/50 leading-relaxed line-clamp-2">
                    {room.tagline}
                  </p>
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <span className="font-serif text-lg text-charcoal font-light">
                        {formatPrice(room.price)}
                      </span>
                      <span className="text-xs text-charcoal/40 font-light ml-1">/ nuit</span>
                    </div>
                    <span className="text-xs text-charcoal/50 font-light tracking-wide group-hover:text-gold transition-colors duration-300">
                      Découvrir →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Vérification :** 3 cards visibles, images chargées, animation stagger au scroll

---

## Tâche 15.1 — RoomCard — Composant réutilisable
**Fichier :** `src/components/room/RoomCard.tsx`
**Durée :** 12 min

```tsx
// RoomCard est pensé pour 4 contextes différents :
// - "preview"  → Home page (image tall + info minimaliste)
// - "catalog"  → Page /chambres (image + prix + amenities résumés)
// - "compact"  → Réservations / sidebar (format horizontal)
// - "admin"    → Dashboard admin (avec statut disponibilité)

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, Maximize2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import type { Room } from "@/types/room";

export type RoomCardVariant = "preview" | "catalog" | "compact" | "admin";

interface RoomCardProps {
  room: Room;
  variant?: RoomCardVariant;
  index?: number;          // pour le stagger animation
  className?: string;
  onClick?: () => void;
}

// Ratio image selon le contexte
const imageAspect: Record<RoomCardVariant, string> = {
  preview: "aspect-[3/4]",
  catalog: "aspect-[4/3]",
  compact: "aspect-square w-24 h-24 flex-shrink-0",
  admin:   "aspect-[16/9]",
};

const categoryLabel: Record<Room["category"], string> = {
  chambre:    "Chambre",
  suite:      "Suite",
  penthouse:  "Penthouse",
};

export function RoomCard({ room, variant = "preview", index = 0, className, onClick }: RoomCardProps) {
  const content = (
    <div
      className={cn("group", variant === "compact" && "flex gap-4 items-start", className)}
      onClick={onClick}
    >
      {/* Image */}
      <div className={cn("overflow-hidden", imageAspect[variant])}>
        <img
          src={room.images[0]}
          alt={room.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Body */}
      <div className={cn("space-y-1.5", variant !== "compact" && "mt-5", variant === "compact" && "flex-1 min-w-0")}>

        {/* Label */}
        <p className="text-2xs tracking-luxury uppercase text-gold">
          {categoryLabel[room.category]}
          {variant !== "compact" && ` · ${room.surface} m²`}
        </p>

        {/* Titre */}
        <h3 className={cn(
          "font-serif font-light text-charcoal transition-colors duration-300 group-hover:text-gold",
          variant === "compact" ? "text-base" : "text-xl"
        )}>
          {room.name}
        </h3>

        {/* Tagline — masqué en compact */}
        {variant !== "compact" && (
          <p className="text-sm font-light text-charcoal/50 leading-relaxed line-clamp-2">
            {room.tagline}
          </p>
        )}

        {/* Meta (catalog + admin) */}
        {(variant === "catalog" || variant === "admin") && (
          <div className="flex items-center gap-4 pt-1">
            <span className="flex items-center gap-1.5 text-xs text-charcoal/40 font-light">
              <Users size={12} /> {room.maxGuests} pers.
            </span>
            <span className="flex items-center gap-1.5 text-xs text-charcoal/40 font-light">
              <Maximize2 size={12} /> {room.surface} m²
            </span>
          </div>
        )}

        {/* Statut disponibilité (admin uniquement) */}
        {variant === "admin" && (
          <span className={cn(
            "inline-block text-2xs px-2 py-0.5 font-light tracking-wide",
            room.available
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          )}>
            {room.available ? "Disponible" : "Indisponible"}
          </span>
        )}

        {/* Prix + CTA */}
        <div className={cn("flex items-center justify-between", variant !== "compact" && "pt-3")}>
          <div>
            <span className="font-serif text-lg text-charcoal font-light">
              {formatPrice(room.price)}
            </span>
            <span className="text-xs text-charcoal/40 font-light ml-1">/ nuit</span>
          </div>
          {variant !== "admin" && (
            <span className="text-xs text-charcoal/50 font-light tracking-wide group-hover:text-gold transition-colors duration-300 flex items-center gap-1">
              Découvrir <ArrowRight size={12} />
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Wrap en Link sauf admin (onClick custom)
  if (variant === "admin") return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to={`/chambres/${room.slug}`}>{content}</Link>
    </motion.div>
  );
}
```

**Vérification :** `<RoomCard room={rooms[0]} variant="preview" />` render sans erreur, 4 variants visuellement distincts

---

## Tâche 16 — Section Services
**Fichier :** `maison-saclay/src/components/sections/Services.tsx`  
**Durée :** 8 min

```tsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Utensils, Waves, Dumbbell, Car, Wine, Plane } from "lucide-react";
import { hotel } from "@/data/hotel";

const iconMap: Record<string, React.ElementType> = {
  Utensils, Waves, Dumbbell, Car, Wine, Plane,
};

export function Services() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-section bg-ivory">
      <div className="max-w-8xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <p className="text-2xs tracking-luxury uppercase text-gold mb-4">Expériences</p>
          <h2 className="font-serif text-display-md font-light text-charcoal">
            Nos services
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {hotel.services.map((service, i) => {
            const Icon = iconMap[service.icon] || Utensils;
            return (
              <motion.div
                key={service.label}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="bg-ivory p-8 lg:p-10 group hover:bg-surface transition-colors duration-300"
              >
                <div className="w-10 h-10 border border-border flex items-center justify-center mb-6 group-hover:border-gold transition-colors duration-300">
                  <Icon size={16} className="text-charcoal/60 group-hover:text-gold transition-colors duration-300" />
                </div>
                <h3 className="font-serif text-lg font-light text-charcoal mb-2">{service.label}</h3>
                <p className="text-sm font-light text-charcoal/50">{service.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

**Vérification :** Grille 2/3 colonnes visible, icônes Lucide affichées, hover state fonctionnel

---

## Tâche 17 — Section Galerie
**Fichier :** `maison-saclay/src/components/sections/Gallery.tsx`  
**Durée :** 8 min

```tsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const images = [
  { src: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80", alt: "Lobby", span: "col-span-2 row-span-2" },
  { src: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80", alt: "Suite", span: "" },
  { src: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80", alt: "Spa", span: "" },
  { src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", alt: "Restaurant", span: "" },
  { src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80", alt: "Piscine", span: "" },
];

export function Gallery() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-section bg-charcoal overflow-hidden">
      <div className="max-w-8xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <p className="text-2xs tracking-luxury uppercase text-gold mb-4">Galerie</p>
          <h2 className="font-serif text-display-md font-light text-ivory">
            L'atmosphère
            <br />
            <em className="italic">Maison Saclay</em>
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 grid-rows-2 gap-3 h-[500px] lg:h-[600px]">
          {images.map((img, i) => (
            <motion.div
              key={img.alt}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`overflow-hidden ${img.span}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Vérification :** Grille asymétrique visible, images chargées

---

## Tâche 18 — CTA Final
**Fichier :** `maison-saclay/src/components/sections/CallToAction.tsx`  
**Durée :** 6 min

```tsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";

const CTA_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=2000&q=85";

export function CallToAction() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0">
        <img src={CTA_IMAGE} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-charcoal/75" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-2xl mx-auto text-center px-6"
      >
        <p className="text-2xs tracking-luxury uppercase text-gold mb-6">Réservation</p>
        <h2 className="font-serif text-display-lg font-light text-ivory mb-6 leading-tight">
          Votre prochain séjour
          <br />
          <em className="italic">commence ici</em>
        </h2>
        <p className="text-base font-light text-ivory/60 mb-10 leading-relaxed">
          Nos équipes sont disponibles 7j/7 pour vous accompagner dans la préparation d'un séjour exceptionnel.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/chambres"
            className="px-8 py-4 bg-gold text-charcoal text-sm font-light tracking-wide hover:bg-gold-400 transition-colors duration-300"
          >
            Voir les disponibilités
          </Link>
          <a
            href="tel:+33169XXXXXX"
            className="px-8 py-4 border border-ivory/40 text-ivory text-sm font-light tracking-wide hover:border-ivory hover:bg-ivory/10 transition-all duration-300"
          >
            Nous appeler
          </a>
        </div>
      </motion.div>
    </section>
  );
}
```

**Vérification :** CTA visible avec image de fond et overlay sombre

---

## Tâche 19 — HomePage Assembly
**Fichier :** `maison-saclay/src/pages/HomePage.tsx`  
**Durée :** 4 min

```tsx
import { Hero }         from "@/components/sections/Hero";
import { About }        from "@/components/sections/About";
import { RoomsPreview } from "@/components/sections/RoomsPreview";
import { Services }     from "@/components/sections/Services";
import { Gallery }      from "@/components/sections/Gallery";
import { CallToAction } from "@/components/sections/CallToAction";

export function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <RoomsPreview />
      <Services />
      <Gallery />
      <CallToAction />
    </>
  );
}
```

**Vérification :** Toutes les sections s'enchaînent visuellement

---

## Tâche 19.1 — SEO et métadonnées
**Fichiers :** `src/components/seo/SEO.tsx` · `index.html`
**Durée :** 8 min

### Installation react-helmet-async
```powershell
npm install react-helmet-async
```

### `src/components/seo/SEO.tsx`
```tsx
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
}

const SITE_NAME    = "Maison Saclay";
const DEFAULT_DESC = "Hôtel 5 étoiles au cœur du plateau de Saclay. Chambres et suites de luxe, spa, restaurant gastronomique. À 25 minutes de Paris.";
const DEFAULT_IMG  = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=85";
const SITE_URL     = "https://maison-saclay.fr";

export function SEO({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMG,
  url = SITE_URL,
  type = "website",
}: SEOProps) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} · Hôtel & Spa ★★★★★`;

  return (
    <Helmet>
      {/* Base */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type"        content={type} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={image} />
      <meta property="og:url"         content={url} />
      <meta property="og:locale"      content="fr_FR" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image} />

      {/* Thème mobile */}
      <meta name="theme-color" content="#C4A882" />
    </Helmet>
  );
}
```

### Mise à jour `index.html`
```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Favicon (temporaire — remplacer par vrai favicon en phase 2) -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

    <!-- Preconnect Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

    <!-- SEO de base (complété par react-helmet-async côté composant) -->
    <title>Maison Saclay · Hôtel & Spa ★★★★★</title>
    <meta name="description" content="Hôtel 5 étoiles au cœur du plateau de Saclay. À 25 minutes de Paris." />
    <meta name="theme-color" content="#C4A882" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Favicon SVG temporaire — `public/favicon.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#1A1714"/>
  <path d="M4 24V8L16 18L28 8V24" stroke="#C4A882" stroke-width="1.5"
        stroke-linecap="square" fill="none"/>
  <line x1="4" y1="27" x2="28" y2="27" stroke="#C4A882" stroke-width="1"/>
</svg>
```

### Wrap `HelmetProvider` dans `main.tsx`
```tsx
import { HelmetProvider } from "react-helmet-async";
// Envelopper <App /> :
<HelmetProvider>
  <App />
</HelmetProvider>
```

### Usage dans HomePage
```tsx
import { SEO } from "@/components/seo/SEO";
// En début de composant :
<SEO /> // utilise les valeurs par défaut
```

**Vérification :** `<title>` visible dans l'onglet navigateur, og:image visible via og-checker, favicon doré visible

---

## Tâche 20 — App.tsx + Router + Page transitions
**Fichier :** `maison-saclay/src/App.tsx`  
**Durée :** 6 min

```tsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Layout }   from "@/components/layout/Layout";
import { HomePage } from "@/pages/HomePage";

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route path="/"         element={<PageWrapper><HomePage /></PageWrapper>} />
          <Route path="/chambres" element={<PageWrapper><div className="pt-32 text-center font-serif text-4xl text-charcoal py-40">Chambres — Phase 2</div></PageWrapper>} />
          <Route path="/contact"  element={<PageWrapper><div className="pt-32 text-center font-serif text-4xl text-charcoal py-40">Contact — Phase 2</div></PageWrapper>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
```

**Vérification :** Navigation entre pages avec fade, pas d'erreur console

---

## Tâche 21 — main.tsx
**Fichier :** `maison-saclay/src/main.tsx`  
**Durée :** 2 min

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Vérification :** `npm run dev` → site visible sur localhost:5173

---

## Tâche 22 — vite.config.ts — alias @/
**Fichier :** `maison-saclay/vite.config.ts`  
**Durée :** 3 min

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

**Et dans `tsconfig.json` :**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**Vérification :** Plus d'erreurs d'alias, imports `@/` résolus

---

## Ordre d'exécution (plan final — 27 tâches)

```
T1    → Init Vite
T2    → npm install (+ react-helmet-async)
T3    → Shadcn init
T4    → tailwind.config.ts
T4.1  → brand/tokens.ts · Logo.tsx · Button.tsx
T5    → globals.css
T5.1  → data/images.ts
T22   → vite.config.ts (alias @/)
T6    → types/room.ts
T7    → data/rooms.ts          (utilise images.ts)
T8    → data/hotel.ts
T9    → lib/utils.ts
T10   → Header.tsx             (utilise Logo.tsx)
T11   → Footer.tsx
T12   → Layout.tsx
T13.1 → HeroBackground.tsx
T13   → Hero.tsx               (utilise HeroBackground)
T14   → About.tsx
T15.1 → room/RoomCard.tsx
T15   → RoomsPreview.tsx       (utilise RoomCard)
T16   → Services.tsx
T17   → Gallery.tsx
T18   → CallToAction.tsx
T19.1 → seo/SEO.tsx · index.html · favicon.svg
T19   → HomePage.tsx           (utilise SEO)
T20   → App.tsx
T21   → main.tsx               (HelmetProvider)
→     npm run dev ✓
```

---

## Checklist finale

**Fondations**
- [ ] `npm run dev` sans erreur console
- [ ] Alias `@/` résolu partout
- [ ] Fonts Cormorant Garamond + Inter chargées
- [ ] CSS variables actives (scrollbar dorée visible)

**Brand Kit**
- [ ] Logo SVG visible dans Header + Footer
- [ ] Tokens importables sans erreur TypeScript
- [ ] Button : 4 variants rendus sans erreur

**Images**
- [ ] Toutes les images importées depuis `data/images.ts`
- [ ] Aucune URL hardcodée dans les composants
- [ ] Aucune image 404

**Layout**
- [ ] Header transparent sur hero, fond ivory au scroll
- [ ] Navigation mobile : drawer animé
- [ ] Footer : 4 colonnes desktop, 1 colonne mobile

**Hero**
- [ ] HeroBackground : `type="image"` fonctionnel
- [ ] Parallax au scroll sans layout shift
- [ ] Animations séquentielles label → H1 → sous-titre → CTA → stats

**Sections Home**
- [ ] About : animation entrée gauche/droite
- [ ] RoomsPreview : RoomCard `variant="preview"` × 3
- [ ] Services : grille 3×2, hover icônes doré
- [ ] Gallery : grille asymétrique, 5 images
- [ ] CTA : image overlay + 2 boutons

**RoomCard réutilisable**
- [ ] `variant="preview"` : Home ✓
- [ ] `variant="catalog"` : prêt pour /chambres
- [ ] `variant="compact"` : prêt pour sidebar
- [ ] `variant="admin"`   : prêt pour dashboard

**SEO**
- [ ] `<title>` visible dans l'onglet navigateur
- [ ] `og:image` correct (via og-checker ou DevTools)
- [ ] Favicon doré visible dans l'onglet
- [ ] `HelmetProvider` wrappé dans main.tsx

**Responsive**
- [ ] Mobile 375px : tout propre
- [ ] Tablet 768px : grilles corrigées
- [ ] Desktop 1440px : max-width respecté

**Animations**
- [ ] Page transitions : fade entre routes
- [ ] Aucune animation gadget
- [ ] Performances : pas de jank visible
