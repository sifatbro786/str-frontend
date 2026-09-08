"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { refreshScroll } from "@/lib/scrollRefresh";
import SectionIndex from "@/components/ui/SectionIndex";
import useSplitReveal from "@/components/motion/useSplitReveal";
import { cn, pad } from "@/lib/utils";
import { site } from "@/lib/site";

/**
 * 07 // FAQ — the closing section.
 *
 * ── WHY THERE IS NO FORM HERE ANY MORE ───────────────────────────────────
 * This section carried a full copy of InquiryForm. That put the same form on
 * two routes, which is two sets of field state, two honeypots and two things
 * to keep in sync with the backend validators. It is always the copy that
 * drifts. /contact owns the form; the homepage's job is to answer the
 * objection that stops someone going there, and then send them.
 *
 * ── WHY THE ACCORDION IS <details>-FREE ──────────────────────────────────
 * Native <details> cannot be animated open: the content has no box until the
 * element is open, so there is nothing to measure a height tween against, and
 * content-visibility transitions are still not reliable across the browsers
 * this site has to serve. Button plus aria-expanded plus a measured height
 * tween is the same semantics with an animation that actually runs.
 *
 * ── WHY height AND NOT max-height ────────────────────────────────────────
 * The CSS trick is `max-height: 0 → 600px`, which gives every answer the same
 * duration regardless of length: short ones finish early and then sit still
 * while the transition runs out. GSAP's `height: "auto"` measures the real
 * target, so the duration matches the distance.
 */
export default function FaqSection({ faqs }) {
    const root = useRef(null);
    const panels = useRef([]);
    const [open, setOpen] = useState(null);

    const heading = useSplitReveal({ type: "words", stagger: 0.04 });

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

                gsap.to(el, {
                    height: isOpen ? "auto" : 0,
                    autoAlpha: isOpen ? 1 : 0,
                    duration: 0.45,
                    ease: "power3.inOut",
                    overwrite: "auto",
                    // Opening a row changes document height and invalidates every
                    // trigger below. Debounced through lib/scrollRefresh: calling
                    // ScrollTrigger.refresh() directly here re-measured the whole
                    // document once per click, on the frame right after a layout
                    // animation had finished dirtying layout.
                    onComplete: refreshScroll,
                });
            });
        },
        { scope: root, dependencies: [open] },
    );

    return (
        <section id="faq" ref={root}>
            <div className="shell pt-24 md:pt-32 pb-10">
                <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                        <SectionIndex index="07" label="Questions answered" />
                        <h2 ref={heading} className="text-heading mt-6">
                            The things people ask before they email.
                        </h2>
                        <p className="mt-8 max-w-sm text-[1.0625rem] leading-relaxed text-(--text-dim)">
                            {site.contact.responseTime} If it is not a fit, we will say so and point
                            you somewhere that is.
                        </p>

                        <Link
                            href="/contact"
                            className="group/cta mt-10 inline-flex items-center gap-2.5 rounded-full bg-(--text) px-7 py-3.5 text-[0.9375rem] font-medium text-(--canvas) transition-colors duration-200 hover:bg-brand hover:text-white"
                        >
                            Start a project
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
                    </div>

                    <div className="lg:col-span-7 lg:col-start-6">
                        <div className="border-t border-(--line)">
                            {faqs.map((f, i) => {
                                const isOpen = i === open;
                                const id = `faq-panel-${i}`;
                                return (
                                    <div key={f.q} className="group/faq border-b border-(--line)">
                                        <h3>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpen((prev) => (prev === i ? null : i))
                                                }
                                                aria-expanded={isOpen}
                                                aria-controls={id}
                                                className="flex w-full items-start gap-5 py-6 text-left"
                                            >
                                                <span className="label-mono mt-1 shrink-0 tabular-nums text-(--text-mute)">
                                                    {pad(i + 1)}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "flex-1 text-[1.125rem] leading-snug font-medium transition-colors duration-300",
                                                        isOpen
                                                            ? "text-(--text)"
                                                            : "text-(--text-dim) group-hover/faq:text-(--text)",
                                                    )}
                                                >
                                                    {f.q}
                                                </span>
                                                {/* Two crossing rules, one of which rotates
                            away. A chevron flipping 180 degrees is the
                            same information with more ink. */}
                                                <span
                                                    aria-hidden="true"
                                                    className="relative mt-2 block size-3.5 shrink-0"
                                                >
                                                    <span className="absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 bg-(--text-mute)" />
                                                    <span
                                                        className={cn(
                                                            "absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 bg-(--text-mute) transition-transform duration-400 ease-out",
                                                            isOpen ? "rotate-0" : "rotate-90",
                                                        )}
                                                    />
                                                </span>
                                            </button>
                                        </h3>

                                        {/* overflow-hidden is on the animated element
                        itself; the height tween has nothing to clip
                        otherwise. */}
                                        <div
                                            id={id}
                                            ref={(el) => {
                                                panels.current[i] = el;
                                            }}
                                            className="overflow-hidden"
                                            style={{ height: 0 }}
                                        >
                                            <p className="max-w-2xl pb-7 pl-11 text-[0.9375rem] leading-relaxed text-(--text-mute)">
                                                {f.a}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
