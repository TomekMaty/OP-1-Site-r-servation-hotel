import { IMAGES } from "./images";
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
    images: [...IMAGES.rooms.deluxe],
    amenities: ["Lit King Size", "Salle de bain en marbre", "Douche à l'italienne", "Baignoire îlot", "Minibar premium", "Coffre-fort", "Wi-Fi haut débit", "Climatisation silencieuse", "Service en chambre 24h", "Vue sur jardin"],
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
    images: [...IMAGES.rooms.suite],
    amenities: ["Lit King Size", "Salon séparé", "Terrasse privative", "Salle de bain double vasque", "Baignoire balnéo", "Bar privé", "Télévision 75\"", "Système audio Bang & Olufsen", "Conciergerie dédiée", "Petit-déjeuner inclus"],
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
    images: [...IMAGES.rooms.penthouse],
    amenities: ["2 chambres King Size", "Piscine privée chauffée", "Toit-terrasse panoramique", "Cuisine équipée complète", "Salle à manger privée", "Butler dédié 24h", "Cave à vin privée", "Salle de sport privée", "Jacuzzi extérieur", "Transfer aéroport inclus"],
    highlights: ["210 m² · Niveau entier", "Piscine privée", "Butler dédié 24h/24"],
    available: true,
  },
];

export const getRoomBySlug = (slug: string) => rooms.find((r) => r.slug === slug);
