"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Motion layer for Marquee, split out so the shell can stay a server component.
 *
 * Marquee is shared with /about, which is not a Phase 5 route. Keeping the tween
 * in its own client module lets Marquee reach it through next/dynamic, so a
 * route that renders a static rail never loads the GSAP chunk at all.
 *
 * The track is rendered twice by the shell and translated to exactly -50%, so
 * the reset is invisible. `modifiers` wraps the value rather than restarting the
 * tween, which removes the one-frame stutter a plain repeat:-1 shows at the loop
 * boundary.
 *
 * Under reduced motion nothing runs and the rail stays a static, clipped row —
 * an auto-scrolling band is precisely what that preference exists to suppress.
 */
export default function MarqueeMotion({ speed = 40, reverse = false }) {
  const marker = useRef(null);

  useGSAP(
    () => {
      // Rendered as the shell's LAST child, so parentElement is the clipping
      // root and firstElementChild is still the track.
      const root = marker.current?.parentElement;
      if (!root) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const track = root.firstElementChild;
        // Wrap into a single content-width window. -50% and 0% are visually
        // identical here (the track holds two copies), so the wrap is invisible.
        const wrap = gsap.utils.wrap(-50, 0);

        const tween = gsap.to(track, {
          xPercent: reverse ? 50 : -50,
          ease: "none",
          duration: speed,
          repeat: -1,
          modifiers: { xPercent: (x) => `${wrap(parseFloat(x))}%` },
        });

        // Hover slows rather than stops: a hard pause makes the band feel
        // broken, and a moving rail still reads as "live".
        const slow = () => gsap.to(tween, { timeScale: 0.25, duration: 0.4 });
        const resume = () => gsap.to(tween, { timeScale: 1, duration: 0.4 });
        root.addEventListener("mouseenter", slow);
        root.addEventListener("mouseleave", resume);

        return () => {
          root.removeEventListener("mouseenter", slow);
          root.removeEventListener("mouseleave", resume);
        };
      });

      return () => mm.revert();
    },
    { dependencies: [speed, reverse] }
  );

  return <span ref={marker} aria-hidden="true" className="hidden" />;
}
