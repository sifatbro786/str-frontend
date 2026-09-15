"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import LoopMarquee from "@/components/motion/LoopMarquee";

/**
 * Tooling band — two coloured rails crossing at a shallow angle.
 *
 * Sits between 02 // Capabilities and 03 // Process, deliberately WITHOUT a
 * SectionIndex. The homepage counter runs 01–07 and every number is load-
 * bearing; this is a band, like the logo rail inside EcosystemBand, not a
 * numbered chapter. Adding an index here would renumber four other files for
 * no editorial gain.
 *
 * ── THE GEOMETRY ─────────────────────────────────────────────────────────
 * Both rails are absolutely centred on the SAME horizontal axis and rotated
 * in opposite directions, which is what makes them genuinely intersect at the
 * midpoint rather than merely converge toward one edge — the mistake is to
 * stack them with a negative margin, which produces a wedge, not a cross.
 * The angles stay under 3°: past that the type starts to read as tilted
 * rather than as a rail laid across the page, and descenders on the lower
 * rail begin colliding with the section below.
 *
 * Each rail is wider than the container so the rotated ends are still outside
 * the viewport after the corners drop; the section clips them. Without the
 * overwidth you get two triangular gaps of bare canvas at the left and right
 * gutters, which is the tell that the angle was added in CSS as an
 * afterthought.
 *
 * ── WHY THE ANGLE AND THE WIDTH ARE BOTH RESPONSIVE ⚑ ────────────────────
 * The two rails share one horizontal axis, so the ONLY thing that makes the
 * lower one visible is the vertical spread the opposite rotations open up at
 * the edges. That spread is `railWidth / 2 * (tan a + tan b)` — it scales with
 * the viewport. The band height does not: it is padding plus a line of type.
 *
 * At 1440 the spread is around 80px against a 63px band, so the blue shows in
 * two wedges at the gutters, which is the shape. At 390 the same angles gave
 * about 22px of spread against a 46px band, so the blue never cleared the
 * orange at any point along the rail and the section rendered as one orange
 * bar. Nothing was overlapping wrongly and nothing was clipped; there was
 * simply not enough width for the geometry to open up.
 *
 * So mobile gets a wider rail, a steeper angle and a thinner band, and the
 * ratio lands back where the desktop one is. If either angle or either width
 * is ever changed, check that
 *
 *     railWidth / 2 * (tan a + tan b)  >  bandHeight
 *
 * still holds at 390px, which is where it fails first.
 *
 * ── TRANSFORM OWNERSHIP ──────────────────────────────────────────────────
 * The rotation lives on an outer wrapper as an inline style and GSAP never
 * touches it. GSAP owns only [data-band], the inner element. This is not
 * fussiness: GSAP writes a single composed `transform` from its own cache, so
 * a tween on an element that already carries a CSS rotate will silently drop
 * that rotate on its first frame. One element, one owner.
 *
 * A side effect worth keeping: with rotation in markup rather than in a
 * tween, the cross is fully composed at first paint. No-JS and pre-hydration
 * both render the finished shape; only the travel is missing.
 *
 * ── WHY LoopMarquee AND NOT A LOCAL TWEEN ────────────────────────────────
 * The seamless wrap, the fonts-ready re-measure, the aria-hidden second copy
 * and the off-screen pause are all already solved there. `reactive` stays off
 * — two rails on one page means two global Observers reading and writing on
 * every wheel event, and the section already has a scrub trigger.
 */

/* Split by discipline, not shuffled. The blue rail is what ships to
   production; the orange rail is what the work looks like before it does.
   ⚑ Confirm against the actual service lines before launch — the list is the
   one thing on this section a prospective client will read literally. */
const ENGINEERING = [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "Express",
    "MongoDB",
    "PostgreSQL",
    "React Native",
    "Flutter",
    "Laravel",
    "Tailwind CSS",
    "GSAP",
    "Docker",
    "AWS",
    "Vercel",
];

const CRAFT = [
    "Figma",
    "Photoshop",
    "Illustrator",
    "After Effects",
    "Premiere Pro",
    "InDesign",
    "3ds Max",
    "V-Ray",
    "Blender",
    "SketchUp",
    "Lumion",
    "Webflow",
    "Shopify",
    "Google Analytics",
    "Meta Ads",
];

/* Type on the rails is sentence case at a normal advance width, matching the
   note on `label-mono` in globals.css. Wide-tracked caps is the default
   marquee treatment and it is exactly the generated-design tell the rest of
   the site was rewritten to avoid. */
const ITEM =
    "whitespace-nowrap px-5 text-[clamp(0.95rem,0.78rem+0.72vw,1.45rem)] font-medium tracking-[-0.02em] text-white md:px-8";

