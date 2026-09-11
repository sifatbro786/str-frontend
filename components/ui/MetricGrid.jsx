"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * A hairline grid of counted metrics.
 *
 * ── WHY THE COUNTERS ARE NOT React STATE ─────────────────────────────────
 * Counting 0 to 140 in state is 140 renders of a subtree, per counter, all
 * landing in React's scheduler while ScrollSmoother is also asking for
 * frames. The number is written straight to textContent from a tween on a
 * plain object: no reconciliation, no re-render, and it composites cleanly.
 *
 * ── WHY tabular-nums IS NOT OPTIONAL HERE ────────────────────────────────
 * Proportional digits change width as they tick, so the label under a counter
 * jitters left and right for the whole run. `.nums` pins the advance width.
 * This is the single most common polish failure in animated stat rows.
 *
 * ── WHY snap AND NOT Math.round IN onUpdate ──────────────────────────────
 * snap runs inside GSAP's interpolation, so the eased curve is preserved.
 * Rounding the output in onUpdate quantises after easing and produces visible
 * plateaus near the end of an ease-out, where the curve is already flat.
 *
 * ⚑ components/home/AboutStatement.jsx carries a near-identical counter. It
 * is woven into that section's own layout, so it was left alone rather than
 * refactored mid-flight — but if a third one appears, collapse all three onto
 * this component.
 *
 * @param {Array} metrics [{ value, suffix, label, note }]
 */
export default function MetricGrid({ metrics, className }) {
    const root = useRef(null);

    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            gsap.utils.toArray("[data-count]", root.current).forEach((el) => {
                const target = Number(el.dataset.count);
                if (!Number.isFinite(target)) return;

                if (reduced) {
                    el.textContent = String(target);
                    return;
                }

                const box = { v: 0 };
                el.textContent = "0";

                gsap.to(box, {
                    v: target,
                    duration: 1.6,
                    ease: "power2.out",
                    snap: { v: 1 },
                    onUpdate: () => {
                        el.textContent = String(box.v);
                    },
                    scrollTrigger: { trigger: el, start: "top 88%", once: true },
                });
            });
        },
        { scope: root },
    );

    // Callers render this inside their own section, so returning null here
    // drops the band and leaves the surrounding copy intact.
    if (!metrics?.length) return null;

    return (
        <dl
            ref={root}
            className={`grid grid-cols-2 gap-px border border-(--line) bg-(--line) md:grid-cols-4 ${className ?? ""}`}
        >
            {metrics.map((m) => (
                <div key={m.label} className="bg-(--canvas) px-5 py-7">
                    <dd className="nums text-[clamp(2rem,3.4vw,2.75rem)] leading-none font-medium tracking-[-0.04em] text-(--text)">
                        <span data-count={m.value}>{m.value}</span>
                        <span className="text-brand">{m.suffix}</span>
                    </dd>
                    <dt className="mt-3 text-[0.9375rem] text-(--text-dim)">{m.label}</dt>
                    {m.note && <p className="label-mono mt-2 text-(--text-mute)">{m.note}</p>}
                </div>
            ))}
        </dl>
    );
}
