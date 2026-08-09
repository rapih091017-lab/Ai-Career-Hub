import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { portfolioPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { THEMES, DEFAULT_THEME_ID } from "@/components/portfolio/themes";
import PublishedPortfolio from "@/components/portfolio/PublishedPortfolio";
import type { PortfolioData, SectionId } from "@/components/portfolio/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

/** Satu query per request — dipakai bersama generateMetadata & page (React cache). */
const getPublishedPortfolio = cache(async (slug: string) => {
  const [row] = await db
    .select({ slug: portfolioPages.slug, theme: portfolioPages.theme, data: portfolioPages.data })
    .from(portfolioPages)
    .where(eq(portfolioPages.slug, slug))
    .limit(1);
  return row ?? null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const row = await getPublishedPortfolio(slug);

  if (!row) return { title: "Portfolio tidak ditemukan" };

  const d = row.data as unknown as PortfolioData;
  const name = [d.formData?.heroFirstName, d.formData?.heroLastName].filter(Boolean).join(" ") || "Portfolio";
  return {
    title: `${name} | Portfolio`,
    description: d.formData?.heroBio || d.formData?.heroHeadline || `Portfolio ${name}`,
    openGraph: {
      title: `${name} | Portfolio`,
      description: d.formData?.heroBio || `Portfolio ${name}`,
      type: "website",
    },
  };
}

export default async function PublishedPortfolioPage({ params }: PageProps) {
  const { slug } = await params;
  const row = await getPublishedPortfolio(slug);

  if (!row) notFound();

  const d = row.data as unknown as PortfolioData & {
    sectionOrder?: SectionId[];
    sectionVisibility?: Record<SectionId, boolean>;
  };
  const theme = THEMES[row.theme] || THEMES[DEFAULT_THEME_ID];

  return (
    <>
      <link rel="stylesheet" href={theme.fontUrl} />
      <PublishedPortfolio
        data={d}
        themeId={row.theme}
        sectionOrder={d.sectionOrder}
        sectionVisibility={d.sectionVisibility}
      />
    </>
  );
}
