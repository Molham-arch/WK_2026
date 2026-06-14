import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.31.5"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
      {
        protocol: "https",
        hostname: "media.api-sports.io",
      },
    ],
  },
};

export default nextConfig;
