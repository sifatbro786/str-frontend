"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Drag to compare, in this site's language rather than the v1 one.
 *
 * ── WHAT CHANGED FROM THE v1 PORTFOLIO DECK ──────────────────────────────
 * The interaction is the same and everything around it is not. v1 drew the
 * frame as a photograph on a cream paper mat, rotated a degree, with a 60px
 * black drop shadow and an amber handle glowing over it. That reads as a print
 * artefact, which is what that page wanted. On a warm stock canvas built out of
 * hairlines it reads as a sticker pasted onto the page. This is the same frame
 * as a portfolio card: one hairline border, the raised surface behind it, the
 * handle in brand blue, and the two state labels as the same chips the cards
 * use for their stack.
 *
 * ── WHY POINTER CAPTURE AND NOT A RANGE INPUT ────────────────────────────
 * A visually hidden <input type="range"> laid over the frame is the usual
 * accessible shortcut and it is wrong by a thumb width at both ends: the
 * browser maps the pointer across the track MINUS the thumb, so dragging to
 * the far left leaves a sliver of the after image showing and no amount of CSS
 * on an opacity-0 control makes that exact. Pointer capture measures the frame
 * itself, so 0 is 0. The keyboard and screen reader affordances the range
 * would have given for free are spelled out below instead, which is a dozen
 * lines and no compromise on the geometry.
 *
 * ── WHY THE POSITION IS A CSS VARIABLE AND NOT REACT STATE ───────────────
 * A pointermove fires on every frame of the drag. Held in state, each one is a
 * React render of two next/image trees; written to a custom property on the
 * root, each one is a style recalculation on two elements and nothing else.
 * The clip and the handle both read --cmp, so one write moves both.
 *
 * ── WHY BEFORE IS ON THE LEFT ────────────────────────────────────────────
 * v1 revealed the AFTER image from the left, so the slider ran finished to raw
 * as you read across. Reversed here: the base layer is the delivered file and
 * the clipped layer on top is the original, so dragging left to right runs the
 * way the pipeline does and the way the labels are read.
 *
 * @param {string} before      Path in /public. The original photograph.
 * @param {string} after       Path in /public. The delivered file.
 * @param {string} beforeLabel Chip on the left, e.g. "Raw"
 * @param {string} afterLabel  Chip on the right, e.g. "Pathed"
 * @param {string} alt         Subject of the pair. Both alts are built from it.
 * @param {string} caption     Figure reference printed under the frame.
 * @param {string} aspect      Tailwind aspect utility for the frame.
 * @param {string} sizes       next/image sizes. Required: every frame is `fill`.
 * @param {boolean} priority   True on the one frame above the fold.
 */

/* Percentage points per key press. 4 is roughly forty presses end to end,
   which is fine granularity without making the keyboard path unusable. */
const KEY_STEP = {
    ArrowLeft: -4,
    ArrowDown: -4,
    ArrowRight: 4,
    ArrowUp: 4,
    PageDown: -20,
    PageUp: 20,
};

function Handle() {
    return (
        <span
            aria-hidden="true"
            style={{ left: "var(--cmp)" }}
            className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-brand"
        >
            <span className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1 rounded-full border border-(--line) bg-(--canvas) shadow-[0_6px_18px_-8px_rgb(0_0_0/0.45)]">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-brand"
                >
                    <path d="M6.5 4 3 8l3.5 4M9.5 4 13 8l-3.5 4" />
                </svg>
            </span>
        </span>
    );
}

export default function CompareFrame({
    before,
    after,
    beforeLabel = "Before",
    afterLabel = "After",
    alt,
    caption,
    aspect = "aspect-4/3",
    sizes = "(max-width: 1024px) 100vw, 55vw",
    priority = false,
    className,
}) {
    const root = useRef(null);
    /* The live value. A ref rather than state for the reason in the header —
       nothing in the render tree reads it, the DOM does. */
    const value = useRef(50);

    const paint = useCallback((next) => {
        const el = root.current;
        if (!el) return;
        const v = Math.max(0, Math.min(100, next));
        value.current = v;
        el.style.setProperty("--cmp", `${v}%`);
        /* Kept in step by hand because the node is not re-rendered. Without
           this a screen reader announces 50 for the life of the page. */
        el.setAttribute("aria-valuenow", String(Math.round(v)));
    }, []);

    const fromPointer = useCallback(
        (clientX) => {
            const el = root.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            if (!rect.width) return;
            paint(((clientX - rect.left) / rect.width) * 100);
        },
        [paint],
    );

    const onPointerDown = (e) => {
        // Primary button only. A right click belongs to the context menu, and
        // a middle click to whatever the browser does with it.
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        fromPointer(e.clientX);
    };

    /* Capture is what makes the drag survive leaving the frame: without it the
       pointer crossing the border ends the gesture, and a slider you cannot
       overshoot feels broken rather than precise. It also means no listeners
       on window, so nothing outlives this component. */
    const onPointerMove = (e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        fromPointer(e.clientX);
    };

    const onPointerUp = (e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    const onKeyDown = (e) => {
        if (e.key === "Home" || e.key === "End") {
            e.preventDefault();
            paint(e.key === "Home" ? 0 : 100);
            return;
        }
        const step = KEY_STEP[e.key];
        if (step === undefined) return;
        // Otherwise the arrow keys scroll the page out from under the frame.
        e.preventDefault();
        paint(value.current + step);
    };

    return (
        <figure className={className}>
            <div
                ref={root}
                role="slider"
                tabIndex={0}
                aria-label={`Compare the original and the edited version of ${alt}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={50}
                aria-valuetext={`${afterLabel} revealed`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown}
                style={{
                    "--cmp": "50%",
                    /* pan-y, not none: a horizontal drag is ours, a vertical one
                       is still the page scrolling. `none` here is why sliders
                       like this trap the reader on a phone. */
                    touchAction: "pan-y",
                }}
                className={cn(
                    "group/cmp relative w-full cursor-ew-resize overflow-hidden rounded-2xl border border-(--line) bg-(--raised) select-none",
                    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-hi",
                    aspect,
                )}
            >
                {/* Base layer: the delivered file. */}
                <Image
                    src={after}
                    alt={`${alt}, after editing`}
                    fill
                    sizes={sizes}
                    priority={priority}
                    draggable={false}
                    className="object-cover"
                />

                {/* Clipped layer: the original, revealed from the left edge. */}
                <div
                    className="absolute inset-0"
                    style={{ clipPath: "inset(0 calc(100% - var(--cmp)) 0 0)" }}
                >
                    <Image
                        src={before}
                        alt={`${alt}, before editing`}
                        fill
                        sizes={sizes}
                        priority={priority}
                        draggable={false}
                        className="object-cover"
                    />
                </div>

                {/* Chips, not the v1 tags. Same rounded hairline idiom as the
                    stack chips on a portfolio card, so the page teaches one
                    shape for "this is a label" rather than two. */}
                <span className="label-mono absolute top-3 left-3 rounded-full border border-(--line) bg-(--canvas) px-2.5 py-1 text-(--text-mute)">
                    {beforeLabel}
                </span>
                <span className="label-mono absolute top-3 right-3 rounded-full border border-(--line) bg-(--canvas) px-2.5 py-1 text-(--text)">
                    {afterLabel}
                </span>

                <Handle />
            </div>

            {caption && (
                <figcaption className="label-mono mt-3 text-(--text-mute)">{caption}</figcaption>
            )}
        </figure>
    );
}
