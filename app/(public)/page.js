import Hero from "@/components/home/Hero";
import AboutStatement from "@/components/home/AboutStatement";
import CapabilityStack from "@/components/home/CapabilityStack";
import ProcessTracker from "@/components/home/ProcessTracker";
import SelectedWork from "@/components/home/SelectedWork";
import EcosystemBand from "@/components/home/EcosystemBand";
import TestimonialRail from "@/components/home/TestimonialRail";
import FaqSection from "@/components/home/FaqSection";
import JsonLd from "@/components/seo/JsonLd";
import { site } from "@/lib/site";
import { getFeaturedProjects, getServices, getTestimonials } from "@/lib/api";
import { buildMetadata, faqSchema } from "@/lib/seo";
import { faqs, metrics, processSteps } from "@/lib/data";

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
 * ── DATA COMES FROM THE API, NOT FROM lib/data ───────────────────────────
 * Services, projects and testimonials are fetched through lib/api, which is
 * the same layer every other public route already uses. This page was the last
 * one still importing lib/data directly, which meant the admin panel could
 * publish a project and the homepage would keep showing the seed copy.
 *
 * lib/api keeps the static content as a FALLBACK, not as the source: if
 * Express is unreachable the page serves stale copy rather than a 500, and a
 * CI build does not fail because the backend is not running. A 404 still
 * propagates, so a missing slug stays a 404 and the sitemap cannot start
 * lying.
 *
 * ⚑ `metrics`, `processSteps` and `faqs` stay on lib/data on purpose. There
 * are no endpoints behind them — they are not Mongoose models, they are site
 * copy. When those get admin screens, they move to lib/api and this import
 * disappears. Until then, importing them from lib/api would be pretending.
 *
 * ── WHY THIS FILE STAYS A SERVER COMPONENT ───────────────────────────────
 * Every section below is a client component, but none of them imports the data
 * layer. lib/api is server-only by construction (it reaches next/headers
 * through ./session), and lib/data is ~1,200 lines, most of it case-study and
 * service-overview HTML that no homepage section renders. A client component
 * importing either pulls the whole module into the browser bundle; the module
 * graph does not care that only four fields are read.
 *
 * The projections below are explicit field lists rather than spreads for the
 * same reason. `...p` would quietly re-admit the case-study HTML the moment
 * someone adds a field, and the regression is invisible until somebody
 * profiles the bundle.
 *
 * ── SECTION RHYTHM ───────────────────────────────────────────────────────
 *   Hero          statement, delivery map, discipline band
 *   About         01 — narrative and the four numbers behind it
 *   Capabilities  02 — the full service line, one open at a time
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
    const [rawServices, rawProjects, rawQuotes] = await Promise.all([
        getServices(),
        getFeaturedProjects(4),
        getTestimonials({ featuredOnly: true }),
    ]);

    const services = rawServices.map((s) => ({
        slug: s.slug,
        title: s.title,
        shortDescription: s.shortDescription,
        deliverableTimeline: s.deliverableTimeline,
        featuresList: (s.featuresList ?? []).slice(0, 6),
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
            <ProcessTracker steps={processSteps} />
            <SelectedWork projects={projects} />
            <EcosystemBand />
            <TestimonialRail testimonials={quotes} />
            <FaqSection faqs={faqs} />
        </>
    );
}
