import { site } from "@/lib/site";
import { getBlogs, getProjects, getServices, paramsOrEmpty } from "@/lib/api";

/**
 * sitemap.xml, generated from the live catalogue.
 *
 * ── WHY IT IS GENERATED ──────────────────────────────────────────────────
 * A hand-maintained sitemap is wrong the day after it is written. Every
 * service, case study and post published from the admin panel appears here on
 * the next revalidation with no developer involved, which is the same promise
 * lib/seo.js makes about titles.
 *
 * ── lastModified IS NOT DECORATION ───────────────────────────────────────
 * Google uses it to prioritise recrawls, and it only keeps trusting it while
 * it stays honest. Setting `new Date()` on everything — the common shortcut —
 * tells the crawler the entire site changed today, every day, and the signal
 * gets discounted within a few crawls. That discount is not per-URL: it is
 * applied to the sitemap, so ten lying static routes also devalue the date on
 * the detail pages, where it is true and actually useful.
 *
 * ⚑ This file used to do exactly that, one paragraph under the warning
 * against it: every static route carried `new Date()`, re-stamped hourly by
 * the revalidate below. So the rule is now mechanical rather than advisory —
 * a route gets a date only where a real one exists:
 *
 *   /, /services, /projects, /blogs   newest updatedAt in what they list
 *   detail pages                      that record's own updatedAt
 *   everything else                   NO lastModified at all
 *
 * Omitting is deliberate. lastModified is optional in the sitemap protocol
 * and in Next's type, and "I don't know" is a better answer to a crawler than
 * a number that is always today.
 *
 * ⚑ priority and changeFrequency are NOT read by Google and have not been for
 * years. They are included because Bing and several smaller crawlers still
 * use them, and because leaving them out invites someone to "fix" it later.
 * Do not spend time tuning them.
 *
 * ── WHY IT CANNOT THROW ──────────────────────────────────────────────────
 * lib/api no longer swallows anything, so each list is wrapped here instead.
 * A backend outage yields a sitemap of the ten static routes rather than a
 * 500: Search Console treats a 500 on /sitemap.xml as an error, and repeated
 * errors get the sitemap dropped entirely. A short sitemap costs nothing —
 * the missing URLs are already indexed and are re-listed on the next hourly
 * revalidation.
 *
 * This is the one place the swallow is correct, which is why it is spelled out
 * here rather than hidden back inside the selectors.
 */
export const revalidate = 3600;

const iso = (d) => (d ? new Date(d) : new Date());

/** Newest updatedAt across a list, or undefined when the list is empty. */
const newest = (rows) => {
    const stamps = rows
        .map((r) => r.updatedAt ?? r.publishedAt ?? r.createdAt)
        .filter(Boolean)
        .map((d) => new Date(d).getTime())
        .filter((t) => Number.isFinite(t));
    return stamps.length ? new Date(Math.max(...stamps)) : undefined;
};

export default async function sitemap() {
    const [services, projects, blogs] = await Promise.all([
        paramsOrEmpty(() => getServices()),
        /* ⚑ 100, not 200. ApiFeatures caps every list at maxLimit: 100 and
           clamps silently — no error, no header, just a short array. Asking
           for 200 did not fetch 200, it fetched 100 and read as if it had
           worked. The number here now matches what the API will actually
           return, so the day the catalogue passes 100 this is a visible
           limit to raise rather than an invisible truncation. */
        paramsOrEmpty(() => getProjects({ limit: 100 })),
        paramsOrEmpty(() => getBlogs({ limit: 100 })),
    ]);

    /* An index page is only as fresh as the newest thing on it, which is a
       real signal and cheap — these three lists are already in memory. */
    const servicesTouched = newest(services);
    const projectsTouched = newest(projects);
    const blogsTouched = newest(blogs);
    // The homepage renders all three, so it is as fresh as the freshest.
    const homeTouched = newest([
        ...services,
        ...projects,
        ...blogs,
    ]);

    const staticRoutes = [
        { path: "/", priority: 1, changeFrequency: "weekly", lastModified: homeTouched },
        { path: "/services", priority: 0.9, changeFrequency: "monthly", lastModified: servicesTouched },
        { path: "/projects", priority: 0.9, changeFrequency: "weekly", lastModified: projectsTouched },
        /* Unlinked from the navbar, so the sitemap is the only route a crawler
           has to it. Ranked with /packages because the queries it answers are
           transactional ("clipping path service", "background removal price")
           rather than brand ones. */
        { path: "/graphics", priority: 0.8, changeFrequency: "monthly" },
        /* The rates and the sample library, linked from the navbar and the
           footer. It sits below /projects on purpose: the case studies are the
           pages that should rank.

           ⚑ /overview renders this same page and is deliberately NOT listed.
           It exists only so the links that went to clients under the old
           address keep answering 200, and it canonicalises to /packages — so
           submitting it here would ask the crawler to resolve a contradiction
           we created ourselves. See app/(public)/overview/page.js. */
        { path: "/packages", priority: 0.8, changeFrequency: "monthly" },
        { path: "/about", priority: 0.7, changeFrequency: "monthly" },
        { path: "/blogs", priority: 0.8, changeFrequency: "weekly", lastModified: blogsTouched },
        { path: "/contact", priority: 0.8, changeFrequency: "yearly" },
        // Legal pages are linked in the footer and must be crawlable, but they
        // should never outrank a service page for anything.
        { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
        { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
    ].map((r) => ({
        url: new URL(r.path, site.url).toString(),
        changeFrequency: r.changeFrequency,
        priority: r.priority,
        /* Spread, not `lastModified: r.lastModified`. An explicit `undefined`
           key still serialises to an empty <lastmod/> element, which is worse
           than no element at all — some validators reject it outright. */
        ...(r.lastModified ? { lastModified: r.lastModified } : {}),
    }));

    const serviceRoutes = services.map((s) => ({
        url: new URL(`/services/${s.slug}`, site.url).toString(),
        lastModified: iso(s.updatedAt ?? s.createdAt),
        changeFrequency: "monthly",
        priority: 0.8,
    }));

    const projectRoutes = projects.map((p) => ({
        url: new URL(`/projects/${p.slug}`, site.url).toString(),
        lastModified: iso(p.updatedAt ?? p.createdAt),
        changeFrequency: "monthly",
        priority: p.featured ? 0.8 : 0.6,
    }));

    const blogRoutes = blogs.map((b) => ({
        url: new URL(`/blogs/${b.slug}`, site.url).toString(),
        lastModified: iso(b.updatedAt ?? b.publishedAt ?? b.createdAt),
        changeFrequency: "yearly",
        priority: 0.6,
    }));

    return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...blogRoutes];
}
