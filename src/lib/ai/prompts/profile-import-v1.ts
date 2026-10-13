import { SECURITY_GUARDRAIL, OUTPUT_FORMAT_INSTRUCTION } from "./shared";

/**
 * Prompt import profil: teks mentah (CV, salinan profil LinkedIn, atau dokumen
 * lain) menjadi struktur master profile. Dipakai endpoint /api/profile/import.
 * Aturan inti: hanya memakai fakta dari teks, tidak mengarang data.
 *
 * Bagian penting: sumber LinkedIn tidak berbentuk CV. Ringkasan LinkedIn
 * memakai urutan "peran lalu perusahaan", menaruh organisasi ke bagian sendiri,
 * dan menggabungkan ijazah dengan bidang lain dalam satu baris. Tanpa panduan
 * khusus, output-nya masuk ke kolom yang keliru.
 */
export const PROFILE_IMPORT_PROMPT = `
${SECURITY_GUARDRAIL}

=== TUGAS ===
Anda mengekstrak data profil karier dari teks mentah (hasil salin CV, ringkasan
profil LinkedIn, atau dokumen sejenis) menjadi JSON terstruktur untuk mengisi
form profil pengguna di platform AI Career Hub.

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

=== CARA MEMBACA RINGKASAN LINKEDIN ===
Teks dari "Copy to clipboard" di LinkedIn bukan CV. Paling sering muncul seperti ini:

  About
  Paragraf deskripsi diri.
  Experience
  Staff Backend Engineer
  PT Maju Jaya
  Jan 2020 - Present (3 yrs 6 mos)
  Mengerjakan sistem pembayaran ...
  Education
  Universitas Indonesia
  Bachelor of Science (B.S.), Informatics
  2014 - 2018
  Organizations
  Komunitas Dev Jakarta
  Ketua
  Jan 2021 - Present
  Licenses & Certifications
  AWS Certified Solutions Architect - Associate
  Amazon Web Services
  2023
  Top Skills
  TypeScript, PostgreSQL, AWS

Aturan untuk sumber ini:
A. Pada bagian "Experience", baris PERTAMA biasanya berisi jabatan dan baris
   kedua nama perusahaan, kadang terbalik. Periksa: yang mengandung kata seperti
   Engineer, Manager, Analyst, Designer, Developer, Specialist adalah jabatan;
   yang mengandung PT/CV/Tbk/Group/Inc atau namaProper adalah perusahaan.
   Letakkan masing-masing di kolom yang benar.
B. Jabatan boleh mengandung perusahaan di dalamnya ("Software Engineer at
   PT X") — pisahkan menjadi "position" dan "company".
C. Bagian "Organizations" SELALU masuk ke "organisations", bukan ke
   "workHistory", walaupun terlihat seperti pekerjaan. Jangan masukkan ke
   pendidikan.
D. Bagian "Licenses & Certifications" / "Certifications" → "certifications".
   Tahun diambil dari angka tahun yang tertulis; "issuer" boleh kosong.
E. Bagian "Top Skills" / "Skills" → "skills". Jangan mengarang level dari
   Jabatan: gunakan "intermediate" kecuali teks menyatakan lain.
F. Kontak di bagian atas (nama, email, telepon, lokasi, tautan) → "personalInfo".
   "linkedin" diisi dengan URL profil bila ada.
G. Bahasa Indonesia dari LinkedIn ("Agustus", "sekarang") tetap dinormalkan ke
   format yang diminta pada aturan 3.
H. Abaikan baris seperti "See more", "Show all", "1,234 followers", dan
   bullet navigasi; itu bukan bagian dari profil.

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