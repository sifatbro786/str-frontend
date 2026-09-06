import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import CustomCursor from "@/components/providers/CustomCursor";

/**
 * Public chrome. Lives in the (public) group so /admin and /login inherit the
 * root shell (fonts, theme, tokens) without the marketing header and footer —
 * and without the Navbar's client bundle, which is the actual win here.
 *
 * This file is also where the Phase 5 motion engine mounts. /admin and /login
 * render their own group layouts and never render this one, which is what makes
 * "zero animation in /admin" an architectural guarantee rather than a
 * convention: no GSAP module is reachable from the admin bundle at all.
 */
export default function PublicLayout({ children }) {
  return (
    <>
      {/* Fixed/absolute elements MUST sit outside #smooth-content — it carries a
          transform, which would become their containing block. Navbar is
          `fixed inset-x-0 top-0 z-50`; the skip link is `focus:fixed`. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <CustomCursor />

      <SmoothScrollProvider>
        <main id="main">{children}</main>
        <Footer />
      </SmoothScrollProvider>
    </>
  );
}
