import { site } from "./site";
import { getPageMeta } from "./api";

/**
 * lib/seo.js — one place that builds every page's <head>, and the reason a
 * marketer can do their job without a deploy.
 *
 * ── THE POINT OF THIS FILE ───────────────────────────────────────────────
 * Titles and descriptions were hard-coded into each route's `metadata`
 * export. That means changing a meta description — the single most common
 * SEO edit there is — required a developer, a commit and a deploy. In
 * practice it means it never happens.
 *
 * There is already a PageMeta collection in Mongo and an /admin/page-meta
 * screen editing it. `pageMeta()` below reads that row and layers it over the
 * code defaults, so whatever the marketer types in the dashboard wins. If the
 * row is empty or the API is down, the defaults render and nothing breaks.
 *
 * Precedence, highest first:
 *   1. the PageMeta row for this pageIdentifier   (dashboard)
 *   2. the `fallback` passed by the route          (code)
 *   3. lib/site.js                                 (brand)
 *
 * ── WHY EVERY BUILDER TAKES AN ABSOLUTE PATH ─────────────────────────────
 * Canonicals and OG urls have to be absolute. metadataBase in app/layout.js
 * makes Next resolve relative ones, but og:image in particular is copied
 * verbatim by several crawlers that do not resolve anything. Absolute here,
 * always, and built from site.url so a domain change is one edit.
 *
 * ── ON TITLE LENGTH ⚑ ────────────────────────────────────────────────────
 * Google truncates around 580px, which is roughly 55-60 characters including
 * the brand suffix. `titleFor` does NOT truncate — silently cutting a title
 * the marketer wrote is worse than showing them it is long. The admin form is
 * where the counter belongs.
 */

const BRAND = site.legalName;

/** Absolute URL for any app path. Accepts "/", "/about", "blogs/x". */
export function absolute(path = "/") {
    const clean = path.startsWith("/") ? path : `/${path}`;
    return new URL(clean, site.url).toString();
}

/**
 * The one function every public route should call.
 *
 * @param {object} o
 * @param {string} o.identifier  PageMeta.pageIdentifier: home | about |
 *                               services | projects | blogs | contact.
 *                               Omit for routes with no dashboard row
 *                               (detail pages), which pass their own values.
 * @param {string} o.path        App path, for canonical and og:url.
 * @param {string} o.title       Fallback title, WITHOUT the brand suffix.
 * @param {string} o.description Fallback description.
 * @param {string} o.image       Fallback OG image path.
 * @param {string[]} o.keywords
 * @param {"website"|"article"} o.type
 * @param {object} o.article     { publishedTime, modifiedTime, authors, tags }
 * @param {boolean} o.noIndex
 */
export async function buildMetadata({
    identifier,
    path = "/",
    title,
    description,
    image,
    keywords,
    type = "website",
    article,
    noIndex = false,
} = {}) {
    // getPageMeta already swallows its own failures and returns null, so an
    // unreachable API degrades to the code defaults rather than a 500.
    const row = identifier ? await getPageMeta(identifier) : null;

    const finalTitle = row?.metaTitle || title || site.tagline;
    const finalDescription = row?.metaDescription || description || site.description;
    const finalImage = row?.ogImage || image || site.brand.logo;
    const finalKeywords =
        (row?.keywords?.length ? row.keywords : null) ?? keywords ?? site.keywords;

    const url = absolute(path);
    const ogImage = absolute(finalImage);

    return {
        // `absolute` rather than the layout's template. The template only applies
        // to child route segments, and several of these pages ARE the segment
        // that defines it, so the suffix has to be spelled out.
        title: { absolute: `${finalTitle} | ${BRAND}` },
        description: finalDescription,
        keywords: finalKeywords,
        alternates: { canonical: url },
        robots: noIndex
            ? { index: false, follow: false }
            : {
                  index: true,
                  follow: true,
                  // Without max-image-preview:large, Google renders a thumbnail
                  // instead of a full-width image card in Discover and on mobile.
                  googleBot: {
                      index: true,
                      follow: true,
                      "max-video-preview": -1,
                      "max-image-preview": "large",
                      "max-snippet": -1,
                  },
              },
        openGraph: {
            // A page-level openGraph REPLACES the parent's wholesale rather than
            // merging, so siteName and locale are restated on every page.
            type,
            siteName: BRAND,
            locale: "en_US",
            url,
            title: `${finalTitle} | ${BRAND}`,
            description: finalDescription,
            images: [{ url: ogImage, width: 1200, height: 630, alt: finalTitle }],
            ...(type === "article" && article
                ? {
                      publishedTime: article.publishedTime,
                      modifiedTime: article.modifiedTime ?? article.publishedTime,
                      authors: article.authors,
                      tags: article.tags,
                  }
                : {}),
        },
        twitter: {
            card: "summary_large_image",
            title: `${finalTitle} | ${BRAND}`,
            description: finalDescription,
            images: [ogImage],
        },
    };
}

