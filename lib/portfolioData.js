/**
 * /portfolio content — the full sample library across all five disciplines.
 *
 * ── WHY THIS IS A FILE AND NOT AN API CALL, FOR NOW ──────────────────────
 * The records below are shaped exactly like the documents this will become:
 * one flat collection, every field scalar or a string array, no nesting, no
 * computed values. `getPortfolioItems()` is the only thing the route calls, so
 * the swap to the dashboard is one function body — replace the return with
 * `apiGet("/portfolio")` and nothing above it changes. Deriving the masthead
 * numbers here rather than hand-writing them in the route is part of the same
 * bet: when the records move, the counts follow instead of quietly going
 * stale.
 *
 * ── FIELDS ───────────────────────────────────────────────────────────────
 *   slug        unique, stable. The React key and the future URL segment.
 *   discipline  one of DISCIPLINE_IDS. See lib/portfolio.js.
 *   client      the trading name where we are credited, otherwise the SECTOR
 *               the piece was produced for. A sector reads honestly to a
 *               reader where a borrowed logo does not — swap the real name in
 *               on any entry the client is happy to be named on.
 *   outcome     what changed, in one sentence. Not a feature list.
 *   stack       tools or platforms. Four show on a card; the rest collapse.
 *   image       path under /public. Optional — a record without one renders a
 *               hairline plate with the client's initials rather than a gap,
 *               which looks wrong to an editor instead of looking deliberate.
 *   liveUrl     `web` only. A public address.
 *   fileUrl     the other four disciplines. A shared folder or single file.
 *   fileLabel   overrides the discipline's default verb, for the four
 *               "whole library" entries that open a discipline rather than
 *               showing one piece.
 *
 * ⚑ THUMBNAIL FILENAMES MUST STAY ASCII AND HYPHENATED. A path containing a
 * space or an "&" has to be percent-escaped to survive every host, and an
 * unescaped one falls through to the app shell — a broken image rather than
 * the 404 you would notice.
 */

import { DISCIPLINE_IDS } from "./portfolio";

/* ── Web ──────────────────────────────────────────────────────────
   Every entry is live, linkable and screenshotted. The thumbnails in
   /public/websites are what a reader judges the studio on, so they stay in
   sync with the production sites. */
