/**
 * The band between the page and the footer: the footer's surface starting, and
 * one hairline marking where.
 *
 * ── IT WAS A CURVE. IT IS A RULE NOW ─────────────────────────────────────
 * This shipped as `FooterCurve` — an SVG whose top edge was a cubic bezier,
 * driven by GSAP as a rubberband: scroll progress flattened the arc as the
 * footer arrived, and scroll velocity loaded it with an impulse released on
 * elastic.out, so a fast flick made the edge snap and overshoot. The motion
 * came out first, leaving a static arc; the arc is out now too, at the
 * studio's request. The edge is straight.
 *
 * With the shape gone there is nothing left for SVG to draw that a border
 * cannot, so the file is a div. A `<path>` describing a horizontal line inside
 * a stretched viewBox is a more expensive way to render `border-top`, and it
 * puts a second coordinate system between anyone reading this and a 1px rule.
 *
 * ── WHY THE BAND SURVIVES AT ALL ─────────────────────────────────────────
 * The height is not decoration. `--raised` starting 56px (96px from md) above
 * the footer's own padding is what separates the sitemap from the last section
 * of the page; collapsing this to a bare border on <footer> pulls the column
 * headings up against whatever the page ended with. Footer.jsx adds its own
 * `pt-4 md:pt-8` on top of this, so the two together are the gap.
 *
 * ⚑ Renamed from FooterCurve.jsx. If a stale import turns up, it is that.
 */
export default function FooterEdge() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none h-14 w-full border-t border-(--line) bg-(--raised) md:h-24"
        />
    );
}
