import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Maximize2, Building2 } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { RoomGallery } from "@/components/room/RoomGallery";
import { RoomAmenities } from "@/components/room/RoomAmenities";
import { BookingWidget } from "@/components/room/BookingWidget";
import { RoomCard } from "@/components/room/RoomCard";
import { fetchRoomBySlug, fetchRooms } from "@/services/api";
import type { Room } from "@/types/room";

const categoryLabel: Record<string, string> = {
  chambre: "Chambre",
  suite: "Suite",
  penthouse: "Penthouse",
};

export function RoomDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [others, setOthers] = useState<Room[]>([]);

  useEffect(() => {
    let active = true;

    if (!slug) {
      return () => {
        active = false;
      };
    }

    void Promise.all([fetchRoomBySlug(slug), fetchRooms()])
      .then(([nextRoom, allRooms]) => {
        if (!active) {
          return;
        }

        setRoom(nextRoom);
        if (nextRoom) {
          setOthers(allRooms.filter((current) => current.id !== nextRoom.id).slice(0, 2));
        } else {
          setOthers([]);
        }
      })
      .catch((error) => {
        console.error("Erreur chargement chambre:", error);
        if (active) {
          setRoom(null);
          setOthers([]);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (!slug) {
    return <Navigate to="/chambres" replace />;
  }

  if (room === undefined) {
    return null;
  }

  if (!room) {
    return <Navigate to="/chambres" replace />;
  }

  return (
    <>
      <SEO title={room.name} description={room.description} image={room.images[0]} />

      <div className="pt-20 lg:pt-24 bg-charcoal">
        <RoomGallery images={room.images} name={room.name} />
      </div>

      <div className="bg-ivory">
        <div className="max-w-8xl mx-auto px-6 lg:px-12 py-12 lg:py-16">
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
            <div className="lg:col-span-2 space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-2xs tracking-luxury uppercase text-gold mb-3">
                  {categoryLabel[room.category]} · {room.floor}
                </p>
                <h1 className="text-display-md font-serif font-light text-charcoal mb-4">{room.name}</h1>
                <p className="text-base font-light text-charcoal/60 leading-relaxed max-w-2xl">{room.description}</p>

                <div className="flex flex-wrap gap-6 mt-8 pt-8 border-t border-border">
                  {[
                    { Icon: Maximize2, label: `${room.surface} m²` },
                    { Icon: Users, label: `Jusqu'à ${room.maxGuests} personnes` },
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

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
                <RoomAmenities amenities={room.amenities} highlights={room.highlights} />
              </motion.div>
            </div>

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

      {others.length > 0 && (
        <section className="py-section bg-surface">
          <div className="max-w-8xl mx-auto px-6 lg:px-12">
            <p className="text-2xs tracking-luxury uppercase text-gold mb-4">À découvrir aussi</p>
            <h2 className="text-display-md font-serif font-light text-charcoal mb-12">Autres hébergements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {others.map((current, i) => (
                <RoomCard key={current.id} room={current} variant="catalog" index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
