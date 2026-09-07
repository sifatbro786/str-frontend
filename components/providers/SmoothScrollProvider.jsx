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
      const isTouch = window.matchMedia("(hover: none)").matches;

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
            /* Back up to 1.15 after a detour through 0.7.

               The 0.7 pass was solving the wrong problem. The page did not feel
               rough because the glide was too long; it felt rough because
               ScrollTrigger.refresh() was firing seven times on the font swap
               and once per accordion click, and each of those is a full
               document re-measure that lands as a dropped frame mid-scroll.
               Shortening the glide only made the stutter easier to see.

               With lib/scrollRefresh coalescing those, the glide is what
               carries the feel: a light flick keeps travelling for roughly a
               second and settles. Above ~1.3 it stops reading as momentum and
               starts reading as lag, because the content is still moving long
               after the user has decided they are done. */
            smooth: 1.15,
            // 0.1s on touch — enough to take the edge off an abrupt finger-lift
            // stop without replacing the platform's momentum curve. Above ~0.2
            // a flick starts to feel steered rather than thrown.
            smoothTouch: 0.1,
            effects: true, // enables data-speed / data-lag attributes
            // Desktop only, and gated separately from smoothTouch on purpose.
            // normalizeScroll hands scrolling to JS entirely, which is what
            // stops the iOS Safari URL bar collapsing — that is a
            // normalizeScroll problem, not a smoothTouch one.
            normalizeScroll: !isTouch,
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
    { dependencies: [pathname], revertOnUpdate: true }
  );

  return (
    <div id="smooth-wrapper" ref={wrapper}>
      <div id="smooth-content" ref={content}>
        {children}
      </div>
    </div>
  );
}
