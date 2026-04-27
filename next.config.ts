import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
    preloadEntriesOnStart: false,
    webpackMemoryOptimizations: true,
  },
};

export default nextConfig;
