/* ─────────────────────────────────────────────────────────────────── */
/*  Interview Question Database — Static Templates                    */
/*  ~30 positions × 8 questions (4 HR + 4 Technical/Role-specific)   */
/* ─────────────────────────────────────────────────────────────────── */

export interface InterviewQuestion {
  id: string;
  category: "hr" | "technical" | "role-specific";
  question: string;
  answer: string;
  tips?: string[];
}

export interface PositionQuestions {
  id: string;
  title: string;
  categorySlug: string;
  icon: string;
  questions: InterviewQuestion[];
}

export interface QuestionCategory {
  slug: string;
  name: string;
  icon: string;
}

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  { slug: "technology", name: "Teknologi", icon: "code" },
  { slug: "business", name: "Bisnis & Marketing", icon: "business_center" },
  { slug: "design", name: "Desain & Kreatif", icon: "palette" },
  { slug: "operations", name: "Operasional", icon: "assignment" },
  { slug: "healthcare", name: "Kesehatan & Edukasi", icon: "local_hospital" },
  { slug: "finance", name: "Akuntansi & Keuangan", icon: "receipt_long" },
  { slug: "manufacturing", name: "Manufaktur & Industri", icon: "precision_manufacturing" },
];

/* ─── HR / General Questions (reusable across positions) ─── */

const hrQuestions: InterviewQuestion[] = [
  {
    id: "hr-1",
    category: "hr",
    question: "Ceritakan tentang diri Anda.",
    answer:
      "Saya adalah seorang profesional yang berpengalaman di bidang [bidang] dengan [X] tahun pengalaman. Saya memiliki keahlian dalam [skill utama] dan telah berhasil [prestasi terbesar]. Saat ini saya sedang mencari tantangan baru di [industri target] untuk terus berkembang.",
    tips: [
      "Gunakan formula: Masa lalu (pengalaman) → Sekarang (keahlian) → Masa depan (kontribusi)",
      "Sesuaikan dengan posisi yang dilamar — jangan cerita panjang lebar",
      "Durasi ideal: 60-90 detik",
    ],
  },
  {
    id: "hr-2",
    category: "hr",
    question: "Apa kelebihan dan kelemahan terbesar Anda?",
    answer:
      "Kelebihan terbesar saya adalah [kelebihan relevan — contoh: kemampuan analisis data yang kuat], yang terbukti ketika saya [contoh konkret]. Untuk kelemahan, saya dulu kesulitan dengan [kelemahan], tapi saya mengatasinya dengan [cara mengatasi] sehingga sekarang [hasil positif].",
    tips: [
      "Pilih kelemahan yang bukan keahlian inti posisi ini",
      "Sertakan langkah konkret perbaikan, jangan hanya mengakui kelemahan",
      "Kelebihan harus relevan dengan job description",
    ],
  },
  {
    id: "hr-3",
    category: "hr",
    question: "Mengapa Anda ingin bekerja di perusahaan kami?",
    answer:
      "Saya tertarik dengan [nama perusahaan] karena [alasan spesifik — contoh: reputasi inovasi di bidang AI]. Setelah membaca tentang [proyek/produk perusahaan], saya melihat korelasi dengan keahlian saya di [bidang]. Saya ingin berkontribusi pada [visi/misi perusahaan] dan tumbuh bersama tim yang dinamis.",
    tips: [
      "Riset perusahaan sebelum wawancara — produk, budaya, berita terbaru",
      "Jangan bilang 'karena butuh kerja' atau 'karena gajinya bagus'",
      "Hubungkan value perusahaan dengan value pribadi Anda",
    ],
  },
  {
    id: "hr-4",
    category: "hr",
    question: "Di mana Anda melihat diri Anda dalam 5 tahun ke depan?",
    answer:
      "Dalam 5 tahun, saya melihat diri saya sebagai seorang ahli di bidang [bidang] yang telah berkontribusi signifikan pada [nama perusahaan]. Saya berencana menguasai [skill lanjutan] dan mengambil peran [jenjang karir — contoh: senior/lead] yang memungkinkan saya membimbing anggota tim lain.",
    tips: [
      "Tunjukkan ambisi yang realistis dan relevan dengan posisi",
      "Hubungkan growth plan dengan perusahaan — jangan terkesan hanya batu loncatan",
      "Hindari jawaban terlalu spekulatif atau muluk",
    ],
  },
];

/* ─── Individual Position Data ─── */

