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
import { SERVICE_TYPES, SERVICE_LABELS, SERVICE_MEDIA } from "@/lib/taxonomy";
import { cn, pad } from "@/lib/utils";

/**
 * Editorial hero over an organic mesh-glow field.
 *
 * Four choices carried forward, because they are what stop this reading as
 * generated:
 *  1. The headline breaks emphasis mid-sentence — a rotating subject in signal
 *     orange, then a second clause in muted colour on the same line. Generated
 *     headlines set the whole line at one weight and gradient the keyword.
 *  2. The lede and actions sit in a right rail aligned to the headline's
 *     baseline, not centred beneath it.
 *  3. Real work appears above the fold. The first screen carries evidence, not
 *     an abstract illustration — the mesh sits behind the proof, not instead
 *     of it.
 *  4. The capability run is a *navigation surface*, not decoration. Every
 *     discipline in the taxonomy is one click from the first screen.
 *
 * Nothing is hidden by CSS. Every element animates `from` its resting state, so
 * if JS never runs the hero still reads — including the rotator, which renders
 * its first word server-side and simply never rotates.
 *
 * ── ONE POINTER SOURCE ───────────────────────────────────────────────────
 * The mesh, the floating metrics and the card tilt all subscribe to a single
 * usePointerField — one listener, one rect read, one lerp per frame for three
 * consumers. useMagnetic keeps its own, because it is element-relative and
 * shared with the Navbar and the footer.
 *
 * The pill bar also *writes* one scalar onto that same object (`boost`), which
 * HeroCanvas reads to warm the field toward signal. A shared mutable ref is
 * the cheapest possible channel between two siblings that both already run on
 * the GSAP ticker; a React state round-trip would re-render the hero on hover.
 */

/**
 * The headline rotator.
 *
 * Keyed to taxonomy slugs on purpose. These are display phrases, not labels —
 * "Mobile Apps" is right on a project tag and wrong in a display headline —
 * but the key forces the two lists to be reconciled by hand when a discipline
 * is added, instead of silently drifting apart.
 */
const FLIP_WORDS = [
    { key: "web-development", word: "web platforms" },
    { key: "custom-software", word: "custom software" },
    { key: "mobile-applications", word: "mobile products" },
    { key: "product-design", word: "product design" },
    { key: "architectural-visualization", word: "visual production" },
];

const HOLD = 2.9; // seconds a word is legible before the next scramble

/* Key headline words. Matched on normalised text after the split, because
   SplitText rebuilds the DOM and any marker span authored in the JSX would be
   restructured out from under us. */
