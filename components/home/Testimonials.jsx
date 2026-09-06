import Link from "next/link";
import SectionIndex from "@/components/ui/SectionIndex";
import { getTestimonials, getProjects } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Static quote wall — no carousel.
 *
 * A carousel here would hide three of the four quotes behind an interaction
 * nobody performs, and it would drag a client bundle into an otherwise fully
 * server-rendered page. The lead quote is set large; the rest sit in a hairline
 * grid. Every quote links to the case study it came from, which is what makes
 * a testimonial checkable rather than decorative.
 */
export default async function Testimonials() {
  const [featured, projects] = await Promise.all([
    getTestimonials({ featuredOnly: true }),
    getProjects(),
  ]);
  const items = featured.slice(0, 4);
  const projectsById = Object.fromEntries(projects.map((p) => [p._id, p]));
  const [lead, ...rest] = items;

  if (!lead) return null;

  const initials = (name) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("");

  const Attribution = ({ t, size = "sm" }) => {
    const project = t.projectRef ? projectsById[t.projectRef] : null;
    return (
      <footer className="mt-7 flex items-center gap-3.5">
        <span
          aria-hidden="true"
          className={cn(
            "label-mono flex items-center justify-center border border-(--line) text-(--text-mute)",
            size === "lg" ? "h-11 w-11" : "h-9 w-9"
          )}
        >
          {initials(t.clientName)}
        </span>
        <div>
          <p className="text-[0.9375rem] font-medium text-(--text)">{t.clientName}</p>
          <p className="label-mono mt-1 text-(--text-mute)">
            {t.clientDesignation} · {t.companyName}
          </p>
        </div>
        {project && (
          <Link
            href={`/projects/${project.slug}`}
            className="label-mono ml-auto shrink-0 text-(--text-mute) transition-colors hover:text-signal"
          >
            Case ↗
          </Link>
        )}
      </footer>
    );
  };

  return (
    <section className="border-b border-(--line)">
      <div className="shell py-20 md:py-28">
        <SectionIndex index="04" label="What clients say afterwards" />

        <div className="mt-12 grid gap-x-12 gap-y-12 lg:grid-cols-12">
          {/* Lead quote */}
          <blockquote className="lg:col-span-6">
            <span aria-hidden="true" className="block h-px w-14 bg-signal" />
            <p className="mt-8 text-[clamp(1.4rem,1.1rem+1.1vw,2rem)] font-medium leading-[1.32] tracking-[-0.028em] text-(--text)">
              “{lead.reviewText}”
            </p>
            <Attribution t={lead} size="lg" />
          </blockquote>

          {/* Remaining quotes, hairline grid */}
          <div className="grid gap-px bg-(--line) lg:col-span-5 lg:col-start-8">
            {rest.map((t) => (
              <blockquote key={t._id} className="bg-(--canvas) py-8 first:pt-0 lg:pl-8">
                <p className="text-[0.9375rem] leading-relaxed text-(--text-dim)">
                  “{t.reviewText}”
                </p>
                <Attribution t={t} />
              </blockquote>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
