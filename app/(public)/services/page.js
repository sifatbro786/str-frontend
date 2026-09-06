import Image from "next/image";
import Link from "next/link";
import PageMasthead from "@/components/ui/PageMasthead";
import CTABand from "@/components/ui/CTABand";
import ProcessSection from "@/components/home/ProcessSection";
import { getServices } from "@/lib/api";
import { SERVICE_MEDIA } from "@/lib/taxonomy";
import { site } from "@/lib/site";
import { cn, pad } from "@/lib/utils";

export const metadata = {
  title: "Services",
  description:
    "Seven disciplines under one delivery team — web, custom software, mobile, product design, graphics production, 3D visualization and digital marketing.",
  alternates: { canonical: "/services" },
};

/**
 * Services overview. Each service is a full-width alternating row rather than a
 * card in a 3×3 grid: the rows let the short description breathe at a readable
 * measure, and alternation gives the page a rhythm a uniform grid cannot.
 */
export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <PageMasthead
        index="01"
        eyebrow="Services"
        title="What we take on, and how it is scoped."
        lede="Engineering and visual production in the same studio. Below is what each discipline actually delivers and how long it usually takes — not a capability list."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Services" }]}
        meta={[
          { label: "Disciplines", value: `${services.length} active` },
          { label: "Engagement", value: "Fixed scope or dedicated squad" },
          { label: "Handover", value: "Code, files and accounts, on payment" },
          { label: "Warranty", value: "30 days post-launch, included" },
        ]}
      />

      <section className="border-b border-(--line)">
        <div className="shell">
          <ol>
            {services.map((s, i) => {
              const flip = i % 2 === 1;
              return (
                <li key={s._id} className="border-b border-(--line) last:border-b-0">
                  <article className="group grid gap-x-12 gap-y-8 py-14 md:py-20 lg:grid-cols-12 lg:items-center">
                    {/* Media */}
                    <Link
                      href={`/services/${s.slug}`}
                      aria-hidden="true"
                      tabIndex={-1}
                      className={cn(
                        "relative block aspect-[16/10] overflow-hidden border border-(--line) lg:col-span-5",
                        flip ? "lg:order-2 lg:col-start-8" : "lg:order-1"
                      )}
                    >
                      <Image
                        src={SERVICE_MEDIA[s.slug]}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 100vw, 42vw"
                        className="object-cover object-top grayscale transition-all duration-700 ease-out group-hover:scale-[1.03] group-hover:grayscale-0"
                      />
                    </Link>

                    {/* Copy */}
                    <div
                      className={cn(
                        "lg:col-span-6",
                        flip ? "lg:order-1 lg:col-start-1" : "lg:order-2 lg:col-start-7"
                      )}
                    >
                      <div className="label-mono flex items-center gap-3 text-(--text-mute)">
                        <span className="text-signal">{pad(i + 1)}</span>
                        <span aria-hidden="true" className="text-(--line)">
                          //
                        </span>
                        <span>{s.deliverableTimeline}</span>
                      </div>

                      <h2 className="text-subheading mt-5">
                        <Link
                          href={`/services/${s.slug}`}
                          className="transition-colors hover:text-signal"
                        >
                          {s.title}
                        </Link>
                      </h2>

                      <p className="mt-5 max-w-prose text-[1rem] leading-relaxed text-(--text-mute)">
                        {s.shortDescription}
                      </p>

                      {/* Sentence-case feature chips: Tag is mono/uppercase by
                          design, and these strings are too long for that. */}
                      <ul className="mt-7 flex flex-wrap gap-2">
                        {s.featuresList.slice(0, 4).map((f) => (
                          <li
                            key={f}
                            className="border border-(--line) px-3 py-1.5 text-[0.8125rem] text-(--text-dim)"
                          >
                            {f}
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={`/services/${s.slug}`}
                        className="mt-8 inline-flex items-center gap-2 border-b border-signal pb-1 text-sm font-medium text-(--text) transition-colors hover:text-signal"
                      >
                        How we run {s.title.toLowerCase()} ↗
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <ProcessSection />

      <CTABand
        title="Not sure which of these you need?"
        body={`Describe the outcome you are after and we will tell you which disciplines it actually takes — including when the honest answer is fewer than you expected. ${site.contact.responseTime}`}
        primary={{ label: "Talk to us", href: "/contact" }}
        secondary={{ label: "See the work", href: "/projects" }}
      />
    </>
  );
}
