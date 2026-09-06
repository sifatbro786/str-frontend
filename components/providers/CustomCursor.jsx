"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Pointer-following cursor with a trailing ring and an optional image preview.
 *
 * Performance notes that are the whole reason this is not 20 lines:
 *  · gsap.quickTo() compiles a single mutating tween per property instead of
 *    allocating a new tween on every mousemove. At 120Hz that is the difference
 *    between a smooth cursor and a GC sawtooth.
 *  · The dot tracks at 0.15s and the ring at 0.5s. The lag between them IS the
 *    trail — no particle system, no canvas, three DOM nodes total.
 *  · transform only. Never animate left/top here.
 *
 * Opt in from any element (no props, no context):
 *    <a data-cursor="view" data-cursor-image="/websites/paarel-website.png">
 *  data-cursor values: "view" | "drag" | "hide"
 */
export default function CustomCursor() {
  const root = useRef(null);
  const dot = useRef(null);
  const ring = useRef(null);
  const preview = useRef(null);
  const label = useRef(null);

  useGSAP(
    () => {
      // Pointer-coarse devices have no cursor to decorate.
      if (window.matchMedia("(hover: none)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const rootEl = root.current;

      gsap.set([dot.current, ring.current], { xPercent: -50, yPercent: -50 });
      gsap.set(rootEl, { autoAlpha: 0 });
      gsap.set(preview.current, { autoAlpha: 0, scale: 0.85 });

      const xDot = gsap.quickTo(dot.current, "x", { duration: 0.15, ease: "power3" });
      const yDot = gsap.quickTo(dot.current, "y", { duration: 0.15, ease: "power3" });
      const xRing = gsap.quickTo(ring.current, "x", { duration: 0.5, ease: "power3" });
      const yRing = gsap.quickTo(ring.current, "y", { duration: 0.5, ease: "power3" });
      const xPrev = gsap.quickTo(preview.current, "x", { duration: 0.7, ease: "power3" });
      const yPrev = gsap.quickTo(preview.current, "y", { duration: 0.7, ease: "power3" });

      let visible = false;
      const onMove = (e) => {
        if (!visible) {
          visible = true;
          gsap.to(rootEl, { autoAlpha: 1, duration: 0.3 });
        }
        xDot(e.clientX);
        yDot(e.clientY);
        xRing(e.clientX);
        yRing(e.clientY);
        xPrev(e.clientX);
        yPrev(e.clientY);
      };

      // Delegated hover: one listener for the whole document, so cards added by
      // a later render (filtered FAQ, slider clones) work with no re-binding.
      const onOver = (e) => {
        const target = e.target.closest?.("[data-cursor]");
        if (!target) return;
        const mode = target.dataset.cursor;
        const src = target.dataset.cursorImage;

        if (mode === "hide") {
          gsap.to(rootEl, { autoAlpha: 0, duration: 0.2 });
          return;
        }

        gsap.to(ring.current, { scale: src ? 0 : 2.4, duration: 0.4 });
        gsap.to(dot.current, { scale: src ? 0 : 1, duration: 0.4 });

        if (src) {
          preview.current.style.backgroundImage = `url("${src}")`;
          label.current.textContent = target.dataset.cursorLabel ?? "View";
          gsap.to(preview.current, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.45,
            ease: "power4.out",
          });
        }
      };

      const onOut = (e) => {
        if (!e.target.closest?.("[data-cursor]")) return;
        gsap.to(rootEl, { autoAlpha: 1, duration: 0.2 });
        gsap.to(ring.current, { scale: 1, duration: 0.4 });
        gsap.to(dot.current, { scale: 1, duration: 0.4 });
        gsap.to(preview.current, { autoAlpha: 0, scale: 0.85, duration: 0.3 });
      };

      // Leaving the window entirely should hide the cursor, not freeze it.
      const onLeave = () => {
        visible = false;
        gsap.to(rootEl, { autoAlpha: 0, duration: 0.2 });
      };

      window.addEventListener("mousemove", onMove, { passive: true });
      document.addEventListener("mouseover", onOver);
      document.addEventListener("mouseout", onOut);
      document.documentElement.addEventListener("mouseleave", onLeave);

      return () => {
        window.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseover", onOver);
        document.removeEventListener("mouseout", onOut);
        document.documentElement.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-100 hidden opacity-0 lg:block"
    >
      <div ref={ring} className="absolute size-9 rounded-full border border-(--text-mute)" />
      <div ref={dot} className="absolute size-1.5 rounded-full bg-signal" />
      <div
        ref={preview}
        className="absolute -ml-32 -mt-40 size-64 origin-center overflow-hidden border border-(--line) bg-(--raised) bg-cover bg-center opacity-0"
      >
        <span
          ref={label}
          className="label-mono absolute bottom-0 left-0 bg-(--canvas) px-3 py-2 text-(--text)"
        />
      </div>
    </div>
  );
}
