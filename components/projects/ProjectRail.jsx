"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, Flip } from "@/lib/gsap";
import { refreshScroll } from "@/lib/scrollRefresh";
/* From taxonomy, not data: this is a client component and lib/data.js carries
   every case-study body — importing it here would ship all of that. */
import { SERVICE_LABELS } from "@/lib/taxonomy";
import { cn, formatDate, pad } from "@/lib/utils";

/**
 * Filterable case-study rail.
 *
 * The full list is passed in from the server component. The client boundary
 * exists only for filter state, so the payload is data we were shipping
 * anyway rather than a second fetch, and the first paint is filtered-correct
 * with JS disabled.
 *
 * ── WHY Flip AND NOT A FADE ──────────────────────────────────────────────
 * Filtering a masonry-ish grid re-flows every surviving card to a new
 * position. Cross-fading the container hides that: cards appear to teleport,
 * and the reader loses track of the one they were looking at. Flip records
 * each element's real geometry before the React commit and animates from the
 * old box to the new one, so a card that survives the filter visibly TRAVELS
 * to its new slot. That continuity is the whole point — it is the difference
 * between "the list changed" and "these are the same projects, rearranged".
 *
 * This is the one job Flip exists for, and the plugin is already registered
 * for the project, so it costs nothing extra in the bundle.
 *
 * ── THE ORDER IS LOAD-BEARING ────────────────────────────────────────────
 * getState() must run in the CLICK HANDLER, before setState. Once React has
 * committed, the old geometry is gone and there is nothing left to measure.
 * Calling it inside the effect that reacts to `active` is the common mistake
 * and produces an animation from the new position to the new position, which
 * looks like nothing happening.
 *
 * ── WHY absolute: true ───────────────────────────────────────────────────
 * Cards that leave are taken out of flow for the duration, so the survivors
 * can move into the gap immediately instead of waiting for the exits to
 * finish. Without it the grid re-flows in two visible stages.
 *
 * ── THE FILTER BAR IS NO LONGER STICKY ⚑ ─────────────────────────────────
 * It was, and it never worked. ScrollSmoother does not scroll the page — it
 * translates #smooth-content with a transform while the window scroll drives
 * that transform. Sticky offsets resolve during layout against the
 * scrollport, and the transform is applied to the whole subtree afterwards,
 * so a sticky element inside the smoother computes a correct pinned position
 * and is then translated away from it frame by frame. It scrolls off like
 * ordinary content. `position: fixed` fails for the related reason: a
 * transformed ancestor becomes the containing block for fixed descendants,
 * which is why the Navbar and the intro loader live outside the smoother.
 *
 * A bar that announces it will stick and then does not is worse than one that
 * never claimed to, so it is a plain bar. If it should genuinely follow the
 * reader, the fix is ScrollTrigger's `pin` with `pinSpacing: false` rather
 * than CSS — that is the documented approach under the smoother, and it costs
 * a pin-spacer and a refresh on every filter change, which is why it is not
 * done speculatively.
 *
 * The backdrop-blur-xl also came off: a blur on a full-width bar forces a
 * full-viewport readback on every scrolled frame, the same cost that was
 * removed from the navbar.
 */

/* A repeating 7/5, 5/7 rhythm rather than a uniform grid. Indexed modulo, so
   it stays stable as the catalogue grows and as filters change the count. */
const LAYOUT = [
    "lg:col-span-7",
    "lg:col-span-5 lg:mt-24",
    "lg:col-span-5",
    "lg:col-span-7 lg:mt-24",
];

