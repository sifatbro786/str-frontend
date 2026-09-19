"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * One line of a heading that cycles through a list of phrases, character by
 * character, using a different technique on each handover.
 *
 * ── THE THREE EFFECTS ────────────────────────────────────────────────────
 * Transitions cycle ROLL → SLIDE → SCRAMBLE and repeat. One effect on a loop
 * becomes wallpaper after the second pass; three in rotation means the line
 * is still telling you something on the ninth.
 *
 *   ROLL      Characters roll out through the top and the next phrase rolls
 *             up from below, staggered from the first letter, so the word
 *             peels rather than lifting as a block. Vertical.
 *   SLIDE     The same handover on the horizontal axis: the outgoing letters
 *             are pushed left and the incoming ones arrive from the right,
 *             staggered so the word assembles left to right.
 *   SCRAMBLE  ScrambleTextPlugin resolves each character out of random glyphs
 *             into its final letter, staggered. No transform at all — the
 *             motion is in the text itself.
 *
 * The underline rule that used to sweep under every handover is gone; it was
 * a fourth thing happening on top of three that already work.
 *
 * ── WHY ALL THREE RUN ON THE SAME PRE-SPLIT CHARACTERS ───────────────────
 * ScrambleText rewrites textContent, which normally rules out combining it
 * with SplitText: the plugin would eat the character spans. It works here
 * because scramble is applied to the char spans THEMSELVES, one per letter,
 * with `text: "{original}"` — the plugin's token for "whatever this element
 * already contained". Each span scrambles within its own box, so the split
 * survives and the geometry never moves.
 *
 * That is also why the split happens once at mount rather than per cycle.
 * Re-splitting every two seconds would allocate and discard a dozen spans
 * forever, and each split forces a layout read.
 *
 * ── WHY EVERY from-STATE IS FULLY SPECIFIED ──────────────────────────────
 * A phrase can leave on ROLL (ending at yPercent -110) and return on SLIDE.
 * If the slide's from-state only set xPercent, the stale yPercent would still
 * be there and the word would arrive off its own line. Every fromTo declares
 * xPercent, yPercent AND autoAlpha for exactly this reason. Do not trim them.
 *
 * ── THE VERTICAL GAP THIS LAYOUT FIXES ───────────────────────────────────
 * Phrases are grid items sharing one cell, so the track is as wide as the
 * widest and as tall as the tallest, measured by the browser. An earlier
 * version used an invisible "longest phrase" copy, which wrapped to two lines
 * at display size and left a dead band under every short phrase. It also
 * picked the longest by character count, which is not width: "3D renders" has
 * fewer characters than "data pipelines" and is wider, because caps and
 * digits are wide while l and i are narrow.
 *
 * ── WHY THE SPLIT IS GATED ON FONTS ──────────────────────────────────────
 * General Sans arrives from the Fontshare CDN after first paint. Characters
 * measured against fallback metrics keep those positions for the life of the
 * page.
 *
 * ── WHY IT PAUSES OFF-SCREEN ─────────────────────────────────────────────
 * An infinite timeline requests frames forever, including while the hero is
 * two screens up. One ScrollTrigger toggles it.
 *
 * ── WHY THE LINE SCALES ITSELF ───────────────────────────────────────────
 * The phrase list is the studio's service taxonomy, so its longest entry is
 * decided by the business, not by this component. At display size "Business
 * Consultancy" measures ~700px and the headline column is ~530px, and the
 * per-line overflow-hidden mask in Hero clips HORIZONTALLY as well as
 * vertically — which is exactly the shaved word this fixes. Rather than
 * policing phrase length in review forever, the line measures itself once per
 * layout and sets `--rw-fit`, a 0–1 multiplier on its own font-size.
 *
 * Two details make that measurement safe:
 *
 *   · The ruler is a separate hidden stack that is never split and never
 *     animated, so it can be read at any point in the timeline. Reading the
 *     live phrases instead would return whatever width a half-finished SLIDE
 *     happens to be at.
 *   · The ruler's font-size DIVIDES --rw-fit back out, so it always measures
 *     at the inherited size. It is therefore immune to the scale it is used
 *     to compute — one pass is exact, and the ResizeObserver cannot feed back
 *     into itself.
 *
 * The line-height is copied from the host in pixels rather than scaled by
 * hand, so line two's box stays exactly as tall as lines one and three
 * whatever the fit turns out to be and the headline rhythm never moves.
 *
 * @param {string[]} phrases  Grammatically uniform. See Hero.
 * @param {number}   hold     Seconds each phrase stays still.
 */
