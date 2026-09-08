import Link from "next/link";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The band that closes every route.
 *
 * ── WHY IT IS INVERTED ───────────────────────────────────────────────────
 * On a page built almost entirely from white and hairlines, a contrast flip
 * is the only device left that reads as "this section is different" without
 * adding a colour, a shadow or a gradient. It terminates the page rather than
 * being one more card on it.
 *
 * ── WHAT CAME OUT ────────────────────────────────────────────────────────
 * The lazily-loaded CTABandMotion import and the `interactive` prop: only the
 * homepage ever set it, the homepage no longer renders this band at all, and
 * a next/dynamic call that nothing reaches is a chunk in the build graph for
 * nobody. The orange "Next step" eyebrow went with the rest of the orange,
 * and the diagonal hatch panel went because at 7% opacity on a dark ground it
 * was invisible on every screen that is not a calibrated monitor.
 *
 * ── WHY THE COLOURS ARE HARD-CODED TO --text / --canvas ──────────────────
 * This band deliberately swaps them, so a nested component reading --text
 * inside it would render dark-on-dark. That is why the secondary link below
 * spells out its own border colour instead of using the shared Button
 * component, whose variants are canvas-relative.
 */
export default function CTABand({
    title = "Have something that needs building properly?",
    body = "Tell us the constraint you are actually stuck on. If it is not something we should take, we will say so on the first call.",
    primary = { label: "Start a project", href: "/contact" },
    secondary = { label: "See selected work", href: "/projects" },
    className,
}) {
    return (
        <section className={cn("bg-(--text) text-(--canvas)", className)}>
            <div className="shell grid gap-10 py-20 md:py-28 lg:grid-cols-12 lg:items-end">
                <div className="lg:col-span-7">
                    <p className="label-mono opacity-55">Next step</p>
                    <h2 className="text-heading mt-5 max-w-[16ch]">{title}</h2>
                </div>

                <div className="lg:col-span-5">
                    <p className="max-w-md text-[1.0625rem] leading-relaxed opacity-70">{body}</p>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Link
                            href={primary.href}
                            className="group/cta inline-flex items-center gap-2.5 rounded-full bg-(--canvas) px-7 py-3.5 text-[0.9375rem] font-medium text-(--text) transition-colors duration-200 hover:bg-brand hover:text-white"
                        >
                            {primary.label}
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                aria-hidden="true"
                                className="transition-transform duration-300 ease-out group-hover/cta:translate-x-1"
                            >
                                <path
                                    d="M2.5 8h11M9.5 4l4 4-4 4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </Link>

                        {secondary && (
                            <Link
                                href={secondary.href}
                                className="inline-flex items-center rounded-full border border-(--canvas)/25 px-7 py-3.5 text-[0.9375rem] font-medium transition-colors hover:border-(--canvas)"
                            >
                                {secondary.label}
                            </Link>
                        )}
                    </div>

                    <p className="label-mono mt-8 opacity-50">
                        or email{" "}
                        <a
                            href={`mailto:${site.contact.email}`}
                            className="underline decoration-current/40 underline-offset-4 transition-opacity hover:opacity-100"
                        >
                            {site.contact.email}
                        </a>
                        . {site.contact.responseTime}
                    </p>
                </div>
            </div>
        </section>
    );
}
