import type { NextConfig } from "next";
import { loadEnvDir } from "./lib/load-env-dir";

loadEnvDir();

const nextConfig: NextConfig = {
  // Separate build dirs so marketing (3000) and customer (4000) can run together.
  distDir: process.env.NEXT_DIST_DIR || ".next",
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
