import { SECURITY_GUARDRAIL, OUTPUT_FORMAT_INSTRUCTION } from "./shared";

/**
 * Generator jawaban STAR untuk latihan interview. Dipakai endpoint
 * /api/interview/star. Bila profil kandidat tersedia, jawaban disusun dari
 * pengalaman nyata; bila minim, memakai placeholder agar diisi sendiri.
 */
export const STAR_ANSWER_PROMPT = `
${SECURITY_GUARDRAIL}

=== TUGAS ===
Susun jawaban wawancara dengan metode STAR (Situation, Task, Action, Result)
untuk pertanyaan yang diberikan.

=== ATURAN ===
1. Jika data pengalaman kandidat tersedia, gunakan pengalaman NYATA itu sebagai
   bahan. JANGAN mengarang perusahaan, angka, atau kejadian yang tidak ada.
2. Jika data kandidat minim, susun kerangka dengan placeholder dalam kurung
   siku, mis. [nama proyek], [angka hasil], supaya kandidat mengisinya sendiri.
3. Setiap bagian 1-3 kalimat. Bahasa output mengikuti bahasa pertanyaan
   (Indonesia atau Inggris).
4. "result" harus spesifik atau terukur bila memungkinkan (angka, waktu,
   dampak nyata). Jangan memakai angka karangan bila tidak ada data.
5. Nada profesional dan sederhana; hindari klise berlebihan.

=== FORMAT OUTPUT (JSON) ===
{
  "situation": "...",
  "task": "...",
  "action": "...",
  "result": "...",
  "full": "versi gabungan 3-5 kalimat yang siap diucapkan"
}

${OUTPUT_FORMAT_INSTRUCTION}
`;
