"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import SectionIndex from "@/components/ui/SectionIndex";
import useSplitReveal from "@/components/motion/useSplitReveal";

/**
 * 04 // WORK — featured case studies.
 *
 * ── WHY THE HOVER STATE IS CSS AND THE ENTRANCE IS GSAP ──────────────────
 * Hover is a two-state toggle the compositor already handles for free through
 * a transition; wiring it to GSAP would add a tween allocation per pointer
 * event across eight elements for an identical result. Scroll entrance is
 * position-dependent and staggered, which CSS cannot express at all. Use the
 * cheapest tool that can express the thing — the split is not stylistic.
 *
 * ── WHY `once: true` ON EVERY REVEAL ─────────────────────────────────────
 * A card that re-animates when you scroll back up is a card that fights the
 * reader. Reveals on this site fire exactly once per page load.
 *
 * ── liveUrl HANDLING ─────────────────────────────────────────────────────
 * The card links to the case study; the live site is a second, separately
 * focusable link. Nesting an <a> inside an <a> is invalid HTML and React will
 * render it, so the outer element is a link only on the image/title and the
 * live link sits outside its box, not on top of it.
 */
export default function SelectedWork({ projects }) {
    const root = useRef(null);
    const heading = useSplitReveal({ type: "words", stagger: 0.04 });

    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reduced) return;

            gsap.utils.toArray("[data-work-card]", root.current).forEach((card, n) => {
                gsap.from(card, {
                    autoAlpha: 0,
                    y: 44,
                    duration: 0.9,
                    ease: "power3.out",
                    // Odd cards trail by a beat so the two columns arrive out of
                    // phase. A synchronised pair reads as one wide block dropping
                    // in, which loses the grid entirely.
                    delay: (n % 2) * 0.12,
                    scrollTrigger: { trigger: card, start: "top 88%", once: true },
                });
            });
        },
        { scope: root },
    );

    return (
        <section id="work" ref={root} className="border-b border-(--line)">
            <div className="shell py-24 md:py-32">
                <div className="flex flex-wrap items-end justify-between gap-8">
                    <div className="max-w-xl">
                        <SectionIndex index="04" label="Selected work" />
                        <h2 ref={heading} className="text-heading mt-6">
                            Shipped, measured, still running.
                        </h2>
                    </div>
                    <Link
                        href="/projects"
                        className="group/all inline-flex items-center gap-3 rounded-full border border-(--line) px-5 py-2.5 text-sm text-(--text) transition-colors hover:border-(--text)"
                    >
                        All case studies
                        <span
                            aria-hidden="true"
                            className="inline-block transition-transform duration-300 group-hover/all:translate-x-1"
                        >
                            →
                        </span>
                    </Link>
                </div>

                <div className="mt-14 grid grid-cols-1 gap-px bg-(--line) md:grid-cols-2">
                    {projects.map((p) => (
                        <article
                            key={p.slug}
                            data-work-card=""
                            className="group/card flex flex-col bg-(--canvas) p-5 md:p-7"
                        >
                            <Link
                                href={`/projects/${p.slug}`}
                                className="relative block aspect-16/10 overflow-hidden border border-(--line)"
                            >
                                <Image
                                    src={p.thumbnailImage || p.coverImage}
                                    alt={`${p.title} — ${p.subtitle}`}
                                    fill
                                    sizes="(min-width: 768px) 46vw, 92vw"
                                    className="object-cover object-top transition-transform duration-700 ease-out group-hover/card:scale-[1.04]"
                                />
                                {/* Accent rule keyed to the project's own colour.
                    scaleX from the left on hover — a coloured overlay wash
                    would obscure the screenshot the card exists to show. */}
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-x-0 bottom-0 block h-0.5 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover/card:scale-x-100"
                                    style={{ backgroundColor: p.accentColor }}
                                />
                            </Link>

                            <div className="mt-6 flex flex-1 flex-col">
                                <div className="label-mono flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-(--text-mute)">
                                    <span className="text-brand">{p.clientName}</span>
                                    <span
                                        aria-hidden="true"
                                        className="block size-1 rounded-full bg-(--line)"
                                    />
                                    <span>{p.tags.slice(0, 2).join(", ")}</span>
                                </div>

                                <h3 className="mt-4 text-[1.5rem] leading-tight">
                                    <Link
                                        href={`/projects/${p.slug}`}
                                        className="inline-block transition-transform duration-400 ease-out group-hover/card:translate-x-1.5"
                                    >
                                        {p.title}
                                    </Link>
                                </h3>

                                <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-(--text-dim)">
                                    {p.subtitle}
                                </p>

                                <div className="mt-auto flex items-center gap-6 pt-7">
                                    <Link
                                        href={`/projects/${p.slug}`}
                                        className="group/read inline-flex items-center gap-2.5 text-sm text-(--text) transition-colors hover:text-brand"
                                    >
                                        Case study
                                        <span
                                            aria-hidden="true"
                                            className="transition-transform duration-300 group-hover/read:translate-x-1"
                                        >
                                            →
                                        </span>
                                    </Link>

                                    {p.liveUrl ? (
                                        <a
                                            href={p.liveUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="label-mono inline-flex items-center gap-2 text-(--text-mute) transition-colors hover:text-(--text)"
                                        >
                                            Live site
                                            <svg
                                                width="10"
                                                height="10"
                                                viewBox="0 0 12 12"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M3 9 9 3M4.2 3H9v4.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