const web = [
    {
        slug: "teads",
        discipline: "web",
        title: "Global advertising platform site",
        client: "Teads",
        outcome:
            "Advertisers and media owners split into two self-contained journeys on one multi-language global site.",
        stack: ["Multi-language", "CMS", "Edge CDN", "GA4"],
        image: "/websites/teds-website.png",
        liveUrl: "https://www.teads.com/",
        year: "2024",
    },
    {
        slug: "london-youth-games",
        discipline: "web",
        title: "Youth sport participation portal",
        client: "London Youth Games",
        outcome:
            "Programme entries, results and donations for all 33 London boroughs, holding up through seasonal registration spikes.",
        stack: ["WordPress", "PHP", "Donations", "Cloudflare"],
        image: "/websites/london-youth-website.png",
        liveUrl: "https://www.londonyouthgames.org/",
        year: "2024",
    },
    {
        slug: "australian-cosmetic-institute",
        discipline: "web",
        title: "Clinic booking and treatment site",
        client: "Australian Cosmetic Institute",
        outcome:
            "Treatment pages, before-and-after galleries and clinic locations all funnelled into a single free-consult booking.",
        stack: ["WordPress", "Booking flow", "SEO", "GA4"],
        image: "/websites/australian-cosmetic-website.png",
        liveUrl: "https://www.australiancosmeticinstitute.com.au/",
        year: "2024",
    },
    {
        slug: "torgeson-electric",
        discipline: "web",
        title: "Electrical contractor platform",
        client: "Torgeson Electric",
        outcome:
            "Built around the two things that actually convert for a contractor: the 24/7 service call and the open trade vacancy.",
        stack: ["WordPress", "Local SEO", "Careers", "Lead forms"],
        image: "/websites/torgeson-website.png",
        liveUrl: "https://torgesonelectric.com/",
        year: "2024",
    },
    {
        slug: "the-vera-hotel",
        discipline: "web",
        title: "Boutique hotel direct booking",
        client: "The Vera Hotel",
        outcome:
            "Availability search pinned to the hero so reservations land direct instead of leaking to third-party channels.",
        stack: ["Booking engine", "React", "Accessibility", "GA4"],
        image: "/websites/vera-website.png",
        liveUrl: "https://theverahotel.com/",
        year: "2024",
    },
    {
        slug: "terea-vibe",
        discipline: "web",
        title: "Express-delivery storefront",
        client: "Terea Vibe",
        outcome:
            "Sixty-minute delivery across Dubai, Sharjah and Ajman, with WhatsApp running as a full second checkout path.",
        stack: ["Next.js", "Commerce", "WhatsApp API", "Tailwind"],
        image: "/websites/terea-website.png",
        liveUrl: "https://tereavibe.ae/",
        year: "2025",
    },
    {
        slug: "riverside-cottages",
        discipline: "web",
        title: "Assisted living facility site",
        client: "Riverside Cottages",
        outcome:
            "Every page routed to one action, schedule a tour, with facilities, gallery and care services supporting it.",
        stack: ["WordPress", "Local SEO", "Tour booking"],
        image: "/websites/riverside-website.png",
        liveUrl: "https://riversidecottagesalf.com/",
        year: "2024",
    },
    {
        slug: "4one",
        discipline: "web",
        title: "Corporate web presence",
        client: "4one",
        outcome:
            "Corporate site delivered for the European market on a structure the client's own team maintains.",
        stack: ["Web platform", "CMS", "SEO"],
        liveUrl: "https://4one.ag/",
        year: "2023",
    },
    {
        slug: "innoel",
        discipline: "web",
        title: "Electrical brand and catalogue",
        client: "Innoel",
        outcome:
            "Product collections, engineering specs and cart on one stack, with campaign-ready launch slots built into the homepage.",
        stack: ["React", "Node", "MongoDB", "Commerce"],
        image: "/websites/innoel-website.png",
        liveUrl: "https://innoelbd.com/",
        year: "2025",
    },
    {
        slug: "paarel",
        discipline: "web",
        title: "Denim D2C storefront",
        client: "Paarél",
        outcome:
            "Men, women and kids catalogues plus a separate bulk-order route, on a storefront the team runs without us.",
        stack: ["Next.js", "Commerce", "Tailwind", "Vercel"],
        image: "/websites/paarel-website.png",
        liveUrl: "https://paarel.com/",
        year: "2025",
    },
    {
        slug: "zuzuva",
        discipline: "web",
        title: "Multi-vendor marketplace",
        client: "Zuzuva",
        outcome:
            "A thousand-plus sellers under one catalogue, with seller onboarding and flash-sale merchandising built in.",
        stack: ["MERN", "Multi-vendor", "Search", "Payments"],
        image: "/websites/zuzuva-website.png",
        liveUrl: "https://zuzuva.com/",
        year: "2025",
    },
    {
        slug: "the-foxes-photography",
        discipline: "web",
        title: "Elopement photography studio",
        client: "The Foxes Photography",
        outcome:
            "Full-bleed editorial site where location guides and the travel calendar carry the enquiry instead of a contact form.",
        stack: ["WordPress", "Editorial UI", "Galleries", "SEO"],
        image: "/websites/the-foxes-website.png",
        liveUrl: "https://thefoxesphotography.com/",
        year: "2024",
    },
    {
        slug: "tiger-den-tourism",
        discipline: "web",
        title: "Medical tourism and visa portal",
        client: "Tiger Den Tourism",
        outcome:
            "Treatment packages, visa processing and work-and-study routes behind one advisor-led enquiry flow, in two languages.",
        stack: ["React", "Multi-language", "Dark mode", "CMS"],
        image: "/websites/tigerdentourism-website.png",
        liveUrl: "https://tigerdentourism.com/",
        year: "2025",
    },
    {
        slug: "skh-sourcing",
        discipline: "web",
        title: "Apparel sourcing platform",
        client: "SKH Sourcing",
        outcome:
            "Buyer-facing catalogue and compliance pages fronting an admin dashboard the sourcing desk updates live.",
        stack: ["React", "Node", "Admin dashboard", "Catalogue"],
        image: "/websites/skhsourcing-website.png",
        liveUrl: "https://www.skhsourcing.com/",
        year: "2025",
    },
    {
        slug: "podcast-chart-growth",
        discipline: "web",
        title: "Podcast growth platform",
        client: "Podcast Chart Growth",
        outcome:
            "Apple and Spotify promotion offer built on two low-friction entry points: a free audit and a three-day test.",
        stack: ["React", "Motion", "Audio UI", "Vercel"],
        image: "/websites/podcast-website.png",
        liveUrl: "https://podcast-frontend-pi.vercel.app/",
        year: "2025",
    },
];

