import Image from "next/image";
import PageMasthead from "@/components/ui/PageMasthead";
import CTABand from "@/components/ui/CTABand";
import SectionIndex from "@/components/ui/SectionIndex";
import MetricsSection from "@/components/home/MetricsSection";
import PartnersBand from "@/components/home/PartnersBand";
import { getTeam } from "@/lib/api";
import { capabilities } from "@/lib/data";
import { site } from "@/lib/site";
import { pad } from "@/lib/utils";

export const metadata = {
  title: "About",
  description:
    "STR Solutions Ltd. — a Dhaka engineering and visual production studio. Who we are, how we work, and the people who do it.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const team = await getTeam();

  return (
    <>
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
          { label: "Disciplines", value: "Engineering · Design · Production" },
        ]}
      />

      {/* ── Story ───────────────────────────────────────────── */}
      <section className="border-b border-(--line)">
        <div className="shell grid gap-x-12 gap-y-12 py-20 md:py-28 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionIndex index="01" label="Where this came from" />
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <p className="text-[clamp(1.35rem,1.05rem+1.1vw,1.9rem)] font-medium leading-[1.35] tracking-[-0.025em] text-(--text)">
              STR started in {site.foundedYear} with two contracts and a rented desk. The
              first was a retouching queue nobody else wanted. The second was a website
              for the same client, because they trusted whoever had already done the
              boring job well.
            </p>

            <div className="prose-str mt-10">
              <p>
                That order — production first, engineering second — is unusual, and it
                shaped how the studio works. We learned volume discipline before we
                learned software architecture: fixed turnaround, a QC gate, and a named
                person accountable for every batch. When the engineering side grew, it
                inherited those habits rather than the other way round.
              </p>
              <p>
                It is also why we can put a case study, its renders, and its landing page
                through the same building in the same week. Most studios can do one of
                those three and subcontract the rest, which is where deadlines go to die.
              </p>
              <p>
                We are deliberately mid-sized. Large enough to staff a squad and absorb a
                sick week, small enough that the founder still reads every proposal that
                goes out. We have turned down work that would have doubled headcount, and
                we would do it again.
              </p>
            </div>
          </div>
        </div>
      </section>

      <MetricsSection />

      {/* ── How we're set up ────────────────────────────────── */}
      <section className="border-b border-(--line)">
        <div className="shell py-20 md:py-28">
          <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-6">
              <SectionIndex index="02" label="How we engage" />
              <h2 className="text-heading mt-6 max-w-[16ch]">
                Four shapes of work.{" "}
                <span className="text-(--text-mute)">Pick the one that fits.</span>
              </h2>
            </div>
            <p className="max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-4 lg:col-start-9">
              Most clients start with one and move between them. Nothing here requires a
              twelve-month commitment to begin.
            </p>
          </div>

          <div className="mt-14 grid gap-px border border-(--line) bg-(--line) md:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((c, i) => (
              <div key={c.title} className="bg-(--canvas) p-8">
                <span className="label-mono text-signal">{pad(i + 1)}</span>
                <h3 className="mt-5 text-[1.25rem] font-semibold tracking-[-0.025em] text-(--text)">
                  {c.title}
                </h3>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-(--text-mute)">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ────────────────────────────────────────────── */}
      <section className="border-b border-(--line)">
        <div className="shell py-20 md:py-28">
          <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-6">
              <SectionIndex index="03" label="Who you will work with" />
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

          <ul className="mt-14 grid gap-px border border-(--line) bg-(--line) sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m, i) => (
              <li key={m._id} className="group bg-(--canvas)">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={m.image}
                    alt={m.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-top grayscale transition-all duration-700 ease-out group-hover:grayscale-0"
                  />
                  <span className="label-mono absolute left-0 top-0 bg-(--canvas) px-3 py-2 text-(--text-mute)">
                    {pad(i + 1)}
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-(--text)">
                    {m.name}
                  </h3>
                  <p className="label-mono mt-2 text-signal">{m.designation}</p>
                  <p className="mt-4 text-[0.875rem] leading-relaxed text-(--text-mute)">{m.bio}</p>

                  {m.socialLinks?.linkedin && (
                    <a
                      href={m.socialLinks.linkedin}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="label-mono mt-5 inline-block text-(--text-mute) transition-colors hover:text-signal"
                    >
                      LinkedIn ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <PartnersBand />

      <CTABand
        title="Come and see how we actually run a project."
        body="We are happy to walk a prospective client through a live project board, warts included. It tells you more than any capability deck."
        primary={{ label: "Arrange a call", href: "/contact" }}
        secondary={{ label: "Read the case studies", href: "/projects" }}
      />
    </>
  );
}
