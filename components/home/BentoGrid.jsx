"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import SectionIndex from "@/components/ui/SectionIndex";
import ArrowLink from "@/components/ui/ArrowLink";
import { SERVICE_MEDIA } from "@/lib/taxonomy";
import { cn, pad } from "@/lib/utils";

/**
 * Asymmetric bento, built as a 12-column grid with a 1px gap over a --line
 * background. The gap IS the border, so every rule in the block is exactly one
 * hairline wide and perfectly continuous — something you cannot get from
 * per-card `border` without doubling up at every seam.
 *
 * Spans are written out (not computed) so Tailwind's static extractor emits them.
 * Reading order top-left → bottom-right matches Service.order, so the visual
 * hierarchy and the data hierarchy do not disagree.
 *
 * ── THE ONE CONSTRAINT EVERY EFFECT HERE HAD TO RESPECT ──────────────────
 * The hairlines are negative space. That single fact decides the whole file:
 *
 *  · The spotlight cannot be drawn on top — it is painted BEHIND the cells, on
 *    a negative-z layer above the container's --line background. The cells are
 *    opaque, so the only place the brand light escapes is the 1px seams. The
 *    grid appears to be lit from underneath because it literally is.
 *  · The tilt cannot be applied to the cell. Rotating a cell in 3D pulls its
 *    edges away from its neighbours and the continuous rules visibly come
 *    apart. The tilt goes on an inner plane; the cell box stays rigid, so the
 *    seams never move a subpixel.
 *  · The reveal cannot clip the cells. A cell mid-clip is transparent, and what
 *    is behind it is --line — so a staggered cell clip flashes the block solid
 *    grey. The container reveals as one unit and the cell *contents* stagger,
 *    which also reads better: an empty wireframe that fills in.
 *
 * ── PERFORMANCE ──────────────────────────────────────────────────────────
 *  · One pointermove listener on the grid, and it only records coordinates.
 *    Every calculation happens once per frame in a single gsap.ticker callback,
 *    so a 1000Hz mouse costs exactly what a 125Hz one does.
 *  · quickSetter/quickTo throughout — no tween allocation per frame, no GC
 *    sawtooth. CSS variables are written with gsap.quickSetter(el, "--mx",
 *    "px"); quickTo does NOT work on custom properties (it rejects the unit and
 *    warns), which is why the spotlight smoothing is lerped by hand below.
 *  · At most one getBoundingClientRect per frame, and only when the pointer
 *    actually moved. It cannot be cached: ScrollSmoother translates this
 *    subtree and keeps easing after the scroll events stop.
 *  · An IntersectionObserver parks the whole ticker when the block is off
 *    screen — which, on a page this long, is most of the time.
 *  · Everything pointer-driven is gated on a fine pointer, so a phone ships
 *    zero of it.
 */

const SPANS = [
  "lg:col-span-7 lg:row-span-2", // 01 — hero cell, carries artwork
  "lg:col-span-5", // 02
  "lg:col-span-5", // 03
  "lg:col-span-4", // 04
  "lg:col-span-4", // 05
  "lg:col-span-4", // 06
  "lg:col-span-12", // 07 — full-width closer
];

/* ── Tuning. Every number a designer would argue about, in one place. ───── */
const TRACK = 0.16; // spotlight lerp per 60fps frame — the light trails the cursor
const TILT_X = 5; // degrees. Past ~7 the seams read as broken even on a plane
const TILT_Y = 6.5;
const PARALLAX = 9; // px of travel at data-depth="1"
const PAN = 3.2; // percent the hero artwork counter-drifts inside its frame

/**
 * Corner brackets, drawn on hover.
 *
 * The brief asked for morphing hairline borders. The bento's hairlines are the
 * 1px grid gap over a --line background — CSS, not SVG, with no path to morph.
 * Rebuilding the block as SVG to enable a morph would throw away the technique
 * Phase 3 chose deliberately. These brackets deliver the same intent (precision
 * instrumentation) with DrawSVG, and cost two 20px strokes per cell.
 *
 * ── WHY drawSVG GOES "50% 50%" → "0% 100%" ───────────────────────────────
 * Both legs are exactly 20 units, so the path's midpoint IS the corner vertex.
 * Growing the visible segment outward from 50% draws both legs at once, from
 * the corner — the bracket *snaps into place* around the cell. The obvious
 * "0%" → "100%" instead draws one continuous line that starts at the bottom of
 * the left leg, turns the corner, and continues right: a squiggle finding its
 * way, not an instrument locking on.
 *
 * These sit on the cell, NOT on the tilting plane, so they stay welded to the
 * true grid corners while the content tips.
 */
