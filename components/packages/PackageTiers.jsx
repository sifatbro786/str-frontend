"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { refreshScroll } from "@/lib/scrollRefresh";
import SectionIndex from "@/components/ui/SectionIndex";
import { cn } from "@/lib/utils";
import { PACKAGES_UI, discountPercent, formatTaka } from "@/lib/packagesUi";

/**
 * The tab strip and the tier grid on /packages.
 *
 * ── WHY THIS LOOKS LIKE PricingGrid AND NOT LIKE THE v1 PACKAGES PAGE ────
 * The source page drew three floating rounded cards with a blue ring on the
 * recommended one and a pill badge hanging off its top edge. This site has one
 * pricing surface already — /portfolio — and it settled that argument: one
 * hairline grid, `gap-px` over a `--line` ground, so the tiers read as columns
 * of one table rather than three competing objects. Two pricing grids on one
 * site that look like two different products is the drift worth avoiding here,
 * so this deliberately mirrors components/portfolio/PricingGrid.jsx: same
 * `data-tier` stagger, same recommended rule, same spec-row features.
 *
 * What is NOT shared with it: this one is bilingual, priced in taka, and
 * routes to /contact rather than a mailto. Extracting a common component for
 * the overlap would leave a props surface larger than either file, so the two
 * stay separate and the comment above is the contract between them.
 *
 * ── WHY FEATURES ARE label/value ROWS AND NOT A TICK LIST ────────────────
 * A checkmark against "Headless CMS for pages & blog, dynamic SEO manager,
 * inquiry pipeline" claims the whole sentence is one binary feature. These are
 * specs, so they render as a definition list — which also sidesteps the
 * checkmark-pricing-card look entirely.
 *
 * ── WHY ONE COLUMN UNTIL lg ──────────────────────────────────────────────
 * Three cells at two columns leaves the third alone in a half-empty row, and
 * with `gap-px` that emptiness paints in the hairline colour: it reads as a
 * rendering fault. One column, then three.
 *
 * @param {Array}  categories  [{ key, icon, en, bn, tiers: [...] }]
 * @param {"en"|"bn"} locale
 * @param {string} index       Section number for SectionIndex.
 */

/* 24×24, 1.6 stroke, currentColor — the same rules the admin icon set follows.
   Drawn here rather than pulled from a library for the reason spelled out in
   components/admin/icons.jsx: this page needs six marks, and six paths are
   cheaper than a dependency. */
function TrackIcon({ name, className = "size-4" }) {
    const paths = {
        business: (
            <>
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9.5 11h5M9.5 15h5" />
            </>
        ),
        custom: (
            <>
                <path d="m8.5 8.5-4 3.5 4 3.5" />
                <path d="m15.5 8.5 4 3.5-4 3.5" />
                <path d="m13.5 5-3 14" />
            </>
        ),
        wordpress: (
            <>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 9h18" />
                <path d="M7 13h6" />
            </>
        ),
        shopify: (
            <>
                <path d="M5 8h14l-1 12H6L5 8Z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </>
        ),
        seo: (
            <>
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m20.5 20.5-5.3-5.3" />
            </>
        ),
        mobile: (
            <>
                <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
                <path d="M11 18.5h2" />
            </>
        ),
    };

    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
        >
            {paths[name] ?? paths.custom}
        </svg>
    );
}

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

function PriceBlock({ price, locale, ui }) {
    if (!price || typeof price.amount !== "number") return null;

    const { amount, original, from, custom } = price;
    const pct = discountPercent(amount, original);
    const saving = pct > 0 ? original - amount : 0;

    return (
        <div className="mt-7">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {from && (
                    <span className="text-[0.9375rem] leading-none text-(--text-mute)">
                        {ui.from}
                    </span>
                )}

                <span className="nums text-[clamp(1.875rem,3vw,2.375rem)] leading-none font-medium tracking-[-0.04em] text-(--text)">
                    {formatTaka(amount, locale)}
                </span>

                {pct > 0 && (
                    <span className="nums text-[1.25rem] leading-none text-(--text-mute)">
                        {/* The rule is not announced by a screen reader, so the
                            meaning is carried in text for anyone who cannot see it. */}
                        <span className="sr-only">{ui.listPrice} </span>
                        <span className="line-through decoration-[1.5px]">
                            {formatTaka(original, locale)}
                        </span>
                    </span>
                )}
            </div>

            <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {pct > 0 && (
                    <>
                        <span className="label-mono nums text-brand">
                            {formatTaka(saving, locale)} {ui.save}
                        </span>
                        <span aria-hidden="true" className="text-(--line)">
                            /
                        </span>
                    </>
                )}
                <span className="label-mono text-(--text-mute)">
                    {custom ? ui.customScope : ui.oneTime}
                </span>
            </div>
        </div>
    );
}

