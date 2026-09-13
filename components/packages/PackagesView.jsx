"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import PageMasthead from "@/components/ui/PageMasthead";
import Reveal from "@/components/motion/Reveal";
import SectionIndex from "@/components/ui/SectionIndex";
import PackageTiers from "./PackageTiers";
import { cn, pad } from "@/lib/utils";
import {
    HTML_LANG,
    LOCALES,
    LOCALE_PARAM,
    PACKAGES_UI,
    formatCount,
    hostOf,
} from "@/lib/packagesUi";

/**
 * /packages, everything below the fetch.
 *
 * ── WHY THE WHOLE ROUTE IS ONE CLIENT COMPONENT ──────────────────────────
 * Every section on this page changes when the language switch is pressed, so
 * there is no server/client seam to draw inside it: splitting would mean
 * lifting the locale to a context and re-rendering the same subtrees anyway,
 * with a provider in between. The data still crosses as props, which is the
 * arrangement components/portfolio/PricingGrid.jsx already uses — the copy
 * arrives in the HTML payload as data rather than being imported as code, so
 * the first paint is correct and crawlable with JS disabled.
 *
 * The route above stays a server component and keeps lib/api out of the
 * browser bundle.
 *
 * ── HOW THE LOCALE AND THE URL STAY IN STEP ──────────────────────────────
 * `?lang=bn` is read on the server (see the route) and rendered directly, so a
 * shared or crawled Bengali link is Bengali in the HTML, not after hydration.
 * Pressing the switch updates the URL with `window.history.replaceState` —
 * NOT `router.replace`. Next supports this specifically for search-param
 * updates that should not re-run the server; router.replace would round-trip
 * to the server to re-render a page whose data is already in memory, costing a
 * network hop and a scroll reset to change a string the client already has.
 *
 * replaceState rather than pushState: the switch is a view preference, and
 * pushing makes Back cycle through languages instead of leaving the page,
 * which is the single most irritating thing a language toggle can do.
 */
