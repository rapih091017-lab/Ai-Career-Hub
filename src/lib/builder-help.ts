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
  /** Versi Inggris untuk UI berbahasa Inggris. Tanpa ini, isi Indonesia yang tampil. */
  en?: FieldHelpText;
}

export type FieldHelpText = Omit<FieldHelpContent, "en">;

/** Pilih isi sesuai bahasa UI. */
export function localizeHelp(h: FieldHelpContent, lang: "id" | "en"): FieldHelpText {
  return lang === "en" && h.en ? h.en : h;
}

/** Tempelkan versi Inggris ke tiap entri tanpa mengubah kuncinya. */
export function withEnglish<K extends string>(
  id: Record<K, FieldHelpText>,
  en: Record<K, FieldHelpText>,
): Record<K, FieldHelpContent> {
  const out = {} as Record<K, FieldHelpContent>;
  for (const key of Object.keys(id) as K[]) out[key] = { ...id[key], en: en[key] };
  return out;
}

const BUILDER_HELP_ID = {
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
} satisfies Record<string, FieldHelpText>;

export type BuilderHelpKey = keyof typeof BUILDER_HELP_ID;

const BUILDER_HELP_EN: Record<BuilderHelpKey, FieldHelpText> = {
  professionalTitle: {
    title: "Professional title",
    what: "One line under your name on the CV. Use the role you hold or want, not a motivational phrase. This is printed on the CV, unlike the Job title under Target Job, which only the AI reads.",
    good: "Finance Admin | Bank Reconciliation & Monthly Reports",
    weak: "Hard worker who loves to learn",
    weakWhy: "It says nothing about your field or role.",
  },
  employmentStatus: {
    title: "Employment status",
    what: "Where you are right now, e.g. employed, job hunting, or fresh graduate. It tells the reader when you can start.",
    good: "Fresh graduate, available to start",
    weak: "Unemployed",
    weakWhy: "It reads as negative. Pick a neutral term that shows you are ready.",
  },
  customFields: {
    title: "Custom fields",
    what: "Extra personal details a job posting asks for that have no field yet, e.g. driving licence, home city, or willingness to relocate.",
    good: "Driving licence: A and C",
    weak: "Hobby: lying around",
    weakWhy: "Not relevant to the job, and it takes up space.",
  },
  summary: {
    title: "Professional summary",
    what: "Two to four sentences at the top of the CV: who you are, your main skills, and results you have delivered. Tailor it to the role.",
    good: "Admin staff with [number] years of experience managing records and financial reports. Uses Excel for daily recaps and closes monthly reports on time.",
    weak: "I am honest, disciplined, and eager to learn.",
    weakWhy: "Generic traits with no proof; no skills or experience mentioned.",
  },
  jobTitle: {
    title: "Job title you are applying for",
    what: "The role name in the posting you want. Not printed on the CV; the AI uses it to tailor suggestions and keywords.",
    good: "Finance Admin",
    weak: "Anything",
    weakWhy: "The AI has nothing to aim at, so its suggestions stay generic.",
  },
  jobDescription: {
    title: "Job description",
    what: "Paste the posting text (duties and requirements). Not printed on the CV. The AI pulls keywords from it so suggestions match the job.",
    good: "Duties: prepare monthly financial reports, bank reconciliation. Requirements: strong Excel, detail-oriented.",
    weak: "Admin job",
    weakWhy: "Too short; there are no duties or requirements to match.",
  },
  companyDescription: {
    title: "Company description",
    what: "One short sentence about where you worked, useful when the reader may not know the company.",
    good: "Office supplies distributor with [team size] employees in [city]",
    weak: "Great, well-known company",
    weakWhy: "It does not say what the company does or how big it is.",
  },
  achievement: {
    title: "Key achievement",
    what: "Your standout result in this role. Write what you did and what came of it. Use real numbers if you have them.",
    good: "Cut stock recap time from [number] days to [number] days with a new Excel template",
    weak: "Did a good job",
    weakWhy: "There is no action or result to judge.",
  },
  workDescription: {
    title: "Work description",
    what: "Your duties and results, one point per line. Start with a verb, name the tool or method, then the result.",
    good: "Prepared weekly sales reports in Excel for a sales team of [team size]",
    weak: "Responsible for reports",
    weakWhy: "Which reports, for whom, and with what result is unclear.",
  },
  gpa: {
    title: "GPA",
    what: "Fill this in if the posting asks for it or you are a fresh graduate. Include the maximum scale. You can leave it empty.",
    good: "[number] / 4,00",
    weak: "Cum laude",
    weakWhy: "Without a number and scale, the reader cannot compare.",
  },
  skills: {
    title: "Skill category & level",
    what: "Categories group your skills: technical (job skills), soft skills (how you work with people), tools (software). Levels: Beginner is still learning, Intermediate works independently, Advanced is fluent and can coach others. Levels only show when turned on in Display Settings.",
    good: "Microsoft Excel (Tools, Intermediate)",
    weak: "Computers (Advanced)",
    weakWhy: "Too broad; name the specific software or skill.",
  },
  certifications: {
    title: "Certifications",
    what: "Official certificates or licences you actually hold, with the issuer and year.",
    good: "[Certificate name], [issuer], [year]",
    weak: "Attended lots of webinars",
    weakWhy: "That is not a certification. Name a clear certificate or skip it.",
  },
  selfEvaluation: {
    title: "Self-assessment",
    what: "How you rate your own way of working, with a short example. Optional; most postings do not ask for it.",
    good: "Careful with numbers: I double-check reports before sending them to my manager.",
    weak: "I am a perfectionist",
    weakWhy: "A cliché with no real example.",
  },
  extraSection: {
    title: "Extra section",
    what: "For anything important that fits no other section, e.g. awards, projects, languages, or training. You can rename the title.",
    good: "English: fluent, TOEFL ITP [score]",
    weak: "Other: likes reading",
    weakWhy: "The title is vague and the content adds nothing for the job.",
  },
};

