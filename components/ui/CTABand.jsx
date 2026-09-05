import Link from "next/link";
import Button from "./Button";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Full-bleed inverted band that closes every route. Inverted rather than
 * gradient-glowed: the contrast flip is what makes it read as a deliberate
 * section terminator instead of another card.
 */
export default function CTABand({
  title = "Have something that needs building properly?",
  body = "Tell us the constraint you are actually stuck on. If it is not something we should take, we will say so on the first call.",
  primary = { label: "Start a project", href: "/contact" },
  secondary = { label: "See selected work", href: "/projects" },
  className,
}) {
  return (
    <section className={cn("relative overflow-hidden bg-(--text) text-(--canvas)", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 opacity-[0.07] md:block"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 9px)",
        }}
      />

      <div className="shell relative grid gap-10 py-20 md:py-28 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <span className="label-mono text-signal">Next step</span>
          <h2 className="text-heading mt-5 max-w-[16ch]">{title}</h2>
        </div>

        <div className="lg:col-span-5">
          <p className="max-w-md text-[1.0625rem] leading-relaxed opacity-70">{body}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href={primary.href} variant="solid" size="lg" withArrow>
              {primary.label}
            </Button>
            {secondary && (
              /* Not a <Button variant="outline">: that variant's border and text
                 tokens are canvas-relative, and this band is inverted. */
              <Link
                href={secondary.href}
                className="inline-flex items-center gap-2 border border-(--canvas)/25 px-8 py-4 text-[0.9375rem] font-medium transition-colors hover:border-(--canvas)"
              >
                {secondary.label}
              </Link>
            )}
          </div>

          <p className="label-mono mt-8 opacity-50">
            or email {site.contact.email} · {site.contact.responseTime}
          </p>
        </div>
      </div>
    </section>
  );
}
