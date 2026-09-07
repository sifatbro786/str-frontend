import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { site } from "@/lib/site";
import FooterCurve from "./FooterCurve";
import FooterReveal from "./footer/FooterReveal";
import KineticWordmark from "./footer/KineticWordmark";
import StudioStatus from "./footer/StudioStatus";

/**
 * ── SERVER COMPONENT, DELIBERATELY ───────────────────────────────────────
 * The motion lives in four client leaves; this file stays on the server. The
 * alternative — one "use client" at the top — ships every column heading, every
 * link label, the payment-strip alt text and the whole of site.footerColumns to
 * the browser as JS, on a component that is below the fold on every route.
 *
 * The pattern that makes it work: FooterReveal is a client component, but its
 * `children` are passed in from here, so the markup inside it is still rendered
 * on the server and arrives as HTML. Client components are a boundary for
 * *code*, not for content passed through them.
 *
 * ── data-speed REMOVED ───────────────────────────────────────────────────
 * The old `data-speed="0.95"` drifted the content against the arc. FooterReveal
 * now owns the parallax, and two parallax systems on nested nodes fight: the
 * smoother effect measures from the untransformed layout position, which the
 * reveal's counter-translate has already changed.
 */

/* Explicit spans, index-aligned with site.footerColumns. Written out rather
   than computed so Tailwind's static extractor actually emits the classes. */
const COLUMN_SPANS = ["lg:col-span-3", "lg:col-span-2", "lg:col-span-3"];

const SOCIALS = [
    { key: "linkedin", label: "LinkedIn" },
    { key: "facebook", label: "Facebook" },
    { key: "github", label: "GitHub" },
    { key: "behance", label: "Behance" },
    { key: "x", label: "X" },
];

/* data-magnetic is read by FooterReveal's delegated pointer handler.
   inline-block is not optional — a transform on an inline box is ignored, and
   that is the usual reason a magnetic text link does nothing. The negative
   margin gives the magnet a little room to move inside without nudging layout. */
const LINK =
    "inline-block -mx-1 -my-0.5 px-1 py-0.5 text-[0.9375rem] text-(--text-dim) transition-colors hover:text-signal";
const META =
    "label-mono inline-block -mx-1 -my-0.5 px-1 py-0.5 text-(--text-mute) transition-colors hover:text-signal";

export default function Footer() {
    const year = new Date().getFullYear();

    // site.address.line1/line2 are intentionally empty until the street address
    // is confirmed (see lib/site.js). Filtering rather than rendering blank <br>s.
    const addressLines = [site.address.line1, site.address.line2, site.address.country].filter(
        Boolean,
    );

    return (
        <FooterReveal>
            {/* The curve is inside the reveal window, in normal flow, so it is
          clipped along with everything else while the footer is being unveiled
          and lands as the plate's top edge exactly when the reveal completes. */}
            <FooterCurve />

            <footer className="relative bg-(--raised)">
                <div className="shell pt-4 md:pt-8">
                    <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-12">
                        {/* ── Identity rail ─────────────────────────────────── */}
                        <div className="lg:col-span-4 lg:pr-10">
                            <Logo height={35} />

                            <p className="mt-7 max-w-xs text-[0.9375rem] leading-relaxed text-(--text-mute)">
                                {site.description}
                            </p>

                            <StudioStatus />

                            {addressLines.length > 0 && (
                                <address className="mt-8 not-italic">
                                    <span className="label-mono block text-(--text-mute)">
                                        Studio
                                    </span>
                                    <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                                        {addressLines.map((line) => (
                                            <span key={line} className="block">
                                                {line}
                                            </span>
                                        ))}
                                    </p>
                                </address>
                            )}

                            <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2">
                                {SOCIALS.filter((s) => site.social[s.key]).map((s) => (
                                    <li key={s.key}>
                                        <a
                                            data-magnetic=""
                                            href={site.social[s.key]}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className={META}
                                        >
                                            {s.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* ── Link stacks ───────────────────────────────────── */}
                        {site.footerColumns.map((col, i) => (
                            <nav key={col.title} aria-label={col.title} className={COLUMN_SPANS[i]}>
                                <h2 className="label-mono text-(--text-mute)">{col.title}</h2>
                                <ul className="mt-5 space-y-2.5">
                                    {col.links.map((link) => {
                                        const external = /^(https?:|mailto:|tel:)/.test(link.href);
                                        return (
                                            <li key={link.href}>
                                                {external ? (
                                                    <a
                                                        data-magnetic=""
                                                        href={link.href}
                                                        target={
                                                            link.href.startsWith("http")
                                                                ? "_blank"
                                                                : undefined
                                                        }
                                                        rel="noreferrer noopener"
                                                        className={LINK}
                                                    >
                                                        {link.label}
                                                    </a>
                                                ) : (
                                                    <Link
                                                        data-magnetic=""
                                                        href={link.href}
                                                        className={LINK}
                                                    >
                                                        {link.label}
                                                    </Link>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </nav>
                        ))}
                    </div>

                    {/* ── Payment strip (SSLCommerz gateway coverage) ─────── */}
                    <section
                        aria-label="Accepted payment methods"
                        className="mt-16 border-t border-(--line) pt-8"
                    >
                        <div className="overflow-x-auto">
                            {/* The artwork is authored on white; it sits on its own plate in
                  both themes rather than being inverted, because bank marks
                  must not be recoloured. */}
                            <div className="min-w-180 bg-white px-4 py-3">
                                <Image
                                    src={site.brand.paymentStrip}
                                    alt="Accepted payment methods — Visa, Mastercard, American Express, bKash, Nagad, Rocket, Upay and Bangladeshi bank cards, processed via SSLCommerz"
                                    width={5011}
                                    height={587}
                                    sizes="(max-width: 768px) 720px, 1200px"
                                    className="h-auto w-full"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* ── Kinetic wordmark ────────────────────────────────── */}
                {/* Furniture at this size, so it is aria-hidden inside the component
            and the accessible name lives in the copyright line below. */}
                <div className="shell mt-16 md:mt-24">
                    <KineticWordmark text={site.legalName.toUpperCase()} />
                </div>

                {/* ── Legal row ───────────────────────────────────────── */}
                <div className="mt-6 border-t border-(--line)">
                    <div className="shell flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        <p className="label-mono text-(--text-mute)">
                            © {year} {site.legalName} · Reg. Bangladesh
                        </p>
                        <ul className="flex flex-wrap gap-x-5 gap-y-2">
                            {site.legalLinks.map((l) => (
                                <li key={l.href}>
                                    <Link data-magnetic="" href={l.href} className={META}>
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </footer>
        </FooterReveal>
    );
}
