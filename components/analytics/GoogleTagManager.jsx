import Script from "next/script";
import { KEY as CONSENT_KEY } from "@/components/providers/CookieConsent";
import GtmConsentBridge from "./GtmConsentBridge";

/**
 * Google Tag Manager, gated by Consent Mode v2.
 *
 * ── WHY NOT THE RAW SNIPPET IN <head> ────────────────────────────────────
 * The container itself is not the privacy question — the tags inside it are,
 * and the marketer can add one at any time without touching this repo. So the
 * gate has to live at the storage layer, not at the script layer: GTM loads,
 * but every storage category starts denied, and nothing that writes a cookie
 * or an identifier can fire until the visitor accepts. That is Consent Mode.
 *
 * The payoff over simply not loading GTM: a visitor who declines still sends
 * cookieless pings, so Google can model the conversions we lose. Declining
 * costs the visitor nothing and costs us less than silence.
 *
 * ── ORDERING IS THE WHOLE GAME ⚑ ─────────────────────────────────────────
 * `gtag('consent','default',…)` MUST execute before gtm.js does, or tags fire
 * once unconsented before the default lands — which is the exact violation the
 * banner exists to prevent. Two things guarantee that here:
 *
 *   1. The default block is a plain inline <script>, not next/script. It runs
 *      during HTML parse, synchronously, before hydration exists.
 *   2. The loader is next/script `afterInteractive`, which Next injects only
 *      after hydration. Parse always precedes hydration, so the order holds.
 *
 * `beforeInteractive` is NOT an option here: in the App Router it is only
 * honoured in app/layout.js, and this component mounts in the (public) group
 * so /admin and /login never load a marketing tag at all.
 *
 * ── WHY THE localStorage READ IS IN THE INLINE BLOCK ─────────────────────
 * A returning visitor who already accepted should not eat the 500ms
 * `wait_for_update` stall, and should not have a denied ping recorded first.
 * Reading the stored choice here — before gtm.js — upgrades consent in the
 * same parse tick. Live changes (Accept / Decline / Cookie settings) are the
 * bridge component's job; this block only handles the already-decided case.
 *
 * ── WHY noscript IS NOT DIRECTLY AFTER <body> ────────────────────────────
 * Google's instructions say "immediately after the opening <body> tag". That
 * placement is a convention, not a requirement — the iframe only has to be
 * inside <body>, and GTM reads it wherever it sits. Keeping it beside the
 * loader is what lets the whole integration be one component that /admin can
 * opt out of by simply not rendering it.
 */

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

const CONSENT_DEFAULT = `
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{
ad_storage:'denied',
ad_user_data:'denied',
ad_personalization:'denied',
analytics_storage:'denied',
functionality_storage:'denied',
personalization_storage:'denied',
security_storage:'granted',
wait_for_update:500
});
gtag('set','ads_data_redaction',true);
gtag('set','url_passthrough',true);
try{
if(localStorage.getItem(${JSON.stringify(CONSENT_KEY)})==='granted'){
gtag('consent','update',{
ad_storage:'granted',
ad_user_data:'granted',
ad_personalization:'granted',
analytics_storage:'granted',
functionality_storage:'granted',
personalization_storage:'granted'
});
gtag('set','ads_data_redaction',false);
}
}catch(e){}
`;

const GTM_LOADER = `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
`;

export default function GoogleTagManager() {
    // No ID configured (local dev, preview, a fork) means no container, no
    // consent shim, no noscript frame. Nothing half-mounted.
    if (!GTM_ID) return null;

    return (
        <>
            <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT }} />
            <Script
                id="gtm-loader"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: GTM_LOADER }}
            />
            <noscript>
                <iframe
                    src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                    height="0"
                    width="0"
                    style={{ display: "none", visibility: "hidden" }}
                    title="Google Tag Manager"
                />
            </noscript>
            <GtmConsentBridge />
        </>
    );
}
