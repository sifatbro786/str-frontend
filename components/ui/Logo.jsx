import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * /public/logo.png is full-colour artwork on transparency: STR blue wordmark,
 * orange brackets, green swoosh. On the near-black canvas the blue wordmark
 * falls to roughly 3.5:1 and reads muddy.
 *
 * Rather than flattening the brand with `dark:invert`, the mark sits on a white
 * plate in dark mode only. It is a deliberate, visible decision — and it keeps
 * the orange and green, which are half the identity.
 *
 * If a knockout variant exists in the legacy folder, drop it at
 * /public/logo-invert.png and replace the plate with a second <Image>.
 */
export default function Logo({ className, priority = false, height = 30 }) {
  return (
    <Link
      href="/"
      aria-label={`${site.legalName} — home`}
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      <span className="inline-flex items-center dark:bg-white dark:px-2.5 dark:py-1.5">
        <Image
          src={site.brand.logo}
          alt={site.legalName}
          width={Math.round(height * 4.1)}
          height={height}
          priority={priority}
          sizes="200px"
          style={{ height, width: "auto" }}
        />
      </span>
    </Link>
  );
}
