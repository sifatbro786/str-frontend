"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Organic mesh-glow gradient. Canvas 2D, no WebGL, no new dependency.
 *
 * ── WHY THIS IS NOT A SHADER ─────────────────────────────────────────────
 * A fluid gradient is a low-frequency image. There is nothing in it above a
 * few cycles per screen, which means it does not need per-pixel evaluation at
 * device resolution — it needs per-pixel evaluation at *thumbnail* resolution
 * and a good upsample. So the field is composited into a fixed ~256px buffer
 * and blitted up with bilinear smoothing. The cost is constant regardless of
 * viewport: a 4K monitor and a phone both pay for ~40k source pixels. three.js
 * would be ~150KB gzipped plus a WebGL context contending with ScrollSmoother
 * for the GPU during the exact seconds LCP is sampled, to render an image with
 * no high-frequency content in it.
 *
 * ── THE FIVE THINGS THAT MAKE IT FAST ────────────────────────────────────
 *  1. Fixed low-res compositing buffer (LOW_W = 256). Constant fill cost.
 *  2. Blobs are pre-rendered radial sprites, not per-frame createRadialGradient
 *     and never ctx.shadowBlur. Both re-rasterise a gradient ramp on every
 *     draw call and are the usual reason a canvas hero runs at 12fps.
 *  3. Zero allocation in the frame loop. No object literals, no rgba() template
 *     strings, no arrays. Intensity rides on globalAlpha, so nothing enters the
 *     nursery and there is no GC sawtooth at minute three.
 *  4. Eight drawImage calls per frame. Total. The blit is the ninth.
 *  5. Delta-normalised integration — every force, spring and damping
 *     coefficient is scaled by dt, so the field moves at the same wall-clock
 *     speed on a 60Hz panel and a 120Hz one. Without this the whole mesh
 *     drifts twice as fast on a ProMotion display.
 *
 * ── WHY IT READS AS FLUID AND NOT AS SEVEN CIRCLES ───────────────────────
 * Three things, and all three are required:
 *  · additive compositing, so overlapping falloffs *sum* into new shapes
 *    rather than stacking as discs;
 *  · a shouldered falloff (see makeSprite) — a single linear ramp reads as a
 *    flat disc with a soft edge, which is exactly the 2019 look we are leaving;
 *  · every blob on its own Lissajous frequency plus a second harmonic. A
 *    shared frequency makes all seven turn in unison and the eye reads a loop
 *    inside about four seconds.
 *
 * ── POINTER ──────────────────────────────────────────────────────────────
 * The cursor is a displacement field, not a cursor-following blob (though it
 * has one of those too). Each blob resolves a target offset from the cursor —
 * some repel, some are drawn in, `pull` carries the sign — and that target is
 * fed to a *spring*, not to the position. The overshoot is the whole effect:
 * the mesh bulges ahead of the cursor, then bleeds closed behind it a beat
 * later. Blobs inside the influence radius also swell (`bleed`), so the glow
 * smears rather than merely translating.
 *
 * Reads the shared pointer field rather than binding its own listener — see
 * usePointerField. Also honours an optional `field.current.boost` (0..1) that
 * HeroIntro raises while a service pill is hovered; it warms the field toward
 * signal orange. Setting it is optional and it defaults to 0, so nothing in
 * usePointerField needed to change.
 */

/* Fixed compositing buffer. 256 is where the upsample stops being visible on a
   field this soft; 320 costs 56% more fill for no perceptible gain. */
const LOW_W = 256;
const SPRITE = 128;
const SPEED = 0.018; // radians per 60fps frame, before per-blob frequency

const BRAND_FALLBACK = [20, 118, 190]; // --color-brand  #1476be
const SIGNAL_FALLBACK = [239, 90, 40]; // --color-signal #ef5a28

