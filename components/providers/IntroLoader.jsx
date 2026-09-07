"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollSmoother, SplitText } from "@/lib/gsap";
import { site } from "@/lib/site";

/**
 * Intro loader.
 *
 * ── WHY THE OLD ONE FELT STATIC ──────────────────────────────────────────
 * It was not missing animation, it was missing animation IN THE MIDDLE. The
 * build-in ran for about 1.5 seconds and then `addPause` froze the timeline
 * on a single frame until the hold expired. At a 2 second hold that dead
 * stretch was half a second and easy to miss; at 5 seconds it is three and a
 * half seconds of a still image, which is the whole impression.
 *
 * There is no pause in this version. The timeline never stops:
 *
 *   0.00s  column rules draw down, staggered
 *   0.25s  wordmark characters rise out of their mask
 *   0.40s  the counter starts climbing, PACED TO THE REAL HOLD
 *   1.10s  the discipline line starts scrambling through the service list,
 *          and the rules begin breathing — both loop until the gate opens
 *   gate   counter snaps to 100, content lifts away, curtain wipes up
 *
 * The counter is the important one. It used to run 0→100 in a fixed 1.3s and
 * then sit at 100 for the rest of the wait, which is the specific thing that
 * makes a loader look fake. It now climbs to 92 over the actual hold duration
 * and only finishes when the page is genuinely ready, so the number means
 * something.
 *
 * ── THE HOLD ⚑ ───────────────────────────────────────────────────────────
 * MIN_HOLD is 5000ms, as asked. One line, at the top, so it stays easy to
 * change. It gates on `load` OR this duration, whichever is LATER, and runs
 * once per browser session — so a visitor moving through the site pays it
 * once, not on every route.
 *
 * ── WHY THE MARKUP IS ALWAYS RENDERED ────────────────────────────────────
 * An earlier version decided whether to render from sessionStorage inside a
 * useState initialiser. That returns true on the server and false on the
 * client for a returning visitor, so the server sent the overlay and the
 * client rendered null — a hydration mismatch, after which React replaces the
 * subtree with fresh DOM. The effect had already captured refs pointing at
 * the detached originals, so the counter animated an element that was no
 * longer in the document while the visible one kept its server-rendered
 * "000". Server and client now render identical markup unconditionally and
 * the skip decision lives in the layout effect, which runs before paint.
 *
 * ── WHY IT IS NOT INSIDE ScrollSmoother ──────────────────────────────────
 * #smooth-content carries a transform, which becomes the containing block for
 * any fixed descendant. A fixed overlay in there scrolls away with the page.
 *
 * ── WHY THE SCROLL IS LOCKED TWICE ───────────────────────────────────────
 * overflow:hidden on <body> does nothing under ScrollSmoother, which owns the
 * scroll position itself, so the smoother is paused explicitly too. Touch
 * devices bail out of the smoother entirely and only the overflow lock
 * reaches them.
 */

const MIN_HOLD = 5000; // ms
const ONCE_PER_SESSION = true;
const SESSION_KEY = "str-intro-seen";
const RULES = 5;
const PANELS = 5;

/* What the scramble line cycles through while the page loads. Same list as
   the hero's discipline band, deliberately: the loader should be saying the
   same thing the page is about to say. */
const DISCIPLINES = [
    "Web platforms",
    "Custom software",
    "Mobile applications",
    "Product design",
    "3D visualization",
    "Graphics production",
    "Digital marketing",
];

function alreadySeen() {
    if (!ONCE_PER_SESSION) return false;
    try {
        return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
        // Private mode, or storage blocked. Running the loader is the safe
        // failure: worst case it appears more often than intended.
        return false;
    }
}

