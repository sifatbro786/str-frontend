"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import SectionIndex from "./SectionIndex";
import useSplitReveal from "@/components/motion/useSplitReveal";
import { cn } from "@/lib/utils";

/**
 * The top of every inner route.
 *
 * Asymmetric by construction: the headline sits in a seven-column well, the
 * lede in a four-column rail offset to the right with a hairline between
 * them. No centred hero, ever — a centred hero is the one layout that tells
 * the reader nothing about where they are.
 *
 * ── WHAT CHANGED IN THE LIGHT PASS ───────────────────────────────────────
 * The graph-paper wash behind this is gone. On the old dark canvas it read as
 * texture; on white it reads as a printing fault, and it was a full-viewport
 * gradient-masked layer repainting behind the largest text on the page. The
 * orange index and the slash separators went with it — the whole site now
 * carries one accent, and it is blue.
 *
 * ── WHY THIS IS A CLIENT COMPONENT WHEN THE PAGES ARE NOT ────────────────
 * It owns a split-text reveal, so it needs the browser. It takes only strings
 * and small arrays as props, which serialise to almost nothing, and anything
 * heavier goes through `children` — which is server-rendered even though it
 * passes through a client boundary. The route above it stays a server
 * component and keeps lib/api out of the browser bundle.
 *
 * @param {string}  index      "02" — the route's position in the IA
 * @param {string}  eyebrow    "Services"
 * @param {string}  title      Display headline
 * @param {string}  lede       One paragraph, right rail
 * @param {Array}   breadcrumb [{ label, href }] — last item renders inert
 * @param {Array}   meta       [{ label, value }] — spec row along the bottom
 */
export default function PageMasthead({
    index,
    eyebrow,
    title,
    lede,
    breadcrumb = [],
    meta = [],
    className,
    children,
}) {
    const root = useRef(null);
    const heading = useSplitReveal({ type: "words", immediate: true, stagger: 0.035, delay: 0.05 });

    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reduced) return;

            const q = gsap.utils.selector(root);

            /* Sequenced by delay rather than on one master timeline with the
               headline. The headline's reveal waits on document.fonts.ready
               before it can split, and the breadcrumb and spec row have no
               reason to wait for a webfont to arrive from a CDN. */
            gsap.timeline({ defaults: { ease: "power3.out" } })
                .from(q("[data-mast-crumb]"), { autoAlpha: 0, y: 8, duration: 0.5 }, 0)
                .from(q("[data-mast-index]"), { autoAlpha: 0, y: 8, duration: 0.5 }, 0.08)
                .from(q("[data-mast-lede]"), { autoAlpha: 0, y: 14, duration: 0.7 }, 0.4)
                .from(
                    q("[data-mast-meta]"),
                    { autoAlpha: 0, y: 12, duration: 0.6, stagger: 0.06 },
                    0.55,
                );
        },
        { scope: root },
    );

    return (
        <header ref={root} className={cn("border-b border-(--line)", className)}>
            <div className="shell pt-28 pb-14 md:pt-36 md:pb-20">
                {breadcrumb.length > 0 && (
                    <nav
                        aria-label="Breadcrumb"
                        data-mast-crumb=""
                        className="label-mono mb-9 flex flex-wrap items-center gap-2 text-(--text-mute)"
                    >
                        {breadcrumb.map((crumb, i) => {
                            const last = i === breadcrumb.length - 1;
                            return (
                                <span
                                    key={crumb.href ?? crumb.label}
                                    className="flex items-center gap-2"
                                >
                                    {last || !crumb.href ? (
                                        // aria-current on the last crumb, so a screen
                                        // reader announces which one is the page rather
                                        // than reading five links that all look alike.
                                        <span aria-current="page" className="text-(--text)">
                                            {crumb.label}
                                        </span>
                                    ) : (
                                        <Link
                                            href={crumb.href}
                                            className="transition-colors hover:text-(--text)"
                                        >
                                            {crumb.label}
                                        </Link>
                                    )}
                                    {!last && (
                                        <span aria-hidden="true" className="text-(--line)">
                                            /
                                        </span>
                                    )}
                                </span>
                            );
                        })}
                    </nav>
                )}

                <div data-mast-index="">
                    <SectionIndex index={index} label={eyebrow} />
                </div>

                <div className="mt-6 grid gap-x-10 gap-y-8 lg:grid-cols-12">
                    <h1 ref={heading} className="text-display lg:col-span-7">
                        {title}
                    </h1>

                    {(lede || children) && (
                        <div className="lg:col-span-4 lg:col-start-9 lg:self-end lg:border-l lg:border-(--line) lg:pl-8">
                            {lede && (
                                <p
                                    data-mast-lede=""
                                    className="max-w-prose text-[1.0625rem] leading-relaxed text-(--text-dim)"
                                >
                                    {lede}
                                </p>
                            )}
                            {children}
                        </div>
                    )}
                </div>

                {meta.length > 0 && (
                    /* Hairline grid rather than four floating columns. The rules
                       are what make this read as a spec sheet, which is the point:
                       these are facts about the engagement, not features. */
                    <dl className="mt-14 grid grid-cols-2 gap-px border border-(--line) bg-(--line) md:grid-cols-4">
                        {meta.map((m) => (
                            <div
                                key={m.label}
                                data-mast-meta=""
                                className="bg-(--canvas) px-5 py-5"
                            >
                                <dt className="label-mono text-(--text-mute)">{m.label}</dt>
                                <dd className="mt-2 text-[0.9375rem] leading-snug text-(--text)">
                                    {m.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                )}
            </div>
        </header>
    );
}
