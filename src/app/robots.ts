import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * robots.txt yang dihasilkan:
 * Allow: /p/
 * Disallow: /portfolio/build
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Longest-match menang: /api/portfolio/assets/ mengalahkan Disallow /api/
        // supaya gambar portfolio tetap bisa di-crawl.
        allow: ["/", "/p/", "/career-hub/", "/api/portfolio/assets/"],
        disallow: [
          "/api/",
          "/portfolio/build",
          "/portfolio/live",
          "/portfolio/preview",
          "/dashboard",
          "/settings",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
