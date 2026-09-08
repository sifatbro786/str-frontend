import PageMasthead from "@/components/ui/PageMasthead";
import InquiryForm from "@/components/contact/InquiryForm";
import SectionIndex from "@/components/ui/SectionIndex";
import Reveal from "@/components/motion/Reveal";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema, buildMetadata, faqSchema } from "@/lib/seo";
import { getServices } from "@/lib/api";
import { faqs } from "@/lib/data";
import { site } from "@/lib/site";
import { pad } from "@/lib/utils";

export async function generateMetadata() {
    return buildMetadata({
        identifier: "contact",
        path: "/contact",
        title: "Contact",
        description:
            "Start a project with STR Solutions Ltd. Tell us the constraint and we will reply within one business day.",
    });
}

const DIRECT = [
    { label: "General", value: site.contact.email, href: `mailto:${site.contact.email}` },
    {
        label: "New projects",
        value: site.contact.salesEmail,
        href: `mailto:${site.contact.salesEmail}`,
    },
    { label: "Dhaka", value: site.contact.phone, href: site.contact.phoneHref },
    { label: "Europe", value: site.contact.phoneEu, href: site.contact.phoneEuHref },
];

/**
 * Contact.
 *
 * ── WHY THE FAQ IS <details> HERE AND A JS ACCORDION ON THE HOMEPAGE ─────
 * Not an inconsistency. The homepage accordion animates its panels open,
 * which native <details> cannot do — the content has no box until the element
 * is open, so there is nothing to measure a height tween against.
 *
 * This page has no such requirement, and <details> is keyboard- and
 * screen-reader-correct for free with zero client JS. The only interactive
 * thing on this route is the form; adding a second client component to
 * animate an FAQ nobody scrolled here for would be paying a bundle cost for
 * a flourish.
 *
 * ── ON THE Organization SCHEMA THAT USED TO BE HERE ──────────────────────
 * Removed. lib/seo.js emits one from the public layout with a stable @id, and
 * a second, slightly different Organization block on this route created a
 * competing entity rather than reinforcing the first. The FAQ and the
 * breadcrumb are what this page genuinely adds.
 *
 * ⚑ The address block reads from site.address.line1/line2, which are
 * deliberately EMPTY in lib/site.js pending confirmation of the street
 * address. They are filtered out below rather than rendered as blank lines —
 * but a contact page with no street address is a gap worth closing before
 * launch, not a design decision.
 */
