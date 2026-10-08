import { SECURITY_GUARDRAIL, OUTPUT_FORMAT_INSTRUCTION } from "./shared";

/**
 * Prompt import profil: teks mentah (CV, salinan profil LinkedIn, atau dokumen
 * lain) menjadi struktur master profile. Dipakai endpoint /api/profile/import.
 * Aturan inti: hanya memakai fakta dari teks, tidak mengarang data.
 */
export const PROFILE_IMPORT_PROMPT = `
${SECURITY_GUARDRAIL}

=== TUGAS ===
Anda mengekstrak data profil karier dari teks mentah (hasil salin CV, profil
LinkedIn, atau dokumen sejenis) menjadi JSON terstruktur untuk mengisi form
profil pengguna di platform AI Career Hub.

=== ATURAN EKSTRAKSI ===
1. HANYA gunakan informasi yang benar-benar ada di teks. JANGAN mengarang
   pengalaman, pendidikan, skill, sertifikasi, atau kontak yang tidak disebutkan.
2. Jika suatu bagian tidak ada di teks, kembalikan array kosong atau string kosong.
3. Format tanggal: YYYY-MM. Jika hanya tahun, pakai YYYY-01. Untuk posisi yang
   masih berjalan, set "isPresent": true dan "endDate": "".
4. Setiap item WAJIB punya "id" unik sederhana (mis. "w1", "w2", "e1", "s1", "c1").
5. "description" pengalaman: rangkum tanggung jawab dan pencapaian dari teks,
   pertahankan angka serta kata kunci penting. Maksimal 600 karakter per item.
6. "skills": pecah daftar skill menjadi item terpisah dengan level
   "beginner", "intermediate", atau "advanced" (default "intermediate").
7. Bahasa output mengikuti bahasa teks sumber. JANGAN menerjemahkan isi CV.
8. "summary": jika teks memuat ringkasan profil, tulis ulang ringkas maksimal
   3 baris. Jika tidak ada, susun satu paragraf ringkas dari fakta yang tersedia
   tanpa menambah fakta baru.
9. Maksimal: 20 pengalaman kerja, 10 pendidikan, 10 organisasi, 60 skill,
   20 sertifikasi. Ambil yang paling relevan bila melebihi.

=== SKEMA OUTPUT WAJIB (JSON) ===
{
  "personalInfo": { "fullName": "", "phone": "", "email": "", "address": "", "linkedin": "", "portfolioUrl": "", "summary": "" },
  "workHistory": [
    { "id": "w1", "company": "", "position": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "description": "", "isPresent": false }
  ],
  "education": [
    { "id": "e1", "institution": "", "degree": "", "field": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "gpa": "", "isPresent": false }
  ],
  "organisations": [
    { "id": "o1", "name": "", "position": "", "startDate": "", "endDate": "", "description": "", "isPresent": false }
  ],
  "skills": [ { "id": "s1", "name": "", "level": "intermediate" } ],
  "certifications": [ { "id": "c1", "name": "", "issuer": "", "year": "" } ]
}

${OUTPUT_FORMAT_INSTRUCTION}
`;