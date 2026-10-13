import type { MetadataRoute } from "next";
import { CV_EXAMPLES_EN } from "@/data/cv-examples-en";
import { SITE_URL } from "@/lib/site-url";
import { db } from "@/db";
import { careerPaths, careerHubPosts, portfolioPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CV_EXAMPLES } from "@/data/cv-examples";
import { getInterviewPositions } from "@/data/interview-questions";

const BASE_URL = SITE_URL;
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const interviewPositions = getInterviewPositions("id").map((position) => ({
    url: `${BASE_URL}/interview/${position.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const cvExamples = CV_EXAMPLES.map((example) => ({
    url: `${BASE_URL}/contoh-cv/${example.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const cvExamplesEn = CV_EXAMPLES_EN.map((example) => ({
    url: `${BASE_URL}/cv-examples/${example.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Jalur karier dari database; kegagalan query tidak boleh mematikan sitemap.
  let careerPathEntries: MetadataRoute.Sitemap = [];
  let careerHubEntries: MetadataRoute.Sitemap = [];
  try {
    const rows = await db
      .select({ slug: careerPaths.slug })
      .from(careerPaths)
      .where(eq(careerPaths.isPublished, true));
    careerPathEntries = rows.map((row) => ({
      url: `${BASE_URL}/career-path/${row.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {}

  try {
    const rows = await db.select({ slug: careerHubPosts.slug, updatedAt: careerHubPosts.updatedAt })
      .from(careerHubPosts).where(eq(careerHubPosts.status, "published"));
    careerHubEntries = rows.map((row) => ({
      url: `${BASE_URL}/career-hub/${row.slug}`,
      lastModified: row.updatedAt ?? new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {}

  let portfolioEntries: MetadataRoute.Sitemap = [];
  try {
    const rows = await db
      .select({ slug: portfolioPages.slug, updatedAt: portfolioPages.updatedAt })
      .from(portfolioPages)
      .where(eq(portfolioPages.status, "published"));
    portfolioEntries = rows.map((row) => ({
      url: `${BASE_URL}/p/${row.slug}`,
      lastModified: row.updatedAt ?? new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {}

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: BASE_URL + "/checker", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: BASE_URL + "/interview", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: BASE_URL + "/interview/practice", lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: BASE_URL + "/karir", lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: BASE_URL + "/portfolio", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: BASE_URL + "/about", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: BASE_URL + "/faq", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: BASE_URL + "/blog", lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: BASE_URL + "/contact", lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: BASE_URL + "/privacy", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: BASE_URL + "/terms", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: BASE_URL + "/contoh-cv", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: BASE_URL + "/sinonim", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: BASE_URL + "/cv-examples", lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: BASE_URL + "/career-hub", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: BASE_URL + "/career-path", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    ...interviewPositions,
    ...cvExamples,
    ...cvExamplesEn,
    ...careerPathEntries,
    ...careerHubEntries,
    ...portfolioEntries,
  ];
}
