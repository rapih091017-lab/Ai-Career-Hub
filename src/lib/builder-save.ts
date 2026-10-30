import type { CvData } from "@/components/cv-templates";

/**
 * Body PUT /api/cv-documents/[id] dari builder. API hanya membaca
 * `tailoredContent`; mengirim cvData mentah membuat simpan manual tidak
 * menyimpan apa pun. Simpan manual dan autosave wajib lewat fungsi ini.
 */
export function buildCvSaveBody(cvData: CvData): string {
  return JSON.stringify({ tailoredContent: cvData });
}
