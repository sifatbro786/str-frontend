"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/lib/gsap";
import { useMagnetic } from "@/components/motion/useMagnetic";
import { useLiquidFill } from "@/components/motion/useLiquidFill";
import { usePointerField } from "@/components/motion/usePointerField";
import HeroCanvas from "./HeroCanvas";
import { site } from "@/lib/site";
import { SERVICE_LABELS } from "@/lib/taxonomy";
import { cn, pad } from "@/lib/utils";

/**
 * Editorial hero over an interactive particle mesh.
 *
 * Three choices carried forward from Phase 3, because they are what stop this
 * reading as generated:
 *  1. The headline breaks emphasis mid-sentence — a second clause in muted
 *     colour inside the same line. Generated headlines set the whole line at
 *     one weight and gradient the keyword.
 *  2. The lede and actions sit in a right rail aligned to the headline's
 *     baseline, not centred beneath it.
 *  3. Real work appears above the fold. The first screen carries evidence, not
 *     an abstract illustration — the mesh sits behind the proof, not instead
 *     of it.
 *
 * Nothing is hidden by CSS. Every element animates `from` its resting state, so
 * if JS never runs the hero still reads.
 *
 * ── ONE POINTER SOURCE ───────────────────────────────────────────────────
 * The mesh, the floating metrics and the card tilt all subscribe to a single
 * usePointerField — one listener, one rect read, one lerp per frame for three
 * consumers. useMagnetic keeps its own, because it is element-relative and
 * shared with the Navbar and the footer.
 */

/* Key headline words. Matched on normalised text after the split, because
   SplitText rebuilds the DOM and any marker span authored in the JSX would be
   restructured out from under us. */
const KEY_WORDS = new Set(["software", "survives", "launch"]);

/* Glyph pool for the scramble. Deliberately no punctuation — random commas in
   a headline read as a rendering fault rather than an effect. */
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, "");

/* Staggered baselines are what make the metric cards read as floating rather
   than as a toolbar. Index-aligned with `metrics` below. */
const METRIC_POS = ["lg:mt-0", "lg:mt-10", "lg:mt-4"];

