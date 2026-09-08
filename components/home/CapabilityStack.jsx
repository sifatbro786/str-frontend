"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { refreshScroll } from "@/lib/scrollRefresh";
import SectionIndex from "@/components/ui/SectionIndex";
import useSplitReveal from "@/components/motion/useSplitReveal";
import { cn, pad } from "@/lib/utils";

/**
 * 02 // CAPABILITIES — an accordion of the full service line.
 *
 * ── WHY AN ACCORDION AND NOT A CARD GRID ─────────────────────────────────
 * Seven services in a grid is either two ragged rows of uneven cards or an
 * arbitrary "top 6 + view all". A stack takes the same vertical space as three
 * card rows, shows every service by name at rest, and gives the open one
 * enough room for the actual detail — which is the thing a prospect is
 * scanning for.
 *
 * ── WHY height IS TWEENED AND NOT max-height ─────────────────────────────
 * The CSS trick is `max-height: 0 → 900px`, which means every panel takes the
 * same duration to open regardless of content, and short panels finish early
 * and then sit still while the transition runs out. GSAP's `height: "auto"`
 * measures the real target and the duration matches the distance.
 *
 * The cost is that height is a layout property. It is paid once per click on a
 * subtree of ~15 nodes, which is nothing — and the alternative (scaleY on a
 * transformed panel) squashes the type inside it.
 *
 * ── WHY THE REFRESH IS DEBOUNCED ─────────────────────────────────────────
 * Opening a panel changes the document height, which invalidates every trigger
 * start position below this section. Without a refresh, the work grid's reveal
 * fires ~300px early for the rest of the session.
 *
 * But refresh() re-measures the entire document, and calling it directly in
 * this tween's onComplete meant one full pass per click, arriving on the frame
 * right after a layout-property animation had finished dirtying layout. Anyone
 * clicking through the list felt it. lib/scrollRefresh coalesces the burst into
 * one trailing call.
 */
