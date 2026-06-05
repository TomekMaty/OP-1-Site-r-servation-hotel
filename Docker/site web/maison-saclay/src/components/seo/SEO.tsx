import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
}

const DEFAULTS = {
  title:       "Maison Saclay · Hôtel & Spa ★★★★★",
  description: "Hôtel 5 étoiles au cœur du plateau de Saclay. Chambres et suites de luxe, spa, restaurant gastronomique. À 25 minutes de Paris.",
  image:       "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=85",
  siteName:    "Maison Saclay",
};

export function SEO({ title, description = DEFAULTS.description, image = DEFAULTS.image }: SEOProps) {
  const fullTitle = title ? `${title} — ${DEFAULTS.siteName}` : DEFAULTS.title;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={image} />
      <meta property="og:site_name"   content={DEFAULTS.siteName} />
      <meta property="og:type"        content="website" />
      <meta property="og:locale"      content="fr_FR" />
      <meta name="twitter:card"       content="summary_large_image" />
      <meta name="twitter:title"      content={fullTitle} />
      <meta name="twitter:description"content={description} />
      <meta name="twitter:image"      content={image} />
      <meta name="theme-color"        content="#C4A882" />
    </Helmet>
  );
}
