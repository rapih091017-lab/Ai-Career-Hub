import type { MetadataRoute } from "next";

const BASE_URL = "https://aicareerhub.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: BASE_URL + "/dashboard", lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: BASE_URL + "/checker", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: BASE_URL + "/builder/new", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: BASE_URL + "/interview", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: BASE_URL + "/interview/practice", lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: BASE_URL + "/karir", lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: BASE_URL + "/portfolio", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: BASE_URL + "/portfolio/build", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: BASE_URL + "/portfolio/preview", lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: BASE_URL + "/portfolio/live", lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: BASE_URL + "/about", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: BASE_URL + "/faq", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: BASE_URL + "/blog", lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: BASE_URL + "/contact", lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: BASE_URL + "/privacy", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: BASE_URL + "/terms", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: BASE_URL + "/profile", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: BASE_URL + "/login", lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: BASE_URL + "/settings", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: BASE_URL + "/settings/profile", lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: BASE_URL + "/settings/billing", lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: BASE_URL + "/settings/security", lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: BASE_URL + "/settings/payment-history", lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}
