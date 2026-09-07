"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, ScrollSmoother } from "@/lib/gsap";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { site } from "@/lib/site";
import { cn, pad } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
   Navbar — floating capsule header.

   ARCHITECTURE NOTES (read before editing):

   1. SCROLL STATE IS NOT REACT STATE.
      ScrollSmoother translates #smooth-content, so window.scrollY trails the
      *visual* position by up to `smooth` seconds. The condense/expand morph is
      therefore driven by a ScrollTrigger — which reads the active (smoothed)
      scroller — toggling a paused timeline. Zero re-renders on scroll.

   2. THE MORPH TWEENS LAYOUT ON PURPOSE.
      maxWidth/height/padding are laid out, not composited. Deliberate trade:
      the composited alternative (scaleX on a plate) shears the border-radius
      and the 1px hairline. The tween runs ~0.7s twice per scroll session over
      ~12 nodes — well inside frame budget — and the expensive part (blur,
      hairline, shadow) lives on a single out-of-flow node that never reflows.

   3. backdrop-filter IS TOGGLED, NOT FADED.
      autoAlpha drives visibility:hidden at 0, which drops the blur layer from
      the compositor entirely at scrollTop 0. A blur(0px) layer still costs a
      full-viewport readback every frame; visibility:hidden costs nothing.

   4. EVERY POINTER HANDLER IS contextSafe().
      useGSAP's scope reverts tweens on unmount, but tweens created inside
      handlers registered outside the context leak into the next route.
   ───────────────────────────────────────────────────────────────────────── */

const EASE = "power3.out";

/* Path triple for the mobile sweep. Identical command structure across all
   three — that is what lets GSAP interpolate `d` numerically via the attr
   plugin with no MorphSVG shape-matching pass. Cheaper, and deterministic:
   MorphSVG can pick a different vertex correspondence run to run on ambiguous
   shapes, which shows up as an occasional flipped sweep. */
const PATH = {
    closed: "M 0 0 L 100 0 L 100 0 Q 50 0 0 0 Z",
    overshoot: "M 0 0 L 100 0 L 100 100 Q 50 122 0 100 Z",
    open: "M 0 0 L 100 0 L 100 100 Q 50 100 0 100 Z",
};

/* Two-line clipped roll. The clone is aria-hidden, so ScrambleText is free to
   mutate its textContent without ever touching the accessible name. */
function RollingLabel({ children, setStack, setClone }) {
    return (
        <span className="relative block h-[1.25em] overflow-hidden">
            <span ref={setStack} className="block will-change-transform">
                <span className="block">{children}</span>
                <span ref={setClone} aria-hidden="true" className="block text-signal">
                    {children}
                </span>
            </span>
        </span>
    );
}

