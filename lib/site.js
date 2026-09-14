/**
 * lib/site.js — single source of truth for anything that is *about the company*
 * rather than *about its content*. Content (services, projects, blogs, team,
 * testimonials) comes from the API through lib/api.js;
 * this file never does.
 *
 * Nothing here is fetched. If a value changes, it changes in exactly one place.
 *
 * Contact details, socials and the founding year were recovered from the legacy
 * STR project (Footer.tsx and src/data/infoPageData.ts) and are real. The
 * remaining ⚑ marks the street address, which the legacy site never published —
 * it showed "Dhaka, Bangladesh" and nothing more.
 */

export const site = {
    name: "STR Solutions",
    legalName: "STR Solutions Ltd.",
    shortName: "STR",
    tagline: "Software, Data & Digital Engineering",
    url: "https://strsltd.com",
    foundedYear: 2024,
    description:
        "STR Solutions Ltd. is a Dhaka-based engineering studio building web platforms, custom software, mobile products, and production-grade visual work for teams that need systems to hold up after launch.",
    keywords: [
        "STR Solutions",
        "software development Bangladesh",
        "web development Dhaka",
        "custom software",
        "UI UX design agency",
        "3D floor plan design",
        "photo post production",
    ],

    /* Brand tokens duplicated here ONLY for JS consumers (JSON-LD, OG image
     generation, chart colours). CSS reads them from globals.css. */
    brand: {
        blue: "#1476BE",
        orange: "#EF5A28",
        green: "#57B04A",
        logo: "/logo.png",
        logoMark: "/strshort.png",
        paymentStrip: "/footer.png",
    },

    contact: {
        email: "info@strsltd.com",
        salesEmail: "info@strsltd.com",
        phone: "+880 1332-802026",
        phoneHref: "tel:+8801332802026",
        // Second line for European clients. Roughly half the work is outside BD,
        // so this is a real number, not a vanity listing.
        phoneEu: "+39 344 779 2783",
        phoneEuHref: "tel:+393447792783",
        whatsapp: "+880 1332-802026",
        whatsappHref: "https://wa.me/8801332802026",
        hours: "Sat–Thu · 10:00–19:00 (GMT+6)",
        responseTime: "We reply to every inquiry within one business day.",
    },

    address: {
        line1: "970 East Shewrapara",
        line2: "",
        city: "Dhaka",
        country: "Bangladesh",
        countryCode: "BD",
        // Postal code for East Shewrapara. Used in the map query below, not in
        // the printed address, which stays exactly as the company writes it.
        postalCode: "1216",
        /**
         * Google's documented Maps URL form, which resolves the address string
         * server-side and drops a pin on it.
         *
         * Not a lat/lng pair: geocoding "East Shewrapara" returns the centre of
         * the NEIGHBOURHOOD, so a coordinate link would look precise and point
         * at the wrong building — worse than a search that lands on the right
         * street. The postcode is in the query because it materially improves
         * resolution for Dhaka addresses.
         *
         * To pin the exact door: open the studio's Google Business listing,
         * Share → Copy link, and paste that here instead. A place link beats
         * any query string.
         */
        mapUrl:
            "https://www.google.com/maps/search/?api=1&query=970+East+Shewrapara%2C+Dhaka+1216%2C+Bangladesh",
    },

    social: {
        // ⚑ The double "i" in "liimited" is not a typo in this file — it is the
        // company's actual LinkedIn vanity slug. The correctly spelled
        // /company/str-solutions-limited is a 404. Do not "fix" it.
        linkedin: "https://www.linkedin.com/company/str-solutions-liimited",
        // Canonical page URL. Replaces a /share/1J9gnWA3Q9 short link, which
        // redirected here anyway and told a reader nothing about where it went.
        facebook: "https://www.facebook.com/strsolutionslimited",
        // ⚑ No public GitHub org, X account or Behance profile existed on the
        // legacy site. Empty rather than fabricated — Footer.jsx should skip
        // falsy entries instead of rendering a dead icon.
        github: "",
        x: "",
        behance: "",
    },

    /* Primary navigation. `children` renders as a mega-panel in the desktop
     Navbar and as an inline disclosure in the mobile sheet. */
    nav: [
        { label: "Services", href: "/services" },
        { label: "Work", href: "/projects" },
        /* Sits between Work and About on purpose: it is the first thing a
           client who has just looked at the work wants, and the last thing
           anyone scrolls back up for. /packages is bilingual and carries the
           published BDT rates; the EUR rates for European clients stay on
           /portfolio. */
        { label: "Packages", href: "/packages" },
        { label: "About", href: "/about" },
        { label: "Insights", href: "/blogs" },
        { label: "Contact", href: "/contact" },
    ],

    /* Footer link columns. Kept separate from `nav` on purpose — the footer is a
     sitemap, the header is a hierarchy, and conflating them is why footers rot. */
    footerColumns: [
        {
            title: "Services",
            /* Six of nine, plus an index link. A footer column is a sitemap
               entry point, not the sitemap: nine stacked links push the
               company and contact columns below the fold on a phone, and the
               three omitted here are the least searched. /services carries the
               full list. Keep these slugs in step with lib/taxonomy.js. */
            links: [
                { label: "Website Development", href: "/services/website-development" },
                { label: "Software Development", href: "/services/software-development" },
                { label: "Mobile App Development", href: "/services/mobile-app-development" },
                { label: "Dashboard Development", href: "/services/dashboard-development" },
                { label: "Graphic Design", href: "/services/graphic-design" },
                { label: "Digital Marketing", href: "/services/digital-marketing" },
                { label: "All services", href: "/services" },
            ],
        },
        {
            title: "Company",
            links: [
                { label: "About STR", href: "/about" },
                { label: "Selected Work", href: "/projects" },
                { label: "Packages & Pricing", href: "/packages" },
                { label: "Insights", href: "/blogs" },
                { label: "Contact", href: "/contact" },
            ],
        },
        {
            title: "Reach us",
            /* ⚑ These hrefs are written out rather than read from site.contact
               and site.address above, because this file is a plain object and
               cannot reference its own properties while it is being defined.
               They must be kept in step by hand — if one of them changes up
               there, change it here too. */
            links: [
                { label: "info@strsltd.com", href: "mailto:info@strsltd.com" },
                /* WhatsApp, not tel: this is the number the studio actually
                   answers, and a tap-to-call on a number nobody picks up is a
                   worse outcome than a chat that gets read. The label says so
                   — the EU line directly below IS a phone number, and two
                   identical-looking entries behaving differently is the kind
                   of thing a visitor blames themselves for. */
                {
                    label: "+880 1332-802026 (WhatsApp)",
                    href: "https://wa.me/8801332802026",
                },
                { label: "+39 344 779 2783", href: "tel:+393447792783" },
                {
                    label: "970 East Shewrapara, Dhaka",
                    href: "https://www.google.com/maps/search/?api=1&query=970+East+Shewrapara%2C+Dhaka+1216%2C+Bangladesh",
                },
            ],
        },
    ],

    legalLinks: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
    ],

    /* Shown under the contact form and in the /contact sidebar. Values match the
     Inquiry.budgetRange free-text field — keep the strings stable, the admin
     dashboard groups leads by exact match. */
    budgetRanges: [
        "Under $2,000",
        "$2,000 – $5,000",
        "$5,000 – $15,000",
        "$15,000 – $50,000",
        "$50,000+",
        "Not sure yet",
    ],
};

/* ── partners MOVED ───────────────────────────────────────────────────────
   The client list lives in the database as the SiteContent "partners" block,
   edited at /admin/site-content with a logo upload per row. It was a hardcoded
   export here, which meant adding a client took a developer and a deploy.

   Read it with getSiteContent("partners") on the server and pass it down;
   EcosystemBand and /about both take it as a prop now. The eight seeded rows
   still point at /logo/partners/*.png in this app's /public, so those files
   must stay until every logo has been re-uploaded through the dashboard. */

export default site;
