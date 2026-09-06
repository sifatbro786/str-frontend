import HeroSection from "@/components/home/HeroSection";
import PartnersBand from "@/components/home/PartnersBand";
import ServicesBento from "@/components/home/ServicesBento";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import ProcessSection from "@/components/home/ProcessSection";
import MetricsSection from "@/components/home/MetricsSection";
import TechMarquee from "@/components/home/TechMarquee";
import Testimonials from "@/components/home/Testimonials";
import ContactCTA from "@/components/home/ContactCTA";
import { site } from "@/lib/site";

export const metadata = {
  // layout.js's `title.template` only applies to *child* route segments, and
  // app/page.js shares layout.js's segment — so the brand suffix has to be
  // spelled out here with `absolute`.
  title: { absolute: `Software, Data & Visual Production | ${site.legalName}` },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    // A page-level `openGraph` replaces the parent's wholesale rather than
    // merging, so siteName/locale from layout.js are restated.
    siteName: site.legalName,
    locale: "en_US",
    url: "/",
    type: "website",
    title: `${site.legalName} — software that survives the year after launch`,
    description: site.description,
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: site.legalName }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.legalName} — software that survives the year after launch`,
    description: site.description,
    images: ["/logo.png"],
  },
};

/**
 * Section rhythm, deliberately not "hero → 3 cards → testimonials → CTA":
 *
 *   Hero            statement + evidence above the fold
 *   Partners        proof before the pitch
 *   Services        what we do          (index 01)
 *   Work            what it produced    (index 02)
 *   Process         how it runs         (index 03)
 *   Metrics         inverted band — resets the eye mid-page
 *   Stack           low-attention texture between two dense sections
 *   Testimonials    what clients said after                 (index 04)
 *   CTA             inverted closer
 *
 * Every section owns its own <section> and border, so reordering is a matter of
 * moving one line here — no spacing lives in this file.
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PartnersBand />
      <ServicesBento />
      <FeaturedProjects />
      <ProcessSection />
      <MetricsSection />
      <TechMarquee />
      <Testimonials />
      <ContactCTA />
    </>
  );
}
