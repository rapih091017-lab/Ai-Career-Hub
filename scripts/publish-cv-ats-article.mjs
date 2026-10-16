/**
 * Terbitkan satu artikel Career Hub lewat database.
 *
 * Dipakai sebagai skrip sekali jalan, bukan endpoint aplikasi, supaya tidak ada
 * jalur yang bisa menulis artikel tanpa lewat admin.
 *
 * Jalankan: node scripts/publish-cv-ats-article.mjs
 */
import postgres from "postgres";
import { readFileSync } from "node:fs";

const CONTENT = `Kamu mungkin pernah dengar: "CV-mu ditolak sistem sebelum dibaca manusia." Kedengarannya menakutkan, dan membuat banyak orang panik lalu mengubah desain CV secara berlebihan.

Kenyataannya lebih rumit, dan lebih bisa dikendalikan. Mari kita lihat dulu apa itu ATS, baru apa yang perlu kamu lakukan.

## Apa itu ATS

ATS adalah singkatan dari Applicant Tracking System, yaitu perangkat lunak yang dipakai perusahaan untuk menampung dan mengelola lamaran. Bayangkan kotak masuk email yang jauh lebih rapi: semua lamaran terkumpul di satu tempat, dan rekruter bisa mencari, menyaring, dan memberi status pada tiap pelamar.

Saat kamu mengunggah CV, ATS membaca isinya dan memecahnya jadi bagian-bagian: nama, kontak, pengalaman, pendidikan, keahlian. Lalu rekruter bisa mencari kandidat dengan kata kunci, misalnya "Excel" atau "Power BI".

## Mitos dan kenyataan

Mitos: ATS otomatis menolak sebagian besar CV.

Kenyataan: ATS lebih sering berfungsi sebagai tempat menyimpan dan menyortir. Beberapa sistem memang punya fitur penilaian otomatis, tapi cara tiap perusahaan memakainya berbeda-beda, dan keputusan akhirnya umumnya tetap di tangan rekruter. Hati-hati dengan artikel yang menyebut angka seperti "75 persen CV ditolak ATS" tanpa sumber yang jelas.

Yang lebih sering terjadi: CV gagal terbaca dengan benar. Kalau isi CV berantakan setelah dibaca sistem, rekruter yang mencari kata kunci tidak akan menemukanmu. Dan di banyak perusahaan, penyaring sebenarnya adalah pertanyaan di formulir lamaran, misalnya domisili, pendidikan minimal, atau ketersediaan masuk kerja. Kalau jawabanmu tidak memenuhi syarat dasar, lamaranmu bisa tersisih di situ.

Jadi fokusnya bukan "mengakali robot", tapi memastikan CV-mu mudah dibaca mesin dan manusia.

## 8 hal yang bisa kamu perbaiki

1. Pakai satu kolom. Tata letak dua kolom dan tabel yang rumit sering terbaca acak oleh sistem. Teks dari kolom kanan bisa tercampur dengan kolom kiri.

2. Gunakan judul bagian yang umum. "Pengalaman Kerja", "Pendidikan", "Keahlian". Judul kreatif seperti "Perjalanan Karierku" membingungkan sistem pembaca.

3. Letakkan informasi penting di badan dokumen. Nama dan kontak sebaiknya tidak disembunyikan di header atau footer, karena sebagian sistem tidak membacanya. Hindari juga memasukkan teks penting ke dalam gambar, ikon, atau kotak teks.

4. Pilih format file yang aman. PDF hasil ekspor dari Word atau Google Docs biasanya aman karena teksnya masih bisa disalin. PDF hasil scan atau foto tidak bisa dibaca. Kalau lowongan menyebut format tertentu, ikuti.

5. Sesuaikan CV dengan lowongan. Baca iklan lowongan, ambil tiga sampai lima syarat utamanya, lalu pastikan keahlian yang memang kamu punya tertulis dengan kata yang sama. Kalau lowongan menulis "Microsoft Excel", jangan hanya menulis "olah data".

6. Tulis singkatan dan kepanjangannya. Misalnya "Key Performance Indicator (KPI)" atau "Work Load Analysis (WLA)". Rekruter bisa mencari dengan salah satu bentuknya.

7. Jangan menjejalkan kata kunci. Menulis daftar kata kunci tersembunyi atau mencantumkan keahlian yang tidak kamu kuasai bukan hanya tidak membantu, tapi akan ketahuan di wawancara. Kata kunci harus menempel pada pengalaman nyata. Contoh: "Menyusun laporan mingguan di Excel dengan pivot table untuk 12 line produksi" lebih kuat daripada "Mahir Excel".

8. Jawab pertanyaan formulir dengan jujur dan teliti. Banyak pelamar fokus pada CV tapi asal mengisi pertanyaan saring. Padahal di situlah banyak lamaran tersisih.

## Tes sederhana yang bisa kamu coba sekarang

Buka CV-mu, pilih semua teks, salin, lalu tempel ke aplikasi catatan polos seperti Notepad. Perhatikan hasilnya. Kalau urutan teks berantakan, nama pekerjaan terpisah dari tanggalnya, atau ada bagian yang hilang, besar kemungkinan sistem pembaca juga mengalami hal yang sama. Perbaiki bagian itu.

## Apakah CV harus polos dan membosankan?

Tidak. CV yang ramah ATS tidak berarti jelek. Kamu tetap bisa memakai tata letak yang rapi, spasi yang nyaman, dan satu warna aksen pada judul bagian. Yang perlu dihindari adalah elemen yang menyulitkan pembacaan teks: tabel berlapis, grafik batang untuk "tingkat keahlian", foto besar, dan ikon pengganti kata.

## Satu CV untuk semua lamaran?

Sebaiknya jangan. Kamu tidak perlu menulis ulang seluruh CV. Cukup sesuaikan bagian atas (ringkasan singkat), urutan keahlian, dan butir pengalaman yang paling relevan. Menyesuaikan 15 menit per lamaran sering lebih berguna daripada mengirim satu CV ke 50 tempat.

## Langkah berikutnya

Periksa CV-mu dengan daftar di atas. Kalau mau pemeriksaan otomatis yang cepat, kamu bisa mencoba AI CV Checker di AI Career Hub, lalu tetap baca hasilnya dengan kritis dan sesuaikan dengan lowongan yang kamu tuju.

## Tautan berguna

Cek CV-mu dengan [AI CV Checker AI Career Hub](https://aicareerhub.my.id/checker).`;

