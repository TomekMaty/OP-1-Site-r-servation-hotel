import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, Maximize2, ArrowRight } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { Room } from "@/types/room";

export type RoomCardVariant = "preview" | "catalog" | "compact" | "admin";

interface RoomCardProps {
  room: Room;
  variant?: RoomCardVariant;
  index?: number;
  className?: string;
  onClick?: () => void;
}

const imageAspect: Record<RoomCardVariant, string> = {
  preview: "aspect-[3/4]",
  catalog: "aspect-[4/3]",
  compact: "w-24 h-24 flex-shrink-0",
  admin:   "aspect-[16/9]",
};

const categoryLabel: Record<Room["category"], string> = {
  chambre:   "Chambre",
  suite:     "Suite",
  penthouse: "Penthouse",
};

function CardBody({ room, variant }: { room: Room; variant: RoomCardVariant }) {
  return (
    <>
      <div className={cn("overflow-hidden", imageAspect[variant])}>
        <img
          src={room.images[0]}
          alt={room.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className={cn("space-y-1.5", variant !== "compact" && "mt-5", variant === "compact" && "flex-1 min-w-0")}>
        <p className="text-2xs tracking-luxury uppercase text-gold">
          {categoryLabel[room.category]}
          {variant !== "compact" && ` · ${room.surface} m²`}
        </p>

        <h3 className={cn(
          "font-serif font-light text-charcoal transition-colors duration-300 group-hover:text-gold",
          variant === "compact" ? "text-base" : "text-xl"
        )}>
          {room.name}
        </h3>

        {variant !== "compact" && (
          <p className="text-sm font-light text-charcoal/50 leading-relaxed line-clamp-2">
            {room.tagline}
          </p>
        )}

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

        {variant === "admin" && (
          <span className={cn(
            "inline-block text-2xs px-2 py-0.5 font-light tracking-wide border",
            room.available
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          )}>
            {room.available ? "Disponible" : "Indisponible"}
          </span>
        )}

        <div className={cn("flex items-center justify-between", variant !== "compact" && "pt-3")}>
          <div>
            <span className="font-serif text-lg text-charcoal font-light">{formatPrice(room.price)}</span>
            <span className="text-xs text-charcoal/40 font-light ml-1">/ nuit</span>
          </div>
          {variant !== "admin" && (
            <span className="text-xs text-charcoal/50 font-light tracking-wide group-hover:text-gold transition-colors duration-300 flex items-center gap-1">
              Découvrir <ArrowRight size={12} />
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export function RoomCard({ room, variant = "preview", index = 0, className, onClick }: RoomCardProps) {
  if (variant === "admin") {
    return (
      <div className={cn("group cursor-pointer", className)} onClick={onClick}>
        <CardBody room={room} variant={variant} />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link to={`/chambres/${room.slug}`} className={cn("group flex gap-4 items-start", className)}>
          <CardBody room={room} variant={variant} />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to={`/chambres/${room.slug}`} className={cn("group block", className)}>
        <CardBody room={room} variant={variant} />
      </Link>
    </motion.div>
  );
}
