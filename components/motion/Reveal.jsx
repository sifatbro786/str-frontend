"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Scroll reveal for content rendered on the server.
 *
 * ── THE PROBLEM THIS SOLVES ──────────────────────────────────────────────
 * Every route below the homepage is a server component that awaits lib/api.
 * To animate anything in one of them, the naive move is to add "use client"
 * at the top of the page — which cannot work, because lib/api imports
 * ./session, which imports next/headers. The next move is to extract the
 * animated section into its own client component and pass it the data, which
 * works but means every section becomes a component, and the data it needs
 * has to be projected and serialised across the boundary one prop at a time.
 *
 * This is the third option, and it is the one React actually intends:
 * children passed INTO a client component are still rendered on the server.
 * The boundary is for CODE, not for content. So this file ships a few hundred
 * bytes of animation logic to the browser and the markup inside it arrives as
 * HTML, fully server-rendered, with no data crossing the wire twice.
 *
 * ── TWO MODES, CHOSEN AUTOMATICALLY ──────────────────────────────────────
 * If the subtree contains [data-reveal] elements they are staggered
 * individually. Otherwise the wrapper itself is animated as one block. That
 * means the common case is <Reveal> around a section with no other changes,
 * and the richer case is opting specific children in — without two
 * components or a mode prop to get wrong.
 *
 * ── WHY autoAlpha AND NOT opacity ────────────────────────────────────────
 * autoAlpha drives visibility as well, so an element waiting to reveal is
 * visibility:hidden rather than opacity:0. An opacity:0 element is still
 * hit-testable and still read by some screen readers, which means links you
 * cannot see are focusable.
 *
 * ── WHY THE INITIAL HIDE IS IN JS, NOT A CLASS ───────────────────────────
 * useGSAP runs in useLayoutEffect, before paint, so there is no flash. Doing
 * it with an `opacity-0` class in the markup would leave the content
 * permanently invisible if the bundle never executes. Hidden-by-JS fails
 * open; hidden-by-CSS fails closed.
 *
 * @param {number}  y         Travel distance in px.
 * @param {number}  stagger
 * @param {number}  delay
 * @param {string}  start     ScrollTrigger start.
 * @param {string}  as        Element to render. Defaults to a div; pass
 *                            "section" or "li" to avoid an extra wrapper.
 */
export default function Reveal({
    children,
    y = 26,
    stagger = 0.08,
    delay = 0,
    start = "top 86%",
    as: Tag = "div",
    className,
    ...rest
}) {
    const root = useRef(null);

    useGSAP(
        () => {
            const el = root.current;
            if (!el) return;

            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reduced) return;

            const items = gsap.utils.toArray("[data-reveal]", el);
            const targets = items.length ? items : [el];

            gsap.fromTo(
                targets,
                { autoAlpha: 0, y },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    stagger: items.length ? stagger : 0,
                    delay,
                    // once:true — a section that re-animates when you scroll back
                    // up is a section fighting the reader.
                    scrollTrigger: { trigger: el, start, once: true },
                    // The transform is only needed while it moves. Left on, it
                    // creates a containing block for any position:fixed
                    // descendant, which is a genuinely confusing bug to trace.
                    clearProps: "transform",
                },
            );
        },
        { scope: root },
    );

    return (
        <Tag ref={root} className={className} {...rest}>
            {children}
        </Tag>
    );
}
