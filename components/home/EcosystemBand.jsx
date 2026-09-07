"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import SectionIndex from "@/components/ui/SectionIndex";
import LoopMarquee from "@/components/motion/LoopMarquee";
import useSplitReveal from "@/components/motion/useSplitReveal";
import { partners } from "@/lib/site";

/**
 * 05 // ECOSYSTEM — client logos, and what was actually built for each.
 *
 * ── WHY THE LOGOS SCROLL INSTEAD OF SITTING IN A GRID ────────────────────
 * Eight logos in a static grid is a wall of mismatched lockups at eight
 * different optical weights, and the eye reads the largest as the most
 * important client. A rail moving at a constant rate gives each the same
 * dwell time and hides the weight mismatch in the motion.
 *
 * ── WHY grayscale IS ON THE IMAGE AND NOT THE ROW ────────────────────────
 * A filter on a container creates a containing block for its descendants,
 * which silently breaks the absolutely-positioned caption inside each cell.
 * Per-image is one extra declaration and no stacking surprises.
 *
 * ── THE QUOTES USED TO LIVE HERE ─────────────────────────────────────────
 * Two testimonial cards sat in the right column until TestimonialRail was
 * built. Running both meant the same three quotes appeared twice on one page.
 * The column now carries the client index instead, which is the detail the
 * logo rail cannot show: who they are and what we actually did.
 *
 * ── PROVENANCE ⚑ ─────────────────────────────────────────────────────────
 * The `work` labels come from lib/site.js and are marked there as
 * reconstructed rather than contract-sourced. Confirm each with the account
 * owner before launch: a wrong project label under a real client's logo is
 * worse than no label at all.
 */
export default function EcosystemBand() {
    const root = useRef(null);
    const heading = useSplitReveal({ type: "words", stagger: 0.04 });

    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reduced) return;

            const rows = gsap.utils.toArray("[data-eco-row]", root.current);
            if (!rows.length) return;

            gsap.from(rows, {
                autoAlpha: 0,
                y: 18,
                duration: 0.6,
                ease: "power3.out",
                stagger: 0.05,
                scrollTrigger: { trigger: rows[0], start: "top 88%", once: true },
            });
        },
        { scope: root },
    );

    return (
        <section id="ecosystem" ref={root} className="border-b border-(--line)">
            {/* ── Logo rail ───────────────────────────────────────────────── */}
            <div className="border-b border-(--line) py-10">
                <p className="shell label-mono mb-8 text-(--text-mute)">
                    Working with teams in construction, retail, media, logistics and export
                </p>
                {/* Doubled before it reaches the marquee. LoopMarquee's seam is only
            invisible while one copy of the track is at least as wide as the
            viewport; eight logos at 224px is 1,792px, which leaves a gap on a
            2K display. Twice through covers everything we ship to. */}
                {/* reactive={false} on this one. LoopMarquee's velocity coupling
            installs a global Observer on wheel, touch and scroll; two rails
            on one page means two of them reading and writing on every scroll
            event. The hero band is the one where the coupling reads as
            deliberate, so it keeps it and this one does not. */}
                <LoopMarquee
                    items={[...partners, ...partners]}
                    speed={46}
                    reactive={false}
                    className="mask-x"
                    renderItem={(p, i) => (
                        <span
                            key={`${p.name}-${i}`}
                            className="group/logo relative flex h-16 w-44 shrink-0 items-center justify-center px-4 md:w-56"
                        >
                            <Image
                                src={p.logo}
                                alt={p.name}
                                width={140}
                                height={44}
                                // 55, not the 45 this started at. On the old dark canvas
                                // a low opacity still left a legible mark; on white the
                                // same value washes a mid-tone logo out to nothing.
                                className="h-9 w-auto object-contain opacity-55 grayscale transition-[opacity,filter] duration-400 group-hover/logo:opacity-100 group-hover/logo:grayscale-0"
                            />
                        </span>
                    )}
                />
            </div>

            {/* ── Statement and client index ──────────────────────────────── */}
            <div className="shell py-24 md:py-32">
                <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                        <SectionIndex index="05" label="Ecosystem" />
                        <h2 ref={heading} className="text-heading mt-6">
                            Brands that stayed after the first project.
                        </h2>
                        <p className="mt-8 max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim)">
                            Most of the work below started as a single engagement and turned into a
                            standing one. That is the only retention metric worth quoting.
                        </p>
                        <Link
                            href="/projects"
                            className="group/eco mt-10 inline-flex items-center gap-3 rounded-full border border-(--line) px-5 py-2.5 text-sm text-(--text) transition-colors hover:border-(--text)"
                        >
                            See what we built for them
                            <span
                                aria-hidden="true"
                                className="inline-block transition-transform duration-300 group-hover/eco:translate-x-1"
                            >
                                →
                            </span>
                        </Link>
                    </div>

                    {/* A definition list, not a card grid. Eight clients as eight
              bordered boxes is eight rectangles competing for attention;
              as rows on a hairline they read as an index, which is what
              they are. */}
                    <dl className="lg:col-span-6 lg:col-start-7">
                        {partners.map((p) => (
                            <div
                                key={p.name}
                                data-eco-row=""
                                className="group/row grid grid-cols-1 gap-x-6 gap-y-1 border-b border-(--line) py-5 transition-colors first:border-t sm:grid-cols-12"
                            >
                                <dt className="text-[0.9375rem] font-medium text-(--text) transition-transform duration-400 ease-out group-hover/row:translate-x-1.5 sm:col-span-4">
                                    {p.name}
                                </dt>
                                <dd className="text-[0.9375rem] text-(--text-dim) sm:col-span-5">
                                    {p.work}
                                </dd>
                                <dd className="label-mono text-(--text-mute) sm:col-span-3 sm:text-right">
                                    {p.sector}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
}
