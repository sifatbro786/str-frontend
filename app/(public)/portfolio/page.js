import PageMasthead from "@/components/ui/PageMasthead";
import CTABand from "@/components/ui/CTABand";
import JsonLd from "@/components/seo/JsonLd";
import TestimonialRail from "@/components/home/TestimonialRail";
import DisciplineBand from "@/components/portfolio/DisciplineBand";
import PortfolioGrid from "@/components/portfolio/PortfolioGrid";
import PricingGrid from "@/components/portfolio/PricingGrid";
import { getTestimonials } from "@/lib/api";
import { PORTFOLIO_DISCIPLINES } from "@/lib/portfolio";
import { getPortfolioItems, portfolioCounts, portfolioStats } from "@/lib/portfolioData";
import { getPricing } from "@/lib/pricingData";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

/**
 * Title, description, keywords and OG image are editable at
 * /admin/page-meta → Portfolio. The values below are the fallback for when
 * that row is empty or the API is unreachable; lib/seo.js holds the
 * precedence rules.
 *
 * ⚑ "portfolio" is enumerated in three places and they move together: the
 * schema enum in str-backend/src/models/PageMeta.js, IDENTIFIERS in
 * str-backend/src/validators/pageMeta.validator.js, and the admin list in
 * app/(admin)/admin/page-meta/page.js. Drop it from any one of them and this
 * `identifier` silently stops resolving, because getPageMeta swallows its own
 * failures and returns null — the page keeps rendering with the fallbacks
 * below and nothing reports that the dashboard is being ignored.
 */
export async function generateMetadata() {
    return buildMetadata({
        identifier: "portfolio",
        path: "/portfolio",
        title: "Portfolio and pricing",
        /* Kept under 160 characters. The dashboard field enforces that cap
           because Google truncates past roughly there, and a fallback that
           would itself be cut is a fallback that fails the same test. */
        description:
            "Web builds, 3D visualisation, campaign reporting, design and video work from STR Solutions Ltd, with published EUR pricing and monthly SEO retainers.",
    });
}

/**
 * /portfolio — the sample library, the published rates, and the reviews.
 *
 * ── HOW THIS DIFFERS FROM /projects, DELIBERATELY ────────────────────────
 * /projects is the written-up case studies: a problem, a decision and a
 * number, one page each, fetched from the API. This is the shelf behind them
 * — individual pieces, most of which will never get a case study because the
 * deliverable was a file rather than a launch. Keeping them apart is what
 * stops either page from becoming a mixed bag: /projects stays arguable,
 * /portfolio stays browsable.
 *
 * ── WHAT THIS PAGE DOES *NOT* CARRY, AND WHY ─────────────────────────────
 * The v1 /info page it replaces also held a metrics band, a ten-service
 * capability accordion and a client logo wall. All three already exist here,
 * API-driven: metrics and partners are SiteContent blocks behind
 * /admin/site-content, and the service catalogue is the Service collection
 * behind /services. Re-rendering any of them from a static file on this route
 * would give the same content two sources of truth — one editable, one
 * needing a deploy — and they drift silently, which is the failure mode that
 * is impossible to notice until a client reads two different numbers.
 *
 * Pricing is the one v1 section with no home anywhere in v2, which is why it
 * is here rather than merely referenced. The SEO retainer track inside it is
 * not from v1 at all: it comes from the separate SEO packages deck, General
 * SEO scope only, repriced. See the note above it in lib/pricingData.js.
 *
 * ── WHY THE DATA IS FETCHED HERE AND PASSED DOWN ─────────────────────────
 * PortfolioGrid and PricingGrid own filter state and nothing else. Importing
 * the records inside them would ship every line of copy to the browser as
 * code; taking them as props ships them once as data, already in the HTML
 * payload, so the first paint is filtered-correct and fully crawlable with JS
 * disabled. Same arrangement as ProjectRail.
 *
 * ── WHEN THIS MOVES BEHIND THE DASHBOARD ─────────────────────────────────
 * `getPortfolioItems()` and `getPricing()` are already async and are the only
 * accessors this route touches. Point their bodies at the API and this file
 * is unchanged.
 */
export default async function PortfolioPage() {
    /* Two independent round trips — the static accessors resolve immediately,
       the testimonials call is a real fetch. Awaiting them in sequence would
       add its latency to TTFB for nothing. `getTestimonials` is deliberately
       not wrapped: lib/api stopped swallowing errors on purpose, and the
       homepage calls it exactly this way. A testimonials outage should surface,
       not render a page that quietly has no proof on it. */
    const [items, pricing, rawQuotes] = await Promise.all([
        getPortfolioItems(),
        getPricing(),
        getTestimonials({ featuredOnly: true }),
    ]);

    const counts = portfolioCounts(items);

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
            <JsonLd data={[breadcrumbSchema([{ name: "Portfolio", path: "/portfolio" }])]} />

            <PageMasthead
                index="06"
                eyebrow="Portfolio"
                title="The whole shelf, and what it costs."
                lede="Case studies live on /projects, a problem, a decision and a number each. This is the library behind them: live builds, render sets, campaign reporting, artwork and cuts, one card per piece with the file it was handed over as. Rates are published further down."
                breadcrumb={[{ label: "Home", href: "/" }, { label: "Portfolio" }]}
                /* Counted from the records rather than written by hand. A prose
                   claim about the catalogue stops being true the first time the
                   catalogue changes, and nothing tells you. */
                meta={portfolioStats(items)}
            />

            <DisciplineBand disciplines={PORTFOLIO_DISCIPLINES} counts={counts} />

            <PortfolioGrid
                items={items}
                disciplines={PORTFOLIO_DISCIPLINES}
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