/* ── 2D & 3D ──────────────────────────────────────────────────────
   No public URL: the deliverable is a file set, so these carry `fileUrl`.
   The first entry opens the whole library rather than one piece, which is why
   it overrides the discipline's verb. */
const creative = [
    {
        slug: "all-2d-3d-work",
        discipline: "creative",
        title: "Every 2D and 3D sample, one folder",
        client: "Full sample set",
        outcome:
            "The whole library rather than the pieces below it. Branding, print and UI on the 2D side, modelling, rendering, product and architectural visualisation, animation and game assets on the 3D side.",
        stack: ["Photoshop", "Illustrator", "3ds Max", "Blender", "Cinema 4D"],
        image: "/2d-3d/all-2d-3d-work.jpg",
        fileUrl:
            "https://drive.google.com/drive/folders/1os26MWBUhZUiP7hzU6-kJ8gfw9lKmLGV?usp=sharing",
        fileLabel: "Explore the full set",
        year: "2025",
    },
    {
        slug: "exterior-dusk-render",
        discipline: "creative",
        title: "Twilight exterior visualisation",
        client: "Residential development",
        outcome:
            "Marketing hero for a five-storey block, lit at dusk so the pool deck, planting and lit interiors all read in a single frame.",
        stack: ["3ds Max", "Corona", "HDRI lighting", "Post-production"],
        image: "/2d-3d/exterior-lighting.jpg",
        fileUrl: "https://drive.google.com/file/d/1ZHwObIws1fxHIG7zvJB5SbdaxGDNAf3S/view?usp=drive_link",
        year: "2025",
    },
    {
        slug: "interior-visualisation",
        discipline: "creative",
        title: "Interior visualisation, master suite",
        client: "Interior design studio",
        outcome:
            "The whole material and lighting scheme judged as one photoreal frame. Veneer, cove lighting and fabric were settled before anything was ordered.",
        stack: ["3ds Max", "Corona", "PBR materials", "Lighting design"],
        image: "/2d-3d/3d-interior.jpg",
        fileUrl: "https://drive.google.com/file/d/1a3eucTvv_TqywpZhqitFGVyktC2Crimn/view?usp=sharing",
        year: "2025",
    },
    {
        slug: "floor-plan-3d",
        discipline: "creative",
        title: "Furnished 3D floor plan",
        client: "Residential real estate",
        outcome:
            "Cutaway doll's-house view showing layout, furniture fit and circulation in one image, which is the view a listing actually converts on.",
        stack: ["3D layout", "Furniture staging", "Interior finishes"],
        image: "/2d-3d/3d-floor-plan.jpg",
        fileUrl: "https://drive.google.com/file/d/1lMfOSi00miMdUgo3wTaO4aCBKcWkeJtf/view?usp=sharing",
        year: "2025",
    },
    {
        slug: "arch-walkthrough",
        discipline: "creative",
        title: "Neighbourhood walkthrough animation",
        client: "Property development",
        outcome:
            "Street-level flythrough with traffic, planting and people in shot, so the plot sells as a neighbourhood rather than as a building.",
        stack: ["Lumion", "Animation", "Populated scenes", "Colour grade"],
        image: "/2d-3d/3d-animation-video.jpg",
        fileUrl: "https://drive.google.com/file/d/1Gt1dXOZWbmPYhDzYwj6EUYkmIWPAMhpt/view?usp=sharing",
        year: "2025",
    },
    {
        slug: "hard-surface-product",
        discipline: "creative",
        title: "Hard-surface product build",
        client: "Consumer audio",
        outcome:
            "Modelled from spec drawings and lit as a studio shot. The mesh on the left, the frame the catalogue ships on the right.",
        stack: ["Blender", "Hard-surface modelling", "Studio lighting", "Compositing"],
        image: "/2d-3d/3d-rendering.jpg",
        fileUrl: "https://drive.google.com/file/d/1RkUqB_OBYBIvomS_Y-amwS_yiPw6fexZ/view?usp=sharing",
        year: "2025",
    },
    {
        slug: "packaging-render",
        discipline: "creative",
        title: "Packaging render for launch creative",
        client: "Fragrance & beauty",
        outcome:
            "Glass, brushed copper and satin resolved in one pass, giving the campaign its hero shot with no studio, stylist or sample bottle.",
        stack: ["Blender", "Cycles", "Glass & metal shading", "Retouch"],
        image: "/2d-3d/3d-product-render.jpg",
        fileUrl: "https://drive.google.com/file/d/1FoukClezN_Fz2qo2QhseoGDp6HFr_K8b/view?usp=sharing",
        year: "2025",
    },
    {
        slug: "floor-plan-2d-colour",
        discipline: "creative",
        title: "Colour-zoned 2D floor plan",
        client: "Residential real estate",
        outcome:
            "Every room measured and labelled, zoned by colour so a buyer reads the layout without having to read a drawing.",
        stack: ["CAD redraw", "Room schedule", "Metric dimensions"],
        image: "/2d-3d/2d-floor-plan-colour.png",
        fileUrl: "https://drive.google.com/file/d/1PJ8J4JcrnWJPwNv4e4Mqb2FfAukmc7Fp/view?usp=sharing",
        year: "2025",
    },
    {
        slug: "floor-plan-2d-mono",
        discipline: "creative",
        title: "Black-and-white measured plan",
        client: "Architecture & surveying",
        outcome:
            "Print-ready mono line work carrying imperial and metric dimensions together, for brochure and permit packs off a single survey.",
        stack: ["CAD redraw", "Dual dimensioning", "Print output"],
        image: "/2d-3d/2d-floor-plan-mono.png",
        fileUrl: "https://drive.google.com/file/d/1GKty6Lw6c4f3JYEoWC89Srdco9GYWOK2/view?usp=sharing",
        year: "2025",
    },
    {
        slug: "floor-plan-2d-variant",
        discipline: "creative",
        title: "One survey, two drawing styles",
        client: "Residential real estate",
        outcome:
            "The same measured plan delivered twice, mono for the permit set and colour-zoned for the listing, so both audiences work from identical dimensions.",
        stack: ["CAD redraw", "Style variants", "Dual dimensioning"],
        image: "/2d-3d/2d-floor-plan-dual-unit.png",
        fileUrl: "https://drive.google.com/file/d/1kqsOSSIPB-1w3l3cVxOaRs-XRd3oXBMp/view?usp=sharing",
        year: "2025",
    },
];

