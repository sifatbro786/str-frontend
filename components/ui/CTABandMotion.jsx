"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/lib/gsap";

/**
 * Optional motion layer for CTABand.
 *
 * Kept as a separate client child because CTABand is shared with every inner
 * route (/services, /projects, /blogs, /about). Only the homepage's ContactCTA
 * opts in via `interactive`, and CTABand reaches this file through next/dynamic
 * rather than a static import — that is what actually keeps GSAP out of the inner
 * routes' First Load JS. The `interactive` guard alone would not: it decides what
 * renders, not what ships.
 *
 * Two effects:
 *  · A soft highlight that follows the pointer across the band. quickTo mutates
 *    one tween instead of allocating per mousemove.
 *  · A masked line reveal on the heading, fired once when the band enters view.
 *
 * The highlight sits at 0 opacity until the pointer arrives, so on touch and
 * under reduced motion it simply never appears.
 */
export default function CTABandMotion() {
  const glow = useRef(null);

  useGSAP(
    () => {
      // CTABand is a server component and cannot hold or pass a ref, so the
      // section is reached through the DOM instead. This element is rendered as
      // the band's first child, so parentElement is always the <section>.
      const section = glow.current?.parentElement;
      if (!section) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ── Heading reveal ──────────────────────────────────────────────
        const split = SplitText.create(section.querySelector("[data-cta-title]"), {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          linesClass: "split-line-inner",
          onSplit(self) {
            return gsap.from(self.lines, {
              yPercent: 110,
              duration: 0.85,
              stagger: 0.08,
              ease: "power4.out",
              scrollTrigger: { trigger: section, start: "top 75%", once: true },
            });
          },
        });

        // ── Pointer-tracked highlight ───────────────────────────────────
        const hasPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        let cleanupPointer = () => {};

        if (hasPointer) {
          const xTo = gsap.quickTo(glow.current, "--glow-x", { duration: 0.6, ease: "power3" });
          const yTo = gsap.quickTo(glow.current, "--glow-y", { duration: 0.6, ease: "power3" });

          const onMove = (e) => {
            const r = section.getBoundingClientRect();
            xTo(`${((e.clientX - r.left) / r.width) * 100}%`);
            yTo(`${((e.clientY - r.top) / r.height) * 100}%`);
          };
          const onEnter = () => gsap.to(glow.current, { opacity: 0.14, duration: 0.5 });
          const onLeave = () => gsap.to(glow.current, { opacity: 0, duration: 0.5 });

          section.addEventListener("mousemove", onMove, { passive: true });
          section.addEventListener("mouseenter", onEnter);
          section.addEventListener("mouseleave", onLeave);

          cleanupPointer = () => {
            section.removeEventListener("mousemove", onMove);
            section.removeEventListener("mouseenter", onEnter);
            section.removeEventListener("mouseleave", onLeave);
          };
        }

        return () => {
          cleanupPointer();
          split.revert();
        };
      });

      return () => mm.revert();
    },
    { dependencies: [] }
  );

  return (
    <div
      ref={glow}
      aria-hidden="true"
      style={{
        "--glow-x": "50%",
        "--glow-y": "50%",
        backgroundImage:
          "radial-gradient(40% 90% at var(--glow-x) var(--glow-y), var(--color-signal) 0%, transparent 70%)",
      }}
      className="pointer-events-none absolute inset-0 opacity-0"
    />
  );
}
