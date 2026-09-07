"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useMagnetic } from "@/components/motion/useMagnetic";

/**
 * The unveil, plus magnetic hover for every link inside it.
 *
 * ── THE UNVEIL ───────────────────────────────────────────────────────────
 * The obvious implementation — position:fixed footer, page scrolls over it —
 * is unavailable here: #smooth-content carries a transform, which makes it the
 * containing block for any fixed descendant, and position:sticky is broken for
 * the same reason. Anything that "pins" inside the smoother has to do it with
 * transforms.
 *
 * So: an overflow:hidden window in normal flow, with the footer inside it
 * counter-translated. The window travels with the page at 1:1; the footer
 * inside it lags, arriving at yPercent 0 exactly as the window's bottom edge
 * reaches the viewport bottom. Visually the footer is stationary behind the
 * page and the page slides off it. No pin, no spacer, no layout shift, and it
 * costs one composited transform.
 *
 * The empty band that the counter-translate leaves at the bottom of the window
 * is never visible: it is 0.26·(1−p)·H tall while the window's bottom sits
 * 0.74·(1−p)·H *below* the viewport, so it shrinks strictly faster than it
 * approaches. Change REVEAL and that stays true; change the trigger's `end`
 * and it does not.
 *
 * ── MAGNETIC LINKS ───────────────────────────────────────────────────────
 * Delegated over this whole subtree by useMagnetic — every `[data-magnetic]`
 * inside is picked up with one listener. Shared with the Navbar CTA and the
 * hero actions so all three have the same physics; see the hook for why the
 * targets must not be inline boxes.
 */

const REVEAL = 26; // % of footer height the reveal travels through

export default function FooterReveal({ children }) {
    const mask = useRef(null);
    const inner = useRef(null);

    /* ── Unveil ─────────────────────────────────────────────────────────── */
    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add("(prefers-reduced-motion: no-preference)", () => {
                const tween = gsap.fromTo(
                    inner.current,
                    { yPercent: -REVEAL },
                    {
                        yPercent: 0,
                        ease: "none",
                        scrollTrigger: {
                            trigger: mask.current,
                            start: "top bottom",
                            end: "bottom bottom",
                            scrub: true,
                            // will-change on a full-page-height element is a permanent
                            // compositor layer. Promote it only while it is actually moving.
                            onToggle: (self) => {
                                inner.current.style.willChange = self.isActive
                                    ? "transform"
                                    : "auto";
                            },
                        },
                    },
                );
                return () => tween.scrollTrigger?.kill();
            });

            return () => mm.revert();
        },
        { scope: mask },
    );

    /* ── Magnetic links ─────────────────────────────────────────────────── */
    useMagnetic(mask);

    return (
        /* data-footer-mask is a measurement anchor, not a style hook. Everything
       inside `inner` sits under a scrubbed transform, and ScrollTrigger
       measures with getBoundingClientRect — so a trigger on any descendant is
       offset by however much the reveal happens to be translated at refresh
       time. The mask is the last untransformed box in the chain, so the curve
       and the wordmark both resolve their trigger up to it. */
        <div ref={mask} data-footer-mask="" className="relative overflow-hidden">
            <div ref={inner}>{children}</div>
        </div>
    );
}
