"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import SectionIndex from "@/components/ui/SectionIndex";
import ServiceMedia from "@/components/ui/ServiceMedia";
import useSplitReveal from "@/components/motion/useSplitReveal";
import { cn, pad } from "@/lib/utils";

/**
 * 02 // CAPABILITIES — an editorial index with a sticky preview.
 *
 * ── WHY THIS REPLACED THE ACCORDION ──────────────────────────────────────
 * The accordion was the right answer while a service was six lines of text and
 * nothing else: one open at a time, the rest legible as a list. Services now
 * carry artwork, and an accordion has nowhere to put a picture. Opening a
 * panel to reveal an image means the image is invisible until clicked, which
 * is the opposite of what artwork is for, and animating a panel's height with
 * an image inside it re-lays out the document on every click.
 *
 * The index solves the same problem the accordion solved — nine services in
 * the vertical space of three card rows, every one named at rest — and gives
 * the artwork a fixed frame that never moves. Hovering or focusing a row swaps
 * what is in the frame. Nothing expands, so nothing below this section shifts,
 * so there is no ScrollTrigger invalidation and no refresh to debounce.
 *
 * ── WHY THE LAYER STACK ──────────────────────────────────────────────────
 * A crossfade needs the outgoing image on screen while the incoming one
 * arrives, and React unmounts the old one the instant state changes. So the
 * swap pushes a layer instead of replacing one: the new image mounts on top,
 * wipes in over the old, and the tween's onComplete drops everything beneath
 * it. Two layers exist for ~0.7s and one layer the rest of the time.
 *
 * The rejected alternative was rendering all nine images absolutely positioned
 * and toggling opacity. It is less code and it downloads nine images the
 * moment this section enters the viewport, because they all share one
 * intersection box and next/image's lazy loading cannot tell them apart.
 *
 * ── WHY HOVER SETS STATE BUT CLICK NAVIGATES ─────────────────────────────
 * The row is a link to the service page, which is what someone scanning this
 * list actually wants. Hover and focus are preview, not selection, so there is
 * no click-to-open state to get out of and keyboard users get the same preview
 * by tabbing. On touch there is no hover at all, which is why the preview
 * column is desktop only and every row carries its own image below `lg`.
 */
