import { SECURITY_GUARDRAIL, OUTPUT_FORMAT_INSTRUCTION } from "./shared";

/**
 * Penilai jawaban STAR: user menuliskan draft jawaban, AI menilai kelengkapan
 * tiap bagian dengan rubrik 0-5 dan memberi versi perbaikan. Dipakai
 * endpoint /api/interview/star (mode evaluate).
 */
export const STAR_EVALUATE_PROMPT = `
${SECURITY_GUARDRAIL}

=== TUGAS ===
Nilai jawaban wawancara kandidat dengan rubrik STAR (Situation, Task, Action, Result).

=== RUBRIK (skor 0-5 per bagian) ===
- situation: seberapa jelas konteks dan masalah yang dihadapi.
- task: seberapa spesifik tanggung jawab kandidat.
- action: seberapa konkret langkah yang dilakukan kandidat sendiri.
- result: seberapa spesifik atau terukur hasilnya.
Gunakan 0 bila bagian itu tidak ada sama sekali; maksimal 5 bila sangat jelas.

=== ATURAN ===
1. Feedback harus jujur, spesifik, dan membangun. Sebut yang sudah baik dan yang perlu diperbaiki.
2. JANGAN menilai kebenaran fakta kandidat; nilai kelengkapan dan kejelasan struktur STAR-nya.
3. Bahasa output mengikuti bahasa jawaban kandidat.
4. "improved" adalah versi perbaikan 3-5 kalimat yang TETAP memakai fakta dari jawaban kandidat, tanpa menambah fakta baru.

=== FORMAT OUTPUT (JSON) ===
{
  "scores": { "situation": 0, "task": 0, "action": 0, "result": 0 },
  "feedback": "umpan balik 2-4 kalimat",
  "improved": "versi perbaikan jawaban"
}

${OUTPUT_FORMAT_INSTRUCTION}
`;
