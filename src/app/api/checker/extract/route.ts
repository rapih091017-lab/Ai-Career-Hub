import { readFileSync } from "fs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "INVALID_REQUEST", message: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    // ── Detect file type: MIME (preferred) + extension fallback ──
    const fileName = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
    const isDocx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx");

    if (!isPdf && !isDocx) {
      return Response.json(
        { error: "UNSUPPORTED_FILE_TYPE", message: "Hanya file PDF dan DOCX yang didukung" },
        { status: 400 }
      );
    }

    let textResult = "";

    if (isPdf) {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

        const workerPath =
          process.cwd() + "/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs";
        const workerContent = readFileSync(workerPath, "utf8");
        const workerB64 = Buffer.from(workerContent).toString("base64");
        pdfjs.GlobalWorkerOptions.workerSrc =
          `data:application/javascript;base64,${workerB64}`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({
          data: arrayBuffer,
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
        textResult = fullText.trim();
      } catch (pdfErr) {
        console.error("pdfjs-dist extraction failed:", pdfErr);
        return Response.json(
          {
            error: "PDF_PARSE_FAILED",
            message:
              "Gagal membaca file PDF. Pastikan file bukan PDF hasil scan/gambar, password-protected, atau rusak.",
          },
          { status: 400 }
        );
      }
    } else if (isDocx) {
      const buffer = Buffer.from(await file.arrayBuffer());
      // Dynamically import mammoth (ESM-safe, avoids require in strict ESM context)
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      textResult = result.value.trim();
    }

    if (textResult.trim().length < 50) {
      return Response.json(
        { error: "UNSUPPORTED_FILE_TYPE", message: "File tidak dapat dibaca. Pastikan file bukan hasil scan/gambar." },
        { status: 400 }
      );
    }

    return Response.json({
      extractedText: textResult,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Extract error detail:", error instanceof Error ? error.message : error);
    return Response.json(
      { error: "EXTRACTION_FAILED", message: "Gagal membaca file.", debugDetail: String(error) },
      { status: 500 }
    );
  }
}