function Rail({ items, direction, speed }) {
    return (
        <LoopMarquee
            items={items}
            speed={speed}
            direction={direction}
            /* Thinner on mobile, and that is half the fix for the cross. See
               the geometry note in the section below: the rails separate by a
               fixed fraction of their own width, so on a phone the separation
               shrinks with the viewport while a fixed py keeps the band the
               same height, and the lower rail ends up entirely underneath the
               upper one. */
            className="py-2.5 md:py-5"
            renderItem={(tool, i) => (
                <span key={`${tool}-${i}`} className="flex shrink-0 items-center">
                    <span className={ITEM}>{tool}</span>
                    {/* A rotated square rather than a bullet or a slash. At this
                        size a bullet reads as a full stop and a slash reads as a
                        broken URL; the diamond is the only separator that stays
                        a separator. */}
                    <span aria-hidden="true" className="size-1.5 shrink-0 rotate-45 bg-white/45" />
                </span>
            )}
        />
    );
}

export default function ToolMarquee() {
    const root = useRef(null);

    useGSAP(
        () => {
            /* matchMedia rather than a bare `if (reduced) return`: this is a
               scrub trigger, so a visitor who turns Reduce Motion on mid-session
               needs the trigger torn down, not just skipped at mount. */
            const mm = gsap.matchMedia();

            mm.add("(prefers-reduced-motion: no-preference)", () => {
                const bands = gsap.utils.toArray("[data-band]", root.current);
                if (!bands.length) return;

                /* Arrival. Both rails swing up into the cross; the stagger is
                   what makes the orange one read as landing ON the blue one
                   rather than the two appearing as a single printed graphic. */
                gsap.from(bands, {
                    yPercent: 55,
                    autoAlpha: 0,
                    duration: 0.9,
                    ease: "power3.out",
                    stagger: 0.12,
                    scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
                });

                /* Scroll drift, in opposite directions. This is the whole reason
                   the cross is worth building: the two rails already travel at
                   different constant rates, and pulling them apart on scroll
                   means the intersection point never sits still, so the shape
                   never resolves into a static logo. Kept to ±5% — enough to
                   feel, small enough that nobody can name it.

                   xPercent on the wrapper is safe alongside LoopMarquee's own
                   loop: that tween targets [data-marquee-copy] inside, a
                   different element. */
                bands.forEach((band) => {
                    gsap.to(band, {
                        xPercent: Number(band.dataset.drift),
                        ease: "none",
                        scrollTrigger: {
                            trigger: root.current,
                            start: "top bottom",
                            end: "bottom top",
                            scrub: 0.8,
                        },
                    });
                });
            });

            return () => mm.revert();
        },
        { scope: root },
    );

    return (
        <section
            ref={root}
            aria-label="Tools and technologies"
            /* overflow-hidden is structural, not cosmetic — the rails are 132%
               wide and would otherwise open a horizontal scrollbar on every
               route that renders this. */
            className="relative overflow-hidden"
        >
            {/* Fixed height because both rails are absolutely positioned: with
                them out of flow the section would collapse to the label. The
                value is the rail height plus the vertical reach of the rotation
                at the widest breakpoint, rounded up. */}
            <div className="relative mt-20 md:mt-30 md:pb-20">
                {/* Blue — under, travelling left. */}
                {/* The rotation moved from an inline style to utilities so it
                    can carry a breakpoint. It is still on the OUTER wrapper and
                    GSAP still owns only [data-band] inside, so the one-element-
                    one-owner rule above is intact. Tailwind v4 writes these as
                    the individual `translate` and `rotate` properties rather
                    than one `transform`, and the spec applies them in that
                    order, so the composed result is identical to the string it
                    replaces. */}
                <div className="absolute top-1/2 left-1/2 z-10 w-[188%] -translate-x-1/2 -translate-y-1/2 rotate-[-4.6deg] md:w-[132%] md:rotate-[-2.6deg]">
                    <div
                        data-band=""
                        data-drift="-5"
                        className="bg-brand shadow-[inset_0_1px_0_0_rgb(255_255_255/0.16),inset_0_-1px_0_0_rgb(0_0_0/0.12)]"
                    >
                        <Rail items={ENGINEERING} direction={1} speed={52} />
                    </div>
                </div>

                {/* Orange — over, travelling right. The drop shadow is doing the
                    real work: without it two flat bands at the same z read as a
                    single printed X, and the layering is the point. */}
                <div className="absolute top-1/2 left-1/2 z-20 w-[188%] -translate-x-1/2 -translate-y-1/2 rotate-[4deg] md:w-[132%] md:rotate-[2.2deg]">
                    <div
                        data-band=""
                        data-drift="5"
                        className="bg-signal shadow-[inset_0_1px_0_0_rgb(255_255_255/0.18),0_22px_48px_-22px_rgb(0_0_0/0.5)]"
                    >
                        <Rail items={CRAFT} direction={-1} speed={58} />
                    </div>
                </div>
            </div>

            <div className="h-20 md:h-28" />
        </section>
    );
}
