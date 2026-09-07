"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
// MotionPathPlugin is not imported by name: importing anything from @/lib/gsap
// runs that module, and registration happens there. Naming the plugin here as
// well would imply this file owns it.
import { gsap } from "@/lib/gsap";
import { ARCS, DOTS, MAP_H, MAP_W, NODES, project } from "@/lib/worldmap";

/**
 * Hero map — a 5° dot matrix with a Dhaka hub and six delivery arcs.
 *
 * ── WHY SVG AND NOT CANVAS ───────────────────────────────────────────────
 * ~620 dots is well inside SVG's comfortable range, and the nodes need to be
 * real focusable elements with accessible names. On canvas the labels would
 * have to be a parallel DOM layer positioned by hand, which is the same node
 * count plus a synchronisation problem.
 *
 * ── WHY THE DOTS ARE NOT ANIMATED INDIVIDUALLY ───────────────────────────
 * One tween over the whole NodeList with a distance-based stagger. 620 tweens
 * is 620 ticker entries; one tween with `stagger.from` is a single entry that
 * GSAP indexes internally. The visual result is identical.
 *
 * ── WHY THE PULSE IS A SEPARATE <circle> ─────────────────────────────────
 * Scaling the marker itself would scale its stroke width with it. The ring is
 * its own element with `vector-effect: non-scaling-stroke`, so it expands as a
 * hairline instead of a thickening blob.
 */
