import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CTABand from "@/components/ui/CTABand";
import Reveal from "@/components/motion/Reveal";
import JsonLd from "@/components/seo/JsonLd";
import SectionIndex from "@/components/ui/SectionIndex";
import { getProjectBySlug, getProjectNeighbours, getProjects, paramsOrEmpty } from "@/lib/api";
import { absoluteMedia, breadcrumbSchema, buildMetadata, caseStudySchema } from "@/lib/seo";
import { SERVICE_LABELS } from "@/lib/taxonomy";
import { MEDIA_FALLBACK, cn, formatDate, mediaUrl } from "@/lib/utils";

/* dynamicParams: a case study published from the admin panel after the build
   renders on demand instead of 404ing until the next deploy. */
export const dynamicParams = true;

export async function generateStaticParams() {
    const projects = await paramsOrEmpty(() => getProjects({ limit: 200 }));
    return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const p = await getProjectBySlug(slug);

    // noIndex on the miss. A 404 that returns 200 with "not found" is a soft
    // 404, and enough of them across a site costs crawl budget everywhere.
    if (!p) return { title: "Case study not found", robots: { index: false, follow: false } };

    return buildMetadata({
        // No `identifier`: PageMeta rows exist for the six top-level routes
        // only. Detail pages carry their own metaTitle/metaDescription on the
        // record, which the admin project form already edits.
        path: `/projects/${p.slug}`,
        title: p.metaTitle || p.title,
        description: p.metaDescription || p.shortDescription,
        image: absoluteMedia(p.ogImage || p.coverImage),
        type: "article",
        keywords: p.tags,
        article: {
            publishedTime: p.projectDate ?? p.createdAt,
            modifiedTime: p.updatedAt,
            tags: p.tags,
        },
    });
}

/* Gallery layout comes off each image's own `layoutType`, so an author
   controls the rhythm from the admin panel rather than it being derived from
   position. "full" spans the measure, "half" pairs up, "grid" runs three. */
const SPAN = {
    full: "md:col-span-12",
    half: "md:col-span-6",
    grid: "md:col-span-4",
};

/**
 * Case study.
 *
 * ── THE ARGUMENT THIS PAGE MAKES ─────────────────────────────────────────
 * Masthead with the client and the outcome, then the numbers, then the
 * written narrative at a reading measure with the deliverables beside it,
 * then the gallery, then where to go next. The order is deliberate: someone
 * who reads only the first screen should already know who it was for, what
 * changed, and roughly how big it was.
 *
 * ── WHY THE MASTHEAD IS LOCAL AND NOT PageMasthead ───────────────────────
 * Every other route's masthead is text on a hairline. This one leads with a
 * full-bleed cover image, which is a different structure rather than a
 * variant of the same one — bending PageMasthead to take an image would mean
 * a prop that changes its layout wholesale, which is two components wearing
 * one name.
 *
 * ── ON dangerouslySetInnerHTML ───────────────────────────────────────────
 * `fullCaseStudy` is sanitised on WRITE by the backend: project.routes.js
 * runs sanitizeHtml("fullCaseStudy") before validate on both POST and PATCH,
 * with an allow-list matching what .prose-str can style. It must stay
 * unsanitised here — sanitising again on read with a second allow-list is how
 * content silently loses markup nobody can explain six months later.
 */
