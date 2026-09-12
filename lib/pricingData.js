/**
 * EUR pricing for /portfolio — four build tracks, three tiers each.
 *
 * ── WHAT THIS IS, AND WHAT IT IS NOT ─────────────────────────────────────
 * These are the European-market rates carried over from the v1 /info page,
 * unchanged. They are NOT the BD figures on the v1 /packages page — that is a
 * different market at a different number, and the two must never be merged
 * into one table with a currency switch bolted on. If BDT pricing is ever
 * wanted here it gets its own block and its own route.
 *
 * ── WHY THE DISCOUNT FRAMING SURVIVES ────────────────────────────────────
 * `original` is the list price and `amount` is what is actually invoiced. Both
 * are shown, at sizes where both are legible, with the gap stated in money
 * rather than left for the reader to work out. A discount that only exists as
 * a small grey struck figure below the fold of the eye is not a discount, it
 * is decoration.
 *
 * ── SHAPE IS BACKEND-READY ───────────────────────────────────────────────
 * `tiers` nests one level under a category, which is how it would be stored:
 * one document per category, tiers as a validated subdocument array, exactly
 * the arrangement SiteContent uses for its ordered blocks. `id` on each tier
 * is the stable key — it is what `EURO_PRICES` is keyed by and what a future
 * admin form would edit against, so it must never be regenerated from the
 * tier name.
 *
 * ⚑ PRICES LIVE IN `EURO_PRICES`, KEYED BY TIER ID — one place to change a
 * number. Do not inline a figure into a tier object.
 */