export default function Navbar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const root = useRef(null);
    const head = useRef(null); // fixed rail; owns the capsule's side gutter
    const bar = useRef(null); // flex row that becomes the capsule
    const plate = useRef(null); // out-of-flow background: blur + hairline + shadow
    const navList = useRef(null);
    const indicator = useRef(null);
    const cta = useRef(null);
    const ctaZone = useRef(null);
    const ctaFill = useRef(null);
    const ctaLabel = useRef(null);
    const overlay = useRef(null);
    const curve = useRef(null);
    const sheetLinks = useRef([]);
    const sheetTl = useRef(null);

    // One ref pair per nav item, allocated once. Index-stable because site.nav is
    // a module constant — if it ever becomes fetched, key this by href instead.
    const labelRefs = useRef(site.nav.map(() => ({ stack: null, clone: null })));

    const isActive = useCallback(
        (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
        [pathname],
    );

    /* ── 1 · Capsule morph ────────────────────────────────────────────────── */
    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const mm = gsap.matchMedia();

            mm.add({ isDesktop: "(min-width: 1024px)", isMobile: "(max-width: 1023px)" }, (ctx) => {
                const { isDesktop } = ctx.conditions;

                const tl = gsap
                    .timeline({ paused: true, defaults: { duration: 0.7, ease: "power3.inOut" } })
                    // Side gutter goes on the header, not the bar. The bar centres with
                    // margin-inline:auto, and a fixed left/right margin there would
                    // left-align it the moment the viewport exceeds maxWidth.
                    .to(head.current, { paddingLeft: 16, paddingRight: 16 }, 0)
                    .to(
                        bar.current,
                        {
                            maxWidth: isDesktop ? 1040 : 620,
                            height: isDesktop ? 60 : 56,
                            marginTop: isDesktop ? 14 : 10,
                            paddingLeft: isDesktop ? 22 : 14,
                            paddingRight: isDesktop ? 14 : 8,
                        },
                        0,
                    )
                    .to(
                        plate.current,
                        {
                            autoAlpha: 1,
                            borderRadius: 999,
                            backdropFilter: "blur(18px) saturate(160%)",
                            WebkitBackdropFilter: "blur(18px) saturate(160%)",
                            duration: 0.5,
                        },
                        0,
                    )
                    // The plate settles a beat after the row: it arrives slightly wider
                    // and taller and relaxes into place. That overshoot is the whole
                    // difference between "a div got rounded" and "it condensed".
                    .fromTo(
                        plate.current,
                        { scaleX: 1.045, scaleY: 1.2 },
                        { scaleX: 1, scaleY: 1, duration: 0.75, ease: "power4.out" },
                        0,
                    );

                const st = ScrollTrigger.create({
                    start: 50,
                    end: "max",
                    onToggle: (self) => {
                        if (reduced) {
                            tl.progress(self.isActive ? 1 : 0).pause();
                            return;
                        }
                        self.isActive ? tl.play() : tl.reverse();
                    },
                });

                // Seed the state for a reload at a browser-restored scroll offset.
                const y = ScrollSmoother.get()?.scrollTop() ?? window.scrollY;
                if (y > 50) tl.progress(1).pause();

                return () => {
                    st.kill();
                    tl.kill();
                };
            });

            return () => mm.revert();
        },
        { scope: root },
    );

    /* ── 2 · Magnetic pill indicator · 3 · roll + scramble ────────────────── */
    useGSAP(
        (context, contextSafe) => {
            const nav = navList.current;
            const pill = indicator.current;
            if (!nav || !pill) return;
            if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            gsap.set(pill, { autoAlpha: 0, x: 0, y: 0, width: 0, height: 0 });

            // quickTo compiles ONE mutating tween per property. Allocating a fresh
            // tween on every mouseenter across a 5-item nav is what makes these feel
            // gummy — the previous tween keeps running and fights the new one.
            const to = {
                x: gsap.quickTo(pill, "x", { duration: 0.55, ease: EASE }),
                y: gsap.quickTo(pill, "y", { duration: 0.45, ease: EASE }),
                width: gsap.quickTo(pill, "width", { duration: 0.55, ease: EASE }),
                height: gsap.quickTo(pill, "height", { duration: 0.45, ease: EASE }),
            };

            let visible = false;

            const moveTo = (el) => {
                // Measured live on every enter. The capsule morph changes link geometry
                // mid-flight and the font swap changes it again — a cached rect parks
                // the pill over an empty slot.
                const a = el.getBoundingClientRect();
                const b = nav.getBoundingClientRect();
                const x = a.left - b.left;
                const y = a.top - b.top;

                if (!visible) {
                    // First entry: appear at the target instead of sliding in from x:0.
                    gsap.set(pill, { x, y, width: a.width, height: a.height });
                    visible = true;
                    gsap.to(pill, { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
                } else {
                    to.x(x);
                    to.y(y);
                    to.width(a.width);
                    to.height(a.height);
                }
            };

            const hide = () => {
                visible = false;
                gsap.to(pill, { autoAlpha: 0, duration: 0.35, ease: "power2.out" });
            };

            /* One roll timeline per link, built lazily and driven with
         play()/reverse(). A fresh tween per pointer event is exactly how these
         desync when the cursor leaves mid-roll. */
            const timelines = new Map();

            const buildRoll = (i) => {
                const refs = labelRefs.current[i];
                if (!refs?.stack) return null;
                const text = site.nav[i].label;

                const tl = gsap.timeline({ paused: true });
                tl.to(refs.stack, { yPercent: -50, duration: 0.5, ease: "power3.inOut" }, 0);
                // General Sans ships as static 400/500/600/700 from Fontshare, so a
                // fontWeight tween would step between faces mid-roll. Tracking is
                // continuous and reads as the same "firming up" gesture, no jump.
                //
                // fromTo, not to: the computed start value is the keyword `normal`,
                // which GSAP cannot parse into a number — a plain .to() here yields NaN
                // and the label silently stops tracking.
                tl.fromTo(
                    refs.stack,
                    { letterSpacing: "0em" },
                    { letterSpacing: "0.014em", duration: 0.5 },
                    0,
                );

                if (!reduced) {
                    tl.to(
                        refs.clone,
                        {
                            duration: 0.45,
                            ease: "none",
                            scrambleText: {
                                text,
                                chars: "upperCase",
                                speed: 0.7,
                                revealDelay: 0.12,
                            },
                        },
                        0.05,
                    );
                }
                // ScrambleText owns textContent while it runs; restore the real string
                // once the roll is fully back so a fast in-out leaves no debris.
                tl.eventCallback("onReverseComplete", () => {
                    if (refs.clone) refs.clone.textContent = text;
                });
                return tl;
            };

            const onEnter = contextSafe((e) => {
                const link = e.currentTarget;
                const i = Number(link.dataset.index);
                moveTo(link);
                let tl = timelines.get(link);
                if (!tl) {
                    tl = buildRoll(i);
                    if (tl) timelines.set(link, tl);
                }
                tl?.play();
            });

            const onLeave = contextSafe((e) => {
                timelines.get(e.currentTarget)?.reverse();
            });

            const links = gsap.utils.toArray("[data-navlink]", nav);
            links.forEach((l) => {
                l.addEventListener("mouseenter", onEnter);
                l.addEventListener("mouseleave", onLeave);
                l.addEventListener("focus", onEnter);
                l.addEventListener("blur", onLeave);
            });
            nav.addEventListener("mouseleave", hide);

            // The morph and the webfont swap both resize the nav. Retiring the pill
            // beats animating it to a position the pointer is no longer near.
            const ro = new ResizeObserver(() => visible && hide());
            ro.observe(nav);

            return () => {
                links.forEach((l) => {
                    l.removeEventListener("mouseenter", onEnter);
                    l.removeEventListener("mouseleave", onLeave);
                    l.removeEventListener("focus", onEnter);
                    l.removeEventListener("blur", onLeave);
                });
                nav.removeEventListener("mouseleave", hide);
                ro.disconnect();
                timelines.forEach((t) => t.kill());
                timelines.clear();
            };
        },
        { scope: root },
    );

    /* ── 4 · Magnetic CTA + directional liquid fill ───────────────────────── */
    useGSAP(
        (context, contextSafe) => {
            const zone = ctaZone.current;
            const btn = cta.current;
            const fill = ctaFill.current;
            const label = ctaLabel.current;
            if (!zone || !btn || !fill) return;

            const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            gsap.set(fill, { yPercent: 101, borderRadius: "42% 58% 0 0" });

            // No magnetism without a real pointer, and none under reduced-motion —
            // the CSS hover colour swap below is the whole interaction there.
            if (!fine || reduced) return;

            const xTo = gsap.quickTo(btn, "x", { duration: 0.7, ease: EASE });
            const yTo = gsap.quickTo(btn, "y", { duration: 0.7, ease: EASE });
            const lxTo = gsap.quickTo(label, "x", { duration: 0.9, ease: EASE });
            const lyTo = gsap.quickTo(label, "y", { duration: 0.9, ease: EASE });

            // Displacement is capped, not purely proportional: an uncapped magnet on
            // a wide button drifts far enough that the pointer leaves the hit area
            // it is supposedly attracted to.
            const PULL = 0.32;
            const CAP = 12;

            const onMove = contextSafe((e) => {
                const r = btn.getBoundingClientRect();
                const dx = gsap.utils.clamp(-CAP, CAP, (e.clientX - (r.left + r.width / 2)) * PULL);
                const dy = gsap.utils.clamp(-CAP, CAP, (e.clientY - (r.top + r.height / 2)) * PULL);
                xTo(dx);
                yTo(dy);
                // Label trails the shell at ~⅓ strength. That internal parallax is what
                // makes the button read as a soft body rather than a moving rectangle.
                lxTo(dx * 0.35);
                lyTo(dy * 0.35);
            });

            // elastic on release only — the approach stays power3, so the button
            // never wobbles while the cursor is still driving it.
            const onOut = contextSafe(() => {
                gsap.to(btn, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.4)" });
                gsap.to(label, { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.4)" });
            });

            /* Liquid fill: the sheet enters from whichever edge the pointer crossed
         and exits through whichever edge it leaves by. The curved leading edge
         flattening as it lands is what sells the "liquid" read. */
            const edge = (e) => {
                const r = btn.getBoundingClientRect();
                return e.clientY < r.top + r.height / 2 ? -1 : 1; // -1 top, 1 bottom
            };

            const onFillEnter = contextSafe((e) => {
                const dir = edge(e);
                gsap.killTweensOf(fill);
                gsap.fromTo(
                    fill,
                    {
                        yPercent: dir * 101,
                        borderRadius: dir === 1 ? "42% 58% 0 0" : "0 0 58% 42%",
                    },
                    { yPercent: 0, borderRadius: "0% 0% 0% 0%", duration: 0.62, ease: EASE },
                );
                // Colour is a class toggle over a CSS transition, not a tween. GSAP
                // would have to resolve `var(--text)` to a number to interpolate back,
                // which pins the rest colour to whichever theme was active at hover
                // time and strands the label on a theme flip.
                label.classList.add("text-white");
            });

            const onFillLeave = contextSafe((e) => {
                const dir = edge(e);
                gsap.killTweensOf(fill);
                gsap.to(fill, {
                    yPercent: dir * 101,
                    borderRadius: dir === 1 ? "42% 58% 0 0" : "0 0 58% 42%",
                    duration: 0.5,
                    ease: "power3.in",
                });
                label.classList.remove("text-white");
            });

            zone.addEventListener("pointermove", onMove);
            zone.addEventListener("pointerleave", onOut);
            btn.addEventListener("pointerenter", onFillEnter);
            btn.addEventListener("pointerleave", onFillLeave);

            return () => {
                zone.removeEventListener("pointermove", onMove);
                zone.removeEventListener("pointerleave", onOut);
                btn.removeEventListener("pointerenter", onFillEnter);
                btn.removeEventListener("pointerleave", onFillLeave);
            };
        },
        { scope: root },
    );

    /* ── 5 · Mobile overlay: curved SVG sweep + 3D staggered links ────────── */
    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const items = sheetLinks.current.filter(Boolean);

            gsap.set(overlay.current, { autoAlpha: 0 });

            const tl = gsap.timeline({
                paused: true,
                onStart: () => gsap.set(overlay.current, { autoAlpha: 1 }),
                onReverseComplete: () => gsap.set(overlay.current, { autoAlpha: 0 }),
            });

            if (reduced) {
                tl.set(curve.current, { attr: { d: PATH.open } }).fromTo(
                    items,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.2, stagger: 0.02 },
                );
            } else {
                tl.fromTo(
                    curve.current,
                    { attr: { d: PATH.closed } },
                    { attr: { d: PATH.overshoot }, duration: 0.6, ease: EASE },
                )
                    // Overshoot then settle: the curve belly passes the viewport floor and
                    // is pulled flat. One tween to PATH.open would just be a wipe.
                    .to(curve.current, {
                        attr: { d: PATH.open },
                        duration: 0.32,
                        ease: "power2.out",
                    })
                    .fromTo(
                        items,
                        // transformPerspective, not a `perspective` on an ancestor: the
                        // ul/li chain between the nav and the link would need
                        // transform-style: preserve-3d the whole way down for an inherited
                        // perspective to survive. Per-element is one property and no
                        // stacking-context surprises.
                        {
                            yPercent: 118,
                            rotateX: -78,
                            opacity: 0,
                            transformPerspective: 900,
                            transformOrigin: "50% 0%",
                        },
                        {
                            yPercent: 0,
                            rotateX: 0,
                            opacity: 1,
                            duration: 0.72,
                            ease: EASE,
                            stagger: 0.055,
                        },
                        "-=0.42",
                    )
                    .fromTo(
                        "[data-sheet-foot]",
                        { y: 24, opacity: 0 },
                        { y: 0, opacity: 1, duration: 0.5 },
                        "-=0.35",
                    );
            }

            sheetTl.current = tl;
            return () => tl.kill();
        },
        { scope: root },
    );

    // Open/close driver. Faster timeScale on the reverse — a dismissal that takes
    // as long as the reveal always feels broken.
    useEffect(() => {
        const tl = sheetTl.current;
        if (!tl) return;
        if (open) tl.timeScale(1).play();
        else tl.timeScale(1.6).reverse();
    }, [open]);

    /* Body lock. Under ScrollSmoother, overflow:hidden on <body> does nothing —
     the smoother owns the scroll position — so it must be paused explicitly.
     Both are applied because touch devices bail out of the smoother entirely
     (see SmoothScrollProvider) and only the overflow lock reaches them. */
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        ScrollSmoother.get()?.paused(open);
        return () => {
            document.body.style.overflow = "";
            ScrollSmoother.get()?.paused(false);
        };
    }, [open]);

    useEffect(() => setOpen(false), [pathname]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    return (
        <div ref={root}>
            {/* No horizontal padding on the header: the bar carries the shell gutter
          itself (1.25rem / 2.5rem) so the logo lines up on the same rails as
          page content at rest, and GSAP owns those two values during the morph. */}
            <header ref={head} className="pointer-events-none fixed inset-x-0 top-0 z-50">
                <div
                    ref={bar}
                    style={{ maxWidth: 1344, height: 68 }}
                    className="pointer-events-auto relative mx-auto flex items-center justify-between gap-6 px-5 md:px-10"
                >
                    {/* Out-of-flow plate. Everything expensive — backdrop blur, hairline,
              inner highlight, drop shadow — lives here, so the flex row above
              can reflow during the morph without repainting any of it. */}
                    <span
                        ref={plate}
                        aria-hidden="true"
                        className="invisible absolute inset-0 -z-10 border border-(--line) bg-(--overlay) opacity-0 shadow-[0_1px_0_0_rgb(255_255_255/0.05)_inset,0_18px_50px_-24px_rgb(0_0_0/0.55)]"
                    />

                    <Logo priority height={35} />

                    {/* Desktop nav */}
                    <nav
                        ref={navList}
                        aria-label="Primary"
                        className="relative hidden items-center gap-0.5 lg:flex"
                    >
                        <span
                            ref={indicator}
                            aria-hidden="true"
                            className="pointer-events-none invisible absolute left-0 top-0 -z-10 rounded-full border border-(--line) bg-(--raised-2) opacity-0"
                        />

                        {site.nav.map((item, i) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    data-navlink=""
                                    data-index={i}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "relative inline-flex items-center rounded-full px-4 py-2 text-[0.9375rem] transition-colors duration-300",
                                        active
                                            ? "text-(--text)"
                                            : "text-(--text-mute) hover:text-(--text)",
                                    )}
                                >
                                    {/* Active route = one signal dot. The indicator behind the
                      label is a neutral surface, never a filled brand pill —
                      that remains the generated-UI tell we avoid. */}
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            "mr-2 block size-1 shrink-0 rounded-full bg-signal transition-opacity duration-300",
                                            active ? "opacity-100" : "opacity-0",
                                        )}
                                    />
                                    <RollingLabel
                                        setStack={(el) => {
                                            labelRefs.current[i].stack = el;
                                        }}
                                        setClone={(el) => {
                                            labelRefs.current[i].clone = el;
                                        }}
                                    >
                                        {item.label}
                                    </RollingLabel>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2.5">
                        <ThemeToggle />

                        {/* The proximity zone is larger than the button. The magnet has to
                engage *before* the pointer arrives, or the pull reads as jitter
                at the moment of the click. */}
                        <div ref={ctaZone} className="-m-4 hidden p-4 sm:block">
                            <Link
                                ref={cta}
                                href="/contact"
                                className="relative inline-flex items-center overflow-hidden rounded-full border border-(--text) px-5 py-2.5 text-[0.8125rem] font-medium text-(--text) transition-colors will-change-transform motion-reduce:hover:bg-signal motion-reduce:hover:text-white"
                            >
                                <span
                                    ref={ctaFill}
                                    aria-hidden="true"
                                    className="absolute inset-0 block bg-signal will-change-transform"
                                />
                                <span
                                    ref={ctaLabel}
                                    className="relative z-10 block whitespace-nowrap transition-colors duration-300 will-change-transform"
                                >
                                    Start a project
                                </span>
                            </Link>
                        </div>

                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            aria-expanded={open}
                            aria-controls="mobile-nav"
                            aria-label={open ? "Close menu" : "Open menu"}
                            className="relative z-10 inline-flex size-9 items-center justify-center rounded-full border border-(--line) text-(--text) lg:hidden"
                        >
                            <span className="relative block h-3 w-4">
                                <span
                                    className={cn(
                                        "absolute left-0 block h-px w-full bg-current transition-all duration-300",
                                        open ? "top-1.5 rotate-45" : "top-0",
                                    )}
                                />
                                <span
                                    className={cn(
                                        "absolute left-0 top-1.5 block h-px w-full bg-current transition-opacity duration-200",
                                        open && "opacity-0",
                                    )}
                                />
                                <span
                                    className={cn(
                                        "absolute left-0 block h-px w-full bg-current transition-all duration-300",
                                        open ? "top-1.5 -rotate-45" : "top-3",
                                    )}
                                />
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Mobile sheet ─────────────────────────────────────────────────── */}
            <div
                id="mobile-nav"
                ref={overlay}
                inert={!open}
                className="invisible fixed inset-0 z-40 opacity-0 lg:hidden"
            >
                {/* preserveAspectRatio="none" lets the 100×100 viewBox stretch to any
            viewport, so one path string covers every device without recomputing
            control points on resize. */}
                <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <path ref={curve} d={PATH.closed} fill="var(--canvas)" />
                </svg>

                <nav
                    aria-label="Mobile"
                    className="shell relative flex h-full flex-col pt-24"
                    style={{ perspective: 900 }}
                >
                    <ul className="divide-y divide-(--line) border-b border-t border-(--line)">
                        {site.nav.map((item, i) => (
                            // The li clips: rotateX from below would otherwise show the link
                            // rising through the divider above it.
                            <li key={item.href} className="overflow-hidden">
                                <Link
                                    ref={(el) => {
                                        sheetLinks.current[i] = el;
                                    }}
                                    href={item.href}
                                    className={cn(
                                        "flex items-baseline gap-5 py-5 text-[1.75rem] tracking-[-0.03em] transition-colors will-change-transform",
                                        isActive(item.href) ? "text-signal" : "text-(--text)",
                                    )}
                                >
                                    <span className="label-mono text-(--text-mute)">
                                        {pad(i + 1)}
                                    </span>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div data-sheet-foot="" className="mt-auto pb-10 pt-8">
                        <Link
                            href="/contact"
                            className="flex w-full items-center justify-center rounded-full bg-signal px-6 py-4 text-sm font-medium text-white"
                        >
                            Start a project
                        </Link>
                        <p className="label-mono mt-6 text-(--text-mute)">
                            {site.contact.email} · {site.address.city}
                        </p>
                    </div>
                </nav>
            </div>
        </div>
    );
}
