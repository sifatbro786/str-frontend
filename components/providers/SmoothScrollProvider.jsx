"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger, ScrollSmoother } from "@/lib/gsap";

/**
 * ScrollSmoother wrapper for the public site.
 *
 * DOM contract (non-negotiable, ScrollSmoother queries these ids):
 *   #smooth-wrapper > #smooth-content > ...page
 *
 * WHAT MUST STAY OUTSIDE THIS COMPONENT:
 *   #smooth-content carries a CSS transform, and a transformed ancestor becomes
 *   the containing block for position:fixed descendants. The Navbar (fixed,
 *   z-50), its mobile overlay, the skip link and the custom cursor therefore
 *   live in the layout OUTSIDE this wrapper. Put the Navbar inside and it will
 *   scroll away with the page — the single most common ScrollSmoother bug.
 *
 * ── WHY THE DEFERRED BOOT ────────────────────────────────────────────────
 * ScrollSmoother.create() measures the content height once, and every
 * ScrollTrigger created against it inherits that measurement. On an App Router
 * navigation React commits the new tree before the browser has laid it out, so
 * creating the smoother synchronously in the effect measures a page that is one
 * frame away from its real height. Every trigger position is then wrong by
 * whatever the images and late components add — the "everything fires 200px
 * early" class of bug.
 *
 * Two rAFs: the first callback runs before the paint of the committed tree, the
 * second after the browser has laid it out. That is the earliest frame at which
 * a measurement is real.
 *
 * ── WHY REFRESH IS AN OBSERVER, NOT A TIMEOUT ────────────────────────────
 * fonts.ready and image load events cover the *known* late arrivals. A
 * ResizeObserver on the content covers the unknown ones — lazily hydrated
 * sections, a filtered list changing length, an embed resolving. setTimeout
 * guesses; the observer knows.
 */
