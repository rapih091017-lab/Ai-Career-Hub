import { withEnglish, type FieldHelpText } from "@/lib/builder-help";

/**
 * Isi bantuan (ikon i) per field builder portofolio. Aturan sama dengan
 * builder-help: tanpa angka, perusahaan, atau sertifikat karangan; fakta yang
 * harus diisi user ditulis sebagai placeholder [angka], [persen], [nama klien].
 */
const PORTFOLIO_HELP_ID = {
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
} satisfies Record<string, FieldHelpText>;

export type PortfolioHelpKey = keyof typeof PORTFOLIO_HELP_ID;

const PORTFOLIO_HELP_EN: Record<PortfolioHelpKey, FieldHelpText> = {
  heroHeadline: {
    title: "Main role",
    what: "The role you hold or want, shown large at the top of your portfolio. One clear role is enough.",
    good: "UI/UX Designer",
    weak: "Creative, hardworking, and loves a challenge",
    weakWhy: "Those are traits, not a role. Visitors cannot tell what you do.",
  },
  heroSubHeadline: {
    title: "Tagline",
    what: "One short line near your name: the field you know well and who you work for.",
    good: "Designing mobile apps that first-time users find easy",
    weak: "Welcome to my portfolio",
    weakWhy: "It tells visitors nothing about you.",
  },
  heroBio: {
    title: "Short bio",
    what: "Two or three sentences: who you are, your main skills, and the kind of work you are looking for.",
    good: "UI designer with [number] years on booking apps. Focused on user research and fast prototyping.",
    weak: "I am passionate and always eager to grow.",
    weakWhy: "Very generic; no skills or field mentioned.",
  },
  aboutText: {
    title: "About me",
    what: "Your career story: how you started, what you work on now, and what you want to do next.",
    good: "Started with a campus project building the student association site, then built [number] sites for small businesses. Now digging into web accessibility.",
    weak: "I am a new graduate ready to work anywhere.",
    weakWhy: "There is no story or proof the reader can hold on to.",
  },
  skillsMain: {
    title: "Main skills",
    what: "The skills you most want to highlight, separated by commas. Pick ones you actually use in projects.",
    good: "User research, Wireframing, Interactive prototypes",
    weak: "Microsoft Word, Internet, Teamwork",
    weakWhy: "Too common to set you apart from other applicants.",
  },
  projectName: {
    title: "Project name",
    what: "A short name that says what the project is.",
    good: "Clinic queue app",
    weak: "New project",
    weakWhy: "Visitors have to open the details to find out what it is.",
  },
  projectDescription: {
    title: "Project description",
    what: "One point per line: the problem you solved, your role, and the result. A result you have not measured yet can use a placeholder you fill in later.",
    good: "Designed an online queue sign-up flow for clinic patients\nCut waiting time at the front desk by about [percent]",
    weak: "Built an app with React",
    weakWhy: "It only names a tool; no problem or result.",
  },
  techStack: {
    title: "Tools / tech stack",
    what: "Tools and technologies used in this project, separated by commas.",
    good: "Figma, React, Firebase",
    weak: "Computer, internet",
    weakWhy: "Not specific.",
  },
  experienceDescription: {
    title: "Experience description",
    what: "One point per line. Start with a verb, say what you did and what changed because of it.",
    good: "Prepared weekly sales reports for [number] branches\nBuilt a template that saves [number] hours of recap work per week",
    weak: "Responsible for reports",
    weakWhy: "It is unclear what you did and how big the result was.",
  },
  testimonial: {
    title: "Testimonial",
    what: "A real quote from a manager, client, or colleague. Write it exactly as they said it and ask permission before showing it.",
    good: "\"Her designs are tidy and she always explains the reason behind each decision.\"",
    weak: "\"The best person ever.\"",
    weakWhy: "Empty praise with no example sounds made up.",
  },
};

export const PORTFOLIO_HELP = withEnglish(PORTFOLIO_HELP_ID, PORTFOLIO_HELP_EN);
