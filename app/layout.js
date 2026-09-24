import { JetBrains_Mono } from "next/font/google";
import ThemeProvider from "@/components/theme-provider";
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
    /* ⚑ No `icons` key. app/favicon.ico, app/icon.png and app/apple-icon.png
       are App Router file conventions: Next emits <link rel="icon"> for each
       one WITH its type and sizes, and serves /favicon.ico from the route
       root. The old hand-written entry pointed at /strshort.png only, so
       /favicon.ico — which every browser, crawler and feed reader requests
       before it has parsed a single tag — 404'd into the not-found page, and
       the one tag that did exist declared no type and no sizes. Audit tools
       report that as "favicon may not resolve reliably"; it is the same fact.

       Setting `icons` here again would OVERRIDE the file convention, so if a
       manifest icon is ever needed, add it to the files, not to this object. */
    robots: { index: true, follow: true },
};

export const viewport = {
    themeColor: [
        /* Keep in step with --color-stock-50. Mobile Safari and Chrome paint
           the address bar with this, and a #ffffff bar above warm stock is a
           visible seam at the top of every page. */
        { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
        { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
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
                {/* General Sans. Here rather than as an @import in globals.css so the
                    browser finds it in the first HTML chunk and fetches it alongside
                    the app CSS instead of after it — see the note in globals.css.
                    display=swap is in the URL, so text paints in the fallback face
                    immediately and never blocks on the font itself. */}
                <link
                    rel="stylesheet"
                    href="https://api.fontshare.com/v2/css?f%5B%5D=general-sans@400,500,600,700&display=swap"
                />
            </head>
            <body className="min-h-dvh antialiased" suppressHydrationWarning>
                {/* Public chrome (skip link, Navbar, <main>, Footer) lives in
            app/(public)/layout.js so /admin and /login inherit this shell —
            fonts, theme, tokens — without the marketing header and its
            client bundle. */}
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}
