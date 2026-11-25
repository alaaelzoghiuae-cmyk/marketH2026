import type { NextConfig } from "next";

// The ELZOGHBI storefront (Vite build of /marketH2026) is served from /public/site
// and mapped onto the site root so the preview matches production URLs.
const staticFiles = [
  "favicon.svg",
  "karambo.png",
  "elzoghbi-emblem.webp",
  "elzoghbi-logo-full.webp",
  "robots.txt",
  "sitemap.xml",
];

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/site/index.html" },
        { source: "/assets/:path*", destination: "/site/assets/:path*" },
        ...staticFiles.map((f) => ({ source: `/${f}`, destination: `/site/${f}` })),
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
