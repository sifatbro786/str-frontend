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
 * Last-resort src for an <Image> whose record has no artwork yet.
 *
 * next/image throws on an empty or null src and takes the whole route down with
 * it. That was tolerable while every image came from the seed and was therefore
 * always present; now that covers and thumbnails are uploaded per record from
 * the dashboard, "saved without a picture" is a normal state and a 500 is not an
 * acceptable response to it. The logo is deliberately the wrong shape for a
 * 16:10 card, so a missing upload looks wrong to the editor instead of looking
 * like a design choice.
 */
export const MEDIA_FALLBACK = "/logo.png";

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
