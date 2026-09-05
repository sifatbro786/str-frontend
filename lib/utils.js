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

/** Zero-pads a 1-based list position for the "01 //" index markers. */
export function pad(n, width = 2) {
  return String(n).padStart(width, "0");
}
