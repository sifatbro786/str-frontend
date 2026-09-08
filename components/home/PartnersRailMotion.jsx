"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Velocity-aware motion layer for the partners rail.
 *
 * Split from PartnersBand for the same reason MarqueeMotion is split from
 * Marquee: the band renders on /about too, and reaching this through
 * next/dynamic is what keeps the GSAP chunk off a route that opted out. The
 * shell below it is complete, styled markup on its own — every hover effect in
 * the band is CSS, so a visitor who never loads this file still gets the reveal,
 * the glow and the badge. All this module adds is the rail's *pulse*.
 *
 * ── WHY NOT THE SHARED <Marquee> ─────────────────────────────────────────
 * MarqueeMotion runs one constant tween with a binary hover slow-down, and
 * TechMarquee depends on exactly that feel. What is wanted here is a rail whose
 * speed is a function of how fast the *visitor* is moving — a different
 * behaviour, not a parameter of the same one. Forking beats adding four props to
 * a component two other sections share.
 *
 * ── THE SPEED MODEL ──────────────────────────────────────────────────────
 * One scalar, `timeScale`, driven by three multiplied inputs and then lerped:
 *
 *   direction · hover · (1 + boost)
 *
 *   direction  ±1. Scrolling up past a deadzone flips the rail to run backwards
 *              and it stays there until the next downward scroll. The flip
 *              travels through zero on the lerp, so it reads as the band
 *              changing its mind rather than as a jump cut.
 *   hover      1 → 0.42 inside the band → 0.06 over a logo. Never 0: a rail that
 *              hard-stops reads as broken, and 0.06 is slow enough to read a
 *              wordmark off while staying visibly alive.
 *   boost      scroll velocity + pointer velocity, each normalised against a
 *              reference speed and summed, clamped. Multiplying rather than
 *              adding is what keeps hover authoritative — flicking the cursor
 *              across a logo you are parked on cannot yank the rail away.
 *
 * ── WHY ScrollTrigger AND NOT Observer ───────────────────────────────────
 * Observer is the obvious reach for input velocity, but neither channel wants it
 * here. Scroll: this site runs ScrollSmoother, so raw wheel deltas lead the
 * rendered page by the smoother's whole ease — ScrollTrigger.getVelocity()
 * reports the position the visitor actually *sees* moving. Pointer: Observer's
 * "pointer" type tracks drags (press + move), not hover travel, which is the
 * only pointer motion this band ever gets. So the scroll channel uses the
 * smoothed source of truth and the pointer channel is eight lines of lerped
 * velocity, which is the other half of the brief.
 *
 * ── THE ONE THING THAT SILENTLY BREAKS THIS ──────────────────────────────
 * A `repeat: -1` tween can run forward forever but backwards only as far as
 * totalTime 0, where it silently stalls — so the first scroll-up would freeze
 * the rail. The tween is seeded HEADROOM loops in and topped back up when it
 * runs low. Both jumps are whole multiples of the duration, so progress (and
 * therefore xPercent) is untouched.
 */

/* ── Tuning. Every number a designer would argue about, in one place. ───── */
const HOVER_BAND = 0.42; // cursor anywhere in the rail
const HOVER_LOGO = 0.06; // cursor on a logo — parked, but still alive
const SCROLL_REF = 1600; // px/sec of scroll worth one extra rail speed
const POINTER_REF = 2600; // px/sec of pointer travel, same idea
const BOOST_MAX = 2.4; // ceiling on the two channels combined
const FLIP_AT = 90; // px/sec deadzone before scroll direction flips the rail
const APPROACH = 0.075; // per-frame lerp, normalised to 60fps below
const POINTER_SMOOTH = 0.14; // how fast the pointer channel tracks its own velocity
const HEADROOM = 200; // loops of backwards runway seeded into the tween

