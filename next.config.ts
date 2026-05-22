import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@injectivelabs/sdk-ts",
    "@injectivelabs/networks",
    "@injectivelabs/ts-types",
  ],
};

export default nextConfig;
