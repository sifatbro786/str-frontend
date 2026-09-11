import Image from "next/image";
import PageMasthead from "@/components/ui/PageMasthead";
import CTABand from "@/components/ui/CTABand";
import SectionIndex from "@/components/ui/SectionIndex";
import MetricGrid from "@/components/ui/MetricGrid";
import Reveal from "@/components/motion/Reveal";
import JsonLd from "@/components/seo/JsonLd";
import { getSiteContent, getTeam } from "@/lib/api";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { MEDIA_FALLBACK, mediaUrl, pad } from "@/lib/utils";

export async function generateMetadata() {
    return buildMetadata({
        identifier: "about",
        path: "/about",
        title: "About",
        description:
            "STR Solutions Ltd is a Dhaka engineering and visual production studio. Who we are, how we work, and the people who do it.",
    });
}

export default async function AboutPage() {
    const [team, metrics, capabilities, partners] = await Promise.all([
        getTeam(),
        getSiteContent("metrics"),
        getSiteContent("capabilities"),
        getSiteContent("partners"),
    ]);

    return (
        <>
            <JsonLd data={breadcrumbSchema([{ name: "About", path: "/about" }])} />

            <PageMasthead
                index="03"
                eyebrow="About"
                title="A studio, not a body shop."
                lede="Sixty-odd people in Dhaka doing engineering and visual production for clients in fourteen countries. Small enough that the person who scoped your project is still on it in month four."
                breadcrumb={[{ label: "Home", href: "/" }, { label: "About" }]}
                meta={[
                    { label: "Founded", value: String(site.foundedYear) },
                    { label: "Studio", value: `${site.address.city}, ${site.address.country}` },
                    { label: "Headcount", value: "60+" },
                    { label: "Disciplines", value: "Engineering, design, production" },
                ]}
            />

            {/* ── Story ───────────────────────────────────────────────── */}
            <section className="border-b border-(--line)">
                <div className="shell grid gap-x-12 gap-y-12 py-20 md:py-28 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                        <SectionIndex index="01" label="Where this came from" />
                    </div>

                    <Reveal className="lg:col-span-7 lg:col-start-6" stagger={0.1}>
                        <p
                            data-reveal=""
                            className="text-[clamp(1.35rem,1.05rem+1.1vw,1.9rem)] leading-[1.4] font-medium tracking-[-0.02em] text-(--text)"
                        >
                            STR started in {site.foundedYear} with two contracts and a rented desk.
                            The first was a retouching queue nobody else wanted. The second was a
                            website for the same client, because they trusted whoever had already
                            done the boring job well.
                        </p>

                        {/* prose-str owns its own rhythm through a DIRECT-child
                            selector, so the class and the content must sit on the
                            same element. See the note in globals.css. */}
                        <div data-reveal="" className="prose-str mt-10">
                            <p>
                                That order, production first and engineering second, is unusual and
                                it shaped how the studio works. We learned volume discipline before
                                we learned software architecture: fixed turnaround, a QC gate, and a
                                named person accountable for every batch. When the engineering side
                                grew, it inherited those habits rather than the other way round.
                            </p>
                            <p>
                                It is also why we can put a case study, its renders and its landing
                                page through the same building in the same week. Most studios can do
                                one of those three and subcontract the rest, which is where
                                deadlines go to die.
                            </p>
                            <p>
                                We are deliberately mid-sized. Large enough to staff a squad and
                                absorb a sick week, small enough that the founder still reads every
                                proposal that goes out. We have turned down work that would have
                                doubled headcount, and we would do it again.
                            </p>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ── Numbers ─────────────────────────────────────────────── */}
            <section className="border-b border-(--line)">
                <div className="shell py-20 md:py-24">
                    <SectionIndex index="02" label="By the numbers" />
                    <MetricGrid metrics={metrics} className="mt-8" />
                </div>
            </section>

            {/* ── Engagement shapes ───────────────────────────────────── */}
            <section className="border-b border-(--line)">
                <div className="shell py-20 md:py-28">
                    <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
                        <div className="lg:col-span-6">
                            <SectionIndex index="03" label="How we engage" />
                            <h2 className="text-heading mt-6 max-w-[16ch]">
                                Four shapes of work.{" "}
                                <span className="text-(--text-mute)">Pick the one that fits.</span>
                            </h2>
                        </div>
                        <p className="max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-4 lg:col-start-9">
                            Most clients start with one and move between them. Nothing here requires
                            a twelve-month commitment to begin.
                        </p>
                    </div>

                    <Reveal
                        className="mt-14 grid gap-px border border-(--line) bg-(--line) md:grid-cols-2 lg:grid-cols-4"
                        stagger={0.07}
                    >
                        {capabilities.map((c, i) => (
                            <div key={c.title} data-reveal="" className="bg-(--canvas) p-8">
                                <span className="label-mono tabular-nums text-brand">
                                    {pad(i + 1)}
                                </span>
                                <h3 className="mt-5 text-[1.25rem] font-medium tracking-[-0.02em] text-(--text)">
                                    {c.title}
                                </h3>
                                <p className="mt-4 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                                    {c.body}
                                </p>
                            </div>
                        ))}
                    </Reveal>
                </div>
            </section>

            {/* ── Team ────────────────────────────────────────────────── */}
            <section className="border-b border-(--line)">
                <div className="shell py-20 md:py-28">
                    <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
                        <div className="lg:col-span-6">
                            <SectionIndex index="04" label="Who you will work with" />
                            <h2 className="text-heading mt-6 max-w-[16ch]">
                                The people{" "}
                                <span className="text-(--text-mute)">who are actually on it.</span>
                            </h2>
                        </div>
                        <p className="max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-4 lg:col-start-9">
                            Not a stock photo among them. If someone appears in your kick-off call,
                            they are on this page.
                        </p>
                    </div>

                    <Reveal
                        as="ul"
                        className="mt-14 grid gap-px border border-(--line) bg-(--line) sm:grid-cols-2 lg:grid-cols-4"
                        stagger={0.06}
                    >
                        {team.map((m, i) => (
                            <li key={m._id} data-reveal="" className="group/person bg-(--canvas)">
                                <div className="relative aspect-4/5 overflow-hidden">
                                    <Image
                                        src={mediaUrl(m.image) ?? MEDIA_FALLBACK}
                                        alt={m.name}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        className="object-cover object-top transition-transform duration-700 ease-out motion-safe:group-hover/person:scale-[1.03]"
                                    />
                                    <span className="label-mono absolute top-0 left-0 rounded-br-xl bg-(--canvas) px-3 py-2 tabular-nums text-(--text-mute)">
                                        {pad(i + 1)}
                                    </span>
                                </div>

                                <div className="p-6">
                                    <h3 className="text-[1.0625rem] font-medium tracking-[-0.015em] text-(--text)">
                                        {m.name}
                                    </h3>
                                    <p className="label-mono mt-1.5 text-brand">{m.designation}</p>
                                    <p className="mt-4 text-[0.875rem] leading-relaxed text-(--text-dim)">
                                        {m.bio}
                                    </p>

                                    {m.socialLinks?.linkedin && (
                                        <a
                                            href={m.socialLinks.linkedin}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="label-mono mt-5 inline-flex items-center gap-1.5 text-(--text-mute) transition-colors hover:text-(--text)"
                                        >
                                            LinkedIn
                                            <svg
                                                width="10"
                                                height="10"
                                                viewBox="0 0 12 12"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M3 9 9 3M4.2 3H9v4.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            </li>
                        ))}
                    </Reveal>
                </div>
            </section>

            {/* ── Clients ─────────────────────────────────────────────── */}
            {/* Whole section, not just the grid: the heading names the sectors
                the logos below are supposed to prove. */}
            {partners.length > 0 && (
            <section className="border-b border-(--line)">
                <div className="shell py-20 md:py-24">
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        <div>
                            <SectionIndex index="05" label="Who we work with" />
                            <h2 className="text-subheading mt-6 max-w-[22ch]">
                                Construction, retail, media, logistics and export.
                            </h2>
                        </div>
                    </div>

                    {/* A static grid, not the homepage marquee. A moving rail works
                        where it is one band among many; on a credibility page the
                        reader wants to stop and read the names. */}
                    <Reveal
                        as="ul"
                        className="mt-12 grid grid-cols-2 gap-px border border-(--line) bg-(--line) sm:grid-cols-3 lg:grid-cols-4"
                        stagger={0.05}
                    >
                        {partners.map((p) => (
                            <li
                                key={p.name}
                                data-reveal=""
                                className="group/logo flex flex-col items-start justify-between gap-6 bg-(--canvas) p-6"
                            >
                                <Image
                                    src={mediaUrl(p.logo) ?? MEDIA_FALLBACK}
                                    alt={p.name}
                                    width={140}
                                    height={44}
                                    className="h-8 w-auto object-contain transition-transform duration-400 ease-out motion-safe:group-hover/logo:scale-105"
                                />
                                <div>
                                    <p className="text-[0.9375rem] font-medium text-(--text)">
                                        {p.name}
                                    </p>
                                    {/* ⚑ These labels are reconstructed rather than
                                        contract-sourced — see lib/site.js. Confirm each
                                        with the account owner before launch. */}
                                    <p className="mt-1 text-[0.875rem] text-(--text-dim)">
                                        {p.work}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </Reveal>
                </div>
            </section>
            )}

            <CTABand
                title="Come and see how we actually run a project."
                body="We are happy to walk a prospective client through a live project board, warts included. It tells you more than any capability deck."
                primary={{ label: "Arrange a call", href: "/contact" }}
                secondary={{ label: "Read the case studies", href: "/projects" }}
            />
        </>
    );
}
