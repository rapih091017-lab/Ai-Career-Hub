import { ImageResponse } from "next/og";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { portfolioPages } from "@/db/schema";
import { THEMES, DEFAULT_THEME_ID } from "@/components/portfolio/themes";
import type { PortfolioData } from "@/components/portfolio/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const [row] = await db
    .select({ theme: portfolioPages.theme, data: portfolioPages.data })
    .from(portfolioPages)
    .where(and(eq(portfolioPages.slug, slug), eq(portfolioPages.status, "published")))
    .limit(1);

  if (!row) return new Response("Not found", { status: 404 });

  const d = row.data as unknown as PortfolioData;
  const theme = THEMES[row.theme] || THEMES[DEFAULT_THEME_ID];
  const name = [d.formData?.heroFirstName, d.formData?.heroLastName].filter(Boolean).join(" ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: theme.colors.bg,
          color: theme.colors.text,
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: theme.colors.primary,
            marginBottom: 24,
          }}
        >
          Portfolio
        </div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, lineHeight: 1.05 }}>
          {name || "Portfolio"}
        </div>
        <div style={{ display: "flex", fontSize: 44, color: theme.colors.textSecondary, marginTop: 24 }}>
          {d.formData?.heroHeadline ?? ""}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            height: 8,
            width: 160,
            background: theme.colors.primary,
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
