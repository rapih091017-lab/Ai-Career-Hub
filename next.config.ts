import type { NextConfig } from "next";

let nextConfig: NextConfig = {
  serverExternalPackages: ["postgres", "pdfjs-dist"],

  // Optimasi gambar: remotePatterns untuk CDN eksternal
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        pathname: "/gh/devicons/devicon/**",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
        pathname: "/api/portraits/**",
      },
    ],
    // Format modern: AVIF lebih kecil dari WebP
    formats: ["image/avif", "image/webp"],
    // Device sizes untuk responsive images
    deviceSizes: [480, 640, 768, 1024, 1280, 1536],
  },

  // Optimasi build
  compress: true,

  // Skip ESLint saat build — TypeScript sudah handle type checking
  // Fix Vercel ESLint patch compatibility
  eslint: {
    ignoreDuringBuilds: true,
  },
};

// Bundle analyzer: ANALYZE=true npm run build
if (process.env.ANALYZE === "true") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: true,
  });
  nextConfig = withBundleAnalyzer(nextConfig);
}

export default nextConfig;
