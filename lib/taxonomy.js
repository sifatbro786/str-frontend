/**
 * Enums and label maps.
 *
 * These are the one piece of the old static content layer that survives it.
 * They are not content: they are the contract between this app and
 * Project.serviceTypes, and a client component (ProjectRail's filter) needs
 * them in the browser bundle. Everything that used to sit beside them in
 * lib/data.js now comes from the API.
 *
 * ⚑ These slugs are derived by the backend from the service TITLE, through
 * str-backend/src/utils/slug.js. Editing a title in /admin/services rewrites
 * its slug, and this list then has to follow or the /projects filter silently
 * shows an empty rail for that discipline. The backend's Project.SERVICE_TYPES
 * enum is the same list and both must move together.
 */

/** Mirrors Project.serviceTypes' enum, in display order. */
export const SERVICE_TYPES = [
    "website-development",
    "software-development",
    "business-and-it-consultancy",
    "graphic-design",
    "digital-marketing",
    "data-science-and-analytics",
    "2d-3d-design-and-animation",
    "dashboard-development",
    "mobile-app-development",
];

/**
 * slug → SHORT label, for tags, filter rails and case-study meta rows.
 *
 * Deliberately not the full service title: "Business & IT Consultancy" in a
 * filter chip wraps to two lines on a phone and pushes the rail out of the
 * viewport. The full title comes from the record itself wherever there is room
 * for it.
 */
export const SERVICE_LABELS = {
    "website-development": "Web Development",
    "software-development": "Software",
    "business-and-it-consultancy": "Consultancy",
    "graphic-design": "Graphic Design",
    "digital-marketing": "Digital Marketing",
    "data-science-and-analytics": "Data & Analytics",
    "2d-3d-design-and-animation": "2D/3D & Animation",
    "dashboard-development": "Dashboards",
    "mobile-app-development": "Mobile Apps",
};

/**
 * ── SERVICE_MEDIA IS GONE ────────────────────────────────────────────────
 * Artwork used to be a hardcoded slug → /public path map here, which meant
 * adding a service in the dashboard produced a page with a broken <Image>
 * until a developer deployed a new entry. It now lives on the record as
 * `Service.image`, uploaded from /admin/services and served by the API.
 *
 * Resolve a stored path for rendering with mediaUrl() from lib/utils.js.
 */