export default function PartnersRailMotion({ speed = 45 }) {
    const marker = useRef(null);

    useGSAP(
        () => {
            // Rendered as the rail's LAST child, so parentElement is the clipping root.
            const root = marker.current?.parentElement;
            const track = root?.querySelector("[data-track]");
            if (!root || !track) return;

            const mm = gsap.matchMedia();

            mm.add("(prefers-reduced-motion: no-preference)", () => {
                // The track holds two copies, so -50% and 0% are visually identical and
                // wrapping between them is invisible. Wrapping beats repeat:-1 alone —
                // it removes the one-frame stutter at the loop boundary.
                const wrap = gsap.utils.wrap(-50, 0);
                const tween = gsap.to(track, {
                    xPercent: -50,
                    ease: "none",
                    duration: speed,
                    repeat: -1,
                    // MUST return a bare number. xPercent is a unitless transform
                    // component — the % is implied — so returning "-12.5%" makes the
                    // transform setter reject the value and write NOTHING, silently, for
                    // the life of the tween. No console warning, no thrown error: the
                    // rail simply never moves. Verified against gsap 3.15 headlessly.
                    modifiers: { xPercent: (x) => wrap(parseFloat(x)) },
                });
                tween.totalTime(speed * HEADROOM);

                const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

                let hover = 1;
                let direction = 1;
                let current = 1;
                let pointerDelta = 0; // px travelled since the last frame
                let pointerSpeed = 0; // smoothed px/sec
                let lastX = null;
                let visible = true;

                /* ── Scroll channel ──────────────────────────────────────────────
           The trigger exists to be measured and to gate the ticker; it drives
           nothing itself. Off-screen the whole rail stops costing frames. */
                const st = ScrollTrigger.create({
                    trigger: root,
                    start: "top bottom",
                    end: "bottom top",
                    onToggle: (self) => {
                        visible = self.isActive;
                        if (visible) tween.resume();
                        else tween.pause();
                    },
                });
                visible = st.isActive;

                /* ── Pointer channel ─────────────────────────────────────────────
           Records only. Velocity is differentiated once per frame in the ticker,
           so a 1000Hz mouse costs exactly what a 125Hz one does. */
                const onPointerMove = (e) => {
                    if (lastX !== null) pointerDelta += Math.abs(e.clientX - lastX);
                    lastX = e.clientX;
                };

                const onPointerOver = (e) => {
                    hover = e.target.closest?.("[data-logo]") ? HOVER_LOGO : HOVER_BAND;
                };

                const onPointerLeave = () => {
                    hover = 1;
                    lastX = null;
                };

                if (fine) {
                    root.addEventListener("pointermove", onPointerMove, { passive: true });
                    root.addEventListener("pointerover", onPointerOver);
                    root.addEventListener("pointerleave", onPointerLeave);
                    root.addEventListener("pointercancel", onPointerLeave);
                }

                /* ── One clock ───────────────────────────────────────────────────
           gsap.ticker rather than a private rAF, so the rail advances on the
           same frame boundary as the cursor, the hero mesh and every tween. */
                const tick = (time, deltaTime) => {
                    if (!visible) return;

                    const ms = Math.min(deltaTime, 50);
                    const frames = ms / 16.6667;

                    // Exponential forms, not `v * 0.9` — a constant per-frame factor
                    // converges twice as fast on a 120Hz panel as on a 60Hz one, which is
                    // how the same code ends up feeling snappy on a laptop and sluggish on
                    // an external monitor.
                    const k = 1 - Math.pow(1 - APPROACH, frames);

                    // Differentiate the pointer once per frame, THEN smooth. Accumulating
                    // raw deltas and decaying the total instead is the tempting one-liner
                    // and it is wrong: the accumulator settles at delta/(1 - decay), so it
                    // reports ~10x the real speed and pins the boost at its ceiling on the
                    // smallest nudge. `instant` falls to 0 the moment the pointer stops,
                    // so this decays on its own with no separate falloff constant.
                    const instant = (pointerDelta / ms) * 1000;
                    pointerDelta = 0;
                    pointerSpeed +=
                        (instant - pointerSpeed) * (1 - Math.pow(1 - POINTER_SMOOTH, frames));

                    const scrollV = st.getVelocity();
                    if (scrollV > FLIP_AT) direction = 1;
                    else if (scrollV < -FLIP_AT) direction = -1;

                    const boost = gsap.utils.clamp(
                        0,
                        BOOST_MAX,
                        Math.abs(scrollV) / SCROLL_REF + pointerSpeed / POINTER_REF,
                    );

                    const target = direction * hover * (1 + boost);
                    current += (target - current) * k;
                    tween.timeScale(current);

                    // Top the backwards runway back up long before it runs out. A whole
                    // number of loops, so nothing moves.
                    if (tween.totalTime() < speed * 4) {
                        tween.totalTime(tween.totalTime() + speed * HEADROOM);
                    }
                };

                gsap.ticker.add(tick);

                return () => {
                    gsap.ticker.remove(tick);
                    root.removeEventListener("pointermove", onPointerMove);
                    root.removeEventListener("pointerover", onPointerOver);
                    root.removeEventListener("pointerleave", onPointerLeave);
                    root.removeEventListener("pointercancel", onPointerLeave);
                    st.kill();
                    tween.kill();
                };
            });

            return () => mm.revert();
        },
        { dependencies: [speed] },
    );

    return <span ref={marker} aria-hidden="true" className="hidden" />;
}