export default function IntroLoader() {
    const root = useRef(null);
    const stage = useRef(null);
    const count = useRef(null);
    const bar = useRef(null);
    const word = useRef(null);
    const disc = useRef(null);
    const clock = useRef(null);
    const rules = useRef([]);
    const panels = useRef([]);

    useGSAP(
        () => {
            const el = root.current;
            if (!el) return;

            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            /* Skip path. useGSAP runs in useLayoutEffect, so this lands before
               the browser paints: a returning visitor never sees the overlay,
               with no flash and no hydration mismatch, because the markup being
               skipped is the same markup the server sent. */
            if (reduced || alreadySeen()) {
                gsap.set(el, { display: "none" });
                return;
            }

            document.body.style.overflow = "hidden";
            ScrollSmoother.get()?.paused(true);

            const ruleEls = rules.current.filter(Boolean);
            const panelEls = panels.current.filter(Boolean);

            const split = SplitText.create(word.current, {
                type: "chars",
                charsClass: "intro-char",
            });

            /* ── Counter ──────────────────────────────────────────────────
               A plain object, written straight to textContent. Counting in
               React state would be a hundred renders of a subtree during the
               most performance-sensitive moment of the page's life, competing
               with hydration and the font swap.

               Math.round at the point of display rather than `snap` on the
               tween: one fewer thing between the value and the pixels, and the
               explicit write on completion guarantees it reads exactly 100
               instead of 99 from a final frame that lands a hair short. */
            const counter = { v: 0 };
            const writeCount = () => {
                if (count.current) {
                    count.current.textContent = String(Math.round(counter.v)).padStart(3, "0");
                }
            };
            writeCount();

            /* ── Clock ────────────────────────────────────────────────────
               Dhaka time, ticking. setInterval rather than a gsap.ticker
               callback: this needs to fire once a second, and putting it on
               the ticker means running a Date format and a DOM write on every
               one of sixty frames to change the display on one of them. */
            const pad = (n) => String(n).padStart(2, "0");
            const tickClock = () => {
                if (!clock.current) return;
                const parts = new Intl.DateTimeFormat("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                    timeZone: "Asia/Dhaka",
                }).formatToParts(new Date());
                const get = (t) => parts.find((p) => p.type === t)?.value ?? "00";
                clock.current.textContent = `${pad(get("hour"))}:${pad(get("minute"))}:${pad(get("second"))}`;
            };
            tickClock();
            const clockTimer = setInterval(tickClock, 1000);

            /* ── Phase A · build in ───────────────────────────────────────── */
            const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

            intro
                // Rules draw down from the top edge. transformOrigin top, so
                // they extend rather than grow from the middle.
                .fromTo(
                    ruleEls,
                    { scaleY: 0, transformOrigin: "center top" },
                    { scaleY: 1, duration: 1.1, ease: "power3.inOut", stagger: 0.06 },
                    0,
                )
                .from(
                    split.chars,
                    {
                        yPercent: 115,
                        duration: 0.8,
                        ease: "power4.out",
                        stagger: 0.028,
                    },
                    0.25,
                )
                .from(
                    "[data-intro-meta]",
                    { autoAlpha: 0, y: 14, duration: 0.6, stagger: 0.08 },
                    0.5,
                );

            /* Counter paced to the real wait. It climbs to 92 over the hold and
               is finished off by the exit, so the number is never parked at 100
               waiting for something to happen. power1.out front-loads it, which
               is what a real transfer looks like. */
            intro.to(
                counter,
                {
                    v: 92,
                    duration: (MIN_HOLD / 1000) * 0.94,
                    ease: "power1.out",
                    onUpdate: writeCount,
                },
                0.4,
            );

            intro.fromTo(
                bar.current,
                { scaleX: 0 },
                {
                    scaleX: 0.92,
                    duration: (MIN_HOLD / 1000) * 0.94,
                    ease: "power1.out",
                    transformOrigin: "left center",
                },
                0.4,
            );

            /* ── Phase B · ambient, looping until the gate opens ───────────
               This is the part the old version was missing entirely. Two loops
               run for as long as the wait lasts, so there is never a still
               frame on screen. */
            const ambient = gsap.timeline({ repeat: -1, paused: true });

            DISCIPLINES.forEach((d) => {
                ambient
                    .to(disc.current, {
                        duration: 0.5,
                        // ease:"none" is required, not stylistic. scrambleText
                        // swaps glyphs at a rate derived from tween progress, so
                        // an eased progress makes the shuffle visibly speed up
                        // and slow down and reads as a stutter.
                        ease: "none",
                        scrambleText: { text: d, chars: "upperCase", speed: 1 },
                    })
                    // An empty tween as a dwell. Cheaper and more legible than a
                    // delay on the next one, and it keeps the loop's total
                    // duration readable from the code.
                    .to({}, { duration: 0.4 });
            });

            const breathe = gsap.to(ruleEls, {
                opacity: 0.25,
                duration: 1.4,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                stagger: { each: 0.18, from: "center" },
                paused: true,
            });

            intro.add(() => {
                ambient.play();
                breathe.play();
            }, 1.1);

            /* ── Phase C · exit ───────────────────────────────────────────
               A function, not a paused segment of the master timeline. The
               gate can resolve at any moment, and resuming a timeline that was
               parked mid-sequence is what produced the frozen frame. */
            let exited = false;
            const exit = () => {
                if (exited) return;
                exited = true;

                /* Kill the build-in before starting the exit, not just the two
                   loops. Its counter and bar tweens are still running toward
                   92, and GSAP's default overwrite is off — two live tweens on
                   the same property fight frame by frame and the number
                   flickers between the two curves. Killing the whole timeline
                   is cleaner than setting overwrite on each tween, because
                   every element it touches is already at its resting state by
                   the time the gate opens. */
                intro.kill();
                ambient.kill();
                breathe.kill();
                clearInterval(clockTimer);

                gsap.timeline({
                    onComplete: () => {
                        document.body.style.overflow = "";
                        ScrollSmoother.get()?.paused(false);
                        try {
                            sessionStorage.setItem(SESSION_KEY, "1");
                        } catch {
                            /* storage blocked; the loader will run again */
                        }
                        // display:none, not just autoAlpha. An invisible
                        // full-screen fixed layer stays a compositor layer for
                        // the life of the page.
                        gsap.set(el, { display: "none" });
                    },
                })
                    .to(
                        counter,
                        {
                            v: 100,
                            duration: 0.45,
                            ease: "power2.out",
                            onUpdate: writeCount,
                            onComplete: () => {
                                counter.v = 100;
                                writeCount();
                            },
                        },
                        0,
                    )
                    .to(bar.current, { scaleX: 1, duration: 0.45, ease: "power2.out" }, 0)
                    // A beat on 100 before anything moves. Without it the number
                    // arrives and leaves in the same gesture and nobody reads it.
                    .to(
                        split.chars,
                        {
                            yPercent: -115,
                            duration: 0.6,
                            ease: "power3.in",
                            stagger: 0.018,
                        },
                        0.55,
                    )
                    .to(
                        stage.current,
                        { autoAlpha: 0, yPercent: -6, duration: 0.5, ease: "power2.in" },
                        0.6,
                    )
                    .to(
                        ruleEls,
                        {
                            scaleY: 0,
                            transformOrigin: "center bottom",
                            duration: 0.5,
                            ease: "power3.in",
                            stagger: 0.04,
                        },
                        0.6,
                    )
                    /* Curtain: panels wipe up on a stagger, not one full-screen
                       fade. A fade reveals the page uniformly and reads as a
                       dialog closing; a staggered wipe has direction, and the
                       last panel leaving hands the eye to the top-left of the
                       content. */
                    .to(
                        panelEls,
                        {
                            yPercent: -100,
                            duration: 0.9,
                            ease: "power4.inOut",
                            stagger: 0.06,
                        },
                        0.85,
                    );
            };

            /* ── The gate ─────────────────────────────────────────────────
               Whichever is LATER: the real load event, or MIN_HOLD. */
            const started = performance.now();
            const ready =
                document.readyState === "complete"
                    ? Promise.resolve()
                    : new Promise((res) => window.addEventListener("load", res, { once: true }));

            let holdTimer = 0;
            ready.then(() => {
                const waited = performance.now() - started;
                holdTimer = setTimeout(exit, Math.max(0, MIN_HOLD - waited));
            });

            return () => {
                clearTimeout(holdTimer);
                clearInterval(clockTimer);
                intro.kill();
                ambient.kill();
                breathe.kill();
                // revert() restores the wordmark's original text. It matters
                // here because a killed scramble leaves random glyphs behind,
                // and those are what a copy-paste or a screen reader would pick
                // up on the discipline line.
                split.revert();
                document.body.style.overflow = "";
                ScrollSmoother.get()?.paused(false);
            };
        },
        { scope: root },
    );

    return (
        <div
            ref={root}
            // aria-hidden plus inert: a screen reader should not announce a
            // decorative counter, and nothing behind the curtain should be
            // reachable by Tab while it is up.
            aria-hidden="true"
            inert={true}
            className="pointer-events-auto fixed inset-0 z-200 overflow-hidden"
        >
            {/* Curtain panels sit behind everything, so the content fades out
          against them rather than leaving with them. */}
            <div className="absolute inset-0 flex">
                {Array.from({ length: PANELS }, (_, i) => (
                    <span
                        key={i}
                        ref={(node) => {
                            panels.current[i] = node;
                        }}
                        className="h-full flex-1 bg-(--canvas) will-change-transform"
                    />
                ))}
            </div>

            {/* Column rules. Structural, and the only decoration in here: they
          are the same hairline language the page below is built from, so the
          loader reads as the site arriving rather than as a splash screen. */}
            <div className="absolute inset-0" aria-hidden="true">
                {Array.from({ length: RULES }, (_, i) => (
                    <span
                        key={i}
                        ref={(node) => {
                            rules.current[i] = node;
                        }}
                        className="absolute top-0 block h-full w-px bg-(--line) will-change-transform"
                        style={{ left: `${((i + 1) / (RULES + 1)) * 100}%` }}
                    />
                ))}
            </div>

            <div
                ref={stage}
                className="shell relative flex h-full flex-col justify-between py-10 md:py-14"
            >
                <div className="flex items-start justify-between gap-6">
                    <p data-intro-meta="" className="label-mono text-(--text-mute)">
                        {site.address.city}, {site.address.country}
                    </p>
                    <p
                        data-intro-meta=""
                        className="label-mono tabular-nums text-(--text-mute)"
                    >
                        <span ref={clock}>00:00:00</span>
                        <span className="ml-2 text-(--line)">GMT+6</span>
                    </p>
                </div>

                <div>
                    {/* overflow-hidden clips the character rise. Without it the
              descenders show above the line they are rising from. */}
                    <div className="overflow-hidden py-1">
                        <h2
                            ref={word}
                            className="text-[clamp(2rem,7vw,5rem)] leading-[1.05] font-medium tracking-[-0.03em]"
                        >
                            {site.legalName}
                        </h2>
                    </div>

                    <div className="mt-8 flex items-end justify-between gap-6">
                        {/* The scramble line. Starts with the first discipline
                already in place so there is no empty box before the
                ambient loop begins. */}
                        <p
                            data-intro-meta=""
                            ref={disc}
                            className="text-[clamp(0.9375rem,1.6vw,1.25rem)] font-medium text-brand"
                        >
                            {DISCIPLINES[0]}
                        </p>

                        <p
                            ref={count}
                            className="text-[clamp(2.5rem,6vw,4.5rem)] leading-none font-medium tabular-nums"
                        >
                            000
                        </p>
                    </div>

                    <div className="mt-6 h-px w-full bg-(--line)">
                        <span
                            ref={bar}
                            className="block h-full w-full origin-left scale-x-0 bg-brand will-change-transform"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
