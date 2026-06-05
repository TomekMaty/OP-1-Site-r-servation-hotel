export const BRAND = {
  colors: {
    ivory:    { 50: "#FDFCFB", 100: "#FAF8F5", 200: "#F5F0E8", 300: "#EDE5D8", DEFAULT: "#FAF8F5" },
    charcoal: { 300: "#6B6560", 400: "#3D3830", 500: "#1A1714", DEFAULT: "#1A1714" },
    gold:     { 100: "#F0E8DA", 200: "#DFC9A8", 300: "#C4A882", 400: "#B8956A", 500: "#9E7A4F", DEFAULT: "#C4A882" },
    surface:  "#F0EBE3",
    border:   "#E8E0D5",
  },
  fonts: {
    serif:  "'Cormorant Garamond', Georgia, serif",
    sans:   "'Inter', system-ui, sans-serif",
  },
  spacing: {
    section: "7rem",
    card:    "1.5rem",
    base:    "0.5rem",
  },
  shadow: {
    card:     "0 2px 20px rgba(26,23,20,0.06)",
    cardHover:"0 8px 40px rgba(26,23,20,0.12)",
  },
  transition: {
    fast:   "150ms cubic-bezier(0.16, 1, 0.3, 1)",
    base:   "300ms cubic-bezier(0.16, 1, 0.3, 1)",
    slow:   "600ms cubic-bezier(0.16, 1, 0.3, 1)",
    luxury: "800ms cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;
