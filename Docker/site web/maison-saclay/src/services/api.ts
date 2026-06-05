import type { Room } from "@/types/room";

const BASE = import.meta.env.VITE_API_URL ?? "/api";
const IS_DEV_MOCK = import.meta.env.DEV && !import.meta.env.VITE_API_URL;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

type ApiRoom = {
  id: number | string;
  slug: string;
  name: string;
  category: Room["category"];
  tagline?: string;
  description?: string;
  price: number;
  surface: number;
  maxGuests?: number;
  max_guests?: number;
  floor: string;
  images?: string[];
  amenities?: string[];
  highlights?: string[];
  available: boolean;
};

function getToken(): string | null {
  return localStorage.getItem("ms_token");
}

function getAdminToken(): string | null {
  return sessionStorage.getItem("ms_admin_token");
}

type AuthMode = "none" | "user" | "admin";

async function apiFetch<T>(path: string, options?: RequestInit, authMode: AuthMode = "none"): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (authMode !== "none") {
    const token = authMode === "admin" ? getAdminToken() : getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE}${path}`, { headers, ...options });
  const text = await res.text();

  let json: ApiResponse<T>;
  try {
    json = JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new Error(`Réponse API invalide (${res.status})`);
  }

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `Erreur API ${res.status}`);
  }

  return json.data;
}

function normalizeRoom(room: ApiRoom): Room {
  return {
    id: String(room.id),
    slug: room.slug,
    name: room.name,
    category: room.category,
    tagline: room.tagline ?? "",
    description: room.description ?? "",
    price: Number(room.price),
    surface: Number(room.surface),
    maxGuests: Number(room.maxGuests ?? room.max_guests ?? 1),
    floor: room.floor,
    images: Array.isArray(room.images) ? room.images : [],
    amenities: Array.isArray(room.amenities) ? room.amenities : [],
    highlights: Array.isArray(room.highlights) ? room.highlights : [],
    available: Boolean(room.available),
  };
}

export async function fetchRooms(): Promise<Room[]> {
  if (IS_DEV_MOCK) {
    const { rooms } = await import("@/data/rooms");
    return rooms;
  }

  const rooms = await apiFetch<ApiRoom[]>("/rooms");
  return rooms.map(normalizeRoom);
}

export async function fetchRoomBySlug(slug: string): Promise<Room | null> {
  if (IS_DEV_MOCK) {
    const { getRoomBySlug } = await import("@/data/rooms");
    return getRoomBySlug(slug) ?? null;
  }

  try {
    const room = await apiFetch<ApiRoom>(`/rooms/${slug}`);
    return normalizeRoom(room);
  } catch {
    return null;
  }
}

export interface BookingPayload {
  room_id: number;
  room_slug: string;
  check_in: string;
  check_out: string;
  guests: number;
}

export interface BookingResult {
  id: number;
  total_price: number;
  nights: number;
  status: "pending";
}

export async function createBooking(payload: BookingPayload): Promise<BookingResult> {
  if (IS_DEV_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { id: Math.floor(Math.random() * 9000) + 1000, total_price: 0, nights: 1, status: "pending" };
  }

  return apiFetch<BookingResult>("/bookings", { method: "POST", body: JSON.stringify(payload) }, "user");
}

export interface ContactPayload {
  phone?: string;
  subject: string;
  message: string;
}

export async function createContact(payload: ContactPayload): Promise<{ id: number }> {
  if (IS_DEV_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { id: Math.floor(Math.random() * 9000) + 1000 };
  }

  return apiFetch<{ id: number }>("/contacts", { method: "POST", body: JSON.stringify(payload) });
}

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface AdminBooking {
  id: number;
  room_name: string;
  first_name: string;
  last_name: string;
  email: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: BookingStatus;
  created_at: string;
}

export interface AdminContact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  created_at: string;
  read_at: string | null;
}

export async function fetchAdminBookings(): Promise<AdminBooking[]> {
  return apiFetch<AdminBooking[]>("/bookings", {}, "admin");
}

export async function fetchAdminContacts(): Promise<AdminContact[]> {
  return apiFetch<AdminContact[]>("/contacts", {}, "admin");
}

export async function updateBookingStatus(id: number, status: BookingStatus): Promise<void> {
  await apiFetch<void>(`/bookings/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  }, "admin");
}

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface AdminAuthResponse {
  token: string;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function apiRegister(first_name: string, last_name: string, email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ first_name, last_name, email, password }),
  });
}

export async function apiAdminLogin(password: string): Promise<AdminAuthResponse> {
  return apiFetch<AdminAuthResponse>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: "brunch" | "plat" | "boisson" | "dessert";
  image_url: string;
  available: boolean;
}

export type MenuByCategory = Record<string, MenuItem[]>;

export async function fetchMenu(): Promise<MenuByCategory> {
  return apiFetch<MenuByCategory>("/menu");
}

export interface MyBooking {
  id: number;
  room_name: string;
  room_slug: string;
  images: string[];
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: BookingStatus;
  created_at: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  category: string;
  image_url: string;
}

export interface MyOrder {
  id: number;
  room_number: string;
  status: "pending" | "preparing" | "delivered" | "cancelled";
  total_price: number;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
}

export async function fetchMyBookings(): Promise<MyBooking[]> {
  return apiFetch<MyBooking[]>("/me/bookings", {}, "user");
}

export async function fetchMyOrders(): Promise<MyOrder[]> {
  return apiFetch<MyOrder[]>("/me/orders", {}, "user");
}

export interface OrderPayload {
  room_number: string;
  booking_id?: number;
  items: { menu_item_id: number; quantity: number }[];
  notes?: string;
}

export interface OrderResult {
  id: number;
  total_price: number;
  status: "pending";
}

export async function createOrder(payload: OrderPayload): Promise<OrderResult> {
  return apiFetch<OrderResult>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  }, "user");
}
