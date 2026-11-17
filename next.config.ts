import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Logos e banners dos parceiros sobem por server action (até 3 MB cada)
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
