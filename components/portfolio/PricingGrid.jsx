"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { refreshScroll } from "@/lib/scrollRefresh";
import Reveal from "@/components/motion/Reveal";
import SectionIndex from "@/components/ui/SectionIndex";
import { cn, pad } from "@/lib/utils";

/**
 * EUR pricing — four build tracks, three tiers each.
 *
 * ── WHAT CHANGED FROM THE v1 /info VERSION, AND WHY ──────────────────────
 * The numbers, the tiers and the discount framing are identical. The design
 * is not, because the v1 cards were built for a different system: three
 * floating rounded cards, the middle one inverted to near-black and carrying
 * a 60px blue drop shadow, a rose diagonal bar drawn over the list price, and
 * a blue "Recommended" pill hanging off the top edge. On a light canvas built
 * from white and hairlines that reads as three widgets pasted onto the page.
 *
 * This is the same content as a spec sheet: one hairline grid, `gap-px` over
 * a `--line` ground, so the three tiers are columns of one table rather than
 * three competing objects. The recommended tier is marked by a 2px brand rule
 * along its top edge and an inverted button — no shadow, no colour flip, no
 * floating badge. Features are hairline-separated label/value rows instead of
 * a tick list, which is what they actually are and which sidesteps the
 * checkmark-pricing-card look entirely.
 *
 * ── WHY THE STRIKE IS A REAL line-through NOW ────────────────────────────
 * v1 drew it as an absolutely positioned rotated bar in rose, on the argument
 * that a hairline `line-through` vanishes at that weight. True at 12px; this
 * sets the list price at 1.25rem with a 1.5px decoration, where it reads
 * clearly — and rose is not in this palette, so drawing it here would have
 * meant inventing a sixth colour for one element. `sr-only` carries the
 * meaning to anyone who cannot see the rule at all.
 *
 * ── WHY ONE COLUMN UNTIL lg ──────────────────────────────────────────────
 * Three cells at two columns leaves the third alone in a half-empty row, and
 * with `gap-px` that emptiness paints in the hairline colour: it reads as a
 * rendering fault. One column, then three.
 *
 * @param {Array}  categories PRICING_CATEGORIES
 * @param {object} prices     EURO_PRICES, keyed by tier id
 * @param {Array}  terms      PRICING_TERMS
 * @param {string} contactEmail
 */

const euro = new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
});

function ArrowOut({ className }) {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
        >
            <path d="M5 11 11 5M5.5 4.5H11.5V10.5" />
        </svg>
    );
}

function PriceBlock({ price }) {
    if (!price) return null;

    const { amount, original, period } = price;
    const pct = original ? Math.round((1 - amount / original) * 100) : 0;
    const saving = original ? original - amount : 0;

    return (
        <div className="mt-7">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="nums text-[clamp(1.875rem,3vw,2.375rem)] leading-none font-medium tracking-[-0.04em] text-(--text)">
                    {euro.format(amount)}
                </span>

                {/* Sits on the same baseline as the figure, not under it. A rate
                    whose period is parked on a second line is a figure the reader
                    has to assemble, and the one they remember is the big half. */}
                {period ? (
                    <span className="text-[0.9375rem] leading-none text-(--text-mute)">
                        /{period}
                    </span>
                ) : null}

                {original ? (
                    <span className="nums text-[1.25rem] leading-none text-(--text-mute)">
                        {/* The rule is not announced, so the meaning is carried in text
                            for anyone who cannot see it. */}
                        <span className="sr-only">List price </span>
                        <span className="line-through decoration-[1.5px]">
                            {euro.format(original)}
                        </span>
                    </span>
                ) : null}
            </div>

            {original ? (
                <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="label-mono nums text-brand">{pct}% partner rate</span>
                    <span aria-hidden="true" className="text-(--line)">
                        /
                    </span>
                    <span className="label-mono nums text-(--text-mute)">
                        You save {euro.format(saving)}
                        {/* On a retainer the saving recurs, and "You save €50" next
                            to a monthly rate reads as a one-time discount. */}
                        {period ? ` every ${period}` : ""}
                    </span>
                </div>
            ) : null}
        </div>
    );
}

