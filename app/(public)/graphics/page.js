import PageMasthead from "@/components/ui/PageMasthead";
import CTABand from "@/components/ui/CTABand";
import JsonLd from "@/components/seo/JsonLd";
import GraphicsRateCard from "@/components/graphics/GraphicsRateCard";
import GraphicsShowcase from "@/components/graphics/GraphicsShowcase";
import GraphicsQuoteForm from "@/components/graphics/GraphicsQuoteForm";
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
 * ── HOW THIS DIFFERS FROM /packages, DELIBERATELY ────────────────────────
 * /packages is the whole shelf across five disciplines, one card per piece,
 * with the EUR build rates beside it. This is one discipline taken apart:
 * eight passes a catalogue image goes through, each
 * one priced on its own in cents, with the before and after that proves it.
 * A client shopping for a website and a client shipping four thousand product
 * shots are not the same reader and should not be handed the same page.
 *
 * ── WHY IT IS NOT IN THE NAVBAR ──────────────────────────────────────────
 * It is a page you are sent to, not one you browse into, so the sitemap and
 * direct links are the routes in. Adding it to site.nav is a one line change
 * if that ever stops being true.
 *
 * ── WHERE THE CONTENT LIVES ──────────────────────────────────────────────
 * lib/graphics.js, behind two async accessors, exactly as /packages's records
 * sit behind getCatalogueItems and getPricing. Point their bodies at the API
 * and this file is unchanged. The prices are single sourced on the service
 * rows and projected into the table, so the rate card and the section that
 * describes each pass cannot drift apart.
 *
 * ── WHY THE DATA IS FETCHED HERE AND PASSED DOWN ─────────────────────────
 * Neither section owns state. The only client code on the route is
 * CompareFrame, which takes image paths and labels as strings, so the copy
 * ships as HTML rather than as part of a bundle. Same arrangement as
 * CatalogueGrid and PricingGrid.
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

            {/* ── Where the order form sits, and why ──────────────────────
                After the eight blocks, not beside the rate card. The rate card
                answers "what does this cost" and the showcase answers "can they
                actually do it" — a reader who has just dragged the handle
                across eight real before-and-afters is the one with something to
                send, and a reader who has not is being asked to order on a
                price alone. CTABand stays below it for the other visitor on
                this page: the one who wants a whole project rather than a
                batch, and belongs on /contact.

                It is a client component and the only other one on the route is
                CompareFrame, so the copy above it still ships as HTML. */}
            <GraphicsQuoteForm
                index="03"
                /* The same records the showcase renders, so a published pass
                   can never be orderable under a name this page does not show.
                   The form adds EXTRA_PASSES to them — work the studio takes
                   that has no compare pair here yet; lib/graphicsQuote.js says
                   why those are not rows in this array. `title` is what the
                   server stores either way — see the note on servicesRequired
                   in str-backend/src/validators/graphicsQuote.validator.js. */
                services={services.map((s) => ({ id: s.id, title: s.title }))}
                contact={{
                    whatsapp: site.contact.whatsapp,
                    whatsappHref: site.contact.whatsappHref,
                    email: site.contact.email,
                }}
            />

            <CTABand
                title="Send two images and we will send them back edited."
                body="No brief needed. Tell us the marketplace you are listing on and the sample comes back cut, cleaned and sized to that spec, with the rate for the full batch beside it."
                /* Points at the form above it, not at /contact. The band makes a
                   promise the order desk on this page already keeps; sending a
                   reader who has scrolled past it to a general inquiry form is
                   asking them to describe a batch they could have attached. */
                primary={{ label: "Send two images", href: "#order" }}
                /* /packages, not /overview: the two render the same page, but
                   /overview canonicalises away, and an internal link should
                   always point at the URL we want indexed. */
                secondary={{ label: "See the whole shelf", href: "/packages" }}
            />
        </>
    );
}
