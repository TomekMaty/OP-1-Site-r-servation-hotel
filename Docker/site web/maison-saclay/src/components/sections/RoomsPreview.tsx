import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { fetchRooms } from "@/services/api";
import { RoomCard } from "@/components/room/RoomCard";
import type { Room } from "@/types/room";

export function RoomsPreview() {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    let active = true;

    void fetchRooms().then((nextRooms) => {
      if (active) {
        setRooms(nextRooms.slice(0, 3));
      }
    }).catch((error) => {
      console.error("Erreur chargement chambres preview:", error);
    });

    return () => {
      active = false;
    };
  }, []);

  if (rooms.length === 0) {
    return null;
  }

  return (
    <section className="py-section bg-surface overflow-hidden">
      <div className="max-w-8xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
          <div>
            <p className="text-2xs tracking-luxury uppercase text-gold mb-4">Nos hébergements</p>
            <h2 className="text-display-md font-serif font-light text-charcoal leading-tight">Chambres & Suites</h2>
          </div>
          <Link
            to="/chambres"
            className="inline-flex items-center gap-2 text-sm font-light text-charcoal/60 hover:text-charcoal transition-colors duration-300 group"
          >
            Voir tous les hébergements
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.map((room, i) => (
            <RoomCard key={room.id} room={room} variant="preview" index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
