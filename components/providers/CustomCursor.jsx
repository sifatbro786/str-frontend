"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Pointer system: cursor, ghost trail, blend-mode inversion, and a global
 * magnetic field that any element can opt into.
 *
 * ─── Author-facing API (no props, no context, no re-binding) ───────────────
 *   data-cursor="view"  + data-cursor-image="/x.png" [+ data-cursor-label]
 *   data-cursor="drag"        ring opens with a "DRAG" label
 *   data-cursor="trail"       multi-dot ghosting trail, lit by pointer velocity
 *   data-cursor="difference"  cursor inverts against the backdrop
 *   data-cursor="hide"        cursor fades out entirely
 *   data-cursor-text="EXPLORE"      arbitrary label inside the ring, any mode
 *   data-cursor-blend="difference"  section-level inversion
 *   data-magnetic  [+ data-magnetic-radius="40" data-magnetic-strength="0.34"]
 *     └ optional child [data-magnetic-inner] drifts further, for parallax
 *
 * ─── Why this is not 20 lines ──────────────────────────────────────────────
 *  · gsap.quickTo() compiles one mutating tween per property instead of
 *    allocating a tween on every mousemove. At 120Hz that is the difference
 *    between a smooth cursor and a GC sawtooth.
 *  · Pointer events only record coordinates; ALL work happens once per frame in
 *    a single gsap.ticker callback. Input rate is decoupled from render rate,
 *    so a 1000Hz mouse costs exactly what a 125Hz one does.
 *  · Magnetic candidates are narrowed by IntersectionObserver first, so the
 *    per-frame getBoundingClientRect() loop runs over the two or three magnets
 *    actually on screen, never the whole document. Measuring live rather than
 *    caching rects is what keeps the field accurate under ScrollSmoother, whose
 *    content transform keeps easing after the scroll events have stopped.
 *  · transform and opacity only. Nothing here touches layout.
 */

/* ── Tuning ────────────────────────────────────────────────────────────────
   Every number a designer would want to argue about, in one place. */
const TRAIL_DOTS = 5;
const TRAIL_SPEED_IN = 6; // px/frame before ghosts start to appear
const TRAIL_SPEED_FULL = 34; // px/frame at which the trail is fully lit
const MAGNET_RADIUS = 40; // proximity field, measured OUTSIDE the element box
const MAGNET_STRENGTH = 0.34; // fraction of the cursor↔centre delta travelled
const MAGNET_MAX = 28; // hard clamp, px — a magnet must never leave its slot
const MAGNET_INNER = 0.42; // extra travel for [data-magnetic-inner]
const PULL_EASE = "elastic.out(1, 0.62)"; // damped enough to track, springy on release
const PULL_TIME = 0.8;

/* Explicit intent always wins; this is the automatic fallback that inverts the
   cursor over display type and any section that asks for it. One line to trim
   if headings ever start to feel too eager. */
const BLEND_SELECTOR =
  '[data-cursor="difference"],[data-cursor="invert"],[data-cursor-blend="difference"],h1,h2,.text-display,.text-heading';
const CURSOR_SELECTOR = "[data-cursor],[data-cursor-text],[data-cursor-image]";
const MAGNET_SELECTOR = '[data-magnetic]:not([data-magnetic="false"])';

const DEFAULT_STATE = {
  mode: "default",
  image: "",
  text: "",
  caption: "View",
  blend: false,
  key: "default",
};

/** Resolve everything the cursor needs from whatever sits under the pointer. */
function resolveState(node) {
  const el = node instanceof Element ? node : null;
  if (!el) return DEFAULT_STATE;

  const owner = el.closest(CURSOR_SELECTOR);
  const d = owner?.dataset ?? {};
  const mode = d.cursor ?? (d.cursorText ? "text" : "default");
  if (mode === "hide") return { ...DEFAULT_STATE, mode: "hide", key: "hide" };

  // An image preview owns the cursor outright: no label competing inside it,
  // and no difference blend, which would render the artwork as a negative.
  const image = d.cursorImage ?? "";
  const text = image ? "" : (d.cursorText ?? (mode === "drag" ? "DRAG" : ""));
  const caption = d.cursorLabel ?? "View";
  const blend = !image && !!el.closest(BLEND_SELECTOR);

  return {
    mode,
    image,
    text,
    caption,
    blend,
    key: `${mode}|${image}|${text}|${caption}|${blend}`,
  };
}