/**
 * Hand-authored composition, not Math.random().
 *
 * A seeded field looks different on every reload and roughly one arrangement
 * in four is ugly — a blank left half, or both accents stacked. This is one
 * composition, art-directed against the mask at the bottom of this file: a
 * navy ground, a brand bloom off-centre right, signal bleeding in from the
 * top-right corner, and the left third kept near-black because the headline
 * sits there and has to hold contrast in both themes.
 *
 * ── TWO THINGS THAT ARE NOT OBVIOUS AND ARE BOTH LOAD-BEARING ────────────
 *  1. The radii are enormous — `r` is a multiple of the buffer's long edge,
 *     not a fraction of it. Blobs sized to fit inside the canvas read as seven
 *     circles no matter how soft the falloff; a mesh gradient only stops
 *     looking like discs when each source is larger than the frame and you are
 *     seeing a *slice* of it. Several anchors sit outside 0..1 for the same
 *     reason: their centres are off-canvas.
 *  2. The signal blobs are `over`, not additive. Brand blue and signal orange
 *     are near-complementary, so summing them lands on desaturated mauve — the
 *     exact grey-purple smear that gives away a naive additive field. Painting
 *     the accents over the blue body keeps the orange orange, and the soft
 *     edge still gives an organic transition band rather than a hard shape.
 *
 *   bx,by   anchor, normalised to the buffer (may sit outside 0..1)
 *   ax,ay   Lissajous amplitude          fx,fy  frequency (relative)
 *   r       diameter as a multiple of the buffer's long edge
 *   c       palette index                a      base alpha
 *   over    paint over instead of summing — see (2)
 *   pull    pointer response: + repels, − draws in
 *   bleed   how much it swells under the cursor
 *   hot     participates in the service-pill warm-up
 */
const BLOBS = [
  /* Cool body — additive, so overlaps bloom into shapes no single blob has. */
  { bx: 0.3, by: -0.05, ax: 0.075, ay: 0.055, fx: 0.23, fy: 0.31, ph1: 0.4, ph2: 2.1, r: 1.2, c: 2, a: 0.34, over: false, pull: 0.7, bleed: 0.14, hot: false },
  { bx: 1.05, by: 0.62, ax: 0.06, ay: 0.085, fx: 0.19, fy: 0.27, ph1: 1.9, ph2: 0.6, r: 1.35, c: 2, a: 0.6, over: false, pull: -0.5, bleed: 0.12, hot: false },
  { bx: 0.76, by: 0.14, ax: 0.09, ay: 0.065, fx: 0.29, fy: 0.21, ph1: 3.1, ph2: 1.2, r: 0.95, c: 1, a: 0.4, over: false, pull: 1.0, bleed: 0.22, hot: false },
  { bx: 0.52, by: 0.3, ax: 0.11, ay: 0.07, fx: 0.17, fy: 0.37, ph1: 0.9, ph2: 4.0, r: 1.1, c: 0, a: 0.28, over: false, pull: 0.8, bleed: 0.18, hot: false },
  { bx: 0.1, by: 0.85, ax: 0.08, ay: 0.06, fx: 0.26, fy: 0.18, ph1: 2.4, ph2: 3.3, r: 1.1, c: 2, a: 0.34, over: false, pull: -0.8, bleed: 0.12, hot: false },
  /* Signal accents — painted over the body, never summed into it. */
  { bx: 1.1, by: 0.0, ax: 0.05, ay: 0.05, fx: 0.33, fy: 0.24, ph1: 5.0, ph2: 1.8, r: 0.78, c: 3, a: 0.78, over: true, pull: 1.3, bleed: 0.26, hot: true },
  { bx: 0.88, by: 0.44, ax: 0.075, ay: 0.055, fx: 0.41, fy: 0.3, ph1: 3.7, ph2: 0.2, r: 0.5, c: 4, a: 0.4, over: true, pull: 1.5, bleed: 0.34, hot: true },
];

/**
 * Additive on near-black is what makes the cool body bloom. On paper it clips
 * to white almost immediately and the whole field turns into a grey smear, so
 * light mode composites everything normally at a lower alpha — cores stay
 * translucent, which is what lets overlaps still mix — and the finished buffer
 * is multiplied into the page as a pigment wash rather than laid over it.
 */
const TONE = {
  dark: { op: "lighter", alpha: 1, blit: 1, blend: "normal" },
  // Multiply is a gentle operator on near-white, so the light values are much
  // higher than they look — at the dark mode's alphas the wash disappeared
  // entirely on paper. These are tuned to sit *under* --text at its lowest
  // contrast, not to match the dark field's intensity.
  light: { op: "source-over", alpha: 0.9, blit: 0.92, blend: "multiply" },
};

