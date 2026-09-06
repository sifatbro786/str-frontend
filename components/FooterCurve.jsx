"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Shallow arc that flattens as the footer arrives.
 *
 * The curve is bowed downward while the footer is still below the fold and
 * relaxes to a straight rule by the time it is fully in view, so the page reads
 * as settling rather than stopping. Two path states tweened via `attr` — one arc
 * does not need MorphSVG, and skipping it keeps the work on the compositor.
 *
 * Deliberately understated: this is the last thing on the page, and a bouncing
 * footer would undercut the "handed over, not held hostage" tone the copy works
 * hard for.
 */
const BOWED = "M 0 24 C 360 2, 1080 2, 1440 24 L 1440 24 L 0 24 Z";
const FLAT = "M 0 2 C 360 2, 1080 2, 1440 2 L 1440 24 L 0 24 Z";

export default function FooterCurve() {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const path = root.current.querySelector("[data-curve]");
        const footer = root.current.parentElement;

        gsap.fromTo(
          path,
          { attr: { d: BOWED } },
          {
            attr: { d: FLAT },
            ease: "none",
            scrollTrigger: {
              trigger: footer,
              start: "top bottom",
              end: "top 80%",
              scrub: true,
            },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -top-6 h-6 overflow-hidden"
    >
      <svg
        viewBox="0 0 1440 24"
        preserveAspectRatio="none"
        className="h-full w-full"
        fill="var(--canvas)"
      >
        <path data-curve d={BOWED} />
      </svg>
    </div>
  );
}
