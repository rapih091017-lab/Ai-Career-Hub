import { ocrImage } from "@/lib/ocr";

/**
 * Coba ekstrak teks dari PDF menggunakan pdfjs-dist.
 * Return { text, errorType, errorDetail }.
 * errorType: null | "SCANNED" | "PASSWORD" | "CORRUPT" | "UNKNOWN"
 */
async function extractPdfWithPdfjs(buffer: ArrayBuffer): Promise<{
  text: string;
  errorType: "SCANNED" | "PASSWORD" | "CORRUPT" | "UNKNOWN" | null;
  errorDetail: string | null;
}> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

    // JANGAN set GlobalWorkerOptions.workerSrc manual:
    // - Di Node.js, pdfjs legacy build otomatis memakai fake worker,
    //   jadi tidak perlu worker file sama sekali.
    // - Memuat worker lewat data:base64 (1.5MB+) sering GAGAL di runtime
    //   serverless (Vercel) karena path node_modules tidak selalu tersedia
    //   di process.cwd() / ukuran fungsi. Itu penyebab umum error
    //   "Gagal membaca file PDF" yang tidak terklasifikasi.

    // Convert ArrayBuffer to Uint8Array for pdfjs-dist type compatibility
    const uint8Array = new Uint8Array(buffer);
    const pdf = await pdfjs.getDocument({
      data: uint8Array,
      useSystemFonts: true,
    }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    const trimmed = fullText.trim();

    // Jika teks sangat sedikit (< 50 char) → kemungkinan scanned/image-based PDF
    if (trimmed.length < 50) {
      return {
        text: trimmed,
        errorType: "SCANNED",
        errorDetail:
          "PDF tidak memiliki teks yang bisa diekstrak. Kemungkinan PDF hasil scan/gambar.",
      };
    }

    return { text: trimmed, errorType: null, errorDetail: null };
  } catch (err: any) {
    const msg = String(err?.message ?? err).toLowerCase();

    // Deteksi password-protected
    if (
      msg.includes("password") ||
      msg.includes("encrypted") ||
      msg.includes("protected") ||
      msg.includes("decryption")
    ) {
      return {
        text: "",
        errorType: "PASSWORD",
        errorDetail:
          "File PDF dilindungi password. Harap hapus password terlebih dahulu.",
      };
    }

    // Deteksi PDF rusak / invalid format
    if (
      msg.includes("invalid") ||
      msg.includes("corrupt") ||
      msg.includes("format") ||
      msg.includes("unexpected") ||
      msg.includes("parse error") ||
      msg.includes("eof") ||
      msg.includes("end of file") ||
      msg.includes("range")
    ) {
      return {
        text: "",
        errorType: "CORRUPT",
        errorDetail: `File PDF tidak dapat dibaca: ${msg.slice(0, 150)}`,
      };
    }

    // Unknown error
    return {
      text: "",
      errorType: "UNKNOWN",
      errorDetail: msg.slice(0, 200),
    };
  }
}

/**
 * Coba ekstrak teks dari DOCX menggunakan mammoth.
 */
async function extractDocx(buf: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  // mammoth expects a Node.js Buffer, not ArrayBuffer
  const nodeBuffer = Buffer.from(buf);
  const result = await mammoth.extractRawText({ buffer: nodeBuffer });
  return result.value.trim();
}

/* ── Helpers ── */

function getFileType(
  file: File
): "pdf" | "docx" | "image" | "unsupported" {
  const fileName = file.name.toLowerCase();
  const isPdf =
    file.type === "application/pdf" || fileName.endsWith(".pdf");
  const isDocx =
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx");
  const isImage =
    file.type.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"].some((ext) =>
      fileName.endsWith(ext)
    );

  if (isPdf) return "pdf";
  if (isDocx) return "docx";
  if (isImage) return "image";
  return "unsupported";
}

