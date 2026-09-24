/**
 * The footer shell.
 *
 * ── WHAT THIS USED TO DO, AND WHY IT DOES NOTHING NOW ────────────────────
 * Two effects have been removed from this file, in that order.
 *
 * First the unveil: the footer was held in an overflow:hidden window and
 * counter-translated on scrub, so the page appeared to slide off a stationary
 * footer. It only completed at the very last pixel of the document, which meant
 * that on any viewport shorter than the footer there was effectively no scroll
 * position where the whole thing was legible. Contact details you cannot
 * reliably read are worse than no animation.
 *
 * Then the magnetic links: every [data-magnetic] child was nudged toward the
 * pointer on hover, through a single delegated handler mounted here. Removed at
 * the studio's request along with the rest of the footer's motion — the footer
 * now runs no GSAP at all, and neither does anything it renders.
 *
 * ── WHY THE FILE SURVIVES ────────────────────────────────────────────────
 * It is the footer's outer positioning context, which `FooterEdge` and the
 * absolutely-positioned marks inside the plate still need. Folding this div
 * into Footer.jsx would work and would be one file fewer; it is kept separate
 * so the footer's shell and its content stay in different files, as everywhere
 * else in this tree.
 *
 * `data-footer-mask` is kept as a stable hook. Nothing reads it today — the two
 * ScrollTriggers that measured against it are gone — but it costs one attribute
 * and it is the anchor anyone reintroducing footer motion will look for first.
 *
 * ⚑ No "use client". This whole subtree renders on the server now. Adding a
 * hook here pulls Footer.jsx's children back into the client bundle.
 */
export default function FooterReveal({ children }) {
    return (
        <div data-footer-mask="" className="relative">
            {children}
        </div>
    );
}
