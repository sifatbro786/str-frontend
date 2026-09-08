import Link from "next/link";
import PageMasthead from "@/components/ui/PageMasthead";
import SectionIndex from "@/components/ui/SectionIndex";
import Reveal from "@/components/motion/Reveal";
import CookieSettingsLink from "./CookieSettingsLink";
import { site } from "@/lib/site";
import { effectiveDate } from "@/lib/legal";
import { cn, formatDate, pad } from "@/lib/utils";

/**
 * The renderer both legal routes share.
 *
 * ── WHY ONE COMPONENT FOR TWO PAGES ──────────────────────────────────────
 * /privacy and /terms are the same document with different words in it. Two
 * hand-built pages would drift apart within one amendment — a heading style
 * here, a numbering scheme there — and legal pages are precisely where an
 * inconsistency reads as carelessness. One renderer, two data objects in
 * lib/legal.js.
 *
 * ── LAYOUT ───────────────────────────────────────────────────────────────
 * The same asymmetric rails as every other inner route: a narrow left column
 * carrying the contents, a wide well carrying the text. The contents rail is
 * `position: sticky`, not fixed — sticky survives inside #smooth-content,
 * fixed does not, because the smoother's transform becomes the containing
 * block. It is also a plain <nav> of anchors with no JS: no scroll-spy, no
 * IntersectionObserver, nothing to run on a page nobody scrolls twice.
 *
 * ── WHY THIS IS A SERVER COMPONENT ───────────────────────────────────────
 * There is nothing interactive on it. PageMasthead and Reveal are client
 * components it renders through, and the one genuinely stateful element —
 * the cookie-settings link — is its own island. The document body itself
 * ships no JavaScript at all.
 *
 * @param {object} doc  A document from lib/legal.js
 * @param {{label: string, href: string}} counterpart  The other legal page
 * @param {boolean} showCookieSettings
 */
