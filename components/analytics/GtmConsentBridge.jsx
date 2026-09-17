"use client";

import { useEffect } from "react";
import { EVENT as CONSENT_EVENT } from "@/components/providers/CookieConsent";

/**
 * Turns a banner click into a Consent Mode update, live, with no reload.
 *
 * CookieConsent already dispatches `str-cookie-consent` on every decision —
 * Accept, Decline, and resetConsent() from a "Cookie settings" link (which
 * dispatches `detail: null`). This listens to exactly that event, so the
 * banner stays the single owner of the choice and this file never reads or
 * writes localStorage itself. One source of truth, one direction of flow.
 *
 * The initial state is not set here. It is set in the inline block in
 * GoogleTagManager, which runs before gtm.js — by the time this effect
 * mounts, the container has already loaded and the first ping has gone out.
 * Doing the first-paint read here instead would be a race, and it would be a
 * race that fails open.
 *
 * `ads_data_redaction` is flipped alongside ad_storage deliberately: with it
 * true and ad_storage denied, Google Ads redacts the ad click identifiers
 * from the cookieless pings. That is what makes a declined visit modellable
 * rather than merely uncounted.
 *
 * Route-change pageviews are NOT pushed from here. Next's App Router
 * navigates with history.pushState, which GTM's built-in History Change
 * trigger already observes — pushing our own page_view alongside it is how
 * you end up double-counting every soft navigation.
 */

const GRANTED = {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted",
    functionality_storage: "granted",
    personalization_storage: "granted",
};

const DENIED = {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
};

export default function GtmConsentBridge() {
    useEffect(() => {
        // gtag pushes the `arguments` object, not an array. GTM's consent API
        // reads it positionally and an array is not equivalent — this shim has
        // to be re-declared here rather than reaching for a global.
        const gtag = function () {
            window.dataLayer = window.dataLayer || [];
            // eslint-disable-next-line prefer-rest-params
            window.dataLayer.push(arguments);
        };

        const onChoice = (event) => {
            const granted = event.detail === "granted";
            gtag("consent", "update", granted ? GRANTED : DENIED);
            gtag("set", "ads_data_redaction", !granted);
        };

        window.addEventListener(CONSENT_EVENT, onChoice);
        return () => window.removeEventListener(CONSENT_EVENT, onChoice);
    }, []);

    return null;
}
