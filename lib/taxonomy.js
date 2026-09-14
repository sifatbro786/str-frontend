/**
 * Service taxonomy helpers.
 *
 * ── THE LIST LIVES IN THE DASHBOARD, NOT HERE ────────────────────────────
 * This file used to export SERVICE_TYPES, a hardcoded array of nine slugs
 * mirroring the enum in str-backend/src/models/Project.js. Between them they
 * meant "add a service" was a code change in two repos plus a deploy: a
 * discipline created at /admin/services did not appear in the project form's
 * checkbox grid, did not appear in any filter, and was rejected with a 400 if
 * it was sent anyway. Nothing in the UI said why.
 *
 * Both lists are gone. Services come from GET /services — `getServices()` in
 * lib/api.js — and the backend validates project.serviceTypes against the same
 * collection. This file is now only the part that is genuinely presentational:
 * how a slug is WRITTEN once you have one.
 *
 * ⚑ Server components fetch services and pass them down. Client components
 * (the filter rail, the admin checkbox grid) take them as a prop or load them
 * through useResource — never by importing a list from here, because there
 * isn't one.
 */

/**
 * slug → SHORT label, for tags, filter rails and case-study meta rows.
 *
 * An OVERRIDE map, not the taxonomy. A service is perfectly usable without an
 * entry here — `serviceLabel()` falls back to the service's own title, and
 * then to a humanised slug. Entries exist only where the real title is too
 * long for the places it gets rendered: "Business & IT Consultancy" in a
 * filter chip wraps to two lines on a phone and pushes the rail out of the
 * viewport.
 *
 * Adding a service does NOT require adding a line here. Add one only when the
 * full title is visibly too long in a chip.
 */
export const SERVICE_LABELS = {
    "website-development": "Web Development",
    "software-development": "Software",
    "business-consultancy": "Consultancy",
    "business-and-it-consultancy": "Consultancy",
    "graphic-design": "Graphic Design",
    "digital-marketing": "Digital Marketing",
    "data-science-and-analytics": "Data & Analytics",
    "2d-3d-design-and-animation": "2D/3D & Animation",
    "dashboard-development": "Dashboards",
    "mobile-app-development": "Mobile Apps",
};

/**
 * "video-editing" → "Video Editing".
 *
 * The last resort, for a slug whose Service document is not to hand — a
 * project tagged with a service that was deleted, or a component rendering a
 * tag before its services have loaded. Rendering the raw slug there is what
 * produced "2d-3d-design-and-animation" in the middle of a sentence.
 */
function humanise(slug) {
    return String(slug)
        .split("-")
        .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
        .join(" ");
}

/**
 * How to write one service slug.
 *
 *   serviceLabel("video-editing")                    → "Video Editing"
 *   serviceLabel("video-editing", services)          → "Video Editing" (its title)
 *   serviceLabel("website-development", services)    → "Web Development" (override)
 *
 * `services` is whatever getServices() returned, or omitted. The override wins
 * over the title on purpose: the title is what the service is called, the
 * override is what fits in a chip.
 */
export function serviceLabel(slug, services) {
    if (!slug) return "";
    if (SERVICE_LABELS[slug]) return SERVICE_LABELS[slug];

    const title = services?.find?.((s) => s.slug === slug)?.title;
    return title || humanise(slug);
}

/**
 * Services → the `[{ value, label }]` shape the filter rails and the admin
 * checkbox grid render from, in the order the dashboard defines.
 *
 * Falsy input yields an empty array rather than throwing, so a component that
 * renders before its fetch resolves shows no filters instead of no page.
 */
export function serviceOptions(services) {
    if (!Array.isArray(services)) return [];
    return services
        .filter((s) => s?.slug)
        .map((s) => ({ value: s.slug, label: serviceLabel(s.slug, services) }));
}

/**
 * ── SERVICE_MEDIA IS GONE ────────────────────────────────────────────────
 * Artwork used to be a hardcoded slug → /public path map here, which meant
 * adding a service in the dashboard produced a page with a broken <Image>
 * until a developer deployed a new entry. It now lives on the record as
 * `Service.image`, uploaded from /admin/services and served by the API.
 *
 * Resolve a stored path for rendering with mediaUrl() from lib/utils.js.
 */
