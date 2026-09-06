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
      (await apiFetch("/services?isActive=true&sort=order&limit=50", { tags: ["services"] })).data,
    fallback.getServices(),
    "getServices"
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
    "getProjects"
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
    "getBlogs"
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
      (await apiFetch("/team?isActive=true&sort=displayOrder&limit=50", { tags: ["team"] })).data,
    fallback.getTeam(),
    "getTeam"
  );

export const getTestimonials = ({ featuredOnly = false } = {}) =>
  safe(
    async () => {
      const qs = new URLSearchParams({ limit: "50" });
      if (featuredOnly) qs.set("isFeatured", "true");
      return (await apiFetch(`/testimonials?${qs}`, { tags: ["testimonials"] })).data;
    },
    fallback.getTestimonials({ featuredOnly }),
    "getTestimonials"
  );

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
