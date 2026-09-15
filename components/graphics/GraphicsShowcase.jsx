import Image from "next/image";
import Reveal from "@/components/motion/Reveal";
import SectionIndex from "@/components/ui/SectionIndex";
import CompareFrame from "@/components/graphics/CompareFrame";
import { formatRate } from "@/lib/graphics";
import { cn, pad } from "@/lib/utils";

/**
 * The eight passes, one block each.
 *
 * ── WHY THIS IS A SERVER COMPONENT ───────────────────────────────────────
 * It owns no state. Every word of the copy is rendered to HTML on the server
 * and only CompareFrame crosses into the browser, which is a few hundred bytes
 * of pointer maths per frame. The v1 page was one enormous client component
 * because the slider lived inside it; splitting the slider out is what lets
 * the rest of the page be free.
 *
 * ── WHY THE LAYOUT ALTERNATES WITH col-start AND NOT WITH ORDER ──────────
 * Both columns declare an explicit `lg:col-start` and `lg:row-start-1`, so the
 * DOM order is free to stay reading order on every block: heading, then the
 * work it describes. Doing it with `order-*` would put the media first in the
 * markup on every other block, which is what a screen reader and a print
 * stylesheet would then read.
 *
 * ⚑ `lg:row-start-1` is load bearing, not decoration. Grid auto placement only
 * moves forward, so a text column explicitly placed at column 9 followed by a
 * media column at column 1 lands on the NEXT row. Pinning both to row 1 is
 * what keeps the pair side by side.
 *
 * ── WHY TWO OF THE EIGHT HAVE NO SLIDER ──────────────────────────────────
 * Colour processing and crop and resize have no "before" a client would
 * recognise. Rendering a slider over one image and half of itself would be a
 * lie about the work, so those rows are `mode: "static"` in lib/graphics and
 * render as a plain framed piece. The frames differ too: a compare pair must
 * fill and align, a finished board has edges that carry meaning and sits whole
 * inside its mount. Same distinction PortfolioCard draws between a site
 * screenshot and a render.
 *
 * @param {string} index    Section number in the page's IA.
 * @param {Array}  services From getGraphicsServices()
 */

function StaticFrame({ src, alt, caption, aspect = "aspect-4/3", sizes, className }) {
    return (
        <figure className={className}>
            <div
                className={cn(
                    "relative w-full overflow-hidden rounded-2xl border border-(--line) bg-(--raised)",
                    aspect,
                )}
            >
                <Image src={src} alt={alt} fill sizes={sizes} className="object-contain p-4" />
            </div>
            {caption && (
                <figcaption className="label-mono mt-3 text-(--text-mute)">{caption}</figcaption>
            )}
        </figure>
    );
}

function ServiceBlock({ service, position, flipped }) {
    const { id, stage, title, summary, receive, rate, mode, labels, hero, support } = service;

    const text = (
        <div
            data-reveal=""
            className={cn(
                "lg:row-start-1 lg:col-span-4",
                flipped ? "lg:col-start-9" : "lg:col-start-1",
            )}
        >
            <SectionIndex index={pad(position)} label={stage} />

            <h3 className="text-subheading mt-5 text-(--text)">{title}</h3>

            <p className="mt-4 text-[1.0625rem] leading-relaxed text-(--text-dim)">{summary}</p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
                {receive.map((r) => (
                    <span
                        key={r}
                        className="label-mono rounded-full border border-(--line) px-3 py-1 text-(--text-mute)"
                    >
                        {r}
                    </span>
                ))}
            </div>

            {/* The rate again, next to the work it buys. The table at the top of
                the page answers "what does this cost"; this answers "what am I
                looking at", which is a different question asked eight sections
                later by a reader who is no longer near the table. */}
            <p className="label-mono mt-7 border-t border-(--line) pt-4 text-(--text-mute)">
                Starting from{" "}
                <span className="nums text-(--text)">{formatRate(rate.amount)}</span>{" "}
                {rate.unit}
            </p>
        </div>
    );

    const media = (
        <div
            data-reveal=""
            className={cn(
                "lg:row-start-1 lg:col-span-7",
                flipped ? "lg:col-start-1" : "lg:col-start-6",
            )}
        >
            {mode === "compare" ? (
                <CompareFrame
                    before={hero.before}
                    after={hero.after}
                    beforeLabel={labels.before}
                    afterLabel={labels.after}
                    alt={`${title.toLowerCase()} sample`}
                    caption={hero.caption}
                    sizes="(max-width: 1024px) 100vw, 55vw"
                />
            ) : (
                <StaticFrame
                    src={hero.src}
                    alt={`${title} sample`}
                    caption={hero.caption}
                    sizes="(max-width: 1024px) 100vw, 55vw"
                />
            )}

            {support.length > 0 && (
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    {support.map((img) => (
                        <CompareFrame
                            key={img.caption}
                            before={img.before}
                            after={img.after}
                            beforeLabel={labels.before}
                            afterLabel={labels.after}
                            alt={`${title.toLowerCase()} sample`}
                            caption={img.caption}
                            aspect="aspect-square"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 28vw"
                        />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <Reveal
            as="article"
            id={id}
            /* Cleared by the navbar, which is fixed. Without it a deep link
               lands with the heading under the header. */
            className="grid scroll-mt-28 gap-10 border-t border-(--line) py-16 first:border-t-0 first:pt-0 md:py-20 lg:grid-cols-12 lg:items-center lg:gap-12"
            stagger={0.12}
        >
            {text}
            {media}
        </Reveal>
    );
}

export default function GraphicsShowcase({ index = "02", services }) {
    return (
        <section className="border-b border-(--line)">
            <div className="shell py-20 md:py-28">
                <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
                    <div className="lg:col-span-6">
                        <SectionIndex index={index} label="The pipeline" />
                        <h2 className="text-heading mt-6 max-w-[20ch]">
                            One image, eight passes.{" "}
                            <span className="text-(--text-mute)">In this order, every time.</span>
                        </h2>
                    </div>
                    <p className="max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-4 lg:col-start-9">
                        Each pass is bought on its own, so a catalogue that only needs a clean cut
                        pays for a clean cut. Every frame below is real client work. Drag the handle
                        to move between what arrived and what went back.
                    </p>
                </div>

                <div className="mt-16">
                    {services.map((service, i) => (
                        <ServiceBlock
                            key={service.id}
                            service={service}
                            position={i + 1}
                            /* Odd indices flip. The first block reads text left,
                               work right, which is the way the rest of the site
                               opens a section. */
                            flipped={i % 2 === 1}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
