import { ocrImage } from "@/lib/ocr";

/**
 * POST /api/checker/ocr
 *
 * Menerima satu atau lebih file gambar (dari hasil render PDF halaman di browser)
 * dan menjalankan Tesseract.js OCR untuk mengekstrak teks.
 *
 * Input: multipart/form-data dengan field "images" (array of files)
 * Output: { extractedText: string, pages: number }
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Collect image files from "images" field
    const rawImages = formData.getAll("images");
    const images: File[] = rawImages.filter(
      (v): v is File => v instanceof File && (!v.type || v.type.startsWith("image/"))
    );

    if (images.length === 0) {
      return Response.json(
        { error: "NO_IMAGES", message: "Tidak ada gambar yang dikirim." },
        { status: 400 }
      );
    }

    // Batasi jumlah halaman (max 10)
    if (images.length > 10) {
      return Response.json(
        {
          error: "TOO_MANY_PAGES",
          message: "Maksimal 10 halaman yang bisa diproses.",
        },
        { status: 400 }
      );
    }

    // Process each image with OCR
    const results: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const buffer = await img.arrayBuffer();
      const text = await ocrImage(buffer);
      results.push(text);
    }

    const combinedText = results.join("\n\n").trim();

    if (combinedText.length < 30) {
      return Response.json(
        {
          error: "OCR_NO_TEXT",
          message:
            "Tidak dapat membaca teks dari gambar. Pastikan PDF memiliki halaman yang jelas.",
        },
        { status: 400 }
      );
    }

    return Response.json({
      extractedText: combinedText,
      pages: images.length,
      format: "ocr_pdf",
    });
  } catch (error) {
    console.error(
      "[ocr] Fatal error:",
      error instanceof Error ? error.message : error
    );
    return Response.json(
      {
        error: "OCR_SERVER_ERROR",
        message: "Terjadi kesalahan server saat OCR. Silakan coba lagi atau tempel teks manual.",
      },
      { status: 500 }
    );
  }
}
