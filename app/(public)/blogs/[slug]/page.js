import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CTABand from "@/components/ui/CTABand";
import Reveal from "@/components/motion/Reveal";
import JsonLd from "@/components/seo/JsonLd";
import { getBlogBySlug, getBlogs, getRelatedBlogs, paramsOrEmpty } from "@/lib/api";
import { absoluteMedia, articleSchema, breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { MEDIA_FALLBACK, formatDate, mediaUrl } from "@/lib/utils";

/* dynamicParams: a post published after the build renders on demand instead
   of 404ing until the next deploy. */
export const dynamicParams = true;

export async function generateStaticParams() {
    const posts = await paramsOrEmpty(() => getBlogs({ limit: 200 }));
    return posts.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const post = await getBlogBySlug(slug);

    // noIndex on the miss. A 404 that returns 200 with "not found" is a soft
    // 404, and enough of them across a site costs crawl budget everywhere.
    if (!post) return { title: "Article not found", robots: { index: false, follow: false } };

    return buildMetadata({
        // No `identifier`: PageMeta rows exist for the six top-level routes
        // only. Posts carry their own metaTitle/metaDescription, which the
        // admin blog form already edits.
        path: `/blogs/${post.slug}`,
        title: post.metaTitle || post.title,
        description: post.metaDescription || post.excerpt,
        image: absoluteMedia(post.coverImage),
        type: "article",
        keywords: post.tags,
        article: {
            publishedTime: post.publishedAt,
            modifiedTime: post.updatedAt,
            authors: post.author?.name ? [post.author.name] : undefined,
            tags: post.tags,
        },
    });
}

/**
 * Article.
 *
 * ── THE LAYOUT ───────────────────────────────────────────────────────────
 * A single measured column, not the two-column body-plus-sidebar the other
 * detail routes use. Long-form prose wants one line length and nothing
 * competing with it in the margin; the metadata that would go in a sidebar is
 * above the fold instead, where it answers "who wrote this and when" before
 * the reader commits.
 *
 * ── ON dangerouslySetInnerHTML ───────────────────────────────────────────
 * `content` is sanitised on WRITE: blog.routes.js runs
 * sanitizeHtml("content", "excerpt") before validate on both POST and PATCH,
 * with an allow-list matching what .prose-str can style. It must stay
 * unsanitised here. Sanitising again on read with a second allow-list is how
 * content silently loses markup that nobody can explain six months later.
 *
 * The JSON-LD is a separate matter and was a real hole: it used to be a raw
 * <script> with an unescaped JSON.stringify, and the payload carries
 * post.title and post.excerpt, which are plain-text admin fields and
 * correctly not HTML-sanitised. A title containing `</script>` closed the tag
 * early. JsonLd escapes on the way out.
 */
export default async function ArticlePage({ params }) {
    const { slug } = await params;
    const post = await getBlogBySlug(slug);
    if (!post) notFound();

    const related = await getRelatedBlogs(post.slug, 3);

    return (
        <>
            <JsonLd
                data={[
                    articleSchema({ ...post, author: post.author?.name }),
                    breadcrumbSchema([
                        { name: "Insights", path: "/blogs" },
                        { name: post.title, path: `/blogs/${post.slug}` },
                    ]),
                ]}
            />

            {/* ── Masthead ────────────────────────────────────────────── */}
            <header className="border-b border-(--line)">
                <div className="shell pt-24 pb-14 md:pt-32">
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
                        <Link href="/blogs" className="transition-colors hover:text-(--text)">
                            Insights
                        </Link>
                        <span aria-hidden="true" className="text-(--line)">
                            /
                        </span>
                        <span aria-current="page" className="text-(--text)">
                            {post.category}
                        </span>
                    </nav>

                    {/* Left-aligned, not centred. A centred measure floats the
                        article away from the breadcrumb above it and from the
                        gutter every other route on this site is built on, so the
                        page stops sharing a left edge with the header and the
                        footer. max-w-3xl is roughly 70ch here, which is the
                        readable band for body prose. */}
                    <Reveal className="mt-10 max-w-3xl" stagger={0.07}>
                        <p
                            data-reveal=""
                            className="label-mono flex flex-wrap items-center gap-2.5 text-(--text-mute)"
                        >
                            <span className="text-brand">{post.category}</span>
                            <span
                                aria-hidden="true"
                                className="block size-1 rounded-full bg-(--line)"
                            />
                            <span>{formatDate(post.publishedAt, { long: true })}</span>
                            {post.readingMinutes ? (
                                <>
                                    <span
                                        aria-hidden="true"
                                        className="block size-1 rounded-full bg-(--line)"
                                    />
                                    <span>{post.readingMinutes} min read</span>
                                </>
                            ) : null}
                        </p>

                        <h1 data-reveal="" className="text-heading mt-6">
                            {post.title}
                        </h1>

                        <p
                            data-reveal=""
                            className="mt-7 text-[1.125rem] leading-relaxed text-(--text-dim)"
                        >
                            {post.excerpt}
                        </p>

                        {post.author?.name && (
                            <div
                                data-reveal=""
                                className="mt-9 flex items-center gap-3.5 border-t border-(--line) pt-7"
                            >
                                {post.author.avatar ? (
                                    <Image
                                        src={mediaUrl(post.author.avatar)}
                                        alt=""
                                        width={40}
                                        height={40}
                                        className="size-10 rounded-full object-cover"
                                    />
                                ) : null}
                                <div>
                                    <p className="text-[0.9375rem] font-medium text-(--text)">
                                        {post.author.name}
                                    </p>
                                    {post.author.role && (
                                        <p className="label-mono mt-0.5 text-(--text-mute)">
                                            {post.author.role}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </Reveal>
                </div>
            </header>

            {/* ── Cover ───────────────────────────────────────────────── */}
            {post.coverImage && (
                <div className="shell pt-12 md:pt-16">
                    {/* priority: this is the LCP element on the route. Without it
                        Next lazy-loads it and the largest paint waits on an
                        intersection callback. */}
                    <Reveal className="relative aspect-video overflow-hidden rounded-2xl border border-(--line)">
                        <Image
                            src={mediaUrl(post.coverImage) ?? MEDIA_FALLBACK}
                            alt={post.title}
                            fill
                            priority
                            sizes="(max-width: 1280px) 100vw, 84rem"
                            className="object-cover object-top"
                        />
                    </Reveal>
                </div>
            )}

            {/* ── Body ────────────────────────────────────────────────── */}
            <section className="border-b border-(--line)">
                <div className="shell py-16 md:py-24">
                    {/* ⚑ dangerouslySetInnerHTML goes ON the .prose-str element,
                        never on a child of it.

                        This was wrapped in an inner <div> and it broke every
                        spacing rule in the stylesheet. .prose-str sets its
                        rhythm with `> * + *`, a DIRECT-child selector — with a
                        wrapper in between, .prose-str has exactly one child and
                        the rule matches nothing, so every heading, paragraph
                        and blockquote rendered with zero margin. That is the
                        cramped text, not the line-height. */}
                    <div
                        data-article-body=""
                        className="prose-str max-w-3xl mx-auto"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {post.tags?.length > 0 && (
                        <div className="mt-14 max-w-3xl mx-auto border-t border-(--line) pt-8">
                            <p className="label-mono text-(--text-mute)">Filed under</p>
                            <ul className="mt-4 flex flex-wrap gap-2">
                                {post.tags.map((t) => (
                                    <li
                                        key={t}
                                        className="rounded-full border border-(--line) px-3.5 py-1.5 text-[0.8125rem] text-(--text-dim)"
                                    >
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </section>

            {/* ── Related ─────────────────────────────────────────────── */}
            {related.length > 0 && (
                <section className="border-b border-(--line)">
                    <div className="shell py-20 md:py-24">
                        <div className="flex flex-wrap items-end justify-between gap-6">
                            <h2 className="text-subheading">Read next</h2>
                            <Link
                                href="/blogs"
                                className="group/all inline-flex items-center gap-3 rounded-full border border-(--line) px-5 py-2.5 text-sm text-(--text) transition-colors hover:border-(--text)"
                            >
                                All articles
                                <span
                                    aria-hidden="true"
                                    className="inline-block transition-transform duration-300 group-hover/all:translate-x-1"
                                >
                                    →
                                </span>
                            </Link>
                        </div>

                        <Reveal className="mt-12 grid gap-px border border-(--line) bg-(--line) md:grid-cols-3">
                            {related.map((r) => (
                                <Link
                                    key={r._id ?? r.slug}
                                    href={`/blogs/${r.slug}`}
                                    data-reveal=""
                                    className="group/card flex flex-col bg-(--canvas) p-6"
                                >
                                    <p className="label-mono text-(--text-mute)">{r.category}</p>

                                    <h3 className="mt-4 text-[1.125rem] leading-snug font-medium tracking-[-0.02em] text-(--text)">
                                        <span className="inline-block transition-transform duration-400 ease-out group-hover/card:translate-x-1">
                                            {r.title}
                                        </span>
                                    </h3>

                                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                                        {r.excerpt}
                                    </p>

                                    <p className="label-mono mt-auto pt-6 text-(--text-mute)">
                                        {formatDate(r.publishedAt)}
                                    </p>
                                </Link>
                            ))}
                        </Reveal>
                    </div>
                </section>
            )}

            <CTABand
                title="Recognise the problem in this one?"
                body="Most of these started as an audit finding on someone else's system. If it sounds like yours, that is usually the cheapest place to start."
                primary={{ label: "Book an audit", href: "/contact" }}
                secondary={{ label: "See our services", href: "/services" }}
            />
        </>
    );
}