export const BUILDER_HELP = withEnglish(BUILDER_HELP_ID, BUILDER_HELP_EN);

/** Contoh isi (placeholder) per judul bagian tambahan. Fakta diganti [placeholder]. */
const EXTRA_SECTION_EXAMPLES: Record<string, string> = {
  penghargaan: "Contoh: Juara [peringkat] Lomba [nama lomba] tingkat [provinsi/nasional], [tahun]",
  proyek: "Contoh: Sistem absensi web untuk [nama organisasi]: merancang database dan halaman admin",
  publikasi: "Contoh: [Judul tulisan], [nama jurnal atau media], [tahun]",
  bahasa: "Contoh: Inggris: aktif (TOEFL ITP [skor])",
  "kegiatan sukarela": "Contoh: Relawan pengajar di [nama komunitas], [tahun]",
  pelatihan: "Contoh: Pelatihan [nama pelatihan], [penyelenggara], [tahun]",
};

const EXTRA_SECTION_FALLBACK = "Contoh: Juara [peringkat] Lomba [nama lomba], [tahun]";

/** Padanan Inggris; judul bagian bisa ditulis dalam bahasa CV mana pun. */
const EXTRA_SECTION_EXAMPLES_EN: Record<string, string> = {
  penghargaan: "Example: [rank] place, [competition name], [regional/national] level, [year]",
  proyek: "Example: Web attendance system for [organisation name]: designed the database and admin pages",
  publikasi: "Example: [Article title], [journal or outlet], [year]",
  bahasa: "Example: English: fluent (TOEFL ITP [score])",
  "kegiatan sukarela": "Example: Volunteer teacher at [community name], [year]",
  pelatihan: "Example: [Training name], [organiser], [year]",
};
const EN_TITLE_ALIAS: Record<string, string> = {
  awards: "penghargaan", projects: "proyek", publications: "publikasi", languages: "bahasa",
  volunteering: "kegiatan sukarela", "volunteer work": "kegiatan sukarela", training: "pelatihan",
};
const EXTRA_SECTION_FALLBACK_EN = "Example: [rank] place, [competition name], [year]";

export function extraSectionPlaceholder(title: string, lang: "id" | "en" = "id"): string {
  const key = title.trim().toLowerCase();
  if (lang === "en") return EXTRA_SECTION_EXAMPLES_EN[EN_TITLE_ALIAS[key] ?? key] ?? EXTRA_SECTION_FALLBACK_EN;
  return EXTRA_SECTION_EXAMPLES[key] ?? EXTRA_SECTION_FALLBACK;
}
