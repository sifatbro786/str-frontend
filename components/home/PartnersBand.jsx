import Image from "next/image";
import { partners } from "@/lib/site";

/**
 * Client marks, early — social proof belongs above the services pitch.
 *
 * Logos are normalised to a single optical height and desaturated so eight
 * different brand palettes do not fight each other. `dark:invert` is applied to
 * the *container*, not the file, so a client who supplies a knockout PNG later
 * can opt out with one prop.
 */
export default function PartnersBand() {
  return (
    <section aria-label="Clients and partners" className="border-b border-(--line)">
      <div className="shell py-12 md:py-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-14">
          <p className="label-mono shrink-0 text-(--text-mute) lg:max-w-[13ch]">
            Trusted by teams in construction, retail, media &amp; export
          </p>

          <ul className="grid grow grid-cols-2 items-center gap-x-8 gap-y-8 sm:grid-cols-4 lg:grid-cols-8">
            {partners.map((p) => (
              <li key={p.name} className="flex items-center justify-center">
                <Image
                  src={p.logo}
                  alt={p.name}
                  width={140}
                  height={44}
                  sizes="140px"
                  className="h-7 w-auto max-w-[110px] object-contain opacity-55 grayscale transition-opacity duration-300 hover:opacity-90 dark:brightness-0 dark:invert"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
