"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Interactive particle-mesh background.
 *
 * ── WHY CANVAS 2D AND NOT THREE.JS ───────────────────────────────────────
 * three is ~150KB gzipped on the site's highest-traffic route, plus a WebGL
 * context that contends with ScrollSmoother for GPU on the first screen —
 * during the exact seconds LCP is measured. This is ~5KB, no new dependency,
 * and the visual target (a glowing node network that opens around the cursor)
 * does not need a shader. If this ever becomes a true fluid gradient, that is
 * the moment to reach for WebGL, not before.
 *
 * ── THE FOUR THINGS THAT MAKE IT FAST ────────────────────────────────────
 *  1. Glow is a pre-rendered sprite, not ctx.shadowBlur. shadowBlur re-blurs
 *     on every single draw call and is the single most common reason a canvas
 *     hero runs at 12fps. Two 96px sprites are rasterised once at mount and
 *     blitted with drawImage.
 *  2. Zero allocation in the frame loop. No object literals, no template
 *     strings for rgba(), no array building. Colours are two constant strings
 *     and intensity rides on globalAlpha, so nothing enters the nursery and
 *     there is no GC sawtooth at minute three.
 *  3. Links are drawn in two passes grouped by colour, so strokeStyle is
 *     assigned twice per frame instead of once per line.
 *  4. Delta-normalised integration. Every force and the damping coefficient
 *     are scaled by dt, so the mesh moves at the same speed on a 60Hz panel
 *     and a 120Hz one. Without this the whole field drifts twice as fast on a
 *     ProMotion display — the classic "looks great on my laptop" bug.
 *
 * ── POINTER ──────────────────────────────────────────────────────────────
 * Nodes are repelled from the cursor with a linear falloff, added to velocity
 * rather than to position: that is where the inertia comes from. The mesh
 * bulges open as the cursor arrives and drifts closed behind it, because
 * damping is < 1 rather than a snap-back tween. Cursor-to-node links are drawn
 * in signal orange so the reaction is legible and not just felt.
 *
 * Reads the shared pointer field rather than binding its own listener — see
 * usePointerField. The `field` prop is required; without it there is nothing
 * to drive the interaction and the mesh renders its ambient drift only.
 */

const BRAND = "rgb(20,118,190)"; // --color-brand  #1476be
const SIGNAL = "rgb(239,90,40)"; // --color-signal #ef5a28
const BRAND_RGB = [20, 118, 190];
const SIGNAL_RGB = [239, 90, 40];

/* Additive compositing on the near-black canvas is what makes overlapping
   glows bloom. On paper it clips everything to white almost immediately, so
   light mode draws normally at lower alpha and reads as a pigment wash. */
const TONE = {
  dark: { op: "lighter", node: 0.8, link: 0.5, cursor: 0.8 },
  light: { op: "source-over", node: 0.55, link: 0.4, cursor: 0.6 },
};

const HOT_SHARE = 0.24; // fraction of nodes in signal orange — an accent, not a scheme
const SPRITE = 96;

