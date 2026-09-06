import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Public chrome. Lives in the (public) group so /admin and /login inherit the
 * root shell (fonts, theme, tokens) without the marketing header and footer —
 * and without the Navbar's client bundle, which is the actual win here.
 */
export default function PublicLayout({ children }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
