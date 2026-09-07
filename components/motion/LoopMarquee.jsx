"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, Observer } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * Seamless horizontal marquee.
 *
 * ── WHY NOT A CSS @keyframes TRANSLATE ───────────────────────────────────
 * Three reasons, in order of how much they bite:
 *   1. The loop distance has to equal the rendered width of one copy. In CSS
 *      that is `translateX(-50%)`, which is only seamless if both copies are
 *      exactly half the track — true until the webfont swaps and every label
 *      reflows. Measuring in JS after fonts.ready is the only correct version.
 *   2. A CSS animation cannot be scrubbed by scroll direction, which is where
 *      the whole "this is alive" read comes from.
 *   3. It cannot be paused when off-screen, and an always-running compositor
 *      animation on a 2000px layer costs battery for pixels nobody sees.
 *
 * ── WHY xPercent AND NOT x ───────────────────────────────────────────────
 * The wrap is expressed as a percentage of the track's own width, so it stays
 * correct across the font swap and every breakpoint without re-measuring the
 * pixel distance. modifiers wraps the value each frame instead of restarting a
 * tween, so there is no seam frame at the loop point.
 *
 * @param {Array}    items
 * @param {Function} renderItem  (item, index) => node
 * @param {number}   speed       Seconds for one full copy to pass. Higher = slower.
 * @param {1|-1}     direction   1 travels left, -1 travels right.
 * @param {boolean}  reactive    Scroll velocity nudges speed and direction.
 */
export default function LoopMarquee({
    items,
    renderItem,
    speed = 28,
    direction = 1,
    reactive = true,
    className,
    trackClassName,
}) {
    const root = useRef(null);

    useGSAP(
        () => {
            const copies = gsap.utils.toArray("[data-marquee-copy]", root.current);
            if (!copies.length) return;

            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reduced) return;

            /* One tween drives BOTH copies as a single target array. Two tweens —
               one per copy — is the usual first attempt and it desyncs within a
               minute: they are separate ticker callbacks and floating-point drift
               between them opens a visible gap at the seam. */
            const tl = gsap.to(copies, {
                xPercent: direction * -100,
                ease: "none",
                duration: speed,
                repeat: -1,
                modifiers: {
                    xPercent: gsap.utils.unitize(gsap.utils.wrap(-100, 0)),
                },
            });

            const kills = [];

            // Off-screen marquees do not animate. ScrollTrigger already knows the
            // element's visibility; a second IntersectionObserver would be a
            // parallel source of truth for the same fact.
            kills.push(
                ScrollTrigger.create({
                    trigger: root.current,
                    start: "top bottom",
                    end: "bottom top",
                    onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
                }),
            );

            if (reactive) {
                /* Scroll velocity feeds timeScale, and the sign of the velocity
                   flips the direction. Eased through a quickTo rather than
                   assigned per event — a raw assignment makes the rail stutter at
                   exactly the wheel's sample rate.

                   The quickTo drives a PROXY object, not the tween. `timeScale`
                   on a GSAP animation is a method, and pointing a property tween
                   straight at it risks clobbering the function with a number. The
                   proxy costs one object and removes the whole question. */
                const state = { v: 1 };
                const scaleTo = gsap.quickTo(state, "v", {
                    duration: 0.5,
                    ease: "power3.out",
                    onUpdate: () => tl.timeScale(state.v),
                });

                const obs = Observer.create({
                    type: "wheel,touch,scroll",
                    onChangeY: (self) => {
                        const v = gsap.utils.clamp(-4, 4, self.velocityY / 900);
                        scaleTo(v < 0 ? Math.min(-1, v) : Math.max(1, v));
                    },
                    onStopDelay: 0.12,
                    onStop: () => scaleTo(1),
                });
                kills.push(obs);
            }

            return () => {
                kills.forEach((k) => k.kill());
                tl.kill();
            };
        },
        { scope: root },
    );

    // Two copies, the second aria-hidden. A screen reader reading "Design UI/UX
    // Design Fullstack Design UI/UX Design Fullstack" is the standard marquee
    // accessibility failure.
    const copy = (hidden) => (
        <div
            data-marquee-copy=""
            aria-hidden={hidden || undefined}
            className={cn("flex shrink-0 items-center will-change-transform", trackClassName)}
        >
            {items.map((item, i) => renderItem(item, i))}
        </div>
    );

    return (
        <div ref={root} className={cn("flex w-full overflow-hidden", className)}>
            {copy(false)}
            {copy(true)}
        </div>
    );
}
