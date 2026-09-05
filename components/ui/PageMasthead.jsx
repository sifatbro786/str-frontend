import Link from "next/link";
import SectionIndex from "./SectionIndex";
import { cn } from "@/lib/utils";

/**
 * The top of every inner route. Asymmetric by construction: the headline sits
 * in a 7-column well, the lede and meta in a 4-column rail offset to the right,
 * with a hairline rule between them. No centred hero, ever.
 *
 * @param {string}  index      "02" — the route's position in the IA
 * @param {string}  eyebrow    "SERVICES"
 * @param {string}  title      Display headline
 * @param {string}  lede       One-paragraph statement, right rail
 * @param {Array}   breadcrumb [{ label, href }] — last item renders inert
 * @param {Array}   meta       [{ label, value }] — rendered as a mono spec row
 */
export default function PageMasthead({
  index,
  eyebrow,
  title,
  lede,
  breadcrumb = [],
  meta = [],
  className,
  children,
}) {
  return (
    <header className={cn("relative border-b border-(--line)", className)}>
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,#000,transparent_85%)]"
      />

      <div className="shell relative pb-14 pt-28 md:pb-20 md:pt-36">
        {breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="label-mono mb-10 flex flex-wrap items-center gap-2 text-(--text-mute)">
            {breadcrumb.map((crumb, i) => {
              const last = i === breadcrumb.length - 1;
              return (
                <span key={crumb.href ?? crumb.label} className="flex items-center gap-2">
                  {last || !crumb.href ? (
                    <span className="text-(--text-dim)">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="transition-colors hover:text-signal">
                      {crumb.label}
                    </Link>
                  )}
                  {!last && (
                    <span aria-hidden="true" className="text-(--line)">
                      /
                    </span>
                  )}
                </span>
              );
            })}
          </nav>
        )}

        <SectionIndex index={index} label={eyebrow} />

        <div className="mt-7 grid gap-x-10 gap-y-8 lg:grid-cols-12">
          <h1 className="text-display lg:col-span-7">{title}</h1>

          {(lede || children) && (
            <div className="lg:col-span-4 lg:col-start-9 lg:self-end lg:border-l lg:border-(--line) lg:pl-8">
              {lede && (
                <p className="max-w-prose text-[1.0625rem] leading-relaxed text-(--text-dim)">{lede}</p>
              )}
              {children}
            </div>
          )}
        </div>

        {meta.length > 0 && (
          <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-(--line) pt-6 md:grid-cols-4">
            {meta.map((m) => (
              <div key={m.label}>
                <dt className="label-mono text-(--text-mute)">{m.label}</dt>
                <dd className="mt-2 text-[0.9375rem] text-(--text)">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </header>
  );
}
