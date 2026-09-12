"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap, Flip } from "@/lib/gsap";
import { refreshScroll } from "@/lib/scrollRefresh";
import Reveal from "@/components/motion/Reveal";
/* Taxonomy only — five ids, their labels and their verbs. The records arrive
   as a prop from the route, which fetches them on the server, so no copy
   crosses into the client bundle. Same split as taxonomy/api on /projects. */
import { DISCIPLINE_BY_ID } from "@/lib/portfolio";
import { cn, pad } from "@/lib/utils";

/**
 * The filterable sample library.
 *
 * ── WHY Flip AND NOT A CROSS-FADE ────────────────────────────────────────
 * Filtering a grid re-flows every surviving card into a new slot. Fading the
 * container hides that: cards appear to teleport and the reader loses the one
 * they were looking at. Flip records real geometry before the React commit
 * and animates each element from its old box to its new one, so a card that
 * survives the filter visibly travels. Same reasoning, same plugin and the
 * same load-bearing ordering as components/projects/ProjectRail.jsx:
 * getState() MUST run in the click handler, because once React has committed
 * the old geometry is gone and there is nothing left to measure.
 *
 * ── WHY ONLY "EVERYTHING" IS PAGED ───────────────────────────────────────
 * It is all five disciplines at once — nearly forty cards, each with its own
 * thumbnail — and mounting that in one go is what makes a page like this feel
 * heavy. A single discipline is fifteen cards at worst, so paging one would
 * hide work behind a button and buy nothing.
 *
 * ── WHY "EVERYTHING" DOES NOT RUN IN SOURCE ORDER ────────────────────────
 * Source order is web-first, which would make the opening screen twelve
 * websites — and a reader who never presses the button would leave without
 * learning the other four disciplines exist. The tab round-robins the
 * disciplines instead, in the order the rail lists them, so 3D, marketing,
 * graphics and video all appear above the fold.
 *
 * @param {Array} items       portfolio records, from getPortfolioItems()
 * @param {Array} disciplines PORTFOLIO_DISCIPLINES
 * @param {object} counts     discipline id → count
 */

/* A multiple of three, so the last row lands full at every breakpoint the
   grid uses — one, two and three columns. */
const BATCH = 12;

/** Fallback plate for a record saved without artwork. */
function initialsOf(name = "") {
    return name
        .replace(/[^A-Za-z0-9 ]/g, " ")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
}

/* One glyph for every action, live site or file set alike. A per-discipline
   icon set was the first version of this and it read as decoration: five
   different marks saying the same thing, which the label already says
   precisely. */
function ArrowOut({ className }) {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
        >
            <path d="M5 11 11 5M5.5 4.5H11.5V10.5" />
        </svg>
    );
}

