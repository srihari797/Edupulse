import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from localhost backend (for avatars / file previews)
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
    ],
  },
  // Strict mode for catching React issues early
  reactStrictMode: true,
};

export default nextConfig;