export const PRICING_CATEGORIES = [
    {
        id: "business",
        title: "Business & Corporate",
        platform: "Custom MERN / Next.js",
        bestFor:
            "Companies, startups and professionals who need a credible presence, lead generation and easy content management, not a store.",
        tiers: [
            {
                id: "BIZ-01",
                segment: "Starter",
                name: "Landing Package",
                badge: "One-page launch",
                billing: "One-time · 2 payments",
                timeline: "1–2 weeks",
                features: [
                    { label: "UI / UX", value: "Single-page responsive landing, fully custom design." },
                    { label: "Sections", value: "Hero, Services, About, Testimonials, Contact." },
                    { label: "Features", value: "Lead-capture form, email and WhatsApp routing, base SEO meta." },
                    { label: "Performance", value: "Next.js SSG, Core Web Vitals 90+." },
                    { label: "Support", value: "2 weeks post-launch fixes." },
                ],
            },
            {
                id: "BIZ-02",
                segment: "Professional",
                name: "Corporate Package",
                badge: "Growth ready",
                billing: "One-time · milestone billing",
                timeline: "3–5 weeks",
                highlighted: true,
                features: [
                    { label: "UI / UX", value: "Multi-page custom UI with a reusable component system." },
                    { label: "Pages", value: "Home, Services, Portfolio, Blog, Team, Careers, Contact." },
                    { label: "CMS", value: "Headless CMS for pages and blog, dynamic SEO manager." },
                    { label: "Integrations", value: "GA4, Google Tag Manager, Meta Pixel, newsletter." },
                    { label: "Admin", value: "Custom dashboard for content, blogs and leads." },
                ],
            },
            {
                id: "BIZ-03",
                segment: "Enterprise",
                name: "Platform Package",
                badge: "Scalable platform",
                billing: "From · scoped per programme",
                timeline: "8–14 weeks",
                features: [
                    { label: "UI / UX", value: "Design-system-driven UI with motion and WCAG 2.2 AA." },
                    { label: "Access", value: "Role-based auth, client portal, multi-language." },
                    { label: "Architecture", value: "Modular MERN / Next.js, Redis caching, rate limiting, audit logs." },
                    { label: "Automation", value: "CRM and ERP API integration, scheduled reports, webhook events." },
                    { label: "Security & Ops", value: "JWT with refresh rotation, input sanitisation, CI/CD, monitoring." },
                ],
            },
        ],
    },
    {
        id: "custom",
        title: "Custom E-Commerce",
        platform: "MERN Stack / Full Custom",
        bestFor:
            "Businesses that need ultra-fast speed, custom UI/UX, high-concurrency handling and total ownership of platform and data.",
        tiers: [
            {
                id: "MERN-01",
                segment: "Starter",
                name: "MVP Package",
                badge: "MVP / launch",
                billing: "One-time · milestone billing",
                timeline: "3–4 weeks",
                features: [
                    { label: "UI / UX", value: "Fully responsive custom UI, single layout." },
                    { label: "Pages", value: "Home, Shop, Product, Cart, Checkout, basic Admin." },
                    { label: "Auth", value: "JWT and email-OTP auth, product search and filters." },
                    { label: "Payment", value: "Stripe and PayPal checkout." },
                    { label: "Performance", value: "Next.js SSR/SSG, Speed Index 90+." },
                ],
            },
            {
                id: "MERN-02",
                segment: "Standard",
                name: "Standard Package",
                badge: "Most chosen",
                billing: "One-time · milestone billing",
                timeline: "6–9 weeks",
                highlighted: true,
                features: [
                    { label: "UI / UX", value: "Multi-layout custom UI with modern component design." },
                    { label: "Pages", value: "All MVP pages plus wishlist, user dashboard, coupon system." },
                    { label: "Features", value: "Scheduled flash sales, auto PDF invoices, transactional email." },
                    { label: "Payment & Shipping", value: "Stripe and Klarna, DHL and DPD shipping API." },
                    { label: "Admin", value: "Complete custom admin dashboard and inventory." },
                ],
            },
            {
                id: "MERN-03",
                segment: "Enterprise",
                name: "Scale Package",
                badge: "High-scale",
                billing: "From · scoped per programme",
                timeline: "12–20 weeks",
                features: [
                    { label: "UI / UX", value: "Enterprise-grade UI system with micro-animations." },
                    { label: "Features", value: "Multi-vendor and multi-warehouse inventory, Redis caching, real-time analytics." },
                    { label: "Automation", value: "Webhook-driven abandoned-cart recovery, custom CRM/ERP API." },
                    { label: "Access", value: "Role-based access control for Admin, Manager and Fulfilment." },
                    { label: "Security", value: "Advanced enterprise security and load management." },
                ],
            },
        ],
    },
    {
        id: "wordpress",
        title: "WordPress Store",
        platform: "WooCommerce",
        bestFor:
            "Clients who want an easy-to-manage CMS, built-in blogging and cost-effective scalability.",
        tiers: [
            {
                id: "WOO-01",
                segment: "Starter",
                name: "Fast-Launch Package",
                badge: "Basic store",
                billing: "One-time · 2 payments",
                timeline: "1–2 weeks",
                features: [
                    { label: "Setup", value: "Premium theme with Elementor and WooCommerce configuration." },
                    { label: "Catalog", value: "50 to 100 product uploads with category setup." },
                    { label: "Features", value: "One-page fast checkout, live-chat widgets." },
                    { label: "Payment", value: "Stripe, PayPal and card gateway." },
                    { label: "Security", value: "Base hardening and cache optimisation." },
                ],
            },
            {
                id: "WOO-02",
                segment: "Business",
                name: "Business Package",
                badge: "Best value",
                billing: "One-time · milestone billing",
                timeline: "3–4 weeks",
                highlighted: true,
                features: [
                    { label: "Setup", value: "Custom Elementor Pro page layouts." },
                    { label: "Features", value: "Advanced AJAX product filters, dynamic coupon engine, email automation." },
                    { label: "Integration", value: "Automated DHL and DPD shipping API." },
                    { label: "Payment", value: "Stripe, Klarna and SEPA gateway." },
                    { label: "SEO & Analytics", value: "RankMath SEO, GA4 and Meta Pixel with Conversion API." },
                ],
            },
            {
                id: "WOO-03",
                segment: "Premium",
                name: "Premium Package",
                badge: "Advanced WooCommerce",
                billing: "One-time · milestone billing",
                timeline: "5–7 weeks",
                features: [
                    { label: "Setup", value: "High-performance custom theme or headless WooCommerce." },
                    { label: "Features", value: "B2B and wholesale pricing, member roles, multi-vendor." },
                    { label: "Automation", value: "Automated email and SMS abandoned-cart recovery." },
                    { label: "Security", value: "Cloudflare Enterprise, database optimisation and hardening." },
                ],
            },
        ],
    },
    {
        id: "shopify",
        title: "Shopify Store",
        platform: "Shopify Platform",
        bestFor:
            "Merchants who want a reliable, hosted store without managing servers or technical maintenance.",
        tiers: [
            {
                id: "SHOP-01",
                segment: "Starter",
                name: "Quick-Store Package",
                badge: "Quick brand setup",
                billing: "One-time · 2 payments",
                timeline: "1–2 weeks",
                features: [
                    { label: "Theme", value: "Official free-theme customisation such as Dawn." },
                    { label: "Catalog", value: "Up to 50 products with collections setup." },
                    { label: "Features", value: "One-click checkout, live-chat button." },
                    { label: "Payment", value: "Shopify Payments and PayPal setup." },
                    { label: "Channels", value: "Facebook and Instagram Shop integration." },
                ],
            },
            {
                id: "SHOP-02",
                segment: "Growth",
                name: "Growth Package",
                badge: "For scaling brands",
                billing: "One-time · milestone billing",
                timeline: "3–4 weeks",
                highlighted: true,
                features: [
                    { label: "Theme", value: "Premium theme or custom Liquid section development." },
                    { label: "Features", value: "Custom checkout fields, courier app setup." },
                    { label: "Marketing", value: "BOGO offers, tiered volume discounts, photo-reviews app." },
                    { label: "Tracking", value: "Meta Pixel with CAPI and Google Analytics 4." },
                    { label: "Optimisation", value: "Full store speed and conversion-rate optimisation." },
                ],
            },
            {
                id: "SHOP-03",
                segment: "Advanced",
                name: "Advanced Package",
                badge: "Custom Liquid / enterprise",
                billing: "From · scoped per programme",
                timeline: "5–8 weeks",
                features: [
                    { label: "Theme", value: "Fully custom Liquid theme, no app overload for core UI." },
                    { label: "Features", value: "High-converting custom landing pages, post-purchase upsells." },
                    { label: "Global", value: "Multi-currency and international markets via Shopify Markets." },
                    { label: "Automation", value: "Custom API middleware and automated cart recovery." },
                ],
            },
        ],
    },
    /**
     * ── THE ONLY RECURRING TRACK, AND WHY IT SITS LAST ───────────────────
     * The four above are one-time builds invoiced at milestones. This one is
     * a monthly retainer, which is why its prices carry `period` and its
     * billing line reads differently. It is last rather than first so the
     * default tab is a build track: the billing terms printed under the grid
     * lead with the 40% deposit, and opening on a retainer would put a
     * deposit rule directly beneath a plan that has no deposit. Moving it is
     * one array position if that trade is worth making.
     *
     * ⚑ SCOPE IS GENERAL SEO ONLY. The source deck also priced Local,
     * International and E-commerce SEO. Those are deliberately not here:
     * four more tabs of three tiers each would triple this section for
     * offers nobody has asked to publish yet. They slot in as their own
     * categories when they are wanted.
     *
     * ⚑ NO SETUP FEE. The deck carried a separate one-time setup charge per
     * tier. It is not shown because the published figures are the rates that
     * were signed off, and inventing a setup number to sit beside them is
     * how a page ends up quoting a price nobody agreed to. If setup is
     * billed, it needs a field of its own and a line on every card.
     */
    {
        id: "seo",
        title: "SEO & Digital Marketing",
        platform: "General SEO retainer",
        bestFor:
            "Businesses that want organic visibility and rankings worked on continuously, as a retainer rather than as a one-time project.",
        tiers: [
            {
                id: "SEO-01",
                segment: "Basic",
                name: "Basic Package",
                badge: "Entry retainer",
                billing: "Monthly retainer, billed in advance",
                timeline: "Rolling, 30 days notice",
                features: [
                    { label: "Keywords", value: "10 keywords optimised." },
                    { label: "On-page", value: "10 pages optimised." },
                    { label: "Content", value: "4 blog posts per month." },
                    { label: "Links", value: "5 quality backlinks per month." },
                    { label: "Reporting", value: "Basic monthly report." },
                    { label: "Revisions", value: "Unlimited." },
                ],
            },
            {
                id: "SEO-02",
                segment: "Standard",
                name: "Standard Package",
                badge: "Most engagements",
                billing: "Monthly retainer, billed in advance",
                timeline: "Rolling, 30 days notice",
                features: [
                    { label: "Keywords", value: "25 keywords optimised." },
                    { label: "On-page", value: "25 pages optimised." },
                    { label: "Content", value: "8 blog posts per month." },
                    { label: "Links", value: "15 quality backlinks per month." },
                    { label: "Reporting", value: "Detailed monthly report with bi-weekly updates." },
                    { label: "Analysis", value: "Quarterly competitor analysis." },
                    { label: "Revisions", value: "Unlimited." },
                ],
            },
            {
                id: "SEO-03",
                segment: "Premium",
                name: "Premium Package",
                badge: "Most popular",
                billing: "Monthly retainer, billed in advance",
                timeline: "Rolling, 30 days notice",
                highlighted: true,
                features: [
                    { label: "Keywords", value: "50 keywords optimised." },
                    { label: "On-page", value: "Unlimited page optimisation." },
                    { label: "Content", value: "16 blog posts per month." },
                    { label: "Links", value: "30 quality backlinks per month." },
                    { label: "Reporting", value: "Advanced monthly report with weekly updates." },
                    { label: "Analysis", value: "Monthly competitor analysis." },
                    { label: "Strategy", value: "Full strategy consultation." },
                    { label: "Revisions", value: "Unlimited." },
                ],
            },
        ],
    },
];

