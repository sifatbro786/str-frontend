import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageMasthead from "@/components/ui/PageMasthead";
import CTABand from "@/components/ui/CTABand";
import Reveal from "@/components/motion/Reveal";
import JsonLd from "@/components/seo/JsonLd";
import { getServices, getServiceBySlug, getProjects } from "@/lib/api";
import { breadcrumbSchema, buildMetadata, serviceSchema } from "@/lib/seo";
import { SERVICE_MEDIA, SERVICE_LABELS } from "@/lib/taxonomy";
import { pad } from "@/lib/utils";

/* dynamicParams: a service published from the admin panel after the build
   renders on demand instead of 404ing until the next deploy. */
export const dynamicParams = true;

export async function generateStaticParams() {
    const services = await getServices();
    return services.map((s) => ({ slug: s.slug }));
}

/* Next 15: `params` is a Promise in both generateMetadata and the page.
   Awaiting it is what keeps this forward-compatible with Next 16. */
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const service = await getServiceBySlug(slug);

    // noIndex on the miss, not just a title. A 404 that returns 200 with
    // "Service not found" is a soft 404, and enough of them across a site
    // costs crawl budget on every other page.
    if (!service) return { title: "Service not found", robots: { index: false, follow: false } };

    return buildMetadata({
        // No `identifier`: PageMeta rows exist for the six top-level routes
        // only. Detail pages carry their own metaTitle/metaDescription on the
        // record itself, which the admin service form already edits.
        path: `/services/${service.slug}`,
        title: service.metaTitle || service.title,
        description: service.metaDescription || service.shortDescription,
        image: SERVICE_MEDIA[service.slug] ?? "/logo.png",
        type: "article",
    });
}

/**
 * Service detail.
 *
 * ── THE SHAPE ────────────────────────────────────────────────────────────
 * Masthead, then a two-column body: the authored overview on the left at a
 * reading measure, and a spec rail on the right carrying the deliverables and
 * the timeline. Then proof (case studies that used this service), then the
 * sibling disciplines, then the close.
 *
 * The rail is the part that earns its place. Someone on this page is deciding
 * whether to enquire, and the two things they need are "what do I actually
 * get" and "how long". Both are one glance from the top of the page rather
 * than buried in prose.
 *
 * ── ON dangerouslySetInnerHTML ⚑ ─────────────────────────────────────────
 * `detailedOverview` is authored HTML. Today it comes from our own content
 * layer and is trusted. The moment it is edited through the admin panel by
 * anyone other than a developer, it MUST be sanitised server-side before it
 * reaches this prop — the admin form is a rich text field, and a rich text
 * field that renders unsanitised is stored XSS. Sanitise on write in the
 * backend, not on read here; sanitising on read means every consumer has to
 * remember.
 */
