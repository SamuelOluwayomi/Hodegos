import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@injectivelabs/sdk-ts",
    "@injectivelabs/networks",
  ],
};

export default nextConfig;
