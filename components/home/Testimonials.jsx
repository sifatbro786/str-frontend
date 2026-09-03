"use client";

import { useState } from "react";

const QUOTES = [
  {
    quote:
      "STR rebuilt our booking core in eight weeks. It has handled every peak since without a single incident.",
    name: "Farhan Ahmed",
    role: "CTO, Aurora Travels",
  },
  {
    quote:
      "The team treated our data model like their own product. The dashboards they shipped are still our source of truth.",
    name: "Nadia Rahman",
    role: "Head of Ops, Helix Logistics",
  },
  {
    quote:
      "Clear communication, sharp engineering, zero drama. Rare combination — we've kept them on retainer.",
    name: "Imran Chowdhury",
    role: "Founder, FinTrack",
  },
];

export default function Testimonials() {
  const [i, setI] = useState(0);
  const total = QUOTES.length;
  const go = (dir) => setI((prev) => (prev + dir + total) % total);
  const active = QUOTES[i];

  return (
    <section className="border-b border-(--border)">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-(--text-muted)">
          <span className="h-px w-8 bg-accent" />
          05 // Clients
        </div>

        <figure className="mt-10 border-t border-(--border) pt-10">
          {/* aria-live so arrow presses are announced, not silently swapped */}
          <blockquote
            aria-live="polite"
            className="max-w-4xl text-balance text-2xl font-semibold leading-snug tracking-tight text-(--text) sm:text-4xl"
          >
            <span className="text-accent">&ldquo;</span>
            {active.quote}
            <span className="text-accent">&rdquo;</span>
          </blockquote>

          <figcaption className="mt-8 flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="font-semibold text-(--text)">{active.name}</div>
              <div className="text-sm text-(--text-muted)">{active.role}</div>
            </div>

            <div className="flex items-center gap-4">
              <span className="nums font-mono text-xs tracking-widest text-(--text-muted)">
                {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
              <div className="flex">
                <button
                  type="button"
                  aria-label="Previous testimonial"
                  onClick={() => go(-1)}
                  className="grid h-10 w-10 place-items-center border border-(--border) text-(--text) transition-colors hover:border-primary hover:text-primary"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M19 12H5M11 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Next testimonial"
                  onClick={() => go(1)}
                  className="-ml-px grid h-10 w-10 place-items-center border border-(--border) text-(--text) transition-colors hover:border-primary hover:text-primary"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
