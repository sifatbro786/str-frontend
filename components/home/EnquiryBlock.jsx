"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import SectionIndex from "@/components/ui/SectionIndex";
import useSplitReveal from "@/components/motion/useSplitReveal";
import InquiryForm from "@/components/contact/InquiryForm";
import { cn, pad } from "@/lib/utils";
import { site } from "@/lib/site";

/**
 * 06 // CONTACT — the form and the objections, side by side.
 *
 * ── WHY THE FAQ SITS NEXT TO THE FORM AND NOT ABOVE IT ───────────────────
 * The FAQ exists to answer the question that stops someone submitting. Putting
 * it in its own section above means the reader has already scrolled past the
 * answer by the time they hit the doubt. Beside the form, the answer is one
 * glance away from the cursor.
 *
 * ── WHY InquiryForm IS REUSED, NOT REBUILT ───────────────────────────────
 * Its field names map 1:1 onto the Inquiry model and it owns the honeypot, the
 * validation mirror and the 429 handling. A second, simpler form on the
 * homepage would be a second thing to keep in sync with the backend
 * validators — and it is always the copy that drifts.
 *
 * ── WHY THE ACCORDION IS <details>-FREE ──────────────────────────────────
 * Native <details> cannot be animated open: the content has no box until the
 * element is open, so there is nothing to measure a height tween against, and
 * `content-visibility` transitions are still not reliable across the browsers
 * this site has to serve. Button + aria-expanded + a measured height tween is
 * the same semantics with an animation that actually runs.
 */
export default function EnquiryBlock({ faqs, services }) {
    const root = useRef(null);
    const panels = useRef([]);
    const [open, setOpen] = useState(null);

    const heading = useSplitReveal({ type: "words", stagger: 0.04 });

    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            panels.current.forEach((el, i) => {
                if (!el) return;
                const isOpen = i === open;

                if (reduced) {
                    gsap.set(el, { height: isOpen ? "auto" : 0, autoAlpha: isOpen ? 1 : 0 });
                    return;
                }

                gsap.to(el, {
                    height: isOpen ? "auto" : 0,
                    autoAlpha: isOpen ? 1 : 0,
                    duration: 0.45,
                    ease: "power3.inOut",
                    overwrite: "auto",
                    // Every trigger below this point moves when a row opens.
                    onComplete: () => ScrollTrigger.refresh(),
                });
            });
        },
        { scope: root, dependencies: [open] },
    );

    return (
        <section id="contact" ref={root} className="border-b border-(--line)">
            <div className="shell py-24 md:py-32">
                <div className="grid grid-cols-1 gap-x-12 gap-y-16 lg:grid-cols-12">
                    {/* ── Form ────────────────────────────────────────────── */}
                    <div className="lg:col-span-6">
                        <SectionIndex index="06" label="Start a project" />
                        <h2 ref={heading} className="text-heading mt-6">
                            Tell us what you are trying to build.
                        </h2>
                        <p className="mt-8 max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim)">
                            {site.contact.responseTime} If it is not a fit, we will say so and point
                            you somewhere that is.
                        </p>

                        <div className="mt-10 border-t border-(--line) pt-10">
                            <InquiryForm services={services} />
                        </div>

                        <dl className="mt-12 grid grid-cols-1 gap-px border border-(--line) bg-(--line) sm:grid-cols-3">
                            {[
                                ["Email", site.contact.email, `mailto:${site.contact.email}`],
                                ["Dhaka", site.contact.phone, site.contact.phoneHref],
                                ["Europe", site.contact.phoneEu, site.contact.phoneEuHref],
                            ].map(([k, v, href]) => (
                                <div key={k} className="bg-(--canvas) px-5 py-5">
                                    <dt className="label-mono text-(--text-mute)">{k}</dt>
                                    <dd className="mt-2">
                                        <a
                                            href={href}
                                            className="text-[0.875rem] text-(--text-dim) transition-colors hover:text-brand"
                                        >
                                            {v}
                                        </a>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {/* ── FAQ ─────────────────────────────────────────────── */}
                    <div className="lg:col-span-5 lg:col-start-8">
                        <SectionIndex index="07" label="Questions answered" />

                        <div className="mt-8 border-t border-(--line)">
                            {faqs.map((f, i) => {
                                const isOpen = i === open;
                                const id = `faq-panel-${i}`;
                                return (
                                    <div key={f.q} className="group/faq border-b border-(--line)">
                                        <h3>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpen((prev) => (prev === i ? null : i))
                                                }
                                                aria-expanded={isOpen}
                                                aria-controls={id}
                                                className="flex w-full items-start gap-4 py-6 text-left"
                                            >
                                                <span className="label-mono mt-1.5 shrink-0 text-(--text-mute)">
                                                    {pad(i + 1)}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "flex-1 text-[1.0625rem] leading-snug font-medium transition-colors duration-300",
                                                        isOpen
                                                            ? "text-(--text)"
                                                            : "text-(--text-dim) group-hover/faq:text-(--text)",
                                                    )}
                                                >
                                                    {f.q}
                                                </span>
                                                <span
                                                    aria-hidden="true"
                                                    className="relative mt-2 block size-3.5 shrink-0"
                                                >
                                                    <span className="absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 bg-(--text-mute)" />
                                                    <span
                                                        className={cn(
                                                            "absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 bg-(--text-mute) transition-transform duration-400 ease-out",
                                                            isOpen ? "rotate-0" : "rotate-90",
                                                        )}
                                                    />
                                                </span>
                                            </button>
                                        </h3>

                                        <div
                                            id={id}
                                            ref={(el) => {
                                                panels.current[i] = el;
                                            }}
                                            className="overflow-hidden"
                                            style={{ height: 0 }}
                                        >
                                            <p className="pb-7 pl-12 text-[0.9375rem] leading-relaxed text-(--text-mute)">
                                                {f.a}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <p className="label-mono mt-8 text-(--text-mute)">
                            {site.contact.hours}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
