import HeroSection from "@/components/home/HeroSection";
import ServicesBento from "@/components/home/ServicesBento";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import TechMarquee from "@/components/home/TechMarquee";
import MetricsSection from "@/components/home/MetricsSection";
import Testimonials from "@/components/home/Testimonials";
import ContactCTA from "@/components/home/ContactCTA";

export const metadata = {
  // NOTE: layout.js's `title.template` only applies to *child* route segments,
  // and app/page.js shares layout.js's segment — so the brand suffix the
  // template would otherwise add has to be spelled out here.
  title: { absolute: "Software, Data & Digital Engineering | STR Solutions Ltd." },
  description:
    "STR Solutions Ltd. is a Dhaka-based studio building enterprise-grade software, mobile, cloud, and data platforms engineered for scale.",
  alternates: { canonical: "/" },
  openGraph: {
    // A page-level `openGraph` replaces the parent's wholesale rather than
    // merging into it, so siteName/locale from layout.js are restated here.
    siteName: "STR Solutions Ltd.",
    locale: "en_US",
    title: "STR Solutions Ltd. — Digital products, engineered for scale",
    description:
      "Web applications, mobile solutions, custom software, and cloud infrastructure for teams that need production-grade systems.",
    url: "/",
    type: "website",
    images: [{ url: "/og/home.jpg", width: 1200, height: 630, alt: "STR Solutions Ltd." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "STR Solutions Ltd. — Digital products, engineered for scale",
    description:
      "Web, mobile, custom software, and cloud infrastructure, built for production.",
    images: ["/og/home.jpg"],
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesBento />
      <FeaturedProjects />
      <TechMarquee />
      <MetricsSection />
      <Testimonials />
      <ContactCTA />
    </>
  );
}
