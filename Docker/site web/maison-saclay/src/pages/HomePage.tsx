import { SEO }          from "@/components/seo/SEO";
import { Hero }         from "@/components/sections/Hero";
import { About }        from "@/components/sections/About";
import { RoomsPreview } from "@/components/sections/RoomsPreview";
import { Services }     from "@/components/sections/Services";
import { Gallery }      from "@/components/sections/Gallery";
import { CallToAction } from "@/components/sections/CallToAction";

export function HomePage() {
  return (
    <>
      <SEO />
      <Hero />
      <About />
      <RoomsPreview />
      <Services />
      <Gallery />
      <CallToAction />
    </>
  );
}
