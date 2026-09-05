import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageMasthead from "@/components/ui/PageMasthead";
import CTABand from "@/components/ui/CTABand";
import Tag from "@/components/ui/Tag";
import ArrowLink from "@/components/ui/ArrowLink";
import {
  getServices,
  getServiceBySlug,
  getProjects,
  SERVICE_MEDIA,
  SERVICE_LABELS,
} from "@/lib/data";
import { site } from "@/lib/site";
import { pad } from "@/lib/utils";

/* Fully static: seven known slugs, no runtime lookup. Phase 4 keeps this and
   adds `revalidate` — the shape of the function does not change. */
export function generateStaticParams() {
  return getServices().map((s) => ({ slug: s.slug }));
}

/* Next 15: `params` is a Promise in both generateMetadata and the page.
   Awaiting it here is what keeps this forward-compatible with Next 16. */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: "Service not found" };
  return {
    title: service.title,
    description: service.shortDescription,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      siteName: site.legalName,
      type: "article",
      url: `/services/${service.slug}`,
      title: `${service.title} | ${site.name}`,
      description: service.shortDescription,
      images: [{ url: SERVICE_MEDIA[service.slug] ?? "/logo.png" }],
    },
  };
}

export default async function ServiceDetailPage({ params }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const index = getServices().findIndex((s) => s.slug === service.slug);
  const related = getProjects({ service: service.slug, limit: 3 });
  const others = getServices().filter((s) => s.slug !== service.slug);

  return (
    <>
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
          { label: "Case studies", value: related.length ? `${related.length} published` : "On request" },
          { label: "Engagement", value: "Fixed scope or squad" },
        ]}
      />

      {/* ── Overview + capability spec ──────────────────────── */}
      <section className="border-b border-(--line)">
        <div className="shell grid gap-x-12 gap-y-14 py-20 md:py-28 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div
              className="prose-str"
              /* Static, authored HTML from our own content layer — never user
                 input. When this becomes CMS content in Phase 4 it must be
                 sanitised server-side before it reaches this prop. */
              dangerouslySetInnerHTML={{ __html: service.detailedOverview }}
            />

            {SERVICE_MEDIA[service.slug] && (
              <figure className="relative mt-14 aspect-[16/9] overflow-hidden border border-(--line)">
                <Image
                  src={SERVICE_MEDIA[service.slug]}
                  alt={`${service.title} — representative work`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover object-top"
                />
              </figure>
            )}
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <h2 className="label-mono text-(--text-mute)">What you receive</h2>
            <ul className="mt-6 border-t border-(--line)">
              {service.featuresList.map((f, i) => (
                <li
                  key={f}
                  className="flex gap-4 border-b border-(--line) py-4 text-[0.9375rem] leading-relaxed text-(--text-dim)"
                >
                  <span className="label-mono shrink-0 pt-1 text-signal">{pad(i + 1)}</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 border border-(--line) p-6">
              <p className="label-mono text-(--text-mute)">Typical timeline</p>
              <p className="mt-3 text-[1.5rem] font-semibold tracking-[-0.03em] text-(--text)">
                {service.deliverableTimeline}
              </p>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-(--text-mute)">
                Confirmed after discovery. We give a date, not a range, before any
                build work is invoiced.
              </p>
              <ArrowLink href="/contact" className="mt-6">
                Scope this service
              </ArrowLink>
            </div>
          </aside>
        </div>
      </section>

      {/* ── Related case studies ────────────────────────────── */}
      {related.length > 0 && (
        <section className="border-b border-(--line)">
          <div className="shell py-20 md:py-24">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="text-subheading max-w-[20ch]">
                {service.title} in production
              </h2>
              <ArrowLink href="/projects" className="pb-1">
                All case studies
              </ArrowLink>
            </div>

            <div className="mt-12 grid gap-px border border-(--line) bg-(--line) md:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p._id}
                  href={`/projects/${p.slug}`}
                  className="group flex flex-col bg-(--canvas) p-6"
                >
                  <div className="relative aspect-[16/11] overflow-hidden border border-(--line)">
                    <Image
                      src={p.thumbnailImage || p.coverImage}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 30vw"
                      className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <h3 className="mt-6 text-[1.125rem] font-semibold tracking-[-0.025em] text-(--text) transition-colors group-hover:text-signal">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-(--text-mute)">
                    {p.shortDescription}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 pt-1">
                    {p.serviceTypes.slice(0, 2).map((st) => (
                      <Tag key={st} variant="ghost">
                        {SERVICE_LABELS[st]}
                      </Tag>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Other disciplines ───────────────────────────────── */}
      <section className="border-b border-(--line)">
        <div className="shell py-16">
          <h2 className="label-mono text-(--text-mute)">Other disciplines</h2>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {others.map((s) => (
              <li key={s._id}>
                <Link
                  href={`/services/${s.slug}`}
                  className="text-[1.125rem] tracking-[-0.02em] text-(--text-mute) transition-colors hover:text-signal"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
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
