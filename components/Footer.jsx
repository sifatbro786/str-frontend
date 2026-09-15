import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import {
    BehanceIcon,
    FacebookIcon,
    GitHubIcon,
    LinkedInIcon,
    WhatsAppIcon,
    XIcon,
} from "@/components/ui/SocialIcons";
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
   than computed so Tailwind's static extractor actually emits the classes.
 *
 * ── WHY THERE IS A GAP COLUMN ────────────────────────────────────────────
 * These used to be 3/2/3 against an identity block of 4, which sums to
 * exactly 12 with no breathing room. The identity column then carried a
 * max-w-xs description inside a 33%-wide box, so its text stopped well short
 * of its own column edge while the link stacks started immediately after it.
 * The result read as everything crushed against the left with a dead strip
 * down the middle of the page.
 *
 * Now: identity 3, column five left empty as a real gutter, then 3/2/3
 * starting at column 5. The identity block is narrower but its measure fills
 * it, which is what makes it look deliberate rather than squeezed.
 */
const COLUMN_SPANS = ["lg:col-span-3 lg:col-start-5", "lg:col-span-2", "lg:col-span-3"];

/* ── Social rail ──────────────────────────────────────────────────────────
 * Icons rather than the word marks these used to be. Five text links reading
 * "LinkedIn Facebook" sat in the same weight and colour as the sitemap columns
 * beside them, so the one row a visitor actually clicks read as more footer
 * boilerplate. A glyph is recognised before it is read.
 *
 * ⚑ WhatsApp is NOT in site.social and must not be moved there. site.social is
 * profile pages; the WhatsApp link is the studio's phone number in wa.me form
 * and lives with the rest of the contact details in site.contact, which is also
 * where /graphics and the contact page read it from. One number, one home. So
 * `href` is resolved per entry below instead of keying blindly into site.social.
 *
 * Entries with no href are dropped, which is what keeps the three unused
 * profiles (github, x, behance — empty strings in lib/site.js) from rendering
 * as dead tiles. */
const SOCIALS = [
    { key: "linkedin", label: "LinkedIn", href: site.social.linkedin, Icon: LinkedInIcon },
    { key: "facebook", label: "Facebook", href: site.social.facebook, Icon: FacebookIcon },
    {
        key: "whatsapp",
        label: "WhatsApp",
        href: site.contact.whatsappHref,
        Icon: WhatsAppIcon,
        /* The only one that is a conversation rather than a profile, so it says
           so on hover and to a screen reader. */
        hint: `Chat on WhatsApp — ${site.contact.whatsapp}`,
    },
    { key: "github", label: "GitHub", href: site.social.github, Icon: GitHubIcon },
    { key: "behance", label: "Behance", href: site.social.behance, Icon: BehanceIcon },
    { key: "x", label: "X", href: site.social.x, Icon: XIcon },
].filter((s) => s.href);

/* 40px hit target, which is the floor for a thumb, and a hairline circle so the
   rail reads as the same family as the pills on /graphics and /portfolio rather
   than as a downloaded icon set. Fill on hover, not a tint: at 16px a colour
   change alone is almost invisible against --raised, and the solid brand disc is
   the one moment of colour in an otherwise grey footer.
 *
 * transition-[...] and not transition-all — the magnetic transform is written
 * by GSAP on every pointer move, and letting CSS transition it too means the
 * two fight and the tile lags behind the cursor. */
const SOCIAL_TILE =
    "inline-flex size-10 items-center justify-center rounded-full border border-(--line) bg-(--canvas) text-(--text-mute) transition-[color,background-color,border-color] duration-200 hover:border-brand hover:bg-brand hover:text-white";

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

    return (
        <FooterReveal>
            {/* The curve is inside the reveal window, in normal flow, so it is
          clipped along with everything else while the footer is being unveiled
          and lands as the plate's top edge exactly when the reveal completes. */}
            <FooterCurve />

            <footer className="relative bg-(--raised)">
                <div className="shell pt-4 md:pt-8">
                    <div className="grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-12">
                        {/* ── Identity rail ───────────────────────────────────
                    No max-w and no pr on the description any more. Both were
                    holding the text inside an already-narrow column, so the
                    block sat left with a strip of nothing beside it. The
                    column itself is the measure now. */}
                        <div className="lg:col-span-3">
                            <Logo height={35} />

                            <p className="mt-7 text-[0.9375rem] leading-relaxed text-(--text-mute)">
                                {site.description}
                            </p>

                            <StudioStatus />

                            <ul className="mt-8 flex flex-wrap gap-3">
                                {SOCIALS.map(({ key, label, href, Icon, hint }) => (
                                    <li key={key}>
                                        <a
                                            data-magnetic=""
                                            href={href}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            /* The link carries the name; the
                                               glyph inside is aria-hidden. A
                                               title as well, because an icon
                                               with no text needs a tooltip for
                                               anyone who does not recognise
                                               the mark. */
                                            aria-label={hint ?? label}
                                            title={hint ?? label}
                                            className={SOCIAL_TILE}
                                        >
                                            <Icon className="size-[1.0625rem]" />
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
