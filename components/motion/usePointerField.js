"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * One pointer listener, many consumers.
 *
 * The hero has four things that want the cursor every frame — the canvas mesh,
 * the floating metric cards, the card tilt, and the magnets. Four independent
 * `pointermove` handlers means four `getBoundingClientRect()` calls per frame,
 * four closures, and four slightly different smoothing constants that drift
 * apart the first time someone tunes one of them. This is the shared source:
 * one listener, one rect read, one lerp, and a subscriber set.
 *
 * ── FRAME-RATE INDEPENDENT SMOOTHING ─────────────────────────────────────
 * `x += (target - x) * 0.09` is the smoothing everyone writes, and it is wrong
 * on anything but a 60Hz display: on a 120Hz panel it runs twice per 16ms and
 * converges twice as fast, so the same code feels snappy on a MacBook and
 * sluggish on an external 60Hz monitor. The exponential form below converges at
 * the same *wall-clock* rate regardless of refresh rate, which is what "zero
 * lag at 120Hz" actually requires.
 *
 * ── WHAT SUBSCRIBERS GET ─────────────────────────────────────────────────
 *   x, y      smoothed position, normalised 0..1 within the scope
 *   tx, ty    the unsmoothed target, same units
 *   cx, cy    raw client px — for anything that must not lag (hit tests, tilt)
 *   w,h,left,top   scope box as of the last move
 *   active    pointer is currently inside the scope
 *   moved     the pointer moved since the previous frame. Guard quickTo calls
 *             with this: quickTo restarts its tween on every call, so calling
 *             it every frame with an unchanged value pins the tween at t=0 and
 *             the animation silently never plays.
 *   dt        second argument, delta normalised to 60fps units
 */
export function usePointerField(scope, { lerp = 0.09, restX = 0.5, restY = 0.4 } = {}) {
    const ref = useRef(null);

    // Lazy init in render so the object exists before child effects run — child
    // components subscribe in their own useGSAP, which fires before the parent's.
    if (ref.current === null) {
        ref.current = {
            tx: restX,
            ty: restY,
            x: restX,
            y: restY,
            cx: 0,
            cy: 0,
            w: 1,
            h: 1,
            left: 0,
            top: 0,
            active: false,
            moved: false,
            fine: true,
            subs: new Set(),
        };
    }

    useGSAP(
        () => {
            const el = scope.current;
            if (!el) return;

            const f = ref.current;
            f.fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

            const onMove = (e) => {
                // The only layout read in the system, taken in the pointer handler
                // where the browser has already flushed style for hit-testing.
                // ScrollSmoother translates this subtree, so the rect cannot be cached.
                const r = el.getBoundingClientRect();
                f.left = r.left;
                f.top = r.top;
                f.w = r.width || 1;
                f.h = r.height || 1;
                f.cx = e.clientX;
                f.cy = e.clientY;
                f.tx = gsap.utils.clamp(0, 1, (e.clientX - r.left) / f.w);
                f.ty = gsap.utils.clamp(0, 1, (e.clientY - r.top) / f.h);
                f.active = true;
                f.moved = true;
            };

            const onLeave = () => {
                f.active = false;
                f.moved = true;
                // Drift back to the resting composition rather than freezing wherever
                // the cursor happened to exit.
                f.tx = restX;
                f.ty = restY;
            };

            const tick = (time, deltaTime) => {
                const ms = Math.min(deltaTime, 50);
                const k = 1 - Math.pow(1 - lerp, ms / 16.6667);
                f.x += (f.tx - f.x) * k;
                f.y += (f.ty - f.y) * k;

                const dt = Math.min(deltaTime, 33.4) / 16.6667;
                f.subs.forEach((fn) => fn(f, dt));
                f.moved = false;
            };

            el.addEventListener("pointermove", onMove, { passive: true });
            el.addEventListener("pointerleave", onLeave);
            // gsap.ticker, not a private rAF: one clock for the whole page means the
            // mesh, the cards and every tween advance on the same frame boundary.
            gsap.ticker.add(tick);

            return () => {
                el.removeEventListener("pointermove", onMove);
                el.removeEventListener("pointerleave", onLeave);
                gsap.ticker.remove(tick);
            };
        },
        { scope, dependencies: [] },
    );

    return ref;
}

export default usePointerField;
