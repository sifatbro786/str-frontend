"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/lib/gsap";
import Button from "@/components/ui/Button";
import HeroPaths from "./HeroPaths";
import { site } from "@/lib/site";
import { SERVICE_LABELS } from "@/lib/taxonomy";

/**
 * Left-weighted editorial hero. Three deliberate choices, unchanged from Phase 3:
 *
 *  1. The headline carries a second clause in muted colour inside the same
 *     sentence. Human copywriters break emphasis mid-sentence; generated
 *     headlines put the whole line at one weight and gradient the keyword.
 *  2. The lede and the actions sit in a right rail aligned to the *baseline*
 *     of the headline, not centred beneath it.
 *  3. Real work appears above the fold as a cropped three-frame strip, so the
 *     first screen carries evidence rather than an abstract illustration.
 *
 * Phase 5 adds the entrance. Nothing here is hidden by CSS — every element
 * animates `from` its resting state, so if JS never runs the hero still reads.
 */
export default function HeroIntro({ strip }) {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          reduced: "(prefers-reduced-motion: reduce)",
          full: "(prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          // Reduced motion gets the finished state, not a slower journey.
          if (ctx.conditions.reduced) return;

          /**
           * autoSplit + onSplit is REQUIRED here, not optional.
           *
           * General Sans loads from the Fontshare CDN (see globals.css), so it
           * almost always arrives AFTER first paint. A one-shot split measures
           * line boxes in the fallback face, then the real font swaps in and
           * every line break moves — leaving words clipped by their own masks.
           * autoSplit re-splits on font load and on resize; returning the tween
           * from onSplit keeps it time-synced across those re-splits.
           */
          const split = SplitText.create("[data-hero-headline]", {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            linesClass: "split-line-inner",
            onSplit(self) {
              return gsap.from(self.lines, {
                yPercent: 115,
                duration: 0.9,
                stagger: 0.09,
                ease: "power4.out",
              });
            },
          });

          const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
          tl.from("[data-hero-locator] > *", { y: 12, autoAlpha: 0, stagger: 0.05, duration: 0.5 }, 0)
            .from("[data-hero-lede]", { y: 20, autoAlpha: 0, duration: 0.7 }, 0.35)
            .from("[data-hero-actions] > *", { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, 0.45)
            .from("[data-hero-caps] li", { autoAlpha: 0, stagger: 0.03, duration: 0.4 }, 0.55)
            .from("[data-hero-strip] > *", { yPercent: 12, autoAlpha: 0, stagger: 0.1, duration: 0.9 }, 0.5);

          return () => split.revert();
        }
      );

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative overflow-hidden border-b border-(--line)">
      <HeroPaths />

      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(120%_80%_at_15%_0%,#000_20%,transparent_75%)]"
      />

      <div className="shell relative pt-32 md:pt-44">
        {/* Locator strip — replaces the pill eyebrow */}
        <div
          data-hero-locator
          className="label-mono flex flex-wrap items-center gap-x-4 gap-y-2 text-(--text-mute)"
        >
          <span aria-hidden="true" className="h-px w-8 bg-signal" />
          <span>
            {site.address.city}, {site.address.country}
          </span>
          <span aria-hidden="true" className="text-(--line)">
            //
          </span>
          <span>Est. {site.foundedYear}</span>
          <span aria-hidden="true" className="text-(--line)">
            //
          </span>
          <span>Engineering &amp; Visual Production</span>
        </div>

        <div className="mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-12 lg:items-end">
          <h1 data-hero-headline className="text-display lg:col-span-8">
            Software that survives{" "}
            <span className="text-(--text-mute)">the year after launch.</span>
          </h1>

          <div className="lg:col-span-4 lg:pb-3">
            <p
              data-hero-lede
              className="max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim)"
            >
              We are a Dhaka engineering and production studio. Web platforms, custom
              software, mobile products, and the visual work that sells them — built to
              be handed over, not held hostage.
            </p>

            <div data-hero-actions className="mt-8 flex flex-wrap items-center gap-3">
              <Button href="/contact" size="lg" variant="invert" withArrow>
                Start a project
              </Button>
              <Button href="/projects" size="lg" variant="outline">
                Selected work
              </Button>
            </div>
          </div>
        </div>

        {/* Capability run — a plain comma-free list, set in mono */}
        <ul
          data-hero-caps
          className="label-mono mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-(--line) pt-6 text-(--text-mute)"
        >
          {Object.values(SERVICE_LABELS).map((label, i) => (
            <li key={label} className="flex items-center gap-6">
              {i > 0 && (
                <span aria-hidden="true" className="text-(--line)">
                  /
                </span>
              )}
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Evidence strip. Cropped tall on purpose — a full screenshot at this
          size reads as a template preview; a crop reads as art direction. */}
      <div
        data-hero-strip
        className="shell mt-14 grid gap-px border-t border-(--line) bg-(--line) md:mt-20 md:grid-cols-3"
      >
        {strip.map((p, i) => (
          <Link
            key={p._id}
            href={`/projects/${p.slug}`}
            data-cursor="view"
            data-cursor-image={p.coverImage}
            data-cursor-label="Case study"
            className="group relative block overflow-hidden bg-(--canvas)"
          >
            <div className="relative aspect-[16/10] overflow-hidden md:aspect-[4/5] lg:aspect-[16/11]">
              <Image
                src={p.coverImage}
                alt={p.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                priority={i === 0}
                className="object-cover object-top grayscale transition-all duration-700 ease-out group-hover:scale-[1.03] group-hover:grayscale-0"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-(--canvas)/45 transition-opacity duration-500 group-hover:opacity-0"
              />
            </div>

            <div className="flex items-baseline justify-between gap-4 px-1 py-4">
              <span className="text-[0.9375rem] font-medium text-(--text)">{p.clientName}</span>
              <span className="label-mono text-(--text-mute)">
                {SERVICE_LABELS[p.serviceTypes[0]]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