export default function ProjectRail({ projects, services }) {
    const [active, setActive] = useState("all");
    const grid = useRef(null);
    const flipState = useRef(null);

    const filtered = useMemo(
        () =>
            active === "all" ? projects : projects.filter((p) => p.serviceTypes.includes(active)),
        [active, projects],
    );

    const counts = useMemo(() => {
        const map = { all: projects.length };
        for (const s of services) {
            map[s] = projects.filter((p) => p.serviceTypes.includes(s)).length;
        }
        return map;
    }, [projects, services]);

    const onFilter = (key) => {
        if (key === active) return;
        // Measure BEFORE the commit. See the note above.
        if (grid.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            flipState.current = Flip.getState(grid.current.querySelectorAll("[data-card]"));
        }
        setActive(key);
    };

    useGSAP(
        () => {
            if (!flipState.current) return;

            Flip.from(flipState.current, {
                duration: 0.6,
                ease: "power3.inOut",
                absolute: true,
                // Cards change column width between layouts, so the image inside
                // has to scale with the box rather than snapping at the end.
                scale: true,
                nested: true,
                onEnter: (els) =>
                    gsap.fromTo(
                        els,
                        { opacity: 0, scale: 0.92 },
                        { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" },
                    ),
                onLeave: (els) =>
                    gsap.to(els, { opacity: 0, scale: 0.92, duration: 0.3, ease: "power2.in" }),
                // The grid's height changes, so every trigger below it moves.
                // Debounced through lib/scrollRefresh rather than calling
                // ScrollTrigger.refresh() directly, which would re-measure the
                // whole document on the frame the flip lands.
                onComplete: refreshScroll,
            });

            flipState.current = null;
        },
        { dependencies: [active], scope: grid },
    );

    return (
        <section>
            {/* ── Filter rail ─────────────────────────────────────────── */}
            <div className="border-b border-(--line) bg-(--canvas)">
                <div className="shell flex items-center gap-5 overflow-x-auto py-3.5">
                    <span className="label-mono shrink-0 text-(--text-mute)">Filter</span>

                    <div className="flex items-center gap-2">
                        {[["all", "Everything"], ...services.map((s) => [s, SERVICE_LABELS[s]])]
                            // A filter that yields nothing is a dead end, not a
                            // choice. Disciplines with no published work are hidden
                            // rather than shown disabled.
                            .filter(([key]) => counts[key] > 0)
                            .map(([key, label]) => {
                                const on = active === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => onFilter(key)}
                                        aria-pressed={on}
                                        className={cn(
                                            "shrink-0 rounded-full border px-4 py-2 text-[0.875rem] whitespace-nowrap transition-colors duration-200",
                                            on
                                                ? "border-(--text) bg-(--text) text-(--canvas)"
                                                : "border-(--line) text-(--text-mute) hover:border-(--text) hover:text-(--text)",
                                        )}
                                    >
                                        {label}
                                        <span
                                            className={cn(
                                                "ml-2 tabular-nums",
                                                on ? "opacity-60" : "opacity-45",
                                            )}
                                        >
                                            {counts[key]}
                                        </span>
                                    </button>
                                );
                            })}
                    </div>
                </div>
            </div>

            {/* ── Grid ────────────────────────────────────────────────── */}
            <div className="shell py-16 md:py-24">
                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-(--line) px-8 py-24 text-center">
                        <p className="text-(--text-mute)">
                            Nothing published under that discipline yet. Ask us for the private deck
                            instead.
                        </p>
                    </div>
                ) : (
                    <div ref={grid} className="grid gap-x-10 gap-y-16 lg:grid-cols-12">
                        {filtered.map((p, i) => (
                            <article
                                key={p._id ?? p.slug}
                                data-card=""
                                // data-flip-id is what lets Flip recognise a card as
                                // the SAME element across the commit. Without it every
                                // card reads as an enter plus a leave and nothing
                                // travels.
                                data-flip-id={p.slug}
                                className={cn("group/card", LAYOUT[i % LAYOUT.length])}
                            >
                                <Link href={`/projects/${p.slug}`} className="block">
                                    <div className="relative overflow-hidden rounded-2xl border border-(--line)">
                                        <div className="relative aspect-16/10">
                                            <Image
                                                src={p.coverImage}
                                                alt={p.title}
                                                fill
                                                sizes="(max-width: 1024px) 100vw, 55vw"
                                                className="object-cover object-top transition-transform duration-900 ease-out group-hover/card:scale-[1.035]"
                                            />
                                        </div>

                                        <span className="label-mono absolute top-0 left-0 rounded-br-xl bg-(--canvas) px-3 py-2 tabular-nums text-(--text-mute)">
                                            {pad(i + 1)}
                                        </span>

                                        {p.featured && (
                                            <span className="label-mono absolute top-0 right-0 rounded-bl-xl bg-brand px-3 py-2 text-white">
                                                Featured
                                            </span>
                                        )}

                                        {/* Accent rule keyed to the project's own colour.
                                            A coloured overlay would obscure the
                                            screenshot the card exists to show. */}
                                        <span
                                            aria-hidden="true"
                                            className="absolute inset-x-0 bottom-0 block h-0.5 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover/card:scale-x-100"
                                            style={{ backgroundColor: p.accentColor }}
                                        />
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                                        <h2 className="text-subheading text-(--text)">
                                            <span className="inline-block transition-transform duration-400 ease-out group-hover/card:translate-x-1.5">
                                                {p.title}
                                            </span>
                                        </h2>
                                        <span className="label-mono text-(--text-mute)">
                                            {formatDate(p.projectDate)}
                                        </span>
                                    </div>

                                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                                        {p.subtitle}
                                    </p>

                                    <div className="mt-6 flex flex-wrap items-center gap-2">
                                        {p.serviceTypes.map((s) => (
                                            <span
                                                key={s}
                                                className="label-mono rounded-full border border-(--line) px-3 py-1 text-(--text-mute)"
                                            >
                                                {SERVICE_LABELS[s]}
                                            </span>
                                        ))}
                                    </div>
                                </Link>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
