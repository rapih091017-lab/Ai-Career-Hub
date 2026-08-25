import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { errorResponse, apiHandler, checkQuota, logUsage } from "@/lib/api-utils";

export const runtime = "nodejs";
// Cold start: ekstraksi binary Chromium + launch butuh waktu. Warm: ~2-4s.
export const maxDuration = 60;

/**
 * POST /api/export-pdf-v2
 *
 * Server-side PDF generation via headless Chromium (puppeteer-core +
 * @sparticuz/chromium) — jalan LANGSUNG di Vercel serverless,
 * tanpa server Puppeteer terpisah (Railway).
 *
 * - Free users: checked against pdf_export quota (2x/bln)
 * - Premium users: unlimited
 * - Returns ATS-readable, text-selectable PDF (bukan gambar)
 *
 * Body: { html: string, margin?: string, fileName?: string }
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("AUTH_REQUIRED", "Harus login untuk download PDF", 401);
  }

  const userId = session.user.id;
  const body = await request.json();
  const { html, margin, fileName } = body;

  if (!html || typeof html !== "string") {
    return errorResponse("INVALID_INPUT", "Field 'html' required", 400);
  }
  if (html.length > 5_000_000) {
    return errorResponse("INVALID_INPUT", "HTML terlalu besar", 413);
  }

  // ── 1. Check quota ──
  const quotaCheck = await checkQuota(userId, "pdf_export");
  if (quotaCheck instanceof NextResponse) {
    return quotaCheck; // Forward the 403 response
  }

  // ── 2. Render HTML → PDF via lokal headless Chromium ──
  try {
    const [{ default: puppeteer }, chromiumMod] = await Promise.all([
      import("puppeteer-core"),
      import("@sparticuz/chromium"),
    ]);
    const chromium = chromiumMod.default;

    const browser = await puppeteer.launch({
      args: [...chromium.args, "--font-render-hinting=none"],
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    try {
      const page = await browser.newPage();

      // setContent lebih andal daripada goto(data:) untuk HTML besar.
      // "load": tunggu resource sinkron; webfont diverifikasi lewat document.fonts.ready.
      await page.setContent(html, {
        waitUntil: "load",
        timeout: 45_000,
      });

      // Pastikan webfont benar-benar siap sebelum print
      await page.evaluate(() => document.fonts.ready);

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: parseMargin(margin),
        preferCSSPageSize: false,
      });

      // ── 3. Log usage (kegagalan logging jangan sampai menggagalkan PDF yang sudah jadi) ──
      try {
        await logUsage(userId, "pdf_export", fileName || undefined);
      } catch (logErr) {
        console.error("[export-pdf-v2] logUsage failed:", logErr instanceof Error ? logErr.message : logErr);
      }

      // ── 4. Return PDF ──
      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName || "CV.pdf")}"`,
          "Content-Length": String(pdfBuffer.byteLength ?? pdfBuffer.length ?? 0),
        },
      });
    } finally {
      // Selalu tutup browser — di serverless instance menggantung = memori bocor
      await browser.close().catch(() => {});
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[export-pdf-v2] Chromium render error:", message);
    return errorResponse(
      "PDF_SERVER_ERROR",
      "Gagal menghasilkan PDF di server. Coba lagi atau gunakan ekspor standar.",
      500
    );
  }
});

/** Parse margin string ("20mm" | "10mm") → page.pdf margin object. */
function parseMargin(margin?: string): {
  top: string; bottom: string; left: string; right: string;
} {
  const m = /^\s*(\d+(?:\.\d+)?)\s*(mm|cm|in|px)?\s*$/.exec(margin || "");
  const value = m ? `${m[1]}${m[2] || "mm"}` : "20mm";
  return { top: value, bottom: value, left: value, right: value };
}
