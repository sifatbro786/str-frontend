/**
 * Minimal class joiner. Deliberately NOT clsx + tailwind-merge — this project
 * has no conditional-variant explosion, and two dependencies to concatenate
 * strings is how bundles get fat. Swap in tailwind-merge only if we start
 * overriding utilities across component boundaries.
 */
export function cn(...parts) {
    return parts.filter(Boolean).join(" ");
}

/** "2025-07-22T06:00:00.000Z" → "22 Jul 2025". Locale-stable, SSR-safe. */
export function formatDate(value, { long = false } = {}) {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: long ? "long" : "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(d);
}

/**
 * API origin, derived rather than configured.
 *
 * NEXT_PUBLIC_API_URL is ".../api/v1"; uploaded media is served from the same
 * host at /uploads, outside the API mount. A second env var for the origin is
 * one more thing to forget on a domain move, and the two would disagree
 * silently — a blank image, no error. Deriving it means one value to change.
 */
const API_ORIGIN = (() => {
    try {
        return new URL(process.env.NEXT_PUBLIC_API_URL).origin;
    } catch {
        return "";
    }
})();

/**
 * Resolves a stored media reference to something <Image> can load.
 *
 *   "/uploads/services/x.webp"  → "https://api.example.com/uploads/services/x.webp"
 *   "/websites/paarel.png"      → unchanged (it is in this app's /public)
 *   "https://cdn.../x.webp"     → unchanged
 *   "" | null | undefined       → null, so callers can branch on it
 *
 * Only /uploads is rewritten. Rewriting every relative path would break every
 * asset that genuinely lives in /public, and next.config.mjs only whitelists
 * the API host in remotePatterns, so anything else pointed at a remote origin
 * would fail the optimiser anyway.
 */
export function mediaUrl(src) {
    if (!src) return null;
    if (/^https?:\/\//i.test(src)) return src;
    if (src.startsWith("/uploads/")) return API_ORIGIN ? `${API_ORIGIN}${src}` : src;
    return src;
}

/** Zero-pads a 1-based list position for the "01 //" index markers. */
export function pad(n, width = 2) {
    return String(n).padStart(width, "0");
}
