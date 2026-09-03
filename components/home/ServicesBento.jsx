import Link from "next/link";

const SERVICES = [
  {
    no: "01",
    title: "Web Applications",
    body: "High-performance web platforms with server-rendered Next.js front-ends and hardened APIs.",
    span: "md:col-span-3 md:row-span-2",
    href: "/services/web-development",
  },
  {
    no: "02",
    title: "Mobile Solutions",
    body: "Cross-platform apps with native-grade UX and offline-first data.",
    span: "md:col-span-3",
    href: "/services/mobile-app",
  },
  {
    no: "03",
    title: "Custom Software",
    body: "Bespoke internal tools, dashboards, and automation built to your workflow.",
    span: "md:col-span-3",
    href: "/services/custom-software",
  },
  {
    no: "04",
    title: "Cloud Infrastructure",
    body: "CI/CD, containerization, observability, and cost-aware scaling on AWS/GCP.",
    span: "md:col-span-2",
    href: "/services/cloud-devops",
  },
  {
    no: "05",
    title: "Data & Analytics",
    body: "Pipelines, modeling, and dashboards that turn raw data into decisions.",
    span: "md:col-span-4",
    href: "/services/data-science",
  },
];

function ServiceCard({ no, title, body, span, href }) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between bg-(--surface) p-7 transition-colors hover:bg-(--surface-elevated) ${span}`}
    >
      <div className="flex items-start justify-between">
        <span className="font-mono text-xs tracking-[0.2em] text-(--text-muted)">
          {no} //
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="text-(--text-muted) transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
        >
          <path d="M7 17L17 7M9 7h8v8" />
        </svg>
      </div>
      <div className="mt-10">
        <h3 className="text-xl font-bold tracking-tight text-(--text)">{title}</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-(--text-muted)">
          {body}
        </p>
      </div>
      {/* Bottom accent rule wipes in on hover */}
      <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
    </Link>
  );
}

export default function ServicesBento() {
  return (
    <section className="border-b border-(--border)">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-(--text-muted)">
              <span className="h-px w-8 bg-accent" />
              01 // Services
            </div>
            <h2 className="mt-4 max-w-2xl text-balance text-3xl font-extrabold tracking-tighter text-(--text) sm:text-5xl">
              What we engineer
            </h2>
          </div>
          <Link
            href="/services"
            className="text-sm font-medium text-(--text-muted) transition-colors hover:text-(--text)"
          >
            All services →
          </Link>
        </header>

        {/* gap-px over a border-coloured background = hairline dividers */}
        <div className="mt-12 grid grid-cols-1 gap-px border border-(--border) bg-(--border) md:grid-cols-6">
          {SERVICES.map((s) => (
            <ServiceCard key={s.no} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
