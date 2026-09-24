/**
 * The oversized mark at the foot of every public page.
 *
 * ── STATIC, ON PURPOSE ───────────────────────────────────────────────────
 * This carried two GSAP effects: a scroll-scrubbed gradient mask that filled
 * the letters in as the reader reached the bottom of the page, and a radial
 * mask that followed the cursor and warmed the glyphs under it to the signal
 * colour. Both are gone at the studio's request — the footer runs no GSAP at
 * all now.
 *
 * What is left is exactly the frame the sweep used to END on: the hollow
 * stroke, plus the solid fill it revealed. So the mark looks the way a reader
 * who scrolled to the bottom always saw it; only the arrival is missing. The
 * cursor layer has no still frame worth keeping, so it is not here.
 *
 * ── NO "use client" ──────────────────────────────────────────────────────
 * With the hooks gone this renders on the server, which is the real win: the
 * component, @gsap/react and every plugin reference it pulled in leave the
 * footer's client bundle entirely. Do not add an effect back without moving
 * the directive back with it.
 *
 * ── WHY textLength SURVIVES ──────────────────────────────────────────────
 * textLength + lengthAdjust="spacingAndGlyphs" pins the mark to exactly the
 * container width. That is what keeps it aligned with the grid above it in the
 * moment before General Sans arrives from the Fontshare CDN — a font-size
 * driven mark overflows its box on the fallback stack and snaps when the swap
 * lands.
 */

const W = 1000;
const H = 84;

/* One <text> per layer, same geometry. Written out rather than mapped: two
   nodes with different paint is not a list, and a map here would cost a key
   prop and a reader's second look for nothing. */
const TEXT_GEOMETRY = {
    x: 0,
    y: 78,
    textLength: W,
    lengthAdjust: "spacingAndGlyphs",
    fontSize: "100",
    fontWeight: "600",
};

export default function KineticWordmark({ text }) {
    return (
        <svg
            aria-hidden="true"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="block h-auto w-full select-none overflow-visible"
        >
            {/* Hollow outline. non-scaling-stroke keeps the hairline at 1px from a
                320px phone to a 2560px display, through the viewBox stretch. */}
            <text
                {...TEXT_GEOMETRY}
                fill="none"
                stroke="var(--text)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                opacity="0.2"
            >
                {text}
            </text>

            {/* Solid fill, at the opacity the sweep used to resolve to. */}
            <text {...TEXT_GEOMETRY} fill="var(--text)" opacity="0.09">
                {text}
            </text>
        </svg>
    );
}
