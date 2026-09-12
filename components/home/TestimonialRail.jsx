"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, Draggable, Observer, ScrollSmoother } from "@/lib/gsap";
import SectionIndex from "@/components/ui/SectionIndex";
import useSplitReveal from "@/components/motion/useSplitReveal";
import { cn, mediaUrl } from "@/lib/utils";

/**
 * 06 // TESTIMONIALS — a rail you throw rather than a carousel you click.
 *
 * ── WHY DRAGGABLE + INERTIA AND NOT A SLIDER LIBRARY ─────────────────────
 * A slider snaps to fixed slides, which means the quote you are halfway
 * through jumps away from you when you nudge it. These are paragraphs, not
 * photos: people read at their own pace and want to stop wherever they
 * stopped. Draggable with InertiaPlugin gives free positioning with a real
 * throw, and the bounds do the rest. It is also three plugins this project
 * already registers rather than a new dependency.
 *
 * ── THE SKEW IS THE POINT ────────────────────────────────────────────────
 * Cards skew and scale slightly in proportion to rail velocity and relax back
 * when it settles. That is what makes a throw feel like it has mass. It is
 * driven from a per-frame velocity read on a quickSetter, not from React
 * state, so it costs one transform write per frame and zero renders.
 *
 * ── WHY THE VELOCITY IS SAMPLED, NOT TAKEN FROM DRAGGABLE ────────────────
 * Draggable's own velocity tracker only reports during a drag. The rail also
 * moves under wheel input and under the inertia throw after the pointer is
 * gone, and the skew has to respond to all three. Differencing the applied x
 * each frame covers every source with one code path.
 *
 * ── WHY IT IS NOT DRAG-ONLY ──────────────────────────────────────────────
 * A rail that can only be dragged is unusable with a keyboard and invisible
 * to anyone on a trackpad who never thinks to grab it. Horizontal wheel and
 * trackpad gestures scrub it, every card is focusable and scrolls itself into
 * view, and the arrow buttons page it. Drag is the nice way in, not the only
 * one.
 */

const CARD = 380; // px, must match the card width class below
const GAP = 16;

function initials(name = "") {
    return name
        .replace(/[^A-Za-z0-9 ]/g, " ")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
}

/**
 * The client's photo, if there is one.
 *
 * ── WHY A PLAIN <img> AND NOT next/image ─────────────────────────────────
 * `clientAvatar` is a free-text input in /admin/testimonials, hinted as "a
 * path under /public, or an absolute URL", so authors paste from imgbb,
 * Drive, a client's own site — anywhere. next/image refuses any host absent
 * from next.config.mjs `remotePatterns` and THROWS at render, so one pasted
 * link would turn into a 500 on the homepage. Whitelisting hosts one at a
 * time is a losing game against a free-text field, and at 44px the optimiser
 * saves almost nothing, so this trades it for a field that cannot break the
 * page.
 *
 * `mediaUrl()` still runs, so an /uploads/... path saved by the API resolves
 * exactly as it does everywhere else.
 *
 * ⚑ If avatars should be uploaded rather than pasted, the fix is to swap the
 * admin Input for ImageField (as services and team already do) and then this
 * can become next/image, because the host becomes the API's and is already
 * whitelisted.
 */
function Avatar({ src, name }) {
    const [failed, setFailed] = useState(false);
    const url = mediaUrl(src);

    /* No avatar and a dead link are the same thing to a reader, so both land
       on initials. A broken image frame reads as a bug; initials read as a
       choice. */
    if (!url || failed) {
        return (
            <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-full border border-(--line) bg-(--canvas) text-[0.8125rem] font-medium text-(--text-mute)"
            >
                {initials(name)}
            </span>
        );
    }

    return (
        <img
            src={url}
            /* Decorative: the name sits directly beside it, so alt text would
               make a screen reader say it twice. */
            alt=""
            width={44}
            height={44}
            loading="lazy"
            decoding="async"
            /* Several image hosts refuse a hotlink by referrer. Sending none is
               the difference between a picture and a broken frame. */
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="size-11 shrink-0 rounded-full border border-(--line) object-cover"
        />
    );
}

/**
 * ── WHY THE HEADING IS PROPS AND NOT LITERALS ────────────────────────────
 * This rail now runs on the homepage AND on /portfolio, where it is section
 * 03 rather than 06 and needs a heading that fits a pricing page above it.
 * The alternative was a second rail component duplicating the drag, wheel,
 * keyboard and skew logic for the sake of two strings, which is how a
 * codebase ends up with two carousels that drift apart. Same arrangement as
 * ProcessTracker: the defaults are the homepage's copy, so its call site did
 * not change.
 */
