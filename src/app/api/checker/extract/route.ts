import { ocrImage } from "@/lib/ocr";

/**
 * Fallback DOMMatrix/ImageData minimal untuk pdfjs-dist di runtime tanpa DOM.
 * pdfjs v5 butuh DOMMatrix (biasanya dipolyfill @napi-rs/canvas). Kalau
 * native module gagal load di serverless, polyfill ini mencegah error
 * "dommatrix is not defined" saat text extraction.
 */
function ensureDomPolyfills() {
  if (typeof (globalThis as any).DOMMatrix === "undefined") {
    class DOMMatrix2D {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      constructor(init?: string | number[]) {
        if (typeof init === "string" && init.trim()) {
          const p = init.split(/[\s,]+/).map(Number);
          if (p.length >= 6) [this.a, this.b, this.c, this.d, this.e, this.f] = p;
        } else if (Array.isArray(init) && init.length >= 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        }
      }
      setMatrixValue(v: string) {
        const p = v.split(/[\s,]+/).map(Number);
        if (p.length >= 6) [this.a, this.b, this.c, this.d, this.e, this.f] = p;
        return this;
      }
      multiply(other: any) {
        const m = new DOMMatrix2D();
        m.a = this.a * other.a + this.c * other.b;
        m.b = this.b * other.a + this.d * other.b;
        m.c = this.a * other.c + this.c * other.d;
        m.d = this.b * other.c + this.d * other.d;
        m.e = this.a * other.e + this.c * other.f + this.e;
        m.f = this.b * other.e + this.d * other.f + this.f;
        return m;
      }
      translate(tx: number, ty: number) {
        this.e += tx; this.f += ty; return this;
      }
      scale(sx: number, sy?: number) {
        const s = sy ?? sx;
        this.a *= sx; this.b *= s; this.c *= sx; this.d *= s;
        return this;
      }
      rotate(angle: number) {
        const rad = (angle * Math.PI) / 180;
        const c = Math.cos(rad), s = Math.sin(rad);
        const na = this.a * c + this.c * s;
        const nb = this.b * c + this.d * s;
        const nc = this.a * -s + this.c * c;
        const nd = this.b * -s + this.d * c;
        this.a = na; this.b = nb; this.c = nc; this.d = nd;
        return this;
      }
      transformPoint(pt: any) {
        return {
          x: this.a * pt.x + this.c * pt.y + this.e,
          y: this.b * pt.x + this.d * pt.y + this.f,
          z: pt.z ?? 0, w: 1,
        };
      }
      inverse() {
        const det = this.a * this.d - this.b * this.c;
        if (Math.abs(det) < 1e-12) return new DOMMatrix2D();
        const m = new DOMMatrix2D();
        m.a = this.d / det; m.b = -this.b / det;
        m.c = -this.c / det; m.d = this.a / det;
        m.e = (this.c * this.f - this.d * this.e) / det;
        m.f = (this.b * this.e - this.a * this.f) / det;
        return m;
      }
      get m11() { return this.a; }
      get m12() { return this.b; }
      get m21() { return this.c; }
      get m22() { return this.d; }
      get m41() { return this.e; }
      get m42() { return this.f; }
      static fromMatrix(other: any) {
        const m = new DOMMatrix2D();
        m.a = other.a; m.b = other.b; m.c = other.c; m.d = other.d; m.e = other.e; m.f = other.f;
        return m;
      }
    }
    (globalThis as any).DOMMatrix = DOMMatrix2D;
  }
  if (typeof (globalThis as any).ImageData === "undefined") {
    (globalThis as any).ImageData = class ImageDataPolyfill {
      data: Uint8ClampedArray; width: number; height: number;
      constructor(
        dataOrWidth: any,
        heightOrData?: any,
        height?: any
      ) {
        if (ArrayBuffer.isView(dataOrWidth)) {
          this.data = new Uint8ClampedArray(
            dataOrWidth.buffer,
            dataOrWidth.byteOffset,
            dataOrWidth.byteLength
          );
          this.width = heightOrData;
          this.height = height ?? 0;
        } else {
          this.width = dataOrWidth;
          this.height = heightOrData;
          this.data = new Uint8ClampedArray(this.width * this.height * 4);
        }
      }
    };
  }
}

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
    ensureDomPolyfills();
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
