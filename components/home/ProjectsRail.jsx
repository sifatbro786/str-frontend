"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import SectionIndex from "@/components/ui/SectionIndex";
import ArrowLink from "@/components/ui/ArrowLink";
import Tag from "@/components/ui/Tag";
import { SERVICE_LABELS } from "@/lib/taxonomy";
import { cn, pad } from "@/lib/utils";

/**
 * Pinned horizontal gallery on desktop; the Phase 3 offset editorial grid
 * everywhere else.
 *
 * WHY BOTH LAYOUTS EXIST. The two are genuinely different designs, not one
 * design with a breakpoint. The offset grid (7/5 columns, narrow cells pushed
 * down a rhythm unit) makes the eye travel diagonally down the page — it is the
 * right answer when scroll is vertical. It cannot survive being laid on its
 * side. Below `lg`, and whenever motion is reduced, the grid is what renders and
 * no pin is created at all. Same markup, two container classes.
 *
 * The single `data-rail-track` element is the flex row on desktop and the
 * 12-column grid below it, so there is one DOM tree and one set of cards.
 */
const GRID_LAYOUT = [
  "lg:col-span-7",
  "lg:col-span-5 lg:mt-28",
  "lg:col-span-5",
  "lg:col-span-7 lg:mt-28",
];

export default function ProjectsRail({ items }) {
  const root = useRef(null);
  const track = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop + motion allowed → pin the section and scrub the row sideways.
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const distance = () => Math.max(0, track.current.scrollWidth - window.innerWidth);
        if (distance() === 0) return;

        const tween = gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            // Pin length == horizontal distance, so the wheel-to-travel ratio is
            // 1:1 and the section cannot feel sticky or overlong.
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // Image mask: each cover unmasks as its card enters the viewport.
        // clip-path animates on the compositor and never reflows.
        gsap.utils.toArray("[data-rail-cover]", root.current).forEach((cover) => {
          gsap.fromTo(
            cover,
            { clipPath: "inset(0% 0% 100% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              ease: "power2.out",
              scrollTrigger: {
                trigger: cover,
                // REQUIRED: without containerAnimation the start/end are measured
                // against vertical scroll, so every mask fires at once on load.
                containerAnimation: tween,
                start: "left 85%",
                end: "left 45%",
                scrub: true,
              },
            }
          );
        });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="border-b border-(--line) lg:overflow-hidden">
      <div className="shell py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionIndex index="02" label="Selected work" />
            <h2 className="text-heading mt-6 max-w-[17ch]">
              Four projects{" "}
              <span className="text-(--text-mute)">worth explaining properly.</span>
            </h2>
          </div>
          <ArrowLink href="/projects" className="pb-2">
            All {items.length > 0 ? "case studies" : "work"}
          </ArrowLink>
        </div>
      </div>

      {/* Desktop: a flex row wider than the viewport, translated by the pin.
          Below lg: the original offset 12-column grid, inside the page gutter. */}
      <div
        ref={track}
        data-rail-track
        className={cn(
          "shell grid gap-x-10 gap-y-16 pb-20 md:pb-28",
          "lg:flex lg:w-max lg:max-w-none lg:items-start lg:gap-14 lg:pb-28",
          "lg:grid-cols-none"
        )}
      >
        {items.map((p, i) => (
          <article
            key={p._id}
            className={cn("group lg:w-[min(46vw,42rem)] lg:shrink-0", GRID_LAYOUT[i])}
          >
            <Link
              href={`/projects/${p.slug}`}
              data-cursor="view"
              data-cursor-image={p.coverImage}
              data-cursor-label="Case study"
              className="block"
            >
              <div className="relative overflow-hidden border border-(--line)">
                <div
                  data-rail-cover
                  className={cn("relative", i % 3 === 0 ? "aspect-[16/10]" : "aspect-[4/3]")}
                >
                  <Image
                    src={p.coverImage}
                    alt={p.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 46vw"
                    className="object-cover object-top transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]"
                  />
                </div>

                {/* Index plate, flush to the corner — no floating badge */}
                <span className="label-mono absolute left-0 top-0 bg-(--canvas) px-3 py-2 text-(--text-mute)">
                  {pad(i + 1)}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <h3 className="text-subheading text-(--text) transition-colors group-hover:text-signal">
                  {p.title}
                </h3>
                <span className="label-mono text-(--text-mute)">{p.clientName}</span>
              </div>

              <p className="mt-4 max-w-prose text-[0.9375rem] leading-relaxed text-(--text-mute)">
                {p.shortDescription}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                {(p.serviceTypes ?? []).map((s, si) => (
                  <Tag key={s} variant={si === 0 ? "outline" : "ghost"}>
                    {SERVICE_LABELS[s]}
                  </Tag>
                ))}
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