export default function SmoothScrollProvider({ children }) {
    const pathname = usePathname();
    const wrapper = useRef(null);
    const content = useRef(null);

    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            // No longer used to gate normalizeScroll (see below); kept because the
            // reduced-motion bail and smoothTouch both still describe touch devices
            // and the next person reading this will look for it.
            void window.matchMedia("(hover: none)").matches;

            let smoother = null;
            let disposed = false;
            let bootRaf = 0;
            let refreshRaf = 0;
            const teardown = [];

            /* Coalesce refreshes to one per frame. Fonts landing, three images
         decoding and a ResizeObserver entry can all arrive in the same tick;
         ScrollTrigger.refresh() re-measures every trigger on the page, and
         running it four times costs four full layouts for one result. */
            const refresh = () => {
                if (disposed) return;
                cancelAnimationFrame(refreshRaf);
                refreshRaf = requestAnimationFrame(() => {
                    if (!disposed) ScrollTrigger.refresh();
                });
            };

            const watchLateLayout = () => {
                const el = content.current;
                if (!el) return;

                // 1 · Fonts. General Sans arrives from the Fontshare CDN after first
                //     paint, and every measured trigger shifts when it swaps in.
                document.fonts?.ready.then(refresh);

                // 2 · Images. next/image reserves the box via width/height, so this is
                //     the belt-and-braces pass for anything unsized: SVG sprites, the
                //     payment strip at its intrinsic ratio, CMS-authored blog bodies.
                Array.from(el.querySelectorAll("img"))
                    .filter((img) => !img.complete)
                    .forEach((img) => {
                        const done = () => refresh();
                        img.addEventListener("load", done, { once: true });
                        img.addEventListener("error", done, { once: true });
                        teardown.push(() => {
                            img.removeEventListener("load", done);
                            img.removeEventListener("error", done);
                        });
                    });

                // 3 · Everything else. The height guard is load-bearing: refresh()
                //     adjusts pin-spacers, which resizes the content, which fires this
                //     observer again — an unbounded refresh loop without it.
                let lastH = el.offsetHeight;
                const ro = new ResizeObserver(() => {
                    const h = el.offsetHeight;
                    if (Math.abs(h - lastH) < 2) return;
                    lastH = h;
                    refresh();
                });
                ro.observe(el);
                teardown.push(() => ro.disconnect());
            };

            const boot = () => {
                if (disposed || !wrapper.current) return;

                if (!reduced) {
                    smoother = ScrollSmoother.create({
                        wrapper: wrapper.current,
                        content: content.current,
                        /* 1.0. Two rounds of tuning this number did not fix the feel,
               because the number was never the problem — see normalizeScroll
               below, which was. 1.0 is a clean second of travel after a flick. */
                        smooth: 1,
                        // 0.1s on touch — enough to take the edge off an abrupt finger-lift
                        // stop without replacing the platform's momentum curve. Above ~0.2
                        // a flick starts to feel steered rather than thrown.
                        smoothTouch: 0.1,

                        /* ── effects: false ──────────────────────────────────────────
               This enables the data-speed / data-lag attributes, which means
               the smoother walks the DOM on every refresh looking for them and
               maintains a per-element effect list on every frame. Nothing on
               this site uses either attribute any more — the footer's
               data-speed was removed when FooterReveal was rewritten, and
               AboutStatement's parallax runs on its own scrubbed trigger
               precisely to avoid this system. Paying for a feature with zero
               consumers on every frame of every scroll. */
                        effects: false,

                        /* ── normalizeScroll: false — THIS IS THE SCROLL FIX ─────────
               normalizeScroll takes scrolling away from the browser entirely:
               it preventDefaults the wheel event and drives position from JS.
               Its actual purpose is narrow — stopping the iOS Safari address
               bar collapsing and expanding mid-scroll — and it was enabled
               here for DESKTOP, where that problem does not exist.

               What it costs on desktop is the feel itself. A Windows mouse
               wheel emits discrete notches with platform-level acceleration
               applied; normalizeScroll throws that curve away and substitutes
               its own, so every notch lands as the same fixed step no matter
               how fast you spin. That is the "not smooth" — it is not jank,
               it is the wheel losing its acceleration. It also forces a
               non-passive wheel listener on the document, which blocks the
               compositor from scrolling ahead of the main thread.

               Off, the browser handles the wheel natively and the smoother
               only eases the position it reports. That is the combination
               every smooth-scroll site people admire is actually running. */
                        normalizeScroll: false,
                        ignoreMobileResize: true,
                    });

                    // App Router restores scroll position before this runs. Without the
                    // reset the smoother boots believing it is at 0 while the window is
                    // at 3000, and the content snaps on the first wheel event. Hash
                    // deep-links are left alone so #anchor navigation still lands.
                    if (!window.location.hash) smoother.scrollTop(0);
                }

                ScrollTrigger.refresh();
                watchLateLayout();
            };

            bootRaf = requestAnimationFrame(() => {
                bootRaf = requestAnimationFrame(boot);
            });

            return () => {
                disposed = true;
                cancelAnimationFrame(bootRaf);
                cancelAnimationFrame(refreshRaf);
                teardown.forEach((fn) => fn());
                smoother?.kill();

                /* Targeted orphan sweep. ScrollTrigger.getAll().forEach(kill) is the
           usual advice and it is wrong here — it would also kill triggers
           belonging to components that survive navigation (the fixed Navbar
           lives outside this wrapper). Only triggers whose element has left the
           document are unreachable, and those are exactly the leak: a child
           that created a trigger outside a useGSAP context has no cleanup of
           its own, so nothing else will ever collect it. */
                ScrollTrigger.getAll().forEach((t) => {
                    const el = t.trigger || t.vars?.trigger;
                    if (el instanceof Element && !el.isConnected) t.kill(true);
                });

                // Drop remembered scroll positions so the next route starts at 0
                // rather than inheriting this one's.
                ScrollTrigger.clearScrollMemory("manual");
            };
        },
        { dependencies: [pathname], revertOnUpdate: true },
    );

    return (
        <div id="smooth-wrapper" ref={wrapper}>
            <div id="smooth-content" ref={content}>
                {children}
            </div>
        </div>
    );
}
