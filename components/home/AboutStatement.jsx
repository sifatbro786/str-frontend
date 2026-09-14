"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { refreshScroll } from "@/lib/scrollRefresh";
import SectionIndex from "@/components/ui/SectionIndex";
import useSplitReveal from "@/components/motion/useSplitReveal";

/**
 * 01 // ABOUT — the value statement plus the four numbers that back it.
 *
 * ── WHY THE COUNTERS ARE NOT React STATE ─────────────────────────────────
 * Counting 0→140 as state is 140 renders of a subtree, per counter, all
 * landing in React's scheduler while ScrollSmoother is also asking for frames.
 * The number is written straight to textContent from a GSAP tween on a plain
 * object — no reconciliation, no re-render, and it composites cleanly.
 *
 * ── WHY tabular-nums IS NOT OPTIONAL HERE ────────────────────────────────
 * Proportional digits change width as they tick, so the metric label under a
 * counter jitters left and right for the whole 1.6s. `.nums` pins the advance
 * width. This is the single most common polish failure in animated stat rows.
 */
export default function AboutStatement({ metrics }) {
    const root = useRef(null);
    const statement = useSplitReveal({ type: "words", stagger: 0.035 });

    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const q = gsap.utils.selector(root);

            const counters = q("[data-count]");

            counters.forEach((el) => {
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
                    // snap, not Math.round in onUpdate: snap runs inside GSAP's
                    // interpolation so the eased curve is preserved. Rounding in
                    // onUpdate quantises the *output* and produces visible plateaus
                    // near the end of an ease-out.
                    snap: { v: 1 },
                    onUpdate: () => {
                        el.textContent = String(box.v);
                    },
                    scrollTrigger: { trigger: el, start: "top 88%", once: true },
                });
            });

            if (reduced) return;

            gsap.from(q("[data-about-panel]"), {
                autoAlpha: 0,
                y: 40,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: q("[data-about-panel]")[0],
                    start: "top 85%",
                    once: true,
                },
            });

            /* Parallax on the panel image. data-speed on the smoother would be
               simpler, but ScrollSmoother effects measure from the untransformed
               layout position and the reveal above already translates the panel —
               the two systems then fight. One yPercent tween scrubbed by its own
               trigger has no such coupling. */
            const img = q("[data-about-img]")[0];
            if (img) {
                gsap.fromTo(
                    img,
                    { yPercent: -6 },
                    {
                        yPercent: 6,
                        ease: "none",
                        scrollTrigger: {
                            trigger: img.parentElement,
                            start: "top bottom",
                            end: "bottom top",
                            scrub: true,
                        },
                    },
                );
            }

            // Debounced: this section's image is one of several things that
            // settle late, and each of them calling refresh() directly is how a
            // single font swap turned into half a dozen document re-measures.
            refreshScroll();
        },
        { scope: root },
    );

    return (
        <section id="about" ref={root} className="border-b border-(--line)">
            <div className="shell py-24 md:py-32">
                <div className="grid grid-cols-1 gap-x-10 gap-y-12 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                        <SectionIndex index="01" label="About STR" />
                        <h2 ref={statement} className="text-heading mt-6">
                            We build products that connect the physical and digital world.
                        </h2>
                        <p className="mt-8 max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim)">
                            Engineering, design and visual production sit under one roof here, in a
                            timezone that overlaps yours. About half our work leaves Bangladesh. The
                            rest of it runs the businesses next door.
                        </p>
                        <Link
                            href="/about"
                            className="group/link mt-10 inline-flex items-center gap-3 rounded-full border border-(--line) px-5 py-2.5 text-sm text-(--text) transition-colors hover:border-(--text)"
                        >
                            How the studio is organised
                            <span
                                aria-hidden="true"
                                className="inline-block transition-transform duration-300 group-hover/link:translate-x-1"
                            >
                                →
                            </span>
                        </Link>
                    </div>

                    <div data-about-panel="" className="lg:col-span-7">
                        {/* Fixed aspect + overflow-hidden so the parallax translate
                has somewhere to travel without changing document height.

                ── WHY THIS IS A CENTRED LOGO AND NOT A FULL-BLEED IMAGE ──
                It held a screenshot, which is what `fill` + object-cover is
                for: a photo big enough to crop, bleeding to all four edges. A
                logo is the opposite kind of asset. Covering with it crops the
                wordmark and blows a 395px-wide file up to panel width, so it
                arrives cropped AND soft. So the panel became a brand plate:
                the logo sits at its natural size on a surface, contained
                rather than cropped. */}
                        <div className="relative grid aspect-16/10 place-items-center overflow-hidden border border-(--line) bg-(--raised)">
                            <Image
                                data-about-img=""
                                src="/logo.png"
                                alt="STR Solutions Limited"
                                /* The file's OWN pixel dimensions, not the size it
                                   renders at. Next only needs them to reserve the
                                   right box before the bytes arrive — that is what
                                   stops the layout shifting. CSS below decides how
                                   big it actually looks. */
                                width={395}
                                height={146}
                                /* The widest this ever renders, which is what the
                                   max-w below pins it to. Any larger hint picks the
                                   same file anyway — the 395px source is the
                                   ceiling, so Next caps every variant there.

                                   ⚑ Which is also the one real limit here: on a 2x
                                   display this needs ~660px and there are only 395,
                                   so it renders slightly soft on a retina screen.
                                   Not fixable in this file — it wants a bigger
                                   export of /logo.png (790x292 covers 2x). */
                                sizes="395px"
                                /* max-w caps it at 1:1 with the source. Past that a
                                   395px PNG is being upscaled and goes visibly soft,
                                   which on a logo reads as a broken export. */
                                className="h-auto w-[46%] max-w-[395px] will-change-transform"
                                priority={false}
                            />
                        </div>

                        <dl className="mt-px grid grid-cols-2 gap-px border border-(--line) bg-(--line) md:grid-cols-4">
                            {metrics.map((m) => (
                                <div key={m.label} className="bg-(--canvas) px-5 py-7">
                                    <dd className="nums text-[clamp(2rem,3.4vw,2.75rem)] leading-none font-medium tracking-[-0.04em] text-(--text)">
                                        <span data-count={m.value}>{m.value}</span>
                                        <span className="text-brand">{m.suffix}</span>
                                    </dd>
                                    <dt className="mt-3 text-[0.8125rem] text-(--text-dim)">
                                        {m.label}
                                    </dt>
                                    <p className="label-mono mt-2 text-(--text-mute)">{m.note}</p>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>
        </section>
    );
}
