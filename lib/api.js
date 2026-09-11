import { apiFetch } from "./apiServer";

/**
 * Public data layer. Every public route reads through these selectors and
 * nothing else.
 *
 * ── THE STATIC FALLBACK IS GONE, AND SO IS lib/data.js ───────────────────
 * This module used to wrap every call in a `safe()` helper that swallowed the
 * error and served a hard-coded copy of the content from lib/data.js. That
 * made an API outage invisible: the site kept rendering, so nobody noticed for
 * days, and worse, an edit made in the dashboard could be silently replaced on
 * the live site by seed copy from a file last touched months earlier. The two
 * sources drifted and there was no signal when they did.
 *
 * The database is now the only source. lib/data.js has been deleted.
 *
 * ── WHAT REPLACES IT ON AN OUTAGE ────────────────────────────────────────
 * Next's own ISR, which does the same job properly. These list calls are
 * tagged and revalidated, so a page that has rendered once is cached; when a
 * later revalidation fails, Next keeps serving the last GOOD render rather
 * than an error. That is the same "stale content beats no content" trade the
 * fallback was hand-rolling, except the stale content is real published data
 * instead of a developer's copy of it.
 *
 * So errors are deliberately NOT caught here. A failure on a cold route is a
 * 500, which is the honest answer and which Google retries. Catching it and
 * returning [] would render an empty page, and ISR would then cache that empty
 * page and serve it for the full revalidate window.
 *
 * ⚑ Consequence worth knowing: an unseeded database is an empty site, not a
 * site showing defaults. Run the backend's `npm run seed` against every
 * environment before pointing a frontend at it.
 *
 * Server-only by construction: ./apiServer imports ./session, which imports
 * next/headers.
 */

/* ── Services ─────────────────────────────────────────────────────────── */

export const getServices = async () =>
    (await apiFetch("/services?isActive=true&sort=order&limit=50", { tags: ["services"] })).data;

/**
 * Detail selectors answer null on 404 and throw on everything else. The
 * distinction matters: notFound() on a missing slug is correct and keeps the
 * sitemap honest, while turning a 502 into a 404 tells Google a real page has
 * been deleted and gets it dropped from the index.
 */
export const getServiceBySlug = async (slug) => {
    try {
        return (await apiFetch(`/services/${slug}`, { tags: ["services"] })).data;
    } catch (err) {
        if (err.status === 404) return null;
        throw err;
    }
};

/* ── Projects ─────────────────────────────────────────────────────────── */

export const getProjects = async ({ service, tag, limit } = {}) => {
    const qs = new URLSearchParams();
    if (service) qs.set("serviceTypes", service);
    if (tag) qs.set("tags", tag);
    qs.set("limit", String(limit ?? 50));
    return (await apiFetch(`/projects?${qs}`, { tags: ["projects"] })).data;
};

export const getFeaturedProjects = async (limit = 4) => {
    const projects = await getProjects({ limit: 50 });
    return projects.filter((p) => p.featured).slice(0, limit);
};

export const getProjectBySlug = async (slug) => {
    try {
        return (await apiFetch(`/projects/${slug}`, { tags: ["projects"] })).data;
    } catch (err) {
        if (err.status === 404) return null;
        throw err;
    }
};

/**
 * Derived, not an endpoint. Built on getProjects() so the already-cached list
 * is reused — a second round trip would buy nothing.
 */
export const getProjectNeighbours = async (slug) => {
    const ordered = await getProjects();
    const i = ordered.findIndex((p) => p.slug === slug);
    if (i === -1) return { prev: null, next: null };
    return {
        prev: ordered[(i - 1 + ordered.length) % ordered.length],
        next: ordered[(i + 1) % ordered.length],
    };
};

/** Every distinct tag across the catalogue — powers the /projects filter rail. */
export const getProjectTags = async () => {
    const projects = await getProjects({ limit: 200 });
    return Array.from(new Set(projects.flatMap((p) => p.tags ?? []))).sort();
};

/* ── Blogs ────────────────────────────────────────────────────────────── */

