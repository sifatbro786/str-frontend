"use client";

import { ScrollTrigger } from "@/lib/gsap";

/**
 * One debounced ScrollTrigger.refresh() for the whole app.
 *
 * ── THE PROBLEM THIS SOLVES ──────────────────────────────────────────────
 * ScrollTrigger.refresh() is not cheap. It invalidates and re-measures EVERY
 * trigger on the page, which means a full style-and-layout pass over the whole
 * document, and under ScrollSmoother it also re-syncs the smoother's height.
 * On this homepage that is one pass over seven sections, a world map and a
 * couple of hundred nodes.
 *
 * That is fine once. What was happening instead:
 *
 *   · useSplitReveal called it after every heading finished splitting. Seven
 *     headings, and they all resolve in the same tick when the webfont lands,
 *     so the font swap cost seven full re-measures back to back. That is the
 *     visible hitch a second or so after first paint.
 *   · Both accordions called it in the onComplete of every open and close
 *     tween, so clicking through the service list fired one per click, each
 *     landing on the frame right after a layout-property animation had just
 *     finished dirtying the layout.
 *
 * Coalescing them into a single trailing call turns "seven re-measures" into
 * one and costs nothing in accuracy, because every one of those callers wanted
 * the same thing: a refresh once the DOM has settled.
 *
 * ── WHY A TRAILING TIMEOUT AND NOT JUST rAF ──────────────────────────────
 * rAF alone fires on the next frame, which is still inside the burst. The
 * accordion's height tween runs for 550ms; a refresh scheduled on the frame
 * after the click re-measures a panel that is 5% open and bakes that in. The
 * timeout waits for the burst to end, and the rAF then guarantees the call
 * lands after the browser has laid out whatever arrived last.
 *
 * ── WHY IT IS NOT A HOOK ─────────────────────────────────────────────────
 * The debounce state has to be shared across unrelated components. A hook
 * would give each caller its own timer, which is the bug, not the fix.
 */

const QUIET_MS = 180;

let timer = 0;
let frame = 0;

export function refreshScroll() {
    if (typeof window === "undefined") return;

    clearTimeout(timer);
    cancelAnimationFrame(frame);

    timer = setTimeout(() => {
        frame = requestAnimationFrame(() => {
            ScrollTrigger.refresh();
        });
    }, QUIET_MS);
}

/** For unmount paths that must not leave a refresh queued against a dead tree. */
export function cancelScrollRefresh() {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
}