function PortfolioCard({ item, position }) {
    const d = DISCIPLINE_BY_ID[item.discipline];
    const href = item.liveUrl ?? item.fileUrl ?? null;
    const label = item.fileLabel ?? d?.action ?? "View";

    /* Two kinds of media in one grid, and they do not want the same frame. A
       site screenshot is a crop of something larger, so it fills the frame and
       anchors to the top where the nav and hero live. A render, a floor plan or
       a before/after board is a finished piece whose edges carry meaning —
       dimension text, the AFTER label, the tool strip — and cropping it is
       destroying it, so those sit whole inside a mount. */
    const isWeb = item.discipline === "web";

    /* Four chips is what fits on one line at the narrowest column. The rest
       collapse into a count rather than wrapping the card into a tag cloud. */
    const chips = item.stack.slice(0, 4);
    const overflow = item.stack.length - chips.length;

    /* A record with neither URL is a legitimate state once this is editable
       from the dashboard — the piece exists, the link has not been pasted in
       yet. It renders as a plain figure rather than an anchor to nowhere. */
    const Frame = href ? "a" : "div";
    const frameProps = href ? { href, target: "_blank", rel: "noopener noreferrer" } : {};

    return (
        <article data-card="" data-flip-id={item.slug} data-reveal="" className="group/card">
            <Frame {...frameProps} className="block focus-visible:outline-offset-6">
                <div
                    className={cn(
                        "relative overflow-hidden rounded-2xl border border-(--line)",
                        isWeb ? "bg-(--raised-2)" : "bg-(--raised)",
                    )}
                >
                    <div className={isWeb ? "relative aspect-16/10" : "relative aspect-4/3"}>
                        {item.image ? (
                            <Image
                                src={item.image}
                                alt={`${item.client}: ${item.title}`}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                className={cn(
                                    "transition-transform duration-900 ease-out group-hover/card:scale-[1.035]",
                                    isWeb ? "object-cover object-top" : "object-contain p-4",
                                )}
                            />
                        ) : (
                            /* Not the logo: a wrong-shaped brand mark in a 16:10 frame
                               looks like a design choice. Initials on the graph-paper
                               ground look like a missing upload, which is what it is. */
                            <div className="bg-grid absolute inset-0 grid place-items-center">
                                <span className="text-[2.5rem] font-medium tracking-[-0.04em] text-(--text-mute)">
                                    {initialsOf(item.client)}
                                </span>
                            </div>
                        )}
                    </div>

                    <span className="label-mono absolute top-0 left-0 rounded-br-xl bg-(--canvas) px-3 py-2 tabular-nums text-(--text-mute)">
                        {pad(position)}
                    </span>

                    {item.fileLabel && (
                        <span className="label-mono absolute top-0 right-0 rounded-bl-xl bg-brand px-3 py-2 text-white">
                            Full set
                        </span>
                    )}

                    {/* A rule rather than a colour wash: an overlay would obscure the
                        one thing the card exists to show. */}
                    <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 block h-0.5 origin-left scale-x-0 bg-brand transition-transform duration-500 ease-out group-hover/card:scale-x-100"
                    />
                </div>

                <div className="label-mono mt-5 flex items-center gap-2.5 text-(--text-mute)">
                    <span className="nums">{item.year}</span>
                    <span aria-hidden="true" className="text-(--line)">
                        /
                    </span>
                    <span className="min-w-0 truncate">{item.client}</span>
                    {/* Web cards already say "Visit live site" below, so repeating the
                        deliverable here would be the same words twice. */}
                    {!isWeb && d && (
                        <>
                            <span aria-hidden="true" className="text-(--line)">
                                /
                            </span>
                            <span className="shrink-0">{d.deliverable}</span>
                        </>
                    )}
                </div>

                <h3 className="mt-2.5 text-[1.0625rem] leading-snug font-medium tracking-[-0.02em] text-(--text)">
                    <span className="inline-block transition-transform duration-400 ease-out group-hover/card:translate-x-1.5">
                        {item.title}
                    </span>
                </h3>

                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                    {item.outcome}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                    {chips.map((s) => (
                        <span
                            key={s}
                            className="label-mono rounded-full border border-(--line) px-3 py-1 text-(--text-mute)"
                        >
                            {s}
                        </span>
                    ))}
                    {overflow > 0 && (
                        <span className="label-mono nums px-1 text-(--text-mute)">
                            +{overflow}
                        </span>
                    )}
                </div>

                {href && (
                    /* A span, not a second anchor: the whole card is already the
                       link, and a nested interactive element inside it is invalid
                       markup and a duplicate tab stop. */
                    <span className="mt-5 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-(--text) transition-colors duration-200 group-hover/card:text-brand">
                        {label}
                        <ArrowOut className="transition-transform duration-300 ease-out group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5" />
                    </span>
                )}
            </Frame>
        </article>
    );
}

