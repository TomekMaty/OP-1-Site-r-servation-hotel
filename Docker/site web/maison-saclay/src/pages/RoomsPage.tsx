import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SEO } from "@/components/seo/SEO";
import { PageHero } from "@/components/sections/PageHero";
import { FilterBar, type RoomFilters } from "@/components/rooms/FilterBar";
import { RoomCard } from "@/components/room/RoomCard";
import { IMAGES } from "@/data/images";
import { fetchRooms } from "@/services/api";
import type { Room } from "@/types/room";

export function RoomsPage() {
  const [filters, setFilters] = useState<RoomFilters>({
    category: "tous",
    sort: "default",
  });
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    let active = true;

    void fetchRooms().then((nextRooms) => {
      if (active) {
        setRooms(nextRooms);
      }
    }).catch((error) => {
      console.error("Erreur chargement chambres:", error);
    });

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = [...rooms];
    if (filters.category !== "tous") {
      result = result.filter((room) => room.category === filters.category);
    }
    if (filters.sort === "asc") result.sort((a, b) => a.price - b.price);
    if (filters.sort === "desc") result.sort((a, b) => b.price - a.price);
    return result;
  }, [filters, rooms]);

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

      <FilterBar filters={filters} total={filtered.length} onChange={setFilters} />

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
                  <RoomCard key={room.id} room={room} variant="catalog" index={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                <p className="font-serif text-2xl font-light text-charcoal/50">Aucun hébergement disponible</p>
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
