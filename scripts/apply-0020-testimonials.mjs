import postgres from "postgres";
import { readFileSync } from "node:fs";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

const SEED = [
  { name: "Akbar Pratama", role: "Fresh Graduate Teknik Informatika", text: "CV saya dulu sering tak ada kabar. Setelah dicek di sini, ketahuan formatnya belum ATS-friendly. Diperbaiki, dua minggu kemudian dipanggil interview pertama.", sortOrder: 0 },
  { name: "Rizki Firmansyah", role: "Digital Marketer", text: "Biasanya bikin CV butuh 3-4 jam. Sekarang tinggal disesuaikan per lowongan. Fitur revisi AI-nya paling kepakai.", sortOrder: 1 },
  { name: "Fikri Alhadi", role: "Admin Staff", text: "Surat lamaran formalnya rapi, ada kop surat. HRD sampai bertanya saya pakai jasa apa.", sortOrder: 2 },
  { name: "Sinta Maharani", role: "Fresh Graduate Akuntansi", text: "Skor ATS pertama cuma rendah. Ikuti saran per bagian, naik terus. Jadi tahu persis apa yang perlu diperbaiki.", sortOrder: 3 },
  { name: "Dewi Anggraini", role: "Marketing Executive", text: "Portfolio online-nya jadi senjata saat interview. Tinggal share link, nggak perlu kirim file bolak-balik.", sortOrder: 4 },
  { name: "Yoga Saputra", role: "Customer Service", text: "Latihan interview-nya bikin saya nggak grogi. Pertanyaannya mirip yang ditanya interviewer beneran.", sortOrder: 5 },
  { name: "Maya Kusuma", role: "Career Switcher", text: "Ganti karier dari retail ke admin. CV saya disusun ulang supaya pengalaman lama tetap relevan. Lolos screening.", sortOrder: 6 },
  { name: "Andre Wijaya", role: "Web Developer", text: "Export PDF-nya beneran teks, bukan gambar. Detail kecil, tapi ini yang bikin CV lolos dibaca ATS.", sortOrder: 7 },
  { name: "Lestari Ningsih", role: "Fresh Graduate Manajemen", text: "Fitur gratisnya udah cukup buat mulai. Saya baru upgrade pas mau kirim CV beneran ke perusahaan.", sortOrder: 8 },
];

try {
  await sql.unsafe(readFileSync("drizzle/0020_testimonials.sql", "utf8"));
  console.log("OK: drizzle/0020_testimonials.sql");
  for (const item of SEED) {
    await sql`
      insert into "testimonials" ("name", "role", "text", "sort_order", "is_published")
      values (${item.name}, ${item.role}, ${item.text}, ${item.sortOrder}, true)
      on conflict do nothing
    `;
  }
  console.log(`OK: seed ${SEED.length} testimoni awal`);
} finally {
  await sql.end();
}
