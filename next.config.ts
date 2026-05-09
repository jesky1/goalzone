import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    '.space-z.ai',
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
