import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-(--border)">
      {/* Faint structural grid, faded out toward the bottom */}
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:linear-gradient(to_bottom,#000,transparent_75%)]"
      />
      {/* Thin vertical rule marking an asymmetric left column */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-6 hidden w-px bg-(--border) md:block lg:left-[max(1.5rem,calc((100%-72rem)/2))]"
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 md:pb-28 md:pt-28">
        {/* Mono index label — replaces the pill eyebrow */}
        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-(--text-muted)">
          <span className="h-px w-8 bg-accent" />
          <span className="font-mono">STR Solutions Ltd — Dhaka, BD</span>
        </div>

        <h1 className="mt-8 max-w-4xl text-balance text-5xl font-extrabold leading-[0.98] tracking-tighter text-(--text) sm:text-7xl lg:text-8xl">
          Digital products,
          <br className="hidden sm:block" />{" "}
          engineered for <span className="text-primary">scale</span>.
        </h1>

        <p className="mt-7 max-w-xl text-lg leading-relaxed text-(--text-muted)">
          We design and build software, data, and web platforms for teams that
          need systems to hold up in production — not just look good in a pitch.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-primary px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Start a Project
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 border border-(--border) px-6 py-3.5 text-sm font-semibold text-(--text) transition-colors hover:border-primary hover:text-primary"
          >
            View our work
          </Link>
        </div>

        {/* Structural coordinate strip */}
        <div className="mt-16 grid max-w-2xl grid-cols-3 border-t border-(--border) pt-6 font-mono text-xs uppercase tracking-wider text-(--text-muted)">
          <span>Est. 2017</span>
          <span className="text-center">120+ Projects</span>
          <span className="text-right">Web · Mobile · Cloud</span>
        </div>
      </div>
    </section>
  );
}
