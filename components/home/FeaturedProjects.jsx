import Image from "next/image";
import Link from "next/link";
import SectionIndex from "@/components/ui/SectionIndex";
import ArrowLink from "@/components/ui/ArrowLink";
import Tag from "@/components/ui/Tag";
import { getFeaturedProjects } from "@/lib/api";
import { SERVICE_LABELS } from "@/lib/taxonomy";
import { cn, pad } from "@/lib/utils";

/**
 * Offset editorial rail, not a uniform card grid.
 *
 * Cells alternate 7/5 columns and the narrow ones are pushed down a full
 * rhythm unit, so the eye travels diagonally instead of scanning rows. The
 * vertical offset is the whole point — remove it and this becomes the grid
 * every generated portfolio ships with.
 */
const LAYOUT = [
  "lg:col-span-7",
  "lg:col-span-5 lg:mt-28",
  "lg:col-span-5",
  "lg:col-span-7 lg:mt-28",
];

export default async function FeaturedProjects() {
  const items = await getFeaturedProjects(4);

  return (
    <section className="border-b border-(--line)">
      <div className="shell py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionIndex index="02" label="Selected work" />
            <h2 className="text-heading mt-6 max-w-[17ch]">
              Four projects{" "}
              <span className="text-(--text-mute)">worth explaining properly.</span>
            </h2>
          </div>
          <ArrowLink href="/projects" className="pb-2">
            All {items.length > 0 ? "case studies" : "work"}
          </ArrowLink>
        </div>

        <div className="mt-16 grid gap-x-10 gap-y-16 lg:grid-cols-12">
          {items.map((p, i) => (
            <article key={p._id} className={cn("group", LAYOUT[i])}>
              <Link href={`/projects/${p.slug}`} className="block">
                <div className="relative overflow-hidden border border-(--line)">
                  <div className={cn("relative", i % 3 === 0 ? "aspect-[16/10]" : "aspect-[4/3]")}>
                    <Image
                      src={p.coverImage}
                      alt={p.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover object-top transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]"
                    />
                  </div>

                  {/* Index plate, flush to the corner — no floating badge */}
                  <span className="label-mono absolute left-0 top-0 bg-(--canvas) px-3 py-2 text-(--text-mute)">
                    {pad(i + 1)}
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <h3 className="text-subheading text-(--text) transition-colors group-hover:text-signal">
                    {p.title}
                  </h3>
                  <span className="label-mono text-(--text-mute)">{p.clientName}</span>
                </div>

                <p className="mt-4 max-w-prose text-[0.9375rem] leading-relaxed text-(--text-mute)">
                  {p.shortDescription}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {p.serviceTypes.map((s, si) => (
                    <Tag key={s} variant={si === 0 ? "outline" : "ghost"}>
                      {SERVICE_LABELS[s]}
                    </Tag>
                  ))}
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
