import { NextRequest, NextResponse } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { and, desc, eq } from "drizzle-orm";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioDrafts } from "@/db/schema";
import PortfolioDocument from "@/components/portfolio/render/PortfolioDocument";
import { alignmentToSectionStyle } from "@/components/portfolio/alignment-style";
import { buildHtmlDocument, inlineAssets } from "@/lib/portfolio/export-html";
import { portfolioDataSchema } from "@/lib/portfolio/schema";
import { THEMES } from "@/components/portfolio/themes";
import type { SectionId, ThemeId } from "@/components/portfolio/types";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const draftId = request.nextUrl.searchParams.get("draftId");
  const where = draftId
    ? and(eq(portfolioDrafts.id, draftId), eq(portfolioDrafts.userId, auth.userId))
    : eq(portfolioDrafts.userId, auth.userId);

  const [row] = await db
    .select({ data: portfolioDrafts.data, name: portfolioDrafts.name })
    .from(portfolioDrafts)
    .where(where)
    .orderBy(desc(portfolioDrafts.updatedAt))
    .limit(1);

  if (!row) {
    return errorResponse("DRAFT_NOT_FOUND", "Draft tidak ditemukan", 404);
  }

  const parsed = portfolioDataSchema.safeParse(row.data);
  if (!parsed.success) {
    return errorResponse("INVALID_DATA", "Data draft rusak", 400);
  }

  const requested = request.nextUrl.searchParams.get("theme") ?? "glass";
  // Object.hasOwn, bukan `in`: `?theme=__proto__` lolos operator `in` lalu
  // membuat THEMES[themeId].colors melempar saat runtime.
  const themeId = (Object.hasOwn(THEMES, requested) ? requested : "glass") as ThemeId;

  const data = await inlineAssets(parsed.data, auth.userId);
  const markup = renderToStaticMarkup(
    createElement(PortfolioDocument, {
      data,
      themeId,
      mode: "static",
      // sectionOrder datang dari jsonb sebagai string; resolveOrder di dalam
      // PortfolioDocument membuang id yang tidak dikenal saat runtime.
      sectionOrder: parsed.data.sectionOrder as SectionId[] | undefined,
      sectionVisibility: parsed.data.sectionVisibility,
      // fontSize sudah bagian portfolioDataSchema, jadi round-trip dari draft.
      fontSize: parsed.data.fontSize,
      sectionStyle: alignmentToSectionStyle(
        parsed.data.alignment as Record<string, "left" | "center" | "right"> | undefined,
      ),
    }),
  );
  const html = buildHtmlDocument(markup, themeId, row.name);

  const filename = `${(row.name || "portfolio")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