const KEY_WORDS = new Set(["engineering", "survives", "launch"]);

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
    const flipRef = useRef(null);
    const capsRef = useRef(null);

    const field = usePointerField(root, { lerp: 0.09, restX: 0.62, restY: 0.35 });

    useMagnetic(root, { pull: 0.34, cap: 12 });
    useLiquidFill(root);

    /* Every value traces to lib/site.js or the taxonomy. A hero metric with no
       source is a number someone invented, and it will be wrong within a year.
       Depths alternate sign so the group separates under parallax instead of
       sliding as one plane. */
    const metrics = [
        { k: String(site.foundedYear), v: "In production since", depth: 1 },
        { k: pad(SERVICE_TYPES.length), v: "Disciplines, one team", depth: -0.74 },
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
                     * mask: "words", NOT mask: "lines".
                     *
                     * The headline is no longer a single run of text — it is two
                     * static segments with a live rotator inline between them. Line
                     * masks are block-level wrappers, so splitting a segment into
                     * masked lines would blockify it and throw the rotator onto its
                     * own line. Word masks are inline-block, so the inline flow
                     * survives and the chars still rise out of a clipped box.
                     *
                     * autoSplit is REQUIRED, not optional. General Sans loads from
                     * the Fontshare CDN (see globals.css), so it lands after first
                     * paint; a one-shot split measures word boxes in the fallback
                     * face and every mask ends up the wrong width. autoSplit
                     * re-splits on font load and on resize, and returning the
                     * timeline from onSplit keeps it time-synced across re-splits.
                     */
                    const split = SplitText.create("[data-hero-words]", {
                        type: "words,chars",
                        mask: "words",
                        autoSplit: true,
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
                               Chars rise inside the word masks. A very tight `each` —
                               14ms — so the line resolves as one wave rather than as
                               forty separate events. */
                            const tl = gsap.timeline();
                            tl.from(
                                self.chars,
                                {
                                    yPercent: 112,
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
                                        // word chain would need transform-style:
                                        // preserve-3d for an inherited perspective to
                                        // survive, and preserve-3d on a masked word
                                        // breaks the clip.
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
                            { y: 10, autoAlpha: 0, stagger: 0.035, duration: 0.45 },
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

    /* ── Headline rotator ───────────────────────────────────────────────── */
    /**
     * ScrambleText on the whole word, not per-char via SplitText.
     *
     * The rotating words have different lengths ("product design" → "visual
     * production"), and a char split is a fixed set of nodes. Re-splitting on
     * every rotation would thrash the DOM sixty times a minute and fight
     * autoSplit above; padding to the longest word would leave visible trailing
     * glyphs. ScrambleText is built for exactly this — it tweens *between* two
     * strings of unequal length — so it owns the word, and SplitText owns the
     * static segments around it. `tweenLength: false` is what lets the width
     * tween below do the growing, instead of two systems both animating length.
     *
     * The container's width is measured off a hidden sizer stack rather than
     * pinned to the widest word: a headline that reserves 14ch of empty space
     * for "visual production" while it says "web platforms" is the giveaway
     * that a rotator is bolted on. Measured live, so the fluid clamp() on
     * .text-display and the CDN font swap are both handled for free.
     */
    useGSAP(
        () => {
            const flip = flipRef.current;
            if (!flip) return;
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

            const live = flip.querySelector("[data-flip-live]");
            const clip = flip.querySelector("[data-flip-clip]");
            const rule = flip.querySelector("[data-flip-rule]");
            const glow = flip.querySelector("[data-flip-glow]");
            const sizers = gsap.utils.toArray("[data-flip-sizer]", flip);
            if (!live || !clip || !rule || sizers.length !== FLIP_WORDS.length) return;

            let cur = 0;
            const measure = (i) => sizers[i].getBoundingClientRect().width;

            const pin = () => gsap.set(flip, { width: measure(cur) });
            // Fonts first: measuring in the fallback face and never re-measuring
            // is how rotators end up clipping their last glyph.
            if (document.fonts?.ready) document.fonts.ready.then(pin);
            pin();

            gsap.set(rule, { scaleX: 1, transformOrigin: "0% 50%" });
            gsap.set(glow, { opacity: 0 });

            // repeatRefresh re-evaluates the function-based width on every loop,
            // so a mid-session resize is picked up without rebuilding the
            // timeline. Paused until the hero is actually on screen.
            const master = gsap.timeline({ repeat: -1, repeatRefresh: true, paused: true });

            FLIP_WORDS.forEach((_, n) => {
                const next = (n + 1) % FLIP_WORDS.length;
                const at = n * HOLD + HOLD;

                master
                    .to(
                        rule,
                        {
                            scaleX: 0,
                            transformOrigin: "100% 50%",
                            duration: 0.3,
                            ease: "power2.in",
                        },
                        at,
                    )
                    .to(glow, { opacity: 1, duration: 0.3, ease: "power2.out" }, at)
                    .to(
                        flip,
                        { width: () => measure(next), duration: 0.62, ease: "power3.inOut" },
                        at + 0.06,
                    )
                    .to(
                        live,
                        {
                            duration: 0.75,
                            ease: "none",
                            scrambleText: {
                                text: FLIP_WORDS[next].word,
                                chars: SCRAMBLE_CHARS,
                                speed: 0.55,
                                revealDelay: 0.25,
                                tweenLength: false,
                            },
                            onStart: () => {
                                cur = next;
                            },
                        },
                        at + 0.06,
                    )
                    .set(rule, { transformOrigin: "0% 50%" }, at + 0.35)
                    .to(rule, { scaleX: 1, duration: 0.55, ease: "power3.out" }, at + 0.37)
                    .to(glow, { opacity: 0, duration: 0.6, ease: "power2.out" }, at + 0.42);
            });
            // Extend past the last flip so the final word gets its full hold
            // before the loop wraps. A timeline ends at its last tween, so
            // without this the wrap happens mid-settle.
            master.set({ _pad: 0 }, { _pad: 1 }, FLIP_WORDS.length * HOLD);

            /* Gates. A rotator that keeps scrambling in a background tab is a
               wakelock on someone's battery for an animation nobody is looking
               at, and one that keeps moving while the reader is trying to read
               it is worse. */
            let onScreen = true;
            let tabVisible = !document.hidden;
            let held = false;
            const sync = () => {
                if (onScreen && tabVisible && !held) master.play();
                else master.pause();
            };

            const io = new IntersectionObserver(
                ([e]) => {
                    onScreen = e.isIntersecting;
                    sync();
                },
                { rootMargin: "80px" },
            );
            io.observe(flip);

            const onVis = () => {
                tabVisible = !document.hidden;
                sync();
            };
            const hold = () => {
                held = true;
                sync();
            };
            const release = () => {
                held = false;
                sync();
            };

            document.addEventListener("visibilitychange", onVis);
            flip.addEventListener("pointerenter", hold);
            flip.addEventListener("pointerleave", release);

            // Re-pin on resize: .text-display is a vw clamp, so the word's true
            // width changes with the viewport and the frozen inline width would
            // clip it.
            const ro = new ResizeObserver(() => {
                if (!master.isActive()) pin();
            });
            ro.observe(document.documentElement);

            sync();

            return () => {
                io.disconnect();
                ro.disconnect();
                document.removeEventListener("visibilitychange", onVis);
                flip.removeEventListener("pointerenter", hold);
                flip.removeEventListener("pointerleave", release);
                master.kill();
            };
        },
        { scope: root, dependencies: [] },
    );

    /* ── Service pills ──────────────────────────────────────────────────── */
    /**
     * Three layers of feedback, deliberately:
     *  · colour + a rule that draws left-to-right — the local, always-available
     *    kinetic indicator, and the only one that exists on touch;
     *  · the index decodes via ScrambleText, which is the house motion idiom
     *    reused rather than a new one invented;
     *  · CustomCursor lifts the discipline's artwork into the ring via
     *    data-cursor-image, so the preview costs zero additional DOM and zero
     *    additional images on mobile, where it never renders.
     *
     * And one non-local one: hovering warms the mesh behind the hero toward
     * signal orange, written straight onto the shared pointer field. The hero
     * reacts as a single surface rather than as a stack of independent widgets.
     */
    useGSAP(
        () => {
            const wrap = capsRef.current;
            if (!wrap) return;
            if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const pills = gsap.utils.toArray("[data-hero-pill]", wrap);
            if (!pills.length) return;

            const bus = field.current;
            const cache = new Map();
            const parts = (pill) => {
                let p = cache.get(pill);
                if (!p) {
                    p = {
                        rule: pill.querySelector("[data-pill-rule]"),
                        arrow: pill.querySelector("[data-pill-arrow]"),
                        index: pill.querySelector("[data-pill-index]"),
                        halo: pill.querySelector("[data-pill-halo]"),
                    };
                    gsap.set(p.rule, { scaleX: 0, transformOrigin: "0% 50%" });
                    gsap.set(p.arrow, { autoAlpha: 0, x: -6 });
                    gsap.set(p.halo, { opacity: 0 });
                    cache.set(pill, p);
                }
                return p;
            };

            let active = null;

            const enter = (pill) => {
                const p = parts(pill);
                bus.boost = 1;
                gsap.to(p.rule, {
                    scaleX: 1,
                    transformOrigin: "0% 50%",
                    duration: 0.42,
                    ease: "power3.out",
                    overwrite: "auto",
                });
                gsap.to(p.halo, { opacity: 1, duration: 0.35, ease: "power2.out", overwrite: "auto" });
                gsap.to(p.arrow, {
                    autoAlpha: 1,
                    x: 0,
                    duration: 0.4,
                    ease: "power3.out",
                    overwrite: "auto",
                });
                if (!reduced) {
                    // Decodes to the value it already shows. The point is the
                    // texture of the transition, not a change of content — an
                    // index that becomes a different number reads as a bug.
                    gsap.to(p.index, {
                        duration: 0.34,
                        ease: "none",
                        scrambleText: {
                            text: p.index.dataset.value,
                            chars: "0123456789",
                            speed: 1,
                        },
                        overwrite: "auto",
                    });
                }
            };

            const leave = (pill) => {
                const p = parts(pill);
                gsap.to(p.rule, {
                    scaleX: 0,
                    transformOrigin: "100% 50%",
                    duration: 0.3,
                    ease: "power2.in",
                    overwrite: "auto",
                });
                gsap.to(p.halo, { opacity: 0, duration: 0.4, ease: "power2.out", overwrite: "auto" });
                gsap.to(p.arrow, {
                    autoAlpha: 0,
                    x: -6,
                    duration: 0.3,
                    ease: "power2.in",
                    overwrite: "auto",
                });
            };

            /* Delegated, and pointerover/pointerout rather than enter/leave, so
               one pair of listeners covers all seven pills including the gaps
               between them — moving along the run never leaves two lit. */
            const onOver = (e) => {
                const pill = e.target.closest?.("[data-hero-pill]");
                if (!pill || pill === active) return;
                if (active) leave(active);
                active = pill;
                enter(pill);
            };

            const onOut = (e) => {
                if (!active) return;
                if (e.relatedTarget && active.contains(e.relatedTarget)) return;
                leave(active);
                active = null;
                bus.boost = 0;
            };

            wrap.addEventListener("pointerover", onOver);
            wrap.addEventListener("pointerout", onOut);

            return () => {
                wrap.removeEventListener("pointerover", onOver);
                wrap.removeEventListener("pointerout", onOut);
                bus.boost = 0;
                cache.forEach((p) => gsap.killTweensOf([p.rule, p.arrow, p.index, p.halo]));
                cache.clear();
            };
        },
        { scope: root, dependencies: [] },
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
                    {/* The rotator would otherwise make this h1 a live region that
              re-announces itself every 2.9s. One static sentence for
              assistive tech, one kinetic composition for everyone else —
              same meaning, and the accessible name never changes. */}
                    <h1 data-hero-headline className="text-display lg:col-span-8">
                        <span className="sr-only">
                            Engineering web platforms, custom software, mobile products, product
                            design and visual production that survives the year after launch.
                        </span>

                        <span aria-hidden="true">
                            <span data-hero-words>Engineering</span>{" "}
                            <span
                                ref={flipRef}
                                data-hero-flip
                                className="relative isolate inline-block align-baseline whitespace-nowrap text-signal"
                            >
                                {/* overflow-x: clip / overflow-y: visible — the one
                    overflow pair that clips a single axis. ScrambleText
                    with tweenLength:false jumps straight to the target
                    string length while the container's width is still
                    tweening, so a longer word would spill over the
                    following clause for ~300ms. Clipping horizontally
                    turns that flaw into the effect: the new word is
                    revealed by its own expanding box. `hidden` would
                    not do — it forces the other axis to auto and eats
                    the descenders. */}
                                <span
                                    data-flip-clip
                                    className="relative z-10 block"
                                    style={{ overflowX: "clip", overflowY: "visible" }}
                                >
                                    {/* Server-rendered with the first word, so the
                      headline is complete and correct with JS
                      disabled; the rotation is enhancement on top. */}
                                    <span
                                        data-flip-live
                                        className="inline-block whitespace-nowrap"
                                    >
                                        {FLIP_WORDS[0].word}
                                    </span>
                                </span>

                                <span
                                    data-flip-rule
                                    className="bg-signal absolute bottom-[-0.04em] left-0 z-10 block h-[0.05em] w-full origin-left rounded-full"
                                />

                                {/* Outside the clip layer on purpose — the glow's
                    whole job is to bleed past the word box while it is
                    mid-scramble, so the swap reads as the mesh behind
                    it flaring rather than as a text widget cycling. */}
                                <span
                                    data-flip-glow
                                    className="pointer-events-none absolute inset-x-[-0.14em] inset-y-[-0.1em] z-0 block rounded-[0.35em] opacity-0"
                                    style={{
                                        background:
                                            "radial-gradient(60% 70% at 50% 55%, color-mix(in oklab, var(--color-signal) 30%, transparent), transparent 72%)",
                                    }}
                                />

                                {/* Hidden sizer stack. Absolute + flex so each child
                    shrink-wraps to its own advance width — as block
                    children they would all report the container's
                    width and every word would measure identically. */}
                                <span
                                    data-flip-sizers
                                    className="pointer-events-none invisible absolute top-0 left-0 flex"
                                >
                                    {FLIP_WORDS.map((w) => (
                                        <span
                                            key={w.key}
                                            data-flip-sizer
                                            className="whitespace-nowrap"
                                        >
                                            {w.word}
                                        </span>
                                    ))}
                                </span>
                            </span>{" "}
                            <span data-hero-words className="text-(--text-mute)">
                                that survives the year after launch.
                            </span>
                        </span>
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
                                    className="bg-signal absolute inset-0 block will-change-transform"
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

                {/* ── Capability run, now a navigation surface ────────────────
            Still set in mono and still reads as a run rather than as a
            button bar at rest — the padding only becomes visible under
            the halo on hover. */}
                <ul
                    ref={capsRef}
                    data-hero-caps
                    className="mt-14 flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-(--line) pt-5"
                >
                    {SERVICE_TYPES.map((slug, i) => (
                        <li key={slug}>
                            <Link
                                href={`/services/${slug}`}
                                data-hero-pill
                                data-cursor="view"
                                data-cursor-image={SERVICE_MEDIA[slug]}
                                data-cursor-label={SERVICE_LABELS[slug]}
                                className="label-mono group relative inline-flex items-center gap-2.5 rounded-full px-3 py-2.5 text-(--text-mute) transition-colors duration-300 hover:text-signal"
                            >
                                <span
                                    data-pill-halo
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0 rounded-full opacity-0"
                                    style={{
                                        background:
                                            "color-mix(in oklab, var(--color-signal) 9%, transparent)",
                                        boxShadow:
                                            "inset 0 0 0 1px color-mix(in oklab, var(--color-signal) 26%, transparent)",
                                    }}
                                />

                                <span
                                    data-pill-index
                                    data-value={pad(i + 1)}
                                    aria-hidden="true"
                                    className="nums relative text-[0.5625rem] text-(--line) transition-colors duration-300 group-hover:text-signal"
                                >
                                    {pad(i + 1)}
                                </span>

                                <span className="relative">{SERVICE_LABELS[slug]}</span>

                                <svg
                                    data-pill-arrow
                                    width="11"
                                    height="11"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    aria-hidden="true"
                                    className="relative"
                                >
                                    <path
                                        d="M3.5 12.5l9-9M5.5 3.5h7v7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>

                                <span
                                    data-pill-rule
                                    aria-hidden="true"
                                    className="bg-signal absolute inset-x-3 bottom-1 block h-px origin-left"
                                />
                            </Link>
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
