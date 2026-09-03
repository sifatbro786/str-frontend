import Link from "next/link";

const CAPABILITIES = [
  {
    no: "01",
    title: "Software Development",
    body: "Robust, enterprise-grade systems built for scale and maintainability.",
  },
  {
    no: "02",
    title: "Web Development",
    body: "Modern, performant web experiences that convert visitors into customers.",
  },
  {
    no: "03",
    title: "Data Science & Analytics",
    body: "Turning raw data into decisions with advanced analytics and modeling.",
  },
  {
    no: "04",
    title: "Digital Marketing",
    body: "Measurable growth through search, content, and performance campaigns.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 md:pt-28">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[--text-muted]">
          STR Solutions Ltd. — Dhaka, Bangladesh
        </p>
        <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[--text] sm:text-6xl">
          We engineer software, data, and digital products{" "}
          <span className="text-primary">built for scale</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[--text-muted]">
          A product and engineering studio partnering with teams to design,
          build, and ship systems that hold up in production.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            href="/contact"
            className="bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[--color-primary-hover]"
          >
            Start a project
          </Link>
          <Link
            href="/projects"
            className="border border-[--border] px-6 py-3 text-sm font-semibold text-[--text] transition-colors hover:border-primary hover:text-primary"
          >
            View our work
          </Link>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-t border-[--border]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-[--text]">
              What we do
            </h2>
            <Link
              href="/services"
              className="text-sm font-medium text-[--text-muted] transition-colors hover:text-[--text]"
            >
              All services →
            </Link>
          </div>

          <div className="mt-10 grid gap-px border border-[--border] bg-[--border] sm:grid-cols-2">
            {CAPABILITIES.map((c) => (
              <article key={c.no} className="bg-[--surface] p-8">
                <span className="font-mono text-xs text-[--text-muted]">{c.no}</span>
                <h3 className="mt-3 text-lg font-semibold text-[--text]">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[--text-muted]">
                  {c.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
