import type { StoredAnalysisResult } from "@/components/checker/types";

/** Awal baris: bullet (- * + • ·) atau penomoran (1. / 1)) beserta spasinya. */
const LEADING_MARKER = /^(?:[-*+•·]|\d+[.)])\s+/;
/** Penanda heading markdown di awal baris. Hanya di awal supaya "C#" tidak jadi "C". */
const LEADING_HEADING = /^#+\s+/;
const PLACEHOLDER = /\[[^\]\n]{1,40}\]/g;

/**
 * Teks polos yang aman ditempel ke CV: markdown (bintang, garis bawah, heading,
 * backtick) dan penomoran bulet dibuang, spasi ganda dipadatkan, tiap baris di-trim.
 * Kata tidak diubah — hanya tanda baca dan spasi.
 */
export function sanitizeCopyText(text: string): string {
  if (typeof text !== "string" || !text) return "";

  return text
    .split("\n")
    .map((rawLine) => {
      let line = rawLine.trim();
      // Penanda dihapus berulang: "**- **teks**" menyisakan penanda baru tiap lapis.
      while (LEADING_MARKER.test(line)) line = line.replace(LEADING_MARKER, "");
      line = line.replace(LEADING_HEADING, "");
      line = line
        .replace(/\*\*/g, "")
        .replace(/__/g, "")
        .replace(/`/g, "")
        .replace(/\s{2,}/g, " ");
      return line.trim();
    })
    .join("\n")
    .trim();
}

/** Semua placeholder `[...]` dalam teks (maks 40 karakter, tanpa baris kosong). */
export function findPlaceholders(text: string): string[] {
  if (typeof text !== "string" || !text) return [];
  return text.match(PLACEHOLDER) ?? [];
}

/**
 * Salin ke papan klip: navigator.clipboard lebih dulu, lalu fallback textarea +
 * execCommand. Mengembalikan true/false dan tidak pernah melempar — API klip
 * diblokir konteks tidak aman (http, iframe) bukan alasan merusak alur salin.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof text !== "string" || !text) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Lanjut ke fallback di bawah.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

/**
 * Kumpulan teks perbaikan yang bisa ditempel sekaligus ke CV.
 *
 * Murni dan tanpa klaim: hanya item yang teksnya tidak kosong setelah
 * disanitasi, blok dipisah baris kosong, judul huruf kapital per section.
 * Mengembalikan "" kalau tidak ada satu pun teks — kosong berarti tidak ada
 * saran, bukan saran kosong.
 */
export function buildChangePack(analysis: StoredAnalysisResult): string {
  const items = analysis.bulletReview ?? [];
  const blocks = new Map<string, string[]>();
  const durationText = sanitizeCopyText(analysis.durationRewrite?.copy_text ?? "");

  // Blok v5 (prompt 4): judul blok + teks siap tempel, semua lewat sanitasi
  // yang sama. Blok hanya dibuat kalau ada teksnya — tanpa isi, tidak ada judul.
  const addBlock = (title: string, ...texts: Array<string | undefined>) => {
    const points = texts
      .map((text) => sanitizeCopyText(text ?? ""))
      .filter(Boolean)
      .map((text) => `• ${text}`);
    if (points.length > 0) blocks.set(title, points);
  };

  for (const item of items) {
    const text = sanitizeCopyText(item.suggested_rewrite);
    if (!text) continue;
    const section = typeof item.section === "string" ? item.section.trim() : "";
    const key = section || "lainnya";
    const points = blocks.get(key);
    if (points) {
      points.push(`• ${text}`);
    } else {
      blocks.set(key, [`• ${text}`]);
    }
  }

  // Ringkasan profil, skills, pendidikan, dan section tambahan (prompt 4).
  const breakdown = analysis.breakdown;
  addBlock("RINGKASAN PROFIL", breakdown?.summary?.rewrite_copy_text);
  addBlock("SKILLS", breakdown?.skills?.grouped_skills_copy_text);
  addBlock("PENDIDIKAN", breakdown?.education?.copy_text);
  const templates = (analysis.missingSections ?? [])
    .map((section) => section?.template_copy_text)
    .filter((text): text is string => typeof text === "string" && text.trim().length > 0);
  addBlock("SECTION TAMBAHAN", ...templates);

  // Penyesuaian kata kunci (prompt 5). Dedupe berdasarkan `replaces`: kalau
  // placement mengganti teks yang sama dengan original_text di bulletReview,
  // versi suggested_rewrite-nya sudah ada di blok PENGALAMAN di atas, jadi
  // placement tidak ikut (satu perubahan, satu versi). Dua placement dengan
  // replaces sama juga hanya dihitung sekali; placement tanpa replaces (baris
  // baru di Skills) selalu ikut.
  const rewrittenOriginals = new Set(
    (analysis.bulletReview ?? [])
      .map((item) => ({
        original: sanitizeCopyText(item.original_text),
        rewrite: sanitizeCopyText(item.suggested_rewrite),
      }))
      .filter((pair) => pair.original && pair.rewrite)
      .map((pair) => pair.original),
  );
  const seenReplaces = new Set<string>();
  const placementLines: string[] = [];
  for (const placement of analysis.keywordAnalysis?.placements ?? []) {
    const text = sanitizeCopyText(placement.copy_text);
    if (!text) continue;
    const replaces = sanitizeCopyText(placement.replaces ?? "");
    if (replaces) {
      if (rewrittenOriginals.has(replaces)) continue;
      if (seenReplaces.has(replaces)) continue;
      seenReplaces.add(replaces);
    }
    placementLines.push(`• ${text}`);
  }
  if (placementLines.length > 0) blocks.set("PENYESUAIAN KATA KUNCI", placementLines);

  if (blocks.size === 0 && !durationText) return "";

  // Saran format durasi kerja (prompt 3) jadi blok terakhir. Judulnya bukan
  // "PENGALAMAN — …": ini saran penulisan tanggal, bukan rewrite satu section.
  if (durationText) blocks.set("FORMAT DURASI KERJA", [`• ${durationText}`]);

  return Array.from(blocks, ([section, points]) =>
    [`PENGALAMAN — ${section}`.toUpperCase(), ...points].join("\n"),
  ).join("\n\n");
}

/** Section yang bisa punya "Salin semua perubahan section ini" di kartu skor. */
export type PackSection = "summary" | "experience" | "skills" | "education" | "format_ats";

/**
 * Pack per section (prompt 4): teks siap tempel khusus satu kartu skor —
 * perbaikan terbesar section itu plus teks salin yang melekat padanya
 * (rewrite summary, rewrite bullet experience, baris skills, blok pendidikan).
 * Mengembalikan "" kalau tidak ada satu pun teks.
 */
export function buildSectionChangePack(
  section: PackSection,
  analysis: StoredAnalysisResult,
): string {
  const breakdown = analysis.breakdown;
  const lines: string[] = [];
  const push = (text: string | undefined) => {
    const clean = sanitizeCopyText(text ?? "");
    if (clean) lines.push(`• ${clean}`);
  };

  if (section === "summary") {
    push(breakdown?.summary?.rewrite_copy_text);
    push(breakdown?.summary?.top_fix?.copy_text);
  }
  if (section === "experience") {
    for (const item of analysis.bulletReview ?? []) {
      if (typeof item?.section === "string" && item.section.trim().toLowerCase() === "experience") {
        push(item.suggested_rewrite);
      }
    }
    push(breakdown?.experience?.top_fix?.copy_text);
  }
  if (section === "skills") {
    push(breakdown?.skills?.grouped_skills_copy_text);
    push(breakdown?.skills?.top_fix?.copy_text);
  }
  if (section === "education") {
    push(breakdown?.education?.copy_text);
    push(breakdown?.education?.top_fix?.copy_text);
  }
  if (section === "format_ats") {
    push(breakdown?.format_ats?.top_fix?.copy_text);
  }

  return lines.join("\n");
}
