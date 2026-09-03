const METRICS = [
  { value: "120+", label: "Projects Delivered" },
  { value: "8", suffix: "yrs", label: "In Operation" },
  { value: "40+", label: "Active Clients" },
  { value: "99.9%", label: "Uptime SLA" },
];

export default function MetricsSection() {
  return (
    /* Deliberately inverted band — the one section that does not follow the
       theme surfaces. It anchors the page with hard contrast. */
    <section className="bg-[#0B0F17] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-white/50">
          <span className="h-px w-8 bg-accent" />
          04 // Impact
        </div>

        {/* 4-up waits for lg: at md each cell is ~179px while "99.9%" at
            sm:text-6xl needs ~182px, which pushed the page into h-scroll. */}
        <dl className="mt-10 grid grid-cols-2 gap-y-10 lg:grid-cols-4">
          {METRICS.map((m, i) => (
            /* col-reverse paints the value above its label while keeping the
               dt→dd order a <dl> requires (and screen readers expect). */
            <div
              key={m.label}
              className={`flex flex-col-reverse gap-3 ${
                i % 4 !== 0 ? "lg:border-l lg:border-white/15 lg:pl-8" : ""
              }`}
            >
              <dt className="font-mono text-xs uppercase tracking-wider text-white/50">
                {m.label}
              </dt>
              <dd className="nums text-5xl font-extrabold tracking-tighter sm:text-6xl">
                {m.value}
                {m.suffix && (
                  <span className="ml-1 text-2xl font-semibold text-accent">{m.suffix}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
