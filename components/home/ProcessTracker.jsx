"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import SectionIndex from "@/components/ui/SectionIndex";
import useSplitReveal from "@/components/motion/useSplitReveal";
import { cn } from "@/lib/utils";

const newLocal = "relative -mt-[5px] block size-2.5 shrink-0";
/**
 * 03 // PROCESS — a horizontal track, not a tab rail.
 *
 * ── WHY THIS SHAPE ───────────────────────────────────────────────────────
 * The previous version was a vertical list of tabs beside a panel, which is
 * the layout every agency site reaches for and which says nothing about the
 * subject. A delivery process is a line you move along, so the navigation is
 * a line you move along: four nodes on a rule, with the rule filling behind
 * you as you advance. Position on the track carries the meaning that a tab
 * list has to spell out in words.
 *
 * ── WHY NOT A SCROLL-PINNED SEQUENCE ─────────────────────────────────────
 * The obvious "advance the phase as you scroll" version costs about 400vh of
 * pinned height and takes the scroll away from the reader. This is reference
 * material: people want phase 3 because phase 3 is the one they are worried
 * about, and they should be able to click straight to it. It also keeps this
 * section out of the pin-spacer arithmetic that makes every trigger below it
 * fragile.
 *
 * ── THE PROGRESS FILL IS ONE ELEMENT ─────────────────────────────────────
 * A single rule with scaleX driven from the left, not four segments toggling
 * colour. Four segments means three visible seams and a fill that steps
 * rather than travels. transformOrigin left plus one tween gives a continuous
 * run and costs a single composited transform.
 *
 * The rule spans node to node, not edge to edge — see the inset comment in
 * the markup for why, and why it is computed from steps.length.
 *
 * ── THE ARIA CONTRACT ────────────────────────────────────────────────────
 * Real tablist semantics, so arrow-key navigation is mandatory rather than a
 * nicety: landing on a tablist that ignores the arrow keys is worse than
 * plain headings. tabIndex is roving so Tab exits the group instead of
 * walking every node in it.
 */
/**
 * `index` and `eyebrow` are props rather than constants because this section
 * is shared between the homepage and /services. Hard-coding "03" meant either
 * a wrong number on the services page or a second copy of the whole
 * component — and a duplicated tablist is two keyboard implementations to
 * keep correct.
 */
