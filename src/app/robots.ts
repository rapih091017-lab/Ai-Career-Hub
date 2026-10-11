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
        allow: ["/", "/p/", "/career-hub/"],
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
