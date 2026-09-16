import PageMasthead from "@/components/ui/PageMasthead";
import CTABand from "@/components/ui/CTABand";
import JsonLd from "@/components/seo/JsonLd";
import TestimonialRail from "@/components/home/TestimonialRail";
import DisciplineBand from "@/components/packages/DisciplineBand";
import CatalogueGrid from "@/components/packages/CatalogueGrid";
import PricingGrid from "@/components/packages/PricingGrid";
import { getTestimonials } from "@/lib/api";
import { DISCIPLINES } from "@/lib/disciplines";
import { getCatalogueItems, catalogueCounts, catalogueStats } from "@/lib/catalogue";
import { getPricing } from "@/lib/pricingData";
import { absolute, breadcrumbSchema } from "@/lib/seo";
import { site } from "@/lib/site";

/**
 * The whole body of /packages — sample library, published EUR rates, reviews.
 *
 * ── WHY THIS IS A COMPONENT AND NOT JUST THE ROUTE FILE ──────────────────
 * Two routes render it. /packages is the real one, linked from the navbar and
 * the footer and listed in the sitemap. /overview is the address that went out
 * to clients before the rename and must keep answering 200 rather than 404, so
 * it renders the same thing and canonicalises to /packages — see the header of
 * app/(public)/overview/page.js. One component means the two can never drift;
 * a second copy of this tree is a second copy of the prices.
 *
 * `path` is the only thing that differs, and only inside the structured data:
 * the breadcrumb and every Offer url must name the route actually being served,
 * because a schema block that points somewhere else is a schema block Google
 * disagrees with the page about.
 *
 * ── WHAT THIS REPLACED ───────────────────────────────────────────────────
 * /packages used to be the bilingual BDT catalogue backed by the Package,
 * PackageCategory and PackagePage collections and edited at /admin/packages.
 * That whole stack is gone — model, controller, routes, validator, seed, admin
 * screen and the `packages` cache tag with it. Nothing here touches the API for
 * pricing any more; the numbers come from lib/pricingData.js.
 *
 * ── WHY THE DATA IS FETCHED HERE AND PASSED DOWN ─────────────────────────
 * CatalogueGrid and PricingGrid own filter state and nothing else. Importing
 * the records inside them would ship every line of copy to the browser as
 * code; taking them as props ships them once as data, already in the HTML
 * payload, so the first paint is filtered-correct and fully crawlable with JS
 * disabled. Same arrangement as ProjectRail.
 *
 * ── WHEN THIS MOVES BEHIND THE DASHBOARD ─────────────────────────────────
 * `getCatalogueItems()` and `getPricing()` are already async and are the only
 * accessors this component touches. Point their bodies at the API and this
 * file is unchanged.
 */