/* ── Digital marketing ────────────────────────────────────────── */
const marketing = [
    {
        slug: "all-digital-marketing",
        discipline: "marketing",
        title: "Every campaign and report, one folder",
        client: "Full sample set",
        outcome:
            "SEO, paid social, PPC, content and email side by side with the analytics behind them. The full campaign library, and the monthly reporting that goes out with it.",
        stack: ["SEO", "Meta & Google Ads", "Content & email", "GA4 reporting"],
        image: "/digital/all-digital-marketing.jpg",
        fileUrl:
            "https://drive.google.com/drive/folders/1SX1nztLY2TUJ8zCKvxhBiV4G6QwVZQfQ?usp=sharing",
        fileLabel: "Explore the full set",
        year: "2025",
    },
    {
        slug: "meta-campaign-lift",
        discipline: "marketing",
        title: "Meta campaign scaled on paid reach",
        client: "Consumer brand",
        outcome:
            "47.4K views across a 90-day window, up 30%, with content interactions up 19% and watch time up 57% on the same page.",
        stack: ["Meta Ads", "Advantage+", "Creative testing", "Page insights"],
        image: "/digital/facebook-ads-campaign.jpg",
        fileUrl: "https://drive.google.com/file/d/19LZKYbnSDF1VP_X7MG5KItoMJoCXFKx0/view?usp=sharing",
        year: "2026",
    },
    {
        slug: "technical-seo-audit",
        discipline: "marketing",
        title: "Technical SEO crawl and audit",
        client: "Home services contractor",
        outcome:
            "455 URLs crawled end to end, then titles, meta, response codes and render-blocking assets triaged into a fix list the dev team could work straight down.",
        stack: ["Screaming Frog", "Crawl analysis", "Search Console", "Core Web Vitals"],
        image: "/digital/seo-audit-report.jpg",
        fileUrl: "https://drive.google.com/file/d/1hog9BDS9R3hlcF7HbZYOgN40ge3bhfsz/view?usp=sharing",
        year: "2025",
    },
];

