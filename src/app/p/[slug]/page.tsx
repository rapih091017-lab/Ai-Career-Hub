import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { portfolioPages } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { SITE_URL } from "@/lib/site-url";
import { THEMES, DEFAULT_THEME_ID } from "@/components/portfolio/themes";
import PortfolioDocument, {
  type PortfolioSectionColors,
  STATIC_REVEAL_FALLBACK_CSS,
} from "@/components/portfolio/render/PortfolioDocument";
import type {
  FontSize,
  PortfolioData,
  SectionId,
  SectionVisibility,
  ThemeId,
} from "@/components/portfolio/types";

import "@/app/portfolio/print.css";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ print?: string }>;
}

export const dynamic = "force-dynamic";

/**
 * Satu query per request, dipakai bersama generateMetadata & page (React cache).
 * Hanya `published` yang punya halaman: draft & archived harus 404 di URL publik,
 * kalau tidak fitur arsip dari Task 10 tidak berarti apa-apa.
 */
const getPublishedPortfolio = cache(async (slug: string) => {
  const [row] = await db
    .select({ slug: portfolioPages.slug, theme: portfolioPages.theme, data: portfolioPages.data })
    .from(portfolioPages)
    .where(and(eq(portfolioPages.slug, slug), eq(portfolioPages.status, "published")))
    .limit(1);
  return row ?? null;
});

type PortfolioSeo = PortfolioData & {
  seo?: { pageTitle?: string; metaDescription?: string; keywords?: string[] };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const row = await getPublishedPortfolio(slug);

  if (!row) return { title: "Portfolio tidak ditemukan" };

  const d = row.data as unknown as PortfolioSeo;
  const name = [d.formData?.heroFirstName, d.formData?.heroLastName].filter(Boolean).join(" ") || "Portfolio";
  const title = d.seo?.pageTitle?.trim() || `${name} | Portfolio`;
  const description =
    d.seo?.metaDescription?.trim() || d.formData?.heroBio || d.formData?.heroHeadline || `Portfolio ${name}`;

  return {
    title,
    description,
    keywords: d.seo?.keywords ?? [],
    alternates: { canonical: `${SITE_URL}/p/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "id_ID",
      images: [{ url: `${SITE_URL}/api/portfolio/og/${slug}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PublishedPortfolioPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const row = await getPublishedPortfolio(slug);

  if (!row) notFound();

  const d = row.data as unknown as PortfolioData & {
    sectionOrder?: SectionId[];
    sectionVisibility?: SectionVisibility;
    sectionColors?: PortfolioSectionColors;
    fontSize?: FontSize;
  };
  const theme = THEMES[row.theme] || THEMES[DEFAULT_THEME_ID];
  const printMode = query?.print === "1";

  return (
    <>
      <link rel="stylesheet" href={theme.fontUrl} />
      {printMode && (
        // @media print: @page + paksa section motion (inline opacity:0 dari
        // whileInView) terlihat saat cetak sebelum ter-scroll.
        <style media="print">{`@page { size: A4; margin: 12mm; } ${STATIC_REVEAL_FALLBACK_CSS}`}</style>
      )}
      <div data-pf-print={printMode ? "true" : undefined}>
        <PortfolioDocument
          data={d}
          themeId={row.theme as ThemeId}
          mode="static"
          sectionOrder={d.sectionOrder}
          sectionVisibility={d.sectionVisibility}
          fontSize={d.fontSize ?? "medium"}
          sectionColors={d.sectionColors ?? null}
        />
      </div>
      <footer
        data-pf-print-hidden={printMode ? "true" : undefined}
        className="text-center py-8"
        style={{
          color: theme.colors.textMuted,
          borderTop: `1px solid ${theme.colors.border}`,
          fontSize: 13,
        }}
      >
        &copy; {new Date().getFullYear()}{" "}
        {[d.formData?.heroFirstName, d.formData?.heroLastName].filter(Boolean).join(" ") || "Nama Lengkap"}
        . Dibuat dengan AI Career Hub
      </footer>
    </>
  );
}
