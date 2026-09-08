import Image from "next/image";
import Link from "next/link";
import PageMasthead from "@/components/ui/PageMasthead";
import CTABand from "@/components/ui/CTABand";
import ProcessTracker from "@/components/home/ProcessTracker";
import Reveal from "@/components/motion/Reveal";
import JsonLd from "@/components/seo/JsonLd";
import { getServices } from "@/lib/api";
import { buildMetadata, breadcrumbSchema, serviceSchema } from "@/lib/seo";
import { processSteps } from "@/lib/data";
import { SERVICE_MEDIA } from "@/lib/taxonomy";
import { cn, pad } from "@/lib/utils";

export async function generateMetadata() {
    return buildMetadata({
        identifier: "services",
        path: "/services",
        title: "Services",
        description:
            "Seven disciplines under one delivery team: web platforms, custom software, mobile applications, product design, graphics production, 3D visualization and digital marketing.",
    });
}

/**
 * Services index.
 *
 * ── WHY ALTERNATING ROWS AND NOT A CARD GRID ─────────────────────────────
 * Seven services in a grid is either two ragged rows or an arbitrary "top six
 * and a view-all". Full-width rows let each short description sit at a
 * readable measure instead of being clamped to a card, and the alternation
 * gives the page a rhythm a uniform grid cannot. It is also deliberately NOT
 * the homepage's accordion: someone landing here has already decided to
 * browse, and every service should be open.
 *
 * ── WHY THIS FILE STAYS A SERVER COMPONENT ───────────────────────────────
 * It awaits lib/api, which reaches next/headers through ./session and cannot
 * run in the browser. The animation comes from <Reveal>, which is a client
 * component whose CHILDREN are still server-rendered — the boundary is for
 * code, not content. No service data crosses the wire twice.
 *
 * ── WHY ProcessTracker IS IMPORTED FROM home/ ────────────────────────────
 * It is the same section, so it is the same component. Copying it here would
 * mean two tablists with two keyboard implementations to keep correct, and
 * they would drift. The index and eyebrow are props for exactly this reuse.
 */
export default async function ServicesPage() {
    const services = await getServices();

    return (
        <>
            <JsonLd
                data={[
                    breadcrumbSchema([{ name: "Services", path: "/services" }]),
                    // One Service block per discipline. Each references the
                    // organisation by @id rather than repeating it, which is how
                    // Google resolves them into one provider instead of seven.
                    ...services.map(serviceSchema),
                ]}
            />

            <PageMasthead
                index="01"
                eyebrow="Services"
                title="What we take on, and how it is scoped."
                lede="Engineering and visual production in the same studio. Below is what each discipline actually delivers and how long it usually takes, not a capability list."
                breadcrumb={[{ label: "Home", href: "/" }, { label: "Services" }]}
                meta={[
                    { label: "Disciplines", value: `${services.length} active` },
                    { label: "Engagement", value: "Fixed scope or dedicated squad" },
                    { label: "Handover", value: "Code, files and accounts on payment" },
                    { label: "Warranty", value: "30 days post-launch, included" },
                ]}
            />

            <section className="border-b border-(--line)">
                <div className="shell">
                    <ol>
                        {services.map((s, i) => {
                            const flip = i % 2 === 1;
                            return (
                                <Reveal
                                    as="li"
                                    key={s._id ?? s.slug}
                                    className="group/row border-b border-(--line) last:border-b-0"
                                >
                                    <article className="grid gap-x-12 gap-y-8 py-14 md:py-20 lg:grid-cols-12 lg:items-center">
                                        {/* Media.
                        aria-hidden and tabIndex -1: this is the same
                        destination as the title link below it, and a
                        keyboard user should not have to Tab past a
                        decorative duplicate of every link on the page. */}
                                        <Link
                                            href={`/services/${s.slug}`}
                                            aria-hidden="true"
                                            tabIndex={-1}
                                            data-reveal=""
                                            className={cn(
                                                "relative block aspect-[16/10] overflow-hidden rounded-2xl border border-(--line) lg:col-span-5",
                                                flip ? "lg:order-2 lg:col-start-8" : "lg:order-1",
                                            )}
                                        >
                                            <Image
                                                src={SERVICE_MEDIA[s.slug]}
                                                alt=""
                                                fill
                                                sizes="(max-width: 1024px) 100vw, 42vw"
                                                className="object-cover object-top grayscale transition-[transform,filter] duration-700 ease-out group-hover/row:scale-[1.03] group-hover/row:grayscale-0"
                                            />
                                        </Link>

                                        <div
                                            data-reveal=""
                                            className={cn(
                                                "lg:col-span-6",
                                                flip
                                                    ? "lg:order-1 lg:col-start-1"
                                                    : "lg:order-2 lg:col-start-7",
                                            )}
                                        >
                                            <div className="label-mono flex items-center gap-2.5 text-(--text-mute)">
                                                <span className="text-brand tabular-nums">
                                                    {pad(i + 1)}
                                                </span>
                                                <span
                                                    aria-hidden="true"
                                                    className="block size-1 rounded-full bg-(--line)"
                                                />
                                                <span>{s.deliverableTimeline}</span>
                                            </div>

                                            <h2 className="text-subheading mt-5">
                                                <Link
                                                    href={`/services/${s.slug}`}
                                                    className="inline-block transition-transform duration-400 ease-out group-hover/row:translate-x-1.5"
                                                >
                                                    {s.title}
                                                </Link>
                                            </h2>

                                            <p className="mt-5 max-w-prose text-[1rem] leading-relaxed text-(--text-dim)">
                                                {s.shortDescription}
                                            </p>

                                            {/* Sentence case, not the Tag component: Tag is a
                          short uppercase chip and these strings are full
                          clauses. */}
                                            <ul className="mt-7 flex flex-wrap gap-2">
                                                {s.featuresList.slice(0, 4).map((f) => (
                                                    <li
                                                        key={f}
                                                        className="rounded-full border border-(--line) px-3.5 py-1.5 text-[0.8125rem] text-(--text-dim)"
                                                    >
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>

                                            <Link
                                                href={`/services/${s.slug}`}
                                                className="group/link mt-8 inline-flex items-center gap-2.5 text-sm font-medium text-(--text) transition-colors hover:text-brand"
                                            >
                                                How we run {s.title.toLowerCase()}
                                                <span
                                                    aria-hidden="true"
                                                    className="transition-transform duration-300 group-hover/link:translate-x-1"
                                                >
                                                    →
                                                </span>
                                            </Link>
                                        </div>
                                    </article>
                                </Reveal>
                            );
                        })}
                    </ol>
                </div>
            </section>

            {/* ⚑ processSteps is still site copy in lib/data — there is no
          endpoint behind it. When it gets an admin screen it moves to
          lib/api and this import disappears. */}
            <ProcessTracker steps={processSteps} index="02" eyebrow="How it runs" />

            <CTABand
                title="Not sure which of these you need?"
                body="Describe the outcome you are after and we will tell you which disciplines it actually takes, including when the honest answer is fewer than you expected."
                primary={{ label: "Talk to us", href: "/contact" }}
                secondary={{ label: "See the work", href: "/projects" }}
            />
        </>
    );
}
