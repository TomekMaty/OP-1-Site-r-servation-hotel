import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/brand/Logo";
import { useAuth } from "@/lib/auth-context";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/chambres", label: "Chambres" },
  { href: "/spa", label: "Spa & Bien-être" },
  { href: "/restaurant", label: "Restaurant" },
  { href: "/room-service", label: "Room Service" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, isLogged } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled ? "bg-ivory/90 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"
        )}
      >
        <div className="max-w-8xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20 lg:h-24">
            <Link to="/">
              <Logo variant={scrolled ? "dark" : "light"} size="md" />
            </Link>

            <nav className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "relative text-sm font-light tracking-wide transition-colors duration-300 group",
                    scrolled ? "text-charcoal/70 hover:text-charcoal" : "text-ivory/80 hover:text-ivory",
                    location.pathname === link.href && (scrolled ? "text-charcoal" : "text-ivory")
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 h-px bg-gold transition-all duration-300",
                      location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                    )}
                  />
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-4">
              {isLogged ? (
                <Link
                  to="/mon-espace"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-light tracking-wide border transition-all duration-300",
                    scrolled ? "border-charcoal/30 text-charcoal hover:border-charcoal" : "border-ivory/30 text-ivory hover:border-ivory"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-2xs font-light",
                      scrolled ? "bg-charcoal text-ivory" : "bg-gold text-charcoal"
                    )}
                  >
                    {user?.first_name?.charAt(0).toUpperCase()}
                  </div>
                  Mon espace
                </Link>
              ) : (
                <Link
                  to="/connexion"
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-light tracking-wide transition-colors duration-300",
                    scrolled ? "text-charcoal/60 hover:text-charcoal" : "text-ivory/60 hover:text-ivory"
                  )}
                >
                  <User size={14} />
                  Connexion
                </Link>
              )}
              <Link
                to="/chambres"
                className={cn(
                  "px-6 py-2.5 text-sm font-light tracking-wide border transition-all duration-300",
                  scrolled ? "border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory" : "border-ivory/60 text-ivory hover:bg-ivory hover:text-charcoal"
                )}
              >
                Réserver
              </Link>
            </div>

            <button
              onClick={() => setMobileOpen((open) => !open)}
              className={cn("lg:hidden p-2 transition-colors duration-300", scrolled ? "text-charcoal" : "text-ivory")}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-charcoal/96 backdrop-blur-md flex flex-col items-center justify-center gap-8 lg:hidden"
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-serif text-3xl font-light text-ivory hover:text-gold transition-colors duration-300"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              <Link
                to="/chambres"
                onClick={() => setMobileOpen(false)}
                className="mt-4 px-8 py-3 border border-gold text-gold font-light tracking-wide hover:bg-gold hover:text-charcoal transition-all duration-300 inline-block"
              >
                Réserver
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