export default function CustomCursor() {
  const root = useRef(null);
  const dot = useRef(null);
  const ring = useRef(null);
  const text = useRef(null);
  const preview = useRef(null);
  const caption = useRef(null);
  const trail = useRef([]);

  /* The guard is stateful rather than a one-shot check: a tablet gaining a
     mouse, or macOS "Reduce motion" being toggled mid-session, both flip this
     and the effect re-runs. Starts false so SSR and first paint agree. */
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setEnabled(fine.matches && !still.matches);

    sync();
    fine.addEventListener("change", sync);
    still.addEventListener("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      still.removeEventListener("change", sync);
    };
  }, []);

  useGSAP(
    () => {
      if (!enabled || !root.current) return;

      const rootEl = root.current;
      const dotEl = dot.current;
      const ringEl = ring.current;
      const textEl = text.current;
      const previewEl = preview.current;
      const captionEl = caption.current;
      const ghosts = trail.current.filter(Boolean);

      gsap.set([dotEl, ringEl, textEl, ...ghosts], { xPercent: -50, yPercent: -50 });
      gsap.set(rootEl, { autoAlpha: 0 });
      gsap.set(previewEl, { autoAlpha: 0, scale: 0.85 });
      gsap.set(textEl, { autoAlpha: 0, scale: 0.6 });

      /* ── Compiled tweens. Created once, mutated forever. ───────────────── */
      const xDot = gsap.quickTo(dotEl, "x", { duration: 0.15, ease: "power3" });
      const yDot = gsap.quickTo(dotEl, "y", { duration: 0.15, ease: "power3" });
      const xRing = gsap.quickTo(ringEl, "x", { duration: 0.5, ease: "power3" });
      const yRing = gsap.quickTo(ringEl, "y", { duration: 0.5, ease: "power3" });
      const xText = gsap.quickTo(textEl, "x", { duration: 0.5, ease: "power3" });
      const yText = gsap.quickTo(textEl, "y", { duration: 0.5, ease: "power3" });
      const xPrev = gsap.quickTo(previewEl, "x", { duration: 0.7, ease: "power3" });
      const yPrev = gsap.quickTo(previewEl, "y", { duration: 0.7, ease: "power3" });

      // Each ghost lags a little further behind and reads a little fainter —
      // the trail IS the lag, not a particle system.
      const ghostTo = ghosts.map((el, i) => ({
        el,
        x: gsap.quickTo(el, "x", { duration: 0.2 + i * 0.085, ease: "power3" }),
        y: gsap.quickTo(el, "y", { duration: 0.2 + i * 0.085, ease: "power3" }),
        o: gsap.quickTo(el, "opacity", { duration: 0.25, ease: "power2" }),
        falloff: 1 - i / (TRAIL_DOTS + 1),
      }));

      /* ── Pointer bookkeeping ───────────────────────────────────────────── */
      const p = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      let prevX = p.x;
      let prevY = p.y;
      let speed = 0;
      let moved = false;
      let inside = false;
      let pressed = false;
      let trailOn = false;
      let ringScale = 1;
      let dotScale = 1;
      let stateKey = "";
      let scrollAt = -Infinity;
      let frame = 0;

      /* Press is a multiplier over whatever the hover state asked for, never an
         absolute — otherwise clicking inside a "view" or labelled state pops the
         hidden dot back into frame. */
      const sizeRing = (duration = 0.4) =>
        gsap.to(ringEl, {
          scale: ringScale * (pressed ? 0.82 : 1),
          duration,
          ease: "power3",
          overwrite: "auto",
        });

      const sizeDot = (duration = 0.4) =>
        gsap.to(dotEl, {
          scale: dotScale * (pressed ? 0.55 : 1),
          duration,
          ease: "power3",
          overwrite: "auto",
        });

      /* ── State machine ─────────────────────────────────────────────────── */
      const apply = (s) => {
        if (s.key === stateKey) return;
        const wasTrail = trailOn;
        stateKey = s.key;

        gsap.to(rootEl, {
          autoAlpha: s.mode === "hide" ? 0 : inside ? 1 : 0,
          duration: 0.25,
          overwrite: "auto",
        });

        // Inversion is a paint-level swap, not a tween: under `difference` the
        // marks have to be pure white to read as a true negative.
        rootEl.style.mixBlendMode = s.blend ? "difference" : "normal";
        gsap.set(ringEl, { borderColor: s.blend ? "#fff" : "var(--text-mute)" });
        gsap.set([dotEl, ...ghosts], {
          backgroundColor: s.blend ? "#fff" : "var(--color-signal)",
        });
        gsap.set(textEl, { color: s.blend ? "#fff" : "var(--text)" });

        if (s.image) {
          previewEl.style.backgroundImage = `url("${s.image}")`;
          captionEl.textContent = s.caption;
          gsap.to(previewEl, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.45,
            ease: "power4.out",
            overwrite: "auto",
          });
        } else {
          gsap.to(previewEl, { autoAlpha: 0, scale: 0.85, duration: 0.3, overwrite: "auto" });
        }

        if (s.text) {
          textEl.textContent = s.text;
          gsap.to(textEl, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.35,
            ease: "power3.out",
            overwrite: "auto",
          });
        } else {
          gsap.to(textEl, { autoAlpha: 0, scale: 0.6, duration: 0.25, overwrite: "auto" });
        }

        // The ring opens just wide enough to hold its label instead of jumping
        // to a fixed "big circle" — DRAG and EXPLORE should not share a
        // diameter.
        ringScale = s.image
          ? 0
          : s.text
            ? gsap.utils.clamp(2.5, 4.2, 2.4 + s.text.length * 0.11)
            : s.blend
              ? 2.2
              : 1;
        dotScale = s.image || s.text ? 0 : 1;
        sizeRing();
        sizeDot();

        trailOn = s.mode === "trail";
        if (trailOn && !wasTrail) {
          // Park the ghosts on the pointer, or they streak in from wherever
          // they were left the last time the trail was lit.
          gsap.set(ghosts, { x: p.x, y: p.y });
        } else if (!trailOn && wasTrail) {
          ghostTo.forEach((g) => g.o(0));
        }
      };

      /* ── Magnetic field ────────────────────────────────────────────────── */
      const magnets = new Map();
      const onScreen = new Set();

      const release = (rec) => {
        if (!rec.engaged) return;
        rec.engaged = false;
        rec.x(0);
        rec.y(0);
        rec.ix?.(0);
        rec.iy?.(0);
      };

      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const rec = magnets.get(entry.target);
            if (!rec) continue;
            if (entry.isIntersecting) {
              onScreen.add(entry.target);
            } else {
              onScreen.delete(entry.target);
              release(rec);
            }
          }
        },
        { rootMargin: "150px" }
      );

      const forget = (el, rec) => {
        release(rec);
        io.unobserve(el);
        onScreen.delete(el);
        // Only x/y — killing every tween would take out the element's own
        // reveal or hover animations along with the magnet.
        gsap.killTweensOf(el, "x,y");
        gsap.set(el, { x: 0, y: 0 });
        if (rec.inner) {
          gsap.killTweensOf(rec.inner, "x,y");
          gsap.set(rec.inner, { x: 0, y: 0 });
        }
        magnets.delete(el);
      };

      const scan = () => {
        const found = new Set(document.querySelectorAll(MAGNET_SELECTOR));

        magnets.forEach((rec, el) => {
          if (!found.has(el) || !el.isConnected) forget(el, rec);
        });

        found.forEach((el) => {
          if (magnets.has(el)) return;
          const inner = el.querySelector("[data-magnetic-inner]");
          magnets.set(el, {
            inner,
            engaged: false,
            radius: Number(el.dataset.magneticRadius) || MAGNET_RADIUS,
            strength: Number(el.dataset.magneticStrength) || MAGNET_STRENGTH,
            x: gsap.quickTo(el, "x", { duration: PULL_TIME, ease: PULL_EASE }),
            y: gsap.quickTo(el, "y", { duration: PULL_TIME, ease: PULL_EASE }),
            ix: inner
              ? gsap.quickTo(inner, "x", { duration: PULL_TIME + 0.1, ease: PULL_EASE })
              : null,
            iy: inner
              ? gsap.quickTo(inner, "y", { duration: PULL_TIME + 0.1, ease: PULL_EASE })
              : null,
          });
          io.observe(el);
        });
      };

      const pullMagnets = () => {
        onScreen.forEach((el) => {
          const rec = magnets.get(el);
          if (!rec) return;

          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dx = p.x - cx;
          const dy = p.y - cy;

          // Distance to the nearest point ON the box, so the field is a 40px
          // halo around the shape rather than a circle around its centre — a
          // wide button then behaves the same at both ends.
          const gapX = Math.max(Math.abs(dx) - r.width / 2, 0);
          const gapY = Math.max(Math.abs(dy) - r.height / 2, 0);
          const gap = Math.hypot(gapX, gapY);

          if (gap > rec.radius) {
            release(rec);
            return;
          }

          // Ramping the pull to zero at the rim is what removes the snap: the
          // element is already at rest by the time the field ends.
          const falloff = 1 - gap / rec.radius;
          const k = rec.strength * falloff;
          const tx = gsap.utils.clamp(-MAGNET_MAX, MAGNET_MAX, dx * k);
          const ty = gsap.utils.clamp(-MAGNET_MAX, MAGNET_MAX, dy * k);

          rec.engaged = true;
          rec.x(tx);
          rec.y(ty);
          rec.ix?.(tx * MAGNET_INNER);
          rec.iy?.(ty * MAGNET_INNER);
        });
      };

      /* ── One frame ─────────────────────────────────────────────────────── */
      const tick = () => {
        const didMove = moved;
        moved = false;
        frame += 1;

        const vx = p.x - prevX;
        const vy = p.y - prevY;
        prevX = p.x;
        prevY = p.y;
        speed += (Math.hypot(vx, vy) - speed) * 0.18; // low-pass, or the trail flickers

        if (didMove) {
          xDot(p.x);
          yDot(p.y);
          xRing(p.x);
          yRing(p.y);
          xText(p.x);
          yText(p.y);
          xPrev(p.x);
          yPrev(p.y);
        }

        if (trailOn) {
          const lit = gsap.utils.clamp(
            0,
            1,
            (speed - TRAIL_SPEED_IN) / (TRAIL_SPEED_FULL - TRAIL_SPEED_IN)
          );
          for (const g of ghostTo) {
            g.x(p.x);
            g.y(p.y);
            g.o(lit * g.falloff * 0.9);
          }
        }

        // Scrolling moves the page under a stationary pointer. Browsers are
        // inconsistent about re-firing pointerover for that, and ScrollSmoother
        // keeps easing after the scroll event stops — so re-hit-test at ~15Hz
        // for a beat afterwards.
        const settling = performance.now() - scrollAt < 900;
        if (settling && inside && frame % 4 === 0) {
          apply(resolveState(document.elementFromPoint(p.x, p.y)));
        }

        if (didMove || settling) pullMagnets();
      };

      /* ── Listeners ─────────────────────────────────────────────────────── */
      const onMove = (e) => {
        p.x = e.clientX;
        p.y = e.clientY;
        moved = true;
        if (!inside) {
          inside = true;
          gsap.set([dotEl, ringEl, textEl, previewEl, ...ghosts], { x: p.x, y: p.y });
          if (stateKey !== "hide") gsap.to(rootEl, { autoAlpha: 1, duration: 0.3 });
        }
      };

      // pointerover bubbles and fires on every element the pointer enters —
      // including the plain background on the way out of a card. One listener
      // therefore covers enter AND leave, without the nested-child churn a
      // mouseover/mouseout pair produces. Identical states dedupe by key.
      const onOver = (e) => apply(resolveState(e.target));

      const onDown = () => {
        pressed = true;
        sizeRing(0.25);
        sizeDot(0.25);
      };

      const onUp = () => {
        pressed = false;
        sizeRing(0.3);
        sizeDot(0.3);
      };

      // Leaving the window should hide the cursor and drop every magnet, not
      // freeze both mid-pull.
      const onLeave = () => {
        inside = false;
        gsap.to(rootEl, { autoAlpha: 0, duration: 0.2 });
        magnets.forEach(release);
      };

      const onScroll = () => {
        scrollAt = performance.now();
      };

      // Magnets that arrive with a later render — a filtered grid, slider
      // clones, a route transition — register themselves. Debounced to one
      // scan per frame so a chatty subtree cannot thrash it.
      let rescan = 0;
      const mo = new MutationObserver(() => {
        cancelAnimationFrame(rescan);
        rescan = requestAnimationFrame(scan);
      });

      scan();
      mo.observe(document.body, { childList: true, subtree: true });
      gsap.ticker.add(tick);

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("pointerover", onOver, { passive: true });
      document.addEventListener("pointerdown", onDown, { passive: true });
      document.addEventListener("pointerup", onUp, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);

      return () => {
        gsap.ticker.remove(tick);
        cancelAnimationFrame(rescan);
        mo.disconnect();
        io.disconnect();
        // Tweens started from event handlers live outside the useGSAP context,
        // so every magnet is unwound by hand: a route change must never leave a
        // button parked 28px away from its own layout box.
        magnets.forEach((rec, el) => forget(el, rec));

        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("pointerover", onOver);
        document.removeEventListener("pointerdown", onDown);
        document.removeEventListener("pointerup", onUp);
        document.documentElement.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: root, dependencies: [enabled], revertOnUpdate: true }
  );

  // Coarse pointers and reduced-motion users get no nodes at all, not hidden
  // ones — globals.css hands the native cursor back under the same conditions.
  if (!enabled) return null;

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none fixed inset-0 z-100 opacity-0">
      {Array.from({ length: TRAIL_DOTS }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            trail.current[i] = el;
          }}
          className="absolute size-1.5 rounded-full bg-signal opacity-0 will-change-transform"
        />
      ))}

      <div
        ref={ring}
        className="absolute size-9 rounded-full border border-(--text-mute) will-change-transform"
      />
      <div ref={dot} className="absolute size-1.5 rounded-full bg-signal will-change-transform" />

      <span
        ref={text}
        className="label-mono absolute whitespace-nowrap text-(--text) opacity-0 will-change-transform"
      />

      <div
        ref={preview}
        className="absolute -ml-32 -mt-40 size-64 origin-center overflow-hidden border border-(--line) bg-(--raised) bg-cover bg-center opacity-0 will-change-transform"
      >
        <span
          ref={caption}
          className="label-mono absolute bottom-0 left-0 bg-(--canvas) px-3 py-2 text-(--text)"
        />
      </div>
    </div>
  );
}
