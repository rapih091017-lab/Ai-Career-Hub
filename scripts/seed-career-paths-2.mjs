// Seed batch 2: 6 jalur karier tambahan (Guru, Perawat, Staf Administrasi,
// Staf Logistik, IT Support, Social Media Specialist). Idempotent lewat
// on conflict (slug) do nothing, jadi aman dijalankan berulang.
// Jalankan: node --env-file=.env scripts/seed-career-paths-2.mjs
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tidak ditemukan. Jalankan dengan --env-file=.env");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

const paths = [
  {
    slug: "guru",
    role: "Guru",
    category: "Pendidikan",
    summary:
      "Guru mengajar, menilai, dan membimbing siswa. Karier berjalan dari guru mata pelajaran sampai kepala sekolah atau spesialis kurikulum.",
    levels: [
      { level: "Guru Pemula", years: "0-2 tahun", salaryRange: "Rp3-5 juta", focus: "Mengajar sesuai kurikulum, mengelola kelas, dan menyusun asesmen harian." },
      { level: "Guru Berpengalaman", years: "3-7 tahun", salaryRange: "Rp5-9 juta", focus: "Merancang modul ajar, membina ekstrakurikuler, dan aktif di MGMP." },
      { level: "Guru Senior / Kepala Sekolah", years: "8+ tahun", salaryRange: "Rp9-18 juta", focus: "Memimpin tim guru, supervisi akademik, dan mengembangkan program sekolah." },
    ],
    skills: ["Modul Ajar/RPP", "Manajemen Kelas", "Asesmen Pembelajaran", "Kurikulum Merdeka", "Komunikasi Orang Tua", "Pembelajaran Digital (LMS)", "Bimbingan Siswa", "Google Classroom"],
    steps: [
      "Selesaikan pendidikan keguruan dan sertifikasi pendidik (PPG).",
      "Bangun portofolio mengajar: modul ajar, media pembelajaran, dan dokumentasi kelas.",
      "Ikuti pelatihan Kurikulum Merdeka dan pembelajaran digital.",
      "Tulis CV dengan pencapaian terukur: capaian kelas, program yang dijalankan, dan pembinaan siswa.",
    ],
  },
  {
    slug: "perawat",
    role: "Perawat",
    category: "Kesehatan",
    summary:
      "Perawat memberi asuhan keperawatan langsung ke pasien. Karier berjalan dari perawat pelaksana sampai kepala ruangan atau spesialis unit.",
    levels: [
      { level: "Perawat Pelaksana", years: "0-2 tahun", salaryRange: "Rp3,5-5,5 juta", focus: "Asuhan dasar, monitoring tanda vital, dan dokumentasi rekam medis." },
      { level: "Perawat Terampil", years: "3-7 tahun", salaryRange: "Rp5,5-9 juta", focus: "Menangani unit spesifik, membimbing siswa praktik, dan kendali infeksi." },
      { level: "Kepala Ruangan / Spesialis", years: "8+ tahun", salaryRange: "Rp9-18 juta", focus: "Manajemen ruangan, jadwal dinas, mutu layanan, dan persiapan akreditasi." },
    ],
    skills: ["Asuhan Keperawatan", "Dokumentasi Rekam Medis", "Kendali Infeksi", "Bantuan Hidup Dasar", "Komunikasi Pasien", "Manajemen Obat", "Akreditasi (KARS)", "Penjadwalan Dinas"],
    steps: [
      "Pastikan STR aktif dan ikuti pelatihan unit yang dituju (ICU, bedah, anak).",
      "Dokumentasikan kasus yang ditangani dan hasil asuhan yang baik.",
      "Ambil pelatihan BHD/BTCLS dan keselamatan pasien.",
      "Tulis CV dengan angka: jumlah pasien, unit, dan sertifikasi yang dimiliki.",
    ],
  },
  {
    slug: "staf-administrasi",
    role: "Staf Administrasi",
    category: "Administrasi",
    summary:
      "Staf administrasi menjaga dokumen, jadwal, dan alur kerja kantor tetap rapi. Jenjang berjalan sampai koordinator admin atau office manager.",
    levels: [
      { level: "Staf Admin", years: "0-2 tahun", salaryRange: "Rp3-4,5 juta", focus: "Input data, korespondensi, dan pengarsipan dokumen." },
      { level: "Admin Berpengalaman", years: "3-6 tahun", salaryRange: "Rp4,5-7 juta", focus: "Koordinasi jadwal, komunikasi vendor, dan laporan rutin." },
      { level: "Admin Koordinator / Office Manager", years: "7+ tahun", salaryRange: "Rp7-12 juta", focus: "Pengelolaan anggaran kantor, pengawasan tim, dan efisiensi proses." },
    ],
    skills: ["Microsoft Excel", "Kearsipan Digital", "Korespondensi", "Penjadwalan", "Data Entry", "Manajemen Vendor", "Anggaran Kantor", "Notulensi"],
    steps: [
      "Kuasai Excel (rumus dasar sampai pivot) dan Google Workspace.",
      "Kumpulkan contoh format surat, jadwal, dan laporan yang pernah kamu buat.",
      "Latih ketelitian dengan checklist dan standar pengarsipan.",
      "Tulis CV dengan bukti: jumlah dokumen, rapat, atau tim yang ditangani.",
    ],
  },
  {
    slug: "staf-logistik",
    role: "Staf Logistik",
    category: "Logistik & Rantai Pasok",
    summary:
      "Staf logistik mengatur barang masuk-keluar, stok gudang, dan pengiriman. Jenjang berjalan sampai supervisor gudang atau analis rantai pasok.",
    levels: [
      { level: "Staf Gudang", years: "0-2 tahun", salaryRange: "Rp3,5-5 juta", focus: "Penerimaan barang, penataan, dan stok opname rutin." },
      { level: "Staf Logistik Berpengalaman", years: "3-6 tahun", salaryRange: "Rp5-7,5 juta", focus: "Pengiriman, dokumen ekspedisi, dan koordinasi vendor." },
      { level: "Supervisor / Analis Rantai Pasok", years: "7+ tahun", salaryRange: "Rp7,5-13 juta", focus: "Perencanaan stok, efisiensi biaya kirim, dan KPI gudang." },
    ],
    skills: ["Manajemen Stok", "WMS/ERP", "Stok Opname", "Dokumen Pengiriman", "Koordinasi Ekspedisi", "FIFO/FEFO", "Keselamatan Kerja", "Analisis Biaya Logistik"],
    steps: [
      "Pelajari alur gudang dan dokumen logistik standar.",
      "Kuasai Excel dan dasar sistem WMS/ERP.",
      "Catat perbaikan proses yang pernah kamu lakukan beserta hasilnya.",
      "Tulis CV dengan angka: akurasi stok, waktu proses, dan penghematan biaya.",
    ],
  },
  {
    slug: "it-support",
    role: "IT Support",
    category: "Teknologi",
    summary:
      "IT support menjaga perangkat, jaringan, dan pengguna tetap berjalan. Jenjang berjalan sampai administrator sistem atau spesialis jaringan.",
    levels: [
      { level: "IT Support", years: "0-2 tahun", salaryRange: "Rp4-6 juta", focus: "Menangani tiket pengguna, instalasi perangkat, dan perawatan dasar." },
      { level: "IT Support Senior", years: "3-6 tahun", salaryRange: "Rp6-10 juta", focus: "Jaringan, server dasar, dan penyusunan dokumentasi SOP." },
      { level: "Administrator Sistem / Spesialis", years: "7+ tahun", salaryRange: "Rp10-18 juta", focus: "Infrastruktur, keamanan, otomasi, dan panduan teknis tim." },
    ],
    skills: ["Troubleshooting Hardware", "Jaringan (LAN/VPN)", "Windows/Linux", "Help Desk", "Manajemen Tiket", "Keamanan Dasar", "Active Directory", "Dokumentasi SOP"],
    steps: [
      "Bangun dasar jaringan dan sistem operasi secara praktik.",
      "Ambil sertifikasi awal seperti CompTIA A+/Network+ atau setara.",
      "Dokumentasikan kasus yang kamu selesaikan beserta dampaknya.",
      "Tulis CV dengan metrik: jumlah pengguna, uptime, dan waktu penyelesaian tiket.",
    ],
  },
  {
    slug: "social-media-specialist",
    role: "Social Media Specialist",
    category: "Pemasaran",
    summary:
      "Social media specialist mengelola kanal sosial: konten, jadwal, komunitas, dan laporan performa. Jenjang berjalan sampai manajer media sosial.",
    levels: [
      { level: "Social Media Admin", years: "0-2 tahun", salaryRange: "Rp3,5-5,5 juta", focus: "Menjadwalkan konten, membalas komentar, dan menyusun laporan dasar." },
      { level: "Social Media Specialist", years: "3-6 tahun", salaryRange: "Rp5,5-10 juta", focus: "Strategi konten, kolaborasi kreatif, iklan dasar, dan analisis performa." },
      { level: "Social Media Manager", years: "7+ tahun", salaryRange: "Rp10-20 juta", focus: "Anggaran, kepemimpinan tim, target pertumbuhan, dan integrasi kampanye." },
    ],
    skills: ["Kalender Konten", "Copywriting", "Analitik Sosial", "Desain Dasar (Canva)", "Iklan Berbayar", "Manajemen Komunitas", "Video Pendek", "Riset Tren"],
    steps: [
      "Bangun portofolio dari akun pribadi, proyek sukarela, atau klien kecil.",
      "Tunjukkan angka: pertumbuhan pengikut, engagement, dan konversi.",
      "Kuasai satu alat analitik dan satu alat editing video pendek.",
      "Tulis CV dengan kampanye nyata dan hasil yang terukur.",
    ],
  },
];

try {
  let inserted = 0;
  for (let i = 0; i < paths.length; i++) {
    const p = paths[i];
    const result = await sql`
      insert into career_paths (slug, role, category, summary, levels, skills, steps, is_published, sort_order)
      values (
        ${p.slug}, ${p.role}, ${p.category}, ${p.summary},
        ${JSON.stringify(p.levels)}::jsonb,
        ${JSON.stringify(p.skills)}::jsonb,
        ${JSON.stringify(p.steps)}::jsonb,
        true, ${10 + i}
      )
      on conflict (slug) do nothing
      returning role
    `;
    if (result.length > 0) {
      inserted++;
      console.log("+ ", p.role);
    } else {
      console.log("=  sudah ada:", p.role);
    }
  }
  const [{ count }] = await sql`select count(*)::int as count from career_paths`;
  console.log(`Selesai. Baru: ${inserted}. Total jalur karier di database: ${count}`);
} catch (err) {
  console.error("GAGAL:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
