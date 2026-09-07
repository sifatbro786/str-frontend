"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { site, partners } from "@/lib/site";
import { SERVICE_TYPES } from "@/lib/taxonomy";
import { cn, pad } from "@/lib/utils";

/**
 * The hero's right column: a studio console, not an illustration.
 *
 * ── WHY AN OBJECT AND NOT ARTWORK ────────────────────────────────────────
 * The strongest agency heroes put something on the right that makes a claim
 * the visitor can check. Artwork says "we have taste"; a panel that says the
 * studio is open right now, in Dhaka, at 14:32, says something falsifiable —
 * and a claim you could catch us lying about is the only kind worth making on
 * a homepage. It is also the one element here that changes while you look at
 * it, which is what stops the fold reading as a static poster.
 *
 * ── EVERY VALUE IS SOURCED. NONE ARE INVENTED ────────────────────────────
 * This panel is the most tempting place on the site to write "60+ projects
 * delivered" or "12 countries served", and both would be fiction. Everything
 * below traces to something real:
 *   · the clock          computed, Asia/Dhaka
 *   · open / closed      derived from site.contact.hours, which is real
 *   · disciplines        SERVICE_TYPES.length
 *   · clients            partners.length — eight logo files verified on disk
 *   · established        site.foundedYear
 *   · latest work        the first featured project, with its own date
 * If a number cannot be traced to lib/site.js or to the API, it does not go in
 * this box.
 *
 * ── HYDRATION ────────────────────────────────────────────────────────────
 * The clock renders as `--:--:--` on the server and is filled in on mount.
 * Formatting a live time during render is the textbook hydration mismatch: the
 * server renders one second, the client re-renders another, React discards the
 * markup and warns. The placeholder is deliberately the same character width as
 * the real value so nothing reflows when it lands.
 *
 * ── INTERNAL HAIRLINES ───────────────────────────────────────────────────
 * The rows are separated by a 1px grid gap over a --line background, the same
 * technique the bento used — the gap IS the border, so every rule is exactly
 * one hairline and perfectly continuous. The bento is gone; the technique that
 * made it worth building is not.
 */

/* Bangladesh works Sat–Thu. Friday is the weekend, which is the single most
   commonly mis-hardcoded fact about a Dhaka studio's opening hours. Mirrors
   site.contact.hours — if that string changes, change these two numbers. */
const OPEN_HOUR = 10;
const CLOSE_HOUR = 19;
const CLOSED_DAY = "Fri";

