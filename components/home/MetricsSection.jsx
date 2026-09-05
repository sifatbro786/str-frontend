import { metrics } from "@/lib/data";

/**
 * Inverted full-bleed band. Static figures for Phase 3 — the count-up lands in
 * Phase 5, which is why the values are already split into `value` and `suffix`
 * in lib/data.js: the animator only ever needs to touch the number node.
 *
 * `nums` gives tabular figures so a future count-up cannot reflow the row.
 */
export default function MetricsSection() {
  return (
    <section aria-label="Studio at a glance" className="bg-(--text) text-(--canvas)">
      <div className="shell py-16 md:py-20">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className={
                i === 0
                  ? "lg:pr-8"
                  : "lg:border-l lg:border-(--canvas)/15 lg:pl-8 lg:pr-8"
              }
            >
              <dd className="nums text-[clamp(2.75rem,2rem+3.4vw,4.75rem)] font-semibold leading-none tracking-[-0.045em]">
                {m.value}
                <span className="text-signal">{m.suffix}</span>
              </dd>
              <dt className="mt-4 text-[0.9375rem] font-medium">{m.label}</dt>
              <p className="label-mono mt-2 opacity-55">{m.note}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