function TierCell({ tier, locale, ui }) {
    const copy = tier[locale] ?? tier.en ?? {};
    const hot = Boolean(tier.highlighted);

    /* The code travels to /contact, where InquiryForm reads it once on mount
       and seeds the message box. A plain query param rather than router state:
       state does not survive a refresh or a pasted link, and the whole point
       of this CTA is that the reply already knows which package was clicked. */
    const href = `/contact?package=${encodeURIComponent(`${copy.name ?? tier.code} (${tier.code})`)}`;

    return (
        <div data-tier="" className="relative flex flex-col bg-(--canvas) p-7 md:p-8">
            {/* The recommended marker. A rule, not a pill: a pill hanging off
                the top edge only works on a card that floats, and nothing on
                this page does. */}
            {hot && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-brand" />}

            <div className="flex items-baseline justify-between gap-3">
                <span className="label-mono text-brand">{copy.segment}</span>
                {hot && <span className="label-mono text-(--text-mute)">{ui.recommended}</span>}
            </div>

            <h4 className="mt-5 text-[1.25rem] font-medium tracking-[-0.02em] text-(--text)">
                {copy.name}
            </h4>
            {copy.badge && <p className="mt-1.5 text-[0.9375rem] text-(--text-dim)">{copy.badge}</p>}

            <PriceBlock price={tier.price} locale={locale} ui={ui} />

            <Link
                href={href}
                className={cn(
                    "group/pick mt-7 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.9375rem] font-medium transition-colors duration-200",
                    hot
                        ? "bg-(--text) text-(--canvas) hover:bg-brand hover:text-white"
                        : "border border-(--line) text-(--text) hover:border-(--text)",
                )}
            >
                {ui.chooseCta}
                <ArrowOut className="transition-transform duration-300 ease-out group-hover/pick:translate-x-0.5 group-hover/pick:-translate-y-0.5" />
            </Link>

            <dl className="mt-8">
                {(copy.features ?? []).map((f, i) => (
                    <div
                        // Labels repeat across locales but not within one tier,
                        // and the index is the stable fallback for a row saved
                        // twice with the same label by mistake.
                        key={`${f.label}-${i}`}
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

export default function PackageTiers({ categories, locale, index = "01" }) {
    const ui = PACKAGES_UI[locale];
    const [activeKey, setActiveKey] = useState(categories[0]?.key ?? "");
    const grid = useRef(null);

    /* An editor can deactivate the open track while someone is on the page and
       the next revalidation drops it from `categories`. Without this the
       component renders the fallback category but keeps the stale key in
       state, so the tab strip shows nothing selected. */
    useEffect(() => {
        if (categories.length === 0) return;
        if (!categories.some((c) => c.key === activeKey)) setActiveKey(categories[0].key);
    }, [categories, activeKey]);

    const category = categories.find((c) => c.key === activeKey) ?? categories[0];

    /* A full replace, not a re-flow: switching track swaps all three tiers for
       three different ones, so there is no shared element to carry continuity.
       A short staggered rise is the honest read of "these are different tiers".

       `locale` is in the dependency list as well as `activeKey` — switching
       language rewrites every string in the grid, and animating the track
       change but not the language change would make one of the two feel
       broken. */
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
                // Tier columns differ in height between tracks and between
                // locales, so every trigger below the grid moves. Debounced
                // through lib/scrollRefresh.
                onComplete: refreshScroll,
            });
        },
        { dependencies: [activeKey, locale], scope: grid },
    );

    if (!category) {
        return (
            <section className="border-b border-(--line)">
                <div className="shell py-20 md:py-28">
                    <SectionIndex index={index} label={ui.tracksLabel} />
                    <p className="mt-6 text-[0.9375rem] text-(--text-mute)">{ui.emptyState}</p>
                </div>
            </section>
        );
    }

    const meta = category[locale] ?? category.en ?? {};

    return (
        <section className="border-b border-(--line)">
            <div className="shell py-20 md:py-28">
                <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
                    <div className="lg:col-span-6">
                        <SectionIndex index={index} label={ui.tracksLabel} />
                        <h2 className="text-heading mt-6 max-w-[18ch]">{ui.tracksHeading}</h2>
                    </div>
                    <p className="max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-4 lg:col-start-9">
                        {ui.tracksLede}
                    </p>
                </div>

                {/* Track selector. Same pill idiom as every other filter rail on
                    the site — one page should not teach the reader two ways to
                    switch a view. */}
                <div
                    role="tablist"
                    aria-label={ui.tracksLabel}
                    className="mt-12 flex gap-2 overflow-x-auto pb-1"
                >
                    {categories.map((c) => {
                        const on = c.key === category.key;
                        return (
                            <button
                                key={c.key}
                                type="button"
                                role="tab"
                                aria-selected={on}
                                onClick={() => setActiveKey(c.key)}
                                className={cn(
                                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[0.875rem] whitespace-nowrap transition-colors duration-200",
                                    on
                                        ? "border-(--text) bg-(--text) text-(--canvas)"
                                        : "border-(--line) text-(--text-mute) hover:border-(--text) hover:text-(--text)",
                                )}
                            >
                                <TrackIcon name={c.icon} />
                                {(c[locale] ?? c.en ?? {}).title}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-9 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-subheading text-(--text)">{meta.title}</h3>
                    {meta.platform && (
                        <span className="label-mono text-(--text-mute)">{meta.platform}</span>
                    )}
                </div>
                {meta.bestFor && (
                    <p className="mt-2.5 max-w-2xl text-[0.9375rem] leading-relaxed text-(--text-dim)">
                        {meta.bestFor}
                    </p>
                )}

                <div
                    ref={grid}
                    className="mt-8 grid gap-px border border-(--line) bg-(--line) lg:grid-cols-3"
                >
                    {category.tiers.map((tier) => (
                        <TierCell key={tier.code} tier={tier} locale={locale} ui={ui} />
                    ))}
                </div>
            </div>
        </section>
    );
}
