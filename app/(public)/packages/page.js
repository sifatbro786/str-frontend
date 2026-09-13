import JsonLd from "@/components/seo/JsonLd";
import PackagesView from "@/components/packages/PackagesView";
import { getPackages } from "@/lib/api";
import { absolute, breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { LOCALE_PARAM, PACKAGES_UI, coerceLocale } from "@/lib/packagesUi";

/**
 * /packages — published rates, in English and Bengali.
 *
 * ── WHY THIS ROUTE IS DYNAMIC WHERE THE OTHERS ARE STATIC ────────────────
 * It reads `searchParams`, which opts the route out of static generation. That
 * is the price of `?lang=bn` being a real, shareable, crawlable URL rather
 * than a client-side toggle that leaves every Bengali link pointing at an
 * English page.
 *
 * It costs far less than it sounds. `getPackages()` goes through apiFetch,
 * which tags the request "packages" and caches it for the revalidate window —
 * so a request here renders HTML from data already in Next's cache and makes
 * no network call. What is dynamic is the render, not the fetch.
 *
 * ── WHY BOTH LOCALES ARE SENT DOWN AND THE SWITCH IS CLIENT-SIDE ─────────
 * See the header of components/packages/PackagesView.jsx. Short version: the
 * whole payload is a few kilobytes of text, the switch is instant, and the
 * first paint is still correct for whichever locale the URL asked for.
 *
 * ── WHAT LIVES WHERE ─────────────────────────────────────────────────────
 *   · prices, tier copy, essentials, closing, showcase → Mongo, /admin/packages
 *   · title / description / OG image                   → PageMeta, /admin/page-meta
 *   · "From", "You save", "Visit site", breadcrumbs    → lib/packagesUi.js
 *   · WhatsApp number, contact email                   → lib/site.js
 *
 * ⚑ "packages" is enumerated in three places and they move together: the
 * schema enum in str-backend/src/models/PageMeta.js, IDENTIFIERS in
 * str-backend/src/validators/pageMeta.validator.js, and the admin list in
 * app/(admin)/admin/page-meta/page.js. Drop it from any one and the dashboard
 * silently stops affecting this page — getPageMeta swallows its own failures
 * and returns null, so the fallbacks below keep rendering and nothing reports
 * that the row is being ignored.
 */

export async function generateMetadata({ searchParams }) {
    const locale = coerceLocale((await searchParams)?.[LOCALE_PARAM]);

    const base = await buildMetadata({
        identifier: "packages",
        path: locale === "en" ? "/packages" : `/packages?${LOCALE_PARAM}=${locale}`,
        title: "Packages and pricing",
        /* Under 160 characters. The dashboard field enforces that cap because
           Google truncates past roughly there, and a fallback that would
           itself be cut is a fallback that fails the same test. */
        description:
            "Published BDT rates from STR Solutions Ltd — business sites, custom MERN e-commerce, WooCommerce and Shopify builds. Fixed scope, no discovery call to get a number.",
    });

    /* hreflang. Both languages are the same URL with a different query, so
       without these two entries Google sees near-duplicate pages and picks one
       itself — usually the English one, for every reader. x-default points at
       the bare path, which is what an unparameterised link resolves to. */
    return {
        ...base,
        alternates: {
            ...base.alternates,
            canonical: absolute(
                locale === "en" ? "/packages" : `/packages?${LOCALE_PARAM}=${locale}`,
            ),
            languages: {
                en: absolute("/packages"),
                "bn-BD": absolute(`/packages?${LOCALE_PARAM}=bn`),
                "x-default": absolute("/packages"),
            },
        },
    };
}

export default async function PackagesPage({ searchParams }) {
    /* Next 15: searchParams is a Promise. Awaited alongside the data rather
       than before it — the fetch does not depend on the locale, so serialising
       them would add the resolution to TTFB for nothing. */
    const [params, data] = await Promise.all([searchParams, getPackages()]);

    const locale = coerceLocale(params?.[LOCALE_PARAM]);
    const ui = PACKAGES_UI[locale];

    const categories = data?.categories ?? [];
    const page = data?.page ?? null;

    return (
        <>
            <JsonLd
                data={[
                    breadcrumbSchema([{ name: ui.breadcrumbSelf, path: "/packages" }]),
                    offerCatalogSchema(categories, locale),
                ]}
            />

            <PackagesView
                page={page}
                categories={categories}
                initialLocale={locale}
                whatsappHref={site.contact.whatsappHref}
            />
        </>
    );
}

/**
 * OfferCatalog for the published rates.
 *
 * ── WHY THIS IS WORTH EMITTING AT ALL ────────────────────────────────────
 * Google does not render rich results for a service price the way it does for
 * a product, so this buys no stars in the SERP. What it does buy is the one
 * thing that matters for an agency: the prices on this page become machine
 * readable and attributable to the organisation, which is how an assistant
 * answering "what does a WooCommerce store cost in Bangladesh" can quote a
 * real figure with a source instead of inventing one.
 *
 * ── WHY priceCurrency IS HARD-CODED ──────────────────────────────────────
 * The schema enum on Package.price.currency has exactly one member today. When
 * a second is added, read it from the row — a wrong currency code in
 * structured data is worse than no currency code, because it is confidently
 * wrong and nothing on the rendered page contradicts it.
 *
 * `@id` points at the organisation block emitted once in the public layout, so
 * Google resolves these offers onto the existing entity rather than a second
 * competing one.
 */
function offerCatalogSchema(categories, locale) {
    const offers = categories.flatMap((category) =>
        category.tiers.map((tier) => {
            const copy = tier[locale] ?? tier.en ?? {};
            const track = (category[locale] ?? category.en ?? {}).title ?? "";

            return {
                "@type": "Offer",
                name: copy.name,
                /* The struck-through figure is not sent. Sending it as `price`
                   would advertise a number nobody pays; sending it as
                   priceSpecification without a validThrough date makes a claim
                   about a discount window this page does not make. */
                price: String(tier.price?.amount ?? ""),
                priceCurrency: "BDT",
                category: track,
                description: copy.badge || undefined,
                url: absolute("/packages"),
                itemOffered: {
                    "@type": "Service",
                    name: copy.name,
                    serviceType: track,
                    provider: { "@id": `${site.url}/#organization` },
                },
            };
        }),
    );

    if (offers.length === 0) return null;

    return {
        "@context": "https://schema.org",
        "@type": "OfferCatalog",
        name: locale === "bn" ? "প্যাকেজ ও প্রাইসিং" : "Packages and pricing",
        url: absolute("/packages"),
        provider: { "@id": `${site.url}/#organization` },
        itemListElement: offers,
    };
}
