const STACK = [
  "Next.js", "React", "Node.js", "Express", "MongoDB", "PostgreSQL",
  "TypeScript", "Tailwind", "AWS", "Docker", "Redis", "GraphQL",
  "Kubernetes", "Figma", "Vercel", "Prisma",
];

function Track({ ariaHidden = false }) {
  return (
    <ul aria-hidden={ariaHidden} className="flex shrink-0 items-center gap-px bg-(--border)">
      {STACK.map((tech, i) => (
        <li
          key={`${tech}-${i}`}
          className="flex items-center bg-(--surface) px-8 py-5 font-mono text-sm uppercase tracking-wider text-(--text-muted)"
        >
          {tech}
        </li>
      ))}
    </ul>
  );
}

export default function TechMarquee() {
  return (
    <section className="border-b border-(--border)">
      <div className="mx-auto max-w-6xl px-6 pt-16">
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-(--text-muted)">
          <span className="h-px w-8 bg-accent" />
          03 // Stack &amp; Capabilities
        </div>
      </div>

      {/* Full-bleed marquee band */}
      <div className="mask-x group mt-8 flex overflow-hidden border-y border-(--border)">
        {/* `w-max shrink-0` is load-bearing: translateX(-50%) is measured against
            this element's own width, so it must size to its content (both
            tracks) rather than being shrunk to the viewport. The `gap-px` between
            tracks is balanced by `pr-px`, which keeps -50% landing exactly on the
            clone's first item. */}
        <div className="flex w-max shrink-0 animate-marquee gap-px pr-px group-hover:[animation-play-state:paused]">
          <Track />
          <Track ariaHidden />
        </div>
      </div>
    </section>
  );
}
