import type { FieldHelpContent } from "@/lib/builder-help";

/**
 * Isi bantuan (ikon i) per field builder portofolio. Aturan sama dengan
 * builder-help: tanpa angka, perusahaan, atau sertifikat karangan; fakta yang
 * harus diisi user ditulis sebagai placeholder [angka], [persen], [nama klien].
 */
export const PORTFOLIO_HELP = {
  heroHeadline: {
    title: "Jabatan utama",
    what: "Peran yang kamu jalani atau incar, tampil besar di bagian atas portofolio. Cukup satu peran yang jelas.",
    good: "Desainer UI/UX",
    weak: "Kreatif, pekerja keras, dan suka tantangan",
    weakWhy: "Itu sifat, bukan peran. Pengunjung tidak tahu kamu mengerjakan apa.",
  },
  heroSubHeadline: {
    title: "Tagline",
    what: "Satu kalimat pendek di dekat nama: bidang yang kamu kuasai dan untuk siapa kamu bekerja.",
    good: "Merancang aplikasi mobile yang mudah dipakai pengguna baru",
    weak: "Selamat datang di portofolio saya",
    weakWhy: "Tidak memberi informasi apa pun tentang kamu.",
  },
  heroBio: {
    title: "Bio singkat",
    what: "Dua sampai tiga kalimat: siapa kamu, keahlian utama, dan jenis pekerjaan yang kamu cari.",
    good: "Desainer UI dengan [angka] tahun pengalaman di aplikasi pemesanan. Fokus pada riset pengguna dan prototipe cepat.",
    weak: "Saya orang yang passionate dan selalu ingin berkembang.",
    weakWhy: "Umum sekali; tidak menyebut keahlian atau bidang.",
  },
  aboutText: {
    title: "Tentang saya",
    what: "Cerita perjalanan kariermu: bagaimana kamu mulai, apa yang sedang kamu kerjakan, dan apa yang ingin kamu kerjakan berikutnya.",
    good: "Mulai dari proyek kampus membuat situs himpunan, lalu menangani [jumlah] situs untuk UMKM. Sekarang mendalami aksesibilitas web.",
    weak: "Saya lulusan baru yang siap bekerja di mana saja.",
    weakWhy: "Tidak ada cerita atau bukti yang bisa dipegang pembaca.",
  },
  skillsMain: {
    title: "Keahlian utama",
    what: "Keahlian yang paling ingin kamu tonjolkan, dipisah koma. Pilih yang benar-benar kamu pakai di project.",
    good: "Riset pengguna, Wireframing, Prototipe interaktif",
    weak: "Microsoft Word, Internet, Kerja tim",
    weakWhy: "Terlalu umum untuk membedakanmu dari pelamar lain.",
  },
  projectName: {
    title: "Nama project",
    what: "Nama singkat yang langsung menjelaskan isi project.",
    good: "Aplikasi antrean klinik",
    weak: "Project baru",
    weakWhy: "Pengunjung harus membuka detail untuk tahu isinya.",
  },
  projectDescription: {
    title: "Deskripsi project",
    what: "Satu poin per baris: masalah yang diselesaikan, peranmu, dan hasilnya. Hasil yang belum kamu ukur boleh ditulis dengan placeholder lalu dilengkapi.",
    good: "Merancang alur daftar antrean online untuk pasien klinik\nMenurunkan waktu tunggu di loket sekitar [persen]",
    weak: "Membuat aplikasi menggunakan React",
    weakWhy: "Hanya menyebut alat, tidak menjelaskan masalah atau hasil.",
  },
  techStack: {
    title: "Tools / tech stack",
    what: "Alat dan teknologi yang dipakai di project ini, dipisah koma.",
    good: "Figma, React, Firebase",
    weak: "Komputer, internet",
    weakWhy: "Tidak spesifik.",
  },
  experienceDescription: {
    title: "Deskripsi pengalaman",
    what: "Satu poin per baris. Mulai dengan kata kerja, sebut apa yang kamu kerjakan dan dampaknya.",
    good: "Menyusun laporan penjualan mingguan untuk [jumlah] cabang\nMembuat template yang memangkas waktu rekap [angka] jam per minggu",
    weak: "Bertanggung jawab atas laporan",
    weakWhy: "Tidak jelas apa yang kamu lakukan dan seberapa besar hasilnya.",
  },
  testimonial: {
    title: "Testimoni",
    what: "Kutipan asli dari atasan, klien, atau rekan. Tulis persis seperti yang mereka sampaikan dan minta izin sebelum menampilkan.",
    good: "\"Desainnya rapi dan dia selalu menjelaskan alasan setiap keputusan.\"",
    weak: "\"Orang terbaik yang pernah ada.\"",
    weakWhy: "Pujian kosong tanpa contoh terdengar dibuat-buat.",
  },
} satisfies Record<string, FieldHelpContent>;

export type PortfolioHelpKey = keyof typeof PORTFOLIO_HELP;
