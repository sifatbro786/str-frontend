import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CTABand from "@/components/ui/CTABand";
import Tag from "@/components/ui/Tag";
import {
  getProjects,
  getProjectBySlug,
  getProjectNeighbours,
  getTestimonials,
  SERVICE_LABELS,
} from "@/lib/data";
import { site } from "@/lib/site";
import { cn, formatDate, pad } from "@/lib/utils";

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = getProjectBySlug(slug);
  if (!p) return { title: "Case study not found" };
  return {
    title: p.metaTitle || p.title,
    description: p.metaDescription || p.shortDescription,
    alternates: { canonical: `/projects/${p.slug}` },
    openGraph: {
      siteName: site.legalName,
      type: "article",
      url: `/projects/${p.slug}`,
      title: p.metaTitle || p.title,
      description: p.metaDescription || p.shortDescription,
      publishedTime: p.projectDate,
      images: [{ url: p.ogImage || p.coverImage, width: 1200, height: 630, alt: p.title }],
    },
  };
}

/* galleryImages[].layoutType drives the span. One map, no branching in JSX —
   adding a "third" layout later is a one-line change here. */
const GALLERY_SPAN = {
  full: "md:col-span-12 aspect-[16/9]",
  half: "md:col-span-6 aspect-[4/3]",
  grid: "md:col-span-4 aspect-square",
};

const EXTERNAL_LINKS = [
  { key: "liveUrl", label: "Live site" },
  { key: "githubUrl", label: "Repository" },
  { key: "figmaUrl", label: "Design file" },
  { key: "appStoreUrl", label: "App Store" },
  { key: "playStoreUrl", label: "Google Play" },
];