const HEX = /^#?([0-9a-f]{6})$/i;

/* Tokens, not literals: --color-brand can be retuned in globals.css without a
   second edit here. Falls back to the constants if the token is missing. */
function readToken(name, fallback) {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const hex = HEX.exec(raw);
    if (hex) {
      const n = parseInt(hex[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const m = raw.match(/\d+(?:\.\d+)?/g);
    if (m && m.length >= 3) return [Math.round(+m[0]), Math.round(+m[1]), Math.round(+m[2])];
  } catch {
    /* getComputedStyle can throw in a detached document during fast refresh */
  }
  return fallback;
}

/* amt > 0 lightens toward white, amt < 0 darkens toward black. */
const shade = (rgb, amt) =>
  rgb.map((c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)));

export default function HeroCanvas({ field }) {
  const host = useRef(null);
  const cv = useRef(null);
  const grainRef = useRef(null);

  useGSAP(
    () => {
      const canvas = cv.current;
      const box = host.current;
      if (!canvas || !box) return;

      const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
      if (!ctx) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const brand = readToken("--color-brand", BRAND_FALLBACK);
      const signal = readToken("--color-signal", SIGNAL_FALLBACK);
      const PALETTE = [
        brand,
        readToken("--color-brand-hi", shade(brand, 0.22)),
        shade(brand, -0.46), // deep — gives the field a floor to bloom off
        signal,
        shade(signal, 0.18), // ember
      ];

      /* ── Blob sprites ─────────────────────────────────────────────────── */
      /* Near-gaussian, deliberately shoulderless. An earlier version dropped to
         half alpha by 0.18 and every blob showed a bright core with a readable
         edge — seven lamps, not a field. The ramp below is still falling at
         0.72, which is what makes a blob's own boundary impossible to locate.
         Six stops, because four is where banding starts on 8-bit panels. */
      const makeSprite = (rgb) => {
        const c = document.createElement("canvas");
        c.width = SPRITE;
        c.height = SPRITE;
        const g = c.getContext("2d");
        const h = SPRITE / 2;
        const grad = g.createRadialGradient(h, h, 0, h, h, h);
        const s = `${rgb[0]},${rgb[1]},${rgb[2]}`;
        grad.addColorStop(0, `rgba(${s},1)`);
        grad.addColorStop(0.3, `rgba(${s},0.76)`);
        grad.addColorStop(0.52, `rgba(${s},0.44)`);
        grad.addColorStop(0.72, `rgba(${s},0.18)`);
        grad.addColorStop(0.89, `rgba(${s},0.04)`);
        grad.addColorStop(1, `rgba(${s},0)`);
        g.fillStyle = grad;
        g.fillRect(0, 0, SPRITE, SPRITE);
        return c;
      };
      const sprites = PALETTE.map(makeSprite);

      /* ── Compositing buffer ───────────────────────────────────────────── */
      const off = document.createElement("canvas");
      const octx = off.getContext("2d", { alpha: true });
      if (!octx) return;

      /* Mutable state, all in the closure — nothing is read from React. */
      let W = 0;
      let H = 0;
      let LW = LOW_W;
      let LH = 160;
      let unit = LOW_W;
      let dark = document.documentElement.classList.contains("dark");
      let t = 0;
      let warm = 0; // smoothed service-pill boost

      // Two independent gates, ANDed at draw time. Collapsing them into one
      // `visible` flag loses state: returning to a backgrounded tab would leave
      // the canvas frozen, because the IntersectionObserver has nothing new to
      // report and never fires again.
      let onScreen = true;
      let tabVisible = true;

      /* Per-blob runtime: offsets are stored in *unit fractions*, not pixels,
         so a resize never has to rescale them. */
      const state = BLOBS.map(() => ({ ox: 0, oy: 0, vx: 0, vy: 0, sw: 1 }));
      const cur = { x: 0.5, y: 0.4, vx: 0, vy: 0, amp: 0 }; // the cursor's own blob

      const applyTone = () => {
        const tone = dark ? TONE.dark : TONE.light;
        canvas.style.mixBlendMode = tone.blend;
      };

      const resize = () => {
        const r = box.getBoundingClientRect();
        W = r.width;
        H = r.height;
        if (W < 1 || H < 1) return;

        // DPR capped at 2 — and it barely matters here, because the source is
        // 256px wide either way. It only affects the smoothness of the blit.
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        // Setting .width resets all context state, so the transform goes after.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        LW = LOW_W;
        LH = Math.round(gsap.utils.clamp(96, 384, LOW_W * (H / W)));
        if (off.width !== LW || off.height !== LH) {
          off.width = LW;
          off.height = LH;
        }
        unit = Math.max(LW, LH);
      };

      /* ── Frame ────────────────────────────────────────────────────────── */
      const draw = (f, dt) => {
        if (!onScreen || !tabVisible || W < 1) return;

        const tone = dark ? TONE.dark : TONE.light;
        const engaged = f ? f.active && f.fine : false;
        const mx = (f ? f.x : 0.62) * LW;
        const my = (f ? f.y : 0.35) * LH;

        t += dt;

        // Boost is smoothed here rather than at the source so HeroIntro can set
        // it as a bare 0/1 on pointerenter and never think about easing.
        const target = f && typeof f.boost === "number" ? f.boost : 0;
        warm += (target - warm) * (1 - Math.pow(0.9, dt));

        const reach = unit * 0.44;
        const damp = Math.pow(0.9, dt);

        octx.clearRect(0, 0, LW, LH);
        octx.globalCompositeOperation = tone.op;

        // BLOBS is ordered body-first, accents-last, so this flips the
        // compositing mode exactly once per frame rather than per blob.
        let op = tone.op;

        for (let i = 0; i < BLOBS.length; i++) {
          const b = BLOBS[i];
          const s = state[i];

          const want = b.over ? "source-over" : tone.op;
          if (want !== op) {
            octx.globalCompositeOperation = want;
            op = want;
          }

          // Ambient drift: fundamental plus a second harmonic at an unrelated
          // ratio, which is what stops the path closing into a visible loop.
          const p1 = t * SPEED * b.fx + b.ph1;
          const p2 = t * SPEED * b.fy + b.ph2;
          const bx =
            (b.bx + Math.cos(p1) * b.ax + Math.cos(p2 * 2.37) * b.ax * 0.28) * LW;
          const by =
            (b.by + Math.sin(p2) * b.ay + Math.sin(p1 * 1.73) * b.ay * 0.31) * LH;

          // Pointer displacement field.
          let tox = 0;
          let toy = 0;
          let infl = 0;
          if (engaged) {
            const dx = bx - mx;
            const dy = by - my;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < reach && d > 0.5) {
              // Squared falloff, not linear: a linear one makes the whole field
              // shove sideways as the cursor crosses it, which reads as a bug.
              const k = 1 - d / reach;
              infl = k * k;
              tox = (dx / d) * infl * b.pull * 0.16;
              toy = (dy / d) * infl * b.pull * 0.16;
            }
          }

          // Spring, not lerp. The overshoot is the inertia — it is the whole
          // reason the mesh bleeds closed behind the cursor instead of
          // snapping back to rest with it.
          s.vx += (tox - s.ox) * 0.055 * dt;
          s.vy += (toy - s.oy) * 0.055 * dt;
          s.vx *= damp;
          s.vy *= damp;
          s.ox += s.vx * dt;
          s.oy += s.vy * dt;

          const swellT = 1 + infl * b.bleed + (b.hot ? warm * 0.34 : 0);
          s.sw += (swellT - s.sw) * (1 - Math.pow(0.88, dt));

          const size = b.r * unit * s.sw;
          const x = bx + s.ox * unit;
          const y = by + s.oy * unit;

          octx.globalAlpha = b.a * tone.alpha * (b.hot ? 1 + warm * 0.55 : 1);
          octx.drawImage(sprites[b.c], x - size / 2, y - size / 2, size, size);
        }

        /* The cursor's own blob. Springs toward the pointer with a heavier lag
           than the field, so it trails rather than sticks — a blob pinned to
           the cursor reads as a mouse decoration, not as fluid. */
        octx.globalCompositeOperation = "source-over"; // the wake is a signal blob

        if (engaged) {
          cur.vx += (f.x - cur.x) * 0.045 * dt;
          cur.vy += (f.y - cur.y) * 0.045 * dt;
        }
        cur.vx *= damp;
        cur.vy *= damp;
        cur.x += cur.vx * dt;
        cur.y += cur.vy * dt;
        cur.amp += ((engaged ? 1 : 0) - cur.amp) * (1 - Math.pow(0.94, dt));

        if (cur.amp > 0.01) {
          // Speed-reactive: a fast drag swells and brightens the wake. Kept
          // large and faint on purpose — a small bright one is a mouse
          // decoration, and the point is that the *field* responds.
          const spd = Math.min(1, Math.sqrt(cur.vx * cur.vx + cur.vy * cur.vy) * 26);
          const size = unit * (0.55 + spd * 0.3);
          octx.globalAlpha = (0.2 + spd * 0.18) * cur.amp * tone.alpha;
          octx.drawImage(
            sprites[3],
            cur.x * LW - size / 2,
            cur.y * LH - size / 2,
            size,
            size
          );
        }

        octx.globalAlpha = 1;
        octx.globalCompositeOperation = "source-over";

        /* Blit. The upsample from 256px is the blur — bilinear filtering over a
           source with no hard edges in it is a free gaussian. */
        ctx.clearRect(0, 0, W, H);
        ctx.globalAlpha = tone.blit;
        ctx.drawImage(off, 0, 0, LW, LH, 0, 0, W, H);
        ctx.globalAlpha = 1;
      };

      /* ── Grain ────────────────────────────────────────────────────────── */
      /* Rasterised once into a data URL and handed to CSS, so it costs nothing
         per frame. Without it the upsampled gradient shows faint banding on
         8-bit panels, which is the single tell that gives away a cheap mesh. */
      if (grainRef.current) {
        const gc = document.createElement("canvas");
        gc.width = 96;
        gc.height = 96;
        const gg = gc.getContext("2d");
        const img = gg.createImageData(96, 96);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = 128 + (Math.random() * 2 - 1) * 58;
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
          d[i + 3] = 255;
        }
        gg.putImageData(img, 0, 0);
        grainRef.current.style.backgroundImage = `url(${gc.toDataURL()})`;
      }

      /* ── Wiring ───────────────────────────────────────────────────────── */
      applyTone();
      resize();

      if (reduced) {
        // One static frame. The composition is the point; the motion is not.
        draw(null, 1);
        return;
      }

      const ro = new ResizeObserver(resize);
      ro.observe(box);

      // Never paint a hero canvas while the reader is in the footer. Largest
      // single saving in the file, and it costs four lines.
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

      // next-themes writes class="dark" on <html>; both the compositing mode
      // and the blend mode hang off it, so the field has to hear the flip.
      const mo = new MutationObserver(() => {
        const next = document.documentElement.classList.contains("dark");
        if (next === dark) return;
        dark = next;
        applyTone();
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
        gsap.ticker.add((time, delta) => draw(null, Math.min(delta, 33.4) / 16.6667));
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
        // Two masks intersected: a radial that keeps the mass upper-right, and
        // a linear that fades the field out before it reaches the evidence
        // strip. Masking the container costs one composite; masking inside the
        // canvas would cost a second full-surface pass every frame.
        maskImage:
          "radial-gradient(120% 96% at 74% 16%, #000 8%, rgba(0,0,0,0.62) 46%, transparent 86%), linear-gradient(to bottom, #000 58%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(120% 96% at 74% 16%, #000 8%, rgba(0,0,0,0.62) 46%, transparent 86%), linear-gradient(to bottom, #000 58%, transparent 100%)",
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }}
    >
      <canvas ref={cv} className="block h-full w-full" />
      <div
        ref={grainRef}
        className="absolute inset-0 opacity-[0.055] mix-blend-overlay"
        style={{ backgroundRepeat: "repeat", backgroundSize: "96px 96px" }}
      />
    </div>
  );
}
