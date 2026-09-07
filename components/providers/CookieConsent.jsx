"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Cookie consent.
 *
 * ── WHAT THIS IS AND IS NOT ⚑ ────────────────────────────────────────────
 * This records a choice and exposes it. It does NOT by itself make the site
 * compliant with GDPR or the ePrivacy directive, and it must not be treated
 * as if it does. Compliance is about what actually loads:
 *
 *   · Non-essential scripts (analytics, pixels, embedded video, chat widgets)
 *     must not run until `hasConsent()` returns true. Nothing on the site
 *     currently loads any, which is the only reason this component alone is
 *     enough today. The moment a GA snippet or a Meta pixel is added, it has
 *     to be gated on the `str-cookie-consent` event below, not dropped into
 *     the layout.
 *   · Declining has to be as easy as accepting. Both buttons are the same
 *     size and weight for that reason. A greyed-out "Decline" beside a filled
 *     "Accept all" is a dark pattern and is specifically called out in EDPB
 *     guidance.
 *   · The choice has to be revocable. `resetConsent()` is exported for a
 *     "Cookie settings" link in the footer; wire one up before launch.
 *
 * ── WHY NO BACKDROP, AND WHY BOTTOM-LEFT ─────────────────────────────────
 * A full-screen modal blocks the content someone arrived to read and trains
 * them to click whatever dismisses it fastest, which makes the consent
 * meaningless. A corner card is dismissible on their schedule.
 *
 * ── WHY IT IS NOT INSIDE ScrollSmoother ──────────────────────────────────
 * #smooth-content carries a transform, which becomes the containing block for
 * fixed descendants. A fixed banner in there scrolls away with the page.
 * Mounts in app/(public)/layout.js beside the Navbar, outside the smoother.
 *
 * ── WHY THE FIRST PAINT IS null ──────────────────────────────────────────
 * localStorage is not readable on the server, so rendering the banner during
 * SSR and hiding it after hydration flashes it at every returning visitor.
 * The banner mounts only after the effect has read the stored choice.
 */

const KEY = "str-cookie-consent";
const EVENT = "str-cookie-consent";
const DELAY_MS = 1200; // let the page arrive first; the loader owns the moment before this

/** "granted" | "denied" | null. Safe to call from anywhere on the client. */
export function getConsent() {
    if (typeof window === "undefined") return null;
    try {
        return localStorage.getItem(KEY);
    } catch {
        return null;
    }
}

/** The gate every non-essential script must sit behind. */
export function hasConsent() {
    return getConsent() === "granted";
}

/** For a "Cookie settings" link. Clears the choice and re-shows the banner. */
export function resetConsent() {
    try {
        localStorage.removeItem(KEY);
    } catch {
        /* storage blocked */
    }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: null }));
}

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);
    const root = useRef(null);

    useEffect(() => {
        const decide = () => setVisible(getConsent() === null);
        decide();

        // resetConsent() from a footer link has to bring the banner back without
        // a reload, so the same event that notifies analytics also re-runs this.
        window.addEventListener(EVENT, decide);
        return () => window.removeEventListener(EVENT, decide);
    }, []);

    useGSAP(
        () => {
            if (!visible || !root.current) return;
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            gsap.fromTo(
                root.current,
                { autoAlpha: 0, y: 24 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: reduced ? 0 : 0.55,
                    ease: "power3.out",
                    delay: reduced ? 0 : DELAY_MS / 1000,
                },
            );
        },
        { scope: root, dependencies: [visible] },
    );

    const choose = (value) => {
        try {
            localStorage.setItem(KEY, value);
        } catch {
            /* storage blocked; the banner will reappear next visit */
        }
        window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced || !root.current) {
            setVisible(false);
            return;
        }
        gsap.to(root.current, {
            autoAlpha: 0,
            y: 16,
            duration: 0.35,
            ease: "power3.in",
            onComplete: () => setVisible(false),
        });
    };

    if (!visible) return null;

    return (
        <div
            ref={root}
            // region, not dialog. A dialog implies focus is or should be moved
            // into it, and a non-modal banner that steals focus from the page
            // someone just arrived on is worse than the cookies. aria-live
            // announces it when it slides in without touching focus at all.
            role="region"
            aria-live="polite"
            aria-label="Cookie preferences"
            className="fixed bottom-4 left-4 z-90 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-(--line) bg-(--canvas) p-6 opacity-0 shadow-[0_18px_50px_-24px_rgb(0_0_0/0.35)] md:bottom-6 md:left-6"
        >
            <p className="text-[0.9375rem] leading-relaxed text-(--text)">
                We use cookies to understand how the site is used.
            </p>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-(--text-mute)">
                Nothing is loaded until you say yes, and you can change your mind later. See our{" "}
                <Link
                    href="/privacy"
                    className="text-(--text) underline decoration-(--line) underline-offset-4 transition-colors hover:decoration-(--text)"
                >
                    privacy policy
                </Link>
                .
            </p>

            {/* Equal weight on both buttons, deliberately. A filled "Accept" beside
          a faded "Decline" is a dark pattern, and it is the specific one
          regulators look for. */}
            <div className="mt-5 flex gap-2.5">
                <button
                    type="button"
                    onClick={() => choose("granted")}
                    className="flex-1 rounded-full border border-(--text) bg-(--text) px-5 py-2.5 text-sm font-medium text-(--canvas) transition-colors hover:bg-brand hover:border-brand hover:text-white"
                >
                    Accept
                </button>
                <button
                    type="button"
                    onClick={() => choose("denied")}
                    className="flex-1 rounded-full border border-(--line) px-5 py-2.5 text-sm font-medium text-(--text) transition-colors hover:border-(--text)"
                >
                    Decline
                </button>
            </div>
        </div>
    );
}
