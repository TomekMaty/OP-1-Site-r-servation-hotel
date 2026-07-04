import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { IMAGES } from "@/data/images";

const spans = ["col-span-2 row-span-2", "", "", "", ""];

export function Gallery() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-section bg-charcoal overflow-hidden">
      <div className="max-w-8xl mx-auto px-6 lg:px-12">

        <div className="text-center mb-16">
          <p className="text-2xs tracking-luxury uppercase text-gold mb-4">Galerie</p>
          <h2 className="text-display-md font-serif font-light text-ivory">
            L'atmosphère
            <br />
            <em className="italic">Maison Saclay</em>
          </h2>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-2 lg:grid-cols-4 grid-rows-2 gap-2 lg:gap-3"
          style={{ height: "clamp(340px, 50vw, 580px)" }}
        >
          {IMAGES.gallery.map((img, i) => (
            <motion.div
              key={img.alt}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`overflow-hidden ${spans[i]}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
