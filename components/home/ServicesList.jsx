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
 * Services as a typographic index, not a card grid.
 *
 * ── WHY THIS REPLACED THE BENTO ──────────────────────────────────────────
 * A bento gives seven services seven boxes of roughly equal weight, and the
 * title inside a box can only ever be box-sized — around 22px. So the single
 * most valuable words on the section ("Custom Software", "3D Visualization")
 * were set smaller than the section heading above them. Setting them as a list
 * frees the title to run at display scale, which is the actual hierarchy: the
 * disciplines ARE the content here, and everything else is annotation.
 *
 * It also solves a problem the bento could not. Seven cells means seven
 * different column widths and four breakpoint variants; a list is one column at
 * every width and reads identically on a phone.
 *
 * ── THE RAIL EARNS ITS STICKINESS ────────────────────────────────────────
 * A sticky column that only holds a heading is a heading that refuses to leave.
 * This one carries a live preview frame: the artwork swaps to whichever
 * discipline is currently active, so the rail is doing work for the whole
 * length of the scroll. It is the reason the section can afford to have no
 * imagery in the rows at all — the rows stay pure type, and the picture lives
 * in one place where it can be looked at properly.
 *
 * ── ACTIVE IS TWO SOURCES, NOT ONE ───────────────────────────────────────
 * Hover decides the active row when there is a pointer. When there is not — a
 * phone, a trackpad user who is only scrolling — an IntersectionObserver with a
 * centre band picks whichever row is crossing the middle of the viewport. So
 * the preview and the counter are alive on touch, where a hover-only rig would
 * simply be dead. Hover wins whenever it is present, because an explicit intent
 * beats an inferred one.
 */

/**
 * Discipline groupings. Deliberately NOT on the Service model: this is an
 * editorial grouping for one section's right-hand column, and the moment it
 * becomes a database field someone will start filtering by it and it will need
 * an enum, a migration and an admin control. Keyed by slug, which slugify()
 * derives identically on both sides of the API — see Project.js SERVICE_TYPES.
 */