export default async function PackagesContent({ path = "/packages" }) {
    /* Two independent round trips — the static accessors resolve immediately,
       the testimonials call is a real fetch. Awaiting them in sequence would
       add its latency to TTFB for nothing. `getTestimonials` is deliberately
       not wrapped: lib/api stopped swallowing errors on purpose, and the
       homepage calls it exactly this way. A testimonials outage should surface,
       not render a page that quietly has no proof on it. */
    const [items, pricing, rawQuotes] = await Promise.all([
        getCatalogueItems(),
        getPricing(),
        getTestimonials({ featuredOnly: true }),
    ]);

    const counts = catalogueCounts(items);

    /* Projected down to the six fields the rail renders. The full documents
       also carry rating, projectRef and timestamps, and every unread field is
       bytes crossing the server to client boundary on every request. Same
       projection the homepage uses, `clientAvatar` included. */
    const quotes = rawQuotes.slice(0, 8).map((t) => ({
        _id: t._id,
        reviewText: t.reviewText,
        clientName: t.clientName,
        clientDesignation: t.clientDesignation,
        companyName: t.companyName,
        clientAvatar: t.clientAvatar ?? "",
    }));

    return (
        <>
            <JsonLd
                data={[
                    breadcrumbSchema([{ name: "Packages", path }]),
                    offerCatalogSchema(pricing.categories, pricing.prices, path),
                ]}
            />

            <PageMasthead
                index="06"
                eyebrow="Packages"
                title="Every package, and what it costs."
                lede="Four build tracks and an SEO retainer, three tiers each, priced on the page. Under them is the library the rates buy: live builds, render sets, campaign reporting, artwork and cuts, one card per piece with the file it was handed over as. Written-up case studies live on /projects."
                breadcrumb={[{ label: "Home", href: "/" }, { label: "Packages" }]}
                /* Counted from the records rather than written by hand. A prose
                   claim about the catalogue stops being true the first time the
                   catalogue changes, and nothing tells you. */
                meta={catalogueStats(items)}
            />

            <DisciplineBand disciplines={DISCIPLINES} counts={counts} />

            <CatalogueGrid
                items={items}
                disciplines={DISCIPLINES}
                counts={counts}
                contactEmail={site.contact.email}
            />

            <PricingGrid
                index="02"
                categories={pricing.categories}
                prices={pricing.prices}
                terms={pricing.terms}
                contactEmail={site.contact.email}
            />

            {/* The same rail the homepage runs, renumbered and retitled through
                props. It returns null on an empty list, so an unseeded
                Testimonial collection drops the section instead of leaving a
                heading over nothing. */}
            <TestimonialRail
                testimonials={quotes}
                index="03"
                eyebrow="In their words"
                title="What the people who paid these rates say."
            />

            <CTABand
                title="Want the folder rather than the page?"
                body="Tell us the discipline and the kind of piece you are after and the source files come over the same day, whether renders, artwork, cuts or the reporting pack."
                primary={{ label: "Start a project", href: "/contact" }}
                secondary={{ label: "Read the case studies", href: "/projects" }}
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
 * answering "what does a Next.js corporate site cost" can quote a real figure
 * with a source instead of inventing one.
 *
 * ── WHY THE MONTHLY TIERS ARE SHAPED DIFFERENTLY ─────────────────────────
 * A bare `price` on an Offer reads as the total cost of the thing. On the three
 * SEO tiers that is false by a factor of twelve a year, so they go out as a
 * UnitPriceSpecification with a one-month reference quantity instead — the
 * same distinction lib/pricingData.js draws with `period`, which is why that
 * flag lives on the price rather than on the tier.
 *
 * ── WHY `original` IS NOT SENT ───────────────────────────────────────────
 * The struck-through figure is what nobody pays. Sending it as `price` would
 * advertise a fiction; sending it as a second priceSpecification without a
 * validThrough date makes a claim about a discount window this page does not
 * make.
 *
 * `@id` points at the organisation block emitted once in the public layout, so
 * Google resolves these offers onto the existing entity rather than a second
 * competing one.
 */
function offerCatalogSchema(categories, prices, path) {
    const url = absolute(path);

    const offers = categories.flatMap((category) =>
        category.tiers
            .map((tier) => {
                /* A tier with no row in EURO_PRICES renders as "on request" in
                   the grid. Emitting it here with an empty price would put a
                   priceless Offer in the feed, which validators flag and which
                   tells a reader nothing. Skipped instead. */
                const price = prices[tier.id];
                if (!price || price.amount == null) return null;

                return {
                    "@type": "Offer",
                    name: tier.name,
                    category: category.title,
                    description: tier.badge || undefined,
                    url,
                    ...(price.period === "month"
                        ? {
                              priceSpecification: {
                                  "@type": "UnitPriceSpecification",
                                  price: String(price.amount),
                                  priceCurrency: "EUR",
                                  referenceQuantity: {
                                      "@type": "QuantitativeValue",
                                      value: 1,
                                      // UN/CEFACT code for month. Schema.org's
                                      // unitCode expects one of these, not "month".
                                      unitCode: "MON",
                                  },
                              },
                          }
                        : { price: String(price.amount), priceCurrency: "EUR" }),
                    itemOffered: {
                        "@type": "Service",
                        name: tier.name,
                        serviceType: category.title,
                        provider: { "@id": `${site.url}/#organization` },
                    },
                };
            })
            .filter(Boolean),
    );

    if (offers.length === 0) return null;

    return {
        "@context": "https://schema.org",
        "@type": "OfferCatalog",
        name: "Packages and pricing",
        url,
        provider: { "@id": `${site.url}/#organization` },
        itemListElement: offers,
    };
}
