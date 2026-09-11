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
        // ⚑ The legacy site published "Dhaka, Bangladesh" and no street address.
        // Fill line1/line2 in before launch, or drop them from the contact page —
        // a half-invented address is worse than none.
        line1: "",
        line2: "",
        city: "Dhaka",
        country: "Bangladesh",
        countryCode: "BD",
        mapUrl: "https://maps.google.com/?q=STR+Solutions+Ltd+Dhaka",
    },

    social: {
        linkedin: "https://www.linkedin.com/company/str-solutions-ltd",
        facebook: "https://www.facebook.com/share/1J9gnWA3Q9",
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
                { label: "Insights", href: "/blogs" },
                { label: "Contact", href: "/contact" },
            ],
        },
        {
            title: "Reach us",
            links: [
                { label: "info@strsltd.com", href: "mailto:info@strsltd.com" },
                { label: "+880 1332-802026", href: "tel:+8801332802026" },
                { label: "+39 344 779 2783", href: "tel:+393447792783" },
                {
                    label: "Dhaka, Bangladesh",
                    href: "https://maps.google.com/?q=STR+Solutions+Ltd+Dhaka",
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
