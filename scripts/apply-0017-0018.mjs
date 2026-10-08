// Apply migrasi 0017 (admin_users) + 0018 (career_paths) dan seed 10 jalur
// karier populer. Idempotent: aman dijalankan berulang.
// Jalankan: node --env-file=.env scripts/apply-0017-0018.mjs
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tidak ditemukan. Jalankan dengan --env-file=.env");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

/** Jalur karier awal untuk 10 posisi paling banyak dibuka di Indonesia.
 * Admin dapat menambah atau mengubahnya dari /admin/career-path. */
const CAREER_PATHS = [
  {
    slug: "software-engineer",
    role: "Software Engineer",
    category: "Teknologi",
    summary: "Membangun dan merawat perangkat lunak, dari fitur baru sampai perbaikan produksi.",
    levels: [
      { level: "Junior", years: "0-2 tahun", salaryRange: "Rp5-9 juta/bulan", focus: "Menulis kode sesuai arahan, memperbaiki bug, belajar code review." },
      { level: "Mid", years: "2-5 tahun", salaryRange: "Rp10-20 juta/bulan", focus: "Memegang fitur sendiri, menulis tes, mulai memandu junior." },
      { level: "Senior", years: "5+ tahun", salaryRange: "Rp20-45 juta/bulan", focus: "Merancang arsitektur, menjaga kualitas tim, mengambil keputusan teknis." },
    ],
    skills: ["JavaScript/TypeScript", "React atau framework sejenis", "Git", "Database SQL", "API REST", "Testing", "Docker dasar", "Bahasa Inggris teknis"],
    steps: [
      "Kuasai satu bahasa pemrograman dan satu framework sampai bisa membuat proyek utuh.",
      "Bangun 3-5 proyek nyata dan publikasikan kodenya di GitHub.",
      "Latih kemampuan membaca kode orang lain lewat kontribusi open source atau proyek tim.",
      "Kejar pengalaman produksi: monitoring, debugging, dan perbaikan insiden.",
    ],
  },
  {
    slug: "data-analyst",
    role: "Data Analyst",
    category: "Data",
    summary: "Mengubah data mentah menjadi insight yang dipakai tim bisnis untuk mengambil keputusan.",
    levels: [
      { level: "Junior", years: "0-2 tahun", salaryRange: "Rp4,5-8 juta/bulan", focus: "Membersihkan data, membuat laporan rutin, menjawab pertanyaan sederhana." },
      { level: "Mid", years: "2-5 tahun", salaryRange: "Rp9-16 juta/bulan", focus: "Mendesain metrik, membangun dashboard, mengusulkan perbaikan proses." },
      { level: "Senior", years: "5+ tahun", salaryRange: "Rp16-35 juta/bulan", focus: "Menjadi mitra strategis tim bisnis, memimpin proyek data lintas divisi." },
    ],
    skills: ["SQL", "Excel/Google Sheets", "Python atau R", "Visualisasi (Looker Studio, Tableau)", "Statistik dasar", "Pembersihan data", "Komunikasi hasil analisis"],
    steps: [
      "Kuasai SQL sampai nyaman menulis query gabungan beberapa tabel.",
      "Latih satu tools visualisasi dan buat 3 dashboard portofolio dari data publik.",
      "Pelajari statistik praktis: distribusi, korelasi, uji hipotesis sederhana.",
      "Biasakan menutup setiap analisis dengan rekomendasi, bukan hanya angka.",
    ],
  },
  {
    slug: "digital-marketing",
    role: "Digital Marketing Specialist",
    category: "Pemasaran",
    summary: "Merancang dan menjalankan kampanye digital untuk menarik, mengubah, dan mempertahankan pengguna.",
    levels: [
      { level: "Junior", years: "0-2 tahun", salaryRange: "Rp4-7 juta/bulan", focus: "Menjalankan konten dan iklan sesuai rencana, melaporkan angka mingguan." },
      { level: "Mid", years: "2-5 tahun", salaryRange: "Rp8-15 juta/bulan", focus: "Mengelola anggaran iklan, menguji kreatif, menaikkan konversi." },
      { level: "Senior", years: "5+ tahun", salaryRange: "Rp15-30 juta/bulan", focus: "Menyusun strategi kanal, mengelola tim, memegang target pertumbuhan." },
    ],
    skills: ["Meta & Google Ads", "SEO dasar", "Email marketing", "Google Analytics", "Copywriting", "Content calendar", "Analisis A/B test"],
    steps: [
      "Kuasai satu kanal secara mendalam (misal Meta Ads) sebelum melebar.",
      "Bangun portofolio kecil: promosikan proyek pribadi lalu catat angkanya.",
      "Pelajari dasar analitik untuk membaca funnel dan atribusi.",
      "Latih penulisan iklan: satu penawaran, satu pesan, satu aksi.",
    ],
  },
  {
    slug: "ui-ux-designer",
    role: "UI/UX Designer",
    category: "Desain",
    summary: "Merancang tampilan dan alur produk yang mudah dipakai, dari riset sampai prototipe.",
    levels: [
      { level: "Junior", years: "0-2 tahun", salaryRange: "Rp4,5-8 juta/bulan", focus: "Membuat tampilan layar, mengikuti design system, merapikan aset." },
      { level: "Mid", years: "2-5 tahun", salaryRange: "Rp9-18 juta/bulan", focus: "Memimpin alur fitur, uji ke pengguna, bekerja dekat dengan developer." },
      { level: "Senior", years: "5+ tahun", salaryRange: "Rp18-35 juta/bulan", focus: "Menjaga arah desain produk, membangun design system, mendampingi tim." },
    ],
    skills: ["Figma", "Wireframing", "Prototyping", "Design system", "Riset pengguna dasar", "Tipografi & layout", "Aksesibilitas dasar"],
    steps: [
      "Kuasai Figma sampai bisa membangun komponen dan auto layout yang rapi.",
      "Kerjakan 3 studi kasus: masalah, proses, keputusan, dan hasilnya.",
      "Pelajari dasar riset: wawancara singkat dan uji kegunaan 5 pengguna.",
      "Dokumentasikan alasan desain, bukan hanya hasil akhirnya.",
    ],
  },
  {
    slug: "sales-business-development",
    role: "Sales & Business Development",
    category: "Penjualan",
    summary: "Mencari peluang, membangun hubungan, dan menutup kesepakatan dengan pelanggan atau mitra.",
    levels: [
      { level: "Junior", years: "0-2 tahun", salaryRange: "Rp4-7 juta + komisi", focus: "Prospecting, menghubungi calon pelanggan, mencatat pipeline." },
      { level: "Mid", years: "2-5 tahun", salaryRange: "Rp7-14 juta + komisi", focus: "Menutup transaksi rutin, menjaga akun, mulai membina junior." },
      { level: "Senior", years: "5+ tahun", salaryRange: "Rp15-30 juta + komisi", focus: "Membuka segmen baru, bernegosiasi kontrak besar, memimpin tim." },
    ],
    skills: ["Prospecting", "Negosiasi", "CRM (HubSpot/Salesforce)", "Presentasi", "Riset pasar", "Manajemen pipeline", "Komunikasi tertulis"],
    steps: [
      "Latih kemampuan mendengar: catat kebutuhan pelanggan sebelum menawarkan.",
      "Bangun kebiasaan pipeline: seberapa banyak prospek masuk setiap minggu.",
      "Pelajari produk dan industri sampai bisa menjawab keberatan teknis.",
      "Rawat hubungan setelah transaksi, karena sebagian besar penjualan datang dari pelanggan lama.",
    ],
  },
  {
    slug: "customer-service",
    role: "Customer Service",
    category: "Layanan",
    summary: "Menjadi titik kontak pertama pelanggan: menyelesaikan masalah dan menjaga pengalaman tetap baik.",
    levels: [
      { level: "Junior", years: "0-2 tahun", salaryRange: "Rp3,5-6 juta/bulan", focus: "Menjawab tiket/chat sesuai panduan, mencatat keluhan dengan rapi." },
      { level: "Mid", years: "2-5 tahun", salaryRange: "Rp6-10 juta/bulan", focus: "Menangani kasus sulit, menyusun makro balasan, menjaga kualitas tim." },
      { level: "Senior", years: "5+ tahun", salaryRange: "Rp10-18 juta/bulan", focus: "Memimpin shift, menganalisis pola keluhan, memperbaiki proses layanan." },
    ],
    skills: ["Komunikasi empatik", "Helpdesk/ticketing", "Produk & SOP", "Manajemen waktu", "Bahasa Inggris dasar", "Penyelesaian konflik"],
    steps: [
      "Kuasai SOP dan produk sampai bisa menjawab tanpa membaca panduan terus-menerus.",
      "Latih nada tulisan: jelas, tenang, dan tidak defensif dalam situasi sulit.",
      "Kumpulkan contoh kasus sulit yang berhasil diselesaikan untuk portofolio.",
      "Pelajari dasar analisis keluhan untuk naik ke peran quality atau lead.",
    ],
  },
  {
    slug: "accounting",
    role: "Staff Accounting",
    category: "Keuangan",
    summary: "Mencatat transaksi, menyusun laporan keuangan, dan menjaga kepatuhan pajak perusahaan.",
    levels: [
      { level: "Junior", years: "0-2 tahun", salaryRange: "Rp4-6,5 juta/bulan", focus: "Entri jurnal, rekonsiliasi bank, menyiapkan dokumen pajak." },
      { level: "Mid", years: "2-5 tahun", salaryRange: "Rp7-12 juta/bulan", focus: "Menutup buku bulanan, menyusun laporan, membantu audit." },
      { level: "Senior", years: "5+ tahun", salaryRange: "Rp12-25 juta/bulan", focus: "Memimpin tim finance, perencanaan pajak, laporan ke manajemen." },
    ],
    skills: ["Akuntansi dasar (SAK)", "Excel lanjutan", "Software akuntansi (Accurate/SAP)", "Pajak (PPh, PPN)", "Rekonsiliasi", "Analisis laporan keuangan"],
    steps: [
      "Pahami siklus akuntansi dari jurnal sampai laporan keuangan.",
      "Kuasai satu software akuntansi yang banyak dipakai perusahaan.",
      "Ikuti pelatihan pajak praktis dan pahami pelaporan berkala.",
      "Biasakan mengecek ulang angka: akurasi adalah nilai utama profesi ini.",
    ],
  },
  {
    slug: "hr-recruiter",
    role: "HR & Recruiter",
    category: "Sumber Daya Manusia",
    summary: "Mencari, menyeleksi, dan menjaga karyawan terbaik tetap bertahan dan tumbuh.",
    levels: [
      { level: "Junior", years: "0-2 tahun", salaryRange: "Rp4-7 juta/bulan", focus: "Menyaring CV, menjadwalkan wawancara, merapikan data kandidat." },
      { level: "Mid", years: "2-5 tahun", salaryRange: "Rp7-13 juta/bulan", focus: "Memegang proses rekrutmen penuh, membuat strategi sourcing." },
      { level: "Senior", years: "5+ tahun", salaryRange: "Rp13-28 juta/bulan", focus: "Merancang program talenta, coaching manajer, menjaga retensi." },
    ],
    skills: ["Sourcing kandidat", "Wawancara berbasis kompetensi", "ATS", "Hubungan karyawan", "Dasar hukum ketenagakerjaan", "Komunikasi"],
    steps: [
      "Pelajari struktur wawancara berbasis kompetensi dan latih penilaian terstruktur.",
      "Bangun jaringan kandidat; sourcing adalah keahlian yang dihargai mahal.",
      "Pahami dasar hukum ketenagakerjaan agar rekomendasi aman.",
      "Ukur kualitas rekrutmen: masa bertahan kandidat, bukan hanya kecepatan isi posisi.",
    ],
  },
  {
    slug: "content-writer",
    role: "Content Writer",
    category: "Konten",
    summary: "Menulis artikel, naskah, dan materi pemasaran yang enak dibaca dan menggerakkan pembaca.",
    levels: [
      { level: "Junior", years: "0-2 tahun", salaryRange: "Rp3,5-6 juta/bulan", focus: "Menulis artikel sesuai brief, riset dasar, merapikan tata bahasa." },
      { level: "Mid", years: "2-5 tahun", salaryRange: "Rp6-12 juta/bulan", focus: "Memegang SEO, mengelola kalender konten, mengedit tulisan rekan." },
      { level: "Senior", years: "5+ tahun", salaryRange: "Rp12-22 juta/bulan", focus: "Menentukan arah konten, menjaga suara merek, memimpin penulis." },
    ],
    skills: ["Menulis jelas & ringkas", "SEO dasar", "Riset sumber", "Editing", "CMS (WordPress)", "Struktur artikel", "Adaptasi gaya merek"],
    steps: [
      "Bangun portofolio 5-10 tulisan dengan topik berbeda, bukan hanya satu niche.",
      "Pelajari dasar SEO: maksud pencarian, struktur judul, dan tautan internal.",
      "Latih menyunting tulisan sendiri: potong 20% kata tanpa kehilangan makna.",
      "Kuasai satu CMS dan alur publikasi dari draft sampai tayang.",
    ],
  },
  {
    slug: "product-manager",
    role: "Product Manager",
    category: "Produk",
    summary: "Menentukan apa yang harus dibangun, mengapa, dan bagaimana mengukur keberhasilannya.",
    levels: [
      { level: "Associate PM", years: "0-2 tahun", salaryRange: "Rp6-11 juta/bulan", focus: "Menulis spesifikasi, mengatur backlog, menganalisis data produk." },
      { level: "Mid PM", years: "2-5 tahun", salaryRange: "Rp12-22 juta/bulan", focus: "Memimpin satu area produk, bernegosiasi prioritas, mengukur dampak." },
      { level: "Senior PM", years: "5+ tahun", salaryRange: "Rp22-45 juta/bulan", focus: "Menentukan strategi, menyelaraskan lintas tim, membina PM lain." },
    ],
    skills: ["Riset pengguna", "Penulisan spesifikasi", "Analitik produk", "Prioritisasi (ICE/RICE)", "Kolaborasi desain & engineering", "SQL dasar", "Komunikasi stakeholder"],
    steps: [
      "Pahami satu produk secara mendalam: siapa penggunanya dan masalah apa yang dipecahkan.",
      "Latih menulis masalah, bukan solusi, lalu bandingkan beberapa opsi solusi.",
      "Pelajari angka produk: retensi, konversi, dan bagaimana mengukurnya.",
      "Belajar mengatakan tidak pada ide yang tidak mendukung tujuan utama.",
    ],
  },
];

try {
  for (const file of ["drizzle/0017_admin_users.sql", "drizzle/0018_career_paths.sql"]) {
    await sql.unsafe(readFileSync(file, "utf8"));
    console.log("OK:", file);
  }

  for (const [index, path] of CAREER_PATHS.entries()) {
    await sql`
      insert into "career_paths" ("slug", "role", "category", "summary", "levels", "skills", "steps", "sort_order")
      values (
        ${path.slug},
        ${path.role},
        ${path.category},
        ${path.summary},
        ${sql.json(path.levels)},
        ${sql.json(path.skills)},
        ${sql.json(path.steps)},
        ${index}
      )
      on conflict ("slug") do nothing
    `;
  }

  const admin = await sql`select email from admin_users`;
  const paths = await sql`select count(*)::int as total from career_paths`;
  console.log("Admin terdaftar:", admin.map((row) => row.email).join(", ") || "(kosong)");
  console.log("Jalur karier:", paths[0]?.total ?? 0);
} catch (err) {
  console.error("GAGAL:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
