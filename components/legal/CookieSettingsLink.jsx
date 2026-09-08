"use client";

import { resetConsent } from "@/components/providers/CookieConsent";

/**
 * "Cookie settings" — the revocation route CookieConsent's header comment
 * asks for. Clears the stored choice and re-shows the banner, which is what
 * makes the consent withdrawable rather than a one-way door.
 *
 * A <button>, not a link: it performs an action on this page, it goes
 * nowhere, and a screen reader should not announce it as navigation.
 *
 * Its own tiny island so LegalDocument stays a server component — this is the
 * only interactive element on either legal page.
 */
export default function CookieSettingsLink() {
    return (
        <button
            type="button"
            onClick={resetConsent}
            className="cursor-pointer transition-colors hover:text-(--text)"
        >
            Cookie settings
        </button>
    );
}
