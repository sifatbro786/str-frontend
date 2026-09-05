import { JetBrains_Mono } from "next/font/google";
import ThemeProvider from "@/components/theme-provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { site } from "@/lib/site";
import "./globals.css";

/* General Sans is loaded from Fontshare inside globals.css (see the note there).
   Only the mono face — used for indices, labels and metadata — goes through
   next/font, where the self-host + preload actually pays for itself. */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-face",
  weight: ["400", "500"],
});

export const metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.legalName} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: site.keywords,
  authors: [{ name: site.legalName, url: site.url }],
  openGraph: {
    type: "website",
    siteName: site.legalName,
    locale: "en_US",
    url: site.url,
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/strshort.png", apple: "/strshort.png" },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ee" },
    { media: "(prefers-color-scheme: dark)", color: "#09090a" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={mono.variable}>
      <head>
        {/* Fontshare is a third-party origin; warming the connection saves a
            full DNS+TLS round trip before the font CSS can even be requested. */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-dvh antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
          >
            Skip to content
          </a>
          <Navbar />
          <main id="main">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
