import Marquee from "@/components/motion/Marquee";
import { techMarquee } from "@/lib/data";

/**
 * Two counter-scrolling rails.
 *
 * Phase 5 moved these from the CSS keyframe loop to the shared GSAP <Marquee>,
 * so both bands on the page share one implementation, one hover behaviour and
 * one reduced-motion branch. The seam is handled by a wrap modifier rather than
 * a repeating tween — see components/motion/Marquee.jsx.
 */
function Row({ items }) {
  return (
    <ul className="flex shrink-0 items-center">
      {items.map((t) => (
        <li key={t.name} className="flex shrink-0 items-center">
          <span className="px-6 text-[1.05rem] tracking-[-0.015em] text-(--text-dim) md:px-8 md:text-[1.25rem]">
            {t.name}
          </span>
          <span aria-hidden="true" className="text-(--line)">
            /
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function TechMarquee() {
  const rowOne = techMarquee.filter((t) => t.group === 1);
  const rowTwo = techMarquee.filter((t) => t.group === 2);

  return (
    <section aria-label="Technology we build with" className="border-b border-(--line)">
      <div className="py-14 md:py-16">
        <p className="label-mono shell mb-8 text-(--text-mute)">
          The stack we actually maintain in production
        </p>
        <div className="space-y-5">
          <Marquee speed={38} interactive>
            <Row items={rowOne} />
          </Marquee>
          <Marquee speed={52} reverse interactive>
            <Row items={rowTwo} />
          </Marquee>
        </div>
      </div>
    </section>
  );
}
