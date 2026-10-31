/**
 * Utilitas field poin (deskripsi kerja/organisasi, "Lainnya").
 * Nilai disimpan sebagai teks: satu baris = satu poin, tanpa simbol bullet.
 */

// Simbol bullet di tengah baris ("a • b") hanya dipecah bila diapit spasi, jadi
// rating "●●●○" atau "4●" tidak rusak. "·" tidak termasuk: sering dipakai sebagai
// pemisah biasa ("Python · SQL").
const INLINE_BULLET = /\s+[•▪►●◦‣]\s+/;

// Simbol di awal baris. "•" boleh menempel ("•teks"); simbol lain dan "-", "*",
// "–", "—", "+" wajib diikuti spasi agar "-5%", "*catatan", "●●●○" tidak rusak.
const LEADING_SYMBOL = /^\s*(?:•\s*|[▪►●◦‣·]\s+|[-*–—+]+(?:\s+|$))/;

// Penomoran ("1.", "1)", "(2)", "a.", "a)"). Hanya dibuang bila terlihat sebagai
// daftar (≥2 baris berurutan bernomor) atau teksnya dari AI, supaya "12. Juni",
// "5) tahun", atau "s. d. 2023" yang berdiri sendiri tidak terpotong.
const LEADING_NUMBER = /^\s*\(?\d{1,2}[.)]\s+/;
const LEADING_LETTER = /^\s*\(?[a-z][.)]\s+(?=\S)/;

export interface BulletOptions {
  /** Teks dari AI: penomoran selalu dibuang. */
  fromAi?: boolean;
}

type ListKind = "number" | "letter" | null;

function listKind(line: string): ListKind {
  const l = line.replace(LEADING_SYMBOL, "");
  if (LEADING_NUMBER.test(l)) return "number";
  if (LEADING_LETTER.test(l)) return "letter";
  return null;
}

function stripMarker(line: string, stripList: ListKind | "any"): string {
  let out = line;
  // Ulangi untuk penanda bertumpuk seperti "1. • teks".
  for (let i = 0; i < 3; i++) {
    let next = out.replace(LEADING_SYMBOL, "");
    if (stripList === "number" || stripList === "any") next = next.replace(LEADING_NUMBER, "");
    if (stripList === "letter" || stripList === "any") next = next.replace(LEADING_LETTER, "");
    if (next === out) break;
    out = next;
  }
  return out.trim();
}

/** Ubah teks bebas menjadi baris poin bersih (tanpa simbol, tanpa baris kosong). */
export function normalizeBulletLines(text: string | null | undefined, opts: BulletOptions = {}): string {
  if (!text) return "";
  return bulletList(text, opts).join("\n");
}

/** Sama seperti normalizeBulletLines tetapi mengembalikan array poin. */
export function bulletList(text: string | null | undefined, opts: BulletOptions = {}): string[] {
  if (!text) return [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim() !== "");
  const kinds = lines.map(listKind);
  const out: string[] = [];
  lines.forEach((rawLine, i) => {
    const kind = kinds[i];
    const inList = kind !== null && (kinds[i - 1] === kind || kinds[i + 1] === kind);
    const strip: ListKind | "any" = opts.fromAi ? "any" : inList ? kind : null;
    for (const part of stripMarker(rawLine, strip).split(INLINE_BULLET)) {
      const clean = stripMarker(part, opts.fromAi ? "any" : null);
      if (clean) out.push(clean);
    }
  });
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
      .flatMap((item) => (typeof item === "string" ? bulletList(splitInlineNumbered(item), { fromAi: true }) : []))
      .join("\n");
  }
  if (typeof input !== "string") return "";
  return normalizeBulletLines(splitInlineNumbered(input), { fromAi: true });
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
  return type === "paragraph" ? joinAsParagraph(text) : splitAiBullets(text);
}

const SENTENCE_END = /[.!?:;…]["')\]]*$/;

/**
 * Gabung poin menjadi satu paragraf. Poin yang belum diakhiri tanda baca akhir
 * diberi titik supaya tidak jadi kalimat sambung. Penanda bullet dibuang.
 */
export function joinAsParagraph(text: string | null | undefined): string {
  return bulletList(text)
    .map((line) => (SENTENCE_END.test(line) ? line : `${line}.`))
    .join(" ");
}

/** Pecah paragraf per kalimat (untuk mode Paragraf → Poin). Tidak ada teks yang hilang. */
export function splitSentences(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .replace(/\r\n?/g, "\n")
    // Tidak memecah setelah angka ("3. Tempel") atau inisial satu huruf ("A. Rahman").
    .split(/\n+|(?<=[^\s\d][.!?…]["')\]]*)(?<!(?:^|\s)\p{L}\.)\s+(?=["'(\[]?[A-Z\u00C0-\u00DE])/u)
    .map((s) => s.trim())
    .filter(Boolean);
}
