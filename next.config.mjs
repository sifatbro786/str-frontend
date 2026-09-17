/**
 * Service, project and team artwork is uploaded to the API host and served
 * from its /uploads mount, so that host has to be a remotePattern or
 * next/image refuses it with "hostname is not configured".
 *
 * Derived from NEXT_PUBLIC_API_URL rather than hardcoded, because this value
 * differs per environment (localhost in dev, Render in production, a custom
 * domain later) and a hardcoded list means images silently stop rendering on
 * whichever environment was forgotten. A malformed or missing env var yields
 * no pattern rather than throwing: the build still succeeds and only remote
 * images fail, which is the better failure for a CI box with no env file.
 */
const apiHost = (() => {
    try {
        const { protocol, hostname, port } = new URL(process.env.NEXT_PUBLIC_API_URL);
        return [{ protocol: protocol.replace(":", ""), hostname, port, pathname: "/uploads/**" }];
    } catch {
        return [];
    }
})();

/**
 * ── THE INVISIBLE-SITE GUARD ⚑ ───────────────────────────────────────────
 * app/robots.js serves `Disallow: /` unless NEXT_PUBLIC_SITE_ENV is exactly
 * "production". That default is the right way round — a staging deploy that
 * competes with the live domain takes weeks to clear out of the index — but
 * its failure mode is silent and total: forget the variable on the live host
 * and the site still builds, still serves, still looks perfect, and is simply
 * absent from Google. Nothing reports it, because nothing is broken.
 *
 * So a production build with the variable entirely unset fails here instead.
 * An explicit value other than "production" passes untouched: that is someone
 * choosing a staging build, which is a decision rather than an oversight.
 *
 * ⚑ NEXT_PUBLIC_* is inlined at BUILD time. Exporting it in the shell that
 * runs `next start`, or adding it to a process manager's runtime env, does
 * nothing at all — it has to be present for `next build`.
 */
if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SITE_ENV === undefined) {
    throw new Error(
        "NEXT_PUBLIC_SITE_ENV is unset for a production build.\n" +
            "  Live host        NEXT_PUBLIC_SITE_ENV=production   robots.txt allows crawling\n" +
            "  Staging/preview  NEXT_PUBLIC_SITE_ENV=staging      robots.txt blocks everything\n" +
            "Set it before `next build` — NEXT_PUBLIC_* values are inlined at build time.",
    );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,

    images: {
        formats: ["image/avif", "image/webp"],
        remotePatterns: [
            // Add production asset/CDN hosts here as the project grows.
            { protocol: "https", hostname: "strsltd.com" },
            ...apiHost,
        ],
        /* Default is a 60 second cache on optimised output, which means the CDN
       re-optimises the same case-study screenshot every minute for no reason.
       These files are content-addressed by path and change only on deploy. */
        minimumCacheTTL: 60 * 60 * 24 * 30,
    },

    experimental: {
        /* Barrel-file imports pull the whole package's module graph into the
       client bundle before tree-shaking gets a chance. gsap is the one that
       matters here: lib/gsap re-exports eleven plugins, and every component
       importing { gsap } from it was dragging the lot. */
        optimizePackageImports: ["gsap", "@gsap/react", "react-simple-maps"],
    },

    /* Long-lived immutable caching for the two things that are hashed by build
     and were otherwise being revalidated on every navigation. Next sets this
     for _next/static already; world-atlas ships as a plain JSON import so it
     lands in the JS bundle and inherits it too. This block is for /public. */
    /* Legal pages get linked from old footers, email signatures and PDFs under
     names we never used. One hop to the canonical path is cheaper than a 404
     that someone reports as a broken privacy link six months from now. */
    async redirects() {
        return [
            /* ⚑ /overview is deliberately NOT redirected here. It is a live
               route rendering the same page as /packages, because that address
               went out to clients by email. See app/(public)/overview/page.js.
               No other legacy path needs an entry — the only other one that
               ever existed carried no traffic and was dropped. */
            { source: "/privacy-policy", destination: "/privacy", permanent: true },
            { source: "/terms-of-service", destination: "/terms", permanent: true },
            { source: "/terms-and-conditions", destination: "/terms", permanent: true },
        ];
    },

    async headers() {
        return [
            /* Baseline security headers. Deliberately NOT a full CSP: this site
           runs GSAP, which writes inline styles on almost every element, so a
           useful style-src would need either 'unsafe-inline' (worthless) or a
           nonce threaded through the smoother — real work, and worth doing
           deliberately rather than as a deploy-day afterthought. The five
           below are the ones that cost nothing and break nothing.

           HSTS is set here rather than left to the host so it survives a move
           off Vercel. Note `preload`: submitting to the preload list is a
           one-way door for the apex domain and every subdomain, so leave the
           domain unsubmitted until that is intended. */
            {
                source: "/:path*",
                headers: [
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "X-Frame-Options", value: "DENY" },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=(), payment=()",
                    },
                ],
            },
            {
                source: "/:all*(svg|jpg|jpeg|png|webp|avif|woff2)",
                headers: [
                    {
                        key: "Cache-Control",
                        // Public assets in /public are not content-hashed, so they get a
                        // day of freshness plus a week of stale-while-revalidate rather
                        // than `immutable`. Renaming on change is the correct fix if these
                        // ever need to be truly immutable.
                        value: "public, max-age=86400, stale-while-revalidate=604800",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
