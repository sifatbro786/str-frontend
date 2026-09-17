import PackagesContent from "@/components/packages/PackagesContent";
import { buildMetadata } from "@/lib/seo";

/**
 * /overview — kept alive on purpose. This is NOT a second page.
 *
 * ── WHY IT STILL EXISTS ──────────────────────────────────────────────────
 * This address was sent to clients directly, in email and in proposals, back
 * when it was the catalogue-and-pricing route. Those links are in inboxes we
 * cannot edit, so deleting the folder would turn every one of them into a 404
 * on a page a prospect was told to look at. It renders the same component
 * /packages renders and always will.
 *
 * ── WHY IT IS NOT A REDIRECT ─────────────────────────────────────────────
 * A 301 in next.config.mjs would also keep those links working and is the
 * smaller amount of code. It was a deliberate call to serve the page instead,
 * so the old link lands on content rather than bouncing. If that trade is ever
 * revisited, the replacement is one line in `redirects()` and deleting this
 * folder — nothing else references this path.
 *
 * ── WHAT KEEPS IT FROM COMPETING WITH /packages ──────────────────────────
 * Two things, and both are load-bearing:
 *
 *   1. `identifier` and `path` below are "packages" and "/packages", not
 *      "overview". buildMetadata sets alternates.canonical from `path`, so
 *      every render of this route tells Google the real URL is /packages and
 *      the two stop being duplicate content. It also means this page inherits
 *      the Packages row from /admin/page-meta rather than needing a row of its
 *      own — which is why "overview" was dropped from the PageMeta enum, the
 *      validator's IDENTIFIERS and the admin list.
 *
 *   2. This route is NOT in app/sitemap.js. A sitemap is a list of URLs you
 *      want indexed; listing a page that canonicalises elsewhere asks the
 *      crawler to resolve a contradiction you created yourself.
 *
 * `path` is passed to PackagesContent separately and DOES say "/overview":
 * the breadcrumb and Offer urls in the JSON-LD have to name the URL actually
 * being served. Canonical points at the preferred URL, structured data
 * describes the current one — different questions, different answers.
 */
export async function generateMetadata() {
    return buildMetadata({
        identifier: "packages",
        ogKicker: "Pricing",
        path: "/packages",
        title: "Packages and pricing",
        description:
            "Published EUR rates from STR Solutions Ltd — Next.js business sites, custom MERN e-commerce, WooCommerce and Shopify builds, and monthly SEO retainers.",
    });
}

export default async function OverviewPage() {
    return <PackagesContent path="/overview" />;
}