function CornerBrackets() {
  // Two fixed 22×22 SVGs pinned to opposing corners, rather than one stretched
  // overlay: SVG path data has no calc(), so a percentage-positioned corner is
  // not expressible in `d`. Fixed boxes also keep the bracket a constant 20px
  // regardless of how tall the cell grows.
  const bracket = "M 1 21 L 1 1 L 21 1";
  return (
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 22 22"
        fill="none"
        className="pointer-events-none absolute top-0 left-0 z-10 size-5.5"
      >
        <path
          data-bracket
          d={bracket}
          stroke="var(--color-signal)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 22 22"
        fill="none"
        className="pointer-events-none absolute right-0 bottom-0 z-10 size-5.5 rotate-180"
      >
        <path
          data-bracket
          d={bracket}
          stroke="var(--color-signal)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </>
  );
}

export default function BentoGrid({ services }) {
  const root = useRef(null);
  const gridRef = useRef(null);

  /* ── Scroll reveal ──────────────────────────────────────────────────── */
  /**
   * Played on enter rather than scrubbed. The previous version scrubbed a
   * y/fade, which is fine for transforms — but clip-path cannot be scrubbed
   * comfortably: it is a paint-level property, and dragging seven of them
   * backwards and forwards on a fast flick shows tearing on the cheaper
   * compositors. A played timeline also lets the container settle *before* the
   * contents cascade, which is the whole shape of the reveal.
   */
  useGSAP(
    () => {
      const grid = gridRef.current;
      if (!grid) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const planes = gsap.utils.toArray("[data-bento-plane]", grid);

        const tl = gsap.timeline({
          scrollTrigger: { trigger: grid, start: "top 82%", once: true },
        });

        tl.from(
          grid,
          { scale: 0.955, y: 28, autoAlpha: 0, duration: 0.95, ease: "power3.out" },
          0
        ).fromTo(
          planes,
          // fromTo, not from: with no clip-path authored in CSS the computed
          // value is `none`, and GSAP cannot interpolate a shape to a keyword.
          { clipPath: "inset(0% 0% 100% 0%)", y: 24, autoAlpha: 0 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            y: 0,
            autoAlpha: 1,
            duration: 0.85,
            ease: "power3.out",
            stagger: { each: 0.065, from: "start" },
            // Drop the property once it has served its purpose. A permanent
            // inset(0) still forces a clipping context on every cell for the
            // life of the page, for no visual gain.
            onComplete: () => gsap.set(planes, { clearProps: "clipPath" }),
          },
          0.18
        );

        // The container keeps a scale transform at rest otherwise, which makes
        // the 1px hairlines land on fractional pixels and go soft.
        tl.set(grid, { clearProps: "transform" });
      });

      return () => mm.revert();
    },
    { scope: root, dependencies: [] }
  );

  /* ── Pointer: spotlight, tilt, parallax, brackets, image pan ────────── */
  useGSAP(
    () => {
      const grid = gridRef.current;
      if (!grid) return;
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const cells = gsap.utils.toArray("[data-bento-cell]", grid);
      if (!cells.length) return;

      /* Grid-level spotlight. Written as px rather than % so the gradient's
         `circle` keeps a true radius — a percentage position on a 7-row block
         skews the falloff into an ellipse. */
      const setMX = gsap.quickSetter(grid, "--mx", "px");
      const setMY = gsap.quickSetter(grid, "--my", "px");
      const glow = grid.querySelector("[data-bento-glow]");

      let gx = 0;
      let gy = 0; // smoothed spotlight, grid-local px
      let tx = 0;
      let ty = 0; // target
      let cx = 0;
      let cy = 0; // raw client px
      let moved = false;
      let inside = false;
      let onScreen = true;
      let primed = false; // has the spotlight ever had a real position?

      /* Per-cell rigs, built on first hover and cached. Building all seven up
         front would be seven sets of quickTos for six cells the visitor may
         never touch. */
      const rigs = new Map();
      const rigFor = (cell) => {
        let r = rigs.get(cell);
        if (r) return r;

        const plane = cell.querySelector("[data-bento-plane]");
        const media = cell.querySelector("[data-bento-media]");
        const depths = gsap.utils.toArray("[data-depth]", cell);

        r = {
          plane,
          media,
          glow: cell.querySelector("[data-cell-glow]"),
          brackets: cell.querySelectorAll("[data-bracket]"),
          setCX: gsap.quickSetter(cell, "--cx", "px"),
          setCY: gsap.quickSetter(cell, "--cy", "px"),
          rx: gsap.quickTo(plane, "rotateX", { duration: 0.55, ease: "power3.out" }),
          ry: gsap.quickTo(plane, "rotateY", { duration: 0.55, ease: "power3.out" }),
          depths: depths.map((el) => ({
            set: gsap.quickSetter(el, "css"),
            d: Number(el.dataset.depth) || 0,
          })),
          mx: media && gsap.quickTo(media, "xPercent", { duration: 0.8, ease: "power3.out" }),
          my: media && gsap.quickTo(media, "yPercent", { duration: 0.8, ease: "power3.out" }),
        };

        // transformPerspective per element: an inherited perspective would need
        // transform-style: preserve-3d on the whole chain, and preserve-3d on a
        // cell that also clips would break the clip.
        gsap.set(plane, { transformPerspective: 1000, transformOrigin: "50% 50%" });
        rigs.set(cell, r);
        return r;
      };

      let active = null;

      const engage = (cell) => {
        const r = rigFor(cell);
        r.plane.style.willChange = "transform";
        gsap.to(r.glow, { opacity: 1, duration: 0.4, ease: "power2.out", overwrite: "auto" });
        gsap.to(r.brackets, {
          drawSVG: "0% 100%",
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.06,
          overwrite: "auto",
        });
        if (r.media) gsap.to(r.media, { scale: 1.06, duration: 0.9, ease: "power3.out", overwrite: "auto" });
      };

      const release = (cell) => {
        const r = rigs.get(cell);
        if (!r) return;
        r.plane.style.willChange = "auto";
        gsap.to(r.plane, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.85,
          ease: "elastic.out(1, 0.6)",
          overwrite: "auto",
        });
        gsap.to(r.glow, { opacity: 0, duration: 0.45, ease: "power2.out", overwrite: "auto" });
        gsap.to(r.brackets, {
          drawSVG: "50% 50%",
          opacity: 0,
          duration: 0.32,
          ease: "power2.in",
          overwrite: "auto",
        });
        r.depths.forEach((p) => p.set({ x: 0, y: 0 }));
        if (r.media) {
          r.mx(0);
          r.my(0);
          gsap.to(r.media, { scale: 1, duration: 0.7, ease: "power3.out", overwrite: "auto" });
        }
      };

      /* ── Listeners: record only ───────────────────────────────────────
         pointerover/pointerout rather than enter/leave so one delegated pair
         covers all seven cells including the seams between them — moving
         across the block never leaves two cells lit. */
      /* Idempotent, and called from pointermove as well as pointerenter.
         pointerenter only fires on a *crossing* — scroll the block up under a
         stationary cursor and the pointer is inside having never entered, so
         the enter event alone leaves the spotlight dark until the visitor
         happens to leave and come back. */
      const enterGrid = () => {
        if (inside) return;
        inside = true;
        gsap.to(glow, { opacity: 1, duration: 0.45, ease: "power2.out", overwrite: "auto" });
      };

      const onMove = (e) => {
        // Taken in the pointer handler, where the browser has already flushed
        // style for hit-testing. It cannot be cached: ScrollSmoother translates
        // this subtree and keeps easing after the scroll events stop.
        const b = grid.getBoundingClientRect();
        cx = e.clientX;
        cy = e.clientY;
        tx = cx - b.left;
        ty = cy - b.top;
        if (!primed) {
          // Seed the smoothed value on first contact, otherwise the spotlight
          // sweeps in from the grid's top-left corner on every entry.
          gx = tx;
          gy = ty;
          primed = true;
        }
        moved = true;
        enterGrid();
      };

      const onLeave = (e) => {
        if (e.relatedTarget && grid.contains(e.relatedTarget)) return;
        inside = false;
        gsap.to(glow, { opacity: 0, duration: 0.6, ease: "power2.out", overwrite: "auto" });
        if (active) release(active);
        active = null;
      };

      const onOver = (e) => {
        const cell = e.target.closest?.("[data-bento-cell]");
        if (!cell || cell === active) return;
        if (active) release(active);
        active = cell;
        engage(cell);
      };

      /* ── One clock ───────────────────────────────────────────────────── */
      const tick = (time, deltaTime) => {
        if (!onScreen || !primed) return;

        const frames = Math.min(deltaTime, 50) / 16.6667;
        // Exponential form, not `v * 0.16` — a constant per-frame factor
        // converges twice as fast on a 120Hz panel as on a 60Hz one, which is
        // how the same code ends up feeling tight on a laptop and laggy on an
        // external monitor.
        const k = 1 - Math.pow(1 - TRACK, frames);
        gx += (tx - gx) * k;
        gy += (ty - gy) * k;
        setMX(gx);
        setMY(gy);

        // Everything below is per-cell and only changes when the pointer does.
        // `moved` is load-bearing for the quickTos: quickTo restarts its tween
        // on every call, so calling it every frame with an unchanged value pins
        // the tween at t=0 and the tilt silently freezes mid-rotation.
        if (!active || !moved || !inside) {
          moved = false;
          return;
        }
        moved = false;

        const r = active.getBoundingClientRect();
        const lx = cx - r.left;
        const ly = cy - r.top;
        const nx = lx / r.width - 0.5;
        const ny = ly / r.height - 0.5;
        const rig = rigFor(active);

        rig.setCX(lx);
        rig.setCY(ly);

        rig.rx(-ny * TILT_X);
        rig.ry(nx * TILT_Y);

        for (let i = 0; i < rig.depths.length; i++) {
          const p = rig.depths[i];
          p.set({ x: nx * p.d * PARALLAX, y: ny * p.d * PARALLAX });
        }

        // The artwork counter-drifts inside its own frame. That opposition is
        // what separates a pan from a plain translation — the frame stays put
        // and the picture moves behind it, like a window.
        if (rig.mx) {
          rig.mx(nx * -PAN);
          rig.my(ny * -PAN);
        }
      };

      // Prime the bracket rest state for every cell up front — cheap, and it
      // has to happen before the first hover or the strokes flash at full
      // length for one frame.
      cells.forEach((cell) => {
        gsap.set(cell.querySelectorAll("[data-bracket]"), { drawSVG: "50% 50%", opacity: 0 });
      });

      const io = new IntersectionObserver(
        ([entry]) => {
          onScreen = entry.isIntersecting;
          if (!onScreen && active) {
            release(active);
            active = null;
          }
        },
        { rootMargin: "160px" }
      );
      io.observe(grid);

      grid.addEventListener("pointermove", onMove, { passive: true });
      grid.addEventListener("pointerenter", enterGrid);
      grid.addEventListener("pointerleave", onLeave);
      grid.addEventListener("pointerover", onOver);
      // gsap.ticker, not a private rAF: the grid advances on the same frame
      // boundary as the cursor, the hero mesh and every tween on the page.
      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        io.disconnect();
        grid.removeEventListener("pointermove", onMove);
        grid.removeEventListener("pointerenter", enterGrid);
        grid.removeEventListener("pointerleave", onLeave);
        grid.removeEventListener("pointerover", onOver);
        // r.media is null on every cell but the hero — gsap warns on a null
        // target, so it is filtered rather than passed through.
        rigs.forEach((r) =>
          gsap.killTweensOf([r.plane, r.glow, r.media, ...r.brackets].filter(Boolean))
        );
        rigs.clear();
      };
    },
    { scope: root, dependencies: [] }
  );

  return (
    <section ref={root} className="border-b border-(--line)">
      <div className="shell py-20 md:py-28">
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionIndex index="01" label="What we do" />
            <h2 className="text-heading mt-6 max-w-[19ch]">
              Seven disciplines,{" "}
              <span className="text-(--text-mute)">one delivery team.</span>
            </h2>
          </div>
          <p className="max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-4 lg:col-start-9">
            Engineering and visual production under the same roof, which is why a
            case study, its renders and its landing page ship in the same week
            instead of across three vendors.
          </p>
        </div>

        {/* `isolate` keeps the negative-z spotlight from escaping this block and
            sliding under the page background. */}
        <div
          ref={gridRef}
          data-bento-grid
          className="relative isolate mt-14 grid gap-px border border-(--line) bg-(--line) lg:grid-cols-12"
        >
          {/* ── The spotlight ───────────────────────────────────────────
              Painted on a negative-z layer, which in CSS paint order lands
              ABOVE this container's own --line background and BELOW every
              positioned cell. The cells are opaque, so the only place this
              light is visible is the 1px seams between them — the grid reads
              as lit from underneath, because it is.

              -inset-px so the glow also reaches the container's own 1px
              border; inset-0 covers the padding box only and would leave the
              outer rule conspicuously dead while the inner ones lit up.

              A gradient, not a blurred element: `blur` on a box this size is a
              full-surface filter pass every frame, a radial-gradient is one
              paint the compositor can keep. */}
          <span
            data-bento-glow
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px -z-10 opacity-0"
            style={{
              background:
                "radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, var(--color-brand) 95%, transparent), color-mix(in oklab, var(--color-brand) 35%, transparent) 38%, transparent 72%)",
            }}
          />

          {services.map((s, i) => {
            const hero = i === 0;
            return (
              <Link
                key={s._id}
                href={`/services/${s.slug}`}
                data-bento-cell
                className={cn(
                  // overflow-hidden is what lets the plane tip without any part
                  // of it crossing a hairline. relative (not z-indexed) puts the
                  // cell in the positioned-descendant layer, above the -z-10
                  // spotlight and below nothing.
                  "group relative block overflow-hidden bg-(--canvas) transition-colors duration-300 hover:bg-(--raised)",
                  SPANS[i]
                )}
              >
                {/* Per-cell pool of light, tracking the cursor inside this cell.
                    Same --mouse-x/--mouse-y idea as the grid, but cell-local, so
                    the highlight sits under the copy the visitor is reading
                    rather than at the block's centre of mass. */}
                <span
                  data-cell-glow
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0"
                  style={{
                    background:
                      "radial-gradient(320px circle at var(--cx, 50%) var(--cy, 50%), color-mix(in oklab, var(--color-brand) 16%, transparent), transparent 70%)",
                  }}
                />

                <CornerBrackets />

                {/* Signal rule wipes in on hover — replaces the glow/shadow lift */}
                <span
                  aria-hidden="true"
                  className="bg-signal absolute inset-x-0 top-0 z-10 h-px origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
                />

                {/* The tilting plane. Everything that moves in 3D is in here;
                    the cell box around it never rotates, so the seams hold. */}
                <div
                  data-bento-plane
                  // No will-change here on purpose: as a class it would promote
                  // all seven planes to their own compositor layers for the
                  // life of the page. It is set inline on engage and cleared on
                  // release, so at most one cell is ever promoted.
                  className="relative flex h-full flex-col p-7 md:p-9"
                >
                  <div data-depth="0.85" className="flex items-start justify-between gap-6">
                    <h3
                      className={cn(
                        "max-w-[15ch] font-semibold tracking-[-0.028em] text-(--text)",
                        hero ? "text-[clamp(1.6rem,1.1rem+1.7vw,2.4rem)]" : "text-[1.375rem]"
                      )}
                    >
                      {s.title}
                    </h3>
                    <span className="label-mono group-hover:text-signal shrink-0 pt-1.5 text-(--text-mute) transition-colors">
                      {pad(i + 1)}
                    </span>
                  </div>

                  <p
                    data-depth="0.5"
                    className={cn(
                      "mt-5 leading-relaxed text-(--text-mute)",
                      hero ? "max-w-lg text-[1rem]" : "text-[0.9375rem]"
                    )}
                  >
                    {s.shortDescription}
                  </p>

                  {hero && SERVICE_MEDIA[s.slug] && (
                    <div
                      data-depth="1.35"
                      className="relative mt-8 aspect-video overflow-hidden border border-(--line)"
                    >
                      {/* The 4% bleed is the headroom the pan moves inside.
                          Without it a 3% counter-drift exposes the frame edge,
                          which is the tell that separates a considered pan from
                          a transform someone bolted on. */}
                      <div data-bento-media className="absolute inset-[-4%]">
                        <Image
                          src={SERVICE_MEDIA[s.slug]}
                          alt=""
                          fill
                          sizes="(max-width: 1024px) 100vw, 55vw"
                          className="object-cover object-top opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                        />
                      </div>
                    </div>
                  )}

                  <div
                    data-depth="0.3"
                    className="mt-auto flex items-end justify-between gap-6 pt-8"
                  >
                    <span className="label-mono text-(--text-mute)">
                      {s.deliverableTimeline}
                    </span>
                    <span className="group-hover:text-signal text-sm font-medium text-(--text) transition-colors">
                      Read more ↗
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <ArrowLink href="/services">All services and how they are scoped</ArrowLink>
        </div>
      </div>
    </section>
  );
}
