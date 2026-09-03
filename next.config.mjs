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
  },
};

export default nextConfig;
