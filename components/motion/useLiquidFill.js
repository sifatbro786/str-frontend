"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Direction-aware liquid fill, delegated across a scope.
 *
 * Markup contract:
 *   <a data-liquid data-liquid-on="text-white" class="relative overflow-hidden">
 *     <span data-liquid-fill class="absolute inset-0 bg-signal" />
 *     <span data-liquid-label class="relative z-10">Label</span>
 *   </a>
 *
 * The sheet enters from whichever edge the pointer actually crossed and leaves
 * through whichever edge it exits by. The curved leading edge flattening as it
 * lands is what sells the "liquid" read — a straight-edged sheet is a wipe.
 *
 * ── COLOUR IS A CLASS, NOT A TWEEN ───────────────────────────────────────
 * `data-liquid-on` names the classes to add while filled. GSAP would have to
 * resolve var(--canvas) to a number to interpolate the label colour back,
 * which pins the rest colour to whichever theme was active at hover time and
 * strands the label if the visitor flips theme with the pointer away. A class
 * over a CSS transition follows the token.
 *
 * NOTE: the Navbar CTA still carries its own inline copy of this. Swapping it
 * over is a one-line change once someone is in that file for another reason.
 */
export function useLiquidFill(scope, { duration = 0.62 } = {}) {
  useGSAP(
    (context, contextSafe) => {
      const el = scope.current;
      if (!el) return;

      const fills = gsap.utils.toArray("[data-liquid-fill]", el);
      // Resting state is off the bottom with a convex top edge, set here rather
      // than in CSS so the first hover animates from a known transform origin.
      gsap.set(fills, { yPercent: 101, borderRadius: "42% 58% 0 0" });

      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      let active = null;

      const edge = (btn, e) => {
        const r = btn.getBoundingClientRect();
        return e.clientY < r.top + r.height / 2 ? -1 : 1; // -1 top, 1 bottom
      };

      const shape = (dir) => (dir === 1 ? "42% 58% 0 0" : "0 0 58% 42%");

      const onOver = contextSafe((e) => {
        const btn = e.target.closest?.("[data-liquid]");
        if (!btn || btn === active) return;
        active = btn;

        const fill = btn.querySelector("[data-liquid-fill]");
        const dir = edge(btn, e);
        gsap.killTweensOf(fill);
        gsap.fromTo(
          fill,
          { yPercent: dir * 101, borderRadius: shape(dir) },
          { yPercent: 0, borderRadius: "0% 0% 0% 0%", duration, ease: "power3.out" }
        );

        const on = btn.dataset.liquidOn;
        if (on) btn.querySelector("[data-liquid-label]")?.classList.add(...on.split(/\s+/));
      });

      const onOut = contextSafe((e) => {
        if (!active) return;
        if (e.relatedTarget && active.contains(e.relatedTarget)) return;

        const btn = active;
        active = null;

        const fill = btn.querySelector("[data-liquid-fill]");
        const dir = edge(btn, e);
        gsap.killTweensOf(fill);
        gsap.to(fill, {
          yPercent: dir * 101,
          borderRadius: shape(dir),
          duration: duration * 0.8,
          ease: "power3.in",
        });

        const on = btn.dataset.liquidOn;
        if (on) btn.querySelector("[data-liquid-label]")?.classList.remove(...on.split(/\s+/));
      });

      el.addEventListener("pointerover", onOver);
      el.addEventListener("pointerout", onOut);

      return () => {
        el.removeEventListener("pointerover", onOver);
        el.removeEventListener("pointerout", onOut);
        gsap.killTweensOf(fills);
      };
    },
    { scope, dependencies: [] }
  );
}

export default useLiquidFill;
