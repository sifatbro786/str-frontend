"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/lib/gsap";
import { refreshScroll } from "@/lib/scrollRefresh";

/**
 * The house text reveal. One hook, used by every heading on the homepage, so
 * the whole page arrives with a single gesture instead of nine developers'
 * favourite easings.
 *
 * ── WHY clip-path AND NOT opacity ────────────────────────────────────────
 * Fading text in is the generated-UI tell. A clip inset wiping up from the
 * baseline while the word translates the same distance reads as type being
 * *set*, not as a div appearing. Both properties are composited, so the whole
 * reveal runs off the main thread.
 *
 * ── WHY THE FONT GATE IS NOT OPTIONAL ────────────────────────────────────
 * SplitText measures line boxes and freezes them into wrapper elements. Run it
 * before General Sans swaps in from Fontshare and every line break is computed
 * against the fallback metrics — the split survives the swap, so the heading
 * stays broken at the *wrong* words for the life of the page. document.fonts
 * .ready is the only correct gate here; a setTimeout is a race you lose on a
 * cold cache.
 *
 * ── WHY revert() RUNS BEFORE RESIZE RE-SPLIT ─────────────────────────────
 * SplitText({ autoSplit: true }) handles this internally in GSAP 3.13+, but it
 * only re-splits when the *element* resizes. It cannot know that the tween that
 * was mid-flight belongs to a trigger whose start position just moved, so the
 * ScrollTrigger is rebuilt alongside via onSplit's returned timeline — that
 * return value is what GSAP kills on the next split.
 *
 * @param {object}  opts
 * @param {"words"|"lines"} opts.type   Granularity. Lines for body copy,
 *                                      words for display headings.
 * @param {number}  opts.stagger
 * @param {number}  opts.y              Travel distance in em.
 * @param {string}  opts.start          ScrollTrigger start.
 * @param {boolean} opts.immediate      Skip the trigger and play on mount
 *                                      (hero, which is above the fold).
 * @param {number}  opts.delay
 * @returns {import("react").RefObject} Attach to the element holding the text.
 */
export default function useSplitReveal({
    type = "words",
    stagger = 0.055,
    y = 0.55,
    start = "top 82%",
    immediate = false,
    delay = 0,
} = {}) {
    const ref = useRef(null);

    useGSAP(
        (context, contextSafe) => {
            const el = ref.current;
            if (!el) return;

            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            // Reduced motion: the text is already in the DOM and already correct.
            // Splitting it anyway would fragment it for screen readers for no
            // visual payoff, so bail before SplitText touches anything.
            if (reduced) return;

            /* Hide synchronously. useGSAP runs in useLayoutEffect, so this lands
               before the browser paints — no flash. It is deliberately done in JS
               rather than as an `opacity-0` class in the markup: if the bundle
               never executes, the heading is simply visible, which is the correct
               no-JS outcome. A CSS class would leave it invisible forever. */
            gsap.set(el, { autoAlpha: 0 });

            let split;
            let cancelled = false;

            /* contextSafe is load-bearing, not decoration. The split is deferred
               behind document.fonts.ready, so it resolves *after* useGSAP's
               synchronous context-recording window has closed. A plain closure
               here creates a SplitText and a ScrollTrigger that the context never
               learns about, and neither is collected on route change — the
               "triggers fire on the wrong page" leak. */
            const run = contextSafe(() => {
                if (cancelled || !ref.current) return;

                gsap.set(el, { autoAlpha: 1 });
                el.classList.add("js-split");

                split = SplitText.create(el, {
                    type: type === "lines" ? "lines" : "words,lines",
                    // mask:"lines" wraps each line in an overflow-hidden div. Without
                    // it a y-translate shears descenders against the line above.
                    mask: "lines",
                    linesClass: "split-line",
                    wordsClass: "split-word",
                    autoSplit: true,
                    // Returned timeline becomes the split's owned animation: GSAP
                    // kills and rebuilds it on every re-split, which is what keeps a
                    // resize mid-reveal from stranding half the words invisible.
                    onSplit(self) {
                        const targets = type === "lines" ? self.lines : self.words;

                        const tween = gsap.fromTo(
                            targets,
                            {
                                yPercent: y * 100,
                                clipPath: "inset(0% 0% 110% 0%)",
                            },
                            {
                                yPercent: 0,
                                clipPath: "inset(-25% -10% -25% 0%)",
                                duration: 1,
                                ease: "power4.out",
                                stagger,
                                delay,
                                // The clip is only needed while it moves. Left on, it
                                // creates a permanent containing block that clips
                                // italic overhang and focus rings.
                                onComplete: () => gsap.set(targets, { clipPath: "none" }),
                                ...(immediate
                                    ? {}
                                    : {
                                          scrollTrigger: {
                                              trigger: el,
                                              start,
                                              once: true,
                                          },
                                      }),
                            },
                        );

                        return tween;
                    },
                });

                /* Split freezes line boxes, so everything below shifts when the
                   wrappers are inserted and every trigger under this heading
                   needs re-measuring. Debounced deliberately: all seven headings
                   on the homepage resolve in the same tick when the webfont
                   lands, and calling refresh() directly here meant seven full
                   document re-measures back to back. That burst was the hitch
                   about a second after first paint. */
                refreshScroll();
            });

            // General Sans arrives from the Fontshare CDN after first paint.
            if (!document.fonts || document.fonts.status === "loaded") run();
            else document.fonts.ready.then(run);

            return () => {
                cancelled = true;
                split?.revert();
                el?.classList.remove("js-split");
            };
        },
        { scope: ref },
    );

    return ref;
}
