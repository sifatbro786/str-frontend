import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { partners } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Client marks, early — social proof belongs above the services pitch.
 *
 * Logos are normalised to a single optical height and desaturated at rest so
 * eight different brand palettes do not fight each other. Hover is where the
 * band pays out: the mark lifts, comes back to full colour, lights a radial
 * glow behind itself, and drops a glass chip naming the work.
 *
 * ── EVERYTHING HERE IS CSS ───────────────────────────────────────────────
 * This file stays a *server* component. Reveal, glow, badge and edge fade are
 * all CSS, so they work on /about with no JS at all, they work in the
 * aria-hidden clone for free, and they keep working while GSAP is translating
 * the track underneath them. The client bundle buys exactly one thing —
 * PartnersRailMotion, the velocity-aware rail — and it is behind next/dynamic
 * so a route that does not opt in never downloads it.
 *
 * ── WHY THE RAIL IS NOT THE SHARED <Marquee> ─────────────────────────────
 * Two reasons, both structural rather than stylistic. The motion marker has to
 * be the rail's last child, so it cannot live inside `children` — the clone
 * would duplicate it. And the mask here is a wider 15/85 fade than the shared
 * `mask-x` utility, which TechMarquee and the project rails are tuned against.
 * The duplicate-track pattern itself is deliberately identical to Marquee's, so
 * the two read as one idea.
 *
 * ── `interactive` IS FORWARDED, NOT ASSUMED ──────────────────────────────
 * /about renders this as a static, clipped, fully-styled rail with no GSAP
 * chunk — which is also exactly what a reduced-motion visitor gets on the
 * homepage, since every tween in the motion layer sits behind a matchMedia
 * gate and every transform below sits behind `motion-safe:`.
 */

const PartnersRailMotion = dynamic(() => import("./PartnersRailMotion"));

/* Wider than the shared `mask-x` (7/93). The band is one short row of small
   marks rather than a dense wall of text, so logos need a longer runway to
   dissolve over or they read as being chopped off at the gutter. */
const RAIL_MASK = "linear-gradient(to right, transparent, #000 15%, #000 85%, transparent)";

/* Brand-tinted pool of light, sized to overspill the mark on every side. Kept as
   a gradient rather than a blurred circle: `blur-2xl` on sixteen cells is
   sixteen filter passes, a radial-gradient is one paint. `color-mix` against the
   token means it re-tints itself in light mode instead of blowing out. */
const GLOW =
    "radial-gradient(50% 50% at 50% 50%, color-mix(in oklab, var(--color-brand) 30%, transparent), transparent 72%)";

function Logo({ partner, clone }) {
    const { name, logo, sector, work, href } = partner;

    const mark = (
        <Image
            src={logo}
            alt={name}
            width={140}
            height={44}
            sizes="140px"
            className={cn(
                "h-7 w-auto max-w-27.5 object-contain",
                // Rest: desaturated, dimmed, and knocked out to white in dark mode.
                "opacity-55 grayscale dark:brightness-0 dark:invert",
                // Hover: back to the client's actual palette. In dark mode that means
                // *undoing* the knockout, which is why both filters are named again —
                // Tailwind composes filters from separate variables, so `invert-0` and
                // `brightness-100` neutralise rather than stack.
                "group-hover:opacity-100 group-hover:grayscale-0",
                "dark:group-hover:brightness-100 dark:group-hover:invert-0",
                // The lift is motion, the colour is not. Under reduced motion the mark
                // still comes to life; it just does not move.
                "motion-safe:group-hover:scale-110",
                "transition-[opacity,filter,transform] duration-500 ease-out",
            )}
        />
    );

    return (
        <li
            data-logo
            className="group relative flex shrink-0 items-center justify-center px-8 py-10 md:px-10"
        >
            {/* Behind the mark, outside the magnetic wrapper — the glow is a property
          of the slot, so it must not travel with the magnet. */}
            <span
                aria-hidden="true"
                className={cn(
                    "pointer-events-none absolute top-1/2 left-1/2 h-28 w-44 -translate-x-1/2 -translate-y-1/2",
                    "opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100",
                )}
                style={{ background: GLOW }}
            />
            <span data-magnetic className="relative inline-flex flex-col items-center">
                {href ? (
                    <Link
                        href={href}
                        tabIndex={clone ? -1 : undefined}
                        data-cursor="view"
                        data-cursor-label={name}
                        className="inline-flex"
                    >
                        {mark}
                    </Link>
                ) : (
                    mark
                )}

                {/* Micro case-study chip. Absolutely positioned so revealing it cannot
            reflow the rail, `whitespace-nowrap` so a two-word label never wraps
            into a two-line box mid-transition. It is real text, not
            aria-hidden — a screen reader reads "AECL, Construction — Project
            control dashboard" and gets the same information the hover gives. */}
                <span
                    className={cn(
                        "pointer-events-none absolute top-full left-1/2 mt-2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap",
                        // bg-(--overlay) + blur is the glass; the hairline is what stops it
                        // reading as a generic frosted rectangle.
                        "rounded-full border border-(--line) bg-(--overlay) px-2.5 py-1 backdrop-blur-xl backdrop-saturate-150",
                        "shadow-[0_1px_0_0_rgb(255_255_255/0.05)_inset,0_16px_34px_-24px_rgb(0_0_0/0.7)]",
                        "opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover:opacity-100",
                        "motion-safe:translate-y-1 motion-safe:group-hover:translate-y-0",
                    )}
                >
                    <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-signal" />
                    <span className="label-mono text-(--text-mute)">{sector}</span>
                    <span aria-hidden="true" className="text-(--line)">
                        /
                    </span>
                    <span className="text-[0.75rem] leading-none text-(--text-dim)">{work}</span>
                </span>
            </span>
        </li>
    );
}

function Row({ clone = false }) {
    return (
        // The clone is hidden from assistive tech, otherwise a screen reader reads
        // the whole client list twice — the accessibility bug in most marquees.
        <ul aria-hidden={clone || undefined} className="flex shrink-0 items-center">
            {partners.map((p) => (
                <Logo key={p.name} partner={p} clone={clone} />
            ))}
        </ul>
    );
}

export default function PartnersBand({ interactive = false }) {
    return (
        <section aria-label="Clients and partners" className="border-b border-(--line)">
            <div className="py-12 md:py-16">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-14">
                    <p className="label-mono shell shrink-0 text-(--text-mute) lg:max-w-[22ch] lg:pr-0">
                        Trusted by teams in construction, retail, media &amp; export
                    </p>

                    <div
                        className="relative grow overflow-hidden"
                        style={{ maskImage: RAIL_MASK, WebkitMaskImage: RAIL_MASK }}
                    >
                        <div data-track className="flex min-w-max will-change-transform">
                            <Row />
                            <Row clone />
                        </div>

                        {/* Must stay LAST — PartnersRailMotion walks up to this div. */}
                        {interactive && <PartnersRailMotion speed={45} />}
                    </div>
                </div>
            </div>
        </section>
    );
}