export default function PortfolioGrid({ items, disciplines, counts, contactEmail }) {
    const [active, setActive] = useState("all");
    const [shown, setShown] = useState(BATCH);
    const grid = useRef(null);
    const flipState = useRef(null);
    const appendedFrom = useRef(BATCH);

    /* Round-robin across the disciplines for the "Everything" tab. Anything
       whose discipline has no rail entry is appended rather than dropped, so a
       new id added to the model before the taxonomy still shows up. */
    const mixed = useMemo(() => {
        const groups = disciplines.map((d) => items.filter((i) => i.discipline === d.id));
        const placed = new Set(groups.flat());
        const out = [];
        for (let i = 0; groups.some((g) => i < g.length); i += 1) {
            for (const g of groups) if (g[i]) out.push(g[i]);
        }
        return [...out, ...items.filter((i) => !placed.has(i))];
    }, [items, disciplines]);

    const filtered = useMemo(
        () => (active === "all" ? mixed : items.filter((i) => i.discipline === active)),
        [active, items, mixed],
    );

    const paged = active === "all";
    /* The tail is absorbed rather than stranded: once a press would leave only
       one or two cards behind, they come along with it. `nextBatch` reads the
       same rule, so the button's number is exactly what the press reveals. */
    const visibleCount = paged && filtered.length - shown > 2 ? shown : filtered.length;
    const visible = filtered.slice(0, visibleCount);
    const remaining = filtered.length - visibleCount;
    const nextBatch = remaining <= BATCH + 2 ? remaining : BATCH;

    const activeRow = disciplines.find((d) => d.id === active);

    const onFilter = (key) => {
        if (key === active) return;
        // Measure BEFORE the commit. See the note at the top of the file.
        if (grid.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            flipState.current = Flip.getState(grid.current.querySelectorAll("[data-card]"));
        }
        setActive(key);
        // Coming back to a tab should start at the top of the pile again, not
        // wherever the last visit left it.
        setShown(BATCH);
        appendedFrom.current = BATCH;
    };

    useGSAP(
        () => {
            if (!flipState.current) return;

            Flip.from(flipState.current, {
                duration: 0.6,
                ease: "power3.inOut",
                // Leavers come out of flow immediately, so survivors move into
                // the gap in one pass instead of re-flowing in two visible stages.
                absolute: true,
                scale: true,
                nested: true,
                onEnter: (els) =>
                    gsap.fromTo(
                        els,
                        { opacity: 0, scale: 0.94 },
                        { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" },
                    ),
                onLeave: (els) =>
                    gsap.to(els, { opacity: 0, scale: 0.94, duration: 0.3, ease: "power2.in" }),
                // The grid's height changes, so every trigger below it moves.
                // Debounced through lib/scrollRefresh rather than calling
                // ScrollTrigger.refresh() on the frame the flip lands.
                onComplete: refreshScroll,
            });

            flipState.current = null;
        },
        { dependencies: [active], scope: grid },
    );

    /* Cards revealed by the button. Only the new ones are animated — running
       the stagger over the whole grid would re-animate work the reader has
       already read. Scoped to the paged tab so it can never overlap Flip's own
       onEnter, which owns entrances on a filter change. */
    useGSAP(
        () => {
            const from = appendedFrom.current;
            appendedFrom.current = visibleCount;

            if (!paged || visibleCount <= from || !grid.current) return;
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                refreshScroll();
                return;
            }

            const fresh = gsap.utils.toArray("[data-card]", grid.current).slice(from);
            if (!fresh.length) return;

            gsap.from(fresh, {
                autoAlpha: 0,
                y: 22,
                duration: 0.6,
                stagger: 0.05,
                clearProps: "transform,visibility",
                onComplete: refreshScroll,
            });
        },
        { dependencies: [visibleCount], scope: grid },
    );

    return (
        <section>
            {/* ── Filter rail ─────────────────────────────────────────────
                Not sticky, and that is deliberate: ScrollSmoother translates
                #smooth-content with a transform, so a sticky element inside it
                computes a correct pinned position and is then translated away
                from it frame by frame. A bar that announces it will stick and
                then does not is worse than one that never claimed to. See the
                long note in ProjectRail for the ScrollTrigger pin alternative. */}
            <div className="border-b border-(--line) bg-(--canvas)">
                <div className="shell flex items-center gap-5 overflow-x-auto py-3.5">
                    <span className="label-mono shrink-0 text-(--text-mute)">Filter</span>

                    <div className="flex items-center gap-2">
                        {[{ id: "all", label: "Everything" }, ...disciplines]
                            // A filter that yields nothing is a dead end, not a
                            // choice. A discipline with no published piece is hidden
                            // rather than shown disabled.
                            .filter((d) => (counts[d.id] ?? 0) > 0)
                            .map((d) => {
                                const on = active === d.id;
                                return (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => onFilter(d.id)}
                                        aria-pressed={on}
                                        className={cn(
                                            "shrink-0 rounded-full border px-4 py-2 text-[0.875rem] whitespace-nowrap transition-colors duration-200",
                                            on
                                                ? "border-(--text) bg-(--text) text-(--canvas)"
                                                : "border-(--line) text-(--text-mute) hover:border-(--text) hover:text-(--text)",
                                        )}
                                    >
                                        {d.label}
                                        <span
                                            className={cn(
                                                "ml-2 tabular-nums",
                                                on ? "opacity-60" : "opacity-45",
                                            )}
                                        >
                                            {counts[d.id]}
                                        </span>
                                    </button>
                                );
                            })}
                    </div>

                    {/* What the active discipline actually hands over. Answers the
                        question the pills raise and the cards then confirm. */}
                    <span className="label-mono ml-auto hidden shrink-0 pl-6 text-(--text-mute) lg:block">
                        {activeRow ? (
                            <>
                                Delivered as{" "}
                                <span className="text-(--text)">
                                    {activeRow.deliverable.toLowerCase()}
                                </span>
                            </>
                        ) : (
                            "Live sites and file sets"
                        )}
                    </span>
                </div>
            </div>

            {/* ── Grid ────────────────────────────────────────────────── */}
            <div className="shell py-16 md:py-24">
                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-(--line) px-8 py-20 text-center">
                        <h3 className="text-subheading text-(--text)">
                            {activeRow?.empty.title ?? "Nothing published under that filter yet"}
                        </h3>
                        <p className="mx-auto mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-(--text-dim)">
                            {activeRow?.empty.body ??
                                "Tell us what you are looking for and we will send the closest piece straight over."}
                        </p>
                        <a
                            href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                                `${activeRow?.label ?? "Portfolio"} sample request`,
                            )}`}
                            className="mt-8 inline-flex items-center gap-2 rounded-full border border-(--line) px-6 py-3 text-[0.9375rem] font-medium text-(--text) transition-colors hover:border-(--text)"
                        >
                            Request the {activeRow?.label ?? "portfolio"} folder
                            <ArrowOut />
                        </a>
                    </div>
                ) : (
                    <Reveal stagger={0.06}>
                        <div
                            ref={grid}
                            className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {visible.map((item, i) => (
                                <PortfolioCard key={item.slug} item={item} position={i + 1} />
                            ))}
                        </div>
                    </Reveal>
                )}

                {remaining > 0 && (
                    <div className="mt-16 flex flex-col items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setShown((n) => n + BATCH)}
                            className="group/more inline-flex items-center gap-2.5 rounded-full border border-(--line) px-7 py-3.5 text-[0.9375rem] font-medium text-(--text) transition-colors duration-200 hover:border-(--text)"
                        >
                            {/* The count is the point of the label: it tells the reader
                                how much is left before they decide to keep going. */}
                            View {nextBatch} more
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                                className="transition-transform duration-300 ease-out group-hover/more:translate-y-0.5"
                            >
                                <path d="M8 2.5v11M4 9.5l4 4 4-4" />
                            </svg>
                        </button>
                        <p aria-live="polite" className="label-mono nums text-(--text-mute)">
                            Showing {visible.length} of {filtered.length}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