export default async function ServiceDetailPage({ params }) {
    const { slug } = await params;
    const service = await getServiceBySlug(slug);
    if (!service) notFound();

    const [services, related] = await Promise.all([
        getServices(),
        getProjects({ service: service.slug, limit: 3 }),
    ]);

    const index = services.findIndex((s) => s.slug === service.slug);
    const others = services.filter((s) => s.slug !== service.slug);

    return (
        <>
            <JsonLd
                data={[
                    serviceSchema(service),
                    breadcrumbSchema([
                        { name: "Services", path: "/services" },
                        { name: service.title, path: `/services/${service.slug}` },
                    ]),
                ]}
            />

            <PageMasthead
                index={pad(index + 1)}
                eyebrow="Service"
                title={service.title}
                lede={service.shortDescription}
                breadcrumb={[
                    { label: "Home", href: "/" },
                    { label: "Services", href: "/services" },
                    { label: service.title },
                ]}
                meta={[
                    { label: "Typical timeline", value: service.deliverableTimeline },
                    { label: "Deliverables", value: `${service.featuresList.length} line items` },
                    {
                        label: "Case studies",
                        value: related.length ? `${related.length} published` : "On request",
                    },
                    { label: "Engagement", value: "Fixed scope or squad" },
                ]}
            />

            {/* ── Overview and spec rail ──────────────────────────────── */}
            <section className="border-b border-(--line)">
                <div className="shell grid gap-x-12 gap-y-14 py-20 md:py-28 lg:grid-cols-12">
                    <Reveal className="lg:col-span-7">
                        <div
                            className="prose-str"
                            dangerouslySetInnerHTML={{ __html: service.detailedOverview }}
                        />

                        {SERVICE_MEDIA[service.slug] && (
                            <figure className="relative mt-14 aspect-[16/9] overflow-hidden rounded-2xl border border-(--line)">
                                <Image
                                    src={SERVICE_MEDIA[service.slug]}
                                    alt={`${service.title}, representative work`}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 58vw"
                                    className="object-cover object-top"
                                />
                            </figure>
                        )}
                    </Reveal>

                    {/* sticky, so the answer to "what do I get" stays on screen
              while the overview is read. top clears the fixed navbar. */}
                    <aside className="lg:col-span-4 lg:col-start-9">
                        <Reveal className="lg:sticky lg:top-28" stagger={0.05}>
                            <h2 data-reveal="" className="label-mono text-(--text-mute)">
                                What you receive
                            </h2>

                            <ul data-reveal="" className="mt-5 border-t border-(--line)">
                                {service.featuresList.map((f, i) => (
                                    <li
                                        key={f}
                                        className="flex gap-4 border-b border-(--line) py-4 text-[0.9375rem] leading-relaxed text-(--text-dim)"
                                    >
                                        <span className="label-mono shrink-0 pt-0.5 tabular-nums text-(--text-mute)">
                                            {pad(i + 1)}
                                        </span>
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <div
                                data-reveal=""
                                className="mt-10 rounded-2xl border border-(--line) bg-(--raised) p-6"
                            >
                                <p className="label-mono text-(--text-mute)">Typical timeline</p>
                                <p className="mt-3 text-[1.5rem] font-medium tracking-[-0.025em] text-(--text)">
                                    {service.deliverableTimeline}
                                </p>
                                <p className="mt-4 text-[0.9375rem] leading-relaxed text-(--text-mute)">
                                    Confirmed after discovery. We give a date, not a range, before
                                    any build work is invoiced.
                                </p>
                                <Link
                                    href="/contact"
                                    className="group/cta mt-6 inline-flex items-center gap-2.5 rounded-full bg-(--text) px-6 py-3 text-[0.9375rem] font-medium text-(--canvas) transition-colors duration-200 hover:bg-brand hover:text-white"
                                >
                                    Scope this service
                                    <span
                                        aria-hidden="true"
                                        className="transition-transform duration-300 group-hover/cta:translate-x-1"
                                    >
                                        →
                                    </span>
                                </Link>
                            </div>
                        </Reveal>
                    </aside>
                </div>
            </section>

            {/* ── Related case studies ────────────────────────────────── */}
            {related.length > 0 && (
                <section className="border-b border-(--line)">
                    <div className="shell py-20 md:py-24">
                        <div className="flex flex-wrap items-end justify-between gap-6">
                            <h2 className="text-subheading max-w-[20ch]">
                                {service.title} in production
                            </h2>
                            <Link
                                href="/projects"
                                className="group/all inline-flex items-center gap-3 rounded-full border border-(--line) px-5 py-2.5 text-sm text-(--text) transition-colors hover:border-(--text)"
                            >
                                All case studies
                                <span
                                    aria-hidden="true"
                                    className="inline-block transition-transform duration-300 group-hover/all:translate-x-1"
                                >
                                    →
                                </span>
                            </Link>
                        </div>

                        <Reveal className="mt-12 grid gap-px border border-(--line) bg-(--line) md:grid-cols-3">
                            {related.map((p) => (
                                <Link
                                    key={p._id ?? p.slug}
                                    href={`/projects/${p.slug}`}
                                    data-reveal=""
                                    className="group/card flex flex-col bg-(--canvas) p-6"
                                >
                                    <div className="relative aspect-[16/11] overflow-hidden rounded-xl border border-(--line)">
                                        <Image
                                            src={p.thumbnailImage || p.coverImage}
                                            alt={p.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 30vw"
                                            className="object-cover object-top transition-transform duration-700 ease-out group-hover/card:scale-[1.04]"
                                        />
                                    </div>

                                    <h3 className="mt-6 text-[1.125rem] font-medium tracking-[-0.02em] text-(--text)">
                                        <span className="inline-block transition-transform duration-400 ease-out group-hover/card:translate-x-1">
                                            {p.title}
                                        </span>
                                    </h3>

                                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                                        {p.shortDescription}
                                    </p>

                                    <div className="mt-auto flex flex-wrap gap-2 pt-6">
                                        {p.serviceTypes.slice(0, 2).map((st) => (
                                            <span
                                                key={st}
                                                className="label-mono rounded-full border border-(--line) px-3 py-1 text-(--text-mute)"
                                            >
                                                {SERVICE_LABELS[st]}
                                            </span>
                                        ))}
                                    </div>
                                </Link>
                            ))}
                        </Reveal>
                    </div>
                </section>
            )}

            {/* ── Sibling disciplines ─────────────────────────────────── */}
            <section className="border-b border-(--line)">
                <div className="shell py-16">
                    <h2 className="label-mono text-(--text-mute)">Other disciplines</h2>
                    <Reveal
                        as="ul"
                        className="mt-6 flex flex-wrap gap-x-8 gap-y-3"
                        stagger={0.04}
                    >
                        {others.map((s) => (
                            <li key={s._id ?? s.slug} data-reveal="">
                                <Link
                                    href={`/services/${s.slug}`}
                                    className="text-[1.125rem] tracking-[-0.02em] text-(--text-mute) transition-colors hover:text-(--text)"
                                >
                                    {s.title}
                                </Link>
                            </li>
                        ))}
                    </Reveal>
                </div>
            </section>

            <CTABand
                title={`Need ${service.title.toLowerCase()} on a real deadline?`}
                body="Send the constraint and the date. We will tell you within a day whether it is deliverable and what it would take."
                primary={{ label: "Start a project", href: "/contact" }}
                secondary={{ label: "Back to services", href: "/services" }}
            />
        </>
    );
}
