import { techMarquee } from "@/lib/data";

/**
 * Two counter-scrolling rails. Pure CSS — the track is rendered twice and
 * translated -50%, so the loop is seamless without JS and without GSAP.
 *
 * The clone carries aria-hidden, otherwise a screen reader reads the whole
 * stack twice. `prefers-reduced-motion` halts both rails (see globals.css).
 */
function Rail({ items, reverse = false, slow = false }) {
  const track = (
    <ul className="flex shrink-0 items-center">
      {items.map((t) => (
        <li key={t.name} className="flex items-center">
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

  return (
    <div className="mask-x flex overflow-hidden">
      <div
        className={`flex min-w-max ${slow ? "animate-marquee-slow" : "animate-marquee"}`}
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {track}
        <div aria-hidden="true" className="flex">
          {track}
        </div>
      </div>
    </div>
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
          <Rail items={rowOne} />
          <Rail items={rowTwo} reverse slow />
        </div>
      </div>
    </section>
  );
}
