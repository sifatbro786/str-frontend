"use client";

import { useRef } from "react";
import { useMagnetic } from "@/components/motion/useMagnetic";

/**
 * Footer wrapper. Magnetic links, and nothing else.
 *
 * ── THE UNVEIL WAS REMOVED, ON PURPOSE ───────────────────────────────────
 * This used to hold the footer in an overflow:hidden window and counter-
 * translate it on scrub, so the page appeared to slide off a stationary
 * footer. It looked good in isolation and was wrong in practice.
 *
 * The problem is not the effect, it is what the effect requires. The reveal
 * only completes when the window's bottom edge reaches the viewport bottom,
 * which is the very last pixel of the document. Every scroll position before
 * that shows the footer translated up inside a clipping box, so part of it is
 * cut off. On any viewport shorter than the footer, and under ScrollSmoother's
 * easing (which asymptotically approaches the end of the scroll range rather
 * than snapping to it), there is effectively no moment where the whole footer
 * is on screen at once. Contact details you cannot reliably read are worse
 * than no animation.
 *
 * Fixing it inside the effect means either shortening the scrub so it finishes
 * early (at which point the footer visibly jumps to rest mid-scroll) or making
 * the window taller than the footer (which reintroduces the empty band the
 * original was written to avoid). Neither is worth it for a parallax on a
 * sitemap.
 *
 * ── WHAT STAYED, AND WHY ─────────────────────────────────────────────────
 * `data-footer-mask` remains as a measurement anchor. FooterCurve and
 * KineticWordmark both resolve their ScrollTriggers up to it, and with the
 * transform gone it is now simply the footer's own untransformed box — which
 * is what those triggers wanted to measure against in the first place. Their
 * start/end values need no change; they get more accurate, not less.
 */
export default function FooterReveal({ children }) {
    const root = useRef(null);

    useMagnetic(root);

    return (
        <div ref={root} data-footer-mask="" className="relative">
            {children}
        </div>
    );
}