export default function ProcessTracker({ steps, index = "03", eyebrow = "Process" }) {
    const root = useRef(null);
    const panel = useRef(null);
    const fill = useRef(null);
    const tabs = useRef([]);
    const [i, setI] = useState(0);

    const heading = useSplitReveal({ type: "words", stagger: 0.04 });
    const step = steps[i];
    const last = steps.length - 1;

    /* ── Track fill follows the active node ───────────────────────────────── */
    useGSAP(
        () => {
            if (!fill.current) return;
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const done = i === last;

            /* i / (last), NOT (i + 0.5) / steps.length.
               The old formula put nodes at the centre of four equal columns, so
               the last node sat at 87.5% and the rule kept running for another
               eighth of the track past it with nothing on the end. The nodes are
               now distributed edge to edge — first at 0%, last at 100% — so the
               fill lands exactly on the final node and the track is visibly
               complete. See the grid comment below for how the columns are
               shaped to match. */
            gsap.to(fill.current, {
                scaleX: last === 0 ? 1 : i / last,
                duration: reduced ? 0 : 0.7,
                ease: "power3.inOut",
                transformOrigin: "left center",
                overwrite: "auto",
            });

            if (reduced || !done) return;

            /* ── Completion beat ────────────────────────────────────────────
               Reaching the last phase is the only moment in this section where
               something has actually finished, so it is the only one that gets
               a flourish. Three parts, all on the final node:

                 · the fill overshoots a hair and settles, so the line arrives
                   with weight rather than stopping dead
                 · the node pops once
                 · a ring expands out of it and fades

               The ring is a separate element with non-scaling-stroke, because
               scaling the node itself would thicken its border as it grew. */
            const node = tabs.current[last];
            const ring = root.current?.querySelector("[data-done-ring]");
            if (!node) return;

            const tl = gsap.timeline();

            tl.to(fill.current, { scaleX: 1.012, duration: 0.18, ease: "power2.out" }, 0)
                .to(fill.current, { scaleX: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" }, 0.18)
                .fromTo(
                    node.querySelector("[data-node-dot]"),
                    { scale: 1 },
                    { scale: 1.5, duration: 0.22, ease: "power2.out", transformOrigin: "50% 50%" },
                    0.12,
                )
                .to(
                    node.querySelector("[data-node-dot]"),
                    { scale: 1, duration: 0.55, ease: "elastic.out(1, 0.45)" },
                    0.34,
                );

            if (ring) {
                tl.fromTo(
                    ring,
                    { scale: 0.4, opacity: 0.85 },
                    {
                        scale: 4.5,
                        opacity: 0,
                        duration: 0.9,
                        ease: "power2.out",
                        transformOrigin: "50% 50%",
                    },
                    0.12,
                );
            }

            return () => tl.kill();
        },
        { scope: root, dependencies: [i, last] },
    );

    /* ── Panel crossfade ──────────────────────────────────────────────────── */
    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reduced || !panel.current) return;

            const lines = gsap.utils.toArray("[data-panel-line]", panel.current);
            const ghost = panel.current.querySelector("[data-ghost]");

            /* One timeline, not two independent tweens. Clicking through phases
               quickly races them: the incoming tween can finish before the
               outgoing one and the previous panel ends up on top. overwrite on a
               single timeline kills the first cleanly. */
            const tl = gsap.timeline();

            tl.fromTo(
                lines,
                { autoAlpha: 0, y: 16 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.5,
                    ease: "power3.out",
                    stagger: 0.06,
                    overwrite: "auto",
                },
                0,
            );

            if (ghost) {
                tl.fromTo(
                    ghost,
                    { autoAlpha: 0, xPercent: -6 },
                    {
                        autoAlpha: 1,
                        xPercent: 0,
                        duration: 0.7,
                        ease: "power3.out",
                        overwrite: "auto",
                    },
                    0,
                );
            }

            return () => tl.kill();
        },
        { scope: root, dependencies: [i] },
    );

    /* ── Entrance ─────────────────────────────────────────────────────────── */
    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reduced) return;

            gsap.from(gsap.utils.toArray("[data-phase-node]", root.current), {
                autoAlpha: 0,
                y: 14,
                duration: 0.6,
                ease: "power3.out",
                stagger: 0.09,
                scrollTrigger: { trigger: root.current, start: "top 72%", once: true },
            });
        },
        { scope: root },
    );

    const onKeyDown = (e) => {
        let next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = i === last ? 0 : i + 1;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = i === 0 ? last : i - 1;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = last;
        if (next === null) return;
        e.preventDefault();
        setI(next);
        // Focus follows selection, which the tabs pattern requires when the panel
        // is not itself focusable.
        tabs.current[next]?.focus();
    };

    return (
        <section id="process" ref={root} className="border-b border-(--line)">
            <div className="shell py-24">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <div className="max-w-xl">
                        <SectionIndex index={index} label={eyebrow} />
                        <h2 ref={heading} className="text-heading mt-6">
                            From idea to launch, with nothing invisible in between.
                        </h2>
                    </div>
                    <p className="label-mono text-(--text-mute)">
                        Phase {step.index} of {String(steps.length).padStart(2, "0")}
                    </p>
                </div>

                {/* ── Track ───────────────────────────────────────────────── */}
                <div
                    role="tablist"
                    aria-label="Delivery phases"
                    onKeyDown={onKeyDown}
                    className="mt-14"
                >
                    <div className="relative">
                        {/* ── THE RULE IS INSET BY HALF A COLUMN ──────────────
                Nodes sit at the centre of equal columns, so with four
                phases the first is at 12.5% across and the last at
                87.5%. A rule spanning the full width therefore ran on
                past the final node with nothing on the end of it, which
                is the "extra line after step 4" problem.

                Insetting both edges by half a column (50 / n percent)
                makes the rule run node to node. The fill's scaleX then
                maps 1:1 onto phase progress: 0 is the first node, 1 is
                the last, and landing on the last phase visibly completes
                the track. Computed from steps.length rather than
                hard-coded, so a fifth phase needs no CSS change. */}
                        {(() => {
                            const inset = `${50 / steps.length}%`;
                            return (
                                <>
                                    <span
                                        aria-hidden="true"
                                        className="absolute top-0 block h-px bg-(--line)"
                                        style={{ left: inset, right: inset }}
                                    />
                                    <span
                                        ref={fill}
                                        aria-hidden="true"
                                        className="absolute top-0 block h-px origin-left scale-x-0 bg-brand"
                                        style={{ left: inset, right: inset }}
                                    />
                                </>
                            );
                        })()}

                        <div
                            className="grid"
                            style={{
                                gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
                            }}
                        >
                            {steps.map((s, n) => {
                                const on = n === i;
                                const passed = n < i;
                                const isLast = n === last;
                                return (
                                    <button
                                        key={s.index}
                                        data-phase-node=""
                                        ref={(el) => {
                                            tabs.current[n] = el;
                                        }}
                                        role="tab"
                                        id={`phase-tab-${s.index}`}
                                        aria-selected={on}
                                        aria-controls="phase-panel"
                                        tabIndex={on ? 0 : -1}
                                        onClick={() => setI(n)}
                                        className="group/node flex flex-col items-center gap-4 px-2 text-center"
                                    >
                                        {/* The node straddles the rule, so the line
                        runs through it rather than stopping at it.
                        The ring is a sibling rather than a scaled
                        copy of the dot: scaling the dot would
                        thicken its 2px border as it grew. */}
                                        <span className={newLocal}>
                                            <span
                                                data-node-dot=""
                                                aria-hidden="true"
                                                className={cn(
                                                    "absolute inset-0 block rounded-full border-2 transition-colors duration-300",
                                                    on || passed
                                                        ? "border-brand bg-brand"
                                                        : "border-(--line) bg-(--canvas) group-hover/node:border-(--text-mute)",
                                                )}
                                            />
                                            {isLast && (
                                                <span
                                                    data-done-ring=""
                                                    aria-hidden="true"
                                                    className="pointer-events-none absolute inset-0 block rounded-full border border-brand opacity-0"
                                                />
                                            )}
                                        </span>

                                        <span className="block pt-1">
                                            <span
                                                className={cn(
                                                    "label-mono block tabular-nums transition-colors duration-300",
                                                    on ? "text-brand" : "text-(--text-mute)",
                                                )}
                                            >
                                                {s.index}
                                            </span>
                                            <span
                                                className={cn(
                                                    "mt-1.5 block text-[1rem] font-medium transition-colors duration-300 md:text-[1.25rem]",
                                                    on
                                                        ? "text-(--text)"
                                                        : "text-(--text-mute) group-hover/node:text-(--text)",
                                                )}
                                            >
                                                {s.title}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Panel ───────────────────────────────────────────────── */}
                <div
                    id="phase-panel"
                    ref={panel}
                    role="tabpanel"
                    aria-labelledby={`phase-tab-${step.index}`}
                    className="relative mt-12 overflow-hidden border-t border-(--line) pt-12"
                >
                    {/* Oversized ghost numeral in the margin. It is the only piece
              of pure decoration in the section and it earns its place by
              being the thing that changes most visibly between phases,
              which is what tells you the click registered. aria-hidden:
              the number is already in the tab label. */}
                    <span
                        data-ghost=""
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-2 right-0 -z-10 hidden text-[11rem] leading-none font-medium tracking-tighter text-(--raised-2) select-none md:block"
                    >
                        {step.index}
                    </span>

                    <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-12">
                        <p
                            data-panel-line=""
                            className="max-w-2xl text-[clamp(1.125rem,1.8vw,1.5rem)] leading-[1.45] tracking-[-0.015em] text-(--text) md:col-span-7"
                        >
                            {step.body}
                        </p>

                        <div data-panel-line="" className="md:col-span-4 md:col-start-9">
                            <p className="label-mono text-(--text-mute)">What you get</p>
                            <ul className="mt-4 flex flex-wrap gap-2">
                                {step.output.split(" · ").map((o) => (
                                    <li
                                        key={o}
                                        className="rounded-full border border-(--line) px-3.5 py-1.5 text-[0.8125rem] text-(--text-dim)"
                                    >
                                        {o}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
