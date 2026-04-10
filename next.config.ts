import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      canvas: false,
    };

    return config;
  },
  turbopack: {
    resolveAlias: {
      canvas: path.resolve(process.cwd(), "utils/empty.js"),
    },
  },
};

export default nextConfig;
