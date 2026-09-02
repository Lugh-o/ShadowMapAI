import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@shadowmap/types", "@shadowmap/db", "@shadowmap/species-data"],
};

export default nextConfig;
