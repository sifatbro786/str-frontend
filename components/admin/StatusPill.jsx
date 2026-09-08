import { cn } from "@/lib/utils";

/**
 * Status badge for the admin tables.
 *
 * ── WHY THIS ONE IS ROUNDED AND FILLED ───────────────────────────────────
 * The public site's badges are square hairlines on purpose. This is not the
 * public site: it sits in a dense table where a status has to be readable at a
 * glance in a column of forty rows, and a tinted rounded pill is the shape
 * every person scanning a dashboard already knows how to read. Distinctive is
 * the wrong goal in a table cell.
 *
 * Tone carries meaning, never decoration: attention-needed is orange, settled
 * is green, done-and-inert is neutral. Anything unmapped falls to neutral
 * rather than throwing, so a new status value from the API degrades to "shown
 * but uncoloured" instead of a blank cell.
 */
const TONES = {
    new: "bg-signal/12 text-signal",
    contacted: "bg-brand/12 text-brand",
    closed: "bg-(--raised-2) text-(--text-mute)",
    published: "bg-leaf/14 text-leaf",
    active: "bg-leaf/14 text-leaf",
    featured: "bg-leaf/14 text-leaf",
    draft: "bg-(--raised-2) text-(--text-mute)",
    inactive: "bg-(--raised-2) text-(--text-mute)",
};

export default function StatusPill({ value, label }) {
    const tone = TONES[value] ?? "bg-(--raised-2) text-(--text-mute)";
    return (
        <span
            className={cn(
                "inline-block rounded-full px-2.5 py-1 text-[0.75rem] font-medium capitalize",
                tone,
            )}
        >
            {label ?? value}
        </span>
    );
}
