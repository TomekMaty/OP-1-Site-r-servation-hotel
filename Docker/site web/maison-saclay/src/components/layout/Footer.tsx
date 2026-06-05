import { Link } from "react-router-dom";
import { Logo } from "@/brand/Logo";

const socialIcons = [
  {
    label: "Instagram",
    svg: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: "Facebook",
    svg: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    svg: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
];

const links = {
  hotel: [
    { label: "Notre histoire",    href: "/#about" },
    { label: "Chambres & Suites", href: "/chambres" },
    { label: "Spa & Bien-être",   href: "/spa" },
    { label: "Restaurant",        href: "/restaurant" },
  ],
  services: [
    { label: "Conciergerie",        href: "/contact" },
    { label: "Événements privés",   href: "/contact" },
    { label: "Séminaires",          href: "/contact" },
    { label: "Packages luxe",       href: "/chambres" },
  ],
  legal: [
    { label: "Mentions légales",           href: "/mentions-legales" },
    { label: "Politique de confidentialité", href: "/confidentialite" },
    { label: "CGV",                        href: "/cgv" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-charcoal text-ivory/70">
      <div className="max-w-8xl mx-auto px-6 lg:px-12 pt-20 pb-10">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 pb-16 border-b border-white/10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Logo variant="light" size="md" className="mb-6" />
            <p className="text-sm font-light leading-relaxed text-ivory/40 max-w-xs">
              Un refuge d'exception au cœur du plateau de Saclay, à deux pas de Paris.
            </p>
            <div className="flex gap-3 mt-8">
              {socialIcons.map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="w-9 h-9 border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold transition-all duration-300"
                >
                  {social.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Liens */}
          {[
            { title: "L'Hôtel",  items: links.hotel },
            { title: "Services", items: links.services },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-2xs tracking-luxury uppercase text-gold mb-6">{col.title}</p>
              <ul className="space-y-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      className="text-sm font-light text-ivory/50 hover:text-ivory transition-colors duration-300"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <p className="text-2xs tracking-luxury uppercase text-gold mb-6">Contact</p>
            <address className="not-italic space-y-3 text-sm font-light text-ivory/50">
              <p>1 Allée du Plateau</p>
              <p>91400 Saclay, Île-de-France</p>
              <a href="tel:+33169000000" className="block hover:text-ivory transition-colors duration-300">
                +33 1 69 00 00 00
              </a>
              <a href="mailto:contact@maison-saclay.fr" className="block hover:text-ivory transition-colors duration-300">
                contact@maison-saclay.fr
              </a>
            </address>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8">
          <p className="text-xs text-ivory/30 font-light">
            © {new Date().getFullYear()} Maison Saclay. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            {links.legal.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-xs text-ivory/30 hover:text-ivory/60 transition-colors duration-300 font-light"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
