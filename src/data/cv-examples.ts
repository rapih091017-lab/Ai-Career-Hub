/**
 * Contoh CV per role untuk halaman SEO /contoh-cv.
 *
 * Daftar 10 role disusun dari laporan industri yang umum dipublikasikan
 * (Jobstreet, LinkedIn, Glints, dan laporan ketenagakerjaan) tentang posisi
 * yang paling banyak dibuka dan dicari di Indonesia. Semua contoh bersifat
 * template edukatif: angka dan nama bersifat placeholder yang harus diganti
 * dengan data nyata pengguna.
 */

export interface CvExample {
  slug: string;
  title: string;
  category: string;
  tagline: string;
  intro: string;
  summaryExample: string;
  keySkills: string[];
  experienceExamples: { position: string; company: string; period: string; bullets: string[] }[];
  atsKeywords: string[];
  tips: string[];
}

export const CV_EXAMPLES: CvExample[] = [
  {
    slug: "software-engineer",
    title: "Software Engineer",
    category: "Teknologi",
    tagline: "CV yang menonjolkan dampak teknis dan skala sistem.",
    intro:
      "Posisi software engineer termasuk yang paling banyak dibuka di Indonesia, dari startup sampai perusahaan besar. Recruiter dan hiring manager mencari bukti dampak: fitur yang dirilis, performa yang meningkat, dan skala yang ditangani. Contoh di bawah menunjukkan cara menulis pencapaian teknis dengan angka, bukan hanya daftar teknologi.",
    summaryExample:
      "Software engineer dengan 4 tahun pengalaman membangun aplikasi web dan layanan backend. Terbiasa dengan Node.js, TypeScript, PostgreSQL, dan CI/CD. Berhasil menurunkan waktu respons API 60% dan memimpin migrasi layanan ke arsitektur modular yang dipakai 3 tim.",
    keySkills: ["TypeScript", "Node.js", "React", "PostgreSQL", "REST API", "Docker", "CI/CD", "Unit Testing", "Git", "System Design Dasar"],
    experienceExamples: [
      {
        position: "Software Engineer",
        company: "PT Teknologi Contoh",
        period: "Januari 2023 - Sekarang",
        bullets: [
          "Merancang dan merilis 3 layanan API yang melayani 200 ribu permintaan per hari dengan uptime 99,9%.",
          "Mengoptimalkan query database dan caching sehingga waktu respons endpoint utama turun dari 800ms ke 320ms.",
          "Menulis pengujian otomatis yang menurunkan bug produksi 35% dalam dua kuartal.",
        ],
      },
      {
        position: "Junior Web Developer",
        company: "Startup Digital Contoh",
        period: "Juli 2021 - Desember 2022",
        bullets: [
          "Membangun dashboard internal dengan React dan TypeScript yang dipakai 120 staf operasional.",
          "Berkolaborasi dengan tim produk untuk merilis 15 fitur tanpa penundaan jadwal.",
        ],
      },
    ],
    atsKeywords: ["software engineer", "full stack", "API", "REST", "database", "testing", "deployment", "agile", "scrum", "code review"],
    tips: [
      "Sebut skala: jumlah pengguna, permintaan per hari, atau ukuran data.",
      "Tunjukkan dampak bisnis, bukan hanya daftar teknologi.",
      "Cantumkan tautan GitHub atau portofolio proyek kamu di bagian atas CV.",
    ],
  },
  {
    slug: "data-analyst",
    title: "Data Analyst",
    category: "Data & Analitik",
    tagline: "CV yang menonjolkan keputusan bisnis dari data.",
    intro:
      "Permintaan data analyst terus tumbuh di Indonesia seiring perusahaan beralih ke pengambilan keputusan berbasis data. Yang membedakan kandidat kuat: kemampuan menerjemahkan angka menjadi rekomendasi. Contoh CV ini menonjolkan hasil analisis yang mengubah keputusan, bukan hanya tool yang dikuasai.",
    summaryExample:
      "Data analyst dengan 3 tahun pengalaman mengubah data operasional menjadi rekomendasi bisnis. Mahir SQL, Python (pandas), dan dashboard Looker Studio. Analisis churn saya membantu menahan 18% pelanggan yang berisiko berhenti dalam satu semester.",
    keySkills: ["SQL", "Python (pandas)", "Excel Lanjutan", "Looker Studio / Power BI", "Statistik Dasar", "A/B Testing", "Data Cleaning", "Google Analytics", "Storytelling Data", "ETL Sederhana"],
    experienceExamples: [
      {
        position: "Data Analyst",
        company: "PT Retail Contoh",
        period: "Maret 2023 - Sekarang",
        bullets: [
          "Membangun dashboard penjualan mingguan yang dipakai 5 kepala cabang untuk keputusan stok.",
          "Menganalisis perilaku 40 ribu pengguna dan mengusulkan 3 prioritas fitur yang menaikkan konversi 12%.",
          "Mengotomatiskan laporan manual 6 jam per minggu menjadi 10 menit dengan skrip Python.",
        ],
      },
      {
        position: "Junior Analyst",
        company: "Agensi Data Contoh",
        period: "Agustus 2022 - Februari 2023",
        bullets: [
          "Membersihkan dan menggabungkan data kampanye dari 4 sumber untuk 12 klien.",
          "Menyusun laporan performa bulanan dengan rekomendasi yang dipakai tim media buying.",
        ],
      },
    ],
    atsKeywords: ["data analyst", "SQL", "dashboards", "reporting", "data visualization", "business intelligence", "statistics", "python", "KPI", "insight"],
    tips: [
      "Tulis hasil analisis sebagai keputusan atau angka yang berubah.",
      "Cantumkan tautan dashboard portofolio publik (Looker Studio gratis).",
      "Sebut jenis data yang pernah ditangani: volume, sumber, dan frekuensinya.",
    ],
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing Specialist",
    category: "Marketing",
    tagline: "CV yang berbicara lewat metrik kampanye.",
    intro:
      "Digital marketing adalah salah satu posisi dengan pembukaan terbanyak di Indonesia. Rekruter mencari bukti kemampuan mengelola anggaran dan menaikkan metrik: CTR, ROAS, biaya akuisisi, dan pertumbuhan organik. Contoh ini menunjukkan cara menuliskan angka kampanye dengan jujur dan spesifik.",
    summaryExample:
      "Digital marketing specialist dengan 4 tahun pengalaman mengelola kampanye Meta dan Google Ads untuk e-commerce. Mengelola budget bulanan Rp150 juta dengan ROAS rata-rata 4,2. Menumbuhkan pengikut organik Instagram dari 8 ribu ke 45 ribu dalam 10 bulan.",
    keySkills: ["Meta Ads", "Google Ads", "SEO On-Page", "Google Analytics 4", "Email Marketing", "Copywriting Iklan", "Content Calendar", "A/B Testing", "Budget Management", "Laporan Performa"],
    experienceExamples: [
      {
        position: "Digital Marketing Specialist",
        company: "PT E-Commerce Contoh",
        period: "Februari 2023 - Sekarang",
        bullets: [
          "Mengelola budget iklan Rp150 juta per bulan dengan ROAS 4,2 (target 3,5).",
          "Menurunkan biaya akuisisi pelanggan 28% melalui pengujian 40 varian iklan dalam 6 bulan.",
          "Memimpin strategi konten organik yang menambah 37 ribu pengikut Instagram dan 25% traffic website.",
        ],
      },
      {
        position: "Marketing Executive",
        company: "Agensi Kreatif Contoh",
        period: "Januari 2022 - Januari 2023",
        bullets: [
          "Menjalankan kampanye peluncuran produk untuk 6 klien dengan total 3 juta impresi.",
          "Menyusun laporan mingguan performa yang menjadi dasar revisi strategi bulanan.",
        ],
      },
    ],
    atsKeywords: ["digital marketing", "SEO", "SEM", "social media", "campaign", "ROAS", "conversion", "engagement", "analytics", "content"],
    tips: [
      "Selalu sebutkan budget yang dikelola dan hasilnya (ROAS, CPA, pertumbuhan).",
      "Pisahkan pencapaian berbayar dan organik agar mudah dinilai.",
      "Tunjukkan kepemilikan strategi, bukan hanya eksekusi tugas.",
    ],
  },
  {
    slug: "ui-ux-designer",
    title: "UI/UX Designer",
    category: "Desain",
    tagline: "CV yang menunjukkan proses dan dampak desain.",
    intro:
      "Peran UI/UX designer banyak dicari di startup dan perusahaan produk di Indonesia. Portofolio adalah senjata utama, tapi CV yang baik menjelaskan proses berpikir: riset pengguna, iterasi, dan hasil yang terukur. Contoh ini menyeimbangkan keindahan visual dan bukti dampak.",
    summaryExample:
      "UI/UX designer dengan 3 tahun pengalaman merancang aplikasi mobile dan web. Memimpin redesign alur checkout yang menaikkan konversi 22%. Terbiasa memfasilitasi usability testing dengan 30+ responden dan membangun design system lintas tim.",
    keySkills: ["Figma", "Wireframing", "Prototyping", "User Research", "Usability Testing", "Design System", "Journey Mapping", "Accessibility", "Interaction Design", "Handoff Developer"],
    experienceExamples: [
      {
        position: "UI/UX Designer",
        company: "Startup Produk Contoh",
        period: "April 2023 - Sekarang",
        bullets: [
          "Memimpin redesign alur checkout setelah 12 sesi usability testing, menaikkan konversi 22%.",
          "Membangun design system dengan 80+ komponen yang mempercepat handoff ke developer 40%.",
          "Berkolaborasi dengan PM dan engineer dalam 6 rilis besar tanpa redesain ulang di akhir sprint.",
        ],
      },
      {
        position: "Visual Designer",
        company: "Agensi Digital Contoh",
        period: "Juni 2022 - Maret 2023",
        bullets: [
          "Merancang 25 halaman landing untuk 10 klien dengan rata-rata waktu produksi 3 hari per halaman.",
          "Menyusun guideline visual yang dipakai tim konten untuk menjaga konsistensi brand.",
        ],
      },
    ],
    atsKeywords: ["ui design", "ux research", "figma", "wireframe", "prototype", "usability", "user flow", "design system", "mobile app", "web design"],
    tips: [
      "Selalu tautkan portofolio (Figma/Behance) di bagian atas dan pastikan bisa diakses publik.",
      "Tulis proses: masalah, riset, solusi, dan dampak, bukan hanya daftar tools.",
      "Cantumkan metrik: konversi, waktu tugas, skor usability, atau kepuasan pengguna.",
    ],
  },
  {
    slug: "sales-business-development",
    title: "Sales Executive / Business Development",
    category: "Penjualan",
    tagline: "CV yang berteriak lewat angka penjualan.",
    intro:
      "Sales dan business development adalah posisi paling stabil permintaannya di hampir semua industri Indonesia. Rekruter hanya butuh satu hal: bukti angka. Contoh CV ini menunjukkan cara menulis target, pencapaian persen quota, dan nilai kontrak dengan jelas.",
    summaryExample:
      "Sales executive dengan 4 tahun pengalaman B2B dan retail. Konsisten mencapai 110-135% dari target kuartalan dengan nilai penjualan Rp2,4 miliar per tahun. Terbiasa membangun pipeline dari nol dan memelihara hubungan klien jangka panjang.",
    keySkills: ["Prospecting", "Negosiasi", "Presentasi Produk", "CRM (Salesforce/HubSpot)", "Pipeline Management", "Closing", "Account Management", "Riset Pasar", "Cold Calling", "Laporan Penjualan"],
    experienceExamples: [
      {
        position: "Sales Executive",
        company: "PT Distribusi Contoh",
        period: "Januari 2022 - Sekarang",
        bullets: [
          "Mencapai 118% target tahunan dengan total penjualan Rp2,4 miliar dari 45 klien aktif.",
          "Membuka 3 wilayah pemasaran baru yang menyumbang 22% pendapatan divisi.",
          "Mempertahankan retensi klien 92% melalui program kunjungan rutin dan review kebutuhan.",
        ],
      },
      {
        position: "Business Development",
        company: "Startup B2B Contoh",
        period: "Maret 2021 - Desember 2021",
        bullets: [
          "Membangun pipeline 200 prospek dan menutup 18 kontrak dengan nilai rata-rata Rp35 juta.",
          "Menyusun materi pitching yang menaikkan rasio meeting lanjutan dari 30% ke 55%.",
        ],
      },
    ],
    atsKeywords: ["sales", "business development", "target", "quota", "pipeline", "negotiation", "CRM", "account management", "closing", "revenue"],
    tips: [
      "Tulis persentase pencapaian target, nominal penjualan, dan jumlah klien.",
      "Sebut jenis penjualan: B2B, B2C, retail, korporat, atau government.",
      "Tunjukkan kemampuan membangun pipeline dari nol bila ada.",
    ],
  },
  {
    slug: "customer-service",
    title: "Customer Service",
    category: "Operasional",
    tagline: "CV yang menunjukkan empati dan kecepatan.",
    intro:
      "Customer service selalu dibutuhkan lintas industri, dari perbankan hingga e-commerce. Pemberi kerja mencari bukti kecepatan respons, kepuasan pelanggan, dan kemampuan menyelesaikan masalah. Contoh CV ini menonjolkan metrik layanan yang konkret.",
    summaryExample:
      "Customer service representative dengan 3 tahun pengalaman di industri e-commerce. Menangani 80+ tiket per hari dengan skor kepuasan 4,8 dari 5. Berhasil menurunkan eskalasi tim 15% lewat basis pengetahuan yang saya susun.",
    keySkills: ["Komunikasi Empatis", "Penanganan Komplain", "Zendesk / CRM", "SLA Management", "Multi-Channel (Chat, Email, Telepon)", "Problem Solving", "Product Knowledge", "Dokumentasi Tiket", "Kerja Tim", "Multitasking"],
    experienceExamples: [
      {
        position: "Customer Service Representative",
        company: "PT E-Commerce Contoh",
        period: "Februari 2022 - Sekarang",
        bullets: [
          "Menangani rata-rata 85 tiket per hari dengan kepuasan pelanggan 4,8 dari 5.",
          "Menyusun basis pengetahuan 40 artikel yang menurunkan tiket berulang 15%.",
          "Menjadi mentor 4 staf baru dengan waktu onboarding turun dari 3 minggu ke 2 minggu.",
        ],
      },
      {
        position: "Frontliner",
        company: "Retail Contoh",
        period: "Agustus 2021 - Januari 2022",
        bullets: [
          "Melayani 100+ pelanggan per hari dengan penanganan komplain rata-rata di bawah 10 menit.",
          "Menerima penghargaan staf terbaik bulanan dua kali berturut-turut.",
        ],
      },
    ],
    atsKeywords: ["customer service", "customer support", "CS", "complaint handling", "SLA", "satisfaction", "ticketing", "live chat", "call center", "helpdesk"],
    tips: [
      "Sebutkan angka: jumlah tiket harian, skor kepuasan, dan waktu penyelesaian.",
      "Tunjukkan penanganan situasi sulit dengan tetap tenang dan solutif.",
      "Cantumkan tools yang dikuasai: Zendesk, Qontak, Freshdesk, atau CRM lain.",
    ],
  },
  {
    slug: "accounting-finance",
    title: "Staff Accounting / Finance",
    category: "Keuangan",
    tagline: "CV yang menonjolkan ketelitian dan kepatuhan.",
    intro:
      "Staff accounting dan finance adalah tulang punggung kepatuhan keuangan perusahaan. Rekruter mencari bukti ketelitian, penguasaan pajak, dan ketepatan waktu pelaporan. Contoh CV ini menunjukkan pencapaian proses dan akurasi, bukan hanya daftar tanggung jawab.",
    summaryExample:
      "Staff accounting dengan 4 tahun pengalaman menangani laporan keuangan bulanan, rekonsiliasi bank, dan pelaporan PPN/PPh. Menutup buku bulanan 3 hari lebih cepat lewat perbaikan proses dan akurasi mencapai 99,8%.",
    keySkills: ["Jurnal & Buku Besar", "Rekonsiliasi Bank", "Laporan Keuangan PSAK", "Pajak (PPN, PPh 21/23)", "Excel Lanjutan", "Accurate / SAP / MYOB", "Cash Flow", "Kontrol Internal", "E-Faktur", "Audit Support"],
    experienceExamples: [
      {
        position: "Staff Accounting",
        company: "PT Manufaktur Contoh",
        period: "Januari 2022 - Sekarang",
        bullets: [
          "Menutup laporan keuangan bulanan rata-rata 3 hari lebih cepat dari tenggat internal.",
          "Merapikan rekonsiliasi 6 rekening bank dengan tingkat akurasi 99,8% sepanjang tahun.",
          "Menyiapkan dokumen audit eksternal yang memangkas waktu audit 25%.",
        ],
      },
      {
        position: "Junior Finance Staff",
        company: "Distributor Contoh",
        period: "September 2020 - Desember 2021",
        bullets: [
          "Memproses 300+ transaksi AP per bulan tanpa keterlambatan pembayaran.",
          "Menyusun arsip pajak digital yang mempermudah pelaporan masa bulanan.",
        ],
      },
    ],
    atsKeywords: ["accounting", "finance", "reconciliation", "financial report", "tax", "PPN", "PPh", "journal entries", "audit", "accrual"],
    tips: [
      "Sebut software yang benar-benar dikuasai: Accurate, SAP, MYOB, atau Xero.",
      "Tunjukkan akurasi dan ketepatan waktu dengan angka.",
      "Bila pernah ikut audit, jelaskan peran dan hasilnya.",
    ],
  },
  {
    slug: "hr-recruiter",
    title: "HR / Recruiter",
    category: "SDM",
    tagline: "CV yang menunjukkan dampak pada orang dan proses.",
    intro:
      "HR dan rekrutmen adalah fungsi yang terus berkembang di Indonesia, dari administrasi sampai people development. Perusahaan mencari bukti kemampuan mengelola siklus rekrutmen, hubungan karyawan, dan perbaikan proses. Contoh CV ini menonjolkan waktu rekrutmen dan kualitas kandidat.",
    summaryExample:
      "HR generalist dengan 3 tahun pengalaman menangani rekrutmen end-to-end, administrasi kepegawaian, dan employee engagement. Memangkas waktu pengisian posisi dari 45 hari ke 28 hari dan menaikkan skor engagement tim 20%.",
    keySkills: ["Rekrutmen End-to-End", "Interview & Assessment", "HRIS", "Administrasi BPJS & PPh 21", "Employee Relations", "Onboarding", "Training Coordination", "HR Reporting", "UU Ketenagakerjaan", "Employer Branding"],
    experienceExamples: [
      {
        position: "HR Generalist",
        company: "PT Teknologi Contoh",
        period: "Maret 2022 - Sekarang",
        bullets: [
          "Menutup 60+ posisi dalam setahun dengan waktu rata-rata 28 hari (sebelumnya 45 hari).",
          "Membangun program onboarding terstruktur yang menaikkan retensi karyawan baru 90 hari dari 78% ke 92%.",
          "Mengoordinasikan program engagement yang menaikkan skor survei internal 20%.",
        ],
      },
      {
        position: "Recruitment Assistant",
        company: "Agensi Rekrutmen Contoh",
        period: "Juli 2021 - Februari 2022",
        bullets: [
          "Menyeleksi 40+ CV per hari dan menjadwalkan 25 wawancara per minggu tanpa bentrok agenda.",
          "Membangun database kandidat 1.200 profil yang mempercepat sourcing posisi serupa.",
        ],
      },
    ],
    atsKeywords: ["HR", "recruitment", "talent acquisition", "onboarding", "employee relations", "HRIS", "payroll", "BPJS", "interview", "people development"],
    tips: [
      "Tekankan waktu rekrutmen, kualitas hire, dan retensi, bukan hanya jumlah CV.",
      "Tunjukkan pemahaman aturan ketenagakerjaan yang relevan.",
      "Sebut sistem yang dikuasai: Talenta, Mekari, BambooHR, atau HRIS lain.",
    ],
  },
  {
    slug: "content-writer",
    title: "Content Writer / Copywriter",
    category: "Konten & Kreatif",
    tagline: "CV yang berbicara lewat traffic dan konversi konten.",
    intro:
      "Industri konten Indonesia tumbuh cepat: media, agensi, dan brand semuanya membutuhkan penulis. Recruiter menilai portofolio, tapi CV yang kuat menunjukkan dampak konten: traffic organik, konversi, dan engagement. Contoh ini menunjukkan cara mengubah tulisan menjadi angka.",
    summaryExample:
      "Content writer dengan 3 tahun pengalaman menulis artikel SEO, copywriting iklan, dan skrip video. Membawa artikel panduan produk ke peringkat 1 Google dengan 40 ribu kunjungan organik per bulan, dan menaikkan konversi halaman penjualan 18% lewat penulisan ulang.",
    keySkills: ["SEO Writing", "Copywriting", "Riset Kata Kunci", "Editing & Proofreading", "Content Strategy", "WordPress / CMS", "Google Analytics", "Skrip Video Pendek", "Email Newsletter", "Storytelling Brand"],
    experienceExamples: [
      {
        position: "Content Writer",
        company: "Media Digital Contoh",
        period: "April 2022 - Sekarang",
        bullets: [
          "Menulis 120+ artikel SEO per tahun; 15 artikel menempati peringkat 1-3 Google.",
          "Menaikkan kunjungan organik situs dari 12 ribu ke 40 ribu per bulan dalam 12 bulan.",
          "Membangun panduan gaya penulisan yang dipakai 5 penulis lepas.",
        ],
      },
      {
        position: "Copywriter",
        company: "Agensi Kreatif Contoh",
        period: "Januari 2021 - Maret 2022",
        bullets: [
          "Menulis copy untuk 30+ kampanye iklan digital dengan rata-rata CTR di atas benchmark industri.",
          "Menyusun ulang halaman penjualan klien yang menaikkan konversi 18%.",
        ],
      },
    ],
    atsKeywords: ["content writer", "copywriter", "SEO", "blog", "article", "editorial", "content strategy", "proofreading", "social media copy", "creative writing"],
    tips: [
      "Selalu sertakan tautan portofolio: blog, Medium, atau klip konten.",
      "Tunjukkan angka: traffic, ranking kata kunci, CTR, atau konversi.",
      "Sesuaikan contoh tulisan dengan industri yang dilamar.",
    ],
  },
  {
    slug: "product-manager",
    title: "Product Manager",
    category: "Produk & Teknologi",
    tagline: "CV yang menunjukkan kepemilikan hasil produk.",
    intro:
      "Product manager termasuk posisi teknologi dengan bayaran tinggi dan persaingan ketat di Indonesia. Yang dicari: bukti memimpin produk dari masalah sampai hasil, bekerja lintas fungsi, dan mengambil keputusan berbasis data. Contoh CV ini menonjolkan metrik produk dan kepemimpinan.",
    summaryExample:
      "Product manager dengan 4 tahun pengalaman memimpin produk B2C dengan 300 ribu pengguna aktif. Meluncurkan 12 fitur utama yang menaikkan retensi 25%. Terbiasa menyeimbangkan riset pengguna, data, dan prioritas bisnis dengan tim engineering dan design.",
    keySkills: ["Product Discovery", "Roadmapping", "User Story & PRD", "Analitik Produk (Mixpanel/Amplitude)", "A/B Testing", "Agile / Scrum", "Stakeholder Management", "Prioritization (RICE)", "Riset Pengguna", "Go-to-Market"],
    experienceExamples: [
      {
        position: "Product Manager",
        company: "Startup Konsumen Contoh",
        period: "Februari 2022 - Sekarang",
        bullets: [
          "Memimpin peluncuran fitur langganan yang menyumbang 30% pendapatan berulang dalam 9 bulan.",
          "Menaikkan retensi 30 hari dari 22% ke 29% lewat perbaikan alur onboarding berbasis data.",
          "Mengelola backlog 3 tim dengan prioritas RICE dan ritual sprint yang menurunkan scope creep 40%.",
        ],
      },
      {
        position: "Associate Product Manager",
        company: "Perusahaan SaaS Contoh",
        period: "Agustus 2020 - Januari 2022",
        bullets: [
          "Menjalankan 20+ sesi riset pengguna yang membentuk ulang prioritas roadmap kuartal.",
          "Berkolaborasi dengan design dan engineering merilis 8 fitur tepat jadwal.",
        ],
      },
    ],
    atsKeywords: ["product manager", "roadmap", "product strategy", "user research", "A/B testing", "metrics", "stakeholder", "agile", "PRD", "go-to-market"],
    tips: [
      "Tulis hasil produk dengan metrik: retensi, konversi, pendapatan, atau NPS.",
      "Tunjukkan keputusan sulit dan trade-off yang pernah diambil.",
      "Sebut skala produk: jumlah pengguna, tim yang dikoordinasikan, dan kompleksitasnya.",
    ],
  },
  {
    slug: "apoteker",
    title: "Apoteker",
    category: "Kesehatan",
    tagline: "CV yang menonjolkan kepatuhan, pelayanan, dan akurasi.",
    intro:
      "Apoteker dibutuhkan di rumah sakit, apotek jaringan, industri farmasi, dan distributor. Rekruter menilai kepatuhan regulasi (BPOM, CDOB), ketelitian resep, dan kemampuan melayani pasien. Contoh CV ini menunjukkan cara menulis pencapaian operasional tanpa mengorbankan kesan profesional.",
    summaryExample:
      "Apoteker dengan 3 tahun pengalaman di apotek jaringan dan pelayanan resep rawat jalan. Menguasai pengelolaan stok obat, pelaporan narkotika/psikotropika, dan pelayanan informasi obat. Berhasil menurunkan selisih stok 40% lewat sistem audit mingguan.",
    keySkills: ["Pelayanan Resep", "Pelayanan Informasi Obat (PIO)", "Manajemen Stok Farmasi", "CDOB & CPOB Dasar", "Pelaporan Narkotika/Psikotropika", "Konseling Pasien", "Interaksi Obat", "SIA/SIM Farmasi", "Standar Akreditasi (KARS)", "K3 Farmasi"],
    experienceExamples: [
      {
        position: "Apoteker Penanggung Jawab",
        company: "Apotek Jaringan Contoh",
        period: "Februari 2023 - Sekarang",
        bullets: [
          "Melayani rata-rata 120 resep per hari dengan akurasi penyerahan 99,9% dan waktu tunggu di bawah 15 menit.",
          "Menurunkan selisih stok obat 40% lewat SOP audit mingguan dan pencatatan batch.",
          "Memimpin persiapan audit internal yang lulus tanpa temuan mayor.",
        ],
      },
      {
        position: "Apoteker Pelaksana",
        company: "RS Contoh Sejahtera",
        period: "Agustus 2022 - Januari 2023",
        bullets: [
          "Menjalankan skrining resep rawat jalan 80+ lembar per shift bersama tim farmasi.",
          "Menyusun leaflet edukasi pasien hipertensi dan diabetes yang dipakai poli rawat jalan.",
        ],
      },
    ],
    atsKeywords: ["apoteker", "farmasi", "pelayanan resep", "PIO", "stok obat", "CDOB", "BPOM", "narkotika", "konseling pasien", "SIA"],
    tips: [
      "Cantumkan nomor STRA dan tanggal berlaku secara jelas.",
      "Sebut pengalaman mengikuti standar mutu: CDOB, CPOB, atau akreditasi rumah sakit.",
      "Tunjukkan angka: jumlah resep harian, akurasi, dan waktu layanan.",
    ],
  },
  {
    slug: "mechanical-engineer",
    title: "Mechanical Engineer",
    category: "Teknik & Manufaktur",
    tagline: "CV yang menunjukkan presisi teknis dan efisiensi.",
    intro:
      "Mechanical engineer banyak dicari di manufaktur, otomotif, energi, dan konstruksi. Pemberi kerja mencari bukti kemampuan desain, perawatan mesin, dan efisiensi produksi. Contoh CV ini menonjolkan pencapaian teknis dengan angka downtime dan efisiensi.",
    summaryExample:
      "Mechanical engineer dengan 4 tahun pengalaman di manufaktur. Menguasai AutoCAD, SolidWorks, dan preventive maintenance. Berhasil menurunkan downtime lini produksi 25% dan menghemat biaya suku cadang Rp180 juta per tahun.",
    keySkills: ["AutoCAD", "SolidWorks", "Preventive & Predictive Maintenance", "GD&T", "Root Cause Analysis", "Lean Manufacturing", "SAP PM", "Manajemen Proyek Teknik", "K3 & LOTO", "Pengendalian Mutu"],
    experienceExamples: [
      {
        position: "Mechanical Engineer",
        company: "PT Manufaktur Contoh",
        period: "Januari 2022 - Sekarang",
        bullets: [
          "Menurunkan unplanned downtime lini produksi 25% lewat program preventive maintenance berbasis data.",
          "Memimpin redesain jig pengelasan yang menaikkan throughput 18% tanpa menambah tenaga kerja.",
          "Menghemat Rp180 juta per tahun melalui standarisasi suku cadang dan negosiasi vendor.",
        ],
      },
      {
        position: "Engineering Trainee",
        company: "Perusahaan Otomotif Contoh",
        period: "Juli 2020 - Desember 2021",
        bullets: [
          "Mendukung commissioning 2 lini produksi baru tanpa penundaan jadwal proyek.",
          "Menyusun SOP perawatan mesin untuk 30 peralatan produksi.",
        ],
      },
    ],
    atsKeywords: ["mechanical engineer", "maintenance", "CAD", "manufaktur", "produksi", "downtime", "lean", "efficiency", "K3", "root cause"],
    tips: [
      "Tulis proyek dengan angka teknis: %, rpm, biaya, atau jam operasi.",
      "Sebut software CAD/CAE yang benar-benar dikuasai.",
      "Untuk posisi lapangan, tekankan K3 dan pengalaman hands-on.",
    ],
  },
];

export function getCvExample(slug: string): CvExample | null {
  return CV_EXAMPLES.find((example) => example.slug === slug) ?? null;
}