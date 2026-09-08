"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, Flip } from "@/lib/gsap";
import { refreshScroll } from "@/lib/scrollRefresh";
import { cn, formatDate, pad } from "@/lib/utils";

/**
 * Article archive with a topic filter.
 *
 * ── WHY A LIST AND NOT A CARD GRID ───────────────────────────────────────
 * The lead article gets a two-column treatment; everything after it is a
 * hairline-divided row. An index of writing reads better as a list — the
 * titles are the content, and a card grid shrinks every title to fit a box
 * and gives equal weight to a thumbnail nobody chose. Rows let the headline
 * be the loudest thing on the screen, which is what someone scanning an
 * archive is actually reading.
 *
 * ── WHY Flip, THE SAME AS ProjectRail ────────────────────────────────────
 * Filtering re-flows the whole list, and cross-fading hides that: rows appear
 * to teleport and the reader loses the one they were looking at. Flip records
 * each row's real geometry before the React commit so survivors visibly
 * travel to their new position. It is also the same interaction as the work
 * filter, and two filters on one site behaving differently is worse than
 * either behaviour on its own.
 *
 * getState() must run in the CLICK HANDLER, before setState — once React has
 * committed, the old geometry is gone and there is nothing to measure. That
 * is the mistake that produces an animation from the new position to the new
 * position, which looks like nothing happening.
 *
 * ── THE LEAD SLOT IS A REAL PROBLEM FOR Flip ─────────────────────────────
 * Whichever post is first gets a completely different layout. If the filter
 * changes which post that is, the old lead has to shrink into a row and a row
 * has to expand into the lead — two elements swapping shapes, not moving.
 * data-flip-id is keyed on the SLUG rather than on position, so Flip tracks
 * the article rather than the slot and animates the size change instead of
 * treating it as one element leaving and another entering.
 */
