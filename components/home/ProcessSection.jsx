import SectionIndex from "@/components/ui/SectionIndex";
import dynamic from "next/dynamic";
import { processSteps } from "@/lib/data";

/**
 * The process, set as a specification table rather than four icon cards with a
 * connecting dotted line. Each step declares what you actually receive at the
 * end of it — that column is the reason this section earns its space.
 *
 * Shared with /services, which passes nothing and therefore renders without the
 * connector. That is a purely decorative aria-hidden spine, and reaching it
 * through next/dynamic keeps the GSAP chunk off that route. Phase 5 is
 * homepage-only.
 */
const ProcessConnector = dynamic(() => import("./ProcessConnector"));

export default function ProcessSection({ interactive = false }) {
  return (
    <section className="border-b border-(--line)">
      <div className="shell py-20 md:py-28">
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <SectionIndex index="03" label="How we work" />
            <h2 className="text-heading mt-6 max-w-[16ch]">
              Four stages.{" "}
              <span className="text-(--text-mute)">No surprises in stage three.</span>
            </h2>
          </div>
          <p className="max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-4 lg:col-start-9">
            Discovery is chargeable and separate. If what comes out of it says the
            project should not go ahead, that is a legitimate result and you have
            paid for a week, not a quarter.
          </p>
        </div>

        <ol className="relative mt-16 border-t border-(--line)">
          {interactive && <ProcessConnector count={processSteps.length} />}
          {processSteps.map((step) => (
            <li
              key={step.index}
              className="group grid gap-x-10 gap-y-4 border-b border-(--line) py-8 transition-colors duration-300 hover:bg-(--raised) md:py-10 lg:grid-cols-12"
            >
              <div className="flex items-baseline gap-5 lg:col-span-4">
                <span className="label-mono text-signal">{step.index}</span>
                <h3 className="text-[1.5rem] font-semibold tracking-[-0.028em] text-(--text)">
                  {step.title}
                </h3>
              </div>

              <p className="max-w-prose text-[0.9375rem] leading-relaxed text-(--text-mute) lg:col-span-5">
                {step.body}
              </p>

              <p className="label-mono self-center text-(--text-dim) lg:col-span-3 lg:text-right">
                {step.output}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
