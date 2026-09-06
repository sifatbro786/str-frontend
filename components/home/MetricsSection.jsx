import dynamic from "next/dynamic";
import { metrics } from "@/lib/data";

/**
 * Inverted full-bleed band. Values are split into `value` and `suffix` in
 * lib/data.js so the count-up only ever touches the number node, and `nums`
 * gives tabular figures so a running count cannot reflow the row.
 *
 * Shared with /about, which passes nothing and therefore renders as plain static
 * figures — both motion children are reached through next/dynamic so that route
 * never loads the GSAP chunk. Phase 5 is homepage-only.
 */
const MetricsGlow = dynamic(() => import("./MetricsGlow"));
const MetricsCounter = dynamic(() => import("./MetricsCounter"));

export default function MetricsSection({ interactive = false }) {
  return (
    <section
      aria-label="Studio at a glance"
      className="relative overflow-hidden bg-(--text) text-(--canvas)"
    >
      {interactive && <MetricsGlow />}
      <div className="shell relative py-16 md:py-20">
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
                {interactive ? <MetricsCounter value={m.value} /> : m.value}
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
