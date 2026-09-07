/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Add production asset/CDN hosts here as the project grows.
      { protocol: "https", hostname: "strsltd.com" },
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
  async headers() {
    return [
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