const DISCIPLINE = {
  "web-development": "Engineering",
  "custom-software": "Engineering",
  "mobile-applications": "Engineering",
  "product-design": "Design",
  "graphics-design": "Design",
  "architectural-visualization": "Visualization",
  "digital-marketing": "Growth",
};

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export default function ServicesList({ services }) {
  const root = useRef(null);
  const listRef = useRef(null);
  const railRef = useRef(null);

  const total = services.length;

  /* ── Reveal ─────────────────────────────────────────────────────────── */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const rows = gsap.utils.toArray("[data-svc-row]", listRef.current);

        const tl = gsap.timeline({
          scrollTrigger: { trigger: listRef.current, start: "top 80%", once: true },
        });

        tl.from(
          "[data-svc-rail] > *",
          { y: 22, autoAlpha: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" },
          0
        ).fromTo(
          rows,
          // fromTo, not from: with no clip-path authored in CSS the computed
          // value is `none`, and GSAP cannot interpolate a shape to a keyword.
          { clipPath: "inset(0% 0% 100% 0%)", y: 26, autoAlpha: 0 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            ease: "power3.out",
            stagger: { each: 0.07, from: "start" },
            // A permanent inset(0) leaves a clipping context on all seven rows
            // for the life of the page, for no visual gain once it has landed.
            onComplete: () => gsap.set(rows, { clearProps: "clipPath" }),
          },
          0.12
        );
      });

      return () => mm.revert();
    },
    { scope: root, dependencies: [] }
  );

  /* ── Active row → rail preview + counter ────────────────────────────── */
  useGSAP(
    () => {
      const list = listRef.current;
      const rail = railRef.current;
      if (!list || !rail) return;

      const rows = gsap.utils.toArray("[data-svc-row]", list);
      const shots = gsap.utils.toArray("[data-rail-shot]", rail);
      const caption = rail.querySelector("[data-rail-caption]");
      const meta = rail.querySelector("[data-rail-meta]");
      const counter = rail.querySelector("[data-rail-counter]");
      if (!rows.length || !shots.length) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let current = 0;
      let hovered = -1;
      let scrolled = 0;

      gsap.set(shots, { autoAlpha: 0 });
      gsap.set(shots[0], { autoAlpha: 1 });

      const apply = (next) => {
        if (next === current || next < 0 || next >= rows.length) return;
        const from = shots[current];
        const to = shots[next];
        current = next;

        // Crossfade with opposing scale. Both tweens run at once and the
        // outgoing one is slightly faster, so there is never a frame where the
        // frame reads as empty — a plain sequential fade always shows one.
        gsap.to(from, { autoAlpha: 0, scale: 1.05, duration: 0.5, ease: "power2.out", overwrite: "auto" });
        gsap.fromTo(
          to,
          { scale: 1.05 },
          { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power3.out", overwrite: "auto" }
        );

        const s = services[next];
        if (meta) meta.textContent = `${pad(next + 1)} — ${DISCIPLINE[s.slug] ?? "Studio"}`;
        if (counter) counter.textContent = pad(next + 1);

        if (caption) {
          if (reduced) caption.textContent = s.title;
          else
            gsap.to(caption, {
              duration: 0.45,
              ease: "none",
              scrambleText: {
                text: s.title,
                chars: SCRAMBLE_CHARS,
                speed: 0.6,
                revealDelay: 0.15,
                // The titles differ in length, so the box must not be pinned by
                // the tween's own length animation — the caption row is a fixed
                // height and the text simply resolves inside it.
                tweenLength: false,
              },
              overwrite: "auto",
            });
        }
      };

      const resolve = () => apply(hovered >= 0 ? hovered : scrolled);

      /* Scroll source. A centre band rather than a threshold: with
         `-45% 0px -45% 0px` only the row crossing the middle 10% of the
         viewport is intersecting, so exactly one row is ever the candidate and
         there is no tie to break. */
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const i = Number(e.target.dataset.index);
            if (Number.isNaN(i)) return;
            scrolled = i;
            if (hovered < 0) resolve();
          });
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
      );
      rows.forEach((r) => io.observe(r));

      /* Hover source. Delegated, and pointerover/pointerout rather than
         enter/leave so one pair covers all seven rows including the hairlines
         between them — travelling down the list never leaves two rows lit. */
      const onOver = (e) => {
        const row = e.target.closest?.("[data-svc-row]");
        if (!row) return;
        const i = Number(row.dataset.index);
        if (i === hovered) return;
        hovered = i;
        resolve();
      };

      const onOut = (e) => {
        if (e.relatedTarget && list.contains(e.relatedTarget)) return;
        hovered = -1;
        resolve();
      };

      list.addEventListener("pointerover", onOver);
      list.addEventListener("pointerout", onOut);

      return () => {
        io.disconnect();
        list.removeEventListener("pointerover", onOver);
        list.removeEventListener("pointerout", onOut);
        gsap.killTweensOf([...shots, caption].filter(Boolean));
      };
    },
    { scope: root, dependencies: [] }
  );

  /* ── Row hover choreography ─────────────────────────────────────────── */
  useGSAP(
    () => {
      const list = listRef.current;
      if (!list) return;
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const rigs = new Map();
      const rigFor = (row) => {
        let r = rigs.get(row);
        if (r) return r;
        r = {
          title: row.querySelector("[data-row-title]"),
          arrow: row.querySelector("[data-row-arrow]"),
          sweep: row.querySelector("[data-row-sweep]"),
          tint: row.querySelector("[data-row-tint]"),
          setX: gsap.quickSetter(row, "--mx", "px"),
          setY: gsap.quickSetter(row, "--my", "px"),
        };
        gsap.set(r.sweep, { scaleX: 0, transformOrigin: "0% 50%" });
        gsap.set(r.arrow, { autoAlpha: 0, x: -10 });
        rigs.set(row, r);
        return r;
      };

      let active = null;

      const engage = (row) => {
        const r = rigFor(row);
        gsap.to(r.title, { x: 18, duration: 0.55, ease: "power3.out", overwrite: "auto" });
        gsap.to(r.arrow, { autoAlpha: 1, x: 0, duration: 0.45, ease: "power3.out", overwrite: "auto" });
        gsap.to(r.sweep, {
          scaleX: 1,
          transformOrigin: "0% 50%",
          duration: 0.55,
          ease: "power3.out",
          overwrite: "auto",
        });
        gsap.to(r.tint, { opacity: 1, duration: 0.4, ease: "power2.out", overwrite: "auto" });
      };

      const release = (row) => {
        const r = rigs.get(row);
        if (!r) return;
        gsap.to(r.title, { x: 0, duration: 0.6, ease: "power3.out", overwrite: "auto" });
        gsap.to(r.arrow, { autoAlpha: 0, x: -10, duration: 0.3, ease: "power2.in", overwrite: "auto" });
        gsap.to(r.sweep, {
          scaleX: 0,
          transformOrigin: "100% 50%",
          duration: 0.35,
          ease: "power2.in",
          overwrite: "auto",
        });
        gsap.to(r.tint, { opacity: 0, duration: 0.45, ease: "power2.out", overwrite: "auto" });
      };

      /* The tint follows the cursor along the row. Coordinates are recorded
         here and written straight to two custom properties — no tween, because
         a lagging highlight on a 90px-tall row reads as a rendering fault
         rather than as smoothing. The rect cannot be cached: ScrollSmoother
         translates this subtree and keeps easing after the scroll stops. */
      const onMove = (e) => {
        if (!active) return;
        const r = active.getBoundingClientRect();
        const rig = rigFor(active);
        rig.setX(e.clientX - r.left);
        rig.setY(e.clientY - r.top);
      };

      const onOver = (e) => {
        const row = e.target.closest?.("[data-svc-row]");
        if (!row || row === active) return;
        if (active) release(active);
        active = row;
        engage(row);
      };

      const onOut = (e) => {
        if (!active) return;
        if (e.relatedTarget && list.contains(e.relatedTarget)) return;
        release(active);
        active = null;
      };

      list.addEventListener("pointerover", onOver);
      list.addEventListener("pointerout", onOut);
      list.addEventListener("pointermove", onMove, { passive: true });

      return () => {
        list.removeEventListener("pointerover", onOver);
        list.removeEventListener("pointerout", onOut);
        list.removeEventListener("pointermove", onMove);
        rigs.forEach((r) =>
          gsap.killTweensOf([r.title, r.arrow, r.sweep, r.tint].filter(Boolean))
        );
        rigs.clear();
      };
    },
    { scope: root, dependencies: [] }
  );

  return (
    <section ref={root} className="border-b border-(--line)">
      <div className="shell py-24 md:py-32">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,17rem)_1fr] lg:items-start lg:gap-20">
          {/* ── Sticky rail ──────────────────────────────────────────────
              top-28 clears the fixed Navbar. `self-start` is load-bearing:
              grid items stretch by default, and a stretched item is already as
              tall as the row — position:sticky then has no room to travel in
              and silently does nothing. This is the single most common reason a
              sticky column "doesn't work" inside a grid. */}
          <div
            ref={railRef}
            data-svc-rail
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <SectionIndex index="01" label="What we do" />

            <h2 className="text-heading mt-6 max-w-[16ch]">
              Seven disciplines,{" "}
              <span className="text-(--text-mute)">one delivery team.</span>
            </h2>

            <p className="mt-6 max-w-sm text-[0.9375rem] leading-relaxed text-(--text-dim)">
              Engineering and visual production under the same roof, which is why
              a case study, its renders and its landing page ship in the same
              week instead of across three vendors.
            </p>

            {/* Live preview. Hidden below lg — on a phone the rail is not
                sticky, so the frame would sit above the list as a single
                arbitrary image that never changes. */}
            <div className="mt-10 hidden lg:block">
              <div className="relative aspect-4/3 overflow-hidden border border-(--line) bg-(--raised)">
                {services.map((s, i) => (
                  <Image
                    key={s._id}
                    data-rail-shot
                    src={SERVICE_MEDIA[s.slug] ?? SERVICE_MEDIA["web-development"]}
                    alt=""
                    fill
                    // The frame is 17rem wide and only ever renders on lg+, so
                    // asking for a viewport-width source would download seven
                    // full-size images to show them at 272px.
                    sizes="272px"
                    priority={i === 0}
                    className="object-cover object-top"
                  />
                ))}

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-linear-to-t from-(--canvas) via-(--canvas)/20 to-transparent"
                />

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p
                      data-rail-caption
                      className="truncate text-[0.9375rem] font-medium text-(--text)"
                    >
                      {services[0]?.title}
                    </p>
                    <p data-rail-meta className="label-mono mt-2 text-(--text-mute)">
                      {`01 — ${DISCIPLINE[services[0]?.slug] ?? "Studio"}`}
                    </p>
                  </div>
                  <p className="label-mono shrink-0 text-(--text-mute)">
                    <span data-rail-counter className="nums text-signal">
                      01
                    </span>
                    <span aria-hidden="true"> / {pad(total)}</span>
                  </p>
                </div>
              </div>
            </div>

            <ArrowLink href="/services" className="mt-8">
              All services and how they are scoped
            </ArrowLink>
          </div>

          {/* ── The index ────────────────────────────────────────────────
              A real <ul>. Seven links in a row of divs is a list that has been
              talked out of admitting it, and a screen reader announces "list,
              7 items" for free. */}
          <ul ref={listRef} className="border-b border-(--line)">
            {services.map((s, i) => (
              <li key={s._id}>
                <Link
                  href={`/services/${s.slug}`}
                  data-svc-row
                  data-index={i}
                  data-cursor="view"
                  data-cursor-image={SERVICE_MEDIA[s.slug]}
                  data-cursor-label={s.title}
                  className="group relative block overflow-hidden border-t border-(--line) py-8 md:py-10"
                >
                  {/* Brand wash tracking the cursor along the row. A gradient,
                      not a blurred box: `blur` here is a full-surface filter
                      pass every frame; a radial-gradient is one paint. */}
                  <span
                    data-row-tint
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0"
                    style={{
                      background:
                        "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, var(--color-brand) 13%, transparent), transparent 72%)",
                    }}
                  />

                  {/* Sits ON the row's own hairline rather than beside it, so
                      the rule appears to catch light rather than gaining a
                      second line underneath it. */}
                  <span
                    data-row-sweep
                    aria-hidden="true"
                    className="bg-signal absolute -top-px right-0 left-0 h-px origin-left"
                  />

                  <div className="relative flex items-start justify-between gap-6 md:gap-10">
                    <div className="flex min-w-0 items-center gap-4">
                      <h3
                        data-row-title
                        className="text-[clamp(1.6rem,1.05rem+1.9vw,2.9rem)] leading-[1.05] font-semibold tracking-[-0.032em] text-(--text) transition-colors duration-300 group-hover:text-signal"
                      >
                        {s.title}
                      </h3>
                      <svg
                        data-row-arrow
                        width="20"
                        height="20"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        aria-hidden="true"
                        className="text-signal hidden shrink-0 md:block"
                      >
                        <path
                          d="M4 12 12 4M5.6 4h6.4v6.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <div className="label-mono shrink-0 pt-2 text-right text-(--text-mute)">
                      <span className="nums block text-signal">{pad(i + 1)}</span>
                      <span className="mt-2 block">{DISCIPLINE[s.slug] ?? "Studio"}</span>
                    </div>
                  </div>

                  <div className="relative mt-4 flex flex-col gap-3 md:mt-5 md:flex-row md:items-baseline md:justify-between md:gap-10">
                    <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-(--text-mute)">
                      {s.shortDescription}
                    </p>
                    {s.deliverableTimeline && (
                      <span className="label-mono shrink-0 text-(--text-mute)">
                        {s.deliverableTimeline}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
