import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pg",
    "pg-cloudflare",
    "@prisma/adapter-pg",
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
  ],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