export default function CapabilityStack({ services }) {
    const root = useRef(null);
    const frame = useRef(null);
    const meta = useRef(null);

    /* getServices can legitimately return [] during an API outage before the
       static fallback kicks in. Every read below indexes into this array, so
       the guard is load-bearing, not defensive decoration. */
    const hasServices = services?.length > 0;

    const heading = useSplitReveal({ type: "words", stagger: 0.04 });

    const [active, setActive] = useState(0);
    /* Layers are keyed by a monotonic id, not by index: previewing 1 → 2 → 1
       within one tween would otherwise reuse a key that is still animating out
       and React would reconcile the two into one element mid-tween. */
    const nextLayerId = useRef(1);
    const [layers, setLayers] = useState([{ id: 0, index: 0 }]);

    /* activeRef, not the `active` state, is what guards the duplicate check.
       reactStrictMode is on, so a state updater runs twice in development, and
       queueing the layer push from inside setActive's updater would append the
       same layer twice and leave a frame permanently stacked on the preview.
       The id is read outside the updater for the same reason. */
    const activeRef = useRef(0);
    const preview = useCallback((i) => {
        if (activeRef.current === i) return;
        activeRef.current = i;
        const id = nextLayerId.current++;
        setActive(i);
        setLayers((ls) => [...ls, { id, index: i }]);
    }, []);

    /* ── preview swap ──────────────────────────────────────────────────── */
    useGSAP(
        () => {
            const nodes = gsap.utils.toArray("[data-layer]", frame.current);
            if (nodes.length < 2) return;

            const incoming = nodes[nodes.length - 1];
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            const settle = () => setLayers((ls) => ls.slice(-1));

            if (reduced) {
                gsap.set(incoming, { autoAlpha: 1 });
                settle();
                return;
            }

            /* A clip-path wipe rather than a crossfade. Two photographs fading
               through each other spend half the transition as a muddy double
               exposure; a wipe keeps both images fully opaque and reads as one
               sheet sliding over another. The inner scale is what stops the
               incoming frame from feeling static while its mask travels. */
            gsap
                .timeline({ onComplete: settle })
                .fromTo(
                    incoming,
                    { clipPath: "inset(0% 0% 100% 0%)", autoAlpha: 1 },
                    { clipPath: "inset(0% 0% 0% 0%)", duration: 0.62, ease: "power3.inOut" },
                )
                .fromTo(
                    incoming.firstElementChild,
                    { scale: 1.12 },
                    { scale: 1, duration: 0.9, ease: "power3.out" },
                    0,
                );
        },
        { scope: frame, dependencies: [layers.length] },
    );

    /* ── caption swap ──────────────────────────────────────────────────── */
    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reduced) return;

            // Short and small: the caption is secondary to the image, and a
            // caption that takes as long as the wipe reads as lag.
            gsap.fromTo(
                gsap.utils.toArray("[data-meta]", meta.current),
                { autoAlpha: 0, y: 10 },
                { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.05 },
            );
        },
        { scope: meta, dependencies: [active] },
    );

    /* ── entrance ──────────────────────────────────────────────────────── */
    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reduced) return;

            const tl = gsap.timeline({
                scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
            });

            tl.from(gsap.utils.toArray("[data-cap-row]", root.current), {
                autoAlpha: 0,
                y: 26,
                duration: 0.7,
                ease: "power3.out",
                stagger: 0.06,
            }).from(
                frame.current,
                { autoAlpha: 0, clipPath: "inset(0% 0% 100% 0%)", duration: 0.9, ease: "power3.out" },
                0.15,
            );
        },
        { scope: root },
    );

    // After every hook, never before: an early return above them changes the
    // hook count between renders.
    if (!hasServices) return null;

    return (
        <section id="services" ref={root} className="border-b border-(--line)">
            <div className="shell py-24 md:py-32">
                <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                        <SectionIndex index="02" label="Capabilities" />
                        <h2 ref={heading} className="text-heading mt-6">
                            Nine disciplines, one delivery team.
                        </h2>
                    </div>
                    <p className="max-w-lg self-end text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-6 lg:col-start-7">
                        From the first architecture decision to the render that sells the unit, STR
                        covers what a product needs to launch and what it needs to keep running once
                        the launch team has moved on. Hover a line to see the work.
                    </p>
                </div>

                <div className="mt-14 grid grid-cols-1 gap-x-14 gap-y-12 lg:mt-20 lg:grid-cols-12">
                    {/* ── the index ─────────────────────────────────────── */}
                    <ol className="border-t border-(--line) lg:col-span-7">
                        {services.map((s, i) => {
                            const isActive = i === active;
                            return (
                                <li
                                    key={s.slug}
                                    data-cap-row=""
                                    className="group/row border-b border-(--line)"
                                >
                                    <Link
                                        href={`/services/${s.slug}`}
                                        onMouseEnter={() => preview(i)}
                                        onFocus={() => preview(i)}
                                        className="block py-5 md:py-6"
                                    >
                                        <div className="flex items-baseline gap-5 md:gap-8">
                                            <span
                                                className={cn(
                                                    "label-mono w-8 shrink-0 tabular-nums transition-colors duration-300",
                                                    isActive ? "text-brand" : "text-(--text-mute)",
                                                )}
                                            >
                                                {pad(i + 1)}
                                            </span>

                                            {/* translateX on hover, not scale. The row
                          steps forward without anything changing size,
                          which is the difference between a list that
                          responds and a list that wobbles. */}
                                            <span
                                                className={cn(
                                                    "flex-1 text-[clamp(1.25rem,2.4vw,1.95rem)] leading-tight font-medium tracking-[-0.03em] transition-[color,transform] duration-400 ease-out",
                                                    isActive
                                                        ? "translate-x-1.5 text-(--text)"
                                                        : "text-(--text-dim) group-hover/row:translate-x-1.5 group-hover/row:text-(--text)",
                                                )}
                                            >
                                                {s.title}
                                            </span>

                                            <span className="label-mono hidden shrink-0 text-(--text-mute) md:block">
                                                {s.deliverableTimeline}
                                            </span>

                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    "shrink-0 text-(--text-mute) transition-[transform,color] duration-400 ease-out",
                                                    isActive
                                                        ? "translate-x-0 text-brand"
                                                        : "-translate-x-2 opacity-0 group-hover/row:translate-x-0 group-hover/row:opacity-100",
                                                )}
                                            >
                                                →
                                            </span>
                                        </div>

                                        {/* Below lg there is no hover and no sticky
                        column, so every row carries its own artwork and
                        its own line of copy. Hidden from the preview
                        column's duty entirely rather than reflowed into
                        it. */}
                                        <div className="mt-5 lg:hidden">
                                            <ServiceMedia
                                                src={s.image}
                                                alt=""
                                                title={s.title}
                                                index={i + 1}
                                                sizes="(max-width: 1024px) 92vw, 40vw"
                                                className="aspect-[16/10] rounded-xl border border-(--line)"
                                            />
                                            <p className="mt-4 text-[0.9375rem] leading-relaxed text-(--text-mute)">
                                                {s.shortDescription}
                                            </p>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ol>

                    {/* ── the preview ───────────────────────────────────── */}
                    <div className="hidden lg:col-span-5 lg:block">
                        <div className="sticky top-28">
                            <div
                                ref={frame}
                                aria-hidden="true"
                                className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-(--line) bg-(--raised)"
                            >
                                {layers.map((layer) => {
                                    const s = services[layer.index];
                                    return (
                                        <div
                                            key={layer.id}
                                            data-layer=""
                                            className="absolute inset-0"
                                        >
                                            {/* The extra wrapper is the scale target:
                          scaling the clipped element itself would scale
                          its own mask with it and the wipe would not
                          travel. */}
                                            <ServiceMedia
                                                src={s.image}
                                                alt=""
                                                title={s.title}
                                                index={layer.index + 1}
                                                sizes="40vw"
                                                className="size-full"
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <div ref={meta} className="mt-7">
                                <p
                                    data-meta=""
                                    className="label-mono flex items-center gap-2.5 text-(--text-mute)"
                                >
                                    <span className="text-brand tabular-nums">
                                        {pad(active + 1)}
                                    </span>
                                    <span
                                        aria-hidden="true"
                                        className="block size-1 rounded-full bg-(--line)"
                                    />
                                    <span>{services[active].deliverableTimeline}</span>
                                </p>

                                <p
                                    data-meta=""
                                    className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-(--text-dim)"
                                >
                                    {services[active].shortDescription}
                                </p>

                                <Link
                                    data-meta=""
                                    href={`/services/${services[active].slug}`}
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
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
