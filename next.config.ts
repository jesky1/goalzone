import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
<<<<<<< HEAD
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  allowedDevOrigins: [
    '.space-z.ai',
=======
  },
  allowedDevOrigins: [
    '.space-z.ai',
    'preview-chat-316c8979-28ce-4e36-98ce-563e2662d80c.space-z.ai',
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
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