export default function LegalDocument({ doc, counterpart, showCookieSettings = false }) {
    const updated = formatDate(effectiveDate, { long: true });

    return (
        <>
            <PageMasthead
                index={doc.index}
                eyebrow={doc.eyebrow}
                title={doc.title}
                lede={doc.lede}
                breadcrumb={[{ label: "Home", href: "/" }, { label: doc.title }]}
                meta={[
                    { label: "Effective", value: updated },
                    { label: "Applies to", value: site.url.replace(/^https?:\/\//, "") },
                    { label: "Controller", value: site.legalName },
                    { label: "Questions", value: site.contact.email },
                ]}
            />

            {/* ── At a glance ──────────────────────────────────────────
                A legal page nobody reads protects nobody. Four plain
                sentences at the top, and the binding text below them — the
                summary is a courtesy, not a substitute, and it says so. */}
            {doc.summary?.length > 0 && (
                <section className="border-b border-(--line)">
                    <div className="shell py-14 md:py-16">
                        <SectionIndex index="00" label="The short version" />
                        <Reveal
                            as="ul"
                            className="mt-8 grid gap-px border border-(--line) bg-(--line) sm:grid-cols-2"
                            stagger={0.06}
                        >
                            {doc.summary.map((line, i) => (
                                <li key={line} data-reveal="" className="bg-(--canvas) p-6 md:p-7">
                                    <span className="label-mono tabular-nums text-brand">
                                        {pad(i + 1)}
                                    </span>
                                    <p className="mt-4 text-[1.0625rem] leading-relaxed text-(--text)">
                                        {line}
                                    </p>
                                </li>
                            ))}
                        </Reveal>
                        <p className="label-mono mt-6 text-(--text-mute)">
                            A summary, not the agreement. The numbered sections below are what
                            binds.
                        </p>
                    </div>
                </section>
            )}

            {/* ── The document ─────────────────────────────────────────── */}
            <section className="border-b border-(--line)">
                <div className="shell grid gap-x-12 gap-y-14 py-20 md:py-24 lg:grid-cols-12">
                    {/* Contents rail */}
                    <nav
                        aria-label="Contents"
                        className="lg:col-span-3 lg:sticky lg:top-28 lg:self-start"
                    >
                        <SectionIndex index="01" label="Contents" />
                        <ol className="mt-6 space-y-0 border-t border-(--line)">
                            {doc.sections.map((s, i) => (
                                <li key={s.id} className="border-b border-(--line)">
                                    <a
                                        href={`#${s.id}`}
                                        className="group/toc flex items-baseline gap-3 py-3 text-[0.9375rem] leading-snug text-(--text-dim) transition-colors hover:text-(--text)"
                                    >
                                        <span className="label-mono tabular-nums text-(--text-mute) transition-colors group-hover/toc:text-brand">
                                            {pad(i + 1)}
                                        </span>
                                        <span>{s.title}</span>
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>

                    {/* Body */}
                    <div className="lg:col-span-8 lg:col-start-5">
                        {doc.sections.map((s, i) => (
                            <article
                                key={s.id}
                                id={s.id}
                                /* scroll-mt clears the fixed Navbar when an anchor is
                                   followed; without it the heading lands underneath it. */
                                className={cn(
                                    "scroll-mt-28 border-t border-(--line) pt-10",
                                    i > 0 && "mt-14",
                                )}
                            >
                                <div className="flex items-baseline gap-4">
                                    <span className="label-mono tabular-nums text-brand">
                                        {pad(i + 1)}
                                    </span>
                                    <h2 className="text-[clamp(1.25rem,1.05rem+0.55vw,1.6rem)] font-medium tracking-[-0.02em] text-(--text)">
                                        {s.title}
                                    </h2>
                                </div>

                                <div className="mt-6 space-y-6">
                                    {s.blocks.map((block, j) => (
                                        <Block key={j} block={block} />
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Foot of the document ─────────────────────────────────
                Deliberately not the marketing CTABand. Someone who reached
                the bottom of a privacy policy is looking for a way to act on
                it, not an invitation to start a project. */}
            <section className="border-b border-(--line)">
                <div className="shell flex flex-col gap-8 py-14 md:flex-row md:items-end md:justify-between md:py-16">
                    <div>
                        <SectionIndex index="02" label="Acting on this" />
                        <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-(--text-dim)">
                            Requests, corrections and complaints go to{" "}
                            <a
                                href={`mailto:${site.contact.email}`}
                                className="text-(--text) underline decoration-(--line) underline-offset-4 transition-colors hover:decoration-current"
                            >
                                {site.contact.email}
                            </a>
                            . We reply within one business day.
                        </p>
                    </div>

                    <div className="label-mono flex flex-wrap items-center gap-x-6 gap-y-3 text-(--text-mute)">
                        {showCookieSettings && <CookieSettingsLink />}
                        <Link
                            href={counterpart.href}
                            className="transition-colors hover:text-(--text)"
                        >
                            {counterpart.label}
                        </Link>
                        <Link href="/contact" className="transition-colors hover:text-(--text)">
                            Contact
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}

/* ── Block renderers ──────────────────────────────────────────────────────
   Four shapes, matching lib/legal.js. A string is a paragraph; anything else
   is an object with exactly one key naming its kind. Kept in this file rather
   than exported — nothing else renders legal blocks, and a shared "block
   renderer" abstraction is how a two-page feature becomes a framework. */

function Block({ block }) {
    if (typeof block === "string") {
        return (
            <p className="text-[1.0625rem] leading-[1.75] text-(--text-dim)">{block}</p>
        );
    }

    if (block.list) {
        return (
            <ul className="space-y-3">
                {block.list.map((item) => (
                    <li
                        key={item}
                        className="relative pl-6 text-[1.0625rem] leading-[1.75] text-(--text-dim)"
                    >
                        <span
                            aria-hidden="true"
                            className="absolute top-[0.72em] left-0 h-px w-3 bg-(--line)"
                        />
                        {item}
                    </li>
                ))}
            </ul>
        );
    }

    if (block.defs) {
        /* A hairline grid rather than a <dl> of loose pairs. These are the
           parts of a legal section a reader scans for rather than reads
           through, and the rules are what make them scannable. */
        return (
            <dl className="grid gap-px border border-(--line) bg-(--line)">
                {block.defs.map((d) => (
                    <div
                        key={d.term}
                        className="grid gap-2 bg-(--canvas) px-5 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6"
                    >
                        <dt className="label-mono pt-0.5 text-(--text)">{d.term}</dt>
                        <dd className="text-[0.9375rem] leading-[1.7] text-(--text-dim)">
                            {d.desc}
                        </dd>
                    </div>
                ))}
            </dl>
        );
    }

    if (block.note) {
        return (
            <p className="border-l-2 border-brand bg-(--raised) py-4 pr-5 pl-5 text-[0.9375rem] leading-[1.7] text-(--text)">
                {block.note}
            </p>
        );
    }

    return null;
}
