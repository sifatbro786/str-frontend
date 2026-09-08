import { site } from "@/lib/site";

/**
 * robots.txt, generated.
 *
 * ── WHY THIS IS A ROUTE AND NOT A FILE IN /public ────────────────────────
 * The sitemap line has to carry an absolute URL, and a static file would
 * hard-code the production domain. Every preview deploy would then point
 * crawlers at production, and a staging domain that leaks into the index is
 * a duplicate-content problem that takes weeks to clear.
 *
 * ── THE NOINDEX GUARD ⚑ ──────────────────────────────────────────────────
 * Preview and staging deploys block everything. This keys off
 * NEXT_PUBLIC_SITE_ENV rather than NODE_ENV, because a Vercel preview build
 * IS a production build — NODE_ENV is "production" there too, and using it
 * would leave previews fully crawlable. Set NEXT_PUBLIC_SITE_ENV=production
 * on the live environment ONLY.
 *
 * Getting this backwards in either direction is expensive: block production
 * and the site vanishes from search; allow staging and you compete with
 * yourself. It is worth checking /robots.txt by eye after the first deploy.
 */
export default function robots() {
    const isLive = process.env.NEXT_PUBLIC_SITE_ENV === "production";

    if (!isLive) {
        return {
            rules: [{ userAgent: "*", disallow: "/" }],
        };
    }

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/admin",
                    "/admin/",
                    "/login",
                    // /api/admin is the BFF proxy and /api/auth handles sessions.
                    // Neither returns anything a crawler should hold, and both would
                    // waste crawl budget on 401s.
                    "/api/",
                ],
            },
        ],
        sitemap: `${site.url}/sitemap.xml`,
        host: site.url,
    };
}
