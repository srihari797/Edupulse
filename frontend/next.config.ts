import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from backend (both local dev and deployed Render backend)
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "https",
        hostname: "edupulse-school-hackathon.onrender.com",
        port: "",
      },
    ],
  },
  // Strict mode for catching React issues early
  reactStrictMode: true,
};

export default nextConfig;