export default async function ContactPage() {
    const services = await getServices();

    const addressLines = [site.address.line1, site.address.line2, site.address.country].filter(
        Boolean,
    );

    return (
        <>
            <JsonLd
                data={[
                    breadcrumbSchema([{ name: "Contact", path: "/contact" }]),
                    faqSchema(faqs),
                ]}
            />

            <PageMasthead
                index="05"
                eyebrow="Contact"
                title="Tell us the part that is actually hard."
                lede="Not the feature list, the constraint. Whatever you send, a person reads it and replies. No sequence, no drip campaign."
                breadcrumb={[{ label: "Home", href: "/" }, { label: "Contact" }]}
                meta={[
                    { label: "Response", value: "Within one business day" },
                    { label: "Hours", value: site.contact.hours },
                    { label: "Studio", value: `${site.address.city}, ${site.address.country}` },
                    { label: "Discovery", value: "Chargeable, one week" },
                ]}
            />

            {/* ── Form and direct details ─────────────────────────────── */}
            <section className="border-b border-(--line)">
                <div className="shell grid gap-x-12 gap-y-16 py-20 md:py-24 lg:grid-cols-12">
                    <Reveal className="lg:col-span-7">
                        <SectionIndex index="01" label="Project inquiry" />
                        <h2 className="text-subheading mt-6 max-w-[20ch]">
                            Six fields. All of them get read.
                        </h2>
                        <div className="mt-10">
                            <InquiryForm services={services} />
                        </div>
                    </Reveal>

                    <aside className="lg:col-span-4 lg:col-start-9">
                        <Reveal className="lg:sticky lg:top-28" stagger={0.06}>
                            <div data-reveal="">
                                <SectionIndex index="02" label="Or reach us directly" />
                            </div>

                            <ul data-reveal="" className="mt-7 border-t border-(--line)">
                                {DIRECT.map((d) => (
                                    <li key={d.label} className="border-b border-(--line) py-4">
                                        <p className="label-mono text-(--text-mute)">{d.label}</p>
                                        <a
                                            href={d.href}
                                            className="mt-1.5 block text-[1.0625rem] tracking-[-0.01em] text-(--text) transition-colors hover:text-brand"
                                        >
                                            {d.value}
                                        </a>
                                    </li>
                                ))}
                            </ul>

                            <div data-reveal="" className="mt-10">
                                <p className="label-mono text-(--text-mute)">Studio</p>
                                <address className="mt-3 text-[1.0625rem] leading-relaxed text-(--text-dim) not-italic">
                                    {addressLines.map((line) => (
                                        <span key={line} className="block">
                                            {line}
                                        </span>
                                    ))}
                                </address>
                                <a
                                    href={site.address.mapUrl}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="group/map mt-5 inline-flex items-center gap-2.5 rounded-full border border-(--line) px-5 py-2.5 text-sm text-(--text) transition-colors hover:border-(--text)"
                                >
                                    Open in Maps
                                    <svg
                                        width="11"
                                        height="11"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        aria-hidden="true"
                                        className="transition-transform duration-300 group-hover/map:-translate-y-0.5 group-hover/map:translate-x-0.5"
                                    >
                                        <path
                                            d="M3 9 9 3M4.2 3H9v4.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </a>
                            </div>

                            <div
                                data-reveal=""
                                className="mt-10 rounded-2xl border border-(--line) bg-(--raised) p-6"
                            >
                                <p className="label-mono text-(--text-mute)">Before you write</p>
                                <ul className="mt-4 space-y-3.5 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                                    {[
                                        "A date, if there is one, is more useful than a budget.",
                                        "Existing code or files? Say so, it changes the answer.",
                                        "“I am not sure what I need” is a valid opening line.",
                                    ].map((t) => (
                                        <li key={t} className="relative pl-5">
                                            <span
                                                aria-hidden="true"
                                                className="absolute top-[0.6em] left-0 block size-1.5 rounded-full bg-brand"
                                            />
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Reveal>
                    </aside>
                </div>
            </section>

            {/* ── FAQ ─────────────────────────────────────────────────── */}
            <section className="border-b border-(--line)">
                <div className="shell py-20 md:py-24">
                    <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
                        <div className="lg:col-span-4">
                            <SectionIndex index="03" label="Before you ask" />
                            <h2 className="text-heading mt-6 max-w-[12ch]">
                                The six{" "}
                                <span className="text-(--text-mute)">we get every week.</span>
                            </h2>
                        </div>

                        <div className="lg:col-span-7 lg:col-start-6">
                            <dl className="border-t border-(--line)">
                                {faqs.map((f, i) => (
                                    <details
                                        key={f.q}
                                        className="group/faq border-b border-(--line)"
                                    >
                                        <summary className="flex cursor-pointer list-none items-start gap-5 py-6 [&::-webkit-details-marker]:hidden">
                                            <span className="label-mono shrink-0 pt-1.5 tabular-nums text-(--text-mute)">
                                                {pad(i + 1)}
                                            </span>
                                            <dt className="flex-1 text-[1.0625rem] font-medium tracking-[-0.015em] text-(--text-dim) transition-colors group-open/faq:text-(--text) group-hover/faq:text-(--text)">
                                                {f.q}
                                            </dt>
                                            {/* Two crossing rules, one of which rotates
                                                away. A chevron flipping 180 degrees is the
                                                same information with more ink. */}
                                            <span
                                                aria-hidden="true"
                                                className="relative mt-2.5 block size-3.5 shrink-0"
                                            >
                                                <span className="absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 bg-(--text-mute)" />
                                                <span className="absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 rotate-90 bg-(--text-mute) transition-transform duration-300 ease-out group-open/faq:rotate-0" />
                                            </span>
                                        </summary>
                                        <dd className="max-w-prose pb-7 pl-11 text-[0.9375rem] leading-relaxed text-(--text-mute)">
                                            {f.a}
                                        </dd>
                                    </details>
                                ))}
                            </dl>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
