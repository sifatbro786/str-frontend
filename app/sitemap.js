import { site } from "@/lib/site";
import { getBlogs, getProjects, getServices } from "@/lib/api";

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
 * it stays honest. Every entry below takes the record's real updatedAt.
 * Setting `new Date()` on everything — the common shortcut — tells the
 * crawler the entire site changed today, every day, and the signal gets
 * ignored within a few crawls.
 *
 * ⚑ priority and changeFrequency are NOT read by Google and have not been for
 * years. They are included because Bing and several smaller crawlers still
 * use them, and because leaving them out invites someone to "fix" it later.
 * Do not spend time tuning them.
 *
 * ── WHY IT CANNOT THROW ──────────────────────────────────────────────────
 * lib/api swallows fetch failures and falls back to static content, so a
 * backend outage yields a sitemap of the static catalogue rather than a 500.
 * A 500 on /sitemap.xml is treated as an error by Search Console and repeated
 * errors get the sitemap dropped.
 */
export const revalidate = 3600;

const iso = (d) => (d ? new Date(d) : new Date());

export default async function sitemap() {
    const [services, projects, blogs] = await Promise.all([
        getServices(),
        getProjects({ limit: 200 }),
        getBlogs({ limit: 200 }),
    ]);

    const staticRoutes = [
        { path: "/", priority: 1, changeFrequency: "weekly" },
        { path: "/services", priority: 0.9, changeFrequency: "monthly" },
        { path: "/projects", priority: 0.9, changeFrequency: "weekly" },
        { path: "/about", priority: 0.7, changeFrequency: "monthly" },
        { path: "/blogs", priority: 0.8, changeFrequency: "weekly" },
        { path: "/contact", priority: 0.8, changeFrequency: "yearly" },
        // Legal pages are linked in the footer and must be crawlable, but they
        // should never outrank a service page for anything.
        { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
        { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
    ].map((r) => ({
        url: new URL(r.path, site.url).toString(),
        lastModified: new Date(),
        changeFrequency: r.changeFrequency,
        priority: r.priority,
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