export default function PackagesView({ page, categories, initialLocale, whatsappHref }) {
    const [locale, setLocale] = useState(initialLocale);
    const ui = PACKAGES_UI[locale];
    const copy = page?.[locale] ?? page?.en ?? {};

    const switchLocale = useCallback(() => {
        const next = LOCALES.find((l) => l !== locale) ?? LOCALES[0];
        setLocale(next);

        try {
            const url = new URL(window.location.href);
            url.searchParams.set(LOCALE_PARAM, next);
            window.history.replaceState(null, "", url.toString());
        } catch {
            /* A URL the browser will not parse is not a reason to refuse the
               language switch — the state above has already changed and the
               page is correct; only the address bar is stale. */
        }
    }, [locale]);

    const hero = copy.hero ?? {};
    const essentials = copy.essentials ?? {};
    const closing = copy.closing ?? {};
    const showcase = page?.showcase ?? [];

    const tierCount = categories.reduce((n, c) => n + c.tiers.length, 0);

    /* Counted from the records, not written by hand. A prose claim about the
       catalogue stops being true the first time the catalogue changes, and
       nothing tells you. Same reasoning as portfolioStats on /portfolio. */
    const meta = [
        { label: ui.meta.tracks, value: formatCount(categories.length, locale) },
        { label: ui.meta.packages, value: formatCount(tierCount, locale) },
        { label: ui.meta.currency, value: ui.currencyValue },
        { label: ui.meta.billing, value: ui.billingValue },
    ];

    const grouped = [
        { key: "custom", items: showcase.filter((s) => s.group === "custom") },
        { key: "wp-shopify", items: showcase.filter((s) => s.group === "wp-shopify") },
    ].filter((g) => g.items.length > 0);

    return (
        <>
            {/* key={locale} remounts the masthead on a language switch, which
                replays its split-text reveal over the new headline. That is the
                intended effect, not a side effect: the headline is the one
                element large enough that swapping its text with no transition
                reads as a glitch. */}
            <PageMasthead
                key={locale}
                index="07"
                /* Falling back to the chrome strings rather than rendering an
                   empty <h1>: an unseeded database is a normal first state on
                   a fresh environment, and the masthead's split-text reveal
                   measures the heading before paint. A page with no headline
                   at all is a harder thing to diagnose than one showing its
                   own name. */
                eyebrow={hero.eyebrow || ui.breadcrumbSelf}
                title={hero.title || ui.tracksHeading}
                lede={hero.lede}
                breadcrumb={[
                    { label: ui.breadcrumbHome, href: "/" },
                    { label: ui.breadcrumbSelf },
                ]}
                meta={meta}
            >
                {hero.trust && (
                    <p className="mt-5 text-[0.9375rem] leading-relaxed text-(--text-mute)">
                        {hero.trust}
                    </p>
                )}

                {/* The switch sits in the masthead's right rail, beside the copy
                    it changes, rather than floating in a corner of the header.
                    aria-live is deliberately absent: the whole page changes, so
                    announcing the button's own new label would be the least
                    useful thing to read out. lang on each label is what lets a
                    screen reader pronounce "বাংলা" with the right voice. */}
                <button
                    type="button"
                    onClick={switchLocale}
                    aria-label={ui.switchAriaLabel}
                    className="group/lang mt-7 inline-flex items-center gap-2.5 rounded-full border border-(--line) px-4 py-2 text-[0.875rem] text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text)"
                >
                    <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M3.5 12h17" />
                        <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18Z" />
                    </svg>
                    <span lang={HTML_LANG[locale === "en" ? "bn" : "en"]}>{ui.switchTo}</span>
                </button>
            </PageMasthead>

            <PackageTiers categories={categories} locale={locale} index="01" />

            {/* ── Essentials ───────────────────────────────────────────────
                The numbered hairline grid used for engagement shapes on /about
                and billing terms on /portfolio, so it reads as the same kind of
                thing: facts about what you get, not features being sold. */}
            {(essentials.items ?? []).length > 0 && (
                <section className="border-b border-(--line)">
                    <div className="shell py-20 md:py-28">
                        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
                            <div className="lg:col-span-7">
                                <SectionIndex index="02" label={ui.essentialsLabel} />
                                <h2 className="text-heading mt-6 max-w-[20ch]">
                                    {essentials.title}
                                </h2>
                            </div>
                            {essentials.kicker && (
                                <p className="label-mono text-(--text-mute) lg:col-span-4 lg:col-start-9">
                                    {essentials.kicker}
                                </p>
                            )}
                        </div>

                        <Reveal
                            className="mt-12 grid gap-px border border-(--line) bg-(--line) sm:grid-cols-2 lg:grid-cols-4"
                            stagger={0.07}
                        >
                            {essentials.items.map((item, i) => (
                                <div key={`${item.title}-${i}`} data-reveal="" className="bg-(--canvas) p-7">
                                    <span className="label-mono nums text-brand">{pad(i + 1)}</span>
                                    <h3 className="mt-5 text-[1.0625rem] font-medium tracking-[-0.02em] text-(--text)">
                                        {item.title}
                                    </h3>
                                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </Reveal>
                    </div>
                </section>
            )}

            {/* ── Selected work ───────────────────────────────────────────── */}
            {grouped.length > 0 && (
                <section className="border-b border-(--line)">
                    <div className="shell py-20 md:py-28">
                        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
                            <div className="lg:col-span-6">
                                <SectionIndex index="03" label={ui.workLabel} />
                                <h2 className="text-heading mt-6 max-w-[16ch]">{ui.workTitle}</h2>
                            </div>
                            <p className="max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-4 lg:col-start-9">
                                {ui.workSubtitle}
                            </p>
                        </div>

                        {grouped.map((group) => (
                            <div key={group.key} className="mt-12">
                                <SectionIndex label={ui.groups[group.key]} />
                                <Reveal
                                    className="mt-5 grid gap-px border border-(--line) bg-(--line) sm:grid-cols-2 lg:grid-cols-3"
                                    stagger={0.05}
                                >
                                    {group.items.map((item) => (
                                        <ShowcaseCard
                                            key={item.url}
                                            item={item}
                                            visit={ui.visit}
                                        />
                                    ))}
                                </Reveal>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Closing band ─────────────────────────────────────────────
                Hand-built rather than <CTABand>, for two reasons that both
                apply: the labels are bilingual and come from the database, and
                the secondary action is an outbound WhatsApp link rather than an
                internal route. The colours are hard-coded to --text / --canvas
                exactly as CTABand does, because this section swaps them — a
                nested component reading --text inside here renders dark on
                dark. */}
            {(closing.title || closing.body) && (
                <section className="bg-(--text) text-(--canvas)">
                    <div className="shell grid gap-10 py-20 md:py-28 lg:grid-cols-12 lg:items-end">
                        <div className="lg:col-span-7">
                            <p className="label-mono opacity-55">{ui.breadcrumbSelf}</p>
                            <h2 className="text-heading mt-5 max-w-[16ch]">{closing.title}</h2>
                        </div>

                        <div className="lg:col-span-5">
                            <p className="max-w-md text-[1.0625rem] leading-relaxed opacity-70">
                                {closing.body}
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                {closing.primaryCta && (
                                    <Link
                                        href="/contact"
                                        className="group/cta inline-flex items-center gap-2.5 rounded-full bg-(--canvas) px-7 py-3.5 text-[0.9375rem] font-medium text-(--text) transition-colors duration-200 hover:bg-brand hover:text-white"
                                    >
                                        {closing.primaryCta}
                                        <svg
                                            width="15"
                                            height="15"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.7"
                                            aria-hidden="true"
                                            className="transition-transform duration-300 ease-out group-hover/cta:translate-x-1"
                                        >
                                            <path
                                                d="M2.5 8h11M9.5 4l4 4-4 4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </Link>
                                )}

                                {closing.secondaryCta && whatsappHref && (
                                    <a
                                        href={whatsappHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-full border border-(--canvas)/25 px-7 py-3.5 text-[0.9375rem] font-medium transition-colors hover:border-(--canvas)"
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.7"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.7-4.8A8.5 8.5 0 1 1 21 11.5Z" />
                                        </svg>
                                        {closing.secondaryCta}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}

/**
 * One outbound link in the selected-work grid.
 *
 * The favicon is decoration layered over the initials, not a replacement for
 * them: it is a third-party request that fails quietly on a blocked network,
 * and a grid of empty squares is worse than a grid of monograms. The initials
 * render first and the image paints on top of them only if it arrives.
 */
function ShowcaseCard({ item, visit }) {
    const host = hostOf(item.url);
    const initials = item.name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0] ?? "")
        .join("")
        .toUpperCase();

    return (
        <a
            data-reveal=""
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.name} — ${visit}`}
            className={cn(
                "group/site flex items-center gap-4 bg-(--canvas) p-6",
                "transition-colors duration-200 hover:bg-(--raised)",
            )}
        >
            <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-(--line) text-[0.8125rem] font-medium text-(--text-mute)">
                {initials}
                {/* eslint-disable-next-line @next/next/no-img-element --
                    deliberately not next/image: this is a third-party favicon
                    service, optimising it would mean whitelisting google.com in
                    next.config remotePatterns and paying for an optimiser pass
                    on a 32px icon that is allowed to fail. */}
                <img
                    src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
                    alt=""
                    loading="lazy"
                    width="44"
                    height="44"
                    className="absolute inset-0 size-full bg-(--canvas) object-contain p-2.5"
                    onError={(e) => {
                        e.currentTarget.style.display = "none";
                    }}
                />
            </span>

            <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.9375rem] font-medium text-(--text)">
                    {item.name}
                </span>
                <span className="label-mono block truncate text-(--text-mute)">{host}</span>
            </span>

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
                className="shrink-0 text-(--text-mute) transition-transform duration-300 ease-out group-hover/site:translate-x-0.5 group-hover/site:-translate-y-0.5 group-hover/site:text-brand"
            >
                <path d="M5 11 11 5M5.5 4.5H11.5V10.5" />
            </svg>
        </a>
    );
}
