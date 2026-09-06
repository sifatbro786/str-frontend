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

/**
 * Corner brackets, drawn on hover.
 *
 * The brief asked for morphing hairline borders. The bento's hairlines are the
 * 1px grid gap over a --line background — CSS, not SVG, with no path to morph.
 * Rebuilding the block as SVG to enable a morph would throw away the technique
 * Phase 3 chose deliberately. These brackets deliver the same intent (precision
 * instrumentation) with DrawSVG, and cost two 20px strokes per cell.
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
        className="pointer-events-none absolute left-0 top-0 size-5.5"
      >
        <path data-bracket d={bracket} stroke="var(--color-signal)" strokeWidth="1" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 22 22"
        fill="none"
        className="pointer-events-none absolute bottom-0 right-0 size-5.5 rotate-180"
      >
        <path data-bracket d={bracket} stroke="var(--color-signal)" strokeWidth="1" />
      </svg>
    </>
  );
}

export default function BentoGrid({ services }) {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Scrubbed reveal: cards rise and settle as the block crosses the
        // viewport. `from: "start"` keeps reading order — the bento's visual
        // order and Service.order agree, and the animation must not contradict
        // that by revealing from the centre or the edges.
        gsap.from("[data-bento-cell]", {
          yPercent: 8,
          autoAlpha: 0,
          duration: 1,
          stagger: { each: 0.06, from: "start" },
          scrollTrigger: {
            trigger: "[data-bento-grid]",
            start: "top 82%",
            end: "top 35%",
            scrub: 0.6,
          },
        });

        // Brackets draw on hover, per cell.
        gsap.utils.toArray("[data-bento-cell]", root.current).forEach((cell) => {
          const brackets = cell.querySelectorAll("[data-bracket]");
          gsap.set(brackets, { drawSVG: "0%" });

          const draw = () => gsap.to(brackets, { drawSVG: "100%", duration: 0.45, ease: "power2.out" });
          const undraw = () => gsap.to(brackets, { drawSVG: "0%", duration: 0.3, ease: "power2.in" });

          cell.addEventListener("mouseenter", draw);
          cell.addEventListener("mouseleave", undraw);
          cell._bento = { draw, undraw };
        });

        return () => {
          gsap.utils.toArray("[data-bento-cell]", root.current).forEach((cell) => {
            if (!cell._bento) return;
            cell.removeEventListener("mouseenter", cell._bento.draw);
            cell.removeEventListener("mouseleave", cell._bento.undraw);
          });
        };
      });

      return () => mm.revert();
    },
    { scope: root }
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

        <div
          data-bento-grid
          className="mt-14 grid gap-px border border-(--line) bg-(--line) lg:grid-cols-12"
        >
          {services.map((s, i) => {
            const hero = i === 0;
            return (
              <Link
                key={s._id}
                href={`/services/${s.slug}`}
                data-bento-cell
                className={cn(
                  "group relative flex flex-col bg-(--canvas) p-7 transition-colors duration-300 hover:bg-(--raised) md:p-9",
                  SPANS[i]
                )}
              >
                <CornerBrackets />

                {/* Signal rule wipes in on hover — replaces the glow/shadow lift */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-signal transition-transform duration-500 ease-out group-hover:scale-x-100"
                />

                <div className="flex items-start justify-between gap-6">
                  <h3
                    className={cn(
                      "max-w-[15ch] font-semibold tracking-[-0.028em] text-(--text)",
                      hero ? "text-[clamp(1.6rem,1.1rem+1.7vw,2.4rem)]" : "text-[1.375rem]"
                    )}
                  >
                    {s.title}
                  </h3>
                  <span className="label-mono shrink-0 pt-1.5 text-(--text-mute) transition-colors group-hover:text-signal">
                    {pad(i + 1)}
                  </span>
                </div>

                <p
                  className={cn(
                    "mt-5 leading-relaxed text-(--text-mute)",
                    hero ? "max-w-lg text-[1rem]" : "text-[0.9375rem]"
                  )}
                >
                  {s.shortDescription}
                </p>

                {hero && SERVICE_MEDIA[s.slug] && (
                  <div className="relative mt-8 aspect-video overflow-hidden border border-(--line)">
                    <Image
                      src={SERVICE_MEDIA[s.slug]}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover object-top opacity-80 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                )}

                <div className="mt-auto flex items-end justify-between gap-6 pt-8">
                  <span className="label-mono text-(--text-mute)">{s.deliverableTimeline}</span>
                  <span className="text-sm font-medium text-(--text) transition-colors group-hover:text-signal">
                    Read more ↗
                  </span>
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
