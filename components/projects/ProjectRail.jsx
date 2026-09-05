"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Tag from "@/components/ui/Tag";
/* From taxonomy, not data: this is a client component and lib/data.js carries
   every case-study body — importing it here would ship all of that. */
import { SERVICE_LABELS } from "@/lib/taxonomy";
import { cn, formatDate, pad } from "@/lib/utils";

/**
 * Filterable portfolio rail.
 *
 * The full project list is passed in from the server component — the client
 * boundary exists only for the filter state, so the payload is data we were
 * going to ship anyway rather than a second fetch.
 *
 * Layout repeats a 4-row asymmetric pattern (7/5, 5/7) rather than a uniform
 * grid; `LAYOUT[i % LAYOUT.length]` keeps it stable as the catalogue grows.
 */
const LAYOUT = [
  "lg:col-span-7",
  "lg:col-span-5 lg:mt-24",
  "lg:col-span-5",
  "lg:col-span-7 lg:mt-24",
];

export default function ProjectRail({ projects, services }) {
  const [active, setActive] = useState("all");

  const filtered = useMemo(
    () => (active === "all" ? projects : projects.filter((p) => p.serviceTypes.includes(active))),
    [active, projects]
  );

  const counts = useMemo(() => {
    const map = { all: projects.length };
    for (const s of services) {
      map[s] = projects.filter((p) => p.serviceTypes.includes(s)).length;
    }
    return map;
  }, [projects, services]);

  return (
    <section>
      {/* ── Filter rail ─────────────────────────────────────── */}
      <div className="sticky top-[68px] z-30 border-b border-(--line) bg-(--overlay) backdrop-blur-xl md:top-[76px]">
        <div className="shell flex items-center gap-6 overflow-x-auto py-4">
          <span className="label-mono shrink-0 text-(--text-mute)">Filter</span>

          <div className="flex items-center gap-1">
            {[["all", "Everything"], ...services.map((s) => [s, SERVICE_LABELS[s]])]
              .filter(([key]) => counts[key] > 0)
              .map(([key, label]) => {
                const on = active === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActive(key)}
                    aria-pressed={on}
                    className={cn(
                      "label-mono relative shrink-0 whitespace-nowrap px-3.5 py-2 transition-colors",
                      on ? "text-(--text)" : "text-(--text-mute) hover:text-(--text)"
                    )}
                  >
                    {label}
                    <span className="ml-2 opacity-45">{counts[key]}</span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-2 bottom-0 h-px origin-left bg-signal transition-transform duration-300",
                        on ? "scale-x-100" : "scale-x-0"
                      )}
                    />
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────── */}
      <div className="shell py-16 md:py-24">
        {filtered.length === 0 ? (
          <div className="bg-hatch border border-(--line) px-8 py-24 text-center">
            <p className="text-(--text-mute)">
              Nothing published under that discipline yet — ask us for the private
              deck instead.
            </p>
          </div>
        ) : (
          <div className="grid gap-x-10 gap-y-16 lg:grid-cols-12">
            {filtered.map((p, i) => (
              <article key={p._id} className={cn("group", LAYOUT[i % LAYOUT.length])}>
                <Link href={`/projects/${p.slug}`} className="block">
                  <div className="relative overflow-hidden border border-(--line)">
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={p.coverImage}
                        alt={p.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 55vw"
                        className="object-cover object-top transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]"
                      />
                    </div>
                    <span className="label-mono absolute left-0 top-0 bg-(--canvas) px-3 py-2 text-(--text-mute)">
                      {pad(i + 1)}
                    </span>
                    {p.featured && (
                      <span className="label-mono absolute right-0 top-0 bg-signal px-3 py-2 text-white">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                    <h2 className="text-subheading text-(--text) transition-colors group-hover:text-signal">
                      {p.title}
                    </h2>
                    <span className="label-mono text-(--text-mute)">
                      {formatDate(p.projectDate)}
                    </span>
                  </div>

                  <p className="mt-1 text-[0.9375rem] text-(--text-mute)">{p.subtitle}</p>

                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    {p.serviceTypes.map((s, si) => (
                      <Tag key={s} variant={si === 0 ? "outline" : "ghost"}>
                        {SERVICE_LABELS[s]}
                      </Tag>
                    ))}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
