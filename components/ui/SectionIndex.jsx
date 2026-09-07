import { cn } from "@/lib/utils";

/**
 * The eyebrow replacement. Renders a section's number and name as quiet type.
 *
 * ── WHAT CHANGED, AND WHY ────────────────────────────────────────────────
 * This used to render `01 // SERVICES` in wide-tracked uppercase mono with a
 * coloured slash. Three separate decorations on four characters of content.
 * Stacked above every section on the page it stopped reading as structure and
 * started reading as a template, which is exactly the look we were trying to
 * avoid by not using a pill badge in the first place.
 *
 * It is now the number, then the name, in normal sentence case. The number
 * carries the brand colour and nothing else is styled at all.
 *
 * @param {string} index  Zero-padded section number, e.g. "02". Optional.
 * @param {string} label  Rendered as written. Sentence case, please.
 * @param {"left"|"right"} align
 */
export default function SectionIndex({ index, label, align = "left", className }) {
    return (
        <p
            className={cn(
                "label-mono flex items-center gap-2.5 text-(--text-mute)",
                align === "right" && "justify-end",
                className,
            )}
        >
            {index ? <span className="text-brand tabular-nums">{index}</span> : null}
            <span>{label}</span>
        </p>
    );
}