const TIME_FMT = {
  timeZone: "Asia/Dhaka",
  hour12: false,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

export default function HeroPanel({ project }) {
  const root = useRef(null);

  const stats = [
    { k: pad(SERVICE_TYPES.length), v: "Disciplines" },
    { k: pad(partners.length), v: "Clients shipped" },
    { k: String(site.foundedYear), v: "Established" },
  ];

  const year = project?.projectDate
    ? new Date(project.projectDate).getFullYear()
    : null;

  useGSAP(
    () => {
      const clock = root.current?.querySelector("[data-panel-clock]");
      const status = root.current?.querySelector("[data-panel-status]");
      const dot = root.current?.querySelector("[data-panel-dot]");
      if (!clock) return;

      let live = null; // the pulse tween, so its state can be diffed
      let wasOpen = null;

      const read = () => {
        const parts = new Intl.DateTimeFormat("en-GB", TIME_FMT).formatToParts(new Date());
        const get = (t) => parts.find((p) => p.type === t)?.value ?? "";
        const day = get("weekday");
        const h = Number(get("hour"));
        return {
          time: `${get("hour")}:${get("minute")}:${get("second")}`,
          open: day !== CLOSED_DAY && h >= OPEN_HOUR && h < CLOSE_HOUR,
        };
      };

      const paint = () => {
        const { time, open } = read();
        clock.textContent = time;

        if (open === wasOpen) return;
        wasOpen = open;

        if (status) {
          status.textContent = open
            ? `Open · until ${CLOSE_HOUR}:00`
            : "Closed · replies next working day";
        }
        if (dot) {
          dot.style.backgroundColor = open ? "var(--color-signal)" : "var(--text-mute)";
          live?.kill();
          live = open
            ? gsap.to(dot, {
                opacity: 0.25,
                scale: 1.35,
                duration: 1.1,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
              })
            : gsap.set(dot, { opacity: 0.5, scale: 1 });
        }
      };

      paint();

      // setInterval, not gsap.ticker. The ticker runs at 60Hz and this display
      // changes at 1Hz — reformatting a date sixty times a second to write the
      // same string fifty-nine of them is pure waste, and Intl.DateTimeFormat
      // is not cheap. The one-clock rule in this codebase is about *animation*
      // staying on a single frame boundary; a wall clock is not animation.
      const id = setInterval(paint, 1000);
      const onVis = () => !document.hidden && paint();
      document.addEventListener("visibilitychange", onVis);

      return () => {
        clearInterval(id);
        document.removeEventListener("visibilitychange", onVis);
        live?.kill();
      };
    },
    { scope: root, dependencies: [] }
  );

  return (
    <div
      ref={root}
      data-hero-panel
      className={cn(
        "grid gap-px overflow-hidden rounded-2xl border border-(--line) bg-(--line)",
        // The glass. bg-(--overlay) + blur reads as a console floating over the
        // mesh rather than as a card pasted on top of it.
        "shadow-[0_1px_0_0_rgb(255_255_255/0.05)_inset,0_36px_80px_-48px_rgb(0_0_0/0.75)]"
      )}
    >
      {/* ── Header: the live bit ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 bg-(--overlay) px-5 py-4 backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center gap-2.5">
          <span
            data-panel-dot
            aria-hidden="true"
            className="bg-signal size-1.5 shrink-0 rounded-full"
          />
          <span className="label-mono text-(--text)">
            {site.address.city} · GMT+6
          </span>
        </div>
        {/* nums = tabular figures. Without it the colons jitter left and right
            every second as the digit widths change, which is the tell that
            separates a clock from a counter that happens to show a time. */}
        <span
          data-panel-clock
          className="nums text-[0.9375rem] tracking-[0.02em] text-(--text-dim)"
          suppressHydrationWarning
        >
          --:--:--
        </span>
      </div>

      {/* ── Status rows ──────────────────────────────────────────────── */}
      <dl className="grid gap-px bg-(--line)">
        <div className="flex items-baseline justify-between gap-4 bg-(--overlay) px-5 py-3.5 backdrop-blur-xl">
          <dt className="label-mono text-(--text-mute)">Status</dt>
          <dd
            data-panel-status
            className="text-[0.875rem] text-(--text-dim)"
            suppressHydrationWarning
          >
            {site.contact.hours}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 bg-(--overlay) px-5 py-3.5 backdrop-blur-xl">
          <dt className="label-mono text-(--text-mute)">First reply</dt>
          <dd className="text-[0.875rem] text-(--text-dim)">Under one business day</dd>
        </div>
      </dl>

      {/* ── Three counts ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-px bg-(--line)">
        {stats.map((s) => (
          <div key={s.v} className="bg-(--overlay) px-5 py-5 backdrop-blur-xl">
            <p className="nums text-[1.375rem] leading-none tracking-[-0.03em] text-(--text)">
              {s.k}
            </p>
            <p className="label-mono mt-2.5 text-(--text-mute)">{s.v}</p>
          </div>
        ))}
      </div>

      {/* ── Latest work ──────────────────────────────────────────────── */}
      {project && (
        <Link
          href={`/projects/${project.slug}`}
          data-cursor="view"
          data-cursor-image={project.coverImage}
          data-cursor-label={project.clientName}
          className="group relative block bg-(--overlay) backdrop-blur-xl"
        >
          <div className="relative aspect-16/7 overflow-hidden">
            <Image
              src={project.coverImage}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 34vw"
              className="object-cover object-top grayscale transition-[filter,transform] duration-700 ease-out group-hover:scale-[1.04] group-hover:grayscale-0"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-(--canvas)/45 transition-opacity duration-500 group-hover:opacity-0"
            />
          </div>

          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="label-mono shrink-0 text-signal">Latest</span>
              <span className="truncate text-[0.875rem] font-medium text-(--text)">
                {project.clientName || project.title}
              </span>
            </div>
            <span className="label-mono nums shrink-0 text-(--text-mute)">
              {year ?? "—"}
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
