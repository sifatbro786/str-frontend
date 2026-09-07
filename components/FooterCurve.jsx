"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * The footer's top edge, as a rubberband.
 *
 * ── WHY A PARAMETER, NOT TWO PATHS ───────────────────────────────────────
 * The previous version scrubbed between a BOWED and a FLAT path string. That
 * can only ever produce a linear interpolation between two authored shapes —
 * there is no state in it, so there is nothing for a spring to act on. The
 * curve is now generated from a single scalar, `bow` (viewBox units the apex
 * rises above the baseline), which means any number of independent forces can
 * sum into it and a physics ease has something real to solve.
 *
 * Two forces:
 *   base — scroll progress. The arc is deep while the footer is still below
 *          the fold and flattens as it arrives. Scrubbed, so it is 1:1 with
 *          the wheel.
 *   kick — scroll velocity. Applied as an instantaneous impulse and released
 *          with elastic.out(1, 0.3). That asymmetry is the whole trick: a real
 *          rubberband loads instantly and recovers slowly. Tweening *into* the
 *          impulse as well would read as a wobble, not a snap.
 *
 * The release overshoots past zero by design — the curve bows the other way
 * for one beat before settling. That inversion is what separates this from a
 * damped ease-out.
 *
 * preserveAspectRatio="none" stretches the 1000-unit viewBox to any width, so
 * the control points are proportional and the shape is responsive with no
 * resize handler. The stroke is non-scaling so the hairline stays 1px on a
 * 320px phone and a 2560px display alike.
 */

const W = 1000;
const H = 100;

// Symmetric cubic pinned at both ends. Control points at 1.34× lift the apex to
// almost exactly `bow` (the cubic's midpoint sits at 3/4 of the control height).
const edgeD = (bow) =>
    `M 0 ${H} C ${W * 0.26} ${H - bow * 1.34}, ${W * 0.74} ${H - bow * 1.34}, ${W} ${H}`;
const plateD = (bow) => `${edgeD(bow)} L ${W} ${H} L 0 ${H} Z`;

const BASE_MAX = 58; // deepest arc, while the footer is still below the fold
const KICK_MAX = 34; // strongest velocity impulse
const V_FULL = 3200; // px/s that produces a full-strength impulse

export default function FooterCurve() {
    const root = useRef(null);
    const edge = useRef(null);
    const plate = useRef(null);

    useGSAP(
        () => {
            const write = (bow) => {
                // Clamped after summing, not per-force: base and kick are allowed to
                // fight each other, only the result is bounded.
                const b = gsap.utils.clamp(-22, 104, bow);
                edge.current.setAttribute("d", edgeD(b));
                plate.current.setAttribute("d", plateD(b));
            };

            const mm = gsap.matchMedia();

            // Reduced motion gets the resting shape, drawn once. A flat rule is the
            // honest end state of this animation, so nothing is lost but the motion.
            mm.add("(prefers-reduced-motion: reduce)", () => write(0));

            mm.add("(prefers-reduced-motion: no-preference)", () => {
                /* Trigger off the footer wrapper, not off this element.
           Historically this mattered because FooterReveal counter-translated
           everything inside it and ScrollTrigger measures with
           getBoundingClientRect, so a trigger on `root` baked in whatever the
           reveal was translated by at refresh time. That transform is gone, so
           the two boxes now share a top edge and either would work — the
           anchor is kept because it is still the more stable of the two: it
           survives anyone reintroducing a transform on the footer shell. */
                const anchor = root.current.closest("[data-footer-mask]") ?? root.current;

                const force = { base: BASE_MAX, kick: 0 };
                const apply = () => write(force.base + force.kick);
                apply();

                let release = null;

                const st = ScrollTrigger.create({
                    trigger: anchor,
                    start: "top bottom",
                    end: "top 58%",
                    onUpdate: (self) => {
                        force.base = (1 - self.progress) * BASE_MAX;

                        /* getVelocity() is px/s of the *scroller*, so under ScrollSmoother
               it is the smoothed velocity — which is what we want: the curve
               should react to what the user sees moving, not to the raw wheel
               deltas the smoother is still absorbing. */
                        const target = gsap.utils.clamp(
                            0,
                            KICK_MAX,
                            (Math.abs(self.getVelocity()) / V_FULL) * KICK_MAX,
                        );

                        // Only ever load the band — never unload it directly. A new impulse
                        // is accepted if it beats what the spring is currently holding;
                        // otherwise the existing release owns the value.
                        if (target > force.kick + 1) {
                            force.kick = target;
                            release?.kill();
                            release = gsap.to(force, {
                                kick: 0,
                                duration: 1.15,
                                ease: "elastic.out(1, 0.3)",
                                onUpdate: apply,
                            });
                        }

                        apply();
                    },
                    // The band should not be holding tension while the footer is parked
                    // off-screen; the spring keeps running its own onUpdate otherwise.
                    onLeaveBack: () => {
                        release?.kill();
                        force.kick = 0;
                    },
                });

                return () => {
                    release?.kill();
                    st.kill();
                };
            });

            return () => mm.revert();
        },
        { scope: root },
    );

    return (
        <div
            ref={root}
            aria-hidden="true"
            className="pointer-events-none relative h-14 w-full md:h-24"
        >
            <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                className="block h-full w-full overflow-visible"
            >
                {/* Plate first: the footer surface, one step off the page canvas, so
            the arc reads as a silhouette rather than a same-on-same edge. */}
                <path ref={plate} d={plateD(BASE_MAX)} fill="var(--raised)" />
                {/* Then the hairline, in the same language as every other rule on the
            site. non-scaling-stroke keeps it 1px through the viewBox stretch. */}
                <path
                    ref={edge}
                    d={edgeD(BASE_MAX)}
                    fill="none"
                    stroke="var(--line)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    );
}
