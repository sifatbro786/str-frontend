import Image from "next/image";
import Marquee from "@/components/motion/Marquee";
import { partners } from "@/lib/site";

/**
 * Client marks, early — social proof belongs above the services pitch.
 *
 * Logos are normalised to a single optical height and desaturated so eight
 * different brand palettes do not fight each other. `dark:invert` is applied to
 * the *container*, not the file, so a client who supplies a knockout PNG later
 * can opt out with one prop.
 *
 * Phase 5: the static 8-column grid became a rail. Eight logos never filled the
 * row comfortably below `lg` anyway — they wrapped into a ragged 2×4. A rail
 * reads at every width and gives the band a pulse without asking for attention.
 * The caption stays put; only the logos move.
 *
 * `interactive` is forwarded rather than assumed: /about renders the same rail
 * as static, clipped markup with no GSAP chunk, which is exactly what a
 * reduced-motion visitor sees on the homepage.
 */
export default function PartnersBand({ interactive = false }) {
  return (
    <section aria-label="Clients and partners" className="border-b border-(--line)">
      <div className="py-12 md:py-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-14">
          <p className="label-mono shell shrink-0 text-(--text-mute) lg:max-w-[22ch] lg:pr-0">
            Trusted by teams in construction, retail, media &amp; export
          </p>

          <Marquee speed={45} className="grow" interactive={interactive}>
            <ul className="flex shrink-0 items-center">
              {partners.map((p) => (
                <li key={p.name} className="flex shrink-0 items-center justify-center px-8 md:px-10">
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
          </Marquee>
        </div>
      </div>
    </section>
  );
}
