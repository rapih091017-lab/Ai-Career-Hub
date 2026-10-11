import { NextRequest, NextResponse } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { and, eq } from "drizzle-orm";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioDrafts } from "@/db/schema";
import PortfolioDocument from "@/components/portfolio/render/PortfolioDocument";
import { buildHtmlDocument, inlineAssets } from "@/lib/portfolio/export-html";
import { portfolioDataSchema } from "@/lib/portfolio/schema";
import { THEMES } from "@/components/portfolio/themes";
import type { ThemeId } from "@/components/portfolio/types";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const draftId = request.nextUrl.searchParams.get("draftId");
  if (!draftId) {
    return errorResponse("INVALID_BODY", "draftId wajib diisi", 400);
  }

  const [row] = await db
    .select({ data: portfolioDrafts.data, name: portfolioDrafts.name })
    .from(portfolioDrafts)
    .where(
      and(eq(portfolioDrafts.id, draftId), eq(portfolioDrafts.userId, auth.userId)),
    )
    .limit(1);

  if (!row) {
    return errorResponse("DRAFT_NOT_FOUND", "Draft tidak ditemukan", 404);
  }

  const parsed = portfolioDataSchema.safeParse(row.data);
  if (!parsed.success) {
    return errorResponse("INVALID_DATA", "Data draft rusak", 400);
  }

  const requested = request.nextUrl.searchParams.get("theme") ?? "glass";
  const themeId = (requested in THEMES ? requested : "glass") as ThemeId;

  const data = await inlineAssets(parsed.data, auth.userId);
  const markup = renderToStaticMarkup(
    createElement(PortfolioDocument, { data, themeId, mode: "static" }),
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