export const getBlogs = async ({ category, limit } = {}) => {
    const qs = new URLSearchParams();
    if (category && category !== "All") qs.set("category", category);
    qs.set("limit", String(limit ?? 50));
    qs.set("sort", "-publishedAt");
    return (await apiFetch(`/blogs?${qs}`, { tags: ["blogs"] })).data;
};

export const getBlogBySlug = async (slug) => {
    try {
        return (await apiFetch(`/blogs/${slug}`, { tags: ["blogs"] })).data;
    } catch (err) {
        if (err.status === 404) return null;
        throw err;
    }
};

export const getBlogCategories = async () => {
    const posts = await getBlogs({ limit: 200 });
    return ["All", ...Array.from(new Set(posts.map((b) => b.category).filter(Boolean)))];
};

/** Derived: ranks by tag overlap. */
export const getRelatedBlogs = async (slug, limit = 3) => {
    const current = await getBlogBySlug(slug);
    const posts = await getBlogs({ limit: 200 });
    if (!current) return posts.slice(0, limit);
    return posts
        .filter((b) => b.slug !== slug)
        .sort((a, b) => overlap(b.tags, current.tags) - overlap(a.tags, current.tags))
        .slice(0, limit);
};

/* ── Team & testimonials ──────────────────────────────────────────────── */

export const getTeam = async () =>
    (await apiFetch("/team?isActive=true&sort=displayOrder&limit=50", { tags: ["team"] })).data;

export const getTestimonials = async ({ featuredOnly = false } = {}) => {
    const qs = new URLSearchParams({ limit: "50" });
    if (featuredOnly) qs.set("isFeatured", "true");
    return (await apiFetch(`/testimonials?${qs}`, { tags: ["testimonials"] })).data;
};

/* ── Site content ─────────────────────────────────────────────────────────
   The marketing blocks behind /admin/site-content: the metrics band, the FAQ,
   the process steps, the engagement shapes and the client logo rail.

   ⚑ Adding a block means four edits landing together: the enum in the
   backend's models/SiteContent.js, a shape in its validators, a row in its
   seed/siteContent.js, and a BLOCKS entry in the admin screen. There is no
   longer a fallback map here to forget about — an unknown key is a 404 that
   throws, which is what you want, because a typo used to degrade to an empty
   array that nobody noticed.
   ──────────────────────────────────────────────────────────────────────── */

/**
 * A key in the enum with no row yet answers 200 with an empty list, not 404 —
 * "nobody has filled this in" is not an error. So an empty array here is a
 * real answer, and every section that renders one of these blocks returns null
 * on empty rather than rendering a heading above nothing.
 */
export const getSiteContent = async (key) =>
    (await apiFetch(`/site-content/${key}`, { tags: ["site-content"] })).data.items;

/* ── Page meta ────────────────────────────────────────────────────────── */

/**
 * Public per-page SEO/hero copy. Null when the page has no row yet.
 *
 * This one DOES swallow its error, and it is the single deliberate exception.
 * buildMetadata() calls it for every route, and page metadata already has a
 * complete set of code defaults behind it — failing a whole route because the
 * optional SEO override could not be read would be a worse outcome than
 * shipping that route's default title.
 */
export const getPageMeta = async (identifier) => {
    try {
        return (await apiFetch(`/page-meta/${identifier}`, { tags: ["page-meta"] })).data;
    } catch {
        return null;
    }
};

/* ── Build-time helper ────────────────────────────────────────────────── */

/**
 * For generateStaticParams only.
 *
 * A build box cannot always reach the API — a cold Render instance, a CI
 * runner outside the allow-list, a first deploy where the two halves go out
 * together. Failing the build there is not the honest-failure case the rest of
 * this file argues for; it is a deployment ordering problem, and the routes
 * that would have been prerendered still render on demand because every
 * [slug] route sets `dynamicParams = true`.
 *
 * Use it ONLY in generateStaticParams. Anywhere else it is the swallowed error
 * this module just deleted.
 */
export const paramsOrEmpty = async (fetcher) => {
    try {
        return await fetcher();
    } catch (err) {
        console.warn(`[api] prerender list unavailable, falling back to on-demand: ${err.message}`);
        return [];
    }
};

/* — internals — */
function overlap(a = [], b = []) {
    return a.filter((x) => b.includes(x)).length;
}
