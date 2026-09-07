"use client";

import { useId, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * The oversized mark, in three layers.
 *
 *   1 · hollow — stroked outline, always present. This is the rest state.
 *   2 · solid  — filled in --text, revealed left-to-right by a scroll-scrubbed
 *                gradient mask. The mark fills in as you arrive at it.
 *   3 · spot   — filled in --color-signal, revealed only by a soft radial mask
 *                that follows the cursor. Move the pointer near the mark and
 *                the letters under it go solid and warm; move away and they
 *                hollow out again.
 *
 * Mask channels are additive, so the sweep and the spot compose for free — no
 * blend modes, no second render pass.
 *
 * ── WHY A FILL SWEEP AND NOT SCRAMBLE ────────────────────────────────────
 * ScrambleText rewrites textContent every frame. This mark uses textLength +
 * lengthAdjust="spacingAndGlyphs" to pin itself to exactly the container
 * width, so every one of those rewrites forces the SVG text engine to re-fit
 * glyph spacing across 1000 user units — at 60fps, on the largest text node on
 * the page. It thrashes, and it looks like a bug rather than a flourish at
 * this scale. The sweep is a mask transform: composited, and it reads as light
 * moving across the letters, which is the effect the brief actually wants.
 *
 * ── WHY textLength SURVIVES ──────────────────────────────────────────────
 * It is also what keeps the mark aligned with the grid above it in the moment
 * before General Sans arrives from the Fontshare CDN — a font-size-driven mark
 * overflows its container on the fallback stack and snaps when the swap lands.
 */

const W = 1000;
const H = 84;
const SPOT_R = 240; // user units — roughly two letterforms wide
const PROXIMITY = 280; // css px from the mark's box at which the spot dies

export default function KineticWordmark({ text }) {
    const uid = useId().replace(/:/g, "");
    const maskSweep = `sweep-${uid}`;
    const maskSpot = `spot-${uid}`;
    const gradEdge = `edge-${uid}`;
    const gradSpot = `radial-${uid}`;

    const root = useRef(null);
    const sweep = useRef(null);
    const spot = useRef(null);

    useGSAP(
        () => {
            const svg = root.current;
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

            if (reduced) {
                gsap.set(sweep.current, { x: 0 });
                return;
            }

            /* This mark lives inside FooterReveal's counter-translated inner, and
         ScrollTrigger measures with getBoundingClientRect — triggering on the
         svg itself bakes in whatever the reveal was translated by at refresh
         time, which is up to 26% of the footer's height of error. The reveal
         window is the last untransformed box, so both triggers anchor to it
         and express their positions relative to its bottom edge, which is what
         the reader is actually travelling toward. */
            const anchor = svg.closest("[data-footer-mask]") ?? svg;

            /* ── Fill sweep ─────────────────────────────────────────────────── */
            gsap.fromTo(
                sweep.current,
                { x: -W },
                {
                    x: 0,
                    ease: "none",
                    scrollTrigger: {
                        trigger: anchor,
                        // Runs across the last half-viewport of the page and completes at
                        // the exact bottom of the scroll — the mark finishes filling in as
                        // the reader runs out of page.
                        start: "bottom bottom+=55%",
                        end: "bottom bottom",
                        scrub: 0.6, // slight lag so the light trails the scroll
                    },
                },
            );

            /* ── Cursor proximity ───────────────────────────────────────────── */
            if (!fine) return;

            gsap.set(spot.current, { x: W / 2, y: H / 2, autoAlpha: 0 });

            const xTo = gsap.quickTo(spot.current, "x", { duration: 0.45, ease: "power3.out" });
            const yTo = gsap.quickTo(spot.current, "y", { duration: 0.45, ease: "power3.out" });
            const aTo = gsap.quickTo(spot.current, "autoAlpha", {
                duration: 0.5,
                ease: "power2.out",
            });

            const onMove = (e) => {
                const r = svg.getBoundingClientRect();

                // Distance from the pointer to the mark's *box*, not its centre — the
                // mark is ~12:1, so a centre-distance falloff would switch off at the
                // ends of a word the cursor is sitting directly on.
                const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
                const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
                aTo(1 - gsap.utils.clamp(0, 1, Math.hypot(dx, dy) / PROXIMITY));

                // preserveAspectRatio="meet" on a box rendered at the viewBox's own
                // aspect (h-auto w-full) means the mapping is a plain ratio.
                xTo(((e.clientX - r.left) / r.width) * W);
                yTo(((e.clientY - r.top) / r.height) * H);
            };

            /* The listener is bound only while the mark is anywhere near the
         viewport. A window-level pointermove that runs on every route, for a
         node five screens down, is exactly the kind of cost that never shows
         up in a profile as one big thing and shows up everywhere as jank. */
            const st = ScrollTrigger.create({
                trigger: anchor,
                start: "top bottom",
                end: "bottom top",
                onToggle: (self) => {
                    if (self.isActive) {
                        window.addEventListener("pointermove", onMove, { passive: true });
                    } else {
                        window.removeEventListener("pointermove", onMove);
                        aTo(0);
                    }
                },
            });

            return () => {
                window.removeEventListener("pointermove", onMove);
                st.kill();
            };
        },
        { scope: root },
    );

    return (
        <svg
            ref={root}
            aria-hidden="true"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="block h-auto w-full select-none overflow-visible"
        >
            <defs>
                <linearGradient id={gradEdge} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fff" />
                    <stop offset="76%" stopColor="#fff" />
                    {/* The soft trailing edge is the whole reason this is a gradient and
              not a plain rect: a hard mask edge reads as a wipe. */}
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>

                <radialGradient id={gradSpot}>
                    <stop offset="0%" stopColor="#fff" />
                    <stop offset="45%" stopColor="#fff" stopOpacity="0.82" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </radialGradient>

                {/* Explicit userSpaceOnUse bounds. The default mask region is the
            object bbox +10%, which clips the spot the moment it reaches either
            end of the mark. */}
                <mask
                    id={maskSweep}
                    maskUnits="userSpaceOnUse"
                    x={-W}
                    y={-H}
                    width={W * 3}
                    height={H * 3}
                >
                    <rect
                        ref={sweep}
                        x="0"
                        y={-H}
                        width={W}
                        height={H * 3}
                        fill={`url(#${gradEdge})`}
                    />
                </mask>

                <mask
                    id={maskSpot}
                    maskUnits="userSpaceOnUse"
                    x={-W}
                    y={-H}
                    width={W * 3}
                    height={H * 3}
                >
                    <g ref={spot}>
                        <circle cx="0" cy="0" r={SPOT_R} fill={`url(#${gradSpot})`} />
                    </g>
                </mask>
            </defs>

            {/* 1 · hollow */}
            <text
                x="0"
                y="78"
                textLength={W}
                lengthAdjust="spacingAndGlyphs"
                fontSize="100"
                fontWeight="600"
                fill="none"
                stroke="var(--text)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                opacity="0.2"
            >
                {text}
            </text>

            {/* 2 · solid, swept in on scroll */}
            <g mask={`url(#${maskSweep})`}>
                <text
                    x="0"
                    y="78"
                    textLength={W}
                    lengthAdjust="spacingAndGlyphs"
                    fontSize="100"
                    fontWeight="600"
                    fill="var(--text)"
                    opacity="0.09"
                >
                    {text}
                </text>
            </g>

            {/* 3 · signal, under the cursor only */}
            <g mask={`url(#${maskSpot})`}>
                <text
                    x="0"
                    y="78"
                    textLength={W}
                    lengthAdjust="spacingAndGlyphs"
                    fontSize="100"
                    fontWeight="600"
                    fill="var(--color-signal)"
                    opacity="0.5"
                >
                    {text}
                </text>
            </g>
        </svg>
    );
}
