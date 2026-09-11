"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import SectionIndex from "@/components/ui/SectionIndex";
import ServiceMedia from "@/components/ui/ServiceMedia";
import useSplitReveal from "@/components/motion/useSplitReveal";
import { cn, pad } from "@/lib/utils";

/**
 * 02 // CAPABILITIES — a pinned horizontal rail.
 *
 * The section pins at the top of the viewport and vertical scroll is
 * translated into horizontal movement of the card track, so the nine
 * disciplines pass through as full cards with their artwork at a size worth
 * looking at.
 *
 * ── THE LAYOUT IS HEIGHT-DRIVEN, NOT WIDTH-DRIVEN ⚑ ──────────────────────
 * This is the thing that goes wrong first and it went wrong here. A pinned
 * section is exactly one viewport tall, so its contents must FIT that height —
 * they cannot be sized from their own content and left to overflow. The first
 * build gave the cards a fixed 3:4 image plus a text block underneath, which
 * came to roughly 1,080px of content inside an 800px viewport, and with
 * `justify-center` the overflow was split top and bottom: the header slid up
 * behind the fixed navbar and the progress row slid off the bottom. Nothing
 * errored, the section just quietly lost its first and last rows.
 *
 * So the section is a flex column: header and progress row are `shrink-0`, the
 * rail is `flex-1 min-h-0`, and each card fills the height it is given. The
 * card's copy sits ON the artwork rather than under it, which is both the
 * reason the height now fits and the reason the image gets the whole card.
 * `min-h-0` is load-bearing: a flex child defaults to `min-height: auto` and
 * refuses to shrink below its content, which is exactly how a flex row
 * overflows its parent instead of fitting it.
 *
 * ── AND IT HAS TO CLEAR THE NAVBAR ───────────────────────────────────────
 * The navbar is `position: fixed`, 68px tall, and it is still there while this
 * section is pinned. `start: "top top"` puts the section's top edge at the
 * viewport's top edge, which is underneath it. The top padding below is that
 * clearance; it is not decorative spacing.
 *
 * ── THE FOUR THINGS THAT BREAK THIS PATTERN, AND WHAT IS DONE ABOUT THEM ─
 *
 * 1. `end` MUST be a function. The pin distance is the track's overflow
 *    (scrollWidth minus the viewport), which is unknown until layout runs and
 *    changes on every resize, on a font swap, and on an image finally
 *    arriving. A literal computed at setup is correct for exactly one viewport
 *    width; a function is re-read on every ScrollTrigger.refresh(). Paired
 *    with `invalidateOnRefresh` so the `x` target is recalculated too, not
 *    just the distance.
 *
 * 2. The parallax cannot be a normal ScrollTrigger. Each card is moving
 *    horizontally under a transform, so its position relative to the viewport
 *    has nothing to do with the page's scroll position, and a plain trigger
 *    fires all nine at once at the top of the section. `containerAnimation` is
 *    the GSAP API for exactly this: the child trigger is measured against
 *    progress through the master tween instead of against the scrollbar.
 *
 * 3. The counter must not be React state. It updates on every scroll frame,
 *    and `setState` there re-renders nine cards sixty times a second for two
 *    text nodes. It is written straight to the DOM through a ref, which is the
 *    one place bypassing React is the correct call rather than a shortcut.
 *
 * 4. Mobile and reduced motion get NO pin. A pinned section that hijacks
 *    scroll is hostile on a phone, and `prefers-reduced-motion` exists to opt
 *    out of precisely this. Both fall through to a native horizontal rail with
 *    scroll snapping, which needs no JavaScript at all and is the behaviour a
 *    touch user expects anyway. gsap.matchMedia owns that boundary, so the
 *    desktop branch is reverted automatically when the query stops matching
 *    (rotate a tablet and the pin cleans itself up).
 *
 * ── WHY THE TRACK'S SCROLLER IS overflow-x-auto IN THE MARKUP ────────────
 * That is the no-JavaScript state: server-rendered HTML is already a usable
 * horizontal rail before any bundle executes, and it stays that way on mobile
 * and under reduced motion. The desktop branch sets `overflow: visible`
 * inline, because an `overflow-x: auto` ancestor silently breaks ScrollTrigger
 * pinning. gsap.matchMedia reverts that inline style on cleanup.
 */

