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
