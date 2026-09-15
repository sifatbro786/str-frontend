import PageMasthead from "@/components/ui/PageMasthead";
import CTABand from "@/components/ui/CTABand";
import JsonLd from "@/components/seo/JsonLd";
import GraphicsRateCard from "@/components/graphics/GraphicsRateCard";
import GraphicsShowcase from "@/components/graphics/GraphicsShowcase";
import {
    GRAPHICS_HERO,
    formatRate,
    getGraphicsRateCard,
    getGraphicsServices,
} from "@/lib/graphics";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

/**
 * Title, description, keywords and OG image are editable at
 * /admin/page-meta → /graphics. The values below are the fallback for when
 * that row is empty or the API is unreachable; lib/seo.js holds the precedence
 * rules.
 *
 * ⚑ "graphics" is enumerated in three places and they move together: the
 * schema enum in str-backend/src/models/PageMeta.js, IDENTIFIERS in
 * str-backend/src/validators/pageMeta.validator.js, and the admin list in
 * app/(admin)/admin/page-meta/page.js. Drop it from any one of them and this
 * `identifier` silently stops resolving, because getPageMeta swallows its own
 * failures and returns null — the page keeps rendering with the fallbacks
 * below and nothing reports that the dashboard is being ignored.
 */
export async function generateMetadata() {
    return buildMetadata({
        identifier: "graphics",
        path: "/graphics",
        title: "Image editing rates and samples",
        /* Under 160 characters, same cap the dashboard field enforces. */
        description:
            "Clipping path, background removal, masking, invisible mannequin, retouching and shadow work from 15c per image, with before and after samples.",
        keywords: [
            "clipping path service",
            "background removal service",
            "image masking",
            "invisible mannequin",
            "photo retouching",
            "shadow and reflection",
            "ecommerce image editing",
            "bulk image editing Bangladesh",
        ],
    });
}

/**
 * /graphics — the image production line, priced per pass.
 *
 * ── HOW THIS DIFFERS FROM /overview, DELIBERATELY ────────────────────────
 * /overview is the whole shelf across five disciplines, one card per piece,
 * with EUR build rates for European clients at the bottom. This is one
 * discipline taken apart: eight passes a catalogue image goes through, each
 * one priced on its own in cents, with the before and after that proves it.
 * A client shopping for a website and a client shipping four thousand product
 * shots are not the same reader and should not be handed the same page.
 *
 * ── WHY IT IS NOT IN THE NAVBAR ──────────────────────────────────────────
 * Same call as /overview. It is a page you are sent to, not one you browse
 * into, so the sitemap and direct links are the routes in. Adding it to
 * site.nav is a one line change if that ever stops being true.
 *
 * ── WHERE THE CONTENT LIVES ──────────────────────────────────────────────
 * lib/graphics.js, behind two async accessors, exactly as /overview's records
 * sit behind getPortfolioItems and getPricing. Point their bodies at the API
 * and this file is unchanged. The prices are single sourced on the service
 * rows and projected into the table, so the rate card and the section that
 * describes each pass cannot drift apart.
 *
 * ── WHY THE DATA IS FETCHED HERE AND PASSED DOWN ─────────────────────────
 * Neither section owns state. The only client code on the route is
 * CompareFrame, which takes image paths and labels as strings, so the copy
 * ships as HTML rather than as part of a bundle. Same arrangement as
 * PortfolioGrid and PricingGrid.
 */
export default async function GraphicsPage() {
    /* Both accessors resolve immediately today. Awaited in parallel anyway,
       because the day either one becomes a real fetch is not the day anyone
       will remember to come back and change this. */
    const [services, rateCard] = await Promise.all([
        getGraphicsServices(),
        getGraphicsRateCard(),
    ]);

    return (
        <>
            <JsonLd data={[breadcrumbSchema([{ name: "Graphics", path: "/graphics" }])]} />

            <PageMasthead
                index="07"
                eyebrow="Graphics"
                title="Eight passes between the shoot and the shelf."
                lede="Catalogue and fashion image production, run as a line rather than as a favour. Cut, isolate, mask, ghost, colour, clean, ground and size. Every pass is priced on its own and every sample below is real client work."
                breadcrumb={[{ label: "Home", href: "/" }, { label: "Graphics" }]}
                /* Read off the records rather than written by hand. A "from"
                   figure typed into the copy stops being true the first time a
                   rate moves and nothing tells you. */
                meta={[
                    { label: "Passes", value: `${services.length}, bought separately` },
                    { label: "Starting rate", value: `${formatRate(rateCard.from)} per image` },
                    { label: "Volume", value: "Quoted per batch" },
                    { label: "Studio", value: "Dhaka and EU" },
                ]}
            />

            <GraphicsRateCard
                index="01"
                rates={rateCard.rates}
                terms={rateCard.terms}
                bulk={rateCard.bulk}
                hero={GRAPHICS_HERO}
                /* The numbers live in lib/site.js, which is the one place the
                   company's own details are allowed to be written down. */
                contact={{
                    whatsapp: site.contact.whatsapp,
                    whatsappHref: site.contact.whatsappHref,
                    email: site.contact.email,
                }}
            />

            <GraphicsShowcase index="02" services={services} />

            <CTABand
                title="Send two images and we will send them back edited."
                body="No brief needed. Tell us the marketplace you are listing on and the sample comes back cut, cleaned and sized to that spec, with the rate for the full batch beside it."
                primary={{ label: "Start a project", href: "/contact" }}
                secondary={{ label: "See the whole shelf", href: "/overview" }}
            />
        </>
    );
}
