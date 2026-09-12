import Hero from "@/components/home/Hero";
import AboutStatement from "@/components/home/AboutStatement";
import CapabilityStack from "@/components/home/CapabilityStack";
import ToolMarquee from "@/components/home/ToolMarquee";
import ProcessTracker from "@/components/home/ProcessTracker";
import SelectedWork from "@/components/home/SelectedWork";
import EcosystemBand from "@/components/home/EcosystemBand";
import TestimonialRail from "@/components/home/TestimonialRail";
import FaqSection from "@/components/home/FaqSection";
import JsonLd from "@/components/seo/JsonLd";
import { site } from "@/lib/site";
import {
    getFeaturedProjects,
    getServices,
    getSiteContent,
    getTestimonials,
} from "@/lib/api";
import { buildMetadata, faqSchema } from "@/lib/seo";

/**
 * generateMetadata, not a static `metadata` export, because the title and
 * description now come from the PageMeta row the marketer edits in
 * /admin/page-meta. The values below are the fallback when that row is empty
 * or the API is unreachable; see lib/seo.js for the precedence rules.
 */
export async function generateMetadata() {
    return buildMetadata({
        identifier: "home",
        path: "/",
        title: "Software, data and visual production",
        description: site.description,
        image: "/logo.png",
    });
}

/**
 * ── EVERYTHING ON THIS PAGE COMES FROM THE API ──────────────────────────
 * Services, projects, testimonials and the five SiteContent blocks all arrive
 * through lib/api. There is no static fallback behind any of it any more —
 * lib/data.js is deleted — so an unseeded database renders a homepage of
 * headings with nothing under them. Every section below returns null on empty
 * rather than rendering its own chrome, which is what makes that degrade
 * quietly instead of looking broken.
 *
 * ── WHY THIS FILE STAYS A SERVER COMPONENT ───────────────────────────────
 * Every section below is a client component, but none of them imports the data
 * layer: lib/api is server-only by construction, since it reaches next/headers
 * through ./session. The projections below are explicit field lists rather
 * than spreads for a related reason — `...p` would quietly start shipping the
 * case-study HTML across the server/client boundary the moment somebody adds a
 * field, and the regression is invisible until someone profiles the bundle.
 *
 * ── SECTION RHYTHM ───────────────────────────────────────────────────────
 *   Hero          statement, delivery map, discipline band
 *   About         01 — narrative and the four numbers behind it
 *   Capabilities  02 — the full service line as an index, with a sticky
 *                      preview of the hovered discipline
 *   Tooling       -- — the stack, as two crossing rails. Unnumbered on
 *                      purpose: it is a band, like the logo rail inside
 *                      EcosystemBand, not a chapter. Numbering it would
 *                      renumber 03–07 across four other files.
 *   Process       03 — how an engagement actually runs
 *   Work          04 — what it produced
 *   Ecosystem     05 — who stayed
 *   Testimonials  06 — what they said about it
 *   FAQ           07 — the objections, then the door to /contact
 *
 * Every section owns its own <section> and its own bottom border, so
 * reordering is a one-line move here. No spacing lives in this file.
 */
export default async function HomePage() {
    /* Three independent round trips, so they go out together. Awaiting them in
       sequence would serialise them and add both later requests' latency to
       TTFB for no reason — none of them depends on another's result. */
    const [rawServices, rawProjects, rawQuotes, metrics, processSteps, faqs, partners] =
        await Promise.all([
            getServices(),
            getFeaturedProjects(4),
            getTestimonials({ featuredOnly: true }),
            getSiteContent("metrics"),
            getSiteContent("process"),
            getSiteContent("faqs"),
            getSiteContent("partners"),
        ]);

    /* featuresList is gone from this projection: CapabilityStack stopped
       rendering deliverables when it became an index with a preview frame, and
       an unread field here is six strings per service crossing the server to
       client boundary on every homepage request. `image` replaces it. */
    const services = rawServices.map((s) => ({
        slug: s.slug,
        title: s.title,
        shortDescription: s.shortDescription,
        deliverableTimeline: s.deliverableTimeline,
        image: s.image ?? "",
        imageAlt: s.imageAlt ?? "",
    }));

    const projects = rawProjects.map((p) => ({
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        clientName: p.clientName,
        tags: (p.tags ?? []).slice(0, 2),
        thumbnailImage: p.thumbnailImage || p.coverImage,
        liveUrl: p.liveUrl,
        accentColor: p.accentColor,
    }));

    const quotes = rawQuotes.slice(0, 8).map((t) => ({
        _id: t._id,
        reviewText: t.reviewText,
        clientName: t.clientName,
        clientDesignation: t.clientDesignation,
        companyName: t.companyName,
        /* ⚑ This was missing, and it is why an avatar saved in the dashboard
           never appeared: the field was written to the database, read by the
           API, and then dropped here before it ever reached the rail. A
           projection is a whitelist, so forgetting a field is silent. */
        clientAvatar: t.clientAvatar ?? "",
    }));

    return (
        <>
            {/* The FAQ block is the only page-level schema the homepage earns.
          Organization and WebSite are emitted once in the layout, and
          repeating them here would create competing entities rather than
          reinforcing one. */}
            <JsonLd data={faqSchema(faqs)} />

            <Hero />
            <AboutStatement metrics={metrics} />
            <CapabilityStack services={services} />
            <ToolMarquee />
            <ProcessTracker steps={processSteps} />
            <SelectedWork projects={projects} />
            <EcosystemBand partners={partners} />
            <TestimonialRail testimonials={quotes} />
            <FaqSection faqs={faqs} />
        </>
    );
}
