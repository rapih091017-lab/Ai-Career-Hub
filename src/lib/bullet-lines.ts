/**
 * Utilitas field poin (deskripsi kerja/organisasi, "Lainnya").
 * Nilai disimpan sebagai teks: satu baris = satu poin, tanpa simbol bullet.
 */

// Simbol bullet yang aman dipecah walau muncul di tengah baris ("• a • b").
// "·" tidak termasuk: sering dipakai sebagai pemisah biasa ("Python · SQL").
const INLINE_BULLET = /\s*[•▪►●◦‣]\s*/;

// Penanda di awal baris. "-", "*", "–", "—" wajib diikuti spasi agar "-5%" atau
// "*catatan" tidak rusak. Angka/huruf ("1.", "1)", "a)") juga wajib diikuti spasi
// agar "3.5 tahun" tidak terpotong.
const LEADING_MARKER =
  /^\s*(?:[•▪►●◦‣·]+\s*|[-*–—+]+(?:\s+|$)|\(?\d{1,2}[.)]\s+|\(?[a-z][)]\s+|[a-z]\.\s+(?=\S))/;

function stripMarker(line: string): string {
  let out = line;
  // Ulangi untuk penanda bertumpuk seperti "1. • teks".
  for (let i = 0; i < 3; i++) {
    const next = out.replace(LEADING_MARKER, "");
    if (next === out) break;
    out = next;
  }
  return out.trim();
}

/** Ubah teks bebas menjadi baris poin bersih (tanpa simbol, tanpa baris kosong). */
export function normalizeBulletLines(text: string | null | undefined): string {
  if (!text) return "";
  return bulletList(text).join("\n");
}

/** Sama seperti normalizeBulletLines tetapi mengembalikan array poin. */
export function bulletList(text: string | null | undefined): string[] {
  if (!text) return [];
  const out: string[] = [];
  for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
    for (const part of stripMarker(rawLine).split(INLINE_BULLET)) {
      const clean = stripMarker(part);
      if (clean) out.push(clean);
    }
  }
  return out;
}

// "1. foo 2. bar" dalam satu baris: pecah sebelum nomor berikutnya.
const INLINE_NUMBERED = /\s+(?=\d{1,2}[.)]\s+\S)/;

/**
 * Respons AI untuk field poin bisa berupa array, teks bernomor, atau teks
 * dengan bullet inline. Hasilnya selalu satu poin per baris.
 */
export function splitAiBullets(input: unknown): string {
  if (Array.isArray(input)) {
    return input
      .flatMap((item) => (typeof item === "string" ? bulletList(splitInlineNumbered(item)) : []))
      .join("\n");
  }
  if (typeof input !== "string") return "";
  return normalizeBulletLines(splitInlineNumbered(input));
}

function splitInlineNumbered(text: string): string {
  return text
    .split("\n")
    .map((line) => (/^\s*(?:[-*•▪►●◦–—+]\s+)?1[.)]\s+/.test(line) ? line.split(INLINE_NUMBERED).join("\n") : line))
    .join("\n");
}

/**
 * Tambahkan poin baru ke deskripsi yang ada. Poin yang sudah ada (persis sama)
 * tidak digandakan.
 */
export function appendBullets(current: string | null | undefined, additions: unknown): string {
  const existing = bulletList(current);
  const seen = new Set(existing);
  for (const line of bulletList(splitAiBullets(additions))) {
    if (!seen.has(line)) {
      existing.push(line);
      seen.add(line);
    }
  }
  return existing.join("\n");
}

/** Pilih cara menulis hasil AI: tambah poin atau ganti seluruh deskripsi. */
export function applyAiBullets(
  current: string | null | undefined,
  incoming: unknown,
  mode: "append" | "replace" = "replace",
): string {
  return mode === "append" ? appendBullets(current, incoming) : splitAiBullets(incoming);
}

/**
 * Hasil AI untuk field deskripsi: mode poin → satu poin per baris,
 * mode paragraf → teks apa adanya (dirapikan).
 */
export function aiTextForField(text: string, type: "bullets" | "paragraph" | undefined): string {
  return type === "paragraph" ? text.trim() : splitAiBullets(text);
}
