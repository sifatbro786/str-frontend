import PageMasthead from "@/components/ui/PageMasthead";
import CTABand from "@/components/ui/CTABand";
import BlogArchive from "@/components/blogs/BlogArchive";
import JsonLd from "@/components/seo/JsonLd";
import { getBlogs, getBlogCategories } from "@/lib/api";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
    return buildMetadata({
        identifier: "blogs",
        path: "/blogs",
        title: "Insights",
        description:
            "Notes from the STR Solutions studio on performance, architecture, design systems, production process and growth.",
    });
}

/**
 * Article archive.
 *
 * ── WHY THERE IS NO ItemList SCHEMA HERE ─────────────────────────────────
 * An index page listing BlogPosting stubs is the classic place to emit an
 * ItemList, and it is almost always the wrong call: each article already
 * emits its own complete BlogPosting on its own route, and a second partial
 * copy of the same headline and description from a different URL gives Google
 * two records to reconcile rather than one to trust. The breadcrumb is what
 * this route genuinely adds.
 *
 * ⚑ `Cadence: Monthly, roughly` in the meta row is a promise. If publishing
 * stops it becomes a liability sitting at the top of the page, so it is worth
 * either deriving it from publishedAt gaps or deleting it.
 */
export default async function BlogsPage() {
    const [posts, categories] = await Promise.all([getBlogs(), getBlogCategories()]);

    return (
        <>
            <JsonLd data={breadcrumbSchema([{ name: "Insights", path: "/blogs" }])} />

            <PageMasthead
                index="04"
                eyebrow="Insights"
                title="Things we learned the expensive way."
                lede="Written by the people who did the work, about the decisions that turned out to matter. No listicles, no reposted release notes."
                breadcrumb={[{ label: "Home", href: "/" }, { label: "Insights" }]}
                meta={[
                    { label: "Published", value: `${posts.length} articles` },
                    // categories includes the synthetic "All", which is a filter
                    // control rather than a topic.
                    { label: "Topics", value: `${Math.max(categories.length - 1, 0)}` },
                    { label: "Written by", value: "The delivery team" },
                    { label: "Cadence", value: "Monthly, roughly" },
                ]}
            />

            <BlogArchive posts={posts} categories={categories} />

            <CTABand
                title="Want this applied to your own stack?"
                body="Most of these posts started as an audit finding. If any of them described your situation, an audit is usually the cheapest next step."
                primary={{ label: "Book an audit", href: "/contact" }}
                secondary={{ label: "See our services", href: "/services" }}
            />
        </>
    );
}
