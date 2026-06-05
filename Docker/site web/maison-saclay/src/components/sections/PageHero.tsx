import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  label?: string;
  title: string;
  titleItalic?: string;
  subtitle?: string;
  image?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
  className?: string;
}

const heights = {
  sm: "h-[35vh] min-h-[240px]",
  md: "h-[48vh] min-h-[320px]",
  lg: "h-[60vh] min-h-[400px]",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=2000&q=85";

export function PageHero({
  label,
  title,
  titleItalic,
  subtitle,
  image = DEFAULT_IMAGE,
  size = "md",
  align = "center",
  className,
}: PageHeroProps) {
  return (
    <section className={cn("relative flex items-end overflow-hidden pt-24", heights[size], className)}>
      <div className="absolute inset-0">
        <img src={image} alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/40 to-charcoal/20" />
      </div>

      <div className={cn(
        "relative z-10 max-w-8xl mx-auto px-6 lg:px-12 pb-12 lg:pb-16 w-full",
        align === "center" && "text-center"
      )}>
        {label && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xs tracking-luxury uppercase text-gold mb-4"
          >
            {label}
          </motion.p>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-display-lg font-serif font-light text-ivory leading-tight"
        >
          {title}
          {titleItalic && (
            <> <em className="italic">{titleItalic}</em></>
          )}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "mt-4 text-base font-light text-ivory/60 leading-relaxed",
              align === "center" ? "max-w-xl mx-auto" : "max-w-lg"
            )}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
}