function buildErrorResponse(
  errorCode: string,
  message: string,
  extras?: Record<string, unknown>
) {
  return Response.json({ error: errorCode, message, ...extras }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return buildErrorResponse("INVALID_REQUEST", "File tidak ditemukan");
    }

    // ── Detect file type ──
    const fileType = getFileType(file);

    if (fileType === "unsupported") {
      return buildErrorResponse(
        "UNSUPPORTED_FILE_TYPE",
        "Hanya file PDF dan DOCX yang didukung."
      );
    }

    // ── Handle Image Upload → OCR ──
    if (fileType === "image") {
      try {
        const rawArrayBuffer = await file.arrayBuffer();
        const ocrText = await ocrImage(rawArrayBuffer);

        if (ocrText.length < 30) {
          return buildErrorResponse(
            "OCR_FAILED",
            "Gambar tidak mengandung teks yang bisa dibaca. Pastikan gambar cukup jelas dan tidak buram.",
            { suggestPaste: true }
          );
        }

        return Response.json({
          extractedText: ocrText,
          fileName: file.name,
          format: "ocr_image",
        });
      } catch (ocrErr) {
        console.error("[extract] Image OCR failed:", ocrErr);
        return buildErrorResponse(
          "OCR_ERROR",
          "Gagal membaca teks dari gambar. Silakan coba gambar dengan resolusi lebih tinggi, atau tempel teks CV langsung.",
          { suggestPaste: true }
        );
      }
    }

    const rawArrayBuffer = await file.arrayBuffer();

    // ── DOCX: langsung pakai mammoth ──
    if (fileType === "docx") {
      try {
        const textResult = await extractDocx(rawArrayBuffer);

        if (textResult.length < 50) {
          return buildErrorResponse(
            "SCANNED_DOCX",
            "File DOCX tidak mengandung teks yang bisa dibaca. Mungkin file kosong atau hanya berisi gambar.",
            { suggestPaste: true }
          );
        }

        return Response.json({
          extractedText: textResult,
          fileName: file.name,
          format: "docx",
        });
      } catch (docxErr) {
        console.error("[extract] mammoth failed:", docxErr);
        return buildErrorResponse(
          "DOCX_PARSE_FAILED",
          "Gagal membaca file DOCX. Pastikan file bukan hasil scan/gambar atau rusak.",
          { suggestPaste: true }
        );
      }
    }

    // ── PDF: multi-strategy ──
    if (fileType === "pdf") {
      // Strategy 1: pdfjs-dist (primary)
      const result1 = await extractPdfWithPdfjs(rawArrayBuffer);

      // Success!
      if (!result1.errorType && result1.text.length >= 50) {
        return Response.json({
          extractedText: result1.text,
          fileName: file.name,
          format: "pdf",
        });
      }

      // Scanned / no text — give actionable error
      if (result1.errorType === "SCANNED") {
        return buildErrorResponse(
          "SCANNED_PDF",
          "PDF ini tidak memiliki teks yang bisa dipilih (kemungkinan hasil scan/gambar). " +
            "Solusi: (1) Klik tombol OCR untuk baca dengan AI, atau (2) Tempel teks CV langsung di bawah, atau (3) Konversi ke DOCX.",
          { suggestPaste: true, suggestOcr: true }
        );
      }

      // Password protected
      if (result1.errorType === "PASSWORD") {
        return buildErrorResponse(
          "PDF_PASSWORD_PROTECTED",
          "File PDF dilindungi password. Harap hapus password dari file PDF terlebih dahulu.",
          { suggestPaste: true, suggestOcr: true }
        );
      }

      // Corrupted / Unknown — selalu tawarkan OCR browser (renders halaman
      // di browser lalu OCR server-side, jadi bisa membaca scanned PDF yang
      // gagal diekstrak server). Jangan biarkan user mentok.
      const isCorrupt = result1.errorType === "CORRUPT";
      console.error(
        `[extract] pdfjs-dist ${isCorrupt ? "corrupt" : "unknown"} error:`,
        result1.errorDetail
      );
      return buildErrorResponse(
        isCorrupt ? "PDF_CORRUPT" : "PDF_PARSE_FAILED",
        isCorrupt
          ? "File PDF rusak atau tidak valid. Coba buka di browser untuk memverifikasi, atau klik tombol OCR di bawah untuk membaca lewat AI."
          : "Gagal membaca file PDF. " +
              "Klik tombol OCR di bawah untuk membaca lewat AI, atau tempel teks CV langsung.",
        { suggestPaste: true, suggestOcr: true }
      );
    }

    // Should never reach here
    return buildErrorResponse("UNKNOWN", "Gagal memproses file.");
  } catch (error) {
    console.error(
      "[extract] Fatal error:",
      error instanceof Error ? error.message : error
    );
    return Response.json(
      {
        error: "EXTRACTION_FAILED",
        message: "Terjadi kesalahan server saat membaca file. Silakan coba lagi.",
        suggestPaste: true,
      },
      { status: 500 }
    );
  }
}
