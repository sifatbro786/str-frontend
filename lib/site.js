/**
 * lib/site.js — single source of truth for anything that is *about the company*
 * rather than *about its content*. Content (services, projects, blogs, team,
 * testimonials) lives in lib/data.js and mirrors the Mongoose models 1:1;
 * this file never does.
 *
 * Nothing here is fetched. If a value changes, it changes in exactly one place.
 *
 * TODO(legacy): the values marked ⚑ are best-effort reconstructions. Replace
 * them from the legacy STR project folder before launch.
 */

export const site = {
  name: "STR Solutions",
  legalName: "STR Solutions Ltd.",
  shortName: "STR",
  tagline: "Software, Data & Digital Engineering",
  url: "https://strsltd.com",
  foundedYear: 2017, // ⚑
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
    email: "info@strsltd.com", // ⚑
    salesEmail: "hello@strsltd.com", // ⚑
    phone: "+880 1XXX-XXXXXX", // ⚑
    phoneHref: "tel:+8801XXXXXXXXX", // ⚑
    whatsapp: "+880 1XXX-XXXXXX", // ⚑
    hours: "Sun–Thu · 10:00–19:00 (GMT+6)",
    responseTime: "We reply to every inquiry within one business day.",
  },

  address: {
    line1: "House 00, Road 00", // ⚑
    line2: "Banani, Dhaka 1213", // ⚑
    city: "Dhaka",
    country: "Bangladesh",
    countryCode: "BD",
    mapUrl: "https://maps.google.com/?q=STR+Solutions+Ltd+Dhaka", // ⚑
  },

  social: {
    linkedin: "https://www.linkedin.com/company/str-solutions-ltd", // ⚑
    facebook: "https://www.facebook.com/strsolutionsltd", // ⚑
    github: "https://github.com/str-solutions", // ⚑
    x: "https://x.com/strsltd", // ⚑
    behance: "https://www.behance.net/strsolutions", // ⚑
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
      links: [
        { label: "Web Development", href: "/services/web-development" },
        { label: "Custom Software", href: "/services/custom-software" },
        { label: "Mobile Applications", href: "/services/mobile-applications" },
        { label: "Product Design", href: "/services/product-design" },
        { label: "Graphics Design", href: "/services/graphics-design" },
        { label: "Architectural Visualization", href: "/services/architectural-visualization" },
        { label: "Digital Marketing", href: "/services/digital-marketing" },
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
        { label: "+880 1XXX-XXXXXX", href: "tel:+8801XXXXXXXXX" },
        { label: "Banani, Dhaka 1213", href: "https://maps.google.com/?q=STR+Solutions+Ltd+Dhaka" },
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

/* Client logos in /public/logo/partners. Real files — verified on disk. */
export const partners = [
  { name: "AECL", logo: "/logo/partners/aecl-logo.png" },
  { name: "Bay Developments", logo: "/logo/partners/bay-logo.png" },
  { name: "GSP", logo: "/logo/partners/gsp-logo.png" },
  { name: "Daily Inqilab", logo: "/logo/partners/inqilab-logo.png" },
  { name: "MH Group", logo: "/logo/partners/mhgroup-logo.png" },
  { name: "Ramy", logo: "/logo/partners/ramy-logo.png" },
  { name: "Vertex", logo: "/logo/partners/vertex-logo.png" },
  { name: "Wintex", logo: "/logo/partners/wintex-logo.png" },
];

export default site;
