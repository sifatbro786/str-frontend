"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, Draggable } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * Draggable rail for the SUPPORTING quotes only.
 *
 * The lead quote stays large and static in Testimonials.jsx. That hierarchy is
 * the point of the section — the original component's own note argues against a
 * carousel because "it would hide three of the four quotes behind an
 * interaction nobody performs", and a uniform slider would flatten the one
 * quote that has been given weight. So the lead is never in here.
 *
 * Degrades honestly: if the cards already fit their container, `bounds` collapse
 * to zero, Draggable becomes inert and this renders as a plain row. Nothing
 * needs to know how many testimonials exist.
 *
 * Keyboard: Draggable gives you nothing for keyboard users, so the arrow
 * buttons and ArrowLeft/ArrowRight handling below are not optional polish —
 * a drag-only carousel is an accessibility failure.
 */
function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default function TestimonialSlider({ items, projectsById = {} }) {
  const root = useRef(null);
  const track = useRef(null);
  const [canScroll, setCanScroll] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const maxX = () => Math.min(0, root.current.offsetWidth - track.current.scrollWidth);
        setCanScroll(maxX() < 0);
        if (maxX() >= 0) return;

        const [drag] = Draggable.create(track.current, {
          type: "x",
          bounds: { minX: maxX(), maxX: 0 },
          inertia: true,
          edgeResistance: 0.85,
          cursor: "grab",
          activeCursor: "grabbing",
          // Without this the rail swallows vertical page scroll on touch.
          allowNativeTouchScrolling: true,
        });

        const onResize = () => {
          drag.applyBounds({ minX: maxX(), maxX: 0 });
          setCanScroll(maxX() < 0);
        };
        window.addEventListener("resize", onResize);

        return () => {
          window.removeEventListener("resize", onResize);
          drag.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: root, dependencies: [items.length] }
  );

  /** Steps one card width, clamped to the same bounds Draggable uses. */
  function step(direction) {
    const card = track.current?.firstElementChild;
    if (!card) return;
    const width = card.offsetWidth + 1; // +1px for the hairline gap
    const maxX = Math.min(0, root.current.offsetWidth - track.current.scrollWidth);
    const current = gsap.getProperty(track.current, "x");
    const next = gsap.utils.clamp(maxX, 0, current - direction * width);
    gsap.to(track.current, { x: next, duration: 0.5, ease: "power3.out" });
  }

  function onKeyDown(e) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="lg:col-span-5 lg:col-start-8">
      <div
        ref={root}
        data-cursor={canScroll ? "drag" : undefined}
        className="overflow-hidden"
      >
        <div
          ref={track}
          tabIndex={0}
          role="group"
          aria-label="More client quotes. Use the left and right arrow keys to move between them."
          onKeyDown={onKeyDown}
          className={cn(
            "flex gap-px bg-(--line) will-change-transform",
            // Cards only need to be wider than the rail once there are enough
            // of them to overflow; below that they simply fill it.
            "lg:flex-col"
          )}
        >
          {items.map((t) => {
            const project = t.projectRef ? projectsById[t.projectRef?._id ?? t.projectRef] : null;
            return (
              <blockquote
                key={t._id}
                className="w-[min(85vw,22rem)] shrink-0 bg-(--canvas) py-8 lg:w-auto lg:first:pt-0 lg:pl-8"
              >
                <p className="text-[0.9375rem] leading-relaxed text-(--text-dim)">
                  “{t.reviewText}”
                </p>

                <footer className="mt-7 flex items-center gap-3.5">
                  <span
                    aria-hidden="true"
                    className="label-mono flex h-9 w-9 items-center justify-center border border-(--line) text-(--text-mute)"
                  >
                    {initials(t.clientName)}
                  </span>
                  <div>
                    <p className="text-[0.9375rem] font-medium text-(--text)">{t.clientName}</p>
                    <p className="label-mono mt-1 text-(--text-mute)">
                      {t.clientDesignation} · {t.companyName}
                    </p>
                  </div>
                  {project && (
                    <Link
                      href={`/projects/${project.slug}`}
                      className="label-mono ml-auto shrink-0 text-(--text-mute) transition-colors hover:text-signal"
                    >
                      Case ↗
                    </Link>
                  )}
                </footer>
              </blockquote>
            );
          })}
        </div>
      </div>

      {canScroll && (
        <div className="mt-6 flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous quote"
            className="label-mono border border-(--line) px-3.5 py-2 text-(--text-dim) transition-colors hover:border-signal hover:text-signal"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next quote"
            className="label-mono border border-(--line) px-3.5 py-2 text-(--text-dim) transition-colors hover:border-signal hover:text-signal"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
