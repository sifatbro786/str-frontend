import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { site } from "@/lib/site";
import FooterCurve from "./FooterCurve";

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

/**
 * Four columns: identity rail, then the three link stacks from site.js.
 * Below that the SSLCommerz payment strip, then an oversized wordmark set to
 * the container width — the mark is furniture at that size, so it is
 * aria-hidden and the accessible name lives in the copyright line.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-(--line) bg-(--canvas)">
      <FooterCurve />

      {/* data-speed is a ScrollSmoother effect: the content drifts very slightly
          against the arc above it. No-ops when the smoother is off. */}
      <div data-speed="0.95" className="shell pt-20 md:pt-28">
        <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-12">
          {/* ── Identity rail ─────────────────────────────────── */}
          <div className="lg:col-span-4 lg:pr-10">
            <Logo height={30} />

            <p className="mt-7 max-w-xs text-[0.9375rem] leading-relaxed text-(--text-mute)">
              {site.description}
            </p>

            <address className="mt-8 not-italic">
              <span className="label-mono block text-(--text-mute)">Studio</span>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                {site.address.line1}
                <br />
                {site.address.line2}
                <br />
                {site.address.country}
              </p>
            </address>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {SOCIALS.filter((s) => site.social[s.key]).map((s) => (
                <li key={s.key}>
                  <a
                    href={site.social[s.key]}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="label-mono text-(--text-mute) transition-colors hover:text-signal"
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
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => {
                  const external = /^(https?:|mailto:|tel:)/.test(link.href);
                  return (
                    <li key={link.href}>
                      {external ? (
                        <a
                          href={link.href}
                          target={link.href.startsWith("http") ? "_blank" : undefined}
                          rel="noreferrer noopener"
                          className="text-[0.9375rem] text-(--text-dim) transition-colors hover:text-signal"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-[0.9375rem] text-(--text-dim) transition-colors hover:text-signal"
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
        <section aria-label="Accepted payment methods" className="mt-16 border-t border-(--line) pt-8">
          <div className="overflow-x-auto">
            {/* The artwork is authored on white; it sits on its own plate in both
                themes rather than being inverted, because bank marks must not be
                recoloured. */}
            <div className="min-w-[720px] bg-white px-4 py-3">
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

      {/* ── Oversized wordmark ──────────────────────────────── */}
      <div aria-hidden="true" className="shell mt-16 select-none">
        {/* Set as SVG rather than a clipped <p>. textLength pins the mark to
            exactly the container width at every breakpoint, so it lines up with
            the grid above instead of bleeding past it — and it stays pinned in
            the moment before General Sans arrives from the CDN, when the
            fallback stack is wider and a font-size-driven mark would overflow.
            Reads the legal name so this and the copyright line cannot drift. */}
        <svg
          viewBox="0 0 1000 84"
          preserveAspectRatio="xMidYMid meet"
          className="block h-auto w-full overflow-visible fill-(--text) opacity-[0.06]"
        >
          <text
            x="0"
            y="78"
            textLength="1000"
            lengthAdjust="spacingAndGlyphs"
            fontSize="100"
            fontWeight="600"
          >
            {site.legalName.toUpperCase()}
          </text>
        </svg>
      </div>

      {/* ── Legal row ───────────────────────────────────────── */}
      <div className="border-t border-(--line)">
        <div className="shell flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <p className="label-mono text-(--text-mute)">
            © {year} {site.legalName} · Reg. Bangladesh
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {site.legalLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="label-mono text-(--text-mute) transition-colors hover:text-signal"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
