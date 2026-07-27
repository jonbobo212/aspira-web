import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tenant sites are resolved per-hostname in src/proxy.ts — everything is
  // dynamic; no static params. Images come from Supabase Storage.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "mywdtmimiazeyhfdtqlw.supabase.co" },
    ],
  },
};

export default nextConfig;
