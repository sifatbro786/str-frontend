"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Hairline bezier accents with waypoint dots travelling along them.
 *
 * Deliberately restrained: three strokes at --line, three 2px dots at --signal,
 * long durations and offset starts so the movement is peripheral. If you can
 * read the page and notice these at the same time, they are too fast.
 *
 * `data-speed` is a ScrollSmoother effect — the whole layer parallaxes behind
 * the copy at 0.85× scroll. It degrades to nothing when the smoother is off
 * (touch, reduced motion), which is correct.
 *
 * The SVG is aria-hidden and pointer-events-none: pure decoration.
 */
const PATHS = [
  "M -120 220 C 180 120, 420 300, 760 180 S 1240 60, 1560 200",
  "M -80 420 C 260 320, 520 520, 880 400 S 1320 280, 1620 420",
  "M -140 90 C 240 -30, 600 150, 980 40 S 1400 -60, 1680 80",
];

export default function HeroPaths() {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const paths = gsap.utils.toArray("[data-hero-path]", root.current);
        const dots = gsap.utils.toArray("[data-hero-dot]", root.current);

        // Draw the hairlines in once, then let the dots run forever.
        gsap.from(paths, {
          drawSVG: "0%",
          duration: 1.8,
          stagger: 0.18,
          ease: "power2.inOut",
        });

        dots.forEach((dot, i) => {
          gsap.set(dot, { transformOrigin: "50% 50%" });
          gsap.to(dot, {
            motionPath: { path: paths[i], align: paths[i], alignOrigin: [0.5, 0.5] },
            duration: 16 + i * 4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 2.5,
          });
        });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      data-speed="0.85"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 1440 520"
        preserveAspectRatio="xMidYMin slice"
        fill="none"
        className="h-full w-full opacity-60"
      >
        {PATHS.map((d, i) => (
          <path
            key={d}
            data-hero-path
            d={d}
            stroke="var(--line)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {PATHS.map((d, i) => (
          <circle key={`dot-${i}`} data-hero-dot r="2.5" fill="var(--color-signal)" />
        ))}
      </svg>
    </div>
  );
}
