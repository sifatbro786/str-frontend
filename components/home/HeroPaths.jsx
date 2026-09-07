"use client";

import { useId, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Hairline bezier accents with waypoint dots, reacting to the cursor.
 *
 * Deliberately restrained: three strokes, three 2px dots, long durations and
 * offset starts so the movement stays peripheral. If you can read the page and
 * notice these at the same time, they are too fast.
 *
 * ── WHY NO PARTICLE CANVAS ───────────────────────────────────────────────
 * A canvas particle field is a full-viewport repaint every frame, on its own
 * raster surface, competing with ScrollSmoother's transform for the same
 * compositor budget — and on a hero it runs during the most expensive moment
 * of the page's life. The proximity reaction here is one radial gradient used
 * as the *stroke* of the existing paths, so the artwork already on screen
 * brightens toward the cursor for the cost of moving two attributes. Far from
 * the pointer the stops resolve to --line, which is exactly the hairline that
 * was there before; near it, they go to --color-signal.
 *
 * The soft glow behind it is one composited div. Between them there is no
 * per-particle state, no offscreen buffer, and nothing to tune when a slower
 * machine shows up.
 *
 * ── WHY A TICKER AND NOT TWEENS ──────────────────────────────────────────
 * Pointer input arrives coalesced to roughly one event per frame, so a tween
 * per event would allocate ~60 tweens/second that each live for one frame.
 * Instead the handler only records a target, and a single ticker callback
 * lerps toward it and writes through quickSetters. One callback, four writes,
 * zero reads inside the frame — the rect is read in the pointer handler, where
 * a layout flush is already paid for.
 *
 * `data-speed` is a ScrollSmoother effect on the outer layer: the whole thing
 * parallaxes behind the copy at 0.85x scroll, and no-ops when the smoother is
 * off (touch, reduced motion). It writes to the outer div while the parallax
 * below writes to inner <g> nodes, so the two never contend.
 *
 * The layer is aria-hidden and pointer-events-none: pure decoration.
 */

const VB_W = 1440;
const VB_H = 520;

const PATHS = [
    "M -120 220 C 180 120, 420 300, 760 180 S 1240 60, 1560 200",
    "M -80 420 C 260 320, 520 520, 880 400 S 1320 280, 1620 420",
    "M -140 90 C 240 -30, 600 150, 980 40 S 1400 -60, 1680 80",
];

// px of cursor parallax per layer. Unequal on purpose — matched depths read as
// one flat plane sliding, which is worse than no parallax at all.
const DEPTH = [30, 52, 18];

const GLOW = 720; // px, the ambient disc's diameter
const LERP = 0.075; // approach rate; ~0.9 of the distance closed in 30 frames

export default function HeroPaths() {
    const root = useRef(null);
    const glow = useRef(null);
    const beam = useRef(null);

    // Gradient ids must be unique per instance or a second hero on the page
    // would silently steal the first one's stroke.
    const uid = useId().replace(/:/g, "");
    const beamId = `hero-beam-${uid}`;

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add("(prefers-reduced-motion: no-preference)", () => {
                const paths = gsap.utils.toArray("[data-hero-path]", root.current);
                const dots = gsap.utils.toArray("[data-hero-dot]", root.current);

                // Draw the hairlines in once, then let the dots run forever.
                gsap.from(paths, {
                    drawSVG: "0%",
                    duration: 1.8,
                    stagger: 0.18,
                    ease: "power2.inOut",
                });

                dots.forEach((dot, i) => {
                    gsap.set(dot, { transformOrigin: "50% 50%" });
                    gsap.to(dot, {
                        // The dot lives inside the same <g> as its path, so the cursor
                        // parallax on that group carries both and the alignment holds.
                        motionPath: { path: paths[i], align: paths[i], alignOrigin: [0.5, 0.5] },
                        duration: 16 + i * 4,
                        repeat: -1,
                        yoyo: true,
                        ease: "sine.inOut",
                        delay: i * 2.5,
                    });
                });
            });

            /* ── Cursor reaction ──────────────────────────────────────────────── */
            mm.add(
                "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)",
                () => {
                    const layers = gsap.utils.toArray("[data-hero-layer]", root.current);
                    const section = root.current.closest("section") ?? root.current.parentElement;
                    if (!section) return;

                    const setLayer = layers.map((g) => gsap.quickSetter(g, "css"));
                    const setGlow = gsap.quickSetter(glow.current, "css");
                    const setBeam = gsap.quickSetter(beam.current, "attr");

                    // Normalised pointer: target and current. Everything downstream is
                    // derived from these two, so adding another reactive element later
                    // costs one more write, not another listener.
                    const t = { x: 0.5, y: 0.4 };
                    const c = { x: 0.5, y: 0.4 };
                    let box = { w: 1, h: 1 };
                    let engaged = false;

                    const onMove = (e) => {
                        // The one layout read in this system, taken in the pointer handler
                        // where the browser has already flushed style for hit-testing.
                        // ScrollSmoother moves this layer, so the rect cannot be cached.
                        const r = root.current.getBoundingClientRect();
                        box = { w: r.width || 1, h: r.height || 1 };
                        t.x = gsap.utils.clamp(0, 1, (e.clientX - r.left) / box.w);
                        t.y = gsap.utils.clamp(0, 1, (e.clientY - r.top) / box.h);

                        if (!engaged) {
                            engaged = true;
                            gsap.to(glow.current, {
                                autoAlpha: 1,
                                duration: 0.9,
                                ease: "power2.out",
                            });
                        }
                    };

                    const onLeave = () => {
                        engaged = false;
                        gsap.to(glow.current, { autoAlpha: 0, duration: 0.7, ease: "power2.out" });
                        // Drift back to the resting composition rather than freezing
                        // wherever the cursor happened to exit.
                        t.x = 0.5;
                        t.y = 0.4;
                    };

                    const tick = () => {
                        // Idle short-circuit. The ticker is global and runs for the life of
                        // the page, including while the hero is three screens up — once the
                        // lerp has settled there is nothing to write, and this reduces the
                        // resting cost to two float subtractions per frame.
                        if (
                            !engaged &&
                            Math.abs(t.x - c.x) < 0.0005 &&
                            Math.abs(t.y - c.y) < 0.0005
                        )
                            return;

                        c.x += (t.x - c.x) * LERP;
                        c.y += (t.y - c.y) * LERP;

                        const ox = c.x - 0.5;
                        const oy = c.y - 0.5;

                        layers.forEach((_, i) => {
                            // Vertical travel is halved: the paths are near-horizontal, and
                            // equal x/y displacement makes them look like they are sliding
                            // on glass rather than sitting at depth.
                            setLayer[i]({ x: ox * DEPTH[i], y: oy * DEPTH[i] * 0.45 });
                        });

                        setGlow({ x: c.x * box.w - GLOW / 2, y: c.y * box.h - GLOW / 2 });

                        // Gradient is userSpaceOnUse, so it moves in viewBox units, not in
                        // the element's own box — which is what lets one gradient light
                        // three paths at three different depths consistently.
                        setBeam({ cx: c.x * VB_W, cy: c.y * VB_H });
                    };

                    section.addEventListener("pointermove", onMove, { passive: true });
                    section.addEventListener("pointerleave", onLeave);
                    gsap.ticker.add(tick);

                    return () => {
                        section.removeEventListener("pointermove", onMove);
                        section.removeEventListener("pointerleave", onLeave);
                        gsap.ticker.remove(tick);
                    };
                },
            );

            return () => mm.revert();
        },
        { scope: root },
    );

    return (
        <div
            ref={root}
            aria-hidden="true"
            data-speed="0.85"
            className="pointer-events-none absolute inset-0 overflow-hidden"
        >
            {/* Ambient disc. Painted with color-mix so it reads as a warm lift on the
          near-black canvas and a faint wash on paper, from one declaration —
          a second hardcoded light-mode colour is a second thing to keep in
          sync with the palette.

          No blur filter: the gradient's own stops already fall to transparent,
          so a blur would only buy a full-size offscreen buffer that has to be
          re-rastered whenever the disc's size changes. */}
            <div
                ref={glow}
                className="invisible absolute left-0 top-0 rounded-full opacity-0"
                style={{
                    width: GLOW,
                    height: GLOW,
                    background:
                        "radial-gradient(circle, color-mix(in oklab, var(--color-signal) 16%, transparent) 0%, color-mix(in oklab, var(--color-brand) 9%, transparent) 45%, transparent 68%)",
                }}
            />

            <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                preserveAspectRatio="xMidYMin slice"
                fill="none"
                className="h-full w-full opacity-60"
            >
                <defs>
                    <radialGradient
                        ref={beam}
                        id={beamId}
                        gradientUnits="userSpaceOnUse"
                        r="420"
                        cx={VB_W / 2}
                        cy={VB_H * 0.4}
                    >
                        <stop offset="0%" stopColor="var(--color-signal)" stopOpacity="0.9" />
                        <stop offset="38%" stopColor="var(--text-mute)" stopOpacity="0.55" />
                        {/* The outer stop is the resting hairline. Everything beyond the
                cursor's reach is byte-for-byte the stroke this had before. */}
                        <stop offset="100%" stopColor="var(--line)" stopOpacity="1" />
                    </radialGradient>
                </defs>

                {PATHS.map((d, i) => (
                    <g key={d} data-hero-layer>
                        <path
                            data-hero-path
                            d={d}
                            stroke={`url(#${beamId})`}
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                        />
                        <circle data-hero-dot r="2.5" fill="var(--color-signal)" />
                    </g>
                ))}
            </svg>
        </div>
    );
}
