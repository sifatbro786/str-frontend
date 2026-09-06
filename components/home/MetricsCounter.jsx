"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Count-up for one metric figure.
 *
 * Phase 3 split every metric into `value` and `suffix` in lib/data.js precisely
 * so this component only ever touches the number node, and gave the row `.nums`
 * (tabular figures) so a running count cannot reflow the layout mid-animation.
 *
 * `once: true` matters: a figure that re-counts every time you scroll past it
 * reads as a glitch, not a flourish.
 *
 * The server-rendered text is the FINAL value, not 0 — if JS never runs, or the
 * trigger never fires, the correct number is already on screen.
 */
export default function MetricsCounter({ value }) {
  const el = useRef(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const obj = { n: 0 };
      gsap.to(obj, {
        n: value,
        duration: 1.6,
        ease: "power2.out",
        snap: { n: 1 },
        onUpdate: () => {
          if (el.current) el.current.textContent = obj.n;
        },
        scrollTrigger: { trigger: el.current, start: "top 85%", once: true },
      });
    },
    { scope: el, dependencies: [value] }
  );

  return <span ref={el}>{value}</span>;
}
