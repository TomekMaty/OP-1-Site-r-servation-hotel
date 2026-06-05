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
      <div className="relative aspect-[16/9] lg:aspect-[21/9] overflow-hidden bg-charcoal-400">
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
        <div className="absolute bottom-4 right-4 bg-charcoal/60 backdrop-blur-sm px-3 py-1.5">
          <span className="text-2xs text-ivory/80 font-light tracking-wide">
            {active + 1} / {images.length}
          </span>
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 px-0">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "flex-shrink-0 w-24 h-16 lg:w-32 lg:h-20 overflow-hidden transition-all duration-300",
                active === i ? "ring-1 ring-gold opacity-100" : "opacity-50 hover:opacity-75"
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