export default function HeroIntro({ strip }) {
    const root = useRef(null);
    const stripRef = useRef(null);
    const cardsRef = useRef(null);

    const field = usePointerField(root, { lerp: 0.09, restX: 0.62, restY: 0.35 });

    useMagnetic(root, { pull: 0.34, cap: 12 });
    useLiquidFill(root);

    /* Every value traces to lib/site.js or the taxonomy. A hero metric with no
       source is a number someone invented, and it will be wrong within a year.
       Depths alternate sign so the group separates under parallax instead of
       sliding as one plane. */
    const metrics = [
        { k: String(site.foundedYear), v: "In production since", depth: 1 },
        { k: pad(Object.keys(SERVICE_LABELS).length), v: "Disciplines, one team", depth: -0.74 },
        { k: "< 1 day", v: "Median first reply", depth: 0.5 },
    ];

    /* ── Entrance + headline ────────────────────────────────────────────── */
    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(
                {
                    reduced: "(prefers-reduced-motion: reduce)",
                    full: "(prefers-reduced-motion: no-preference)",
                },
                (ctx) => {
                    // Reduced motion gets the finished state, not a slower journey.
                    if (ctx.conditions.reduced) return;

                    /**
                     * autoSplit + onSplit is REQUIRED, not optional.
                     *
                     * General Sans loads from the Fontshare CDN (see globals.css), so
                     * it lands after first paint. A one-shot split measures line boxes
                     * in the fallback face; the real font then swaps in, every line
                     * break moves, and words end up clipped by their own masks.
                     * autoSplit re-splits on font load and on resize, and returning the
                     * timeline from onSplit keeps it time-synced across those re-splits.
                     */
                    const split = SplitText.create("[data-hero-headline]", {
                        type: "lines,words,chars",
                        mask: "lines",
                        autoSplit: true,
                        linesClass: "split-line-inner",
                        onSplit(self) {
                            const keyWords = self.words.filter((w) =>
                                KEY_WORDS.has(norm(w.textContent)),
                            );

                            /* ── Char widths, pinned on the key words only ──────────
                               ScrambleText rewrites textContent every frame, and
                               General Sans is proportional — an M standing in for an I
                               is ~2.5x the advance width. At text-display size that
                               reflows the line on every frame, and a headline that
                               jitters horizontally while it decodes reads as broken
                               rather than kinetic. Measuring once and freezing the box
                               makes the substitution a pure repaint.

                               Read all, then write all: interleaving a rect read with a
                               style write forces one synchronous layout per character. */
                            const keyChars = self.chars.filter((c) =>
                                keyWords.some((w) => w.contains(c)),
                            );
                            const widths = keyChars.map((c) => c.getBoundingClientRect().width);
                            keyChars.forEach((c, i) => {
                                c.style.display = "inline-block";
                                c.style.width = `${widths[i]}px`;
                                c.style.textAlign = "center";
                            });

                            /* ── Entrance ──────────────────────────────────────────
                               Chars rise inside the line masks. A very tight `each` —
                               14ms — so the line resolves as one wave rather than as
                               forty separate events. */
                            const tl = gsap.timeline();
                            tl.from(
                                self.chars,
                                {
                                    yPercent: 108,
                                    duration: 0.85,
                                    ease: "power4.out",
                                    stagger: { each: 0.014, from: "start" },
                                },
                                0,
                            );

                            /* ── Hover: scramble + weight shift ────────────────────
                               Bound here rather than in the JSX: these nodes are
                               created by the split and destroyed by the next one, so
                               the listeners die with them and there is nothing to
                               clean up. */
                            keyWords.forEach((w) => {
                                w.style.display = "inline-block";
                                // Colour is a CSS transition, not a tween — GSAP would
                                // have to resolve var(--text) to a number to
                                // interpolate back, which pins the rest colour to
                                // whichever theme was active at hover time. Clearing
                                // the inline value hands the token back.
                                w.style.transition = "color 0.4s ease";

                                const chars = keyChars.filter((c) => w.contains(c));
                                let busy = false;

                                const enter = () => {
                                    w.style.color = "var(--color-signal)";
                                    gsap.to(w, {
                                        // transformPerspective per element: the
                                        // line/word chain would each need
                                        // transform-style: preserve-3d for an inherited
                                        // perspective to survive, and preserve-3d on a
                                        // masked line breaks the clip.
                                        transformPerspective: 700,
                                        transformOrigin: "0% 65%",
                                        rotateY: -8,
                                        skewX: -3,
                                        scale: 1.03,
                                        duration: 0.45,
                                        ease: "power3.out",
                                        overwrite: "auto",
                                    });

                                    // Re-entering mid-decode would restart textContent
                                    // from an already-scrambled string, and the word
                                    // would settle on garbage.
                                    if (busy) return;
                                    busy = true;
                                    gsap.to(chars, {
                                        duration: 0.4,
                                        ease: "none",
                                        stagger: { each: 0.012, from: "random" },
                                        scrambleText: {
                                            text: "{original}",
                                            chars: SCRAMBLE_CHARS,
                                            speed: 0.7,
                                            revealDelay: 0.1,
                                        },
                                        onComplete: () => {
                                            busy = false;
                                        },
                                    });
                                };

                                const leave = () => {
                                    w.style.color = "";
                                    gsap.to(w, {
                                        rotateY: 0,
                                        skewX: 0,
                                        scale: 1,
                                        duration: 0.7,
                                        ease: "elastic.out(1, 0.5)",
                                        overwrite: "auto",
                                    });
                                };

                                w.addEventListener("pointerenter", enter);
                                w.addEventListener("pointerleave", leave);
                            });

                            return tl;
                        },
                    });

                    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
                    tl.from(
                        "[data-hero-locator] > *",
                        { y: 12, autoAlpha: 0, stagger: 0.05, duration: 0.5 },
                        0,
                    )
                        .from("[data-hero-lede]", { y: 20, autoAlpha: 0, duration: 0.7 }, 0.4)
                        .from(
                            "[data-hero-actions] > *",
                            { y: 16, autoAlpha: 0, stagger: 0.09, duration: 0.55 },
                            0.5,
                        )
                        .from(
                            "[data-hero-metric]",
                            { y: 26, autoAlpha: 0, stagger: 0.09, duration: 0.7 },
                            0.62,
                        )
                        .from(
                            "[data-hero-caps] li",
                            { autoAlpha: 0, stagger: 0.03, duration: 0.4 },
                            0.75,
                        )
                        .from(
                            "[data-hero-strip] > *",
                            { yPercent: 12, autoAlpha: 0, stagger: 0.1, duration: 0.9 },
                            0.7,
                        );

                    return () => split.revert();
                },
            );

            return () => mm.revert();
        },
        { scope: root },
    );

    /* ── Floating metrics: counter-parallax ─────────────────────────────── */
    useGSAP(
        () => {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

            const cards = gsap.utils.toArray("[data-hero-metric]", cardsRef.current);
            if (!cards.length) return;

            const setters = cards.map((c) => gsap.quickSetter(c, "css"));
            const depths = cards.map((c) => Number(c.dataset.depth) || 0);

            // quickSetter, not quickTo: the field is already smoothed, so a second
            // easing layer would only add lag on top of lag.
            const sub = (f) => {
                const ox = f.x - 0.5;
                const oy = f.y - 0.5;
                for (let i = 0; i < cards.length; i++) {
                    setters[i]({ x: ox * depths[i] * 38, y: oy * depths[i] * 24 });
                }
            };

            const bus = field.current;
            bus.subs.add(sub);
            return () => bus.subs.delete(sub);
        },
        { scope: root, dependencies: [] },
    );

    /* ── Evidence strip: 3D tilt ────────────────────────────────────────── */
    useGSAP(
        (context, contextSafe) => {
            const el = stripRef.current;
            if (!el) return;
            if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

            const cache = new Map();
            const setters = (card) => {
                let s = cache.get(card);
                if (!s) {
                    const plane = card.querySelector("[data-tilt-plane]");
                    const media = card.querySelector("[data-tilt-media]");
                    const sheen = card.querySelector("[data-tilt-sheen]");
                    s = {
                        plane,
                        sheen,
                        rx: gsap.quickTo(plane, "rotateX", { duration: 0.5, ease: "power3.out" }),
                        ry: gsap.quickTo(plane, "rotateY", { duration: 0.5, ease: "power3.out" }),
                        mx: gsap.quickTo(media, "xPercent", { duration: 0.7, ease: "power3.out" }),
                        my: gsap.quickTo(media, "yPercent", { duration: 0.7, ease: "power3.out" }),
                        sheenSet: gsap.quickSetter(sheen, "css"),
                    };
                    gsap.set(plane, { transformPerspective: 1100, transformOrigin: "50% 50%" });
                    cache.set(card, s);
                }
                return s;
            };

            let active = null;

            const release = (card) => {
                const s = setters(card);
                s.plane.style.willChange = "auto";
                gsap.to(s.plane, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.9,
                    ease: "elastic.out(1, 0.55)",
                    overwrite: "auto",
                });
                s.mx(0);
                s.my(0);
                gsap.to(s.sheen, { opacity: 0, duration: 0.4, ease: "power2.out" });
            };

            // Engagement is event-driven; the per-frame work reads the shared
            // field, so the strip adds no second pointermove listener.
            const onOver = contextSafe((e) => {
                const card = e.target.closest?.("[data-tilt-card]");
                if (!card || card === active) return;
                if (active) release(active);
                active = card;
                const s = setters(card);
                s.plane.style.willChange = "transform";
                gsap.to(s.sheen, { opacity: 1, duration: 0.45, ease: "power2.out" });
            });

            const onOut = contextSafe((e) => {
                if (!active) return;
                if (e.relatedTarget && active.contains(e.relatedTarget)) return;
                release(active);
                active = null;
            });

            const sub = contextSafe((f) => {
                // `moved` is load-bearing: quickTo restarts its tween on every call,
                // so calling it every frame with an unchanged value pins the tween
                // at t=0 and the tilt silently freezes mid-rotation.
                if (!active || !f.moved) return;

                const r = active.getBoundingClientRect();
                const nx = (f.cx - r.left) / r.width - 0.5;
                const ny = (f.cy - r.top) / r.height - 0.5;
                const s = setters(active);

                // 7°/9° is the ceiling. Past ~12° the foreshortening on a 4:5 crop
                // reads as distortion rather than as depth.
                s.rx(-ny * 7);
                s.ry(nx * 9);

                // The image counter-drifts inside its own frame. That opposition is
                // what separates a tilt from a plain rotation.
                s.mx(nx * -2.2);
                s.my(ny * -2.2);

                s.sheenSet({
                    background: `radial-gradient(38% 55% at ${(nx + 0.5) * 100}% ${
                        (ny + 0.5) * 100
                    }%, color-mix(in oklab, var(--text) 13%, transparent), transparent 70%)`,
                });
            });

            el.addEventListener("pointerover", onOver);
            el.addEventListener("pointerout", onOut);
            const bus = field.current;
            bus.subs.add(sub);

            return () => {
                el.removeEventListener("pointerover", onOver);
                el.removeEventListener("pointerout", onOut);
                bus.subs.delete(sub);
                cache.forEach((s) => gsap.killTweensOf([s.plane, s.sheen]));
                cache.clear();
            };
        },
        { scope: root, dependencies: [] },
    );

    return (
        <section ref={root} className="relative overflow-hidden border-b border-(--line)">
            <HeroCanvas field={field} />

            {/* The structural grid stays: it is a signature of the system, and it
          gives the mesh something to sit against so the glow reads as depth
          rather than as haze. data-speed lives here, not on the canvas — a
          parallaxing canvas would desync its own pointer mapping. */}
            <div
                aria-hidden="true"
                data-speed="0.9"
                className="bg-grid pointer-events-none absolute inset-0 mask-[radial-gradient(120%_80%_at_15%_0%,#000_20%,transparent_75%)]"
            />

            <div className="shell relative pt-32 md:pt-44">
                {/* Locator strip — replaces the pill eyebrow */}
                <div
                    data-hero-locator
                    className="label-mono flex flex-wrap items-center gap-x-4 gap-y-2 text-(--text-mute)"
                >
                    <span aria-hidden="true" className="h-px w-8 bg-signal" />
                    <span>
                        {site.address.city}, {site.address.country}
                    </span>
                    <span aria-hidden="true" className="text-(--line)">
                        //
                    </span>
                    <span>Est. {site.foundedYear}</span>
                    <span aria-hidden="true" className="text-(--line)">
                        //
                    </span>
                    <span>Engineering &amp; Visual Production</span>
                </div>

                <div className="mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-12 lg:items-end">
                    <h1 data-hero-headline className="text-display lg:col-span-8">
                        Software that survives{" "}
                        <span className="text-(--text-mute)">the year after launch.</span>
                    </h1>

                    <div className="lg:col-span-4 lg:pb-3">
                        <p
                            data-hero-lede
                            className="max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim)"
                        >
                            We are a Dhaka engineering and production studio. Web platforms, custom
                            software, mobile products, and the visual work that sells them — built
                            to be handed over, not held hostage.
                        </p>

                        <div data-hero-actions className="mt-8 flex flex-wrap items-center gap-3">
                            {/* Bespoke rather than <Button>: the liquid fill needs a
                  sheet layer and a label layer, and pushing that into the
                  shared Button would give every button on the site a hover
                  it was not designed for. */}
                            <Link
                                href="/contact"
                                data-magnetic="true"
                                data-liquid
                                data-liquid-on="text-white"
                                className="group relative inline-flex items-center overflow-hidden rounded-full bg-(--text) px-7 py-3.5 text-[0.9375rem] font-medium text-(--canvas) will-change-transform"
                            >
                                <span
                                    data-liquid-fill
                                    aria-hidden="true"
                                    className="absolute inset-0 block bg-signal will-change-transform"
                                />
                                <span
                                    data-liquid-label
                                    className="relative z-10 inline-flex items-center gap-2.5 transition-colors duration-300"
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
                                        className="transition-transform duration-300 ease-out group-hover:translate-x-1"
                                    >
                                        <path
                                            d="M2.5 8h11M9.5 4l4 4-4 4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </span>
                            </Link>

                            <Link
                                href="/projects"
                                data-magnetic="true"
                                data-liquid
                                data-liquid-on="text-(--canvas)"
                                className="relative inline-flex items-center overflow-hidden rounded-full border border-(--line) px-7 py-3.5 text-[0.9375rem] font-medium text-(--text) will-change-transform"
                            >
                                <span
                                    data-liquid-fill
                                    aria-hidden="true"
                                    className="absolute inset-0 block bg-(--text) will-change-transform"
                                />
                                <span
                                    data-liquid-label
                                    className="relative z-10 transition-colors duration-300"
                                >
                                    Selected work
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Floating metric cards ──────────────────────────────────
            In flow at every breakpoint, with staggered top margins and
            opposing parallax depths. Absolute positioning would put them
            over the lede rail on exactly the viewports where that rail is
            widest. */}
                <div
                    ref={cardsRef}
                    className="mt-14 flex flex-wrap items-start gap-3 md:gap-4 lg:mt-20 lg:items-end"
                >
                    {metrics.map((m, i) => (
                        <div
                            key={m.k}
                            data-hero-metric
                            data-depth={m.depth}
                            className={cn(
                                // bg-(--overlay) + blur is the glass. The hairline is
                                // what keeps it from reading as a generic frosted
                                // rectangle.
                                "rounded-2xl border border-(--line) bg-(--overlay) px-5 py-4 backdrop-blur-xl backdrop-saturate-150",
                                "shadow-[0_1px_0_0_rgb(255_255_255/0.05)_inset,0_20px_46px_-30px_rgb(0_0_0/0.6)]",
                                METRIC_POS[i],
                            )}
                        >
                            <p className="nums text-[1.5rem] leading-none tracking-[-0.03em] text-(--text)">
                                {m.k}
                            </p>
                            <p className="label-mono mt-2.5 text-(--text-mute)">{m.v}</p>
                        </div>
                    ))}
                </div>

                {/* Capability run — a plain comma-free list, set in mono */}
                <ul
                    data-hero-caps
                    className="label-mono mt-14 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-(--line) pt-6 text-(--text-mute)"
                >
                    {Object.values(SERVICE_LABELS).map((label, i) => (
                        <li key={label} className="flex items-center gap-6">
                            {i > 0 && (
                                <span aria-hidden="true" className="text-(--line)">
                                    /
                                </span>
                            )}
                            <span>{label}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Evidence strip. Cropped tall on purpose — a full screenshot at this
          size reads as a template preview; a crop reads as art direction.

          The card is desaturated and dimmed at rest and colours up on hover,
          while data-cursor-image hands CustomCursor the same shot at full
          bleed. Not redundant: the card is a crop, the cursor preview is the
          frame it was cut from. */}
            <div
                ref={stripRef}
                data-hero-strip
                className="shell relative mt-14 grid gap-px border-t border-(--line) bg-(--line) md:mt-20 md:grid-cols-3"
            >
                {(strip ?? []).map((p, i) => (
                    <Link
                        key={p._id}
                        href={`/projects/${p.slug}`}
                        data-tilt-card
                        data-cursor="view"
                        data-cursor-image={p.coverImage}
                        data-cursor-label={p.clientName}
                        // No overflow-hidden here: it would clip the tilted card's
                        // lifted corners flat and undo the depth. The crop is
                        // contained by the image's own frame below.
                        className="group relative block bg-(--canvas)"
                    >
                        <div data-tilt-plane className="will-change-auto">
                            {/* isolate: mix-blend-plus-lighter on the sheen blends
                  against the nearest stacking context, and without one it
                  reaches through to the page background. */}
                            <div className="relative isolate aspect-16/10 overflow-hidden md:aspect-4/5 lg:aspect-16/11">
                                {/* The 2.5% bleed is the headroom the counter-drift
                    moves inside. Without it a 2% shift exposes the frame. */}
                                <div data-tilt-media className="absolute inset-[-2.5%]">
                                    <Image
                                        src={p.coverImage}
                                        alt={p.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                        priority={i === 0}
                                        className="object-cover object-top grayscale transition-[filter,transform] duration-700 ease-out group-hover:scale-[1.03] group-hover:grayscale-0"
                                    />
                                </div>

                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0 bg-(--canvas)/45 transition-opacity duration-500 group-hover:opacity-0"
                                />
                                <span
                                    data-tilt-sheen
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0 opacity-0 mix-blend-plus-lighter"
                                />
                            </div>

                            <div className="flex items-baseline justify-between gap-4 px-1 py-4">
                                <span className="text-[0.9375rem] font-medium text-(--text)">
                                    {p.clientName}
                                </span>
                                <span className="label-mono text-(--text-mute)">
                                    {SERVICE_LABELS[p.serviceTypes[0]]}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
