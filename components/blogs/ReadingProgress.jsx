"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Reading progress for an article.
 *
 * ── WHY THIS IS A PORTAL, AND WHY THAT IS NOT OPTIONAL ───────────────────
 * The first version of this was a `sticky` bar rendered inline at the top of
 * the article. It would never have worked.
 *
 * ScrollSmoother does not scroll the page — it translates #smooth-content
 * with a transform while the window scroll drives that transform. Sticky
 * offsets are resolved during layout, against the scrollport, and the
 * transform is applied afterwards to the whole subtree. So a sticky element
 * inside the smoother computes a correct pinned position and is then
 * translated away from it, frame by frame, exactly like ordinary content.
 * It scrolls off. `position: fixed` fails for the related reason every
 * front-end eventually learns the hard way: a transformed ancestor becomes
 * the containing block for fixed descendants.
 *
 * That is why the Navbar, the intro loader and the cookie banner all live in
 * the layout, OUTSIDE the smoother. This component is rendered by the article
 * page, which is inside it, so it portals its own markup to document.body and
 * gets the same escape without the page having to know.
 *
 * ⚑ The same trap applies to the `sticky` filter rails on /projects and
 * /blogs. See the note in ProjectRail.
 *
 * ── WHY IT MEASURES THE ARTICLE, NOT THE DOCUMENT ────────────────────────
 * The obvious implementation is scrollY over scrollHeight, which reaches 100%
 * at the bottom of the page. This route continues past the article into
 * related posts and a CTA band, so that bar would read about 60% at the last
 * paragraph and fill up over sections nobody is reading. Scrubbing between
 * the top and bottom of the body means full actually means finished.
 *
 * ── WHY ScrollTrigger AND NOT A SCROLL LISTENER ──────────────────────────
 * window.scrollY trails the VISIBLE position by up to a second under the
 * smoother. A listener reading it would run the bar behind the text the whole
 * way down. ScrollTrigger reads the active smoothed scroller.
 *
 * ── WHY scaleX AND NOT width ─────────────────────────────────────────────
 * width is a layout property, so animating it per scroll frame is a layout
 * pass per frame for a decoration. scaleX is composited.
 *
 * @param {string} target CSS selector for the element being read.
 */
export default function ReadingProgress({ target = "[data-article-body]" }) {
    const bar = useRef(null);

    // Portals need a DOM to target, which does not exist during SSR. The bar
    // is decorative, so rendering nothing on the server costs nothing.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    useGSAP(
        () => {
            const el = document.querySelector(target);
            if (!el || !bar.current) return;

            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            const st = ScrollTrigger.create({
                trigger: el,
                start: "top 80%",
                end: "bottom bottom",
                // Under reduced motion the bar is still useful information, it
                // just should not be the thing drawing the eye: it steps rather
                // than scrubbing.
                scrub: reduced ? false : 0.25,
                onUpdate: (self) => {
                    gsap.set(bar.current, { scaleX: self.progress });
                },
            });

            return () => st.kill();
        },
        { dependencies: [mounted] },
    );

    if (!mounted) return null;

    return createPortal(
        <div
            aria-hidden="true"
            // z-40: above the page, below the navbar's z-50, so it reads as a
            // rule under the header rather than a bar floating over it.
            className="pointer-events-none fixed inset-x-0 top-17 z-40 h-0.5 md:top-19"
        >
            <span
                ref={bar}
                className="block h-full w-full origin-left scale-x-0 bg-brand will-change-transform"
            />
        </div>,
        document.body,
    );
}