/* ── Graphic design ───────────────────────────────────────────── */
const graphics = [
    {
        slug: "all-graphics-work",
        discipline: "graphics",
        title: "Every design sample, one folder",
        client: "Full sample set",
        outcome:
            "The design side of the studio rather than the retouching set below. Logo and identity, social and ad creative, print, packaging, presentations, infographics and UI.",
        stack: ["Photoshop", "Illustrator", "InDesign", "Figma", "After Effects"],
        image: "/graphics/all-graphics-work.jpg",
        fileUrl:
            "https://drive.google.com/drive/folders/1lrOZ1hAyiFhTuyF_KRXoM3nXEjXkT_Xf?usp=sharing",
        fileLabel: "Explore the full set",
        year: "2025",
    },
    {
        slug: "clipping-path",
        discipline: "graphics",
        title: "Manual clipping paths",
        client: "Footwear e-commerce",
        outcome:
            "Pen-tool paths drawn by hand rather than auto-selected, so laces, mesh and midsole edges hold up at full zoom.",
        stack: ["Photoshop", "Pen tool", "Vector paths", "Transparent PNG"],
        image: "/graphics/clipping-path.jpg",
        fileUrl: "https://drive.google.com/file/d/1ulZg58pM6E6fqIloWRhJ2zUUBIZLxxat/view?usp=drive_link",
        year: "2025",
    },
    {
        slug: "background-removal",
        discipline: "graphics",
        title: "Background removal at catalogue standard",
        client: "Watches & jewellery",
        outcome:
            "Skeleton dial and mesh bracelet lifted off a cluttered bench onto pure white, without softening a single link.",
        stack: ["Photoshop", "Layer masks", "Refine edge", "Curves"],
        image: "/graphics/background-removal.jpg",
        fileUrl: "https://drive.google.com/file/d/1fgmVKGss906m9v2KPiYdefjdNh78GoaW/view?usp=drive_link",
        year: "2025",
    },
    {
        slug: "image-masking",
        discipline: "graphics",
        title: "Image masking for fine edges",
        client: "Fashion e-commerce",
        outcome:
            "Fringing, sequins and flyaway hair carried into a clean alpha channel, the cases a path on its own cannot cut.",
        stack: ["Photoshop", "Channel masking", "Alpha refinement", "PNG"],
        image: "/graphics/image-masking.jpg",
        fileUrl: "https://drive.google.com/file/d/1RklZKLsQlVaDBmYRPkHSYRrMjASa109x/view?usp=drive_link",
        year: "2025",
    },
    {
        slug: "ghost-mannequin",
        discipline: "graphics",
        title: "Ghost mannequin garment shots",
        client: "Apparel & fashion",
        outcome:
            "Mannequin and studio clutter removed and the neckline rebuilt, so the garment keeps its shape on a white product page.",
        stack: ["Photoshop", "Neck joint", "Retouch", "White background"],
        image: "/graphics/invisible-mannequin.jpg",
        fileUrl: "https://drive.google.com/file/d/1FQju6PoVKU7Nu6WMrPd90CSIuAuzCXTl/view?usp=drive_link",
        year: "2025",
    },
    {
        slug: "shadow-reflection",
        discipline: "graphics",
        title: "Shadow and reflection rebuild",
        client: "Leather goods",
        outcome:
            "A flat-lay pulled off a red seamless and re-grounded with natural shadow and surface reflection, so the pieces sit instead of float.",
        stack: ["Photoshop", "Natural shadow", "Reflection", "Colour balance"],
        image: "/graphics/shadows-reflection.jpg",
        fileUrl: "https://drive.google.com/file/d/1rho04oabaja7afe8QyNe0kP9Fi9ykbgI/view?usp=drive_link",
        year: "2025",
    },
    {
        slug: "lifestyle-retouch",
        discipline: "graphics",
        title: "Lifestyle retouch and colour grade",
        client: "Lifestyle & apparel",
        outcome:
            "A flat overcast frame regraded to golden hour. Sky replaced, skin and fabric held, no reshoot and no relight of the subject.",
        stack: ["Lightroom", "Photoshop", "Sky replacement", "Colour grading"],
        image: "/graphics/retouching.jpg",
        fileUrl: "https://drive.google.com/file/d/1iDjgEO9CRocOe2loWTWBMrA84HaxZ14Y/view?usp=drive_link",
        year: "2025",
    },
    {
        slug: "colourway-variants",
        discipline: "graphics",
        title: "Colourways generated from one shot",
        client: "Apparel e-commerce",
        outcome:
            "One sample photographed, three colourways published, with fold shadows and fabric weight preserved through every recolour.",
        stack: ["Photoshop", "Hue & saturation", "Colour matching", "Batch output"],
        image: "/graphics/color-processing.jpg",
        fileUrl: "https://drive.google.com/file/d/1gsPRN7Nh2P7mdMRuRJ_hSniTP1zhSIJI/view?usp=drive_link",
        year: "2025",
    },
    {
        slug: "marketplace-resizing",
        discipline: "graphics",
        title: "Marketplace-spec resizing",
        client: "Home & furniture retail",
        outcome:
            "Studio frames squared to 1200×1200 with floors cut away and levels corrected, the exact format marketplace listings reject you for missing.",
        stack: ["Photoshop", "1:1 crop", "Levels & curves", "Batch actions"],
        image: "/graphics/image-resizing.jpg",
        fileUrl: "https://drive.google.com/file/d/1y9qxy-ZDPUuyOdjYLIx6dt1nsvbdqE0i/view?usp=drive_link",
        year: "2025",
    },
];

