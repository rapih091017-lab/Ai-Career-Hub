import { Metadata } from "next";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import CareerHubPostList from "@/components/career-hub/CareerHubPostList";
import { db } from "@/db";
import { careerHubPosts } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Career Hub | AI Career Hub",
  description: "Panduan karier, CV, interview, skill, dan strategi mencari kerja untuk pencari kerja Indonesia.",
  alternates: { canonical: `${SITE_URL}/career-hub` },
};

export const dynamic = "force-dynamic";

export default async function CareerHubPage() {
  const [posts, [{ total }]] = await Promise.all([
    db.select({ id: careerHubPosts.id, slug: careerHubPosts.slug, title: careerHubPosts.title, excerpt: careerHubPosts.excerpt, coverImageUrl: careerHubPosts.coverImageUrl, category: careerHubPosts.category, tags: careerHubPosts.tags, publishedAt: careerHubPosts.publishedAt })
      .from(careerHubPosts).where(eq(careerHubPosts.status, "published")).orderBy(desc(careerHubPosts.publishedAt), desc(careerHubPosts.createdAt)).limit(12),
    db.select({ total: sql<number>`count(*)::int` }).from(careerHubPosts).where(eq(careerHubPosts.status, "published")),
  ]);
  return <div className="flex min-h-screen flex-col bg-background text-on-background"><AppHeader /><main className="flex-1 px-margin-mobile pb-16 pt-24 md:px-gutter"><div className="mx-auto max-w-[1100px]"><header className="mb-10 max-w-2xl"><p className="mb-3 text-label-sm font-semibold uppercase tracking-wide text-primary">Career Hub</p><h1 className="font-headline-lg text-4xl text-on-background">Panduan untuk langkah karier berikutnya</h1><p className="mt-3 text-body-lg text-on-surface-variant">Baca materi praktis tentang CV, interview, skill, dan cara mencari kerja dengan lebih terarah.</p></header><CareerHubPostList initialPosts={posts} initialTotal={total} /></div></main><AppFooter bordered /></div>;
}