/**
 * Tier id → { amount, original }, both in EUR, excluding VAT.
 *
 * `amount` is what is invoiced. `original` is the list price and drives both
 * the struck figure and the percentage. Drop `original` on a tier and the card
 * renders a single clean price with no discount furniture — which is the right
 * move the day these stop being partner rates.
 *
 * `period` is optional and turns the figure into a rate: set it to "month"
 * and the card renders "€120 /month" and says the saving recurs. Without it
 * the figure reads as a one-time project fee, which is what the four build
 * tracks are. It lives here rather than on the tier because whether a number
 * is a fee or a rate is a property of the number.
 */
export const EURO_PRICES = {
    // Business & Corporate
    "BIZ-01": { amount: 75, original: 150 },
    "BIZ-02": { amount: 299, original: 500 },
    "BIZ-03": { amount: 799, original: 999 },
    // Custom E-Commerce (MERN)
    "MERN-01": { amount: 200, original: 400 },
    "MERN-02": { amount: 499, original: 699 },
    "MERN-03": { amount: 999, original: 1199 },
    // WordPress (WooCommerce)
    "WOO-01": { amount: 75, original: 150 },
    "WOO-02": { amount: 275, original: 400 },
    "WOO-03": { amount: 499, original: 699 },
    // Shopify
    "SHOP-01": { amount: 299, original: 599 },
    "SHOP-02": { amount: 499, original: 899 },
    "SHOP-03": { amount: 999, original: 1199 },
    // General SEO — monthly, so these carry `period`.
    "SEO-01": { amount: 120, original: 150, period: "month" },
    "SEO-02": { amount: 250, original: 300, period: "month" },
    "SEO-03": { amount: 350, original: 500, period: "month" },
};

