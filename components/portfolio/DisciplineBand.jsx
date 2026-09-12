import Reveal from "@/components/motion/Reveal";
import SectionIndex from "@/components/ui/SectionIndex";
import { pad } from "@/lib/utils";

/**
 * The five disciplines, as a hairline spec grid.
 *
 * ── WHY THIS IS NOT THE FILTER ───────────────────────────────────────────
 * It reads like a control and deliberately is not one. Two widgets driving
 * one piece of state is how a reader ends up pressing the wrong thing and
 * concluding the page is broken — the filter rail below owns `active`, and it
 * is the only thing that does. This band answers the question the filter
 * cannot: what you actually receive per discipline. Only `web` hands over a
 * URL; the other four hand over files, and that distinction is the reason
 * /portfolio exists alongside /projects rather than duplicating it.
 *
 * Because it owns no state it has no reason to be a client component, so the
 * whole band ships as HTML. `Reveal` is the only client code in here and it
 * renders its children on the server — the boundary is for code, not content.
 *
 * @param {Array}  disciplines PORTFOLIO_DISCIPLINES
 * @param {object} counts      discipline id → count, from portfolioCounts()
 */
export default function DisciplineBand({ disciplines, counts = {} }) {
    return (
        <section className="border-b border-(--line)">
            <div className="shell py-20 md:py-24">
                <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
                    <div className="lg:col-span-6">
                        <SectionIndex index="01" label="Disciplines" />
                        <h2 className="text-heading mt-6 max-w-[18ch]">
                            Five shelves.{" "}
                            <span className="text-(--text-mute)">
                                Only one of them is a link.
                            </span>
                        </h2>
                    </div>
                    <p className="max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-4 lg:col-start-9">
                        Web work runs at a public address, so it is shown as one. Everything else
                        is delivered as a file set, whether renders, artwork, cuts or reporting,
                        and opens the folder it was handed over in.
                    </p>
                </div>

                <Reveal
                    className="mt-14 grid gap-px border border-(--line) bg-(--line) sm:grid-cols-2 lg:grid-cols-5"
                    stagger={0.07}
                >
                    {disciplines.map((d, i) => (
                        <div
                            key={d.id}
                            data-reveal=""
                            /* The fifth cell would otherwise sit alone in a half-empty
                               row at two columns, and with gap-px that gap paints in the
                               hairline colour — it reads as a rendering fault rather
                               than as whitespace. Spanning closes it. */
                            className={`bg-(--canvas) p-7 ${
                                i === disciplines.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""
                            }`}
                        >
                            <div className="flex items-baseline justify-between gap-3">
                                <span className="label-mono tabular-nums text-brand">
                                    {pad(i + 1)}
                                </span>
                                <span className="nums text-[0.8125rem] text-(--text-mute)">
                                    {counts[d.id] ?? 0} pieces
                                </span>
                            </div>

                            <h3 className="mt-5 text-[1.125rem] font-medium tracking-[-0.02em] text-(--text)">
                                {d.label}
                            </h3>
                            <p className="mt-3 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                                {d.note}
                            </p>

                            <p className="label-mono mt-6 border-t border-(--line) pt-4 text-(--text-mute)">
                                You receive{" "}
                                <span className="text-(--text)">{d.deliverable.toLowerCase()}</span>
                            </p>
                        </div>
                    ))}
                </Reveal>
            </div>
        </section>
    );
}