/**
 * Hero copy the dashboard can override, for routes that want it.
 * Returns null when there is no row, so callers can `?? theirDefault`.
 */
export async function heroCopy(identifier) {
    const row = await getPageMeta(identifier);
    if (!row?.dynamicHeroHeadline && !row?.dynamicHeroSubtitle) return null;
    return {
        headline: row.dynamicHeroHeadline || null,
        subtitle: row.dynamicHeroSubtitle || null,
    };
}

/* ═══════════════════════════════════════════════════════════════════════
   Structured data.

   Every builder returns a plain object. Render it with <JsonLd data={...} />
   (components/seo/JsonLd.jsx), never by hand-writing a <script> tag — the
   payload has to be JSON.stringify'd and escaped, and getting that wrong is
   an XSS hole rather than a formatting bug.

   ⚑ Schema is not decoration. Google's rich-result tests reject a graph with
   a required field missing, and a rejected graph earns nothing at all — so
   prefer omitting an optional field to guessing at it. Every value below
   traces to lib/site.js or to real record data.
   ═══════════════════════════════════════════════════════════════════════ */

/** Sitewide. Render once, in the public layout. */
export function organizationSchema() {
    const sameAs = Object.values(site.social).filter(Boolean);

    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${site.url}/#organization`,
        name: BRAND,
        alternateName: site.name,
        url: site.url,
        logo: absolute(site.brand.logo),
        description: site.description,
        foundingDate: String(site.foundedYear),
        ...(sameAs.length ? { sameAs } : {}),
        address: {
            "@type": "PostalAddress",
            // ⚑ streetAddress is deliberately absent: lib/site.js has it empty
            // pending confirmation, and a fabricated address in structured data is
            // a trust signal pointing the wrong way.
            addressLocality: site.address.city,
            addressCountry: site.address.countryCode,
        },
        contactPoint: [
            {
                "@type": "ContactPoint",
                contactType: "sales",
                email: site.contact.salesEmail,
                telephone: site.contact.phone,
                areaServed: ["BD", "GB", "US", "AU", "IT", "AE", "SG"],
                availableLanguage: ["en", "bn"],
            },
        ],
    };
}

/** Sitewide. The SearchAction is what can earn a sitelinks search box. */
export function websiteSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: BRAND,
        publisher: { "@id": `${site.url}/#organization` },
        inLanguage: "en",
    };
}

/**
 * Breadcrumbs. Pass the trail WITHOUT the home crumb; it is prepended.
 * @param {{name: string, path: string}[]} trail
 */
export function breadcrumbSchema(trail = []) {
    const items = [{ name: "Home", path: "/" }, ...trail];
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: absolute(c.path),
        })),
    };
}

/** One service page. */
export function serviceSchema(service) {
    return {
        "@context": "https://schema.org",
        "@type": "Service",
        name: service.title,
        description: service.shortDescription,
        url: absolute(`/services/${service.slug}`),
        provider: { "@id": `${site.url}/#organization` },
        areaServed: { "@type": "Place", name: "Worldwide" },
        ...(service.deliverableTimeline
            ? { termsOfService: `Typical delivery: ${service.deliverableTimeline}` }
            : {}),
    };
}

/** One blog post. */
export function articleSchema(post) {
    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt ?? post.metaDescription ?? "",
        url: absolute(`/blogs/${post.slug}`),
        mainEntityOfPage: absolute(`/blogs/${post.slug}`),
        datePublished: post.publishedAt ?? post.createdAt,
        dateModified: post.updatedAt ?? post.publishedAt ?? post.createdAt,
        author: post.author
            ? { "@type": "Person", name: post.author }
            : { "@id": `${site.url}/#organization` },
        publisher: { "@id": `${site.url}/#organization` },
        ...(post.coverImage ? { image: [absolute(post.coverImage)] } : {}),
        ...(post.tags?.length ? { keywords: post.tags.join(", ") } : {}),
    };
}

/** One case study. CreativeWork, not Product — nothing here is for sale. */
export function caseStudySchema(project) {
    return {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: project.title,
        description: project.shortDescription,
        url: absolute(`/projects/${project.slug}`),
        dateCreated: project.projectDate ?? project.createdAt,
        creator: { "@id": `${site.url}/#organization` },
        ...(project.clientName ? { about: project.clientName } : {}),
        ...(project.coverImage ? { image: [absolute(project.coverImage)] } : {}),
        ...(project.tags?.length ? { keywords: project.tags.join(", ") } : {}),
    };
}

/**
 * FAQPage.
 *
 * ⚑ Google restricted FAQ rich results to authoritative government and health
 * sites in 2023, so this will almost certainly NOT render stars or an
 * accordion in search for an agency site. It is still worth emitting: it
 * feeds the entity graph, Bing still shows it, and assistants read it. Do not
 * let anyone report it as a broken feature.
 */
export function faqSchema(faqs = []) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
    };
}