function TierCell({ tier, price, contactEmail }) {
    const hot = Boolean(tier.highlighted);

    return (
        <div data-tier="" className="relative flex flex-col bg-(--canvas) p-7 md:p-8">
            {/* The recommended marker. A rule, not a pill: the pill version hung off
                the card's top edge and only worked because the v1 card floated. */}
            {hot && (
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-brand" />
            )}

            <div className="flex items-baseline justify-between gap-3">
                <span className="label-mono text-brand">{tier.segment}</span>
                {hot && <span className="label-mono text-(--text-mute)">Recommended</span>}
            </div>

            <h4 className="mt-5 text-[1.25rem] font-medium tracking-[-0.02em] text-(--text)">
                {tier.name}
            </h4>
            <p className="mt-1.5 text-[0.9375rem] text-(--text-dim)">{tier.badge}</p>

            <PriceBlock price={price} />

            <dl className="mt-7 border-t border-(--line) pt-4">
                {[
                    ["Billing", tier.billing],
                    ["Timeline", tier.timeline],
                ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 py-1">
                        <dt className="label-mono shrink-0 text-(--text-mute)">{label}</dt>
                        <dd className="nums text-right text-[0.9375rem] text-(--text)">{value}</dd>
                    </div>
                ))}
            </dl>

            <a
                href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                    `${tier.name} (${tier.id}) scope enquiry`,
                )}`}
                className={cn(
                    "group/scope mt-7 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.9375rem] font-medium transition-colors duration-200",
                    hot
                        ? "bg-(--text) text-(--canvas) hover:bg-brand hover:text-white"
                        : "border border-(--line) text-(--text) hover:border-(--text)",
                )}
            >
                Request this scope
                <ArrowOut className="transition-transform duration-300 ease-out group-hover/scope:translate-x-0.5 group-hover/scope:-translate-y-0.5" />
            </a>

            {/* Features as label/value rows. They were a tick list in v1, and a tick
                against "Multi-page custom UI with a reusable component system" claims
                the whole sentence is a single binary feature. These are specs. */}
            <dl className="mt-8">
                {tier.features.map((f) => (
                    <div
                        key={f.label}
                        className="border-t border-(--line) py-3.5 first:border-t-0 first:pt-0"
                    >
                        <dt className="label-mono text-(--text-mute)">{f.label}</dt>
                        <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                            {f.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

export default function PricingGrid({ categories, prices, terms, contactEmail, index = "02" }) {
    const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
    const grid = useRef(null);

    const category = categories.find((c) => c.id === activeId) ?? categories[0];

    /* A full replace, not a re-flow: switching track swaps all three tiers for
       three different ones, so there is no shared element for Flip to carry and
       nothing to preserve continuity of. A short staggered rise is the honest
       read of "these are different tiers" — and it costs no plugin. */
    useGSAP(
        () => {
            if (!grid.current) return;
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                refreshScroll();
                return;
            }

            gsap.from(gsap.utils.toArray("[data-tier]", grid.current), {
                autoAlpha: 0,
                y: 18,
                duration: 0.5,
                stagger: 0.07,
                clearProps: "transform,visibility",
                // Tier columns differ in height between tracks, so every trigger
                // below the grid moves. Debounced through lib/scrollRefresh.
                onComplete: refreshScroll,
            });
        },
        { dependencies: [activeId], scope: grid },
    );

    if (!category) return null;

    return (
        <section className="border-b border-(--line)">
            <div className="shell py-20 md:py-28">
                <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
                    <div className="lg:col-span-6">
                        <SectionIndex index={index} label="Investment" />
                        <h2 className="text-heading mt-6 max-w-[18ch]">
                            Published pricing.{" "}
                            <span className="text-(--text-mute)">
                                No discovery call to get a number.
                            </span>
                        </h2>
                    </div>
                    <p className="max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-4 lg:col-start-9">
                        Four build tracks and one monthly SEO retainer, three tiers each. Invoiced
                        in EUR, excluding VAT, on the terms set out below the grid. Anything
                        outside these shapes is scoped per programme.
                    </p>
                </div>

                {/* ── Track selector ──────────────────────────────────────────
                    Same pill idiom as the portfolio filter above it, deliberately:
                    one page should not teach the reader two ways to switch a view. */}
                <div
                    role="tablist"
                    aria-label="Pricing tracks"
                    className="mt-12 flex gap-2 overflow-x-auto pb-1"
                >
                    {categories.map((c) => {
                        const on = c.id === category.id;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                role="tab"
                                aria-selected={on}
                                onClick={() => setActiveId(c.id)}
                                className={cn(
                                    "shrink-0 rounded-full border px-4 py-2 text-[0.875rem] whitespace-nowrap transition-colors duration-200",
                                    on
                                        ? "border-(--text) bg-(--text) text-(--canvas)"
                                        : "border-(--line) text-(--text-mute) hover:border-(--text) hover:text-(--text)",
                                )}
                            >
                                {c.title}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-9 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-subheading text-(--text)">{category.title}</h3>
                    <span className="label-mono text-(--text-mute)">{category.platform}</span>
                </div>
                <p className="mt-2.5 max-w-2xl text-[0.9375rem] leading-relaxed text-(--text-dim)">
                    {category.bestFor}
                </p>

                <div
                    ref={grid}
                    className="mt-8 grid gap-px border border-(--line) bg-(--line) lg:grid-cols-3"
                >
                    {category.tiers.map((tier) => (
                        <TierCell
                            key={tier.id}
                            tier={tier}
                            price={prices[tier.id]}
                            contactEmail={contactEmail}
                        />
                    ))}
                </div>

                {/* ── Terms ───────────────────────────────────────────────────
                    Stated once for all twelve tiers. Same numbered hairline grid as
                    the engagement shapes on /about, so it reads as the same kind of
                    thing: facts about the contract, not features of a package. */}
                <div className="mt-16">
                    {/* No number on this one. SectionIndex takes `index` as optional
                        precisely so a sub-block can carry the label alone — numbering it
                        "02.1" would invent a second level of hierarchy the rest of the
                        site does not have. */}
                    <SectionIndex label="How engagement and billing work" />
                    <Reveal
                        className="mt-8 grid gap-px border border-(--line) bg-(--line) sm:grid-cols-2 lg:grid-cols-4"
                        stagger={0.07}
                    >
                        {terms.map((t, i) => (
                            <div key={t.title} data-reveal="" className="bg-(--canvas) p-7">
                                <span className="label-mono tabular-nums text-brand">
                                    {pad(i + 1)}
                                </span>
                                <h4 className="mt-5 text-[1.0625rem] font-medium tracking-[-0.02em] text-(--text)">
                                    {t.title}
                                </h4>
                                <p className="mt-3 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                                    {t.detail}
                                </p>
                            </div>
                        ))}
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
