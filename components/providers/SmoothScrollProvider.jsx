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
 * Native scrolling still drives everything (the body keeps its real height and
 * ScrollSmoother translates the content), so Navbar's existing window.scrollY
 * listener keeps working untouched.
 *
 * Rebuilt per route: `dependencies: [pathname]` + `revertOnUpdate` tears the
 * smoother and every ScrollTrigger down on navigation. Without it, triggers
 * from the previous route survive against detached DOM nodes.
 */
export default function SmoothScrollProvider({ children }) {
  const pathname = usePathname();
  const wrapper = useRef(null);
  const content = useRef(null);

  useGSAP(
    () => {
      // Touch devices: native momentum scrolling beats anything we can
      // synthesise, and normalizeScroll on iOS fights the URL bar. Bail out and
      // let ScrollTrigger run against the native scroller.
      const isTouch = window.matchMedia("(hover: none)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (isTouch || reduced) {
        ScrollTrigger.refresh();
        return;
      }

      const smoother = ScrollSmoother.create({
        wrapper: wrapper.current,
        content: content.current,
        // 1.2 is the ceiling before the page feels detached from the wheel.
        // Anything at 2+ reads as "portfolio site" rather than "studio site".
        smooth: 1.2,
        effects: true, // enables data-speed / data-lag attributes
        normalizeScroll: true, // consistent wheel deltas across browsers
        ignoreMobileResize: true,
      });

      return () => smoother.kill();
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
