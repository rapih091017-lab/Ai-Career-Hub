/**
 * Konversi dokumen office → Markdown.
 *
 * AnyDoc (Firecrawl) membaca struktur dokumen sungguhan: gaya, daftar, tabel,
 * dan penomoran. Hasilnya Markdown yang jauh lebih rapi daripada teks polos,
 * sehingga Structured Output lebih akurat dan token yang terpakai lebih sedikit.
 *
 * Documen hasil pindaian (gambar) tidak punya lapisan teks. AnyDoc melaporkannya
 * sebagai `needsOcr` beserta nomor halamannya, jadi kita tahu halaman mana
 * yang perlu dibaca sebagai gambar — bukan gagal diam-diam.
 */

export type DocFormatErrorCode =
  | "needsOcr"
  | "encrypted"
  | "resourceLimit"
  | "malformed"
  | "unsupported"
  | "missingPart"
  | "io";

export interface DocToMarkdownOk {
  ok: true;
  markdown: string;
  format: string | null;
}

/**
 * `needsOcr` bukan kegagalan: dokumennya valid, tapi halaman tertentu perlu
 * dibaca lewat OCR. Nomornya dikembalikan supaya hanya halaman itu yang
 * dikirim ke model vision.
 */
export interface DocNeedsOcr {
  ok: false;
  reason: "needsOcr";
  pages: number[];
  pageCount: number;
  format: string | null;
}

export interface DocFailed {
  ok: false;
  reason: DocFormatErrorCode;
  message: string;
  format: string | null;
}

export type DocToMarkdownResult = DocToMarkdownOk | DocNeedsOcr | DocFailed;

/** Batas keras sebelum file siquiera dibaca. */
const MAX_INPUT_BYTES = 10 * 1024 * 1024;
/** Batas panjang Markdown yang boleh masuk ke prompt. */
export const MAX_MARKDOWN_CHARS = 60_000;

function errorCode(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return null;
}

function errorPages(error: unknown): number[] {
  if (error && typeof error === "object" && "pages" in error) {
    const pages = (error as { pages?: unknown }).pages;
    if (Array.isArray(pages)) return pages.filter((p): p is number => typeof p === "number");
  }
  return [];
}

/**
 * Ubah byte dokumen menjadi Markdown.
 *
 * Format dideteksi dari isi file, bukan dari nama/ekstensi: berkas dari
 * peramban sering salah ekstensi atau bertipe `application/octet-stream`.
 */
export async function docToMarkdown(bytes: Buffer): Promise<DocToMarkdownResult> {
  if (bytes.byteLength === 0) {
    return { ok: false, reason: "io", message: "Berkas kosong", format: null };
  }
  if (bytes.byteLength > MAX_INPUT_BYTES) {
    return {
      ok: false,
      reason: "resourceLimit",
      message: "Berkas terlalu besar untuk dibaca",
      format: null,
    };
  }

  let format: string | null = null;
  try {
    const anydoc = await import("@firecrawl/anydoc");
    const detected = anydoc.formatFromBytes(bytes);
    format = (detected ?? null) as string | null;

    const markdown = await anydoc.toMarkdownBytes(bytes, detected ?? undefined);

    return { ok: true, markdown, format };
  } catch (error) {
    const code = errorCode(error);
    if (code === "needsOcr") {
      return {
        ok: false,
        reason: "needsOcr",
        pages: errorPages(error),
        pageCount:
          error && typeof error === "object" && "pageCount" in error
            ? Number((error as { pageCount?: unknown }).pageCount) || 0
            : 0,
        format,
      };
    }
    return {
      ok: false,
      reason: (code as DocFormatErrorCode) ?? "malformed",
      message: error instanceof Error ? error.message : "Gagal membaca dokumen",
      format,
    };
  }
}

/**
 * Potong Markdown dengan penanda yang jelas.
 *
 * Dipakai sebelum masuk ke LLM supaya pengguna tahu kalau ada bagian yang
 * terpotong, bukan diam-diam kehilangan isi.
 */
export function clampMarkdown(markdown: string): { text: string; truncated: boolean } {
  if (markdown.length <= MAX_MARKDOWN_CHARS) return { text: markdown, truncated: false };
  return {
    text: `${markdown.slice(0, MAX_MARKDOWN_CHARS)}\n\n[isi dipotong pada ${MAX_MARKDOWN_CHARS} karakter]`,
    truncated: true,
  };
}