import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Utensils, Waves, Dumbbell, Car, Wine, Plane } from "lucide-react";
import { hotel } from "@/data/hotel";

const iconMap: Record<string, React.ElementType> = {
  Utensils, Waves, Dumbbell, Car, Wine, Plane,
};

export function Services() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-section bg-ivory">
      <div className="max-w-8xl mx-auto px-6 lg:px-12">

        <div className="text-center mb-16">
          <p className="text-2xs tracking-luxury uppercase text-gold mb-4">Expériences</p>
          <h2 className="text-display-md font-serif font-light text-charcoal">Nos services</h2>
        </div>

        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-3 border border-border">
          {hotel.services.map((service, i) => {
            const Icon = iconMap[service.icon] ?? Utensils;
            return (
              <motion.div
                key={service.label}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="p-8 lg:p-10 border-b border-r border-border last:border-r-0 group hover:bg-surface transition-colors duration-300"
              >
                <div className="w-10 h-10 border border-border flex items-center justify-center mb-6 group-hover:border-gold transition-colors duration-300">
                  <Icon size={15} className="text-charcoal/50 group-hover:text-gold transition-colors duration-300" />
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
