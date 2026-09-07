"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
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
 * ── WHY gsap.ticker AND NOT setInterval ──────────────────────────────────
 * The seconds roll is a GSAP tween. Driving the value from setInterval means
 * two independent clocks — the interval's and GSAP's — and the roll starts one
 * to sixteen milliseconds after the value changes, at random, forever. The
 * ticker is already running for the rest of the page's motion, so this costs
 * one integer comparison per frame and the roll begins on the same frame the
 * digit changes.
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
    const [open, setOpen] = useState(null); // null until mounted — see above
    const hm = useRef(null);
    const sec = useRef(null);
    const ring = useRef(null);

    useGSAP(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        /* ── Clock ────────────────────────────────────────────────────────── */
        let lastSecond = -1;
        const tick = () => {
            const now = Date.now();
            const s = Math.floor(now / 1000);
            if (s === lastSecond) return;
            lastSecond = s;

            const d = new Date(now);
            const [h, m, ss] = TIME.format(d).split(":");
            hm.current.textContent = `${h}:${m}`;
            sec.current.textContent = ss;

            // Only the seconds roll. Rolling hours and minutes on every tick would
            // animate two digits that did not change, which reads as a glitch.
            if (!reduced) {
                gsap.fromTo(
                    sec.current,
                    { yPercent: 55, opacity: 0 },
                    {
                        yPercent: 0,
                        opacity: 1,
                        duration: 0.34,
                        ease: "power3.out",
                        overwrite: true,
                    },
                );
            }

            // Cheap: one Intl call a second, and setOpen is a no-op unless the
            // boolean actually flips (React bails out on identical state).
            setOpen(isOpen(d));
        };

        tick();
        gsap.ticker.add(tick);

        /* ── Pulse ────────────────────────────────────────────────────────── */
        let pulse;
        if (!reduced) {
            pulse = gsap.fromTo(
                ring.current,
                { scale: 1, opacity: 0.5 },
                {
                    scale: 3.4,
                    opacity: 0,
                    duration: 2.2,
                    ease: "power2.out",
                    repeat: -1,
                    repeatDelay: 0.35,
                },
            );
        }

        return () => {
            gsap.ticker.remove(tick);
            pulse?.kill();
        };
    }, []);

    // `open === null` is the pre-hydration state: neutral colour, no claim.
    const tone =
        open === null ? "var(--text-mute)" : open ? "var(--color-leaf)" : "var(--color-signal)";

    const message =
        open === null
            ? "Dhaka studio"
            : open
              ? "Open for projects · in studio now"
              : site.contact.responseTime;

    return (
        <div className="mt-8" style={{ "--pulse": tone }}>
            <div className="flex items-center gap-2.5">
                <span className="relative flex size-2 shrink-0 items-center justify-center">
                    <span
                        ref={ring}
                        aria-hidden="true"
                        className="absolute size-2 rounded-full bg-(--pulse)"
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
                    <span ref={hm}>--:--</span>
                    <span className="text-(--text-mute)">:</span>
                    {/* The roll needs a clipping box, and it must be inline-block or the
              transform is discarded on an inline element. */}
                    <span className="inline-block overflow-hidden align-bottom">
                        <span ref={sec} className="inline-block text-(--text-mute)">
                            --
                        </span>
                    </span>
                </span>
                <span className="label-mono text-(--text-mute)">GMT+6</span>
            </p>
        </div>
    );
}
