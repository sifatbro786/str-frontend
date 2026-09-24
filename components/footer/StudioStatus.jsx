"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site";

/**
 * Live Dhaka clock and studio availability.
 *
 * ── HYDRATION ────────────────────────────────────────────────────────────
 * The server renders a fixed-width placeholder. It has to: the server's clock
 * is not the visitor's, so any rendered time is a guaranteed hydration
 * mismatch. Same pattern as ThemeToggle. The placeholder is the same glyph
 * count as the real value, so nothing reflows when it lands.
 *
 * ── setInterval, NOT gsap.ticker ─────────────────────────────────────────
 * This used to ride GSAP's ticker so the seconds roll began on the exact frame
 * the digit changed, rather than up to 16ms late. The footer runs no GSAP now,
 * so the clock owns its own interval and the roll is a CSS keyframe.
 *
 * The interval is 250ms and not 1000ms on purpose: a one-second interval drifts
 * against the wall clock and lands the update at an arbitrary offset inside the
 * second, so a digit can sit visibly late. Polling four times a second and
 * writing only when the second actually changes keeps the update within 250ms
 * of the boundary for the cost of three integer comparisons a second.
 *
 * ── WHY THE TIME IS STATE AND NOT A REF ──────────────────────────────────
 * The old version wrote textContent directly to avoid a render a second. The
 * roll now replays by remounting the seconds span (React `key`), which only
 * works if React owns that node — so the value is state. One render a second
 * on a static three-node subtree is not a cost worth engineering around, and
 * `open` was already state doing exactly this.
 *
 * ── AVAILABILITY IS COMPUTED, NOT ASSERTED ───────────────────────────────
 * Derived from site.contact.hours (Sat–Thu, 10:00–19:00, GMT+6) against the
 * actual time in Dhaka. A hardcoded "Open for projects" is a lie at 3am, and
 * a status dot that is always green is furniture rather than information.
 */

const TIME = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
});

const DAYPART = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
});

/** Sat–Thu 10:00–19:00 in Asia/Dhaka. Friday is the weekend in Bangladesh. */
function isOpen(now) {
    const parts = DAYPART.formatToParts(now);
    const weekday = parts.find((p) => p.type === "weekday")?.value;
    const hour = Number(parts.find((p) => p.type === "hour")?.value);
    return weekday !== "Fri" && hour >= 10 && hour < 19;
}

export default function StudioStatus() {
    /* null until mounted — see the hydration note above. One object rather than
       three useStates so a tick is one render, not three. */
    const [clock, setClock] = useState(null);

    useEffect(() => {
        let lastSecond = -1;

        const tick = () => {
            const ms = Date.now();
            const s = Math.floor(ms / 1000);
            if (s === lastSecond) return;
            lastSecond = s;

            const d = new Date(ms);
            const [h, m, ss] = TIME.format(d).split(":");
            setClock({ hm: `${h}:${m}`, ss, open: isOpen(d) });
        };

        tick();
        const id = setInterval(tick, 250);
        return () => clearInterval(id);
    }, []);

    // No clock yet is the pre-hydration state: neutral colour, no claim.
    const tone = !clock
        ? "var(--text-mute)"
        : clock.open
          ? "var(--color-leaf)"
          : "var(--color-signal)";

    const message = !clock
        ? "Dhaka studio"
        : clock.open
          ? "Open for projects · in studio now"
          : site.contact.responseTime;

    return (
        <div className="mt-8" style={{ "--pulse": tone }}>
            <div className="flex items-center gap-2.5">
                <span className="relative flex size-2 shrink-0 items-center justify-center">
                    <span
                        aria-hidden="true"
                        className="str-status-pulse absolute size-2 rounded-full bg-(--pulse)"
                    />
                    <span className="relative size-2 rounded-full bg-(--pulse)" />
                </span>

                {/* aria-live so a screen reader hears the status flip if the visitor is
                    still on the page when the studio opens or closes. */}
                <p aria-live="polite" className="label-mono text-(--text-dim)">
                    {message}
                </p>
            </div>

            <p className="mt-3 flex items-baseline gap-2 font-mono text-(--text-mute)">
                <span className="label-mono">Dhaka</span>
                {/* nums = tabular figures. Without it the clock jitters horizontally
                    every time a 1 rolls past. */}
                <span className="nums text-[1.375rem] leading-none tracking-tight text-(--text)">
                    <span>{clock?.hm ?? "--:--"}</span>
                    <span className="text-(--text-mute)">:</span>
                    {/* The roll needs a clipping box, and the moving node must be
                        inline-block or the transform is discarded on an inline element.

                        ⚑ `key` is what replays the animation. A CSS animation runs when
                        its element is new, so changing the key remounts this span and the
                        roll fires — the same trigger the old gsap.fromTo gave it. Only
                        the seconds roll: rolling hours and minutes on every tick would
                        animate two digits that did not change, which reads as a glitch. */}
                    <span className="inline-block overflow-hidden align-bottom">
                        <span
                            key={clock?.ss ?? "placeholder"}
                            className="str-digit-roll inline-block text-(--text-mute)"
                        >
                            {clock?.ss ?? "--"}
                        </span>
                    </span>
                </span>
                <span className="label-mono text-(--text-mute)">GMT+6</span>
            </p>
        </div>
    );
}
