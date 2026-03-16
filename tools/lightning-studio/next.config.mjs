const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const isStaticExport = process.env.STATIC_EXPORT === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  output: isStaticExport ? "export" : "standalone",
  trailingSlash: isStaticExport,
  images: {
    unoptimized: true
  },
  experimental: {
    optimizePackageImports: ["lucide-react"]
  }
};

export default nextConfig;