export default function BlogArchive({ posts, categories }) {
    const [active, setActive] = useState("All");
    const root = useRef(null);
    const flipState = useRef(null);

    const filtered = useMemo(
        () => (active === "All" ? posts : posts.filter((p) => p.category === active)),
        [active, posts],
    );

    const counts = useMemo(() => {
        const map = { All: posts.length };
        for (const c of categories) {
            if (c === "All") continue;
            map[c] = posts.filter((p) => p.category === c).length;
        }
        return map;
    }, [posts, categories]);

    const [lead, ...rest] = filtered;

    const onFilter = (c) => {
        if (c === active) return;
        if (root.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            flipState.current = Flip.getState(root.current.querySelectorAll("[data-post]"));
        }
        setActive(c);
    };

    useGSAP(
        () => {
            if (!flipState.current) return;

            Flip.from(flipState.current, {
                duration: 0.6,
                ease: "power3.inOut",
                absolute: true,
                // The lead article and a row are different sizes, so the contents
                // have to scale with the box rather than snapping at the end.
                scale: true,
                nested: true,
                onEnter: (els) =>
                    gsap.fromTo(
                        els,
                        { opacity: 0, y: 16 },
                        { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" },
                    ),
                onLeave: (els) =>
                    gsap.to(els, { opacity: 0, y: -12, duration: 0.3, ease: "power2.in" }),
                onComplete: refreshScroll,
            });

            flipState.current = null;
        },
        { dependencies: [active], scope: root },
    );

    return (
        <div ref={root}>
            {/* ── Topic rail ──────────────────────────────────────────────
          Not sticky, and not blurred. Both for the same reasons as the work
          filter — see the long note in ProjectRail: sticky cannot work inside
          ScrollSmoother's transformed content, and a blurred full-width bar
          costs a viewport readback on every scrolled frame. */}
            <div className="border-b border-(--line) bg-(--canvas)">
                <div className="shell flex items-center gap-5 overflow-x-auto py-3.5">
                    <span className="label-mono shrink-0 text-(--text-mute)">Topics</span>

                    <div className="flex items-center gap-2">
                        {categories
                            // A topic with nothing under it is a dead end, not a
                            // choice. "All" always survives this.
                            .filter((c) => c === "All" || counts[c] > 0)
                            .map((c) => {
                                const on = active === c;
                                return (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => onFilter(c)}
                                        aria-pressed={on}
                                        className={cn(
                                            "shrink-0 rounded-full border px-4 py-2 text-[0.875rem] whitespace-nowrap transition-colors duration-200",
                                            on
                                                ? "border-(--text) bg-(--text) text-(--canvas)"
                                                : "border-(--line) text-(--text-mute) hover:border-(--text) hover:text-(--text)",
                                        )}
                                    >
                                        {c}
                                        <span
                                            className={cn(
                                                "ml-2 tabular-nums",
                                                on ? "opacity-60" : "opacity-45",
                                            )}
                                        >
                                            {counts[c]}
                                        </span>
                                    </button>
                                );
                            })}
                    </div>
                </div>
            </div>

            <div className="shell py-16 md:py-24">
                {!lead ? (
                    <div className="rounded-2xl border border-(--line) px-8 py-24 text-center">
                        <p className="text-(--text-mute)">
                            Nothing published under that topic yet.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── Lead article ─────────────────────────────── */}
                        <article
                            data-post=""
                            data-flip-id={lead.slug}
                            className="group/lead grid gap-x-12 gap-y-8 border-b border-(--line) pb-14 lg:grid-cols-12"
                        >
                            <Link
                                href={`/blogs/${lead.slug}`}
                                aria-hidden="true"
                                tabIndex={-1}
                                className="relative block aspect-16/10 overflow-hidden rounded-2xl border border-(--line) lg:col-span-7"
                            >
                                <Image
                                    src={lead.coverImage}
                                    alt=""
                                    fill
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 55vw"
                                    className="object-cover object-top transition-transform duration-900 ease-out group-hover/lead:scale-[1.035]"
                                />
                            </Link>

                            <div className="lg:col-span-5 lg:self-center">
                                <div className="label-mono flex items-center gap-2.5 text-(--text-mute)">
                                    <span className="text-brand">Latest</span>
                                    <span
                                        aria-hidden="true"
                                        className="block size-1 rounded-full bg-(--line)"
                                    />
                                    <span>{lead.category}</span>
                                </div>

                                <h2 className="text-subheading mt-5">
                                    <Link
                                        href={`/blogs/${lead.slug}`}
                                        className="inline-block transition-transform duration-400 ease-out group-hover/lead:translate-x-1.5"
                                    >
                                        {lead.title}
                                    </Link>
                                </h2>

                                <p className="mt-5 max-w-prose text-[1rem] leading-relaxed text-(--text-dim)">
                                    {lead.excerpt}
                                </p>

                                <p className="label-mono mt-7 text-(--text-mute)">
                                    {lead.author?.name}, {formatDate(lead.publishedAt)}
                                    {lead.readingMinutes ? `, ${lead.readingMinutes} min read` : ""}
                                </p>
                            </div>
                        </article>

                        {/* ── Index rows ───────────────────────────────── */}
                        <ol>
                            {rest.map((post, i) => (
                                <li
                                    key={post._id ?? post.slug}
                                    data-post=""
                                    data-flip-id={post.slug}
                                >
                                    <Link
                                        href={`/blogs/${post.slug}`}
                                        className="group/row grid items-baseline gap-x-8 gap-y-3 border-b border-(--line) py-8 transition-colors hover:bg-(--raised) md:py-10 lg:grid-cols-12"
                                    >
                                        <span className="label-mono tabular-nums text-(--text-mute) lg:col-span-1">
                                            {pad(i + 2)}
                                        </span>

                                        <div className="lg:col-span-6">
                                            <h3 className="text-[1.375rem] leading-snug font-medium tracking-[-0.02em] text-(--text)">
                                                <span className="inline-block transition-transform duration-400 ease-out group-hover/row:translate-x-1.5">
                                                    {post.title}
                                                </span>
                                            </h3>
                                            <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-(--text-dim)">
                                                {post.excerpt}
                                            </p>
                                        </div>

                                        <span className="label-mono text-(--text-dim) lg:col-span-2">
                                            {post.category}
                                        </span>

                                        <span className="label-mono text-(--text-mute) lg:col-span-3 lg:text-right">
                                            {formatDate(post.publishedAt)}
                                            {post.readingMinutes
                                                ? `, ${post.readingMinutes} min`
                                                : ""}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    </>
                )}
            </div>
        </div>
    );
}