const ARTICLE = {
  title: 'CV Kamu Tidak "Dibuang Robot". Ini yang Sebenarnya Terjadi di ATS dan 8 Hal yang Bisa Kamu Perbaiki',
  slug: "cv-ats-yang-sebenarnya",
  category: "CV dan ATS",
  excerpt:
    "ATS sering disalahpahami sebagai robot yang menolak CV. Faktanya lebih sederhana. Pelajari cara kerjanya dan 8 perbaikan nyata supaya CV-mu terbaca dengan benar.",
  tags: ["ATS", "CV", "resume", "lamaran kerja"],
  content: CONTENT,
};

const REQUIRED_COLUMNS = ["title", "slug", "category", "excerpt", "content", "tags", "status"];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diisi");
  const sql = postgres(url, { ssl: "require", max: 1 });

  try {
    const columns = await sql`select column_name from information_schema.columns where table_name = 'career_hub_posts'`;
    const available = new Set(columns.map((row) => row.column_name));
    const missing = REQUIRED_COLUMNS.filter((name) => !available.has(name));
    if (missing.length > 0) {
      throw new Error(`Kolom tidak ditemukan di career_hub_posts: ${missing.join(", ")}`);
    }

    const existing = await sql`select id, status from career_hub_posts where slug = ${ARTICLE.slug}`;
    if (existing.length > 0) {
      console.log(`Sudah ada (${existing[0].status}), berhenti.`);
      return;
    }

    const now = new Date().toISOString();
    const base = {
      title: ARTICLE.title,
      slug: ARTICLE.slug,
      category: ARTICLE.category,
      excerpt: ARTICLE.excerpt,
      content: ARTICLE.content,
      tags: ARTICLE.tags,
      status: "published",
      published_at: now,
      updated_at: now,
      reading_time_minutes: Math.max(1, Math.round(ARTICLE.content.split(/\s+/).length / 200)),
      meta_title: ARTICLE.title,
      meta_description: ARTICLE.excerpt,
      cover_image_url: null,
    };
    // Kolom opsional hanya diisi kalau tabelnya memang punya kolom itu, supaya
    // skrip ini tidak ikut gagal kalau skema berubah.
    const names = Object.keys(base).filter((name) => available.has(name));
    const columnsSql = names.join(", ");
    const placeholders = names.map((_, index) => `$${index + 1}`).join(", ");
    const wanted = ["id", "slug", "title", "status", "reading_time_minutes", "published_at"].filter(
      (name) => available.has(name),
    );

    const inserted = await sql.unsafe(
      `insert into career_hub_posts (${columnsSql}) values (${placeholders}) returning ${wanted.join(", ")}`,
      names.map((name) => base[name]),
    );

    const saved = inserted[0];
    console.log("Terbit:", JSON.stringify(saved, null, 2));

    const lines = ARTICLE.content.split("\n").filter((line) => line.trim());
    const ordered = lines.filter((line) => /^\d+\.\s/.test(line)).length;
    const headings = lines.filter((line) => /^#{1,3}\s/.test(line)).length;
    console.log(
      `Baris jadi blok: ${lines.length} (${headings} judul, ${ordered} item daftar bernomor)`,
    );
    console.log(`Alamat: https://aicareerhub.my.id/career-hub/${ARTICLE.slug}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

// Dipakai agar berkas ini bisa ikut di-cek sintaksnya tanpa menjalankan DB.
void readFileSync;
await main();