export default function RotatingWord({ phrases, hold = 2.2, className }) {
    const root = useRef(null);
    const ruler = useRef(null);

    useGSAP(
        (context, contextSafe) => {
            const items = gsap.utils.toArray("[data-phrase]", root.current);
            if (items.length < 2) return;

            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            let ro = null;

            const applyFit = () => {
                const el = root.current;
                const rule = ruler.current;
                const host = el?.parentElement;
                if (!el || !rule || !host) return;

                /* ⚑ One span, measured N times — NOT N spans measured once.
                   The ruler used to render every phrase into a hidden stack,
                   which meant the served HTML carried the whole service list a
                   second time inside the <h1>: "We deliver" followed by nine
                   names, then those same nine again, then "that holds up after
                   launch." Correct for assistive tech (both copies are
                   aria-hidden and the h1 carries an aria-label), but the h1's
                   text content is what a crawler indexes, and eighteen comma-less
                   service names is not a sentence.

                   Writing each phrase into one reusable span costs N layout
                   reads per resize instead of one, on a span that is
                   visibility:hidden and nine items long. That is cheap, and it
                   happens on resize, not per frame. The DOM keeps one copy. */
                let natural = 0;
                for (const p of phrases) {
                    rule.textContent = p;
                    const w = rule.getBoundingClientRect().width;
                    if (w > natural) natural = w;
                }
                /* 1px of slack. A natural width that lands on a sub-pixel
                   rounds up into the mask and shaves the final glyph — the
                   original bug, reintroduced at 1/60th the size. */
                const available = (host.clientWidth || host.getBoundingClientRect().width) - 1;
                if (!natural || available <= 0) return;

                el.style.setProperty("--rw-fit", String(Math.min(1, available / natural)));
                el.style.lineHeight = window.getComputedStyle(host).lineHeight;
            };

            /* A first pass against fallback metrics, before the webfont has
               landed. It is approximate — General Sans is narrower than the
               fallback, so this over-shrinks slightly — and build() corrects it
               the moment the real font is measurable. The point is that the
               uncorrected frame is a hair small rather than visibly clipped,
               and useGSAP runs this pre-paint so there is no flash either way. */
            applyFit();

            const AT_REST = { xPercent: 0, yPercent: 0, autoAlpha: 1 };
            const ABOVE = { xPercent: 0, yPercent: -115, autoAlpha: 0 };
            const BELOW = { xPercent: 0, yPercent: 115, autoAlpha: 0 };
            const LEFT = { xPercent: -140, yPercent: 0, autoAlpha: 0 };
            const RIGHT = { xPercent: 140, yPercent: 0, autoAlpha: 0 };

            let splits = [];
            let st = null;
            let tl = null;

            /* contextSafe is load-bearing. The split is deferred behind
               document.fonts.ready, so it resolves after useGSAP's synchronous
               context-recording window has closed. A plain closure would create
               a timeline and a ScrollTrigger the context never learns about,
               and neither would be collected on a route change. */
            const build = contextSafe(() => {
                if (!root.current) return;

                /* Fit BEFORE the split. SplitText freezes nothing here, but a
                   split measured at the unscaled size and then reflowed is one
                   extra layout pass on the LCP element for no gain. */
                applyFit();
                ro = new ResizeObserver(applyFit);
                ro.observe(root.current.parentElement ?? root.current);

                /* Reduced motion gets the first phrase, held. Text that cycles
                   on a timer is one of the specific things the preference
                   exists to stop: motion the reader did not ask for and cannot
                   pause. It still gets the fit — clipping is not a motion. */
                if (reduced) {
                    gsap.set(items, { autoAlpha: 0 });
                    gsap.set(items[0], { autoAlpha: 1 });
                    return;
                }

                splits = items.map((el) =>
                    SplitText.create(el, { type: "chars", charsClass: "rw-char" }),
                );

                gsap.set(items, { autoAlpha: 1 });
                splits.forEach((s, idx) => gsap.set(s.chars, idx === 0 ? AT_REST : BELOW));

                tl = gsap.timeline({ repeat: -1, paused: true });

                items.forEach((_, i) => {
                    const current = splits[i].chars;
                    const next = splits[(i + 1) % items.length].chars;
                    const effect = i % 3; // 0 roll · 1 slide · 2 scramble

                    // Every phrase holds, then hands over. The hold is expressed
                    // as a relative gap so it is unaffected by how long the
                    // previous handover took.
                    const start = `+=${hold}`;

                    if (effect === 0) {
                        tl.to(
                            current,
                            {
                                ...ABOVE,
                                duration: 0.5,
                                ease: "power2.in",
                                stagger: { each: 0.022, from: "start" },
                            },
                            start,
                        ).fromTo(
                            next,
                            BELOW,
                            {
                                ...AT_REST,
                                duration: 0.72,
                                ease: "back.out(1.5)",
                                stagger: { each: 0.026, from: "start" },
                            },
                            // Overlapped so the line is never empty.
                            "-=0.3",
                        );
                    } else if (effect === 1) {
                        tl.to(
                            current,
                            {
                                ...LEFT,
                                duration: 0.45,
                                ease: "power2.in",
                                stagger: { each: 0.02, from: "start" },
                            },
                            start,
                        ).fromTo(
                            next,
                            RIGHT,
                            {
                                ...AT_REST,
                                duration: 0.7,
                                ease: "power4.out",
                                stagger: { each: 0.024, from: "start" },
                            },
                            "-=0.32",
                        );
                    } else {
                        /* Scramble. The outgoing phrase dissolves from the END
                           of the word backwards, which reads as it being eaten
                           rather than fading, and the incoming one is placed at
                           rest immediately so the plugin has stable boxes to
                           write into.

                           ease: "none" is required, not stylistic: scrambleText
                           swaps glyphs at a rate derived from tween progress,
                           and an eased progress makes the shuffle visibly speed
                           up and slow down, which reads as a stutter. */
                        tl.to(
                            current,
                            {
                                autoAlpha: 0,
                                duration: 0.3,
                                ease: "power1.in",
                                stagger: { each: 0.014, from: "end" },
                            },
                            start,
                        )
                            .set(next, AT_REST)
                            .to(
                                next,
                                {
                                    duration: 0.5,
                                    ease: "none",
                                    scrambleText: {
                                        // The plugin's token for "this element's
                                        // own original content". Without it every
                                        // character would resolve to the same
                                        // string.
                                        text: "{original}",
                                        chars: "upperCase",
                                        speed: 0.9,
                                    },
                                    stagger: { each: 0.018, from: "start" },
                                },
                                "-=0.18",
                            );
                    }
                });

                st = ScrollTrigger.create({
                    trigger: root.current,
                    start: "top bottom",
                    end: "bottom top",
                    onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
                });

                // Seed the play state: if the hero is already on screen when the
                // font lands, onToggle will not fire on its own.
                if (st.isActive) tl.play();
            });

            if (!document.fonts || document.fonts.status === "loaded") build();
            else document.fonts.ready.then(build);

            return () => {
                ro?.disconnect();
                st?.kill();
                tl?.kill();
                // revert() restores each phrase's original text, which matters
                // more than usual here: if a scramble tween is killed mid-flight
                // the spans are holding random glyphs, and without the revert
                // those would be what a screen reader or a copy-paste picks up.
                splits.forEach((s) => s.revert());
            };
        },
        { scope: root },
    );

    return (
        /* ── ONE GRID CELL, EVERY PHRASE IN IT ────────────────────────────
           No sizing copy and no absolute positioning. Every phrase is a real
           grid item at row 1 / column 1, which stacks them and makes the
           track exactly as wide as the widest and as tall as the tallest.
           The box sizes itself, correctly, with no measurement and no JS.

           whitespace-nowrap keeps the track one line tall however narrow the
           column gets; --rw-fit (see the header note) is what keeps that one
           line inside the column instead of under the mask. */
        <span
            ref={root}
            className={cn("relative grid justify-items-start", className)}
            style={{ fontSize: "calc(1em * var(--rw-fit, 1))" }}
        >
            {/* The ruler. Out of flow so it contributes no track, invisible
                rather than display:none so it still has a box to measure, and
                its font-size divides --rw-fit back out so it always reports
                the phrase at the INHERITED size. Never split, never tweened —
                measuring the live phrases mid-handover returns a width the
                line does not actually need.

                Rendered EMPTY. applyFit writes each phrase into it in turn and
                keeps the widest, so the phrase list appears in the document
                exactly once (see the note in applyFit). Do not put children
                back in here; the measurement does not need them and the <h1>
                does not want them. */}
            <span
                ref={ruler}
                aria-hidden="true"
                className="pointer-events-none invisible absolute top-0 left-0 block whitespace-nowrap"
                style={{ fontSize: "calc(1em / var(--rw-fit, 1))" }}
            />

            {phrases.map((p) => (
                <span
                    key={p}
                    data-phrase=""
                    aria-hidden="true"
                    className="col-start-1 row-start-1 block whitespace-nowrap will-change-transform"
                >
                    {p}
                </span>
            ))}
        </span>
    );
}
