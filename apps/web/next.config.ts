import type { NextConfig } from "next";

// Em GitHub Pages de projeto o site fica em /<repositorio>/. Localmente e em
// outros hosts (Cloudflare, Netlify, domínio próprio) a variável fica vazia.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  transpilePackages: ["@shadowmap/types"],
};

export default nextConfig;
