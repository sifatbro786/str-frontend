"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import LoopMarquee from "@/components/motion/LoopMarquee";
import useSplitReveal from "@/components/motion/useSplitReveal";
import RotatingWord from "@/components/home/RotatingWord";
import GeoWorldMap from "@/components/home/GeoWorldMap";

/**
 * Hero.
 *
 * ── WHY THE MAP IS NOT LAZY ──────────────────────────────────────────────
 * It is the largest paint on wide viewports. next/dynamic with ssr:false here
 * would trade a small JS saving for a blank right half until hydration, which
 * is the worst thing you can do to the LCP element.
 *
 * ── THE HEADLINE IS THREE LINES, ONE OF WHICH MOVES ──────────────────────
 * Line two cycles through nine service phrases. Every phrase is phrased as a
 * PLURAL noun, which is not a style preference: line three reads "that hold
 * up after launch", and "software that hold up" is broken English. Keeping
 * the list grammatically uniform is what lets the surrounding sentence stay
 * fixed. Add to SERVICES only in the same form.
 *
 * The h1 carries an explicit aria-label so the accessible name is one stable
 * sentence rather than whatever happens to be on screen when a screen reader
 * reaches it.
 *
 * ── SPACING ──────────────────────────────────────────────────────────────
 * One vertical rhythm in multiples of the same step: 6 between a label and
 * what it labels, 8 between a heading and its paragraph, 10 before the
 * actions. The first pass used a different value at every joint, which is
 * most of what made it feel assembled rather than typeset.
 */

/* ── TWO HARD CONSTRAINTS ON THIS LIST, BOTH LOAD-BEARING ────────────────
 *
 * 1. SHORT. Every phrase has to fit on one line at display size inside a
 *    five-column hero. RotatingWord sizes its box to the widest of these and
 *    holds it at one line with nowrap, so a long entry does not wrap — it
 *    overflows into the map. "retouched catalogues" and "3D visualizations"
 *    were both in the first version of this list, and they are what produced
 *    the dead vertical band under the rotating line.
 *
 * 2. PLURAL NOUNS. Line three reads "that hold up after launch", so the
 *    phrase is the subject of a plural verb. "software systems" works;
 *    "custom software" and "retouching" do not, because "software that hold
 *    up" is broken English. The whole point of a fixed sentence around a
 *    moving word is that it stays grammatical for every value.
 *
 * Add entries only in the same form. */
const SERVICES = [
    "web platforms",
    "mobile apps",
    "design systems",
    "dashboards",
    "3D renders",
    "data pipelines",
    "AI workflows",
    "brand systems",
    "storefronts",
];

const DISCIPLINES = [
    "Web platforms",
    "Custom software",
    "Mobile apps",
    "Product design",
    "3D visualization",
    "Graphics production",
    "Digital marketing",
];