export default function TestimonialRail({
    testimonials,
    index = "06",
    eyebrow = "In their words",
    title = "What the people who paid for it say.",
}) {
    const root = useRef(null);
    const viewport = useRef(null);
    const track = useRef(null);
    const bar = useRef(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const heading = useSplitReveal({ type: "words", stagger: 0.04 });

    // Imperative handle for the arrow buttons, assigned inside the GSAP context
    // so it closes over the same tweens the drag uses.
    const api = useRef({ page: () => {} });

    useGSAP(
        () => {
            const vp = viewport.current;
            const tr = track.current;
            if (!vp || !tr) return;

            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const cards = gsap.utils.toArray("[data-quote]", tr);

            /* Bounds are recomputed, never cached. The track width changes when
               the webfont swaps and when the viewport resizes, and a stale
               minX lets the rail be thrown into empty space it can never
               return from. */
            const limits = () => {
                const min = Math.min(0, vp.offsetWidth - tr.scrollWidth);
                return { min, max: 0 };
            };

            const setX = gsap.quickSetter(tr, "x", "px");
            const setSkew = gsap.quickSetter(cards, "skewX", "deg");
            const setScale = gsap.quickSetter(cards, "scaleY");

            let x = 0;
            let prev = 0;
            let skew = 0;

            const clampX = (v) => {
                const { min, max } = limits();
                return gsap.utils.clamp(min, max, v);
            };

            const paint = () => {
                setX(x);
                const { min } = limits();
                const p = min === 0 ? 1 : x / min;
                if (bar.current) {
                    gsap.set(bar.current, { scaleX: gsap.utils.clamp(0.06, 1, p || 0.06) });
                }
                setAtStart(x >= -1);
                setAtEnd(x <= min + 1);
            };

            /* Per-frame velocity → skew. Eased toward the target rather than set
               to it, so a single fast frame does not produce a one-frame shear
               spike that reads as a glitch. */
            const tick = () => {
                const v = x - prev;
                prev = x;
                if (reduced) return;
                const target = gsap.utils.clamp(-14, 14, v * 0.28);
                skew += (target - skew) * 0.16;
                if (Math.abs(skew) < 0.01) skew = 0;
                setSkew(skew);
                setScale(1 - Math.abs(skew) * 0.004);
            };
            gsap.ticker.add(tick);

            /* Draggable drives a proxy div, not the track. Letting it own the
               track's transform means it fights every other tween that touches
               x — the wheel scrub, the arrow paging, the inertia settle. With a
               proxy, `x` above is the single source of truth and Draggable is
               just one more thing writing to it. */
            const proxy = document.createElement("div");
            let dragging = null;

            const buildDrag = () => {
                dragging?.kill();
                const { min, max } = limits();
                [dragging] = Draggable.create(proxy, {
                    type: "x",
                    trigger: vp,
                    inertia: true,
                    allowNativeTouchScrolling: true, // vertical page scroll must survive
                    bounds: { minX: min, maxX: max },
                    edgeResistance: 0.82,
                    onPress() {
                        gsap.set(proxy, { x });
                        this.update();
                        // ScrollSmoother's normalizeScroll swallows the pointer
                        // stream on desktop; the rail gets nothing without this.
                        ScrollSmoother.get()?.paused(true);
                        vp.classList.add("cursor-grabbing");
                    },
                    onDrag() {
                        x = this.x;
                        paint();
                    },
                    onThrowUpdate() {
                        x = this.x;
                        paint();
                    },
                    onRelease() {
                        ScrollSmoother.get()?.paused(false);
                        vp.classList.remove("cursor-grabbing");
                    },
                });
            };

            if (!reduced) buildDrag();

            /* Horizontal wheel and trackpad. deltaX only: claiming deltaY here
               would trap the page scroll inside the rail, which is the single
               most hated behaviour a horizontal carousel can have. */
            const obs = Observer.create({
                target: vp,
                type: "wheel",
                onChangeX: (self) => {
                    x = clampX(x - self.deltaX);
                    paint();
                },
                lockAxis: true,
                tolerance: 4,
            });

            api.current.page = (dir) => {
                x = clampX(x - dir * (CARD + GAP));
                gsap.to(
                    { v: Number(gsap.getProperty(tr, "x")) },
                    {
                        v: x,
                        duration: 0.6,
                        ease: "power3.out",
                        onUpdate() {
                            x = this.targets()[0].v;
                            paint();
                        },
                    },
                );
            };

            // Tab into a card that is off-screen and the rail should follow.
            const onFocusIn = (e) => {
                const card = e.target.closest("[data-quote]");
                if (!card) return;
                const left = card.offsetLeft;
                const right = left + card.offsetWidth;
                const viewLeft = -x;
                const viewRight = viewLeft + vp.offsetWidth;
                if (left < viewLeft) x = clampX(-left + GAP);
                else if (right > viewRight) x = clampX(-(right - vp.offsetWidth) - GAP);
                else return;
                gsap.to(tr, { x, duration: 0.45, ease: "power3.out", onUpdate: paint });
            };
            vp.addEventListener("focusin", onFocusIn);

            // Rebuild bounds on resize; the track is content-sized so it changes
            // width with the type.
            const ro = new ResizeObserver(() => {
                x = clampX(x);
                paint();
                if (!reduced) buildDrag();
            });
            ro.observe(vp);
            ro.observe(tr);

            paint();

            return () => {
                gsap.ticker.remove(tick);
                dragging?.kill();
                obs.kill();
                ro.disconnect();
                vp.removeEventListener("focusin", onFocusIn);
                ScrollSmoother.get()?.paused(false);
            };
        },
        { scope: root },
    );

    if (!testimonials?.length) return null;

    return (
        <section ref={root} className="overflow-hidden border-b border-(--line)">
            <div className="shell py-24 md:py-32">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <div className="max-w-xl">
                        <SectionIndex index={index} label={eyebrow} />
                        <h2 ref={heading} className="text-heading mt-6">
                            {title}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {[
                            ["Previous", -1, atStart],
                            ["Next", 1, atEnd],
                        ].map(([label, dir, disabled]) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => api.current.page(dir)}
                                disabled={disabled}
                                aria-label={`${label} testimonial`}
                                className="inline-flex size-10 items-center justify-center rounded-full border border-(--line) text-(--text) transition-colors hover:border-(--text) disabled:opacity-35 disabled:hover:border-(--line)"
                            >
                                <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    aria-hidden="true"
                                    className={dir === -1 ? "rotate-180" : undefined}
                                >
                                    <path
                                        d="M2.5 8h11M9.5 4l4 4-4 4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Full-bleed viewport, gutter restored by the leading spacer. The rail
          should run off the right edge: a carousel that ends flush with the
          content column looks finished when it is not. */}
            <div ref={viewport} className="cursor-grab overflow-hidden pb-10 select-none">
                <div ref={track} className="flex w-max items-stretch gap-4 will-change-transform">
                    <span aria-hidden="true" className="block w-5 shrink-0 md:w-10" />

                    {testimonials.map((t) => (
                        <figure
                            key={t._id}
                            data-quote=""
                            tabIndex={0}
                            className="flex w-75 shrink-0 flex-col justify-between rounded-2xl border border-(--line) bg-(--raised) p-7 outline-none transition-colors duration-300 focus-visible:border-brand md:w-95 md:p-9"
                        >
                            <blockquote className="text-[1.0625rem] leading-[1.6] text-(--text)">
                                {t.reviewText}
                            </blockquote>
                            <figcaption className="mt-8 flex items-center gap-3.5 border-t border-(--line) pt-5">
                                <Avatar src={t.clientAvatar} name={t.clientName} />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-(--text)">
                                        {t.clientName}
                                    </p>
                                    {/* Joined rather than interpolated with a literal comma.
                                        Both fields default to "" on the model, so the old
                                        `{role}, {company}` rendered a dangling ", Acme" or
                                        "Head of Ops," whenever an author filled only one. */}
                                    {(t.clientDesignation || t.companyName) && (
                                        <p className="label-mono mt-1.5 text-(--text-mute)">
                                            {[t.clientDesignation, t.companyName]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </p>
                                    )}
                                </div>
                            </figcaption>
                        </figure>
                    ))}

                    <span aria-hidden="true" className="block w-5 shrink-0 md:w-10" />
                </div>
            </div>

            {/* Progress rule. Sits in the content column so it reads as a caption
          for the rail rather than as part of it. */}
            <div className="shell pb-24 md:pb-32">
                <div className="relative h-px w-full bg-(--line)">
                    <span
                        ref={bar}
                        aria-hidden="true"
                        className={cn(
                            "absolute inset-0 block origin-left bg-brand",
                            "will-change-transform",
                        )}
                        style={{ transform: "scaleX(0.06)" }}
                    />
                </div>
            </div>
        </section>
    );
}
