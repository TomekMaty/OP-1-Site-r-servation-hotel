import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "text-lg", md: "text-xl lg:text-2xl", lg: "text-3xl" };

export function Logo({ variant = "dark", size = "md", className }: LogoProps) {
  const isDark = variant === "dark";
  return (
    <div className={cn("flex flex-col items-start", className)}>
      <div className="flex items-center gap-2.5 mb-0.5">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
          <path
            d="M2 16V4L10 11L18 4V16"
            stroke={isDark ? "#1A1714" : "#FAF8F5"}
            strokeWidth="1"
            strokeLinecap="square"
            strokeLinejoin="miter"
            fill="none"
          />
          <line x1="2" y1="18.5" x2="18" y2="18.5" stroke="#C4A882" strokeWidth="0.8" />
        </svg>
        <span
          className={cn(
            "font-serif font-light tracking-[0.08em]",
            sizes[size],
            isDark ? "text-charcoal" : "text-ivory"
          )}
        >
          Maison Saclay
        </span>
      </div>
      <span
        className={cn(
          "text-2xs tracking-luxury uppercase font-light ml-7",
          isDark ? "text-gold" : "text-gold"
        )}
      >
        Hôtel &amp; Spa ★★★★★
      </span>
    </div>
  );
}