export default function HeroCanvas({ field }) {
  const host = useRef(null);
  const cv = useRef(null);

  useGSAP(
    () => {
      const canvas = cv.current;
      const box = host.current;
      const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
      if (!ctx) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let W = 0;
      let H = 0;
      let link = 150;
      let link2 = link * link;
      let dark = document.documentElement.classList.contains("dark");
      // Two independent gates, ANDed at draw time. Collapsing them into one
      // `visible` flag loses state: returning to a backgrounded tab would leave
      // the canvas frozen, because the IntersectionObserver has nothing new to
      // report and never fires again.
      let onScreen = true;
      let tabVisible = true;

      const nodes = [];

      /* ── Glow sprite ──────────────────────────────────────────────────── */
      const makeSprite = (rgb) => {
        const c = document.createElement("canvas");
        c.width = SPRITE;
        c.height = SPRITE;
        const g = c.getContext("2d");
        const h = SPRITE / 2;
        const grad = g.createRadialGradient(h, h, 0, h, h, h);
        grad.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`);
        // The 0.22 shoulder is the core; everything past it is the halo. A
        // single linear falloff reads as a flat disc rather than a light.
        grad.addColorStop(0.22, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5)`);
        grad.addColorStop(0.55, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.12)`);
        grad.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
        g.fillStyle = grad;
        g.fillRect(0, 0, SPRITE, SPRITE);
        return c;
      };

      const spriteCold = makeSprite(BRAND_RGB);
      const spriteHot = makeSprite(SIGNAL_RGB);

      /* ── Sizing ───────────────────────────────────────────────────────── */
      const targetCount = () => Math.round(gsap.utils.clamp(24, 78, (W * H) / 19000));

      const spawn = (x, y) => ({
        x: x ?? Math.random() * W,
        y: y ?? Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        // Radius drives both sprite size and link opacity, so the field reads
        // as having depth without a z axis to manage.
        r: 0.55 + Math.random() * 0.85,
        hot: Math.random() < HOT_SHARE,
        ph: Math.random() * Math.PI * 2,
        // Per-node steering frequency: a shared one makes all 60 nodes turn in
        // unison, which instantly reads as a loop rather than as drift.
        pv: 0.004 + Math.random() * 0.007,
      });

      const resize = () => {
        const r = box.getBoundingClientRect();
        const prevW = W || r.width;
        const prevH = H || r.height;
        W = r.width;
        H = r.height;
        if (W < 1 || H < 1) return;

        // DPR capped at 2. A 3x phone would quadruple the fill cost of a
        // purely decorative layer for no perceptible gain.
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        // Setting .width resets all context state, so the transform goes after.
        // Everything below then draws in CSS pixels.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        link = gsap.utils.clamp(105, 190, Math.min(W, H) * 0.26);
        link2 = link * link;

        // Rescale rather than re-seed: re-seeding on every resize tick makes
        // the mesh visibly explode while a window is being dragged.
        const sx = W / prevW;
        const sy = H / prevH;
        nodes.forEach((p) => {
          p.x *= sx;
          p.y *= sy;
        });

        const want = targetCount();
        while (nodes.length < want) nodes.push(spawn());
        if (nodes.length > want) nodes.length = want;
      };

      /* ── Frame ────────────────────────────────────────────────────────── */
      const MOUSE_R = 190;
      const MOUSE_R2 = MOUSE_R * MOUSE_R;

      const draw = (f, dt) => {
        if (!onScreen || !tabVisible || W < 1) return;

        const tone = dark ? TONE.dark : TONE.light;
        const engaged = f ? f.active : false;
        const mx = f ? f.x * W : W * 0.5;
        const my = f ? f.y * H : H * 0.4;

        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = tone.op;

        // Integrate. Damping is exponentiated by dt so the decay curve is the
        // same wall-clock curve at any refresh rate.
        const damp = Math.pow(0.974, dt);
        for (let i = 0; i < nodes.length; i++) {
          const p = nodes[i];

          p.ph += p.pv * dt;
          p.vx += Math.cos(p.ph) * 0.0075 * dt;
          p.vy += Math.sin(p.ph * 0.83) * 0.0075 * dt;

          if (engaged && f.fine) {
            const dx = p.x - mx;
            const dy = p.y - my;
            const d2 = dx * dx + dy * dy;
            if (d2 < MOUSE_R2 && d2 > 1) {
              const d = Math.sqrt(d2);
              // Force into velocity, not into position. This is the whole
              // reason it feels physical instead of magnetic.
              const force = (1 - d / MOUSE_R) * 0.62 * dt;
              p.vx += (dx / d) * force;
              p.vy += (dy / d) * force;
            }
          }

          p.vx *= damp;
          p.vy *= damp;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // Wrap with a margin so nodes never pop at the edge.
          if (p.x < -60) p.x = W + 60;
          else if (p.x > W + 60) p.x = -60;
          if (p.y < -60) p.y = H + 60;
          else if (p.y > H + 60) p.y = -60;
        }

        /* Links, in two colour passes. O(n²) at n ≤ 78 is ~3000 squared-
           distance checks — a rounding error next to the draw calls, which is
           why the alpha cull below matters far more than a spatial index. */
        ctx.lineWidth = 1;
        for (let pass = 0; pass < 2; pass++) {
          ctx.strokeStyle = pass === 0 ? BRAND : SIGNAL;
          for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
              const b = nodes[j];
              // A link is hot if either end is. Evaluating this before the
              // distance check would be cheaper still, but it reads worse.
              const hot = a.hot || b.hot;
              if ((pass === 1) !== hot) continue;

              const dx = a.x - b.x;
              const dy = a.y - b.y;
              const d2 = dx * dx + dy * dy;
              if (d2 > link2) continue;

              const alpha = (1 - Math.sqrt(d2) / link) * tone.link * (0.5 + a.r * 0.5);
              if (alpha < 0.045) continue; // culls the invisible majority

              ctx.globalAlpha = alpha;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }

        /* Cursor links. Without these the repulsion is felt but not seen. */
        if (engaged && f.fine) {
          ctx.strokeStyle = SIGNAL;
          for (let i = 0; i < nodes.length; i++) {
            const p = nodes[i];
            const dx = p.x - mx;
            const dy = p.y - my;
            const d2 = dx * dx + dy * dy;
            if (d2 > MOUSE_R2) continue;
            const alpha = (1 - Math.sqrt(d2) / MOUSE_R) * tone.cursor;
            if (alpha < 0.05) continue;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }

        /* Nodes last, over their own links. */
        for (let i = 0; i < nodes.length; i++) {
          const p = nodes[i];
          const s = p.r * 34;
          ctx.globalAlpha = tone.node * (0.35 + p.r * 0.65);
          ctx.drawImage(p.hot ? spriteHot : spriteCold, p.x - s / 2, p.y - s / 2, s, s);
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      };

      /* ── Wiring ───────────────────────────────────────────────────────── */
      resize();

      if (reduced) {
        // One static frame. The composition is the point; the motion is not.
        draw(null, 1);
        return;
      }

      const ro = new ResizeObserver(resize);
      ro.observe(box);

      // Never paint a hero canvas while the reader is in the footer. This is
      // the single largest saving in the file and it costs four lines.
      const io = new IntersectionObserver(
        ([entry]) => {
          onScreen = entry.isIntersecting;
        },
        { rootMargin: "120px" }
      );
      io.observe(box);

      const onVis = () => {
        tabVisible = !document.hidden;
      };
      document.addEventListener("visibilitychange", onVis);

      // next-themes writes class="dark" on <html>; the compositing mode and the
      // alpha ramp both hang off it, so the mesh has to hear the flip.
      const mo = new MutationObserver(() => {
        dark = document.documentElement.classList.contains("dark");
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

      const sub = (f, dt) => draw(f, dt);
      const bus = field?.current;
      if (bus) {
        // Subscribing to the shared field rather than adding a second ticker
        // means the mesh reads the pointer *after* it was lerped this frame,
        // not one frame behind it.
        bus.subs.add(sub);
      } else {
        gsap.ticker.add((t, d) => draw(null, Math.min(d, 33.4) / 16.6667));
      }

      return () => {
        bus?.subs.delete(sub);
        ro.disconnect();
        io.disconnect();
        mo.disconnect();
        document.removeEventListener("visibilitychange", onVis);
      };
    },
    { scope: host, dependencies: [] }
  );

  return (
    <div
      ref={host}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        // Fades the mesh out from under the copy. A CSS mask on the container
        // costs one composite; masking inside the canvas would cost a second
        // full-surface pass every frame.
        maskImage:
          "radial-gradient(115% 92% at 72% 22%, #000 12%, rgba(0,0,0,0.55) 48%, transparent 82%)",
        WebkitMaskImage:
          "radial-gradient(115% 92% at 72% 22%, #000 12%, rgba(0,0,0,0.55) 48%, transparent 82%)",
      }}
    >
      <canvas ref={cv} className="block h-full w-full" />
    </div>
  );
}
