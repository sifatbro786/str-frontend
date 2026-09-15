import Reveal from "@/components/motion/Reveal";
import SectionIndex from "@/components/ui/SectionIndex";
import CompareFrame from "@/components/graphics/CompareFrame";
import { formatRate } from "@/lib/graphics";
import { pad } from "@/lib/utils";

/**
 * The rate card, and the two ways to ask for a volume quote.
 *
 * ── WHY THE PRICES ARE AT THE TOP OF THE PAGE ────────────────────────────
 * Same argument as /portfolio's Investment block, one step further. A studio
 * that publishes per image rates is answering the only question a catalogue
 * client has before they look at anything, and burying that under eight
 * showcase sections means the reader scrolls past every piece of work looking
 * for a number instead of looking at the work. Rates first, then the pipeline
 * that earns them.
 *
 * ── WHY A REAL <table> ───────────────────────────────────────────────────
 * Because it is one. The hairline grids elsewhere on this site are lists of
 * facts that happen to sit in a grid; this is two columns of the same kind of
 * value read against each other, which is what a table is for and what a
 * screen reader needs it to be in order to announce "Masking, starting rate,
 * 25c" rather than reading two unrelated cells in a row.
 *
 * ── WHY THE FIGURES ARE NOT Intl CURRENCY ────────────────────────────────
 * See formatRate in lib/graphics. Seven of the eight rates are under a dollar.
 *
 * ── WHEN THIS MOVES BEHIND THE DASHBOARD ─────────────────────────────────
 * It takes `rates`, `terms` and `bulk` as props and reaches nothing itself, so
 * the route swapping getGraphicsRateCard for an API call changes nothing here.
 *
 * @param {string} index  Section number in the page's IA.
 * @param {Array}  rates  [{ id, position, title, amount, unit }], cheapest first
 * @param {Array}  terms  Plain strings printed under the table
 * @param {object} bulk   { note, whatsappLabel, emailLabel }
 * @param {object} hero   The opening before and after pair
 * @param {object} contact { whatsapp, whatsappHref, email }
 */

function ArrowOut({ className }) {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
        >
            <path d="M5 11 11 5M5.5 4.5H11.5V10.5" />
        </svg>
    );
}

function BulkCell({ href, external, label, value, hint }) {
    return (
        <a
            href={href}
            data-reveal=""
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="group/bulk flex flex-col bg-(--canvas) p-7 transition-colors duration-200 hover:bg-(--raised)"
        >
            <span className="label-mono text-brand">{label}</span>
            <span className="nums mt-5 text-[1.25rem] leading-snug font-medium tracking-[-0.02em] text-(--text)">
                {value}
            </span>
            <span className="mt-auto inline-flex items-center gap-2 pt-6 text-[0.9375rem] text-(--text-dim) transition-colors duration-200 group-hover/bulk:text-brand">
                {hint}
                <ArrowOut className="transition-transform duration-300 ease-out group-hover/bulk:translate-x-0.5 group-hover/bulk:-translate-y-0.5" />
            </span>
        </a>
    );
}

export default function GraphicsRateCard({
    index = "01",
    rates,
    terms,
    bulk,
    hero,
    contact,
}) {
    return (
        <section className="border-b border-(--line)">
            <div className="shell py-20 md:py-28">
                <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
                    <div className="lg:col-span-6">
                        <SectionIndex index={index} label="Rates" />
                        <h2 className="text-heading mt-6 max-w-[20ch]">
                            Published per image rates.{" "}
                            <span className="text-(--text-mute)">
                                Nothing to ask for first.
                            </span>
                        </h2>
                    </div>
                    <p className="max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-4 lg:col-start-9">
                        Eight passes, priced one at a time so you can buy only the ones your
                        photography needs. Drag the handle on the frame to see what one image
                        looks like after all eight.
                    </p>
                </div>

                <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-12">
                    {/* The opening pair. Priority, because on this route it is the
                        largest thing above the fold and the LCP element. */}
                    <div className="lg:col-span-5">
                        <CompareFrame
                            before={hero.before}
                            after={hero.after}
                            beforeLabel={hero.labels.before}
                            afterLabel={hero.labels.after}
                            alt="a catalogue product shot"
                            caption={hero.caption}
                            sizes="(max-width: 1024px) 100vw, 40vw"
                            priority
                        />
                    </div>

                    <div className="lg:col-span-7">
                        <table className="w-full border-collapse text-left">
                            <caption className="sr-only">
                                Starting rate for each pass, in USD, per image
                            </caption>
                            <thead>
                                <tr className="border-b border-(--line)">
                                    <th scope="col" className="w-10 pb-4">
                                        <span className="sr-only">Pipeline position</span>
                                    </th>
                                    <th
                                        scope="col"
                                        className="label-mono pb-4 font-medium text-(--text-mute)"
                                    >
                                        Service
                                    </th>
                                    <th
                                        scope="col"
                                        className="label-mono pb-4 text-right font-medium text-(--text-mute)"
                                    >
                                        Starting rate
                                        {/* The unit is identical on all eight rows, so it
                                            belongs in the header once rather than repeated
                                            eight times beside the figures. */}
                                        <span className="mt-1 block text-(--text-mute) opacity-70">
                                            per image
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rates.map((r) => (
                                    <tr key={r.id} className="border-b border-(--line)">
                                        <td className="label-mono nums py-4 align-baseline text-brand">
                                            {pad(r.position)}
                                        </td>
                                        <th
                                            scope="row"
                                            className="py-4 pr-4 align-baseline text-[1.0625rem] leading-snug font-medium tracking-[-0.02em] text-(--text)"
                                        >
                                            {r.title}
                                        </th>
                                        <td className="nums py-4 text-right align-baseline text-[1.25rem] leading-none font-medium tracking-[-0.03em] text-(--text)">
                                            {formatRate(r.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <ul className="mt-7 space-y-2.5">
                            {terms.map((t) => (
                                <li
                                    key={t}
                                    className="relative pl-4 text-[0.9375rem] leading-relaxed text-(--text-dim) before:absolute before:top-[0.65em] before:left-0 before:h-1 before:w-1 before:rounded-full before:bg-brand"
                                >
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* ── Bulk enquiry ────────────────────────────────────────────
                    Two routes and the reason for them, as one hairline plate. A
                    catalogue job is a batch and a batch is a conversation, so the
                    page says so here rather than sending a volume client to the
                    same contact form as everyone else. */}
                <Reveal
                    className="mt-16 grid gap-px border border-(--line) bg-(--line) md:grid-cols-3"
                    stagger={0.07}
                >
                    <div data-reveal="" className="bg-(--canvas) p-7">
                        <span className="label-mono text-(--text-mute)">Bulk work</span>
                        <p className="mt-5 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                            {bulk.note}
                        </p>
                    </div>

                    {/* data-reveal sits on the anchor itself, inside BulkCell. A
                        wrapper with `display: contents` would be the tidier markup
                        and GSAP cannot animate one: transform and opacity have no
                        effect on a box that generates no box. */}
                    <BulkCell
                        href={contact.whatsappHref}
                        external
                        label={bulk.whatsappLabel}
                        value={contact.whatsapp}
                        hint="Open WhatsApp"
                    />

                    <BulkCell
                        href={`mailto:${contact.email}?subject=${encodeURIComponent(
                            "Bulk image editing quote",
                        )}`}
                        label={bulk.emailLabel}
                        value={contact.email}
                        hint="Send the batch details"
                    />
                </Reveal>
            </div>
        </section>
    );
}
