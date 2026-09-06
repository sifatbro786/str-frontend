"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * The spine that runs down the left edge of the process list and draws itself
 * as you scroll through the four stages.
 *
 * Geometry: a 24-wide, 100-tall viewBox stretched over the list with
 * preserveAspectRatio="none". The path is a straight run with a gentle bezier
 * kink at each stage boundary, so the line reads as routed rather than ruled —
 * a plain vertical rule would just look like a border.
 *
 * Nodes are placed at the four stage centres. Each scales in as the drawn line
 * passes it, driven off the same scrub so the line and the nodes cannot desync.
 *
 * Entirely decorative: aria-hidden, and the <ol> already conveys the sequence.
 */
const SPINE = "M 12 0 C 12 10, 4 14, 12 25 C 20 36, 4 39, 12 50 C 20 61, 4 64, 12 75 C 20 86, 12 90, 12 100";
const NODES = [12.5, 37.5, 62.5, 87.5];

export default function ProcessConnector({ count = 4 }) {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const path = root.current.querySelector("[data-spine]");
        const nodes = gsap.utils.toArray("[data-node]", root.current);
        const list = root.current.parentElement;

        gsap.set(nodes, { scale: 0, transformOrigin: "50% 50%" });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: list,
            start: "top 70%",
            end: "bottom 70%",
            scrub: 0.8,
          },
        });

        tl.fromTo(path, { drawSVG: "0%" }, { drawSVG: "100%", ease: "none" }, 0);

        // Each node pops as the line reaches it. Positions are the node's own
        // fraction of the spine, so this stays right if `count` ever changes.
        nodes.forEach((node, i) => {
          tl.to(node, { scale: 1, duration: 0.05, ease: "back.out(2)" }, (i + 0.5) / nodes.length);
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
      className="pointer-events-none absolute inset-y-0 -left-6 hidden w-6 lg:block"
    >
      <svg
        viewBox="0 0 24 100"
        preserveAspectRatio="none"
        fill="none"
        className="h-full w-full"
      >
        <path
          data-spine
          d={SPINE}
          stroke="var(--color-signal)"
          strokeOpacity="0.4"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Nodes live outside the stretched SVG so they stay circular — a circle
          inside a preserveAspectRatio="none" viewBox renders as an ellipse. */}
      {NODES.slice(0, count).map((top) => (
        <span
          key={top}
          data-node
          style={{ top: `${top}%` }}
          className="absolute left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal"
        />
      ))}
    </div>
  );
}
