"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Delegated magnetic hover for every `[data-magnetic]` inside a scope.
 *
 * Extracted because this is now the third caller (Navbar's CTA, the footer's
 * link rails, the hero's actions) and three copies of a pointer-physics loop is
 * how three subtly different feels end up on one site.
 *
 * ── WHY DELEGATION ───────────────────────────────────────────────────────
 * One pointermove listener per scope, not one per target. Twenty links with
 * their own handlers is twenty closures and twenty getBoundingClientRect calls
 * per frame; this is one null check per frame plus a single rect for whatever
 * is actually under the cursor.
 *
 * ── THE TWO THINGS THAT SILENTLY BREAK THIS ──────────────────────────────
 *  1. The target must not be an inline box. A transform on `display: inline`
 *     is discarded with no warning — the usual reason "the magnet does nothing
 *     on the text links". Callers use inline-block/inline-flex.
 *  2. quickTo pairs must be cached per element. Building them on each hover
 *     leaves the previous tween alive and fighting the new one, which reads as
 *     a gummy, laggy magnet rather than a broken one — so it survives review.
 *
 * @param {import("react").RefObject<HTMLElement>} scope
 * @param {{ pull?: number, cap?: number }} [opts]
 *   pull — fraction of the cursor's offset from centre that is applied.
 *   cap  — hard px ceiling. Also clamped to 45% of the target's height, because
 *          a 14px label pulled 12px has left its own hit area and the pointer
 *          falls out of the element it is supposedly attracted to.
 */
export function useMagnetic(scope, { pull = 0.42, cap = 10 } = {}) {
    useGSAP(
        (context, contextSafe) => {
            const el = scope.current;
            if (!el) return;
            if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

            const cache = new Map();
            const setters = (node) => {
                let s = cache.get(node);
                if (!s) {
                    s = {
                        x: gsap.quickTo(node, "x", { duration: 0.6, ease: "power3.out" }),
                        y: gsap.quickTo(node, "y", { duration: 0.6, ease: "power3.out" }),
                    };
                    cache.set(node, s);
                }
                return s;
            };

            let active = null;

            // elastic on release only. The approach stays power3 so the target never
            // wobbles while the cursor is still driving it.
            const release = (node) => {
                node.style.willChange = "auto";
                gsap.to(node, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.45)" });
            };

            const onOver = contextSafe((e) => {
                const node = e.target.closest?.("[data-magnetic]");
                if (!node || node === active) return;
                if (active) release(active);
                active = node;
                // Promoted only while engaged — a permanent will-change on every link
                // in a footer is a permanent compositor layer per link.
                node.style.willChange = "transform";
            });

            const onMove = contextSafe((e) => {
                if (!active) return;
                const r = active.getBoundingClientRect();
                const c = Math.min(cap, r.height * 0.45);
                const s = setters(active);
                s.x(gsap.utils.clamp(-c, c, (e.clientX - (r.left + r.width / 2)) * pull));
                s.y(gsap.utils.clamp(-c, c, (e.clientY - (r.top + r.height / 2)) * pull));
            });

            const onOut = contextSafe((e) => {
                if (!active) return;
                if (e.relatedTarget && active.contains(e.relatedTarget)) return;
                release(active);
                active = null;
            });

            el.addEventListener("pointerover", onOver);
            el.addEventListener("pointermove", onMove);
            el.addEventListener("pointerout", onOut);

            return () => {
                el.removeEventListener("pointerover", onOver);
                el.removeEventListener("pointermove", onMove);
                el.removeEventListener("pointerout", onOut);
                cache.forEach((_, node) => gsap.killTweensOf(node));
                cache.clear();
            };
        },
        { scope, dependencies: [] },
    );
}

export default useMagnetic;
