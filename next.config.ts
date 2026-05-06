import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-16b6ac0f-8500-4f4f-9595-232f3a8faeef.space-z.ai",
  ],
};

export default nextConfig;
