import { apiFetch } from "./apiServer";
import * as fallback from "./data";

/**
 * Public data layer. Same selector names and signatures as lib/data.js — see
 * PHASE-3-BUILD-GUIDE §5 — so the swap is invisible to every component.
 *
 * Fallback policy: if the API is unreachable, serve the Phase 3 static content
 * rather than a 500. An agency marketing site that shows slightly stale copy
 * during an API outage is strictly better than one that shows nothing, and the
 * build must not fail because the backend is not running on a CI box.
 *
 * The fallback is NOT a cache and must never be used to paper over a 404 — a
 * missing slug has to stay a 404 or the sitemap starts lying.
 *
 * Server-only by construction: ./apiServer imports ./session, which imports
 * next/headers.
 */
async function safe(fetcher, fallbackValue, label) {
    try {
        return await fetcher();
    } catch (err) {
        if (err.status === 404) throw err;
        console.warn(`[api] ${label} fell back to static content: ${err.message}`);
        return fallbackValue;
    }
}

/* ── Services ─────────────────────────────────────────────────────────── */

export const getServices = () =>
    safe(
        async () =>
            (await apiFetch("/services?isActive=true&sort=order&limit=50", { tags: ["services"] }))
                .data,
        fallback.getServices(),
        "getServices",
    );

export const getServiceBySlug = async (slug) => {
    try {
        return (await apiFetch(`/services/${slug}`, { tags: ["services"] })).data;
    } catch (err) {
        if (err.status === 404) return null;
        console.warn(`[api] getServiceBySlug fell back to static content: ${err.message}`);
        return fallback.getServiceBySlug(slug);
    }
};

/* ── Projects ─────────────────────────────────────────────────────────── */

export const getProjects = ({ service, tag, limit } = {}) =>
    safe(
        async () => {
            const qs = new URLSearchParams();
            if (service) qs.set("serviceTypes", service);
            if (tag) qs.set("tags", tag);
            qs.set("limit", String(limit ?? 50));
            return (await apiFetch(`/projects?${qs}`, { tags: ["projects"] })).data;
        },
        fallback.getProjects({ service, tag, limit }),
        "getProjects",
    );

export const getFeaturedProjects = async (limit = 4) => {
    const projects = await getProjects({ limit: 50 });
    return projects.filter((p) => p.featured).slice(0, limit);
};

export const getProjectBySlug = async (slug) => {
    try {
        return (await apiFetch(`/projects/${slug}`, { tags: ["projects"] })).data;
    } catch (err) {
        if (err.status === 404) return null;
        console.warn(`[api] getProjectBySlug fell back to static content: ${err.message}`);
        return fallback.getProjectBySlug(slug);
    }
};

/**
 * Derived, not an endpoint. Built on getProjects() exactly as lib/data.js does —
 * the list is already cached and a second round trip buys nothing.
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

export const getBlogs = ({ category, limit } = {}) =>
    safe(
        async () => {
            const qs = new URLSearchParams();
            if (category && category !== "All") qs.set("category", category);
            qs.set("limit", String(limit ?? 50));
            qs.set("sort", "-publishedAt");
            return (await apiFetch(`/blogs?${qs}`, { tags: ["blogs"] })).data;
        },
        fallback.getBlogs({ category, limit }),
        "getBlogs",
    );

export const getBlogBySlug = async (slug) => {
    try {
        return (await apiFetch(`/blogs/${slug}`, { tags: ["blogs"] })).data;
    } catch (err) {
        if (err.status === 404) return null;
        console.warn(`[api] getBlogBySlug fell back to static content: ${err.message}`);
        return fallback.getBlogBySlug(slug);
    }
};

export const getBlogCategories = async () => {
    const posts = await getBlogs({ limit: 200 });
    return ["All", ...Array.from(new Set(posts.map((b) => b.category).filter(Boolean)))];
};

/** Derived: ranks by tag overlap, exactly as lib/data.js does. */
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

export const getTeam = () =>
    safe(
        async () =>
            (await apiFetch("/team?isActive=true&sort=displayOrder&limit=50", { tags: ["team"] }))
                .data,
        fallback.getTeam(),
        "getTeam",
    );

export const getTestimonials = ({ featuredOnly = false } = {}) =>
    safe(
        async () => {
            const qs = new URLSearchParams({ limit: "50" });
            if (featuredOnly) qs.set("isFeatured", "true");
            return (await apiFetch(`/testimonials?${qs}`, { tags: ["testimonials"] })).data;
        },
        fallback.getTestimonials({ featuredOnly }),
        "getTestimonials",
    );

/* ── Site content ─────────────────────────────────────────────────────────
   The four marketing blocks that used to be imported straight from lib/data by
   the routes that render them: the metrics band, the FAQ, the process steps
   and the engagement shapes. They are now a SiteContent collection with an
   /admin/site-content screen behind them, so a non-developer can edit the
   homepage numbers without a deploy.

   Same fallback policy as everything else above — an unreachable API serves
   the static copy in lib/data rather than an empty page. `key` is validated
   server-side against an enum, so a typo here is a 404 that falls back rather
   than an empty block nobody notices.

   ⚑ Adding a block means three edits landing together: the enum in the
   backend's models/SiteContent.js, a shape in its validators, and a fallback
   entry in FALLBACK_CONTENT below. A key with no fallback entry degrades to an
   empty array during an outage instead of to its static copy.
   ──────────────────────────────────────────────────────────────────────── */

const FALLBACK_CONTENT = {
    metrics: () => fallback.metrics,
    faqs: () => fallback.faqs,
    process: () => fallback.processSteps,
    capabilities: () => fallback.capabilities,
};

export const getSiteContent = async (key) => {
    const staticCopy = FALLBACK_CONTENT[key]?.() ?? [];

    const items = await safe(
        async () =>
            (await apiFetch(`/site-content/${key}`, { tags: ["site-content"] })).data.items,
        staticCopy,
        `getSiteContent(${key})`,
    );

    /* An EMPTY block also falls back, which is the one place this differs from
       the collection selectors above.

       The failure it prevents is the likely one: the API deploys before anyone
       runs the seed, every block returns [], and the homepage ships with no
       metrics band and no FAQ — a silent content outage that looks like a
       layout bug and gets diagnosed slowly.

       The cost is that a block cannot be deliberately emptied from the
       dashboard; saving zero rows restores the static copy instead. That is
       the right trade for four blocks that are structural to their pages —
       nobody wants a homepage with the FAQ section present and empty. ⚑ If a
       future block IS legitimately optional, it needs its own selector rather
       than a flag here. */
    return items.length ? items : staticCopy;
};

/* ── Page meta ────────────────────────────────────────────────────────── */

/** Public per-page SEO/hero copy. Null when the page has no row yet. */
export const getPageMeta = async (identifier) => {
    try {
        return (await apiFetch(`/page-meta/${identifier}`, { tags: ["page-meta"] })).data;
    } catch {
        return null;
    }
};

/* — internals — */
function overlap(a = [], b = []) {
    return a.filter((x) => b.includes(x)).length;
}
