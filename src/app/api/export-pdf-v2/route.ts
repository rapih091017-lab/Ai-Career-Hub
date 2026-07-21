import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { errorResponse, apiHandler, checkQuota, logUsage } from "@/lib/api-utils";

/**
 * POST /api/export-pdf-v2
 *
 * Client-side PDF export via Puppeteer server.
 * - Free users: checked against pdf_export quota (2x/bln)
 * - Premium users: unlimited
 * - Returns ATS-readable, text-selectable PDF (not image-based)
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

  // ── 1. Check quota ──
  const quotaCheck = await checkQuota(userId, "pdf_export");
  if (quotaCheck instanceof NextResponse) {
    return quotaCheck; // Forward the 403 response
  }

  // ── 2. Call Puppeteer PDF server ──
  const pdfServerUrl =
    process.env.PDF_SERVER_URL || "http://127.0.0.1:3001";

  try {
    const pdfResponse = await fetch(`${pdfServerUrl}/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        margin: margin || "20mm",
        fileName: fileName || "CV.pdf",
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!pdfResponse.ok) {
      const errText = await pdfResponse.text();
      console.error("[export-pdf-v2] PDF server error:", errText);
      return errorResponse("PDF_SERVER_ERROR", "Gagal generate PDF di server", 502);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // ── 3. Log usage ──
    await logUsage(userId, "pdf_export", fileName || undefined);

    // ── 4. Return PDF ──
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName || "CV.pdf")}"`,
        "Content-Length": String(pdfBuffer.byteLength),
      },
    });
  } catch (error: any) {
    console.error("[export-pdf-v2] Error:", error.message);

    // Check if PDF server is unreachable
    if (error.name === "AbortError" || error.code === "ECONNREFUSED") {
      return errorResponse(
        "PDF_SERVER_UNREACHABLE",
        "Server PDF sedang tidak tersedia. Silakan coba lagi nanti atau gunakan ekspor standar.",
        503
      );
    }

    return errorResponse("PDF_SERVER_ERROR", "Gagal terhubung ke server PDF", 500);
  }
});
