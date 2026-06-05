import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export type HeroBackgroundType = "image" | "video" | "slider";

interface HeroBackgroundProps {
  type: HeroBackgroundType;
  src?: string;
  alt?: string;
  videoSrc?: string;
  videoPoster?: string;
  overlayIntensity?: "light" | "medium" | "heavy";
}

const overlayClasses = {
  light:  "from-charcoal/40 via-charcoal/10 to-transparent",
  medium: "from-charcoal/80 via-charcoal/30 to-charcoal/10",
  heavy:  "from-charcoal/90 via-charcoal/50 to-charcoal/20",
};

export function HeroBackground({
  type = "image",
  src,
  alt = "",
  videoSrc,
  videoPoster,
  overlayIntensity = "medium",
}: HeroBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);

  return (
    <motion.div ref={ref} style={{ y }} className="absolute inset-0 will-change-transform">

      {type === "image" && src && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover scale-110"
          loading="eager"
        />
      )}

      {type === "video" && videoSrc && (
        <video
          src={videoSrc}
          poster={videoPoster}
          autoPlay muted loop playsInline
          className="w-full h-full object-cover scale-110"
        />
      )}

      {type === "slider" && (
        <div className="w-full h-full bg-charcoal flex items-center justify-center">
          <span className="text-ivory/20 text-sm font-light font-sans">Slider — Phase 2</span>
        </div>
      )}

      <div className={`absolute inset-0 bg-gradient-to-t ${overlayClasses[overlayIntensity]}`} />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 via-charcoal/10 to-transparent" />
    </motion.div>
  );
}