export default function CapabilityStack({ services }) {
    const root = useRef(null);
    const panels = useRef([]);
    const [open, setOpen] = useState(0);

    const heading = useSplitReveal({ type: "words", stagger: 0.04 });

    // Toggle. Split out of the effect below because it must run on click, not on
    // the `open` dependency — driving it from the effect would animate on first
    // mount as well and expand the panel with a visible slide on page load.
    const toggle = (i) => setOpen((prev) => (prev === i ? -1 : i));

    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            panels.current.forEach((el, i) => {
                if (!el) return;
                const isOpen = i === open;

                if (reduced) {
                    gsap.set(el, { height: isOpen ? "auto" : 0, autoAlpha: isOpen ? 1 : 0 });
                    return;
                }

                /* 0.34s, down from 0.55, and power2.out rather than power3.inOut.
                   An inOut curve spends its first third barely moving, so a
                   half-second panel felt like three quarters of one: the click
                   registered visually well after it happened. An out curve
                   leaves immediately, which is what makes a disclosure feel
                   responsive. Closing is faster still (see timeScale below) —
                   a dismissal that takes as long as the reveal always feels
                   broken. */
                gsap.to(el, {
                    height: isOpen ? "auto" : 0,
                    autoAlpha: isOpen ? 1 : 0,
                    duration: isOpen ? 0.34 : 0.26,
                    ease: isOpen ? "power2.out" : "power2.in",
                    overwrite: "auto",
                    onComplete: refreshScroll,
                });
            });
        },
        { scope: root, dependencies: [open] },
    );

    // Row entrance. Separate context with no dependencies so it runs exactly
    // once — folding it into the effect above would replay the entrance on
    // every open/close.
    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reduced) return;

            gsap.from(gsap.utils.toArray("[data-cap-row]", root.current), {
                autoAlpha: 0,
                y: 26,
                duration: 0.75,
                ease: "power3.out",
                stagger: 0.07,
                scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
            });
        },
        { scope: root },
    );

    return (
        <section id="services" ref={root} className="border-b border-(--line)">
            <div className="shell py-24 md:py-32">
                <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                        <SectionIndex index="02" label="Capabilities" />
                        <h2 ref={heading} className="text-heading mt-6">
                            Solutions built around your business goals.
                        </h2>
                    </div>
                    <p className="max-w-lg self-end text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-6 lg:col-start-7">
                        From data pipelines to intelligent software, STR covers the full stack a
                        product needs to launch and to keep running once the launch team has moved
                        on. Pick a line to see what an engagement in it actually involves.
                    </p>
                </div>

                <div className="mt-14 border-t border-(--line)">
                    {services.map((s, i) => {
                        const isOpen = i === open;
                        const panelId = `cap-panel-${s.slug}`;
                        return (
                            <div
                                key={s.slug}
                                data-cap-row=""
                                className={cn(
                                    "group/row border-b border-(--line) transition-colors duration-300",
                                    isOpen && "bg-(--raised)",
                                )}
                            >
                                <h3>
                                    <button
                                        type="button"
                                        onClick={() => toggle(i)}
                                        aria-expanded={isOpen}
                                        aria-controls={panelId}
                                        className="flex w-full items-center gap-5 px-4 py-7 text-left md:gap-8 md:px-6"
                                    >
                                        <span className="label-mono w-8 shrink-0 text-(--text-mute)">
                                            {pad(i + 1)}
                                        </span>

                                        {/* translateX on hover, not scale and not a
                        shadow. It reads as the row stepping forward
                        without changing anything's size. */}
                                        <span
                                            className={cn(
                                                "flex-1 text-[clamp(1.35rem,2.6vw,2.1rem)] leading-tight font-medium tracking-[-0.03em] transition-[color,transform] duration-400 ease-out",
                                                isOpen
                                                    ? "translate-x-1.5 text-(--text)"
                                                    : "text-(--text-dim) group-hover/row:translate-x-1.5 group-hover/row:text-(--text)",
                                            )}
                                        >
                                            {s.title}
                                        </span>

                                        <span className="label-mono hidden shrink-0 text-(--text-mute) md:block">
                                            {s.deliverableTimeline}
                                        </span>

                                        {/* Two rules crossing, one of which rotates away.
                        A chevron that flips 180° is the same information
                        with more ink. */}
                                        <span
                                            aria-hidden="true"
                                            className="relative block size-4 shrink-0"
                                        >
                                            <span className="absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 bg-(--text)" />
                                            <span
                                                className={cn(
                                                    "absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 bg-(--text) transition-transform duration-400 ease-out",
                                                    isOpen ? "rotate-0" : "rotate-90",
                                                )}
                                            />
                                        </span>
                                    </button>
                                </h3>

                                {/* overflow-hidden is on the animated element itself —
                    the height tween has nothing to clip otherwise. */}
                                <div
                                    id={panelId}
                                    ref={(el) => {
                                        panels.current[i] = el;
                                    }}
                                    className="overflow-hidden"
                                    style={{ height: i === 0 ? "auto" : 0 }}
                                >
                                    <div className="grid grid-cols-1 gap-8 px-4 pb-9 md:grid-cols-12 md:px-6 md:pl-17">
                                        <div className="md:col-span-5">
                                            <p className="max-w-md text-[0.9375rem] leading-relaxed text-(--text-dim)">
                                                {s.shortDescription}
                                            </p>
                                            <Link
                                                href={`/services/${s.slug}`}
                                                className="group/l mt-6 inline-flex items-center gap-2.5 text-sm text-(--text) transition-colors hover:text-brand"
                                            >
                                                Read the full brief
                                                <span
                                                    aria-hidden="true"
                                                    className="transition-transform duration-300 group-hover/l:translate-x-1"
                                                >
                                                    →
                                                </span>
                                            </Link>
                                        </div>

                                        {/* Plain rows on hairlines. The previous version put a
                        coloured 10px rule in front of every item, which is
                        seven decorative marks per open panel doing no work
                        that the list structure was not already doing. */}
                                        <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 md:col-span-7">
                                            {s.featuresList.slice(0, 6).map((f) => (
                                                <li
                                                    key={f}
                                                    className="border-b border-(--line-soft) py-2.5 text-[0.875rem] leading-relaxed text-(--text-mute) last:border-b-0"
                                                >
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
