import type { NextConfig } from "next";
import { loadEnvDir } from "./lib/load-env-dir";

loadEnvDir();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
