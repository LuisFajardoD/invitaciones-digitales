import type { NextConfig } from "next";
import legacyAssetPaths from "./lib/legacy-asset-paths.json";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return Object.entries(legacyAssetPaths).filter(([source, destination]) => source !== destination).map(([source, destination]) => ({ source, destination, permanent: false }));
  },
};

export default nextConfig;