/* ── Video ────────────────────────────────────────────────────── */
const video = [
    {
        slug: "all-video-work",
        discipline: "video",
        title: "Every edit, one folder",
        client: "Full sample set",
        outcome:
            "YouTube, product, wedding, corporate, social and event work in one place. Clean cuts, colour, sound design and titles, across the Adobe and Resolve pipeline the desk runs on.",
        stack: ["Premiere Pro", "After Effects", "DaVinci Resolve", "Audition"],
        image: "/video/all-video.jpg",
        fileUrl: "https://drive.google.com/drive/folders/1E-nesQB6DS5eCAv04cDA7lH2jDtrLPqb",
        fileLabel: "Explore the full set",
        year: "2025",
    },
    {
        slug: "property-launch-promo",
        discipline: "video",
        title: "Property launch promo",
        client: "Real estate developer",
        outcome:
            "Aerial opener, animated logo sting and a graded sunset pass, cut for the paid placements the launch campaign ran on.",
        stack: ["Premiere Pro", "After Effects", "Logo animation", "Colour grade"],
        image: "/video/real-estate-video.jpg",
        fileUrl: "https://drive.google.com/file/d/1yvm4sKygi6f1sjfX5vv-W7VG6zAzOpgJ/view?usp=drive_link",
        year: "2025",
    },
    {
        slug: "landscaping-social-cut",
        discipline: "video",
        title: "Landscaping brand social cut",
        client: "Turf & landscaping",
        outcome:
            "Burned-in captions and a tight cut built for sound-off feeds, where the offer has to land inside the first three seconds.",
        stack: ["Premiere Pro", "Burned-in captions", "9:16 & 1:1 cutdowns", "Sound design"],
        image: "/video/precision-greens-video.jpg",
        fileUrl: "https://drive.google.com/file/d/1nLnIjjGQn5FUvHK5GtxgCJNri0rLC4tS/view?usp=drive_link",
        year: "2025",
    },
];

/* Source order is web-first and stays that way: it is the discipline a reader
   arrives for, and the rail mixes the order for the "Everything" tab anyway. */
const RECORDS = [...web, ...creative, ...marketing, ...graphics, ...video];

/**
 * The only accessor the route uses.
 *
 * Async on purpose. It returns a resolved array today, and the day this moves
 * behind the dashboard the body becomes a fetch — with the call sites, the
 * `await` and the route's caching semantics already correct. A sync function
 * swapped for an async one later is a change in every caller.
 */
export async function getPortfolioItems() {
    return RECORDS;
}

/**
 * Masthead spec row, derived rather than written.
 *
 * The hand-written version of this ("Sectors: retail, property, field ops")
 * stops being true the first time the catalogue changes shape, and nothing
 * tells you. Every figure below is counted from the records.
 */
export function portfolioStats(items = RECORDS) {
    const live = items.filter((i) => i.liveUrl).length;
    const folders = items.filter((i) => i.fileLabel).length;
    const years = items.map((i) => Number(i.year)).filter(Number.isFinite);

    return [
        { label: "Pieces published", value: `${items.length} across 5 disciplines` },
        { label: "Live builds", value: `${live} production sites` },
        { label: "Sample libraries", value: `${folders} full folders` },
        {
            label: "Span",
            value: years.length ? `${Math.min(...years)}–${Math.max(...years)}` : "Not set",
        },
    ];
}

/** discipline id → count, for the filter rail and the discipline band. */
export function portfolioCounts(items = RECORDS) {
    const counts = { all: items.length };
    for (const id of DISCIPLINE_IDS) {
        counts[id] = items.filter((i) => i.discipline === id).length;
    }
    return counts;
}
