import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CTABand from "@/components/ui/CTABand";
import Tag from "@/components/ui/Tag";
import { getBlogs, getBlogBySlug, getRelatedBlogs } from "@/lib/data";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return getBlogs().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    alternates: { canonical: `/blogs/${post.slug}` },
    authors: [{ name: post.author.name }],
    openGraph: {
      siteName: site.legalName,
      type: "article",
      url: `/blogs/${post.slug}`,
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }],
    },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);
  if (!post) notFound();

  const related = getRelatedBlogs(post.slug, 3);

  /* Article JSON-LD. Emitted from the same object the page renders, so the
     structured data cannot drift from the visible content. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: [`${site.url}${post.coverImage}`],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.author.name },
    publisher: {
      "@type": "Organization",
      name: site.legalName,
      logo: { "@type": "ImageObject", url: `${site.url}${site.brand.logo}` },
    },
    mainEntityOfPage: `${site.url}/blogs/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-(--line)">
        <div className="shell pb-14 pt-28 md:pt-36">
          <nav aria-label="Breadcrumb" className="label-mono flex flex-wrap items-center gap-2 text-(--text-mute)">
            <Link href="/" className="hover:text-signal">Home</Link>
            <span aria-hidden="true" className="text-(--line)">/</span>
            <Link href="/blogs" className="hover:text-signal">Insights</Link>
            <span aria-hidden="true" className="text-(--line)">/</span>
            <span className="text-(--text-dim)">{post.category}</span>
          </nav>

          <h1 className="text-heading mt-10 max-w-[24ch]">{post.title}</h1>

          <p className="mt-7 max-w-2xl text-[1.25rem] leading-snug tracking-[-0.018em] text-(--text-dim)">
            {post.excerpt}
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-(--line) pt-6">
            <div className="flex items-center gap-3.5">
              <span className="relative block h-10 w-10 shrink-0 overflow-hidden border border-(--line)">
                <Image
                  src={post.author.avatar}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </span>
              <div>
                <p className="text-[0.9375rem] font-medium text-(--text)">{post.author.name}</p>
                <p className="label-mono mt-1 text-(--text-mute)">{post.author.role}</p>
              </div>
            </div>

            <p className="label-mono text-(--text-mute)">
              {formatDate(post.publishedAt, { long: true })} · {post.readingMinutes} min read
            </p>
          </div>
        </div>
      </header>

      <div className="border-b border-(--line)">
        <div className="shell py-12 md:py-16">
          <figure className="relative aspect-[16/9] overflow-hidden border border-(--line)">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
            />
          </figure>
        </div>
      </div>

      <div className="border-b border-(--line)">
        <div className="shell grid gap-x-12 gap-y-14 py-16 md:py-20 lg:grid-cols-12">
          <article className="lg:col-span-7">
            <div
              className="prose-str"
              /* Authored HTML from our own content layer; sanitise server-side
                 once Blog.content becomes editor input in Phase 4. */
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className="mt-14 flex flex-wrap gap-2 border-t border-(--line) pt-8">
              {post.tags.map((t) => (
                <Tag key={t} variant="outline">
                  {t}
                </Tag>
              ))}
            </div>
          </article>

          <aside className="lg:col-span-3 lg:col-start-10">
            <div className="lg:sticky lg:top-28">
              <h2 className="label-mono text-(--text-mute)">Also worth reading</h2>
              <ul className="mt-6 border-t border-(--line)">
                {related.map((r) => (
                  <li key={r._id} className="border-b border-(--line)">
                    <Link href={`/blogs/${r.slug}`} className="group block py-5">
                      <span className="label-mono text-(--text-mute)">{r.category}</span>
                      <p className="mt-2 text-[0.9375rem] font-medium leading-snug text-(--text) transition-colors group-hover:text-signal">
                        {r.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href="/blogs"
                className="mt-8 inline-flex items-center gap-2 border-b border-signal pb-1 text-sm font-medium text-(--text) transition-colors hover:text-signal"
              >
                All articles ↗
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <CTABand
        title="Have a version of this problem?"
        body="If this described something you are living with, the fastest way forward is usually a short audit rather than a long proposal."
        primary={{ label: "Talk to an engineer", href: "/contact" }}
        secondary={{ label: "More insights", href: "/blogs" }}
      />
    </>
  );
}
