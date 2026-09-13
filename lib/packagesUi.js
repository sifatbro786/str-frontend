/**
 * lib/packagesUi.js — the bilingual *chrome* of /packages, and the number
 * formatting behind it.
 *
 * ── CONTENT IS IN THE DATABASE. THIS IS NOT CONTENT. ─────────────────────
 * Prices, tier names, feature copy, the essentials band and the closing CTA
 * all live in Mongo and are edited at /admin/packages. What is here is the
 * interface around them: "From", "You save", "Recommended", "Visit site", the
 * breadcrumb, the spec-row labels. The split is deliberate and the test is
 * simple — could an editor empty this string and leave the page broken rather
 * than merely emptier? "From" next to a figure is load-bearing; a price is
 * not. Anything load-bearing belongs in code.
 *
 * It is also why there is no `getPackagesUi()` — these strings never travel
 * over the wire, they are in the bundle, and switching language costs nothing.
 *
 * ⚑ Adding a locale means a third block here AND a third sub-document on the
 * two backend models. Adding it here alone gives you a tab that renders
 * English content under Bengali chrome.
 */

export const LOCALES = ["en", "bn"];
export const DEFAULT_LOCALE = "en";

/** Query-string key that carries the locale, e.g. /packages?lang=bn. */
export const LOCALE_PARAM = "lang";

export const isLocale = (value) => LOCALES.includes(value);

/** Anything unrecognised — absent, "EN", "fr", an array — falls back to English. */
export const coerceLocale = (value) => (isLocale(value) ? value : DEFAULT_LOCALE);

/** BCP-47 tags, for <html lang>-style attributes and hreflang alternates. */
export const HTML_LANG = { en: "en", bn: "bn-BD" };

export const PACKAGES_UI = {
    en: {
        /* Each entry names the OTHER locale, because this is a switch and the
           button says where it takes you, not where you are. */
        switchTo: "বাংলা",
        switchAriaLabel: "Read this page in Bengali",
        localeName: "English",

        breadcrumbHome: "Home",
        breadcrumbSelf: "Packages",

        tracksLabel: "Package tracks",
        tracksHeading: "Pick a track.",
        tracksLede:
            "Four ways to build the same thing, priced separately because they are not the same job. Every figure is a fixed scope in taka.",

        from: "From",
        off: "off",
        listPrice: "List price",
        save: "You save",
        oneTime: "One-time project",
        customScope: "Custom scope",
        recommended: "Recommended",
        chooseCta: "Choose this package",

        workTitle: "Selected work",
        workLabel: "Shipped",
        workSubtitle: "A few of the products we have shipped for brands at home and abroad.",
        groups: { custom: "Custom development", "wp-shopify": "WordPress & Shopify" },
        visit: "Visit site",

        essentialsLabel: "Included",

        /* The masthead spec row. Values are counted from the data, never
           written by hand — a prose claim about the catalogue stops being true
           the first time the catalogue changes and nothing tells you. */
        meta: {
            tracks: "Tracks",
            packages: "Packages",
            currency: "Currency",
            billing: "Billing",
        },
        currencyValue: "BDT (৳)",
        billingValue: "Fixed scope, one-time",

        emptyState: "No packages are published yet.",
    },

    bn: {
        switchTo: "English",
        switchAriaLabel: "এই পেজটি ইংরেজিতে পড়ুন",
        localeName: "বাংলা",

        breadcrumbHome: "হোম",
        breadcrumbSelf: "প্যাকেজ",

        tracksLabel: "প্যাকেজ ট্র্যাক",
        tracksHeading: "একটি ট্র্যাক বেছে নিন।",
        tracksLede:
            "একই জিনিস বানানোর চারটি পথ — আলাদা দাম, কারণ কাজগুলোও আলাদা। প্রতিটি দাম টাকায় ফিক্সড স্কোপ।",

        from: "শুরু",
        off: "ছাড়",
        listPrice: "আগের দাম",
        save: "সাশ্রয়",
        oneTime: "এককালীন প্রজেক্ট",
        customScope: "কাস্টম স্কোপ",
        recommended: "সবচেয়ে জনপ্রিয়",
        chooseCta: "এই প্যাকেজ নিন",

        workTitle: "আমাদের কিছু কাজ",
        workLabel: "ডেলিভারড",
        workSubtitle: "দেশ-বিদেশের ব্র্যান্ডের জন্য আমরা যা কিছু ডেলিভার করেছি, তার কয়েকটি।",
        groups: { custom: "কাস্টম ডেভেলপমেন্ট", "wp-shopify": "WordPress ও Shopify" },
        visit: "সাইট দেখুন",

        essentialsLabel: "অন্তর্ভুক্ত",

        meta: {
            tracks: "ট্র্যাক",
            packages: "প্যাকেজ",
            currency: "কারেন্সি",
            billing: "বিলিং",
        },
        currencyValue: "টাকা (৳)",
        billingValue: "ফিক্সড স্কোপ, এককালীন",

        emptyState: "এখনো কোনো প্যাকেজ প্রকাশ করা হয়নি।",
    },
};

/* ── Numbers ──────────────────────────────────────────────────────────────
   ⚑ WHY THE DIGITS ARE MAPPED BY HAND INSTEAD OF new Intl.NumberFormat("bn-BD")

   That constructor is the obvious answer and it is a hydration bug waiting to
   happen. The page is server-rendered in Node and then hydrated in a browser,
   and the two do not always ship the same ICU data: a Node build without
   full-icu, or an older mobile browser, returns Latin digits where the other
   returns Bengali ones. React then finds server HTML that does not match the
   client render, warns, and re-renders the subtree — on the largest text on
   the page.

   Grouping through "en-IN" is the part Intl does identically everywhere (and
   it is the correct 2-2-3 lakh grouping for both locales); the digit
   substitution is a ten-entry lookup that cannot differ between environments.
   ──────────────────────────────────────────────────────────────────────── */

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

const grouper = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** "৳৪০,৫০০" in bn, "৳40,500" in en. Non-finite input renders nothing. */
export function formatTaka(amount, locale = DEFAULT_LOCALE) {
    if (typeof amount !== "number" || !Number.isFinite(amount)) return "";
    const grouped = grouper.format(amount);
    return `৳${locale === "bn" ? toBengaliDigits(grouped) : grouped}`;
}

/** Digit substitution only — separators and everything else pass through. */
export function toBengaliDigits(value) {
    return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** Locale-aware plain integer, for the "12 packages" spec row. */
export function formatCount(n, locale = DEFAULT_LOCALE) {
    const s = String(n ?? 0);
    return locale === "bn" ? toBengaliDigits(s) : s;
}

/**
 * Whole-percent discount, or 0 when there is nothing to show.
 *
 * Guards `original <= amount` as well as the missing case: the backend
 * validator rejects that combination on write, but a row seeded before the
 * validator existed would otherwise render "-12% off" on a live rate card.
 */
export function discountPercent(amount, original) {
    if (typeof amount !== "number" || typeof original !== "number") return 0;
    if (!Number.isFinite(amount) || !Number.isFinite(original)) return 0;
    if (original <= amount || amount < 0) return 0;
    return Math.round((1 - amount / original) * 100);
}

/** "https://www.paarel.com/" → "paarel.com". Never throws. */
export function hostOf(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return String(url ?? "")
            .replace(/^https?:\/\//i, "")
            .replace(/^www\./, "")
            .replace(/\/.*$/, "");
    }
}