export default async function CaseStudyPage({ params }) {
  const { slug } = await params;
  const p = getProjectBySlug(slug);
  if (!p) notFound();

  const { prev, next } = getProjectNeighbours(p.slug);
  const quote = getTestimonials().find((t) => t.projectRef === p._id) ?? null;
  const links = EXTERNAL_LINKS.filter((l) => p[l.key]);

  /* accentColor is authored per project in the model. It drives the rules and
     index markers on this page only — never the body text, which stays on the
     theme token so contrast is guaranteed in both themes. */
  const accent = { "--accent": p.accentColor };

  return (
    <article style={accent}>
      {/* ── Masthead ────────────────────────────────────────── */}
      <header className="relative border-b border-(--line)">
        <div
          aria-hidden="true"
          className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,#000,transparent_80%)]"
        />
        <div className="shell relative pb-16 pt-28 md:pb-20 md:pt-36">
          <nav aria-label="Breadcrumb" className="label-mono flex flex-wrap items-center gap-2 text-(--text-mute)">
            <Link href="/" className="hover:text-signal">Home</Link>
            <span aria-hidden="true" className="text-(--line)">/</span>
            <Link href="/projects" className="hover:text-signal">Work</Link>
            <span aria-hidden="true" className="text-(--line)">/</span>
            <span className="text-(--text-dim)">{p.clientName || p.title}</span>
          </nav>

          <div className="label-mono mt-10 flex items-center gap-3 text-(--text-mute)">
            <span style={{ color: "var(--accent)" }}>{pad(p.displayOrder)}</span>
            <span aria-hidden="true" className="text-(--line)">//</span>
            <span>{SERVICE_LABELS[p.serviceTypes[0]]}</span>
          </div>

          <h1 className="text-display mt-7 max-w-[18ch]">{p.title}</h1>
          <p className="mt-7 max-w-2xl text-[1.25rem] leading-snug tracking-[-0.02em] text-(--text-dim)">
            {p.subtitle}
          </p>

          <div className="mt-10 flex flex-wrap gap-2">
            {p.serviceTypes.map((s, i) => (
              <Tag key={s} variant={i === 0 ? "solid" : "outline"}>
                {SERVICE_LABELS[s]}
              </Tag>
            ))}
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-7 border-t border-(--line) pt-7 md:grid-cols-4">
            <div>
              <dt className="label-mono text-(--text-mute)">Client</dt>
              <dd className="mt-2 text-[0.9375rem] text-(--text)">{p.clientName || "—"}</dd>
            </div>
            <div>
              <dt className="label-mono text-(--text-mute)">Delivered</dt>
              <dd className="mt-2 text-[0.9375rem] text-(--text)">{formatDate(p.projectDate, { long: true })}</dd>
            </div>
            <div>
              <dt className="label-mono text-(--text-mute)">Disciplines</dt>
              <dd className="mt-2 text-[0.9375rem] text-(--text)">{p.serviceTypes.length}</dd>
            </div>
            <div>
              <dt className="label-mono text-(--text-mute)">Tags</dt>
              <dd className="mt-2 text-[0.9375rem] text-(--text)">{p.tags.slice(0, 2).join(", ")}</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* ── Cover ───────────────────────────────────────────── */}
      <div className="border-b border-(--line)">
        <div className="shell py-12 md:py-16">
          <figure className="relative aspect-[16/9] overflow-hidden border border-(--line)">
            <Image
              src={p.coverImage}
              alt={`${p.title} — cover`}
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
            />
          </figure>
        </div>
      </div>

      {/* ── Narrative + spec rail ───────────────────────────── */}
      <section className="border-b border-(--line)">
        <div className="shell grid gap-x-12 gap-y-14 py-16 md:py-24 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div
              className="prose-str"
              /* Authored HTML from our own content layer. Sanitise server-side
                 the moment this becomes CMS-editable. */
              dangerouslySetInnerHTML={{ __html: p.fullCaseStudy }}
            />
          </div>

          <aside className="space-y-10 lg:col-span-4 lg:col-start-9">
            {p.deliverables.length > 0 && (
              <div>
                <h2 className="label-mono text-(--text-mute)">Delivered</h2>
                <ul className="mt-5 border-t border-(--line)">
                  {p.deliverables.map((d) => (
                    <li
                      key={d}
                      className="border-b border-(--line) py-3.5 text-[0.9375rem] text-(--text-dim)"
                    >
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {p.techStack.length > 0 && (
              <div>
                <h2 className="label-mono text-(--text-mute)">Stack</h2>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {p.techStack.map((t) => (
                    <li
                      key={t.name}
                      className="border border-(--line) px-3 py-1.5 text-[0.8125rem] text-(--text-dim)"
                      title={t.category}
                    >
                      {t.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {links.length > 0 && (
              <div>
                <h2 className="label-mono text-(--text-mute)">Links</h2>
                <ul className="mt-5 border-t border-(--line)">
                  {links.map((l) => (
                    <li key={l.key} className="border-b border-(--line)">
                      <a
                        href={p[l.key]}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center justify-between gap-4 py-3.5 text-[0.9375rem] text-(--text) transition-colors hover:text-signal"
                      >
                        {l.label}
                        <span aria-hidden="true">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* ── Gallery, layoutType-driven ──────────────────────── */}
      {p.galleryImages.length > 0 && (
        <section className="border-b border-(--line)">
          <div className="shell py-16 md:py-24">
            <h2 className="label-mono text-(--text-mute)">Gallery</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-12">
              {p.galleryImages.map((img, i) => (
                <figure
                  key={`${img.url}-${i}`}
                  className={cn(
                    "relative overflow-hidden border border-(--line)",
                    GALLERY_SPAN[img.layoutType] ?? GALLERY_SPAN.full
                  )}
                >
                  <Image
                    src={img.url}
                    alt={img.caption || `${p.title} — image ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover object-top"
                  />
                  {img.caption && (
                    <figcaption className="label-mono absolute bottom-0 left-0 bg-(--canvas) px-3 py-2 text-(--text-mute)">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Client quote ────────────────────────────────────── */}
      {quote && (
        <section className="border-b border-(--line)">
          <div className="shell py-16 md:py-24">
            <blockquote className="max-w-4xl">
              <span aria-hidden="true" className="block h-px w-14" style={{ background: "var(--accent)" }} />
              <p className="mt-8 text-[clamp(1.35rem,1.05rem+1.2vw,2.1rem)] font-medium leading-[1.32] tracking-[-0.028em] text-(--text)">
                “{quote.reviewText}”
              </p>
              <footer className="label-mono mt-8 text-(--text-mute)">
                {quote.clientName} · {quote.clientDesignation}, {quote.companyName}
              </footer>
            </blockquote>
          </div>
        </section>
      )}

      {/* ── Prev / next ─────────────────────────────────────── */}
      <nav aria-label="More case studies" className="border-b border-(--line)">
        <div className="shell grid gap-px bg-(--line) md:grid-cols-2">
          {[
            { item: prev, dir: "Previous", align: "text-left" },
            { item: next, dir: "Next", align: "md:text-right" },
          ]
            .filter((x) => x.item)
            .map(({ item, dir, align }) => (
              <Link
                key={dir}
                href={`/projects/${item.slug}`}
                className={cn("group bg-(--canvas) px-6 py-12 transition-colors hover:bg-(--raised)", align)}
              >
                <span className="label-mono text-(--text-mute)">{dir}</span>
                <p className="mt-4 text-[1.5rem] font-semibold tracking-[-0.03em] text-(--text) transition-colors group-hover:text-signal">
                  {item.title}
                </p>
                <p className="mt-2 text-[0.9375rem] text-(--text-mute)">{item.subtitle}</p>
              </Link>
            ))}
        </div>
      </nav>

      <CTABand
        title="Same problem, different logo?"
        body="If any of the above sounded familiar, the first call is free and usually short. We will tell you quickly whether it is work we should take."
        primary={{ label: "Start a project", href: "/contact" }}
        secondary={{ label: "All case studies", href: "/projects" }}
      />
    </article>
  );
}
