import PageMasthead from "@/components/ui/PageMasthead";
import InquiryForm from "@/components/contact/InquiryForm";
import SectionIndex from "@/components/ui/SectionIndex";
import { getServices } from "@/lib/api";
import { faqs } from "@/lib/data";
import { site } from "@/lib/site";
import { pad } from "@/lib/utils";

export const metadata = {
  title: "Contact",
  description:
    "Start a project with STR Solutions Ltd. Tell us the constraint and we will reply within one business day.",
  alternates: { canonical: "/contact" },
};

const DIRECT = [
  { label: "General", value: site.contact.email, href: `mailto:${site.contact.email}` },
  { label: "New projects", value: site.contact.salesEmail, href: `mailto:${site.contact.salesEmail}` },
  { label: "Phone", value: site.contact.phone, href: site.contact.phoneHref },
];

export default async function ContactPage() {
  const services = await getServices();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.legalName,
    url: site.url,
    logo: `${site.url}${site.brand.logo}`,
    email: site.contact.email,
    telephone: site.contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.line1,
      addressLocality: site.address.city,
      addressCountry: site.address.countryCode,
    },
    sameAs: Object.values(site.social).filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageMasthead
        index="05"
        eyebrow="Contact"
        title="Tell us the part that is actually hard."
        lede="Not the feature list — the constraint. Whatever you send, a person reads it and replies. No sequence, no drip campaign."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Contact" }]}
        meta={[
          { label: "Response", value: "Within one business day" },
          { label: "Hours", value: site.contact.hours },
          { label: "Studio", value: `${site.address.city}, ${site.address.country}` },
          { label: "Discovery", value: "Chargeable, one week" },
        ]}
      />

      {/* ── Form + direct details ───────────────────────────── */}
      <section className="border-b border-(--line)">
        <div className="shell grid gap-x-12 gap-y-16 py-20 md:py-24 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionIndex index="01" label="Project inquiry" />
            <h2 className="text-subheading mt-6 max-w-[20ch]">
              Six fields. All of them get read.
            </h2>
            <div className="mt-10">
              <InquiryForm services={services} />
            </div>
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <SectionIndex index="02" label="Or reach us directly" />

            <ul className="mt-8 border-t border-(--line)">
              {DIRECT.map((d) => (
                <li key={d.label} className="border-b border-(--line) py-5">
                  <p className="label-mono text-(--text-mute)">{d.label}</p>
                  <a
                    href={d.href}
                    className="mt-2 block text-[1.0625rem] tracking-[-0.015em] text-(--text) transition-colors hover:text-signal"
                  >
                    {d.value}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <p className="label-mono text-(--text-mute)">Studio</p>
              <address className="mt-3 not-italic text-[1.0625rem] leading-relaxed text-(--text-dim)">
                {site.address.line1}
                <br />
                {site.address.line2}
                <br />
                {site.address.country}
              </address>
              <a
                href={site.address.mapUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="label-mono mt-4 inline-block border-b border-signal pb-1 text-(--text) transition-colors hover:text-signal"
              >
                Open in Maps ↗
              </a>
            </div>

            <div className="mt-10 border border-(--line) p-6">
              <p className="label-mono text-(--text-mute)">Before you write</p>
              <ul className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                <li>· A date, if there is one, is more useful than a budget.</li>
                <li>· Existing code or files? Say so — it changes the answer.</li>
                <li>· “I am not sure what I need” is a valid opening line.</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
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
                  /* <details> rather than a JS accordion: it is keyboard- and
                     screen-reader-correct for free, and it keeps this route a
                     pure server component apart from the form. */
                  <details key={f.q} className="group border-b border-(--line)">
                    <summary className="flex cursor-pointer list-none items-start gap-5 py-6 [&::-webkit-details-marker]:hidden">
                      <span className="label-mono shrink-0 pt-1.5 text-(--text-mute)">
                        {pad(i + 1)}
                      </span>
                      <dt className="flex-1 text-[1.0625rem] font-medium tracking-[-0.015em] text-(--text)">
                        {f.q}
                      </dt>
                      <span
                        aria-hidden="true"
                        className="shrink-0 pt-1 text-(--text-mute) transition-transform duration-300 group-open:rotate-45"
                      >
                        +
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
