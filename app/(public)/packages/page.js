import PackagesContent from "@/components/packages/PackagesContent";
import { buildMetadata } from "@/lib/seo";

/**
 * /packages — the published rates and the library they buy.
 *
 * ── WHAT THIS ROUTE USED TO BE ───────────────────────────────────────────
 * The bilingual BDT catalogue, rendered from the Package / PackageCategory /
 * PackagePage collections and edited at /admin/packages. All of it is gone:
 * the three models, package.controller.js, package.routes.js,
 * package.validator.js, the seed pair, components/packages/PackagesView.jsx
 * and PackageTiers.jsx, components/admin/packages/*, lib/packagesUi.js, the
 * `packages` entries in the admin proxy allow-list and the revalidate tag set,
 * and getPackages() in lib/api.js. If any of those names still resolves,
 * something was missed.
 *
 * With the API call went the reason this route was dynamic. It read
 * `searchParams` for ?lang=bn, which opted it out of static generation; there
 * is no locale switch any more, so it is a plain static page again and the
 * hreflang alternates that declared the Bengali view went with it.
 *
 * ── WHAT IT IS NOW ───────────────────────────────────────────────────────
 * The content that was at /overview, framed as packages. The body lives in
 * components/packages/PackagesContent.jsx because /overview still renders it
 * too — see that file's header, and the header of the /overview route.
 *
 * ── WHAT LIVES WHERE ─────────────────────────────────────────────────────
 *   · tracks, tiers, features, terms  → lib/pricingData.js (static, EUR)
 *   · the sample library             → lib/catalogue.js (static)
 *   · the five discipline ids        → lib/disciplines.js
 *   · title / description / OG image → PageMeta, /admin/page-meta → Packages
 *   · contact email, WhatsApp        → lib/site.js
 *
 * ⚑ "packages" is enumerated in three places and they move together: the
 * schema enum in str-backend/src/models/PageMeta.js, IDENTIFIERS in
 * str-backend/src/validators/pageMeta.validator.js, and the admin list in
 * app/(admin)/admin/page-meta/page.js. Drop it from any one and the dashboard
 * silently stops affecting this page — getPageMeta swallows its own failures
 * and returns null, so the fallbacks below keep rendering and nothing reports
 * that the row is being ignored.
 *
 * ⚑ The stored row for this identifier was written for the BDT catalogue. It
 * still resolves and still wins over the fallbacks below, so its copy needs
 * rewriting at /admin/page-meta → Packages or this page ships a title about a
 * page that no longer exists.
 */
export async function generateMetadata() {
    return buildMetadata({
        identifier: "packages",
        ogKicker: "Pricing",
        path: "/packages",
        title: "Packages and pricing",
        /* Kept under 160 characters. The dashboard field enforces that cap
           because Google truncates past roughly there, and a fallback that
           would itself be cut is a fallback that fails the same test. */
        description:
            "Published EUR rates from STR Solutions Ltd — Next.js business sites, custom MERN e-commerce, WooCommerce and Shopify builds, and monthly SEO retainers.",
    });
}

export default async function PackagesPage() {
    return <PackagesContent path="/packages" />;
}