export default function WorldMap({ className }) {
    const root = useRef(null);
    const [active, setActive] = useState(null);

    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const q = gsap.utils.selector(root);

            const dots = q("[data-dot]");
            const arcs = q("[data-arc]");
            const markers = q("[data-marker]");
            const rings = q("[data-ring]");
            const pips = q("[data-pip]");

            if (reduced) {
                // Everything visible, nothing moving. The arcs still draw at full
                // length so the graphic still communicates reach.
                gsap.set([dots, markers], { opacity: 1, scale: 1 });
                gsap.set(arcs, { strokeDashoffset: 0, opacity: 0.55 });
                gsap.set([rings, pips], { opacity: 0 });
                return;
            }

            const hub = NODES.find((n) => n.hub);
            const origin = project(hub.lon, hub.lat);

            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            /* Dots bloom outward from Dhaka.
               A function-based stagger, not `{ from: [x, y], grid: "auto" }`.
               GSAP's auto-grid infers rows and columns from the elements' laid
               out positions, and this matrix is *sparse* — most rows are missing
               half their columns — so the inferred grid is wrong and the
               wavefront comes out as a diagonal wipe. Distance from the hub, in
               the SVG's own user units, is the thing actually being expressed,
               so it is what the delay is computed from. */
            const maxDist = Math.hypot(MAP_W, MAP_H);
            tl.fromTo(
                dots,
                { opacity: 0, scale: 0 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.9,
                    stagger: (i) => {
                        const d = DOTS[i];
                        if (!d) return 0;
                        return (Math.hypot(d.x - origin.x, d.y - origin.y) / maxDist) * 1.15;
                    },
                },
                0,
            );

            /* DrawSVG would be the obvious tool, but stroke-dasharray set from
               getTotalLength() is cheaper here: the arcs are static quadratics,
               so the length never changes and there is no reason to pay for
               DrawSVG's re-measurement on every refresh. */
            arcs.forEach((path, i) => {
                const len = path.getTotalLength();
                gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 0.55 });
                tl.to(
                    path,
                    { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" },
                    0.55 + i * 0.11,
                );
            });

            tl.fromTo(
                markers,
                { opacity: 0, scale: 0.2 },
                { opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: "back.out(2)" },
                0.9,
            );

            /* Packets ride the arcs. motionPath with align:path keeps the pip on
               the curve without any per-frame maths in JS, and the repeatDelay
               is randomised so six identical loops never lock into a
               metronome. */
            pips.forEach((pip, i) => {
                gsap.set(pip, { opacity: 0 });
                gsap.to(pip, {
                    motionPath: { path: arcs[i], align: arcs[i], alignOrigin: [0.5, 0.5] },
                    duration: 2.6 + i * 0.2,
                    ease: "none",
                    repeat: -1,
                    repeatDelay: 1.1 + i * 0.45,
                    delay: 2.1 + i * 0.3,
                    // Faded in at each departure so the packet does not pop into
                    // existence on top of the marker it is leaving.
                    onStart: () => gsap.to(pip, { opacity: 1, duration: 0.25 }),
                    onRepeat: () => gsap.fromTo(pip, { opacity: 0 }, { opacity: 1, duration: 0.25 }),
                });
            });

            // Hub ring. Infinite, but only one element and only a transform +
            // opacity, so it costs a single composited layer.
            rings.forEach((ring, i) => {
                gsap.fromTo(
                    ring,
                    { scale: 0.4, opacity: 0.6 },
                    {
                        scale: 3.4,
                        opacity: 0,
                        duration: 2.8,
                        ease: "power2.out",
                        repeat: -1,
                        delay: 1.6 + i * 1.4,
                        transformOrigin: "50% 50%",
                    },
                );
            });

            return () => tl.kill();
        },
        { scope: root },
    );

    const hub = NODES.find((n) => n.hub);
    const hubPt = project(hub.lon, hub.lat);

    return (
        <div ref={root} className={className}>
            <svg
                viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                className="h-auto w-full overflow-visible"
                role="img"
                aria-label={`Delivery map — ${NODES.map((n) => n.label).join(", ")}`}
            >
                {/* ── Landmass matrix ─────────────────────────────────────── */}
                <g fill="var(--line)">
                    {DOTS.map((d) => (
                        <circle
                            key={`${d.c}-${d.r}`}
                            data-dot=""
                            cx={d.x}
                            cy={d.y}
                            r="1.7"
                            // transform-box/origin so `scale` pivots on the dot
                            // rather than the SVG's own origin at (0,0).
                            style={{ transformBox: "fill-box", transformOrigin: "center" }}
                        />
                    ))}
                </g>

                {/* ── Arcs ────────────────────────────────────────────────── */}
                <g fill="none" strokeLinecap="round">
                    {ARCS.map((a) => (
                        <path
                            key={a.id}
                            data-arc=""
                            d={a.d}
                            stroke="var(--color-brand-hi)"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                </g>

                {/* ── Packets ─────────────────────────────────────────────── */}
                <g>
                    {ARCS.map((a) => (
                        <circle
                            key={`pip-${a.id}`}
                            data-pip=""
                            r="2.4"
                            fill="var(--color-signal)"
                            style={{ transformBox: "fill-box", transformOrigin: "center" }}
                        />
                    ))}
                </g>

                {/* ── Hub pulse ───────────────────────────────────────────── */}
                <g fill="none" stroke="var(--color-signal)" strokeWidth="1">
                    {[0, 1].map((i) => (
                        <circle
                            key={`ring-${i}`}
                            data-ring=""
                            cx={hubPt.x}
                            cy={hubPt.y}
                            r="6"
                            vectorEffect="non-scaling-stroke"
                            style={{ transformBox: "fill-box", transformOrigin: "center" }}
                        />
                    ))}
                </g>

                {/* ── Nodes ───────────────────────────────────────────────── */}
                <g>
                    {NODES.map((n) => {
                        const p = project(n.lon, n.lat);
                        const on = active === n.id;
                        return (
                            <g
                                key={n.id}
                                onMouseEnter={() => setActive(n.id)}
                                onMouseLeave={() => setActive(null)}
                                onFocus={() => setActive(n.id)}
                                onBlur={() => setActive(null)}
                                tabIndex={0}
                                role="img"
                                aria-label={`${n.label} — ${n.meta}`}
                                className="cursor-pointer outline-none"
                            >
                                {/* data-marker is on an INNER group holding only the
                    circles. transform-box: fill-box resolves against the
                    element's own bounding box, and the label below sits
                    12px to the side — inside the outer <g>, the scale-in
                    would pivot around a box that includes it and the
                    marker would visibly slide sideways as it pops. */}
                                <g
                                    data-marker=""
                                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                                >
                                    {/* Hit area. The visible marker is 3–4px across; a
                      pointer target that small is unusable, and growing
                      the marker to fix it would wreck the graphic. */}
                                    <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={n.hub ? 4 : 3}
                                        fill={
                                            n.hub ? "var(--color-signal)" : "var(--color-brand-hi)"
                                        }
                                    />
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={n.hub ? 8 : 6.5}
                                        fill="none"
                                        stroke={
                                            n.hub ? "var(--color-signal)" : "var(--color-brand-hi)"
                                        }
                                        strokeWidth="1"
                                        vectorEffect="non-scaling-stroke"
                                        opacity={on ? 0.9 : 0.3}
                                        className="transition-opacity duration-200"
                                    />
                                </g>

                                {/* Label lives in the SVG so it tracks the node under
                    every viewBox scale. text-anchor flips near the right
                    edge so Sydney's label does not run off the frame. */}
                                <text
                                    x={p.x + (p.x > MAP_W * 0.82 ? -12 : 12)}
                                    y={p.y + 3.5}
                                    textAnchor={p.x > MAP_W * 0.82 ? "end" : "start"}
                                    className="pointer-events-none font-mono text-[9px] tracking-[0.14em] uppercase transition-opacity duration-200"
                                    fill="var(--text)"
                                    opacity={on ? 1 : 0}
                                >
                                    {n.label}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
}
