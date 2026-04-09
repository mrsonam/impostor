import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Workaround: Next.js 15.4+ can fail to decode valid local PNGs in the image
  // optimizer ("isn't a valid image ... received null"). See vercel/next.js#84187.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
