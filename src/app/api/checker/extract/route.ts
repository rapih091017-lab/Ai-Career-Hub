import { readFileSync } from "fs";

// Cache worker content — baca sekali dari disk, reuse untuk semua request
let _workerDataUri: string | null = null;
function getWorkerSrc(): string {
  if (!_workerDataUri) {
    const p = process.cwd() + "/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs";
    const content = readFileSync(p, "utf8");
    const b64 = Buffer.from(content).toString("base64");
    _workerDataUri = `data:application/javascript;base64,${b64}`;
  }
  return _workerDataUri;
}

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

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "UNSUPPORTED_FILE_TYPE", message: "Hanya file PDF dan DOCX yang didukung" },
        { status: 400 }
      );
    }

    let textResult = "";

    if (file.type === "application/pdf") {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

      // Server-side Node.js fake worker butuh worker source sebagai data URI
      // (gak bisa pake filesystem path karena ESM loader gak kenal protocol d://)
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
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
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