export default async function ProjectDetailPage({ params }) {
    const { slug } = await params;
    const p = await getProjectBySlug(slug);
    if (!p) notFound();

    const { prev, next } = await getProjectNeighbours(slug);

    const links = [
        ["Live site", p.liveUrl],
        ["Repository", p.githubUrl],
        ["Design file", p.figmaUrl],
        ["App Store", p.appStoreUrl],
        ["Play Store", p.playStoreUrl],
    ].filter(([, href]) => Boolean(href));

    return (
        <>
            <JsonLd
                data={[
                    caseStudySchema(p),
                    breadcrumbSchema([
                        { name: "Work", path: "/projects" },
                        { name: p.title, path: `/projects/${p.slug}` },
                    ]),
                ]}
            />

            {/* ── Masthead ────────────────────────────────────────────── */}
            <header className="border-b border-(--line)">
                <div className="shell pt-28 md:pt-36">
                    <nav
                        aria-label="Breadcrumb"
                        className="label-mono flex flex-wrap items-center gap-2 text-(--text-mute)"
                    >
                        <Link href="/" className="transition-colors hover:text-(--text)">
                            Home
                        </Link>
                        <span aria-hidden="true" className="text-(--line)">
                            /
                        </span>
                        <Link href="/projects" className="transition-colors hover:text-(--text)">
                            Work
                        </Link>
                        <span aria-hidden="true" className="text-(--line)">
                            /
                        </span>
                        <span aria-current="page" className="text-(--text)">
                            {p.title}
                        </span>
                    </nav>

                    <Reveal className="mt-9" stagger={0.07}>
                        <div data-reveal="" className="label-mono flex flex-wrap items-center gap-2.5 text-(--text-mute)">
                            <span className="text-brand">{p.clientName}</span>
                            <span aria-hidden="true" className="block size-1 rounded-full bg-(--line)" />
                            <span>{formatDate(p.projectDate, { long: true })}</span>
                        </div>

                        <h1 data-reveal="" className="text-display mt-5 max-w-[18ch]">
                            {p.title}
                        </h1>

                        <p
                            data-reveal=""
                            className="mt-7 max-w-2xl text-[clamp(1.125rem,1.8vw,1.5rem)] leading-[1.45] tracking-[-0.015em] text-(--text-dim)"
                        >
                            {p.subtitle}
                        </p>

                        <ul data-reveal="" className="mt-8 flex flex-wrap gap-2">
                            {p.serviceTypes.map((s) => (
                                <li key={s}>
                                    <Link
                                        href={`/services/${s}`}
                                        className="inline-block rounded-full border border-(--line) px-3.5 py-1.5 text-[0.8125rem] text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text)"
                                    >
                                        {SERVICE_LABELS[s]}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Reveal>

                    {/* Cover. priority: this is the LCP element on the route, and
                        without it Next lazy-loads it below the fold threshold and
                        the largest paint waits on an intersection callback. */}
                    <Reveal className="relative mt-12 aspect-[16/9] overflow-hidden rounded-2xl border border-(--line) md:mt-16">
                        <Image
                            src={mediaUrl(p.coverImage) ?? MEDIA_FALLBACK}
                            alt={`${p.title}, ${p.subtitle}`}
                            fill
                            priority
                            sizes="(max-width: 1280px) 100vw, 84rem"
                            className="object-cover object-top"
                        />
                    </Reveal>

                    {/* Spec row. Hairline grid rather than four floating columns:
                        these are facts about the engagement, and the rules are
                        what make them read as a spec sheet. */}
                    <Reveal
                        as="dl"
                        className="mt-px grid grid-cols-2 gap-px border border-(--line) bg-(--line) md:grid-cols-4"
                        stagger={0.05}
                    >
                        {[
                            ["Client", p.clientName],
                            ["Delivered", formatDate(p.projectDate)],
                            ["Deliverables", `${p.deliverables?.length ?? 0} line items`],
                            ["Stack", `${p.techStack?.length ?? 0} technologies`],
                        ].map(([k, v]) => (
                            <div key={k} data-reveal="" className="bg-(--canvas) px-5 py-5">
                                <dt className="label-mono text-(--text-mute)">{k}</dt>
                                <dd className="mt-2 text-[0.9375rem] text-(--text)">{v}</dd>
                            </div>
                        ))}
                    </Reveal>

                    <div className="h-16 md:h-24" />
                </div>
            </header>

            {/* ── Narrative and spec rail ─────────────────────────────── */}
            <section className="border-b border-(--line)">
                <div className="shell grid gap-x-12 gap-y-14 py-20 md:py-28 lg:grid-cols-12">
                    <Reveal className="lg:col-span-7">
                        <div
                            className="prose-str"
                            dangerouslySetInnerHTML={{ __html: p.fullCaseStudy }}
                        />
                    </Reveal>

                    <aside className="lg:col-span-4 lg:col-start-9">
                        <Reveal className="lg:sticky lg:top-28" stagger={0.05}>
                            {p.deliverables?.length > 0 && (
                                <div data-reveal="">
                                    <h2 className="label-mono text-(--text-mute)">What we shipped</h2>
                                    <ul className="mt-5 border-t border-(--line)">
                                        {p.deliverables.map((d) => (
                                            <li
                                                key={d}
                                                className="border-b border-(--line) py-3.5 text-[0.9375rem] leading-relaxed text-(--text-dim)"
                                            >
                                                {d}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {p.techStack?.length > 0 && (
                                <div data-reveal="" className="mt-10">
                                    <h2 className="label-mono text-(--text-mute)">Stack</h2>
                                    <ul className="mt-5 flex flex-wrap gap-2">
                                        {p.techStack.map((t) => (
                                            <li
                                                key={t.name ?? t}
                                                className="rounded-full border border-(--line) px-3.5 py-1.5 text-[0.8125rem] text-(--text-dim)"
                                            >
                                                {t.name ?? t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {links.length > 0 && (
                                <div
                                    data-reveal=""
                                    className="mt-10 rounded-2xl border border-(--line) bg-(--raised) p-6"
                                >
                                    <p className="label-mono text-(--text-mute)">See it live</p>
                                    <ul className="mt-4 space-y-2.5">
                                        {links.map(([label, href]) => (
                                            <li key={label}>
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group/ext inline-flex items-center gap-2 text-[0.9375rem] text-(--text) transition-colors hover:text-brand"
                                                >
                                                    {label}
                                                    <svg
                                                        width="11"
                                                        height="11"
                                                        viewBox="0 0 12 12"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.6"
                                                        aria-hidden="true"
                                                        className="transition-transform duration-300 group-hover/ext:-translate-y-0.5 group-hover/ext:translate-x-0.5"
                                                    >
                                                        <path
                                                            d="M3 9 9 3M4.2 3H9v4.8"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Reveal>
                    </aside>
                </div>
            </section>

            {/* ── Gallery ─────────────────────────────────────────────── */}
            {p.galleryImages?.length > 0 && (
                <section className="border-b border-(--line)">
                    <div className="shell py-20 md:py-28">
                        <SectionIndex index="02" label="Screens" />

                        <Reveal
                            className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-12"
                            stagger={0.09}
                        >
                            {p.galleryImages.map((img) => (
                                <figure
                                    key={img.url}
                                    data-reveal=""
                                    className={cn("group/shot", SPAN[img.layoutType] ?? SPAN.half)}
                                >
                                    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-(--line)">
                                        <Image
                                            src={mediaUrl(img.url) ?? MEDIA_FALLBACK}
                                            alt={img.caption || `${p.title} screen`}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            className="object-cover object-top transition-transform duration-700 ease-out group-hover/shot:scale-[1.03]"
                                        />
                                    </div>
                                    {img.caption && (
                                        <figcaption className="label-mono mt-3 text-(--text-mute)">
                                            {img.caption}
                                        </figcaption>
                                    )}
                                </figure>
                            ))}
                        </Reveal>
                    </div>
                </section>
            )}

            {/* ── Prev / next ─────────────────────────────────────────── */}
            {(prev || next) && (
                <section className="border-b border-(--line)">
                    <div className="shell grid gap-px border-x border-(--line) bg-(--line) md:grid-cols-2">
                        {[
                            ["Previous", prev, "left"],
                            ["Next", next, "right"],
                        ].map(([label, item, side]) =>
                            item ? (
                                <Link
                                    key={label}
                                    href={`/projects/${item.slug}`}
                                    className={cn(
                                        "group/nav flex flex-col justify-center bg-(--canvas) px-6 py-12 md:px-10 md:py-16",
                                        side === "right" && "md:items-end md:text-right",
                                    )}
                                >
                                    <span className="label-mono text-(--text-mute)">{label}</span>
                                    <span className="text-subheading mt-3 text-(--text)">
                                        <span
                                            className={cn(
                                                "inline-block transition-transform duration-400 ease-out",
                                                side === "right"
                                                    ? "group-hover/nav:translate-x-1.5"
                                                    : "group-hover/nav:-translate-x-1.5",
                                            )}
                                        >
                                            {item.title}
                                        </span>
                                    </span>
                                    <span className="mt-2 max-w-sm text-[0.9375rem] text-(--text-dim)">
                                        {item.subtitle}
                                    </span>
                                </Link>
                            ) : (
                                <div key={label} className="bg-(--canvas)" />
                            ),
                        )}
                    </div>
                </section>
            )}

            <CTABand
                title="Have a problem shaped like this one?"
                body="Send the constraint and the deadline. We will tell you within a day whether it is deliverable and what it would take."
                primary={{ label: "Start a project", href: "/contact" }}
                secondary={{ label: "All case studies", href: "/projects" }}
            />
        </>
    );
}
