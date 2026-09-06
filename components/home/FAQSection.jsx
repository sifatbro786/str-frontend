"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, Flip } from "@/lib/gsap";
import SectionIndex from "@/components/ui/SectionIndex";
import { cn } from "@/lib/utils";

/**
 * FAQ with category tabs and an accordion.
 *
 * Two interactions, both animated for a reason rather than for effect:
 *
 *  · Filtering uses Flip. Without it, changing tab makes rows appear and
 *    disappear in place and the reader loses their position entirely. Flip
 *    tweens surviving rows to their new coordinates, so the list visibly
 *    rearranges instead of blinking.
 *  · The accordion animates height to "auto" — GSAP resolves that by measuring,
 *    so it is safe, and the panel keeps overflow:hidden throughout.
 *
 * Accessibility is structural here, not decorative: real <button>s, honest
 * aria-expanded/aria-controls wiring, and a decorative SVG that never carries
 * meaning on its own.
 */
export default function FAQSection({ faqs }) {
  const root = useRef(null);
  const flipState = useRef(null);

  const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category).filter(Boolean)))];
  const [active, setActive] = useState("All");
  const [open, setOpen] = useState(null);

  const visible = active === "All" ? faqs : faqs.filter((f) => f.category === active);

  /** Capture positions BEFORE React commits the filtered list. */
  function selectCategory(next) {
    if (next === active) return;
    flipState.current = Flip.getState(root.current.querySelectorAll("[data-faq-item]"));
    setOpen(null);
    setActive(next);
  }

  // Runs after commit, which is exactly when Flip.from needs to measure.
  useGSAP(
    () => {
      if (!flipState.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        flipState.current = null;
        return;
      }

      Flip.from(flipState.current, {
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.03,
        absolute: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, y: -12, duration: 0.3 }),
      });
      flipState.current = null;
    },
    { scope: root, dependencies: [active] }
  );

  function toggle(index, panelId) {
    const panel = root.current.querySelector(`#${panelId}`);
    const arrow = root.current.querySelector(`[data-faq-arrow="${panelId}"]`);
    const opening = open !== index;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setOpen(opening ? index : null);

    if (reduced) {
      gsap.set(panel, { height: opening ? "auto" : 0 });
      gsap.set(arrow, { rotate: opening ? 45 : 0 });
      return;
    }

    // Close whatever else is open, so only one panel is ever expanded.
    if (opening) {
      root.current.querySelectorAll("[data-faq-panel]").forEach((p) => {
        if (p !== panel) gsap.to(p, { height: 0, duration: 0.35, ease: "power3.inOut" });
      });
      root.current.querySelectorAll("[data-faq-arrow]").forEach((a) => {
        if (a !== arrow) gsap.to(a, { rotate: 0, duration: 0.35 });
      });
    }

    gsap.to(panel, { height: opening ? "auto" : 0, duration: 0.45, ease: "power3.inOut" });
    gsap.to(arrow, { rotate: opening ? 45 : 0, duration: 0.45, ease: "power3.inOut" });
  }

  return (
    <section ref={root} className="border-b border-(--line)">
      <div className="shell py-20 md:py-28">
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <SectionIndex index="05" label="Common questions" />
            <h2 className="text-heading mt-6 max-w-[16ch]">
              The questions{" "}
              <span className="text-(--text-mute)">that come up before a contract does.</span>
            </h2>
          </div>

          {/* Category tabs — real buttons, not divs. */}
          <div className="flex flex-wrap gap-2 lg:col-span-4 lg:col-start-9 lg:justify-end">
            {categories.map((c) => {
              const on = c === active;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => selectCategory(c)}
                  aria-pressed={on}
                  className={cn(
                    "label-mono border px-3.5 py-2 transition-colors",
                    on
                      ? "border-signal text-signal"
                      : "border-(--line) text-(--text-mute) hover:border-(--text) hover:text-(--text)"
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <ul className="mt-14 border-t border-(--line)">
          {visible.map((f, i) => {
            const panelId = `faq-panel-${f.q.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40)}`;
            const isOpen = open === i;
            return (
              <li key={f.q} data-faq-item className="border-b border-(--line)">
                <h3>
                  <button
                    type="button"
                    onClick={() => toggle(i, panelId)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="group flex w-full items-start justify-between gap-8 py-7 text-left md:py-8"
                  >
                    <span className="text-[1.0625rem] font-medium tracking-[-0.02em] text-(--text) transition-colors group-hover:text-signal md:text-[1.25rem]">
                      {f.q}
                    </span>

                    <span className="flex shrink-0 items-center gap-5">
                      <span className="label-mono hidden text-(--text-mute) sm:block">
                        {f.category}
                      </span>
                      {/* Two-line plus that rotates to an ×. Decorative only —
                          aria-expanded on the button carries the state. */}
                      <svg
                        data-faq-arrow={panelId}
                        aria-hidden="true"
                        viewBox="0 0 16 16"
                        className="mt-1 size-4 shrink-0 text-(--text-mute) group-hover:text-signal"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.25"
                      >
                        <path d="M8 1 L8 15" />
                        <path d="M1 8 L15 8" />
                      </svg>
                    </span>
                  </button>
                </h3>

                <div
                  id={panelId}
                  data-faq-panel
                  role="region"
                  className="h-0 overflow-hidden"
                >
                  <p className="max-w-prose pb-8 text-[0.9375rem] leading-relaxed text-(--text-mute)">
                    {f.a}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
