import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    const assetCacheHeaders = [
      { key: "Cache-Control", value: "public, max-age=60, stale-while-revalidate=86400" },
    ];

    return ["/hero/:path*", "/models/:path*", "/projects/:path*", "/textures/:path*"].map((source) => ({
      source,
      headers: assetCacheHeaders,
    }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
