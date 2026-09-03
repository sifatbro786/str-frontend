import Link from "next/link";

const PROJECTS = [
  {
    title: "Aurora Travel Platform",
    slug: "aurora-travel-platform",
    tag: "Web Development",
    blurb: "A multi-tenant booking platform handling 40k+ monthly itineraries.",
    accent: "#E85A2A",
    large: true,
  },
  {
    title: "FinTrack Mobile",
    slug: "fintrack-mobile",
    tag: "Mobile App",
    blurb: "Personal finance app with offline sync.",
    accent: "#007BFF",
  },
  {
    title: "Helix Ops Console",
    slug: "helix-ops-console",
    tag: "Custom Software",
    blurb: "Internal operations dashboard and automation.",
    accent: "#0EA5E9",
  },
];

function ProjectCard({ title, slug, tag, blurb, accent, large }) {
  return (
    <Link
      href={`/projects/${slug}`}
      className={`group flex flex-col border border-(--border) bg-(--surface) transition-colors hover:border-(--text) ${
        large ? "lg:row-span-2" : ""
      }`}
    >
      {/* Media block — swap the inner div for next/image once covers exist */}
      <div
        className={`relative overflow-hidden border-b border-(--border) ${
          /* The lead card is stretched by row-span-2; let its media absorb the
             extra height instead of leaving a void above the footer link. */
          large ? "aspect-[16/10] lg:aspect-auto lg:flex-1" : "aspect-[16/9]"
        }`}
      >
        <div className="absolute inset-0 bg-(--surface-elevated) transition-transform duration-500 ease-out group-hover:scale-105" />
        {/* Corner accent tick */}
        <span className="absolute left-0 top-0 h-8 w-0.5" style={{ backgroundColor: accent }} />
        <span className="absolute left-0 top-0 h-0.5 w-8" style={{ backgroundColor: accent }} />
        <span className="pointer-events-none absolute bottom-4 right-4 font-mono text-[10px] uppercase tracking-[0.2em] text-(--text-muted)">
          {slug}.str
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-(--text-muted)">
            {tag}
          </span>
          <h3
            className={`mt-3 font-bold tracking-tight text-(--text) ${
              large ? "text-2xl" : "text-lg"
            }`}
          >
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-(--text-muted)">{blurb}</p>
        </div>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-(--text) transition-colors group-hover:text-primary">
          View project
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-transform group-hover:translate-x-0.5"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

export default function FeaturedProjects() {
  const [lead, ...rest] = PROJECTS;

  return (
    <section className="border-b border-(--border)">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-(--text-muted)">
              <span className="h-px w-8 bg-accent" />
              02 // Selected Work
            </div>
            <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tighter text-(--text) sm:text-5xl">
              Recent projects
            </h2>
          </div>
          <Link
            href="/projects"
            className="text-sm font-medium text-(--text-muted) transition-colors hover:text-(--text)"
          >
            All projects →
          </Link>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:grid-rows-2">
          <ProjectCard {...lead} />
          {rest.map((p) => (
            <ProjectCard key={p.slug} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}
