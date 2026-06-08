export type RoomCategory = "chambre" | "suite" | "penthouse";

export interface Room {
  id: string;
  slug: string;
  name: string;
  category: RoomCategory;
  tagline: string;
  description: string;
  price: number;
  surface: number;
  maxGuests: number;
  floor: string;
  images: string[];
  amenities: string[];
  highlights: string[];
  available: boolean;
}