export default function Hero() {
    const root = useRef(null);
    const lede = useSplitReveal({
        type: "lines",
        immediate: true,
        stagger: 0.07,
        delay: 0.5,
        y: 0.35,
    });

    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reduced) return;

            const q = gsap.utils.selector(root);

            /* The headline is NOT run through useSplitReveal. Line two contains
               nine absolutely-stacked phrases, and SplitText would wrap each of
               them in its own line box and freeze the geometry, which is exactly
               what RotatingWord is built to avoid. The three lines get a plain
               masked rise instead, which is the same gesture without the
               measurement. */
            gsap.timeline({ defaults: { ease: "power3.out" } })
                .from(
                    q("[data-hero-line]"),
                    { yPercent: 108, duration: 0.95, ease: "power4.out", stagger: 0.08 },
                    0.05,
                )
                .from(q("[data-hero-meta]"), { autoAlpha: 0, y: 10, duration: 0.6 }, 0.2)
                .from(
                    q("[data-hero-cta]"),
                    { autoAlpha: 0, y: 14, duration: 0.6, stagger: 0.08 },
                    0.85,
                )
                .from(q("[data-hero-map]"), { autoAlpha: 0, duration: 0.9 }, 0.3)
                .from(q("[data-hero-band]"), { autoAlpha: 0, y: 18, duration: 0.7 }, 1);
        },
        { scope: root },
    );

    return (
        <section ref={root} className="relative">
            {/* pt clears the 68px fixed Navbar plus its rest-state margin. */}
            <div className="shell pt-28 md:pt-36">
                {/* items-start, not items-center. The map is the taller column and
            centring it pushed the headline down the page for no reason. */}
                <div className="grid grid-cols-1 items-start gap-x-10 gap-y-14 lg:grid-cols-12">
                    {/* ── Statement ───────────────────────────────────────── */}
                    <div className="lg:col-span-5">
                        <h1
                            className="text-display"
                            aria-label={`We build ${SERVICES.join(", ")} that hold up after launch.`}
                        >
                            {/* Each line gets its own overflow-hidden wrapper so the
                  intro rise is masked per line. One wrapper around all
                  three would let line two appear over line one on the way
                  in.

                  The padding-and-negative-margin pair is not spacing, it is
                  clip room. Line two's characters tumble on rotateX, and
                  they pass through the box edge while still partly opaque;
                  at the old 0.06em the tops of the glyphs were being
                  shaved mid-transition. The negative margin cancels the
                  padding so the line rhythm is unchanged while the clip
                  rectangle grows. */}
                            <span className="my-[-0.14em] block overflow-hidden py-[0.14em]">
                                <span data-hero-line="" className="block will-change-transform">
                                    We build
                                </span>
                            </span>

                            <span className="my-[-0.14em] block overflow-hidden py-[0.14em]">
                                <span data-hero-line="" className="block will-change-transform">
                                    <RotatingWord
                                        phrases={SERVICES}
                                        hold={2.2}
                                        className="text-brand"
                                    />
                                </span>
                            </span>

                            <span className="my-[-0.14em] block overflow-hidden py-[0.14em]">
                                <span data-hero-line="" className="block will-change-transform">
                                    that hold up after launch.
                                </span>
                            </span>
                        </h1>

                        <p
                            ref={lede}
                            className="mt-8 max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim)"
                        >
                            STR Solutions is a Dhaka engineering studio. Software, design and visual
                            production under one roof, handed over as something your team can
                            actually run.
                        </p>

                        <div className="mt-10 flex flex-wrap items-center gap-3">
                            <Link
                                data-hero-cta=""
                                href="/services"
                                className="group/cta inline-flex items-center gap-2.5 rounded-full bg-(--text) px-7 py-3.5 text-[0.9375rem] font-medium text-(--canvas) transition-colors duration-200 hover:bg-brand hover:text-white"
                            >
                                Explore solutions
                                <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    aria-hidden="true"
                                    className="transition-transform duration-300 ease-out group-hover/cta:translate-x-1"
                                >
                                    <path
                                        d="M2.5 8h11M9.5 4l4 4-4 4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </Link>

                            <Link
                                data-hero-cta=""
                                href="/contact"
                                className="inline-flex items-center rounded-full border border-(--line) px-7 py-3.5 text-[0.9375rem] font-medium text-(--text) transition-colors duration-200 hover:border-(--text)"
                            >
                                Get in touch
                            </Link>
                        </div>
                    </div>

                    {/* ── Map ─────────────────────────────────────────────────
                Seven columns, bleeding past the right gutter on wide
                viewports. The label is absolutely positioned over the map's
                empty north Pacific rather than stacked above it: as a block
                it pushed the map down by its own height plus a margin, and
                the two columns stopped starting on the same line, which was
                the thing being fixed. */}
                    <div data-hero-map="" className="relative lg:col-span-7 xl:-mr-10">
                        <p
                            data-hero-meta=""
                            className="label-mono absolute top-0 left-0 z-10 flex items-center gap-2.5 text-(--text)"
                        >
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="var(--color-brand)"
                                strokeWidth="1.3"
                                aria-hidden="true"
                            >
                                <circle cx="8" cy="8" r="6.4" />
                                <ellipse cx="8" cy="8" rx="2.8" ry="6.4" />
                                <path d="M1.9 6h12.2M1.9 10h12.2" strokeLinecap="round" />
                            </svg>
                            Global service network
                        </p>

                        <GeoWorldMap />
                    </div>
                </div>
            </div>

            {/* ── Discipline band ─────────────────────────────────────────────
          Display-scale, not caption-scale. At 17px this was a list of
          services nobody read; at display size it is the second statement on
          the page.

          Alternating filled and outlined faces so the rail has rhythm
          without needing a separator between items, and so a long list does
          not read as one continuous grey smear. -webkit-text-stroke rather
          than an SVG outline: it inherits the font metrics exactly, which no
          stroked-path approach does. Every browser this site targets supports
          it; the fallback is simply a filled word. */}
            <div
                data-hero-band=""
                className="mt-16 border-y border-(--line) bg-(--raised) py-8 md:mt-24 md:py-10"
            >
                <LoopMarquee
                    items={DISCIPLINES}
                    speed={52}
                    fade="var(--raised)"
                    renderItem={(label, i) => (
                        <span
                            key={`${label}-${i}`}
                            className="group/disc flex shrink-0 items-center gap-8 pr-8 md:gap-12 md:pr-12"
                        >
                            <span
                                className="text-[clamp(1.75rem,4.5vw,3.25rem)] leading-none font-medium tracking-tight transition-colors duration-300 group-hover/disc:text-brand"
                                style={
                                    i % 2
                                        ? {
                                              WebkitTextStroke: "1px var(--text-mute)",
                                              color: "transparent",
                                          }
                                        : { color: "var(--text)" }
                                }
                            >
                                {label}
                            </span>
                            <span
                                aria-hidden="true"
                                className="block size-1.5 shrink-0 rounded-full bg-(--line) transition-colors duration-300 group-hover/disc:bg-brand"
                            />
                        </span>
                    )}
                />
            </div>
        </section>
    );
}