/**
 * The full-height pinned layout needs BOTH a wide viewport and a tall one.
 *
 * Width alone is not enough: a desktop window snapped to half the screen height
 * is ~600px, and at that height a 100vh section has no room for a rail. Worse,
 * the card's media is absolutely positioned, so if the card ever loses its
 * definite height it collapses to just the overlay text — a visible break, not
 * a graceful one.
 *
 * ⚑ This string and the `[@media...]` class prefixes below MUST stay identical.
 * Tailwind scans for literal class strings, so the variant cannot be built from
 * this constant; they are two spellings of one rule. Change one, change both.
 */
const PINNED_LAYOUT = "(min-width: 1024px) and (min-height: 640px)";

/* The rail has to overflow its container, so it cannot use the `shell` utility
   (a max-width box cannot overflow and stay centred). This reproduces shell's
   left edge by hand — max-width 84rem, padding-inline 1.25rem then 2.5rem from
   768px — so the first card lines up with the heading above it.
   ⚑ If shell's max-width or padding changes in globals.css, change this too. */
const RAIL_GUTTER =
    "px-5 md:px-10 lg:px-[max(2.5rem,calc((100vw-84rem)/2+2.5rem))]";

export default function CapabilityStack({ services }) {
    const root = useRef(null);
    const scroller = useRef(null);
    const track = useRef(null);
    const counter = useRef(null);
    const bar = useRef(null);

    const heading = useSplitReveal({ type: "words", stagger: 0.04 });

    const count = services?.length ?? 0;

    useGSAP(
        () => {
            if (!count) return;

            const mm = gsap.matchMedia();

            mm.add(`${PINNED_LAYOUT} and (prefers-reduced-motion: no-preference)`, () => {
                const el = track.current;
                const box = scroller.current;
                if (!el || !box) return;

                // See the header note: an overflow ancestor breaks pinning.
                gsap.set(box, { overflow: "visible" });

                const distance = () => Math.max(0, el.scrollWidth - box.offsetWidth);

                /* A single card is never worth pinning for — there is nothing to
                   travel. Bailing here also avoids an end of "+=0", which pins
                   the section for zero pixels and reads as a stutter. */
                if (distance() < 80) return;

                const setBar = gsap.quickSetter(bar.current, "scaleX");
                let shown = -1;

                const master = gsap.to(el, {
                    x: () => -distance(),
                    ease: "none",
                    scrollTrigger: {
                        trigger: root.current,
                        start: "top top",
                        end: () => `+=${distance()}`,
                        pin: true,
                        // anticipatePin smooths the frame where the pin is applied;
                        // without it a fast scroll shows one frame of the section
                        // jumping before it sticks.
                        anticipatePin: 1,
                        scrub: 0.6,
                        invalidateOnRefresh: true,
                        onUpdate(self) {
                            setBar(self.progress);

                            /* Round, not floor. Floor leaves the counter on 01
                               until the first card is fully gone, so the number
                               and the card under the reader's eye disagree for
                               most of the first slide. */
                            const i = Math.min(count - 1, Math.round(self.progress * (count - 1)));
                            if (i !== shown && counter.current) {
                                shown = i;
                                counter.current.textContent = pad(i + 1);
                            }
                        },
                    },
                });

                /* Per-card parallax, measured against progress through `master`
                   rather than against the scrollbar. The media wrapper is 118%
                   wide and offset by -9%, so the travel below never exposes an
                   edge — scaling it instead would fight GSAP for the transform. */
                gsap.utils.toArray("[data-card]", el).forEach((card) => {
                    const media = card.querySelector("[data-media]");
                    if (!media) return;

                    gsap.fromTo(
                        media,
                        { xPercent: -6 },
                        {
                            xPercent: 6,
                            ease: "none",
                            scrollTrigger: {
                                trigger: card,
                                containerAnimation: master,
                                start: "left right",
                                end: "right left",
                                scrub: true,
                                invalidateOnRefresh: true,
                            },
                        },
                    );
                });

                /* Entrance for the cards already on screen when the section
                   arrives. Deliberately not a scroll-linked reveal per card:
                   once the rail is pinned every card enters horizontally, and a
                   vertical fade-up on top of that is two motions arguing. */
                gsap.from(gsap.utils.toArray("[data-card]", el).slice(0, 4), {
                    autoAlpha: 0,
                    y: 40,
                    duration: 0.8,
                    ease: "power3.out",
                    stagger: 0.08,
                    scrollTrigger: { trigger: root.current, start: "top 65%", once: true },
                });

                /* Images land after first paint and change the track's width,
                   which invalidates the pin distance computed above. One
                   refresh when they settle costs a single re-measure; without
                   it the rail stops short of the last card by whatever the
                   images added. */
                const imgs = el.querySelectorAll("img");
                let pending = 0;
                const done = () => {
                    pending -= 1;
                    if (pending <= 0) ScrollTrigger.refresh();
                };
                imgs.forEach((img) => {
                    if (img.complete) return;
                    pending += 1;
                    img.addEventListener("load", done, { once: true });
                    img.addEventListener("error", done, { once: true });
                });
            });

            return () => mm.revert();
        },
        { scope: root, dependencies: [count] },
    );

    // After every hook. An early return above them changes the hook count.
    if (!count) return null;

    return (
        <section
            id="services"
            ref={root}
            className={cn(
                "flex flex-col overflow-hidden border-b border-(--line)",
                "py-24 md:py-28",
                /* Exactly one viewport, laid out top to bottom, and only when
                   there is room for it. `pt` is the 68px fixed navbar's
                   clearance — it stays over this section the whole time it is
                   pinned — plus a little air, not decorative spacing.
                   Deliberately NO min-height: a floor taller than the viewport
                   is how the header got clipped in the first place. */
                "[@media(min-width:1024px)and(min-height:640px)]:h-screen",
                "[@media(min-width:1024px)and(min-height:640px)]:py-0",
                "[@media(min-width:1024px)and(min-height:640px)]:pt-26",
                "[@media(min-width:1024px)and(min-height:640px)]:pb-10",
            )}
        >
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="shell shrink-0">
                <div className="grid grid-cols-1 gap-x-10 gap-y-5 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                        <SectionIndex index="02" label="Capabilities" />
                        <h2 ref={heading} className="text-heading mt-4">
                            Nine disciplines, one delivery team.
                        </h2>
                    </div>
                    <p className="max-w-lg self-end text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-6 lg:col-start-7">
                        From the first architecture decision to the render that sells the unit, STR
                        covers what a product needs to launch and what it needs to keep running once
                        the launch team has moved on.
                    </p>
                </div>
            </div>

            {/* ── Rail ────────────────────────────────────────────────── */}
            <div
                ref={scroller}
                className={cn(
                    "mt-10 min-w-0 lg:mt-8",
                    /* min-h-0 is load-bearing: a flex child defaults to
                       min-height:auto and refuses to shrink below its content,
                       which is exactly how a flex column overflows its parent
                       instead of fitting it. */
                    "[@media(min-width:1024px)and(min-height:640px)]:min-h-0",
                    "[@media(min-width:1024px)and(min-height:640px)]:flex-1",
                    // The no-JavaScript state, and the mobile state. Snapping
                    // makes a touch drag settle on a card instead of stopping
                    // halfway between two.
                    "snap-x snap-mandatory overflow-x-auto overscroll-x-contain",
                    // The scrollbar is noise under a row of artwork; the rail
                    // reads as draggable from the cards themselves.
                    "scrollbar-none [&::-webkit-scrollbar]:hidden",
                )}
            >
                <ol
                    ref={track}
                    className={cn(
                        "flex w-max gap-4 md:gap-6 lg:gap-7",
                        "[@media(min-width:1024px)and(min-height:640px)]:h-full",
                        RAIL_GUTTER,
                    )}
                >
                    {services.map((s, i) => (
                        <li
                            key={s.slug}
                            data-card=""
                            className={cn(
                                "group/card w-[74vw] shrink-0 snap-start sm:w-[44vw] md:w-[34vw]",
                                "lg:w-[clamp(15rem,21vw,19.5rem)]",
                                "[@media(min-width:1024px)and(min-height:640px)]:h-full",
                            )}
                        >
                            <Link
                                href={`/services/${s.slug}`}
                                className={cn(
                                    "relative block aspect-3/4 overflow-hidden rounded-2xl border border-(--line) bg-(--raised)",
                                    /* The 3:4 box is what gives the card its
                                       height everywhere the section is NOT a
                                       pinned viewport. Dropping the ratio
                                       without a definite height to replace it
                                       collapses the card, because the media
                                       inside is absolutely positioned. */
                                    "[@media(min-width:1024px)and(min-height:640px)]:aspect-auto",
                                    "[@media(min-width:1024px)and(min-height:640px)]:h-full",
                                )}
                            >
                                {/* Wider than its box and pulled left, so the
                                    parallax travel never exposes an edge. */}
                                <div data-media="" className="absolute inset-y-0 left-[-9%] w-[118%]">
                                    <ServiceMedia
                                        src={s.image}
                                        alt={s.imageAlt || ""}
                                        title={s.title}
                                        index={i + 1}
                                        sizes="(max-width: 640px) 76vw, (max-width: 1024px) 38vw, 22vw"
                                        className="size-full"
                                        imageClassName="transition-transform duration-700 ease-out motion-safe:group-hover/card:scale-[1.05]"
                                    />
                                </div>

                                {/* Scrim, so the copy below is legible over any
                                    photograph and over the empty-state placeholder
                                    alike. Fixed black rather than a theme token on
                                    purpose: what sits behind it is an image, not
                                    the page, so it does not change with the theme
                                    and neither should the text on it. */}
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black via-black/70 to-transparent"
                                />

                                <span className="label-mono absolute top-4 left-4 rounded-full border border-white/25 bg-black/45 px-2.5 py-1 tabular-nums text-white backdrop-blur-sm">
                                    {pad(i + 1)}
                                </span>

                                <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6">
                                    <p className="label-mono text-white/60">
                                        {s.deliverableTimeline}
                                    </p>
                                    <h3 className="mt-2.5 text-[clamp(1.15rem,1.5vw,1.4rem)] leading-tight font-medium tracking-[-0.02em] text-white transition-transform duration-400 ease-out group-hover/card:translate-x-1">
                                        {s.title}
                                    </h3>
                                    <p className="mt-2.5 line-clamp-3 text-[0.875rem] leading-relaxed text-white/70 [@media(min-width:1024px)and(max-height:820px)]:hidden">
                                        {s.shortDescription}
                                    </p>
                                    <span className="mt-4 inline-flex items-center gap-2 text-[0.875rem] text-white">
                                        Read the full brief
                                        <span
                                            aria-hidden="true"
                                            className="transition-transform duration-300 group-hover/card:translate-x-1"
                                        >
                                            →
                                        </span>
                                    </span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ol>
            </div>

            {/* ── Progress ────────────────────────────────────────────── */}
            <div className="shell mt-8 shrink-0 lg:mt-6">
                <div className="flex items-center gap-5">
                    <p className="label-mono shrink-0 tabular-nums text-(--text-mute)">
                        {/* Written to directly on scroll — see note 3 in the
                            header. It starts at 01 server-side, which is also
                            the correct value with no JavaScript. */}
                        <span ref={counter} className="text-brand">
                            01
                        </span>
                        <span> / {pad(count)}</span>
                    </p>

                    <div className="relative h-px flex-1 bg-(--line)">
                        <span
                            ref={bar}
                            aria-hidden="true"
                            className="absolute inset-y-0 left-0 block w-full origin-left scale-x-0 bg-brand"
                        />
                    </div>

                    <p className="label-mono shrink-0 text-(--text-mute)">
                        <span className="hidden lg:inline">Scroll to move</span>
                        <span className="lg:hidden">Swipe</span>
                    </p>
                </div>
            </div>
        </section>
    );
}
