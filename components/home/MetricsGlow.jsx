"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Scrubbed contrast shift across the inverted metrics band.
 *
 * This is the §12.2 recommendation, and it is NOT a WebGL shader — deliberately.
 * The band is `bg-(--text) text-(--canvas)`: pure inversion is already the
 * strongest contrast moment on the page, and a canvas repainting every scroll
 * frame behind the largest numerals on the site competes with them for
 * attention while costing battery on exactly the devices least able to spare it.
 *
 * A soft radial highlight whose position tracks scroll progress gets most of the
 * effect for one composited gradient, no dependency, and a clean reduced-motion
 * branch (it simply never moves).
 *
 * File is named for what it does rather than "MetricsShader" from the manifest,
 * because it is not a shader and a name that lies costs more than it saves.
 */
export default function MetricsGlow() {
  const el = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          el.current,
          { "--glow-x": "18%", opacity: 0.05 },
          {
            "--glow-x": "82%",
            opacity: 0.16,
            ease: "none",
            scrollTrigger: {
              trigger: el.current.parentElement,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: el }
  );

  return (
    <div
      ref={el}
      aria-hidden="true"
      style={{
        "--glow-x": "18%",
        backgroundImage:
          "radial-gradient(60% 120% at var(--glow-x) 50%, var(--color-signal) 0%, transparent 70%)",
      }}
      className="pointer-events-none absolute inset-0 opacity-[0.05]"
    />
  );
}
