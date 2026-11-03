/**
 * Isi bantuan (ikon i) per field builder CV. Satu tempat agar mudah dirawat.
 * Aturan contoh: tanpa angka, perusahaan, atau sertifikat karangan. Fakta yang
 * harus diisi user ditulis sebagai placeholder: [angka], [persen], [jumlah orang], [tahun].
 */
export interface FieldHelpContent {
  title: string;
  /** Apa itu & kapan dipakai. */
  what: string;
  good: string;
  weak: string;
  /** Kenapa contoh kurang itu kurang. */
  weakWhy: string;
}

export const BUILDER_HELP = {
  professionalTitle: {
    title: "Jabatan profesional",
    what: "Satu baris di bawah namamu di CV. Isi dengan peran yang kamu jalani atau incar, bukan kalimat motivasi. Ini dicetak di CV, beda dengan Judul posisi di Target Pekerjaan yang hanya dibaca AI.",
    good: "Staf Administrasi Keuangan | Rekonsiliasi Bank & Laporan Bulanan",
    weak: "Pekerja keras yang siap belajar",
    weakWhy: "Tidak menjelaskan bidang atau peranmu.",
  },
  employmentStatus: {
    title: "Status pekerjaan",
    what: "Keadaanmu sekarang, mis. sedang bekerja, mencari kerja, atau fresh graduate. Membantu pembaca memahami ketersediaanmu.",
    good: "Fresh graduate, siap mulai kerja",
    weak: "Pengangguran",
    weakWhy: "Kesannya negatif; pilih istilah netral yang menjelaskan kesiapanmu.",
  },
  customFields: {
    title: "Field kustom",
    what: "Data diri tambahan yang diminta lowongan dan belum ada kolomnya, mis. SIM, domisili, atau kesediaan ditempatkan.",
    good: "SIM: A dan C",
    weak: "Hobi: rebahan",
    weakWhy: "Tidak relevan dengan pekerjaan dan memakan tempat.",
  },
  summary: {
    title: "Ringkasan profesional",
    what: "2 sampai 4 kalimat di bagian atas CV: siapa kamu, keahlian utama, dan hasil yang pernah kamu capai. Sesuaikan dengan posisi yang dilamar.",
    good: "Staf admin dengan pengalaman [angka] tahun mengelola arsip dan laporan keuangan. Terbiasa memakai Excel untuk rekap harian dan menyelesaikan laporan bulanan tepat waktu.",
    weak: "Saya orang yang jujur, disiplin, dan mau belajar.",
    weakWhy: "Sifat umum tanpa bukti; tidak menyebut keahlian atau pengalaman.",
  },
  jobTitle: {
    title: "Judul posisi yang dilamar",
    what: "Nama posisi di lowongan yang kamu incar. Tidak dicetak di CV; dipakai AI untuk menyesuaikan saran dan kata kunci.",
    good: "Staf Administrasi Keuangan",
    weak: "Apa saja",
    weakWhy: "AI tidak punya acuan, jadi sarannya jadi umum.",
  },
  jobDescription: {
    title: "Deskripsi lowongan",
    what: "Tempel teks lowongan (tugas dan kualifikasi). Tidak dicetak di CV. AI mengambil kata kunci dari sini agar saran sesuai lowongan.",
    good: "Tanggung jawab: menyusun laporan keuangan bulanan, rekonsiliasi bank. Kualifikasi: menguasai Excel, teliti.",
    weak: "Lowongan admin",
    weakWhy: "Terlalu pendek; tidak ada tugas atau kualifikasi yang bisa dicocokkan.",
  },
  companyDescription: {
    title: "Deskripsi perusahaan",
    what: "Satu kalimat singkat tentang tempat kerjamu, berguna bila perusahaannya kurang dikenal pembaca.",
    good: "Distributor alat tulis kantor dengan [jumlah orang] karyawan di [kota]",
    weak: "Perusahaan bagus dan terkenal",
    weakWhy: "Tidak menjelaskan bidang atau skala perusahaan.",
  },
  achievement: {
    title: "Pencapaian utama",
    what: "Satu hasil paling menonjol di posisi ini. Tulis apa yang kamu lakukan dan hasilnya. Pakai angka asli bila ada.",
    good: "Mempercepat proses rekap stok dari [angka] hari menjadi [angka] hari dengan template Excel baru",
    weak: "Bekerja dengan baik",
    weakWhy: "Tidak ada tindakan atau hasil yang bisa dinilai.",
  },
  workDescription: {
    title: "Deskripsi kerja",
    what: "Tugas dan hasil kerjamu, satu poin per baris. Mulai dengan kata kerja, sebutkan alat atau cara, lalu hasilnya.",
    good: "Menyusun laporan penjualan mingguan untuk [jumlah orang] tim sales memakai Excel",
    weak: "Bertanggung jawab atas laporan",
    weakWhy: "Tidak jelas laporan apa, untuk siapa, dan hasilnya apa.",
  },
  gpa: {
    title: "IPK",
    what: "Isi bila diminta lowongan atau bila masih fresh graduate. Tulis lengkap dengan skala maksimalnya. Boleh dikosongkan.",
    good: "[angka] / 4,00",
    weak: "Cumlaude",
    weakWhy: "Tanpa angka dan skala, pembaca tidak bisa membandingkan.",
  },
  skills: {
    title: "Kategori & level skill",
    what: "Kategori mengelompokkan skill: teknis (keahlian kerja), soft skill (cara bekerja dengan orang), tools (aplikasi). Level: Pemula masih belajar, Menengah bisa sendiri, Mahir lancar dan bisa membimbing. Level hanya tampil bila diaktifkan di Pengaturan Tampilan.",
    good: "Microsoft Excel (Tools, Menengah)",
    weak: "Komputer (Mahir)",
    weakWhy: "Terlalu luas; sebutkan aplikasi atau keahlian yang spesifik.",
  },
  certifications: {
    title: "Sertifikasi",
    what: "Sertifikat atau lisensi resmi yang benar-benar kamu punya, dengan nama penerbit dan tahun.",
    good: "[Nama sertifikat], [penerbit], [tahun]",
    weak: "Ikut banyak webinar",
    weakWhy: "Bukan sertifikasi; tulis nama sertifikat yang jelas atau lewati.",
  },
  selfEvaluation: {
    title: "Evaluasi Diri",
    what: "Penilaianmu tentang cara kerja sendiri, disertai contoh singkat. Opsional; banyak lowongan tidak memintanya.",
    good: "Teliti dalam pekerjaan angka: terbiasa mengecek ulang laporan sebelum dikirim ke atasan.",
    weak: "Saya perfeksionis",
    weakWhy: "Klise dan tanpa contoh nyata.",
  },
  extraSection: {
    title: "Bagian tambahan",
    what: "Untuk hal penting yang tidak masuk bagian lain, mis. penghargaan, proyek, bahasa, atau pelatihan. Judulnya bisa kamu ubah.",
    good: "Bahasa Inggris: aktif, TOEFL ITP [skor]",
    weak: "Lain-lain: suka membaca",
    weakWhy: "Judul tidak jelas dan isinya tidak menambah nilai untuk lowongan.",
  },
} satisfies Record<string, FieldHelpContent>;

export type BuilderHelpKey = keyof typeof BUILDER_HELP;