export const POSITION_QUESTIONS: PositionQuestions[] = [
  /* ═══════════════════════════ TECHNOLOGY ═══════════════════════════ */
  {
    id: "software-engineer",
    title: "Software Engineer",
    categorySlug: "technology",
    icon: "terminal",
    questions: [
      ...hrQuestions,
      {
        id: "se-tech-1",
        category: "technical",
        question: "Jelaskan perbedaan antara REST dan GraphQL. Kapan Anda memilih salah satunya?",
        answer:
          "REST menggunakan endpoint tetap dengan metode HTTP (GET, POST, etc) dan response yang terstruktur per endpoint. GraphQL menggunakan satu endpoint dengan query fleksible dari client.\n\nPilih REST ketika: API sederhana, butuh caching HTTP bawaan, atau tim belum familiar dengan GraphQL.\nPilih GraphQL ketika: Banyak relasi data, butuh fetch data spesifik, atau client mobile dengan bandwidth terbatas.",
        tips: [
          "Sebutkan pengalaman nyata menggunakan keduanya",
          "Contoh: 'Di proyek sebelumnya, kami migrasi dari REST ke GraphQL karena...'",
        ],
      },
      {
        id: "se-tech-2",
        category: "technical",
        question: "Bagaimana cara Anda memastikan kualitas kode yang Anda tulis?",
        answer:
          "Saya menerapkan beberapa praktik: (1) Unit testing dengan framework seperti Jest/Vitest, (2) Code review dengan tim, (3) Linting dan formatting otomatis (ESLint, Prettier), (4) CI/CD pipeline yang menjalankan test sebelum merge, (5) Dokumentasi kode untuk bagian yang kompleks.",
        tips: ["Sebutkan metrik: coverage target minimal 80%", "Tekankan kolaborasi melalui code review"],
      },
      {
        id: "se-tech-3",
        category: "technical",
        question: "Jelaskan pengalaman Anda dengan sistem version control (Git). Apa branching strategy favorit Anda?",
        answer:
          "Saya sangat berpengalaman dengan Git sehari-hari. Branching strategy favorit saya adalah trunk-based development dengan feature flags untuk tim kecil, atau Git Flow untuk tim besar dengan rilis terjadwal. Saya biasa menggunakan rebase untuk history yang bersih dan merge commits untuk transparansi.",
        tips: ["Sebutkan tools: GitHub, GitLab, Bitbucket", "Pengalaman handle merge conflict adalah nilai plus"],
      },
      {
        id: "se-tech-4",
        category: "technical",
        question: "Bagaimana Anda menangani error handling di aplikasi production?",
        answer:
          "Layered approach: (1) Input validation di API layer menggunakan schema validation (Zod/Yup), (2) Centralized error handler dengan kode error yang konsisten, (3) Logging terstruktur (Winston/Sentry) untuk debugging, (4) Graceful degradation — user tetap bisa pakai fitur lain walau satu fitur error, (5) Monitoring dan alerting (Datadog/New Relic).",
        tips: ["Sebutkan pengalaman debugging production issue", "Tekankan pentingnya user experience saat error"],
      },
      {
        id: "se-tech-5",
        category: "technical",
        question: "Apa perbedaan antara synchronous dan asynchronous programming?",
        answer:
          "Synchronous: kode berjalan berurutan, baris berikutnya menunggu sebelumnya selesai (blocking). Asynchronous: kode jalan tanpa menunggu proses sebelumnya (non-blocking). Penting untuk operasi I/O seperti API call, database query. Di JavaScript menggunakan callback, Promise, atau async/await.",
        tips: [],
      },
      {
        id: "se-tech-6",
        category: "technical",
        question: "Jelaskan prinsip SOLID dalam pemrograman.",
        answer:
          "S — Single Responsibility: setiap class satu alasan untuk berubah. O — Open/Closed: open for extension, closed for modification. L — Liskov Substitution: subclass bisa gantikan parent. I — Interface Segregation: banyak interface spesifik. D — Dependency Inversion: bergantung pada abstraksi, bukan implementasi.",
        tips: ["Ini pertanyaan klasik di perusahaan yang pakai OOP — kuasai contoh konkretnya"],
      },
      {
        id: "se-tech-7",
        category: "technical",
        question: "Apa itu Docker dan mengapa berguna?",
        answer:
          "Docker adalah platform containerization yang mengemas aplikasi beserta dependensinya ke dalam container yang portable dan konsisten di environment mana pun. Berguna untuk menghilangkan masalah 'works on my machine', mempermudah deployment, dan mendukung microservices.",
        tips: [],
      },
      {
        id: "se-tech-8",
        category: "technical",
        question: "Jelaskan perbedaan authentication dan authorization.",
        answer:
          "Authentication: verifikasi identitas (siapa kamu?) — login dengan password, token JWT. Authorization: hak akses (apa yang boleh kamu lakukan?) — Role-Based Access Control (RBAC). Contoh: setelah login (auth), admin bisa hapus data tapi user biasa tidak bisa (authorization).",
        tips: [],
      },
      {
        id: "se-tech-9",
        category: "technical",
        question: "Apa itu CI/CD?",
        answer:
          "CI (Continuous Integration): praktik menggabungkan perubahan kode ke branch utama secara rutin dengan automated testing. CD (Continuous Delivery/Deployment): otomasi deployment ke staging/production. Tools: Jenkins, GitHub Actions, GitLab CI, CircleCI.",
        tips: [],
      },
      {
        id: "se-tech-10",
        category: "technical",
        question: "Bagaimana cara Anda mendebug kode yang bermasalah?",
        answer:
          "1) Baca pesan error teliti. 2) Reproduksi bug. 3) Gunakan debugger/console.log. 4) Isolasi masalah (binary search). 5) Cek dokumentasi dan Stack Overflow. 6) Peer review. 7) Setelah fix, tulis test agar tidak terulang.",
        tips: [],
      },
    ],
  },
  {
    id: "frontend-developer",
    title: "Frontend Developer",
    categorySlug: "technology",
    icon: "web",
    questions: [
      ...hrQuestions,
      {
        id: "fe-tech-1",
        category: "technical",
        question: "Framework/librari frontend apa yang Anda kuasai? Bandingkan kelebihan dan kekurangannya.",
        answer:
          "Saya paling mahir dengan React/Next.js. React unggul di ekosistem yang mature dan community support besar. Saya juga familiar dengan Vue.js yang menurut saya lebih intuitif untuk proyek kecil. Untuk performa, saya pernah menggunakan Svelte yang menghasilkan bundle size sangat kecil. Pilihan tergantung kebutuhan proyek dan tim.",
        tips: ["Jangan hanya hafal — tunjukkan pemahaman mendalam tentang satu framework"],
      },
      {
        id: "fe-tech-2",
        category: "technical",
        question: "Bagaimana Anda mengoptimalkan performa aplikasi frontend?",
        answer:
          "Beberapa teknik: (1) Code splitting dengan dynamic imports, (2) Lazy loading untuk gambar dan komponen di bawah fold, (3) Memoization (useMemo, useCallback) untuk mencegah re-render tidak perlu, (4) Image optimization dengan format modern (WebP/AVIF), (5) Critical CSS inline, (6) Mengukur dengan Lighthouse dan Web Vitals.",
        tips: ["Sebutkan metrik konkret: 'Berhasil turunkan LCP dari 4.2s ke 1.8s'"],
      },
      {
        id: "fe-tech-3",
        category: "technical",
        question: "Jelaskan konsep state management di React. Kapan Anda menggunakan Context vs Redux/Zustand?",
        answer:
          "React memiliki useState untuk local state dan useReducer untuk state kompleks. Context API cocok untuk shared state sederhana seperti theme atau auth. Untuk state global yang kompleks, saya pilih Zustand karena ringan dan simple, atau Redux Toolkit untuk tim besar yang butuh middleware terstruktur.",
        tips: [],
      },
      {
        id: "fe-tech-4",
        category: "technical",
        question: "Bagaimana pendekatan Anda terhadap responsive design?",
        answer:
          "Mobile-first approach: desain untuk mobile dulu, lalu scale up dengan breakpoints Tailwind/media queries. Saya menggunakan CSS Grid untuk layout kompleks, Flexbox untuk komponen, dan relative units (rem, %, vw) daripada px. Testing di berbagai ukuran layar dan browser adalah wajib sebelum deploy.",
        tips: ["Sebutkan tools: Chrome DevTools responsive mode, BrowserStack"],
      },
    ],
  },
  {
    id: "backend-developer",
    title: "Backend Developer",
    categorySlug: "technology",
    icon: "dns",
    questions: [
      ...hrQuestions,
      {
        id: "be-tech-1",
        category: "technical",
        question: "Jelaskan perbedaan antara SQL dan NoSQL database. Kapan Anda menggunakan masing-masing?",
        answer:
          "SQL (PostgreSQL, MySQL) cocok untuk data terstruktur dengan relasi kompleks dan perlu ACID compliance. NoSQL (MongoDB, Firestore) cocok untuk data semi-terstruktur, skalabilitas horizontal, dan schema yang fleksibel.\n\nSaya biasanya mulai dengan PostgreSQL untuk多数 proyek karena reliability-nya, beralih ke NoSQL jika ada kebutuhan spesifik seperti dokumen yang sangat nested atau traffic yang masif.",
        tips: [],
      },
      {
        id: "be-tech-2",
        category: "technical",
        question: "Bagaimana Anda mendesain REST API yang baik?",
        answer:
          "Prinsip-prinsip: (1) Naming konvensi — plural nouns (/users, bukan /getUser), (2) HTTP methods sesuai fungsinya, (3) Versioning via URL (/v1/), (4) Consistent error response format, (5) Pagination untuk list endpoint, (6) Rate limiting untuk security, (7) Dokumentasi otomatis (Swagger/OpenAPI).",
        tips: [],
      },
      {
        id: "be-tech-3",
        category: "technical",
        question: "Jelaskan pengalaman Anda dengan authentication dan authorization.",
        answer:
          "Saya pernah implementasi berbagai metode: (1) JWT untuk stateless auth — token dengan expiry, refresh token rotation, (2) Session-based auth dengan Redis store, (3) OAuth2 untuk social login (Google, GitHub), (4) RBAC (Role-Based Access Control) untuk authorization level. Security best practices: HTTP-only cookies, CSRF protection, rate limiting pada login endpoint.",
        tips: ["Sebutkan pengalaman dengan NextAuth.js atau sejenisnya"],
      },
      {
        id: "be-tech-4",
        category: "technical",
        question: "Bagaimana Anda mengelola database migration di production?",
        answer:
          "Saya menggunakan migration tools (Prisma Migrate, Drizzle Kit, Flyway) dengan versioning. Setiap perubahan schema adalah file migration terpisah yang di-review. Staging terlebih dahulu sebelum production. Untuk perubahan besar, saya buat backward-compatible migration — tambah kolom dulu sebelum hapus yang lama. Selalu backup database sebelum migrate.",
        tips: [],
      },
    ],
  },
  {
    id: "fullstack-developer",
    title: "Full Stack Developer",
    categorySlug: "technology",
    icon: "layers",
    questions: [
      ...hrQuestions,
      {
        id: "fs-tech-1",
        category: "technical",
        question: "Bagaimana Anda membagi pekerjaan antara frontend dan backend dalam sebuah proyek?",
        answer:
          "Saya mulai dengan mendesain data model dan API contract (OpenAPI spec) sebelum coding. Ini memastikan frontend dan backend bisa jalan paralel. Prioritaskan backend endpoints yang critical path dulu, lalu frontend yang membutuhkannya. Saya sering menggunakan monorepo agar shared types bisa dipakai kedua sisi.",
        tips: ["Tekankan pentingnya komunikasi dan dokumentasi API"],
      },
      {
        id: "fs-tech-2",
        category: "technical",
        question: "Jelaskan stack teknologi favorit Anda untuk web development.",
        answer:
          "Stack favorit saya saat ini adalah T3 Stack: Next.js (React) untuk frontend, tRPC atau REST API untuk komunikasi type-safe, Prisma/Drizzle ORM untuk database, dan PostgreSQL. Untuk deployment saya pakai Vercel atau Docker di VPS. Stack ini memberikan developer experience yang excellent dengan type safety end-to-end.",
        tips: ["Sebutkan stack yang relevan dengan tech stack perusahaan"],
      },
      {
        id: "fs-tech-3",
        category: "technical",
        question: "Bagaimana Anda menangani state management di aplikasi full-stack?",
        answer:
          "Untuk data server, saya prefer React Server Components (RSC) atau React Query/TanStack Query — fetching data langsung dari server atau caching di client. Untuk UI state, cukup useState/useReducer. Global state seperti auth atau theme pakai Context atau Zustand. Hindari over-engineering — mulai simpel dulu.",
        tips: [],
      },
      {
        id: "fs-tech-4",
        category: "technical",
        question: "Ceritakan pengalaman Anda dengan deployment dan DevOps.",
        answer:
          "Saya biasa menggunakan Docker untuk containerization, dengan docker-compose untuk local development. CI/CD via GitHub Actions — auto-test, build, dan deploy ke staging. Untuk production: setup Nginx reverse proxy, SSL via Let's Encrypt, dan monitoring dengan uptime robot atau Sentry untuk error tracking.",
        tips: ["Sebutkan cloud platform: AWS, GCP, Vercel, atau Railway"],
      },
    ],
  },
  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    categorySlug: "technology",
    icon: "cloud",
    questions: [
      ...hrQuestions,
      {
        id: "do-tech-1",
        category: "technical",
        question: "Jelaskan pipeline CI/CD yang ideal menurut Anda.",
        answer:
          "Pipeline ideal: (1) Developer push code → (2) Linting & type checking → (3) Unit test → (4) Build → (5) Integration test → (6) Deploy ke staging → (7) E2E test → (8) Deploy ke production (dengan approval). Setiap stage harus cepat (< 10 menit total). Saya menggunakan GitHub Actions atau GitLab CI.",
        tips: [],
      },
      {
        id: "do-tech-2",
        category: "technical",
        question: "Bagaimana Anda mengelola infrastruktur sebagai kode (IaC)?",
        answer:
          "Saya menggunakan Terraform untuk provisioning cloud resources (AWS/GCP). Semua konfigurasi di-version control dan di-review seperti kode biasa. Untuk Kubernetes, saya pakai Helm charts. Pendekatan ini memastikan reproducibility — staging dan production identik, dan rollback semudah git revert.",
        tips: [],
      },
      {
        id: "do-tech-3",
        category: "technical",
        question: "Jelaskan pengalaman Anda dengan containerization dan orchestration.",
        answer:
          "Saya sehari-hari menggunakan Docker untuk containerization — multi-stage builds untuk optimize image size. Untuk orchestration, saya manage Kubernetes cluster (EKS/GKE). Saya setup Horizontal Pod Autoscaler untuk scaling otomatis, dan Network Policies untuk security. Monitoring via Prometheus + Grafana.",
        tips: [],
      },
      {
        id: "do-tech-4",
        category: "technical",
        question: "Bagaimana Anda menangani incident response?",
        answer:
          "Prosedur: (1) Detect — monitoring alert (PagerDuty), (2) Triage — assess severity dan impact, (3) Mitigate — rollback atau hotfix, (4) Resolve — fix permanen, (5) Post-mortem — root cause analysis dan action items. Saya percaya on-call rotation yang adil dan blameless culture untuk post-mortem.",
        tips: [],
      },
    ],
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    categorySlug: "technology",
    icon: "analytics",
    questions: [
      ...hrQuestions,
      {
        id: "ds-tech-1",
        category: "technical",
        question: "Jelaskan perbedaan supervised, unsupervised, dan reinforcement learning.",
        answer:
          "Supervised learning: model dilatih dengan data berlabel (contoh: klasifikasi email spam). Unsupervised learning: model mencari pola dalam data tanpa label (contoh: customer segmentation). Reinforcement learning: agent belajar dari reward/penalty melalui interaksi dengan environment (contoh: game AI). Pilihan tergantung pada data yang tersedia dan problem yang ingin dipecahkan.",
        tips: ["Sertakan contoh proyek nyata untuk masing-masing"],
      },
      {
        id: "ds-tech-2",
        category: "technical",
        question: "Bagaimana Anda menangani data yang tidak seimbang (imbalanced dataset)?",
        answer:
          "Beberapa pendekatan: (1) Resampling — oversampling kelas minoritas (SMOTE) atau undersampling kelas mayoritas, (2) Menggunakan algoritma yang robust terhadap imbalance (Random Forest, XGBoost), (3) Class weights dalam loss function, (4) Menggunakan metrik evaluasi yang tepat (F1-score, Precision-Recall AUC, bukan accuracy).",
        tips: [],
      },
      {
        id: "ds-tech-3",
        category: "technical",
        question: "Jelaskan proses feature engineering yang biasa Anda lakukan.",
        answer:
          "Feature engineering adalah langkah paling penting. Proses saya: (1) Domain analysis — pahami bisnis konteks, (2) Missing value handling — imputation atau flagging, (3) Encoding — one-hot, label, atau target encoding untuk categorical, (4) Scaling — StandardScaler atau MinMaxScaler, (5) Feature interaction — polynomial features, (6) Dimensionality reduction — PCA atau feature selection.",
        tips: [],
      },
      {
        id: "ds-tech-4",
        category: "technical",
        question: "Bagaimana Anda memvalidasi performa model machine learning?",
        answer:
          "Saya menggunakan k-fold cross-validation (biasanya k=5 atau 10) untuk evaluasi yang robust. Split data: 70% train, 15% validation, 15% test. Test set hanya dipakai sekali di akhir untuk final evaluation. Metrik disesuaikan problem: regression (MSE, MAE, R²), classification (Accuracy, Precision, Recall, F1, AUC-ROC).",
        tips: [],
      },
    ],
  },
  {
    id: "mobile-developer",
    title: "Mobile Developer",
    categorySlug: "technology",
    icon: "smartphone",
    questions: [
      ...hrQuestions,
      {
        id: "md-tech-1",
        category: "technical",
        question: "Apa perbedaan antara React Native, Flutter, dan native development?",
        answer:
          "Native (Swift/Kotlin): performa terbaik, akses penuh ke device APIs, tapi harus maintain 2 codebase. React Native: JavaScript/TypeScript, hot reload, shared logic hingga 90%, bridge ke native modules. Flutter: Dart, performa mendekati native (Skia engine), widget system yang konsisten. Pilihan: Native untuk app kompleks/gaming, React Native untuk MVP cepat, Flutter untuk UI kompleks dan konsistensi cross-platform.",
        tips: [],
      },
      {
        id: "md-tech-2",
        category: "technical",
        question: "Bagaimana Anda mengoptimalkan performa aplikasi mobile?",
        answer:
          "Key areas: (1) Image optimization — caching, lazy loading, compression, (2) List virtualization — FlatList/VirtualizedList di React Native, (3) Avoid unnecessary re-renders — memoization, (4) Bundle size optimization — code splitting, tree shaking, (5) Network — request batching, pagination, offline-first dengan local caching.",
        tips: ["Sebutkan metrik performa yang kamu monitor"],
      },
      {
        id: "md-tech-3",
        category: "technical",
        question: "Bagaimana Anda menangani state management di aplikasi mobile?",
        answer:
          "Tergantung framework: React Native → Redux Toolkit atau Zustand + React Query. Flutter → Riverpod atau Bloc. Prinsipnya: pisahkan UI state (loading, error) dari data state (server data). Server state dikelola dengan caching strategy (React Query/Hydration), UI state cukup setState atau provider sederhana.",
        tips: [],
      },
      {
        id: "md-tech-4",
        category: "technical",
        question: "Jelaskan pengalaman Anda dengan app store deployment.",
        answer:
          "Saya pernah mengelola deploy ke App Store dan Play Store. Proses: (1) Code signing & provisioning profile (iOS), (2) Build signing & keystore (Android), (3) TestFlight/Internal testing, (4) Beta testing dengan TestFlight/Play Console, (5) Production release dengan staged rollout (10% → 50% → 100%). Paham review guidelines dan pernah handle rejection.",
        tips: [],
      },
    ],
  },
  {
    id: "qa-engineer",
    title: "QA Engineer",
    categorySlug: "technology",
    icon: "bug_report",
    questions: [
      ...hrQuestions,
      {
        id: "qa-tech-1",
        category: "technical",
        question: "Jelaskan perbedaan antara unit test, integration test, dan E2E test.",
        answer:
          "Unit test: menguji fungsi/komponen terkecil secara terisolasi (Jest, Vitest). Integration test: menguji interaksi antar komponen (React Testing Library). E2E test: menguji flow lengkap dari user perspective (Cypress, Playwright). Testing pyramid: banyak unit test, medium integration test, sedikit E2E test.",
        tips: [],
      },
      {
        id: "qa-tech-2",
        category: "technical",
        question: "Bagaimana Anda memutuskan apa yang harus diotomatisasi vs manual test?",
        answer:
          "Automation priority: (1) Regression tests — dijalankan setiap deploy, (2) Critical user flows — login, checkout, payment, (3) Data validation — form input, API response. Manual test: (1) Exploratory testing — UX feel, (2) Visual regression — layout di berbagai device, (3) Edge cases yang sulit di-automate. Goal: automate 80%, manual 20%.",
        tips: [],
      },
      {
        id: "qa-tech-3",
        category: "technical",
        question: "Apa yang Anda lakukan ketika menemukan bug di production?",
        answer:
          "Prosedur: (1) Dokumentasi — screenshot, console log, langkah reproduksi, environment info, (2) Triage — severity (critical/major/minor) dan priority, (3) Laporkan ke issue tracker dengan label yang jelas, (4) Follow up dengan developer untuk fix, (5) Verifikasi fix di staging, (6) Regression test area terkait.",
        tips: ["Tekankan komunikasi yang baik dengan tim developer"],
      },
      {
        id: "qa-tech-4",
        category: "technical",
        question: "Jelaskan tools dan framework testing yang Anda kuasai.",
        answer:
          "Saya menggunakan: (1) Jest/Vitest untuk unit & integration test, (2) React Testing Library untuk component test, (3) Cypress/Playwright untuk E2E, (4) Postman/Newman untuk API testing, (5) Lighthouse/Lighthouse CI untuk performance testing, (6) BrowserStack untuk cross-browser testing. Saya juga setup CI pipeline yang menjalankan test otomatis di setiap PR.",
        tips: [],
      },
    ],
  },
  {
    id: "cybersecurity-analyst",
    title: "Cybersecurity Analyst",
    categorySlug: "technology",
    icon: "security",
    questions: [
      ...hrQuestions,
      {
        id: "cs-tech-1",
        category: "technical",
        question: "Jelaskan OWASP Top 10 dan bagaimana Anda memitigasi risiko-risiko tersebut.",
        answer:
          "OWASP Top 10 mencakup kerentanan paling kritis seperti injection, broken authentication, XSS, dan security misconfiguration. Mitigasi: (1) Input validation & parameterized queries untuk injection, (2) MFA + rate limiting untuk autentikasi, (3) Content Security Policy (CSP) untuk XSS, (4) Regular security audit dan automated scanning untuk misconfiguration.",
        tips: ["Sebutkan tools: OWASP ZAP, Burp Suite"],
      },
      {
        id: "cs-tech-2",
        category: "technical",
        question: "Bagaimana Anda melakukan penetration testing pada sebuah aplikasi web?",
        answer:
          "Metodologi: (1) Reconnaissance — kumpulkan informasi (subdomain, teknologi, endpoint), (2) Scanning — automated scan dengan tools (Nmap, OWASP ZAP), (3) Exploitation — manual testing untuk injection, XSS, CSRF, IDOR, (4) Reporting — dokumentasi temuan dengan severity, PoC, dan rekomendasi fix. Saya mengikuti standar PTES atau OWASP Testing Guide.",
        tips: [],
      },
      {
        id: "cs-tech-3",
        category: "technical",
        question: "Jelaskan konsep defense in depth.",
        answer:
          "Defense in depth adalah strategi keamanan berlapis. Jika satu layer ditembus, masih ada layer lain: (1) Physical security, (2) Network security — firewall, IDS/IPS, VPN, (3) Application security — input validation, WAF, (4) Data security — encryption at rest & in transit, (5) Identity & access — MFA, least privilege, (6) Monitoring — SIEM, log analysis.",
        tips: [],
      },
      {
        id: "cs-tech-4",
        category: "technical",
        question: "Apa yang Anda lakukan saat terjadi security incident?",
        answer:
          "Saya mengikuti incident response framework NIST: (1) Preparation — playbook, tools, tim, (2) Detection & Analysis — identifikasi indicator of compromise, scope, severity, (3) Containment — isolate sistem terdampak, backup forensic data, (4) Eradication — hapus malware, patch vulnerability, (5) Recovery — restore dari backup bersih, monitoring ketat, (6) Post-incident — root cause analysis, lessons learned.",
        tips: [],
      },
    ],
  },

  /* ═══════════════════════════ BUSINESS & MARKETING ═════════════════ */
  {
    id: "marketing-manager",
    title: "Marketing Manager",
    categorySlug: "business",
    icon: "campaign",
    questions: [
      ...hrQuestions,
      {
        id: "mm-role-1",
        category: "role-specific",
        question: "Buatlah strategi marketing untuk peluncuran produk baru dengan budget terbatas.",
        answer:
          "Dengan budget terbatas, fokus pada organic channels: (1) Content marketing — blog posts, SEO-optimized articles, video tutorials, (2) Social media — konten viral di TikTok/IG, community building di LinkedIn, (3) Email marketing — build newsletter dari awal, (4) Partnership — kolaborasi dengan influencers mikro di niche terkait, (5) PR — press release ke media lokal/industri.",
        tips: [],
      },
      {
        id: "mm-role-2",
        category: "role-specific",
        question: "Bagaimana Anda mengukur ROI dari campaign marketing?",
        answer:
          "Saya menggunakan framework: (1) Tentukan KPI spesifik per channel (CPC, CPM, CTR untuk paid; engagement rate, shares untuk organic), (2) Setup tracking — UTM parameters, Google Analytics goals, pixel, (3) Hitung CAC (Customer Acquisition Cost) dan LTV (Lifetime Value), (4) ROAS (Return on Ad Spend) untuk paid, (5) Attribution modeling — first-click, last-click, atau multi-touch.",
        tips: [],
      },
      {
        id: "mm-role-3",
        category: "role-specific",
        question: "Ceritakan campaign marketing paling sukses yang pernah Anda jalankan.",
        answer:
          "Contoh: Saya pernah menjalankan campaign [nama campaign] yang bertujuan meningkatkan brand awareness dan lead generation. Strategy: kombinasi Instagram Ads (stories + feed) dan content marketing (blog + LinkedIn articles). Hasil: 150% increase in website traffic, 40% lebih banyak leads, dan CAC turun 25% dalam 3 bulan.",
        tips: ["Gunakan data konkret — jangan general", "Sebutkan tantangan yang dihadapi dan cara mengatasinya"],
      },
      {
        id: "mm-role-4",
        category: "role-specific",
        question: "Bagaimana Anda mengikuti tren marketing terbaru dan mengadaptasinya?",
        answer:
          "Saya follow beberapa sumber: (1) Newsletter industri — Marketing Brew, Neil Patel, (2) Podcast — Marketing School, (3) Komunitas — GrowthHacker community, (4) Tools — Google Trends, Exploding Topics. Untuk adaptasi: saya uji coba tren baru dengan A/B testing skala kecil dulu (10% budget), ukur hasil, baru scale up jika terbukti efektif.",
        tips: [],
      },
    ],
  },
  {
    id: "digital-marketing-specialist",
    title: "Digital Marketing Specialist",
    categorySlug: "business",
    icon: "ads_click",
    questions: [
      ...hrQuestions,
      {
        id: "dm-role-1",
        category: "role-specific",
        question: "Platform digital advertising apa yang Anda kuasai dan bagaimana optimasinya?",
        answer:
          "Saya menguasai Google Ads (Search, Display, YouTube) dan Meta Ads (Facebook & Instagram). Optimasi: (1) Keyword research negatif untuk mengurangi wasted spend, (2) A/B testing — creative, headline, CTA, audience, (3) Quality Score optimization untuk Google Ads, (4) Audience layering — custom audiences, lookalikes, retargeting, (5) Budget allocation — alokasi ke campaign dengan ROAS tertinggi.",
        tips: ["Sebutkan metrik: CTR, CPC, CPA, ROAS, Impression Share"],
      },
      {
        id: "dm-role-2",
        category: "role-specific",
        question: "Bagaimana Anda melakukan SEO untuk meningkatkan organic traffic?",
        answer:
          "SEO approach: (1) Technical SEO — site speed, mobile-friendliness, structured data, XML sitemap, canonical tags, (2) On-page — keyword-optimized titles, meta descriptions, header tags, internal linking, (3) Content — blog posts answer search intent, pillar pages, content clusters, (4) Off-page — quality backlinks, guest posting, broken link building. Monitor dengan Google Search Console dan Ahrefs.",
        tips: [],
      },
      {
        id: "dm-role-3",
        category: "role-specific",
        question: "Jelaskan pengalaman Anda dengan email marketing dan automation.",
        answer:
          "Saya menggunakan Mailchimp/Kit/SendGrid untuk: (1) Welcome sequence — 3-5 email onboarding, (2) Nurture sequence — edukasi konten relevan per segment, (3) Abandoned cart — 2-3 email reminder dengan insentif, (4) Re-engagement — email untuk subscriber tidak aktif. Metrics: open rate (target >25%), click rate (target >3%), unsubscribe rate (<0.5%). A/B testing subject line sangat penting.",
        tips: [],
      },
      {
        id: "dm-role-4",
        category: "role-specific",
        question: "Bagaimana Anda menganalisis data campaign untuk membuat keputusan?",
        answer:
          "Saya menggunakan data-driven approach: (1) Kumpulkan data dari Google Analytics, Meta Business Suite, dan CRM, (2) Buat dashboard di Google Data Studio/Looker, (3) Analisis tren — mana yang naik/turun dan kenapa, (4) A/B testing untuk hipotesis, (5) Weekly reporting dengan recommendations actionable. Keputusan berdasarkan data, bukan intuisi.",
        tips: [],
      },
      {
        id: "dm-role-5",
        category: "role-specific",
        question: "Apa yang Anda ketahui tentang digital marketing?",
        answer:
          "Digital marketing adalah pemasaran produk/jasa melalui media digital, mencakup: SEO, SEM/Google Ads, Social Media Marketing, Content Marketing, Email Marketing, Influencer Marketing, dan Affiliate Marketing. Tujuannya menjangkau target audiens secara lebih terukur.",
        tips: [],
      },
      {
        id: "dm-role-6",
        category: "role-specific",
        question: "Apa perbedaan SEO dan SEM?",
        answer:
          "SEO (Search Engine Optimization): traffic organik, gratis, hasil jangka panjang 3-6 bulan. SEM (Search Engine Marketing): iklan berbayar di mesin pencari (Google Ads), hasil instan tapi berbayar per klik (PPC).",
        tips: [],
      },
      {
        id: "dm-role-7",
        category: "role-specific",
        question: "Platform media sosial apa yang paling efektif untuk marketing di Indonesia?",
        answer:
          "Bergantung target: TikTok untuk Gen Z dan viral, Instagram untuk visual branding dan millennial, YouTube untuk konten panjang dan review, Facebook untuk usia 25-45 dan UMKM, LinkedIn untuk B2B dan profesional, X/Twitter untuk brand awareness dan trending.",
        tips: [],
      },
      {
        id: "dm-role-8",
        category: "role-specific",
        question: "Apa itu funnel marketing? Jelaskan tahapannya.",
        answer:
          "Funnel marketing adalah perjalanan konsumen dari tidak kenal hingga membeli: (1) Awareness, (2) Interest, (3) Consideration/Desire, (4) Action/Conversion, (5) Retention/Loyalty, (6) Advocacy.",
        tips: [],
      },
      {
        id: "dm-role-9",
        category: "role-specific",
        question: "Apa itu copywriting dan mengapa penting dalam marketing?",
        answer:
          "Copywriting adalah seni menulis teks pemasaran yang persuasif untuk mendorong aksi. Penting karena kalimat yang tepat dapat meningkatkan CTR iklan, engagement, dan konversi. Formula populer: AIDA (Attention, Interest, Desire, Action) dan PAS (Problem, Agitate, Solution).",
        tips: [],
      },
      {
        id: "dm-role-10",
        category: "role-specific",
        question: "Bagaimana Anda menangani komentar negatif atau krisis brand di media sosial?",
        answer:
          "1) Jangan delete komentar (kecuali SARA/hoax). 2) Respon cepat, profesional, empati. 3) Akui kesalahan jika ada. 4) Pindahkan ke DM/email untuk penyelesaian. 5) Eskalasi ke manajemen jika menjadi isu besar. 6) Buat pernyataan resmi jika diperlukan.",
        tips: [],
      },
    ],
  },
  {
    id: "content-writer",
    title: "Content Writer / Copywriter",
    categorySlug: "business",
    icon: "edit",
    questions: [
      ...hrQuestions,
      {
        id: "cw-role-1",
        category: "role-specific",
        question: "Bagaimana Anda menulis copy yang mendorong konversi?",
        answer:
          "Saya menggunakan formula AIDA: Attention — headline yang menarik perhatian dengan hook kuat, Interest — bangun ketertarikan dengan identifikasi masalah, Desire — manfaat konkret dan social proof, Action — CTA yang jelas dan urgent. Plus prinsip: (1) Fokus pada benefit, bukan fitur, (2) Bahasa yang sederhana dan langsung, (3) Gunakan angka dan data, (4) Sertakan urgency atau kelangkaan jika relevan.",
        tips: ["Sertakan contoh copy yang pernah berkonversi tinggi"],
      },
      {
        id: "cw-role-2",
        category: "role-specific",
        question: "Bagaimana Anda melakukan riset topik untuk artikel blog?",
        answer:
          "Proses: (1) Keyword research — Google Keyword Planner, Ahrefs, SEMrush untuk mencari kata kunci dengan volume + relevansi tinggi, (2) Analyze search intent — apa yang user cari (informational, transactional, navigational), (3) Competitor analysis — lihat top article untuk kata kunci tersebut, apa yang kurang, (4) Content gap — topik yang belum banyak diliput, (5) Brainstorm angle unik — perspektif berbeda dari kompetitor.",
        tips: [],
      },
      {
        id: "cw-role-3",
        category: "role-specific",
        question: "Ceritakan proses editorial Anda dari ide hingga publish.",
        answer:
          "Proses: (1) Ideation — riset topik, keyword, brief konten, (2) Outline — struktur artikel dengan H1, H2, H3, key points, (3) Drafting — tulis first draft tanpa edit berlebihan, (4) Self-edit — proofread, cek grammar, optimasi SEO, (5) Peer review — kolega review untuk feedback, (6) Final polish — formatting, images, internal links, meta description, (7) Publish & promote — share di social media, newsletter.",
        tips: ["Tekankan konsistensi — editorial calendar adalah kunci"],
      },
      {
        id: "cw-role-4",
        category: "role-specific",
        question: "Bagaimana Anda menulis untuk platform yang berbeda (blog, social media, email)?",
        answer:
          "Setiap platform punya gaya berbeda: (1) Blog — long-form, edukatif, 1500-2500 kata, fokus SEO, (2) LinkedIn — profesional, thought leadership, 300-500 kata, (3) Instagram/TikTok — pendek, visual, hook di 3 detik pertama, (4) Twitter/X — ringkas, tajam, 280 karakter maksimal, (5) Email — personal, conversational, value-first. Saya sesuaikan tone dan format dengan platform dan audiens.",
        tips: [],
      },
    ],
  },
  {
    id: "hr-manager",
    title: "HR Manager / Recruiter",
    categorySlug: "business",
    icon: "group",
    questions: [
      ...hrQuestions,
      {
        id: "hr-role-1",
        category: "role-specific",
        question: "Jelaskan proses rekrutmen Anda dari awal hingga akhir.",
        answer:
          "Proses: (1) Sourcing — job board (LinkedIn, Glints, Jobstreet), referral program, headhunting pasif, (2) Screening — CV screening, phone screening untuk verifikasi dasar, (3) Assessment — technical test, psikotes, atau case study, (4) Interview — HR interview + user interview, (5) Offering — negosiasi gaji dan benefit, (6) Onboarding — pertama hari, dokumen, budaya perusahaan. Saya ukur efektivitas dengan time-to-hire dan quality-of-hire.",
        tips: [],
      },
      {
        id: "hr-role-2",
        category: "role-specific",
        question: "Bagaimana Anda menangani employee retention?",
        answer:
          "Retention strategy: (1) Exit interview — pahami kenapa orang pergi, (2) Stay interview — tanya karyawan yang masih bertahan apa yang membuat mereka betah, (3) Career development — clear career path, training budget, mentorship, (4) Compensation — market benchmark gaji setiap tahun, (5) Culture — feedback culture, work-life balance, recognition program. Saya juga monitor engagement survey secara berkala.",
        tips: [],
      },
      {
        id: "hr-role-3",
        category: "role-specific",
        question: "Apa yang Anda lakukan ketika ada konflik antar karyawan?",
        answer:
          "Langkah-langkah: (1) Dengarkan kedua sisi secara terpisah — pahami perspektif masing-masing, (2) Mediasi bersama — fasilitasi diskusi terbuka dan aman, (3) Cari common ground — apa yang disepakati kedua pihak, (4) Action plan — solusi konkret dengan timeline, (5) Follow up — pastikan solusi berjalan. Jika serius, libatkan atasan atau gunakan prosedur formal perusahaan.",
        tips: [],
      },
      {
        id: "hr-role-4",
        category: "role-specific",
        question: "Bagaimana Anda memastikan proses rekrutmen tidak bias?",
        answer:
          "Strategi: (1) Blind screening — hapus nama, foto, usia, gender dari CV sebelum review, (2) Structured interview — pertanyaan sama untuk semua kandidat, dinilai dengan scoring rubric, (3) Diverse panel — interview panel dengan latar belakang berbeda, (4) Objective criteria — tetapkan kriteria sukses sebelum lihat kandidat, (5) Training — bias awareness training untuk semua interviewer.",
        tips: [],
      },
      {
        id: "hr-role-5",
        category: "role-specific",
        question: "Apa yang Anda ketahui tentang UU Ketenagakerjaan No. 13 Tahun 2003?",
        answer:
          "UU ini mengatur hubungan kerja antara pekerja dan pengusaha, mencakup: PKWT vs PKWTT, jam kerja dan lembur, cuti dan izin, upah minimum, PHK dan pesangon, serikat pekerja, serta K3 (Keselamatan dan Kesehatan Kerja).",
        tips: [],
      },
      {
        id: "hr-role-6",
        category: "role-specific",
        question: "Apa bedanya PKWT dan PKWTT?",
        answer:
          "PKWT (Perjanjian Kerja Waktu Tertentu): kontrak dengan durasi terbatas, maksimal 5 tahun (PP 35/2021). PKWTT (Perjanjian Kerja Waktu Tidak Tertentu): kontrak tetap, berlaku sampai pensiun atau PHK.",
        tips: [],
      },
      {
        id: "hr-role-7",
        category: "role-specific",
        question: "Apa itu BPJS Ketenagakerjaan dan apa saja programnya?",
        answer:
          "BPJS Ketenagakerjaan melindungi pekerja dari risiko kerja. Program: JKK (Jaminan Kecelakaan Kerja), JKM (Jaminan Kematian), JHT (Jaminan Hari Tua), JP (Jaminan Pensiun), JKP (Jaminan Kehilangan Pekerjaan).",
        tips: ["HR wajib paham BPJS — ini sering ditanyakan di interview"],
      },
      {
        id: "hr-role-8",
        category: "role-specific",
        question: "Bagaimana cara menghitung pesangon sesuai aturan Indonesia?",
        answer:
          "Berdasarkan PP 35/2021: masa kerja <1 tahun = 1 bulan upah, 1-2 tahun = 2 bulan, dst maksimal 9 bulan untuk ≥8 tahun. Ditambah uang penghargaan masa kerja (UPMK) dan uang penggantian hak (UPH).",
        tips: [],
      },
      {
        id: "hr-role-9",
        category: "role-specific",
        question: "Apa itu KPI dan bagaimana penerapannya di HR?",
        answer:
          "KPI adalah indikator terukur untuk menilai kinerja. Contoh KPI HR: Time to Fill, Turnover Rate, Training Hours per Employee, Employee Satisfaction Score, Absensi Rate.",
        tips: [],
      },
      {
        id: "hr-role-10",
        category: "role-specific",
        question: "Bagaimana Anda menangani karyawan yang sering mangkir atau tidak disiplin?",
        answer:
          "Progressive discipline: (1) Panggilan lisan (coaching), (2) Surat Peringatan 1, (3) SP 2, (4) SP 3, (5) PHK jika tidak ada perubahan. Setiap langkah didokumentasikan sesuai prosedur agar tidak menimbulkan sengketa.",
        tips: ["Pastikan setiap tahap terdokumentasi dengan baik untuk menghindari gugatan PHK"],
      },
    ],
  },
  {
    id: "sales-executive",
    title: "Sales Executive / Business Development",
    categorySlug: "business",
    icon: "trending_up",
    questions: [
      ...hrQuestions,
      {
        id: "se-role-1",
        category: "role-specific",
        question: "Jelaskan proses sales Anda dari prospecting hingga closing.",
        answer:
          "Pipeline: (1) Prospecting — LinkedIn Sales Navigator, cold email, referral, event networking, (2) Qualification — BANT framework (Budget, Authority, Need, Timeline), (3) Discovery — pahami pain points dan goals klien, (4) Presentation — demo produk yang tailored ke kebutuhan mereka, (5) Objection handling — atasi keraguan, (6) Closing — proposal, negosiasi, kontrak, (7) Follow-up — pastikan delivery dan upsell opportunity.",
        tips: ["Sebutkan quota dan achievement pribadi"],
      },
      {
        id: "se-role-2",
        category: "role-specific",
        question: "Bagaimana Anda menangani rejection dari calon klien?",
        answer:
          "Rejection adalah bagian dari sales. Saya: (1) Tidak personal — pahami alasan objektif, (2) Follow up dengan value — kadang timing yang kurang tepat, bukan produk yang buruk, (3) Minta feedback — 'Apa yang membuat Anda memutuskan tidak lanjut?', (4) Keep in touch — nurture dengan konten relevan hingga mereka siap, (5) Analisis pola rejection — apakah ada pattern yang bisa diperbaiki di approach.",
        tips: [],
      },
      {
        id: "se-role-3",
        category: "role-specific",
        question: "Bagaimana Anda mencapai target sales yang agresif?",
        answer:
          "Strategi: (1) Break down target — bulanan → mingguan → harian, (2) Prioritaskan pipeline — fokus pada deals dengan probability tinggi, (3) Time blocking — dedicated time untuk prospecting, follow-up, admin, (4) Leverage tools — CRM automation, email sequences, LinkedIn automation, (5) Continuous improvement — analisis win/loss ratio, refine pitch. Saya selalu exceed target [X]% di role sebelumnya.",
        tips: [],
      },
      {
        id: "se-role-4",
        category: "role-specific",
        question: "Bagaimana Anda membangun hubungan jangka panjang dengan klien?",
        answer:
          "Relationship building: (1) Trust — deliver promise, jangan over-promise, (2) Value-add — sharing industry insight, bukan cuma jualan, (3) Regular check-in — update produk, tanya kabar bisnis, (4) Customer success — pastikan klien sukses pakai produk, (5) Upsell/cross-sell yang relevant — jangan paksa, (6) Personal touch — ingat detail personal (ulang tahun, hobi).",
        tips: [],
      },
      {
        id: "se-role-5",
        category: "role-specific",
        question: "Jual produk ini kepada saya! (Sell me this pen!)",
        answer:
          "Sebelum menjual, tanya dulu kebutuhan: 'Kapan terakhir kali Anda menggunakan pulpen dan apa yang penting bagi Anda?' Setelah tahu kebutuhannya, baru tawarkan solusi. Kuncinya: tanya dulu kebutuhan, baru tawarkan solusi — jangan langsung pitching.",
        tips: ["Ini tes klasik — tunjukkan bahwa Anda mendengar kebutuhan sebelum menjual"],
      },
      {
        id: "se-role-6",
        category: "role-specific",
        question: "Apa strategi Anda untuk cold calling atau cold outreach?",
        answer:
          "1) Riset prospek dulu (industri, posisi, pain point). 2) Buat opening relevan, bukan pitch langsung. 3) Fokus pada value proposition. 4) Tanya pertanyaan terbuka untuk gali kebutuhan. 5) Tutup dengan action jelas: jadwal meeting atau demo.",
        tips: [],
      },
      {
        id: "se-role-7",
        category: "role-specific",
        question: "Bagaimana Anda menangani objeksi 'harganya terlalu mahal'?",
        answer:
          "1) Jangan defensif. 2) Gali: 'Mahal dibanding apa?' 3) Fokus pada value dan ROI. 4) Tawarkan opsi (paket berbeda, cicilan). 5) Jika tetap tidak cocok, jaga hubungan baik untuk peluang masa depan.",
        tips: [],
      },
      {
        id: "se-role-8",
        category: "role-specific",
        question: "Apa perbedaan up-selling dan cross-selling?",
        answer:
          "Up-selling: menawarkan produk yang lebih premium/mahal. Cross-selling: menawarkan produk tambahan/pelengkap. Contoh di restoran: 'Mau upgrade ke Large?' adalah up-sell; 'Mau tambah kentang?' adalah cross-sell.",
        tips: [],
      },
      {
        id: "se-role-9",
        category: "role-specific",
        question: "Apa itu pipeline sales dan bagaimana Anda mengelolanya?",
        answer:
          "Pipeline sales adalah representasi visual semua prospek di berbagai tahap penjualan. Saya kelola dengan CRM, rutin update status setiap prospek, identifikasi bottleneck, dan pastikan ada cukup prospek di setiap tahap agar target tercapai.",
        tips: ["Sebutkan CRM tools yang familiar: Salesforce, HubSpot, Zoho"],
      },
    ],
  },

  /* ═══════════════════════════ DESIGN & CREATIVE ════════════════════ */
  {
    id: "ui-ux-designer",
    title: "UI/UX Designer",
    categorySlug: "design",
    icon: "design_services",
    questions: [
      ...hrQuestions,
      {
        id: "ux-role-1",
        category: "role-specific",
        question: "Jelaskan proses desain Anda dari riset hingga handoff ke developer.",
        answer:
          "Proses: (1) Research — user interview, competitive analysis, analytics review, (2) Define — user personas, problem statement, user journey map, (3) Ideate — brainstorming, sketching, wireframe, (4) Design — high-fidelity mockup di Figma, design system, (5) Prototype — interactive prototype untuk user testing, (6) Validate — usability testing, iterasi berdasarkan feedback, (7) Handoff — design spec, asset export, developer handoff dengan Figma Dev Mode.",
        tips: ["Sebutkan tools: Figma, Miro, Maze, Dovetail"],
      },
      {
        id: "ux-role-2",
        category: "role-specific",
        question: "Bagaimana Anda membuat keputusan desain berdasarkan data?",
        answer:
          "Saya menggunakan data triangulation: (1) Qualitative — user interview, usability testing (findings dari Maze/UserTesting), (2) Quantitative — analytics (hotjar heatmaps, Google Analytics funnels), A/B testing results, (3) Heuristic — Nielsen's 10 usability heuristics untuk evaluasi cepat, (4) Business metrics — conversion rate, task completion rate, time-on-task. Design decisions didukung minimal 2 sumber data.",
        tips: [],
      },
      {
        id: "ux-role-3",
        category: "role-specific",
        question: "Apa yang Anda lakukan ketika stakeholder meminta fitur yang tidak user-centric?",
        answer:
          "Pendekatan: (1) Dengarkan dulu — pahami goals bisnis di balik request tersebut, (2) Data-driven — tunjukkan data riset user yang bertentangan dengan request, (3) Alternatif — usulkan solusi yang memenuhi goals bisnis TETAP user-centric, (4) Compromise — prioritaskan: mana yang bisa di-launch dulu, mana yang butuh riset lebih lanjut, (5) Test — 'Bagaimana kalau kita A/B test dulu?'",
        tips: [],
      },
      {
        id: "ux-role-4",
        category: "role-specific",
        question: "Jelaskan pengalaman Anda dengan design system.",
        answer:
          "Saya pernah membangun design system dari nol menggunakan Figma dengan komponen yang reusable. Komponen menggunakan auto layout, variants, dan component properties. Dokumentasi mencakup: usage guidelines, dos and don'ts, accessibility standards (WCAG 2.1 AA). Saya juga setup Design System di Storybook untuk dokumentasi kode dan konsistensi antara desain dan implementasi.",
        tips: [],
      },
    ],
  },
  {
    id: "graphic-designer",
    title: "Graphic Designer / Visual Designer",
    categorySlug: "design",
    icon: "brush",
    questions: [
      ...hrQuestions,
      {
        id: "gd-role-1",
        category: "role-specific",
        question: "Jelaskan proses kreatif Anda dari brief hingga final design.",
        answer:
          "Proses: (1) Brief analysis — pahami goals, target audience, brand guidelines, (2) Research — moodboard, referensi visual, tren industri, (3) Ideation — thumbnail sketching, eksplorasi konsep, (4) Design — digital execution di tools pilihan, (5) Refinement — detail polishing, color correction, typography, (6) Feedback — presentasi ke client/stakeholder, iterasi, (7) Finalize — prepare file untuk print/digital.",
        tips: [],
      },
      {
        id: "gd-role-2",
        category: "role-specific",
        question: "Bagaimana Anda menangani feedback yang kontradiktif dari multiple stakeholder?",
        answer:
          "Strategi: (1) Kumpulkan semua feedback dan kategorikan, (2) Identifikasi mana yang berasal dari user needs vs personal preference, (3) Prioritaskan berdasarkan project goals — feedback yang align dengan goals, (4) Usulkan solusi kompromi — design yang mengakomodasi beberapa feedback, (5) Decision maker — jika deadlock, minta keputusan dari satu orang yang bertanggung jawab.",
        tips: [],
      },
      {
        id: "gd-role-3",
        category: "role-specific",
        question: "Apa tools desain utama Anda dan bagaimana Anda menggunakannya secara efisien?",
        answer:
          "Tools utama: (1) Figma — UI/UX, prototyping, kolaborasi tim, (2) Adobe Illustrator — vector graphics, logo, ilustrasi, (3) Adobe Photoshop — photo editing, digital painting, (4) Adobe After Effects — motion graphics, animasi. Efisiensi: plugins (automate repetitive tasks), keyboard shortcuts, custom templates, file organization yang rapi.",
        tips: [],
      },
      {
        id: "gd-role-4",
        category: "role-specific",
        question: "Bagaimana Anda mengikuti tren desain tanpa kehilangan timeless quality?",
        answer:
          "Saya membedakan antara 'trend' dan 'fundamental'. Fundamental (color theory, typography basics, grid, hierarchy) tidak berubah. Tren (glassmorphism, brutalist, neumorphism) adalah alat yang bisa dipakai selektif. Approach: (1) Gunakan tren sebagai accent, bukan foundation, (2) Pastikan design tetap functional dan accessible, (3) Kapan tren menjadi distraksi? Evaluasi dengan pertanyaan: 'Apakah ini membantu user mencapai goal mereka?'",
        tips: [],
      },
    ],
  },

  /* ═══════════════════════════ OPERATIONS ═══════════════════════════ */
  {
    id: "project-manager",
    title: "Project Manager",
    categorySlug: "operations",
    icon: "rocket_launch",
    questions: [
      ...hrQuestions,
      {
        id: "pm-role-1",
        category: "role-specific",
        question: "Jelaskan metodologi manajemen proyek yang Anda kuasai.",
        answer:
          "Saya menguasai beberapa metodologi: (1) Agile/Scrum — untuk software development, sprint planning, daily standup, retrospective, (2) Waterfall — untuk proyek dengan requirement fixed (konstruksi, manufacturing), (3) Hybrid — kombinasi perencanaan upfront + execution agile. Saya memilih metodologi berdasarkan tipe proyek, tim, dan client preference. Saya juga certified Scrum Master.",
        tips: [],
      },
      {
        id: "pm-role-2",
        category: "role-specific",
        question: "Bagaimana Anda menangani proyek yang meleset dari deadline?",
        answer:
          "Langkah: (1) Assess — identifikasi penyebab keterlambatan (scope creep? resource? technical debt?), (2) Communicate — informasikan stakeholder segera, jangan sembunyi, (3) Mitigasi — apa yang bisa dilakukan? (tambah resource, kurangi scope, parallel task), (4) New timeline — realistic estimate, buffer untuk risiko, (5) Lessons learned — post-mortem untuk mencegah terulang.",
        tips: [],
      },
      {
        id: "pm-role-3",
        category: "role-specific",
        question: "Bagaimana Anda memprioritaskan task dalam proyek yang kompleks?",
        answer:
          "Framework prioritas: (1) Impact vs Effort matrix — lakukan high impact low effort dulu, (2) MoSCoW — Must have, Should have, Could have, Won't have, (3) Dependencies — mana yang blocking task lain? Kerjakan itu dulu, (4) Risk assessment — task dengan high risk perlu perhatian lebih awal. Tools: Jira, Trello, atau Asana untuk tracking.",
        tips: [],
      },
      {
        id: "pm-role-4",
        category: "role-specific",
        question: "Ceritakan proyek paling menantang yang pernah Anda kelola.",
        answer:
          "Contoh: [Nama proyek] dengan budget [budget] dan tim [size]. Tantangan: [deskripsi tantangan — misal: stakeholder tidak aligned, timeline ketat, resource terbatas]. yang saya lakukan: [aksi — misal: daily sync dengan stakeholder, reprioritasi scope, tambah freelance resource]. Hasil: deliver tepat waktu dengan kualitas sesuai standar, dan client puas. Pelajaran: [apa yang dipelajari].",
        tips: ["Gunakan format STAR (Situation, Task, Action, Result)"],
      },
    ],
  },
  {
    id: "product-manager",
    title: "Product Manager",
    categorySlug: "operations",
    icon: "inventory_2",
    questions: [
      ...hrQuestions,
      {
        id: "prod-role-1",
        category: "role-specific",
        question: "Jelaskan bagaimana Anda menentukan product roadmap.",
        answer:
          "Proses: (1) Vision & strategy — di mana produk ingin berada dalam 1-2 tahun? (2) Data gathering — user feedback (survei, interview, support tickets), analytics (usage, retention), market research (kompetitor, tren), (3) Prioritization — framework seperti RICE (Reach, Impact, Confidence, Effort) atau Value vs Effort, (4) Stakeholder alignment — presentasi roadmap, manage ekspektasi, (5) Review & adapt — roadmap bukan dokumen mati, review setiap kuartal.",
        tips: [],
      },
      {
        id: "prod-role-2",
        category: "role-specific",
        question: "Bagaimana Anda memutuskan fitur apa yang akan dibangun selanjutnya?",
        answer:
          "Saya menggunakan data-informed decision: (1) Impact — berapa banyak user yang akan terbantu? Berapa revenue potensial? (2) Urgency — apakah ini blocking issue? (3) Strategic alignment — apakah fitur ini mendukung visi produk? (4) Effort — berapa banyak resource yang dibutuhkan? (5) Confidence — seberapa yakin kita dengan estimasi? Tools: productboard atau Notion untuk manage ide dan prioritasi.",
        tips: [],
      },
      {
        id: "prod-role-3",
        category: "role-specific",
        question: "Bagaimana Anda mengukur kesuksesan sebuah fitur?",
        answer:
          "North star metrics sesuai tipe fitur: (1) Feature adoption rate — berapa % user mencoba fitur dalam X hari? (2) Engagement — frequency of use, time spent, (3) Retention — apakah user yang pakai fitur ini lebih loyal? (4) Business impact — conversion rate, revenue, (5) User satisfaction — NPS, CSAT, feedback kualitatif. Definisi sukses ditentukan SEBELUM fitur dibangun.",
        tips: [],
      },
      {
        id: "prod-role-4",
        category: "role-specific",
        question: "Apa yang Anda lakukan ketika engineering mengatakan estimasi lebih lama dari ekspektasi?",
        answer:
          "Langkah: (1) Pahami 'mengapa' — technical debt? Complexity? Resource kurang? (2) Break down — apa yang membuat lama? Bisa di-scope down? (3) Trade-off — apa yang bisa dikorbankan untuk mempercepat? (4) Alternative — solusi lain yang lebih sederhana? (5) Timeline adjustment — jika memang realistis, terima dan manage ekspektasi stakeholder. Jangan paksa estimasi yang tidak realistis.",
        tips: [],
      },
    ],
  },
  {
    id: "admin-assistant",
    title: "Admin Assistant / Data Entry",
    categorySlug: "operations",
    icon: "description",
    questions: [
      ...hrQuestions,
      {
        id: "aa-role-1",
        category: "role-specific",
        question: "Bagaimana Anda mengelola banyak tugas administratif secara bersamaan?",
        answer:
          "Saya menggunakan sistem prioritas dan organisasi: (1) Daily to-do list — tulis semua task, prioritaskan urgency vs importance, (2) Time blocking — alokasikan waktu spesifik untuk task tertentu, (3) Tools — Google Calendar, Trello/Notion untuk tracking, (4) Batch processing — kumpulkan task serupa dan kerjakan sekaligus (misal: semua email dibalas di sesi yang sama), (5) Regular review — evaluasi produktivitas dan adjust approach.",
        tips: ["Berikan contoh konkret tools yang digunakan"],
      },
      {
        id: "aa-role-2",
        category: "role-specific",
        question: "Software perkantoran apa yang Anda kuasai?",
        answer:
          "Saya mahir menggunakan: (1) Microsoft Office Suite — Word (mail merge, formatting), Excel (vlookup, pivot table, formula), PowerPoint, Outlook, (2) Google Workspace — Docs, Sheets, Gmail, Calendar, (3) Tools tambahan — Google Drive/Dropbox untuk file management, Trello/Asana untuk task management, Slack/Teams untuk komunikasi, Canva untuk design sederhana.",
        tips: [],
      },
      {
        id: "aa-role-3",
        category: "role-specific",
        question: "Bagaimana Anda memastikan akurasi data entry yang tinggi?",
        answer:
          "Saya memiliki sistem double-check: (1) Pertama entry — fokus penuh, minim distraksi, (2) Verification — cross-check dengan sumber asli setelah entry, (3) Formula — gunakan Excel validation, conditional formatting untuk mendeteksi anomali, (4) Batch check — review sampel data secara random, (5) Regular audit — bandingkan data dengan periode sebelumnya untuk deteksi outlier.",
        tips: [],
      },
      {
        id: "aa-role-4",
        category: "role-specific",
        question: "Bagaimana Anda menangani informasi rahasia di tempat kerja?",
        answer:
          "Saya sangat menjaga kerahasiaan: (1) Tidak membahas informasi sensitif di tempat umum, (2) Lock screen saat meninggalkan workstation, (3) Password management — tidak share password, gunakan manager password, (4) Secure file handling — enkripsi file sensitif, hapus setelah tidak diperlukan, (5) Sadar phishing — tidak sembarang klik link atau buka lampiran, (6) Memahami dan mematuhi kebijakan perusahaan tentang data privacy.",
        tips: [],
      },
      {
        id: "aa-role-5",
        category: "role-specific",
        question: "Apa yang Anda ketahui tentang tugas seorang staff administrasi?",
        answer:
          "Mencakup pengelolaan dokumen (surat masuk/keluar, arsip), korespondensi, penjadwalan meeting, pengelolaan data, koordinasi antar departemen, pengelolaan office supplies, dan mendukung operasional kantor secara keseluruhan.",
        tips: [],
      },
      {
        id: "aa-role-6",
        category: "role-specific",
        question: "Bagaimana Anda mengelola filing dan sistem arsip yang efektif?",
        answer:
          "Sistem penamaan file yang konsisten, struktur folder terorganisir (berdasarkan tahun/jenis dokumen), versi dokumen jelas, arsip digital di-backup rutin. Untuk dokumen fisik, gunakan sistem penandaan dan pengindeksan yang memudahkan pencarian.",
        tips: [],
      },
      {
        id: "aa-role-7",
        category: "role-specific",
        question: "Bagaimana Anda menangani permintaan mendadak dari atasan saat sedang sibuk?",
        answer:
          "Saya konfirmasi urgensi tugas mendadak, lalu komunikasikan workload saat ini: 'Saya sedang mengerjakan [X] deadline [waktu]. Apakah ini lebih urgent?' Saya tidak menolak, tapi pastikan ekspektasi realistis.",
        tips: [],
      },
      {
        id: "aa-role-8",
        category: "role-specific",
        question: "Bagaimana cara Anda menangani tamu atau telepon masuk secara profesional?",
        answer:
          "Sapa ramah dan profesional, perkenalkan diri dan perusahaan, dengarkan kebutuhan, arahkan ke orang/departemen yang tepat. Jika yang dituju tidak tersedia, tawarkan menyampaikan pesan atau jadwalkan waktu yang tepat.",
        tips: [],
      },
    ],
  },

  /* ═══════════════════════════ HEALTHCARE & EDUCATION ═══════════════ */
  {
    id: "teacher",
    title: "Guru / Dosen / Tenaga Pendidik",
    categorySlug: "healthcare",
    icon: "school",
    questions: [
      ...hrQuestions,
      {
        id: "teacher-role-1",
        category: "role-specific",
        question: "Bagaimana Anda mengelola kelas dengan siswa yang memiliki kemampuan berbeda?",
        answer:
          "Saya menggunakan differentiated instruction: (1) Assessment awal — identifikasi level kemampuan masing-masing siswa, (2) Grouping — kelompokkan berdasarkan level untuk tugas tertentu, (3) Variasi materi — berikan tugas yang berbeda tingkat kesulitannya, (4) Scaffolding — siswa yang lebih lambat dapat tambahan bimbingan, yang lebih cepat dapat enrichment, (5) Flexible seating — atur posisi duduk sesuai kebutuhan pembelajaran.",
        tips: [],
      },
      {
        id: "teacher-role-2",
        category: "role-specific",
        question: "Ceritakan metode pengajaran favorit Anda dan mengapa efektif.",
        answer:
          "Metode favorit saya adalah project-based learning (PBL). Siswa belajar melalui proyek nyata yang relevan dengan kehidupan sehari-hari. Efektif karena: (1) Meningkatkan engagement — siswa melihat relevansi materi, (2) Mengembangkan critical thinking — bukan hanya hafalan, (3) Kolaborasi — belajar bekerja dalam tim, (4) Authentic assessment — hasil proyek menunjukkan pemahaman nyata.",
        tips: [],
      },
      {
        id: "teacher-role-3",
        category: "role-specific",
        question: "Bagaimana Anda menangani siswa yang sulit diatur atau tidak termotivasi?",
        answer:
          "Pendekatan: (1) Cari akar masalah — apakah masalah di rumah? Kesulitan belajar? Bosan? (2) Build rapport — hubungan personal, tunjukkan bahwa saya peduli, (3) Connect to interests — kaitkan materi dengan minat mereka, (4) Give choices — berikan opsi tugas agar mereka merasa punya kontrol, (5) Positive reinforcement — apresiasi progress kecil, bukan hanya hasil akhir, (6) Libatkan orang tua — komunikasi rutin untuk support dari rumah.",
        tips: [],
      },
      {
        id: "teacher-role-4",
        category: "role-specific",
        question: "Bagaimana Anda menggunakan teknologi dalam pengajaran?",
        answer:
          "Saya menggunakan: (1) LMS (Google Classroom, Moodle) untuk manage materi dan tugas, (2) Interactive tools (Kahoot, Quizizz) untuk assessment menyenangkan, (3) Video pembelajaran (YouTube, Loom) untuk flipped classroom, (4) Collaboration tools (Google Docs, Jamboard) untuk kerja kelompok, (5) AI tools (ChatGPT, Grammarly) untuk membantu siswa belajar, (6) Analitik (Google Form, Socrative) untuk tracking progress siswa.",
        tips: [],
      },
    ],
  },
  {
    id: "nurse",
    title: "Perawat / Bidan",
    categorySlug: "healthcare",
    icon: "stethoscope",
    questions: [
      ...hrQuestions,
      {
        id: "nurse-role-1",
        category: "role-specific",
        question: "Bagaimana Anda menangani situasi darurat medis?",
        answer:
          "Prosedur: (1) Primary survey (ABCDE) — Airway, Breathing, Circulation, Disability, Exposure, (2) Panggil bantuan — code blue / dokter jaga, (3) Tindakan awal — CPR jika perlu, oksigen, akses IV, (4) Monitor — vital sign tiap 5 menit, (5) Dokumentasi — catat seluruh tindakan dan respons pasien, (6) Debriefing — evaluasi tim setelah situasi stabil. Saya tetap tenang mengikuti pelatihan BLS/ACLS.",
        tips: ["Sebutkan sertifikasi: BLS, ACLS, PPGD"],
      },
      {
        id: "nurse-role-2",
        category: "role-specific",
        question: "Bagaimana Anda menjaga empati saat menangani pasien yang sulit?",
        answer:
          "Prinsip: (1) Dengarkan tanpa menghakimi — biarkan pasien mengekspresikan frustrasi, (2) Validasi perasaan — 'Saya mengerti Anda merasa frustrasi', (3) Tetap profesional — jangan bawa emosi pribadi, (4) Cari kebutuhan di balik keluhan — apa yang sebenarnya pasien butuhkan?, (5) Self-care — jaga mental health sendiri, jangan bawa pulang stress kerja, (6) Peer support — sharing dengan rekan sejawat.",
        tips: [],
      },
      {
        id: "nurse-role-3",
        category: "role-specific",
        question: "Jelaskan pengalaman Anda dengan dokumentasi medis dan rekam medis elektronik.",
        answer:
          "Saya terbiasa dengan dokumentasi medis yang akurat dan tepat waktu: (1) SOAP format — Subjective, Objective, Assessment, Plan, (2) Sistem RME/EHR — pengalaman dengan Simrs, ERME, atau SATUSEHAT, (3) Dokumentasi obat — nama, dosis, rute, waktu, reaksi, (4) Informed consent — pastikan pasien memahami prosedur, (5) Kerahasiaan — patuhi UU dan kode etik tentang privasi pasien.",
        tips: [],
      },
      {
        id: "nurse-role-4",
        category: "role-specific",
        question: "Bagaimana Anda menangani beban kerja yang tinggi dengan shift malam?",
        answer:
          "Strategi: (1) Time management — prioritas berdasarkan urgensi pasien, (2) Teamwork — delegasi tugas sesuai kompetensi, (3) Physical preparation — tidur cukup sebelum shift malam, makan sehat, (4) Mental health — boundary antara kerja dan istirahat, (5) Komunikasi — handover yang jelas antar shift, (6) Safety first — jangan kompromi pada keselamatan pasien meskipun sibuk.",
        tips: [],
      },
    ],
  },

  /* ═══════════════════════════ FINANCE & ACCOUNTING ═══════════════ */
  {
    id: "staff-accounting",
    title: "Staff Accounting / Finance",
    categorySlug: "finance",
    icon: "receipt_long",
    questions: [
      ...hrQuestions,
      {
        id: "acc-role-1",
        category: "role-specific",
        question: "Apa yang Anda ketahui tentang siklus akuntansi?",
        answer:
          "Siklus akuntansi adalah rangkaian proses dari transaksi keuangan hingga menjadi laporan keuangan: Transaksi → Jurnal → Buku Besar (Ledger) → Neraca Saldo → Jurnal Penyesuaian → Laporan Keuangan → Jurnal Penutup → Neraca Saldo Setelah Penutup.",
        tips: ["Hafalkan urutannya — ini pertanyaan wajib untuk fresh graduate akuntansi"],
      },
      {
        id: "acc-role-2",
        category: "role-specific",
        question: "Apa perbedaan antara debit dan kredit?",
        answer:
          "Dalam akuntansi: Debit menambah aset dan beban, mengurangi kewajiban, modal, dan pendapatan. Kredit menambah kewajiban, modal, dan pendapatan, mengurangi aset dan beban. Keduanya selalu harus seimbang (prinsip double-entry).",
        tips: [],
      },
      {
        id: "acc-role-3",
        category: "role-specific",
        question: "Apa itu laporan keuangan dan sebutkan jenisnya?",
        answer:
          "Laporan keuangan adalah dokumen formal yang menggambarkan kondisi finansial perusahaan. Jenisnya: (1) Laporan Laba Rugi, (2) Neraca (Balance Sheet), (3) Laporan Arus Kas, (4) Laporan Perubahan Ekuitas, (5) Catatan atas Laporan Keuangan (CALK).",
        tips: [],
      },
      {
        id: "acc-role-4",
        category: "role-specific",
        question: "Apa itu rekonsiliasi bank dan mengapa penting?",
        answer:
          "Rekonsiliasi bank adalah proses mencocokkan saldo di buku perusahaan dengan saldo di laporan bank untuk memastikan tidak ada perbedaan. Penting untuk mendeteksi kesalahan pencatatan, transaksi yang belum dicatat, atau potensi kecurangan.",
        tips: ["Sebutkan istilah seperti outstanding check, deposit in transit, bank service charge"],
      },
      {
        id: "acc-role-5",
        category: "role-specific",
        question: "Apa perbedaan accrual basis dan cash basis?",
        answer:
          "Accrual basis: pendapatan dan beban diakui saat terjadi, bukan saat kas diterima/dibayar. Sesuai standar akuntansi (PSAK/IFRS). Cash basis: pendapatan dan beban diakui saat kas berpindah. Lebih sederhana, biasa digunakan UMKM.",
        tips: [],
      },
      {
        id: "acc-role-6",
        category: "role-specific",
        question: "Software akuntansi apa yang Anda kuasai?",
        answer:
          "Saya familiar dengan ACCURATE, Jurnal.id, dan Zahir. Saya juga pernah belajar dasar-dasar SAP saat magang dan dapat menyesuaikan dengan software yang digunakan perusahaan.",
        tips: ["Sesuaikan dengan pengalaman nyata, jangan mengaku jika tidak pernah"],
      },
      {
        id: "acc-role-7",
        category: "role-specific",
        question: "Apa itu PPN dan PPh? Bedanya apa?",
        answer:
          "PPN (Pajak Pertambahan Nilai) adalah pajak atas konsumsi barang/jasa dengan rate 11%, ditanggung konsumen akhir. PPh (Pajak Penghasilan) adalah pajak atas penghasilan orang/badan. Contoh: PPh 21 (karyawan), PPh 23 (jasa/sewa), PPh 25 (angsuran badan).",
        tips: ["Sebutkan tarif PPN terbaru (11%) untuk menunjukkan pengetahuan terkini"],
      },
      {
        id: "acc-role-8",
        category: "role-specific",
        question: "Bagaimana Anda menghadapi deadline laporan keuangan akhir bulan?",
        answer:
          "Saya membuat checklist tugas bulanan dengan timeline yang jelas. Saya prioritaskan entri transaksi secara rutin agar tidak menumpuk di akhir bulan. Jika mendekati deadline, saya siap bekerja lebih lama dan berkoordinasi erat dengan tim untuk memastikan laporan selesai tepat waktu.",
        tips: [],
      },
      {
        id: "acc-role-9",
        category: "role-specific",
        question: "Apa itu working capital dan bagaimana cara menghitungnya?",
        answer:
          "Working capital (modal kerja) = Aset Lancar − Kewajiban Lancar. Menunjukkan kemampuan perusahaan memenuhi kewajiban jangka pendek dengan aset yang likuid. Semakin tinggi working capital, semakin likuid perusahaan.",
        tips: [],
      },
      {
        id: "acc-role-10",
        category: "role-specific",
        question: "Apa yang Anda lakukan jika menemukan kesalahan dalam laporan yang sudah disubmit?",
        answer:
          "Segera melapor ke atasan, jangan menyembunyikan. Kemudian buat jurnal koreksi yang sesuai, dokumentasikan penyebab dan solusinya, serta pastikan tidak terulang dengan memperbaiki proses verifikasi.",
        tips: ["Kejujuran adalah kunci — jangan pernah mencoba menutupi kesalahan"],
      },
    ],
  },

  /* ═══════════════════════════ CUSTOMER SERVICE ═════════════════════ */
  {
    id: "customer-service",
    title: "Customer Service",
    categorySlug: "operations",
    icon: "headset_mic",
    questions: [
      ...hrQuestions,
      {
        id: "cs-role-1",
        category: "role-specific",
        question: "Bagaimana Anda mendeskripsikan customer service yang baik?",
        answer:
          "Customer service yang baik adalah yang responsif, empati, solutif, dan konsisten. Bukan hanya menyelesaikan masalah, tapi membuat pelanggan merasa didengar dan dihargai. CS yang baik mengubah pengalaman negatif menjadi positif.",
        tips: [],
      },
      {
        id: "cs-role-2",
        category: "role-specific",
        question: "Bagaimana cara Anda menghadapi pelanggan yang marah atau emosional?",
        answer:
          "1) Tetap tenang dan jangan terbawa emosi. 2) Biarkan pelanggan mengungkapkan keluhan tanpa interupsi. 3) Tunjukkan empati: 'Saya paham betapa frustrasinya situasi ini.' 4) Minta maaf atas ketidaknyamanan. 5) Fokus pada solusi, bukan perdebatan. 6) Konfirmasi masalah sudah terselesaikan.",
        tips: ["Jangan pernah membalas kemarahan dengan kemarahan — tetap profesional"],
      },
      {
        id: "cs-role-3",
        category: "role-specific",
        question: "Apa yang Anda lakukan jika tidak tahu jawaban atas pertanyaan pelanggan?",
        answer:
          "Jangan menebak! Katakan dengan jujur: 'Maaf, untuk memastikan informasi yang saya berikan akurat, izinkan saya mengecek terlebih dahulu. Saya akan kembali kepada Anda dalam [X menit].' Lalu pastikan follow up sesuai waktu yang dijanjikan.",
        tips: [],
      },
      {
        id: "cs-role-4",
        category: "role-specific",
        question: "Bagaimana Anda memprioritaskan pelanggan saat banyak yang perlu dilayani bersamaan?",
        answer:
          "Prioritaskan berdasarkan urgensi dan jenis masalah. Untuk volume tinggi, gunakan template response untuk pertanyaan umum. Komunikasikan estimasi waktu tunggu kepada pelanggan. Jika overwhelmed, eskalasi ke supervisor.",
        tips: [],
      },
      {
        id: "cs-role-5",
        category: "role-specific",
        question: "Apa itu SLA dan mengapa penting dalam CS?",
        answer:
          "SLA (Service Level Agreement) adalah komitmen waktu respon dan penyelesaian yang dijanjikan kepada pelanggan. Penting karena mengatur ekspektasi pelanggan, mengukur kinerja tim CS, dan memastikan konsistensi layanan. Contoh: 'Email dibalas dalam 24 jam' atau 'Live chat direspons dalam 2 menit.'",
        tips: [],
      },
      {
        id: "cs-role-6",
        category: "role-specific",
        question: "Bagaimana Anda menangani pelanggan yang meminta di luar kebijakan perusahaan?",
        answer:
          "Dengan empati: 'Saya mengerti permintaan Anda, namun kebijakan kami saat ini belum memungkinkan karena [alasan]. Yang bisa saya lakukan adalah [alternatif solusi].' Selalu tawarkan alternatif, jangan hanya mengatakan 'tidak bisa.'",
        tips: [],
      },
      {
        id: "cs-role-7",
        category: "role-specific",
        question: "Apa metrik yang digunakan untuk mengukur kinerja CS?",
        answer:
          "CSAT (Customer Satisfaction Score): kepuasan pelanggan pasca interaksi. FCR (First Contact Resolution): masalah selesai di kontak pertama. AHT (Average Handle Time): rata-rata durasi penanganan. NPS (Net Promoter Score): seberapa besar pelanggan merekomendasikan perusahaan. Response Time: kecepatan merespons.",
        tips: [],
      },
      {
        id: "cs-role-8",
        category: "role-specific",
        question: "Ceritakan pengalaman mengubah pengalaman pelanggan dari negatif menjadi positif.",
        answer:
          "Contoh: Ada pelanggan yang frustrasi karena paket salah kirim dan sudah menunggu 5 hari. Saya eskalasi ke tim logistik, memberikan update setiap 4 jam, dan mengusulkan kompensasi voucher. Paket tiba di hari berikutnya dan pelanggan memberikan rating 5 bintang.",
        tips: ["Gunakan format STAR: Situation, Task, Action, Result"],
      },
    ],
  },

  /* ═══════════════════════════ SUPPLY CHAIN ════════════════════════ */
  {
    id: "supply-chain",
    title: "Supply Chain / Logistik / PPIC",
    categorySlug: "operations",
    icon: "inventory",
    questions: [
      ...hrQuestions,
      {
        id: "sc-role-1",
        category: "role-specific",
        question: "Apa yang Anda ketahui tentang supply chain management?",
        answer:
          "Supply Chain Management adalah pengelolaan aliran barang, informasi, dan uang dari supplier hingga ke konsumen akhir. Mencakup: pengadaan (procurement), produksi, penyimpanan (warehousing), distribusi, dan reverse logistics.",
        tips: [],
      },
      {
        id: "sc-role-2",
        category: "role-specific",
        question: "Apa itu PPIC dan apa perannya?",
        answer:
          "PPIC (Production Planning and Inventory Control) adalah fungsi yang merencanakan jadwal produksi berdasarkan demand, mengelola stok bahan baku dan produk jadi, serta memastikan produksi berjalan efisien tanpa overstock atau stockout.",
        tips: [],
      },
      {
        id: "sc-role-3",
        category: "role-specific",
        question: "Jelaskan perbedaan FIFO, LIFO, dan FEFO.",
        answer:
          "FIFO (First In First Out): barang yang masuk pertama dikeluarkan pertama — metode umum. LIFO (Last In First Out): barang yang masuk terakhir dikeluarkan pertama — jarang di Indonesia. FEFO (First Expired First Out): barang dengan kadaluarsa terdekat dikeluarkan pertama — wajib di industri makanan dan farmasi.",
        tips: [],
      },
      {
        id: "sc-role-4",
        category: "role-specific",
        question: "Apa itu safety stock dan bagaimana cara menghitungnya?",
        answer:
          "Safety stock adalah stok buffer untuk mengantisipasi variasi permintaan dan lead time. Formula sederhana: Safety Stock = (Max Daily Usage × Max Lead Time) − (Average Daily Usage × Average Lead Time). Berguna mencegah stockout tanpa overstock berlebihan.",
        tips: [],
      },
      {
        id: "sc-role-5",
        category: "role-specific",
        question: "Apa itu EOQ (Economic Order Quantity)?",
        answer:
          "EOQ adalah jumlah pemesanan optimal yang meminimalkan total biaya inventori (biaya pesan + biaya simpan). Formula: EOQ = √(2DS/H) di mana D = demand tahunan, S = biaya per order, H = biaya simpan per unit per tahun.",
        tips: ["Pahami konsepnya, tidak perlu hafal rumus persis — yang penting paham tujuannya"],
      },
      {
        id: "sc-role-6",
        category: "role-specific",
        question: "Apa yang Anda ketahui tentang Lean Manufacturing?",
        answer:
          "Lean Manufacturing adalah filosofi produksi yang berfokus pada eliminasi waste (pemborosan). 8 jenis waste (TIM WOODS): Transportation, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects, Skills (unused talent).",
        tips: [],
      },
      {
        id: "sc-role-7",
        category: "role-specific",
        question: "Apa KPI Supply Chain yang biasa digunakan?",
        answer:
          "Inventory Turnover: berapa kali stok berputar dalam setahun. Fill Rate: persentase order terpenuhi tepat waktu. OTIF (On Time In Full): pengiriman tepat waktu dan jumlah lengkap. Days of Supply: berapa hari stok cukup. Supplier Lead Time: rata-rata lead time supplier.",
        tips: [],
      },
      {
        id: "sc-role-8",
        category: "role-specific",
        question: "Bagaimana Anda menangani keterlambatan pengiriman dari supplier?",
        answer:
          "1) Segera konfirmasi timeline baru ke supplier. 2) Cek dampak ke jadwal produksi atau stok yang ada. 3) Cari alternatif supplier darurat jika critical. 4) Informasikan ke tim produksi dan manajemen. 5) Evaluasi supplier untuk penilaian kinerja ke depan.",
        tips: [],
      },
    ],
  },

  /* ═══════════════════════════ DATA ANALYST ═════════════════════════ */
  {
    id: "data-analyst",
    title: "Data Analyst",
    categorySlug: "technology",
    icon: "insights",
    questions: [
      ...hrQuestions,
      {
        id: "da-role-1",
        category: "role-specific",
        question: "Jelaskan proses Anda dalam menganalisis sebuah dataset baru.",
        answer:
          "1) Pahami konteks bisnis dan pertanyaan yang ingin dijawab. 2) Eksplorasi data (EDA): cek struktur, tipe data, jumlah baris. 3) Cek data quality: missing value, duplicate, outlier. 4) Bersihkan dan transformasi data. 5) Analisis dan visualisasi. 6) Interpretasi temuan dan rekomendasi.",
        tips: ["Tekankan bahwa 80% waktu data analyst dihabiskan untuk data cleaning"],
      },
      {
        id: "da-role-2",
        category: "role-specific",
        question: "Tools apa yang Anda gunakan untuk analisis data?",
        answer:
          "Excel untuk quick analysis, SQL untuk query database, Python (Pandas, NumPy, Matplotlib, Seaborn) untuk analisis kompleks, dan Tableau/Power BI untuk visualisasi dan dashboard. Saya sesuaikan tool dengan kebutuhan dan audience.",
        tips: [],
      },
      {
        id: "da-role-3",
        category: "role-specific",
        question: "Apa perbedaan INNER JOIN, LEFT JOIN, dan RIGHT JOIN di SQL?",
        answer:
          "INNER JOIN: hanya baris yang punya pasangan di kedua tabel. LEFT JOIN: semua baris tabel kiri + baris yang cocok dari tabel kanan (NULL jika tidak ada). RIGHT JOIN: kebalikan LEFT JOIN. FULL OUTER JOIN: semua baris dari kedua tabel.",
        tips: [],
      },
      {
        id: "da-role-4",
        category: "role-specific",
        question: "Apa itu missing value dan bagaimana cara menanganinya?",
        answer:
          "Missing value adalah data yang tidak tersedia. Penanganan: Drop (hapus jika proporsi kecil), Imputation (isi mean/median untuk numerik, mode untuk kategorikal), Forward/Backward Fill (time series), atau Flag (kolom penanda). Pilihan tergantung konteks.",
        tips: [],
      },
      {
        id: "da-role-5",
        category: "role-specific",
        question: "Apa itu outlier dan bagaimana cara mengidentifikasinya?",
        answer:
          "Outlier adalah nilai yang jauh menyimpang dari distribusi normal. Identifikasi: Visualisasi (boxplot, scatter plot) atau Statistik (IQR method — nilai di luar Q1-1.5×IQR atau Q3+1.5×IQR, Z-score > 3). Penanganan: drop, transformasi log, atau cap/floor.",
        tips: [],
      },
      {
        id: "da-role-6",
        category: "role-specific",
        question: "Apa perbedaan antara korelasi dan kausalitas?",
        answer:
          "Korelasi: dua variabel bergerak bersama (positif/negatif), tapi tidak berarti sebab-akibat. Kausalitas: satu variabel secara langsung menyebabkan perubahan pada variabel lain. Contoh: penjualan es krim berkorelasi dengan tenggelam di kolam renang (sama-sama naik di musim panas), tapi bukan penyebab.",
        tips: ["Ini pertanyaan klasik — tunjukkan pemahaman dengan contoh nyata"],
      },
      {
        id: "da-role-7",
        category: "role-specific",
        question: "Apa itu A/B testing dan bagaimana cara kerjanya?",
        answer:
          "A/B testing adalah eksperimen membandingkan dua versi (A=kontrol, B=treatment). Langkah: tentukan hipotesis, hitung sample size, assign secara acak, jalankan eksperimen, analisis hasil secara statistik (p-value, confidence interval), tentukan signifikansi.",
        tips: [],
      },
      {
        id: "da-role-8",
        category: "role-specific",
        question: "Apa elemen kunci dalam dashboard yang baik?",
        answer:
          "Fokus pada keputusan yang perlu dibuat (bukan semua data). Hierarki informasi jelas (overview → detail). Update otomatis jika memungkinkan. Desain bersih, tidak terlalu ramai. Aksesibel bagi audience yang dituju.",
        tips: [],
      },
      {
        id: "da-role-9",
        category: "role-specific",
        question: "Ceritakan proyek analisis data yang paling berimpact yang pernah Anda kerjakan.",
        answer:
          "Contoh: Saya menganalisis pola churn pelanggan menggunakan Python dan SQL. Saya menemukan pelanggan yang tidak melakukan pembelian dalam 30 hari pertama memiliki probabilitas churn 70% lebih tinggi. Rekomendasi program early engagement berhasil mengurangi churn rate 15% dalam satu kuartal.",
        tips: ["Gunakan data konkret: persentase, jumlah, dampak bisnis yang terukur"],
      },
    ],
  },

  /* ═══════════════════════════ MANUFACTURING ════════════════════════ */
  {
    id: "operator-produksi",
    title: "Operator Produksi / Staff Manufaktur",
    categorySlug: "operations",
    icon: "precision_manufacturing",
    questions: [
      ...hrQuestions,
      {
        id: "op-role-1",
        category: "role-specific",
        question: "Mengapa Anda melamar posisi operator produksi di perusahaan ini?",
        answer:
          "Saya tertarik karena perusahaan ini memiliki reputasi baik dalam menjaga standar kualitas produksi. Saya ingin berkontribusi langsung dalam proses produksi dan berkembang menjadi operator yang kompeten dan terampil.",
        tips: ["Riset produk perusahaan sebelum interview"],
      },
      {
        id: "op-role-2",
        category: "role-specific",
        question: "Apakah Anda pernah bekerja di lingkungan produksi atau pabrik sebelumnya?",
        answer:
          "Ya, saya pernah bekerja sebagai [posisi] di [perusahaan] selama [X] tahun. Saya terbiasa dengan shift kerja, target produksi, dan prosedur K3 (Keselamatan dan Kesehatan Kerja).",
        tips: ["Sebutkan pengalaman spesifik: jenis mesin, produk yang dibuat, target harian"],
      },
      {
        id: "op-role-3",
        category: "role-specific",
        question: "Bagaimana cara Anda menjaga kualitas produk selama proses produksi?",
        answer:
          "Dengan melakukan pengecekan secara berkala sesuai standar operasional prosedur (SOP), memastikan mesin bekerja dengan baik sebelum memulai produksi, melaporkan segera jika menemukan cacat produk, dan mengikuti instruksi kerja dengan teliti.",
        tips: [],
      },
      {
        id: "op-role-4",
        category: "role-specific",
        question: "Apa yang Anda ketahui tentang K3 (Keselamatan dan Kesehatan Kerja)?",
        answer:
          "K3 adalah upaya melindungi pekerja dari risiko kecelakaan dan penyakit akibat kerja. Mencakup: penggunaan APD (helm, sepatu safety, masker), prosedur darurat, rambu-rambu keselamatan, pelaporan insiden, dan budaya safety-first di tempat kerja.",
        tips: ["Tunjukkan bahwa keselamatan adalah prioritas utama Anda"],
      },
      {
        id: "op-role-5",
        category: "role-specific",
        question: "Apakah Anda bersedia bekerja shift malam dan lembur jika diperlukan?",
        answer:
          "Ya, saya bersedia bekerja shift malam dan lembur sesuai kebutuhan produksi. Saya memahami bahwa industri manufaktur membutuhkan operasi 24 jam dan saya siap menjalankan jadwal yang ditetapkan.",
        tips: ["Jawab jujur — jika benar-benar tidak bisa shift malam, sampaikan sejak awal"],
      },
      {
        id: "op-role-6",
        category: "role-specific",
        question: "Apa itu 5S/5R dan mengapa penting?",
        answer:
          "5S (Seiri-Ringkas, Seiton-Rapi, Seiso-Resik, Seiketsu-Rawat, Shitsuke-Rajin) adalah metode pengelolaan tempat kerja yang sistematis. Penting untuk: meningkatkan efisiensi, mengurangi waste, mencegah kecelakaan, dan menciptakan lingkungan kerja yang nyaman dan produktif.",
        tips: ["5S adalah konsep dasar di hampir semua pabrik — pahami baik-baik"],
      },
      {
        id: "op-role-7",
        category: "role-specific",
        question: "Bagaimana Anda menangani target produksi yang tinggi?",
        answer:
          "Saya fokus pada pekerjaan, mengikuti SOP dengan disiplin, dan menjaga kecepatan tanpa mengorbankan kualitas. Jika ada hambatan, saya segera melapor ke supervisor. Saya juga menjaga kondisi fisik agar tetap prima selama jam kerja.",
        tips: [],
      },
      {
        id: "op-role-8",
        category: "role-specific",
        question: "Apa yang Anda lakukan jika melihat rekan kerja melanggar prosedur keselamatan?",
        answer:
          "Saya akan menegur rekan tersebut dengan cara yang baik dan mengingatkan pentingnya prosedur keselamatan. Jika terus berulang, saya laporkan ke supervisor demi kebaikan bersama. Keselamatan adalah tanggung jawab kita semua.",
        tips: [],
      },
    ],
  },

  /* ═══════════════════════════ MANUFACTURING & INDUSTRIAL ══════════ */
  {
    id: "it-support",
    title: "IT Support / Teknisi IT",
    categorySlug: "technology",
    icon: "computer",
    questions: [
      ...hrQuestions,
      {
        id: "it-role-1",
        category: "role-specific",
        question: "Jelaskan langkah Anda ketika ada user yang melaporkan komputer tidak bisa menyala.",
        answer:
          "1) Cek kabel power dan sumber listrik. 2) Cek indikator LED pada CPU dan monitor. 3) Coba restart. 4) Jika masih mati, cek hardware internal (power supply, koneksi kabel). 5) Dokumentasi dan laporkan temuan. Selalu mulai dari yang paling sederhana dulu.",
        tips: ["Pendekatan sistematis — mulai dari yang paling mungkin dan termudah"],
      },
      {
        id: "it-role-2",
        category: "role-specific",
        question: "Apa yang Anda ketahui tentang jaringan komputer (LAN, WAN, TCP/IP)?",
        answer:
          "LAN (Local Area Network): jaringan dalam area terbatas seperti kantor. WAN (Wide Area Network): jaringan luas antar kota/negara, internet adalah WAN terbesar. TCP/IP adalah protokol komunikasi utama internet. Saya familiar dengan konfigurasi IP address, subnet mask, gateway, DNS, dan troubleshooting jaringan dasar menggunakan ping/tracert.",
        tips: [],
      },
      {
        id: "it-role-3",
        category: "role-specific",
        question: "Bagaimana cara Anda menangani instalasi software dan hardware baru?",
        answer:
          "1) Pastikan kompatibilitas dengan sistem yang ada. 2) Backup data penting sebelum instalasi. 3) Ikuti prosedur instalasi sesuai standar. 4) Lakukan testing setelah instalasi. 5) Dokumentasi konfigurasi untuk referensi masa depan. 6) Beri user briefing singkat jika diperlukan.",
        tips: [],
      },
      {
        id: "it-role-4",
        category: "role-specific",
        question: "Apa yang Anda lakukan jika server atau jaringan kantor tiba-tiba down?",
        answer:
          "1) Tetap tenang dan identifikasi scope masalah. 2) Cek fisik: listrik, kabel, indikator LED. 3) Cek log sistem untuk error. 4) Isolasi penyebab: hardware, software, atau jaringan. 5) Restart komponen jika perlu. 6) Komunikasikan status ke user dan manajemen. 7) Dokumentasi insiden dan solusi.",
        tips: ["Prioritas utama: restore layanan secepat mungkin, baru investigasi root cause"],
      },
      {
        id: "it-role-5",
        category: "role-specific",
        question: "Apakah Anda familiar dengan sistem operasi Windows Server atau Linux?",
        answer:
          "Saya familiar dengan Windows Server untuk administrasi domain, Active Directory, dan Group Policy. Untuk Linux, saya bisa menggunakan command line dasar, manajemen file, user management, dan instalasi package. Saya juga pernah setup web server di Ubuntu.",
        tips: ["Sebutkan distribusi Linux yang familiar: Ubuntu, CentOS, atau Debian"],
      },
      {
        id: "it-role-6",
        category: "role-specific",
        question: "Bagaimana Anda memastikan keamanan data dan sistem di perusahaan?",
        answer:
          "1) Antivirus dan firewall updated. 2) Password policy yang kuat dan regular change. 3) Backup data rutin (3-2-1 rule). 4) Restriksi akses berdasarkan peran. 5) Update patch dan security update tepat waktu. 6) Edukasi user tentang phishing dan security awareness.",
        tips: [],
      },
    ],
  },
  {
    id: "industrial-engineer",
    title: "Industrial Engineer",
    categorySlug: "manufacturing",
    icon: "settings_suggest",
    questions: [
      ...hrQuestions,
      {
        id: "ie-role-1",
        category: "role-specific",
        question: "Apa yang Anda ketahui tentang Industrial Engineering?",
        answer:
          "Industrial Engineering adalah ilmu yang berfokus pada optimalisasi sistem, proses, dan sumber daya. Mencakup perancangan, perbaikan, dan instalasi sistem terintegrasi yang terdiri dari manusia, material, peralatan, energi, dan informasi. Tujuannya meningkatkan efisiensi, produktivitas, dan kualitas.",
        tips: ["Tekankan pendekatan sistem — IE bukan hanya tentang efisiensi, tapi optimalisasi menyeluruh"],
      },
      {
        id: "ie-role-2",
        category: "role-specific",
        question: "Apa itu time study dan motion study?",
        answer:
          "Time study adalah teknik mengukur waktu yang dibutuhkan untuk menyelesaikan suatu tugas guna menetapkan standar waktu kerja. Motion study adalah analisis gerakan kerja untuk mengidentifikasi dan menghilangkan gerakan yang tidak perlu. Keduanya digunakan untuk meningkatkan efisiensi dan produktivitas kerja.",
        tips: ["Sebutkan tools: stopwatch, camera, software seperti ProPlanner atau Arena"],
      },
      {
        id: "ie-role-3",
        category: "role-specific",
        question: "Apa itu line balancing dan mengapa penting dalam produksi?",
        answer:
          "Line balancing adalah penyeimbangan beban kerja di setiap stasiun kerja dalam lini produksi agar tidak ada stasiun yang idle (menganggur) atau overload. Tujuannya meminimalkan bottleneck, mengurangi waktu siklus, dan meningkatkan efisiensi lini. Metrik utama: Balance Delay dan Smoothness Index.",
        tips: [],
      },
      {
        id: "ie-role-4",
        category: "role-specific",
        question: "Apa itu layout pabrik dan jenis-jenisnya?",
        answer:
          "Layout pabrik adalah pengaturan fisik fasilitas produksi. Jenis: (1) Product Layout — berdasarkan urutan proses produk, cocok produksi massal. (2) Process Layout — berdasarkan fungsi mesin, cocok job shop. (3) Fixed Position Layout — produk diam, pekerja bergerak. (4) Cellular Layout — grup mesin untuk produk keluarga tertentu.",
        tips: ["Berikan contoh industri yang cocok untuk masing-masing layout"],
      },
      {
        id: "ie-role-5",
        category: "role-specific",
        question: "Apa itu Overall Equipment Effectiveness (OEE)?",
        answer:
          "OEE adalah metrik untuk mengukur efektivitas penggunaan peralatan. Rumus: OEE = Availability × Performance × Quality. Availability mengukur downtime, Performance mengukur kecepatan produksi, Quality mengukur produk cacat. OEE > 85% dianggap world class.",
        tips: [],
      },
      {
        id: "ie-role-6",
        category: "role-specific",
        question: "Jelaskan pengalaman Anda dengan tools seperti AutoCAD, Arena, atau Minitab.",
        answer:
          "Saya familiar dengan AutoCAD untuk layout pabrik, Arena/R Simulasi untuk pemodelan sistem produksi, dan Minitab untuk analisis statistik dan DOE (Design of Experiment). Saya juga bisa menggunakan Excel untuk analisis data dan forecasting.",
        tips: ["Sesuaikan dengan software yang benar-benar Anda kuasai"],
      },
    ],
  },
  {
    id: "qa-qc",
    title: "QA / QC",
    categorySlug: "manufacturing",
    icon: "fact_check",
    questions: [
      ...hrQuestions,
      {
        id: "qc-role-1",
        category: "role-specific",
        question: "Apa perbedaan Quality Assurance (QA) dan Quality Control (QC)?",
        answer:
          "QA (Quality Assurance) bersifat proaktif — berfokus pada pencegahan cacat melalui perbaikan proses. QC (Quality Control) bersifat reaktif — berfokus pada deteksi cacat melalui inspeksi produk. QA: 'Kita lakukan proses yang benar.' QC: 'Apakah produk yang dihasilkan benar?' Keduanya saling melengkapi.",
        tips: ["Pertanyaan klasik — pastikan Anda bisa menjelaskan bedanya dengan contoh konkret"],
      },
      {
        id: "qc-role-2",
        category: "role-specific",
        question: "Apa itu 7 Tools Quality Control?",
        answer:
          "1) Check Sheet — pengumpulan data. 2) Histogram — distribusi data. 3) Pareto Chart — prioritas masalah. 4) Cause-and-Effect Diagram (Fishbone) — akar masalah. 5) Scatter Diagram — hubungan variabel. 6) Control Chart — stabilitas proses. 7) Flow Chart — alur proses.",
        tips: ["Hafalkan 7 tools — ini pertanyaan wajib di industri manufaktur"],
      },
      {
        id: "qc-role-3",
        category: "role-specific",
        question: "Apa itu ISO 9001 dan mengapa penting?",
        answer:
          "ISO 9001 adalah standar internasional untuk Sistem Manajemen Mutu (Quality Management System). Penting karena: memastikan konsistensi kualitas, meningkatkan kepuasan pelanggan, mempermudah akses pasar global, dan menjadi syarat banyak tender. Prinsip utama: process approach, continuous improvement, dan customer focus.",
        tips: [],
      },
      {
        id: "qc-role-4",
        category: "role-specific",
        question: "Apa itu sampling plan dan kapan digunakan?",
        answer:
          "Sampling plan adalah metode pengambilan sampel untuk inspeksi produk, digunakan ketika 100% inspeksi tidak memungkinkan (biaya tinggi, volume besar, atau pengujian destruktif). Standar umum: ANSI/ASQ Z1.4 atau MIL-STD-1916. Parameter: lot size, sample size, acceptance number (Ac), rejection number (Re).",
        tips: [],
      },
      {
        id: "qc-role-5",
        category: "role-specific",
        question: "Apa itu PDCA (Plan-Do-Check-Act)?",
        answer:
          "PDCA adalah siklus perbaikan berkelanjutan yang dikembangkan oleh Deming. Plan: identifikasi masalah dan rencanakan solusi. Do: implementasikan solusi dalam skala kecil. Check: evaluasi hasil implementasi. Act: jika berhasil, standarisasi; jika tidak, iterasi dengan rencana baru.",
        tips: ["PDCA adalah fondasi continuous improvement — semua orang di manufaktur harus paham"],
      },
      {
        id: "qc-role-6",
        category: "role-specific",
        question: "Bagaimana Anda menangani produk cacat (defect) yang ditemukan?",
        answer:
          "1) Segera beri tanda dan pisahkan produk cacat (hold / quarantine). 2) Dokumentasi jenis cacat, jumlah, dan lokasi. 3) Investigasi penyebab menggunakan fishbone diagram atau 5 Whys. 4) Laporkan ke departemen terkait (produksi, engineering). 5) Implementasi corrective action. 6) Monitor efektivitas perbaikan.",
        tips: [],
      },
    ],
  },
  {
    id: "hse",
    title: "HSE / SHE / K3",
    categorySlug: "manufacturing",
    icon: "health_and_safety",
    questions: [
      ...hrQuestions,
      {
        id: "hse-role-1",
        category: "role-specific",
        question: "Apa yang Anda ketahui tentang K3 (Keselamatan dan Kesehatan Kerja)?",
        answer:
          "K3 adalah bidang yang berfokus pada perlindungan pekerja dari risiko kecelakaan dan penyakit akibat kerja. Mencakup identifikasi bahaya, penilaian risiko, pengendalian risiko, dan evaluasi. Tujuannya menciptakan tempat kerja yang aman, sehat, dan produktif sesuai UU No. 1 Tahun 1970.",
        tips: [],
      },
      {
        id: "hse-role-2",
        category: "role-specific",
        question: "Apa itu hierarki pengendalian risiko (Risk Control Hierarchy)?",
        answer:
          "Hierarki dari yang paling efektif: (1) Eliminasi — hilangkan bahaya. (2) Substitusi — ganti dengan yang lebih aman. (3) Engineering Controls — isolasi, ventilasi, guarding. (4) Administrative Controls — SOP, training, rotasi kerja. (5) APD — masker, helm, safety shoes. Jangan hanya mengandalkan APD.",
        tips: ["Ingat urutannya: eliminasi adalah yang terbaik, APD adalah pilihan terakhir"],
      },
      {
        id: "hse-role-3",
        category: "role-specific",
        question: "Apa itu HIRADC?",
        answer:
          "HIRADC (Hazard Identification, Risk Assessment, and Determining Control) adalah proses sistematis untuk mengidentifikasi bahaya, menilai risiko, dan menentukan pengendalian yang diperlukan. Biasanya didokumentasikan dalam bentuk matriks risiko dengan likelihood × severity untuk menentukan risk rating.",
        tips: ["Ini adalah dokumen inti K3 — wajib paham cara pengisiannya"],
      },
      {
        id: "hse-role-4",
        category: "role-specific",
        question: "Apa yang Anda lakukan jika terjadi kecelakaan kerja?",
        answer:
          "1) Prioritaskan pertolongan pertama pada korban. 2) Amankan lokasi kejadian. 3) Laporkan ke atasan / tim K3. 4) Investigasi kecelakaan (5 Whys, fishbone). 5) Buat laporan kecelakaan (format Jamsostek / internal). 6) Rekomendasikan tindakan perbaikan. 7) Sosialisasikan ke seluruh pekerja agar tidak terulang.",
        tips: ["Golden hour: 24 jam pertama kritis untuk pelaporan kecelakaan"],
      },
      {
        id: "hse-role-5",
        category: "role-specific",
        question: "Apa yang Anda ketahui tentang SMK3?",
        answer:
          "SMK3 (Sistem Manajemen Keselamatan dan Kesehatan Kerja) adalah sistem manajemen K3 yang terintegrasi, diatur PP No. 50 Tahun 2012. Mencakup kebijakan, perencanaan, pelaksanaan, pemantauan, dan tinjauan manajemen. Perusahaan wajib menerapkan SMK3 jika mempekerjakan >= 100 orang atau memiliki potensi bahaya tinggi.",
        tips: [],
      },
      {
        id: "hse-role-6",
        category: "role-specific",
        question: "Apa saja KPI yang biasa digunakan di departemen HSE?",
        answer:
          "1) Zero Accident — jumlah hari tanpa kecelakaan. 2) Lost Time Injury Frequency (LTIF). 3) Near Miss Reporting Rate. 4) Safety Training Completion. 5) Audit Score / SMK3 Compliance. 6) Hazard Reporting Rate. Yang terpenting: leading indicators (near miss, training) lebih penting dari lagging indicators (kecelakaan).",
        tips: [],
      },
    ],
  },
  {
    id: "research-development",
    title: "R&D / Research & Development",
    categorySlug: "manufacturing",
    icon: "science",
    questions: [
      ...hrQuestions,
      {
        id: "rd-role-1",
        category: "role-specific",
        question: "Apa yang Anda ketahui tentang fungsi R&D di perusahaan manufaktur?",
        answer:
          "R&D bertanggung jawab untuk pengembangan produk baru, perbaikan produk existing, optimasi formula, dan inovasi proses. Mencakup: studi literatur, eksperimen, formulasi, uji coba (trial), scale-up dari lab ke produksi, dan dokumentasi temuan. R&D adalah jembatan antara riset pasar dan produk jadi.",
        tips: [],
      },
      {
        id: "rd-role-2",
        category: "role-specific",
        question: "Jelaskan proses pengembangan produk baru dari ide hingga launching.",
        answer:
          "1) Ideation — riset pasar, kebutuhan konsumen. 2) Screening — seleksi ide yang feasible. 3) Konsep & Desain — spesifikasi produk. 4) Prototype / Lab Trial — pembuatan sampel awal. 5) Pengujian — stability test, shelf life, sensory. 6) Scale-Up — trial produksi skala pilot. 7) Production Trial — uji coba produksi massal. 8) Launching.",
        tips: [],
      },
      {
        id: "rd-role-3",
        category: "role-specific",
        question: "Apa itu formulasi produk dan faktor apa yang perlu dipertimbangkan?",
        answer:
          "Formulasi adalah rancangan komposisi bahan baku untuk menghasilkan produk dengan karakteristik tertentu. Faktor: fungsi bahan, konsentrasi, kompatibilitas antar bahan, stabilitas, shelf life, biaya produksi (costing), regulatory compliance (BPOM, SNI), dan skala produksi.",
        tips: [],
      },
      {
        id: "rd-role-4",
        category: "role-specific",
        question: "Apa itu trial produksi (scale-up) dan apa tantangannya?",
        answer:
          "Scale-up adalah proses menerjemahkan formula lab ke produksi skala industri. Tantangan: perbedaan mixing dynamics, heat transfer, waktu proses yang berbeda, ketersediaan bahan baku skala besar, dan konsistensi kualitas. Solusi: trial bertahap (lab → pilot → massal), dokumentasi parameter proses (CPP), dan QC di setiap tahap.",
        tips: ["Tantangan scale-up adalah salah satu penyebab utama kegagalan produk baru"],
      },
      {
        id: "rd-role-5",
        category: "role-specific",
        question: "Bagaimana cara Anda memastikan produk R&D memenuhi regulasi?",
        answer:
          "1) Identifikasi regulasi yang berlaku (BPOM, SNI, halal, ISO). 2) Uji laboratorium sesuai standar. 3) Siapkan dokumen registrasi (komposisi, spesifikasi, hasil uji). 4) Koordinasi dengan regulatory affairs / legal. 5) Lakukan audit internal sebelum submit ke regulator. 6) Update regulasi secara berkala.",
        tips: [],
      },
      {
        id: "rd-role-6",
        category: "role-specific",
        question: "Ceritakan proyek R&D yang paling menantang yang pernah Anda kerjakan.",
        answer:
          "Contoh: Saya mengembangkan produk baru [jenis produk] yang membutuhkan formulasi ulang karena bahan baku impor sulit didapat. Tantangan: mencari substitusi lokal yang setara kualitasnya dalam waktu 2 bulan. Solusi: screening 10 supplier alternatif, melakukan 15 trial formulasi, dan mempercepat stabilitas dengan metode ASLT.",
        tips: ["Gunakan metode STAR: Situation, Task, Action, Result"],
      },
    ],
  },
  {
    id: "project-engineer",
    title: "Project Engineer",
    categorySlug: "manufacturing",
    icon: "engineering",
    questions: [
      ...hrQuestions,
      {
        id: "pe-role-1",
        category: "role-specific",
        question: "Apa peran seorang Project Engineer di proyek konstruksi/manufaktur?",
        answer:
          "Project Engineer bertanggung jawab atas aspek teknis proyek: memastikan desain sesuai spesifikasi, mengawasi pelaksanaan di lapangan, koordinasi dengan kontraktor/vendor, quality control hasil pekerjaan, dokumentasi proyek (gambar as-built, laporan progress), dan menyelesaikan masalah teknis yang muncul di lapangan.",
        tips: [],
      },
      {
        id: "pe-role-2",
        category: "role-specific",
        question: "Jelaskan tahapan proyek engineering dari awal hingga selesai.",
        answer:
          "1) Feasibility Study — studi kelayakan. 2) Basic Engineering — desain konseptual. 3) Detail Engineering — gambar detail, spesifikasi teknis. 4) Procurement — pengadaan material dan jasa. 5) Construction / Fabrication — pelaksanaan di lapangan. 6) Commissioning — uji coba sistem. 7) Handover — serah terima ke operasional.",
        tips: ["FEP (Front End Planning) yang baik menentukan 80% kesuksesan proyek"],
      },
      {
        id: "pe-role-3",
        category: "role-specific",
        question: "Bagaimana Anda memastikan proyek selesai tepat waktu dan sesuai anggaran?",
        answer:
          "1) Buat Work Breakdown Structure (WBS) yang detail. 2) Buat jadwal (Gantt Chart, CPM) dengan realistic timeline. 3) Tracking progress secara berkala (S-curve). 4) Identifikasi risiko awal dan mitigasi. 5) Rapat koordinasi rutin dengan tim. 6) Manajemen perubahan (change order) yang ketat. 7) Laporan progress harian/mingguan.",
        tips: ["Sebutkan tools: MS Project, Primavera, atau Excel untuk scheduling"],
      },
      {
        id: "pe-role-4",
        category: "role-specific",
        question: "Apa yang Anda lakukan jika ada perubahan desain di tengah proyek?",
        answer:
          "1) Evaluasi dampak perubahan terhadap biaya, jadwal, dan kualitas. 2) Dokumentasikan perubahan melalui Change Order Request. 3) Diskusikan dengan stakeholder dan minta persetujuan. 4) Update dokumen terkait (gambar, spesifikasi, jadwal). 5) Komunikasikan perubahan ke tim lapangan. 6) Monitor implementasi perubahan.",
        tips: [],
      },
      {
        id: "pe-role-5",
        category: "role-specific",
        question: "Apakah Anda bisa membaca gambar teknik (blueprint)?",
        answer:
          "Ya, saya bisa membaca gambar teknik termasuk: denah, potongan, tampak, detail, diagram piping & instrumentation (P&ID), single line diagram elektrikal, dan shop drawing. Saya juga familiar dengan standar gambar seperti ISO dan ANSI.",
        tips: ["Sebutkan software yang dikuasai: AutoCAD, SolidWorks, atau Revit"],
      },
      {
        id: "pe-role-6",
        category: "role-specific",
        question: "Bagaimana Anda menangani konflik antara kontraktor dan pemilik proyek?",
        answer:
          "1) Dengarkan kedua sisi secara objektif. 2) Rujuk ke kontrak dan spesifikasi yang sudah disepakati. 3) Cari solusi win-win yang tidak mengorbankan kualitas. 4) Dokumentasikan kesepakatan tertulis. 5) Jika deadlock, eskalasi ke manajemen dengan data pendukung yang lengkap.",
        tips: [],
      },
    ],
  },
  {
    id: "foreman-produksi",
    title: "Foreman / Supervisor Produksi",
    categorySlug: "manufacturing",
    icon: "supervisor_account",
    questions: [
      ...hrQuestions,
      {
        id: "fp-role-1",
        category: "role-specific",
        question: "Apa tugas utama seorang Foreman / Supervisor Produksi?",
        answer:
          "Mengawasi dan mengkoordinasikan aktivitas operator produksi di lini/shift. Tugas: memastikan target produksi tercapai, menjaga kualitas produk, mengelola absensi dan rotasi operator, memastikan K3 diterapkan, melaporkan hasil produksi, dan menyelesaikan masalah operasional sehari-hari.",
        tips: [],
      },
      {
        id: "fp-role-2",
        category: "role-specific",
        question: "Bagaimana cara Anda memotivasi tim operator untuk mencapai target?",
        answer:
          "1) Komunikasikan target dengan jelas — berikan 'why' bukan cuma 'what'. 2) Berikan apresiasi atas pencapaian. 3) Libatkan operator dalam pemecahan masalah. 4) Pastikan kondisi kerja yang nyaman dan aman. 5) Berikan contoh langsung (lead by example). 6) Adakan kompetisi sehat antar shift/lini.",
        tips: ["Operator yang termotivasi lebih produktif — tunjukkan bahwa Anda peduli"],
      },
      {
        id: "fp-role-3",
        category: "role-specific",
        question: "Apa yang Anda lakukan jika target produksi harian tidak tercapai?",
        answer:
          "1) Cari penyebab: masalah mesin, material, tenaga kerja, atau metode? 2) Hitung loss time dan downtime. 3) Prioritaskan solusi yang bisa segera dilakukan. 4) Komunikasikan ke atasan dan tim terkait. 5) Buat rencana catch-up jika memungkinkan. 6) Dokumentasikan untuk evaluasi di shift berikutnya.",
        tips: [],
      },
      {
        id: "fp-role-4",
        category: "role-specific",
        question: "Bagaimana Anda menangani operator yang sering terlambat atau tidak disiplin?",
        answer:
          "1) Panggil bicara secara pribadi, tanyakan kendala. 2) Beri pengertian tentang pentingnya disiplin dan dampaknya ke tim. 3) Beri peringatan lisan dulu, baru tertulis jika berulang. 4) Libatkan HR jika diperlukan. 5) Beri kesempatan memperbaiki. Saya percaya pendekatan personal lebih efektif daripada langsung menghukum.",
        tips: [],
      },
      {
        id: "fp-role-5",
        category: "role-specific",
        question: "Apa yang Anda ketahui tentang 5S/5R di tempat kerja?",
        answer:
          "5S adalah metode pengelolaan tempat kerja: Seiri (Ringkas) — pisahkan yang perlu dan tidak. Seiton (Rapi) — atur barang pada tempatnya. Seiso (Resik) — bersihkan area kerja. Seiketsu (Rawat) — standarisasi praktik. Shitsuke (Rajin) — jadikan budaya. 5S adalah fondasi untuk mutu, keselamatan, dan produktivitas.",
        tips: ["5S harus menjadi kebiasaan, bukan cuma project sekali jalan"],
      },
      {
        id: "fp-role-6",
        category: "role-specific",
        question: "Bagaimana Anda memastikan kualitas produk di lini produksi Anda?",
        answer:
          "1) Pastikan operator memahami standar kualitas dan SOP. 2) Lakukan pengecekan awal (first piece inspection). 3) Monitoring inline quality check secara berkala. 4) Tangani segera jika ada penyimpangan (stop line jika perlu). 5) Libatkan QC untuk inspeksi sampling. 6) Catat dan analisis defect untuk continuous improvement.",
        tips: [],
      },
    ],
  },
];

/* ─── Helper ─── */

export function getPositionsByCategory(slug: string): PositionQuestions[] {
  return POSITION_QUESTIONS.filter((p) => p.categorySlug === slug);
}

export function getPositionById(id: string): PositionQuestions | undefined {
  return POSITION_QUESTIONS.find((p) => p.id === id);
}

export function searchPositions(query: string): PositionQuestions[] {
  const q = query.toLowerCase();
  return POSITION_QUESTIONS.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.questions.some((qst) => qst.question.toLowerCase().includes(q))
  );
}