/**
 * How the fee is invoiced. Shown once above the grid so no card has to repeat
 * it — twelve cards each restating the deposit terms is twelve chances for one
 * of them to go stale.
 */
export const PRICING_TERMS = [
    {
        /* Covers both shapes in one cell rather than adding a fifth. The grid
           is four columns wide, and a deposit rule printed under a retainer
           plan that has no deposit is worse than a slightly longer sentence. */
        title: "Deposit or retainer",
        detail:
            "Builds: 40% up front, balance at agreed milestones, remainder on handover. Retainers are billed monthly in advance.",
    },
    {
        title: "Invoiced in EUR",
        detail: "SEPA bank transfer. All prices exclude VAT; reverse-charge applies for EU businesses.",
    },
    {
        title: "Fixed-scope contract",
        detail: "Written statement of work before a line of code. NDA and DPA available on request.",
    },
    {
        title: "Aftercare included",
        detail: "A post-launch support window on every build, then an optional monthly care plan.",
    },
];

/**
 * The only accessor the route uses. Async for the same reason
 * getPortfolioItems() is: the day this moves behind the dashboard, the body
 * becomes a fetch and no call site changes.
 */
export async function getPricing() {
    return { categories: PRICING_CATEGORIES, prices: EURO_PRICES, terms: PRICING_TERMS };
}
