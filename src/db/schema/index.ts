import { pgTable, text, timestamp, uuid, jsonb, boolean, integer, varchar, index, numeric, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  passwordHash: text("password_hash"),
  image: text("image"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const accounts = pgTable("accounts", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").notNull().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});


export const masterProfiles = pgTable("master_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  personalInfo: jsonb("personal_info").$type<{
    fullName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    linkedin: string | null;
    /** URL portofolio / website pribadi (opsional, tampil di header CV). */
    portfolioUrl?: string | null;
    summary: string | null;
  }>(),
  workHistory: jsonb("work_history").$type<Array<{
    id: string;
    company: string;
    position: string;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
    isPresent?: boolean;
  }>>(),
  education: jsonb("education").$type<Array<{
    id: string;
    institution: string;
    degree: string;
    field: string | null;
    startDate: string | null;
    endDate: string | null;
    gpa?: string | null;
    isPresent?: boolean;
  }>>(),
  organisations: jsonb("organisations").$type<Array<{
    id: string;
    name: string;
    position: string;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  }>>(),
  skills: jsonb("skills").$type<Array<{
    id: string;
    name: string;
    level: "beginner" | "intermediate" | "advanced";
  }>>(),
  certifications: jsonb("certifications").$type<Array<{
    id: string;
    name: string;
    issuer: string;
    year: string;
  }>>(),
  schemaVersion: varchar("schema_version", { length: 10 }).default("1.0"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});


export const cvDocuments = pgTable("cv_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  masterProfileId: uuid("master_profile_id").notNull().references(() => masterProfiles.id, { onDelete: "cascade" }),
  jobTitle: varchar("job_title", { length: 255 }).notNull(),
  jobDescription: text("job_description").notNull(),
  tailoredContent: jsonb("tailored_content").$type<{
    personalInfo: Record<string, unknown> | null;
    workHistory: Array<Record<string, unknown>> | null;
    education: Array<Record<string, unknown>> | null;
    organisations: Array<Record<string, unknown>> | null;
    skills: Array<Record<string, unknown>> | null;
  }>(),
  templateId: varchar("template_id", { length: 50 }).default("industrial-pro"),
  schemaVersion: varchar("schema_version", { length: 10 }).default("1.0"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const checkerResults = pgTable("checker_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  anonymousFingerprint: jsonb("anonymous_fingerprint").$type<{ ip: string; cookieHash: string }>(),
  cvTextExtracted: text("cv_text_extracted").notNull(),
  jobDescription: text("job_description").notNull(),
  scores: jsonb("scores").$type<{ overall: number; keywordGap: number; contextRelevance: number; atsRules: number }>().notNull(),
  aiFeedback: jsonb("ai_feedback").$type<{ keywordGap: string; contextRelevance: string; atsRules: string; summary: string }>().notNull(),
  fullResult: jsonb("full_result").$type<Record<string, unknown> | null>().default(null),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const coverLetters = pgTable("cover_letters", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cvId: uuid("cv_id").references(() => cvDocuments.id, { onDelete: "set null" }),
  jobTitle: text("job_title"),
  companyName: text("company_name"),
  recipientName: text("recipient_name"),
  language: varchar("language", { length: 5 }).notNull().default("id"),
  style: varchar("style", { length: 20 }).notNull().default("formal"),
  subject: text("subject"),
  letterNumber: text("letter_number"),
  attachment: text("attachment"),
  /** Sumber info lowongan (mis. LinkedIn, job fair, referensi) — dipakai paragraf pembuka */
  jobSource: text("job_source"),
  /** Alamat perusahaan tujuan */
  companyAddress: text("company_address"),
  /** Alasan utama memilih program (khusus motivation letter) */
  motivationReason: text("motivation_reason"),
  /** Rencana jika diterima (khusus motivation letter) */
  futurePlan: text("future_plan"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const usageLogs = pgTable("usage_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  anonymousFingerprint: jsonb("anonymous_fingerprint").$type<{ ip: string; cookieHash: string }>(),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  resourceId: uuid("resource_id"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});


export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cvDocumentId: uuid("cv_document_id").references(() => cvDocuments.id, { onDelete: "set null" }),
  orderId: varchar("order_id", { length: 100 }).notNull().unique(),
  transactionId: varchar("transaction_id", { length: 100 }).unique(),
  packageType: varchar("package_type", { length: 50 }).notNull(),
  packageName: varchar("package_name", { length: 255 }),
  amount: integer("amount").notNull(),
  /** Snapshot limits paket saat dibeli — definisi fitur terkunci, tidak ikut perubahan katalog */
  limits: jsonb("limits").$type<Record<string, number | "unlimited" | false>>(),
  /** Redirect URL Snap transaksi — dipakai untuk resume pembayaran pending (anti double-order) */
  redirectUrl: text("redirect_url"),
  /** Kode referral yang aktif saat order dibuat (atribusi affiliate, cookie 25 hari) */
  referralCode: varchar("referral_code", { length: 30 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("pending"),
  paidAt: timestamp("paid_at", { mode: "date" }),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  rawNotification: jsonb("raw_notification").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  masterProfileId: uuid("master_profile_id").notNull().references(() => masterProfiles.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  theme: varchar("theme", { length: 50 }).notNull().default("industrial-pro"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const packages = pgTable("packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  price: integer("price").notNull(),
  periodDays: integer("period_days").notNull(),
  monthly: boolean("monthly").default(false),
  limits: jsonb("limits").$type<Record<string, number | "unlimited" | false>>(),
  badge: varchar("badge", { length: 50 }),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const portfolioPages = pgTable("portfolio_pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  theme: varchar("theme", { length: 50 }).notNull().default("glass"),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  publishedAt: timestamp("published_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

/** Penanda pemakaian trial publish portfolio (1x gratis per akun, permanen).
 * Dipakai supaya unpublish → publish ulang tidak bisa mem-bypass trial.
 * User berbayar (paket portfolio_web / premium / bundle / business) tidak
 * perlu baris ini — entitlement dihitung dari paket aktif. */
export const portfolioTrialUses = pgTable("portfolio_trial_uses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  usedAt: timestamp("used_at", { mode: "date" }).defaultNow(),
});

export const slugHistory = pgTable("slug_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  oldSlug: varchar("old_slug", { length: 50 }).notNull().unique(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  replacedAt: timestamp("replaced_at", { mode: "date" }).defaultNow(),
});

/* ─── Job Tracker ─────────────────────────────────────────────────
 * Pelacak lamaran kerja bergaya kanban. Lowongan diinput manual oleh
 * user, lalu dipindah antar tahap. Tanpa kuota, posisinya sebagai
 * perekat fitur lain: tiap lamaran bisa ditautkan ke CV tailored dan
 * surat lamaran yang dipakai.
 */

/** Tahap pipeline. Default dibuat otomatis saat user pertama membuka
 * tracker (Tersimpan/Dilamar/Interview/Offer/Ditolak); user bebas rename,
 * reorder, tambah, hapus. FK lowongan memakai restrict dan penghapusan
 * stage memindahkan lowongan dulu di level API, jadi tidak ada lowongan
 * yang hilang saat stage dihapus. */
export const jobStages = pgTable("job_stages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 60 }).notNull(),
  /** Token palet (mis. "teal", "amber"), bukan hex bebas — dipetakan ke
   * kelas Tailwind di UI supaya warna tetap konsisten dengan design system. */
  color: varchar("color", { length: 20 }).notNull().default("slate"),
  sortOrder: integer("sort_order").notNull().default(0),
  /** true = dibuat sistem saat inisialisasi; memengaruhi label di UI saja. */
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
}, (table) => [
  index("job_stages_user_id_idx").on(table.userId),
]);

export const trackedJobs = pgTable("tracked_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stageId: uuid("stage_id").notNull().references(() => jobStages.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  location: text("location"),
  /** URL lowongan asli, opsional */
  url: text("url"),
  /** Requirement/JD — bahan untuk tailoring CV dan checker saat dibutuhkan */
  description: text("description"),
  salaryNote: varchar("salary_note", { length: 120 }),
  notes: text("notes"),
  contactName: varchar("contact_name", { length: 120 }),
  contactInfo: varchar("contact_info", { length: 255 }),
  /** Tanggal melamar — diisi manual user, bukan otomatis */
  appliedAt: timestamp("applied_at", { mode: "date" }),
  /** Urutan kartu di dalam kolomnya (ascending) */
  position: integer("position").notNull().default(0),
  cvId: uuid("cv_id").references(() => cvDocuments.id, { onDelete: "set null" }),
  coverLetterId: uuid("cover_letter_id").references(() => coverLetters.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
}, (table) => [
  index("tracked_jobs_user_id_idx").on(table.userId),
  index("tracked_jobs_stage_id_idx").on(table.stageId),
]);

/* ─── Affiliate ───────────────────────────────────────────────────
 * Program referral: tiap user punya kode; link /r/<kode> menanam cookie
 * 25 hari; komisi nominal tetap tercatat saat user yang direfer pertama
 * kali berhasil membayar. Payout masih manual lewat /admin/affiliate.
 */

export const affiliates = pgTable("affiliates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  /** Kode pendek untuk link /r/<code> (huruf kecil + angka tanpa karakter ambigu). */
  code: varchar("code", { length: 30 }).notNull().unique(),
  /** Status keikutsertaan: pending (menunggu review admin), approved, rejected.
   * Link referral hanya aktif dan konversi hanya dicatat saat approved. */
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  /** Catatan pendaftaran dari user (mis. rencana promosi). */
  applicationNote: text("application_note"),
  /** Data rekening untuk pencairan komisi (diisi saat mendaftar). */
  bankName: varchar("bank_name", { length: 100 }),
  bankAccountNumber: varchar("bank_account_number", { length: 50 }),
  bankAccountHolder: varchar("bank_account_holder", { length: 150 }),
  reviewedAt: timestamp("reviewed_at", { mode: "date" }),
  approvedAt: timestamp("approved_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const referralClicks = pgTable("referral_clicks", {
  id: uuid("id").defaultRandom().primaryKey(),
  affiliateId: uuid("affiliate_id").notNull().references(() => affiliates.id, { onDelete: "cascade" }),
  /** Path halaman yang pertama dibuka dari link referral (analitik ringan). */
  landing: varchar("landing", { length: 120 }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
}, (table) => [
  index("referral_clicks_affiliate_id_idx").on(table.affiliateId),
]);

export const referralConversions = pgTable("referral_conversions", {
  id: uuid("id").defaultRandom().primaryKey(),
  affiliateId: uuid("affiliate_id").notNull().references(() => affiliates.id, { onDelete: "cascade" }),
  /** User yang membayar. Unik: satu komisi per user yang direfer (first payment). */
  referredUserId: uuid("referred_user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
  /** Nominal komisi (Rupiah) disnapshot saat konversi agar histori aman. */
  rewardAmount: integer("reward_amount").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  paidAt: timestamp("paid_at", { mode: "date" }),
}, (table) => [
  index("referral_conversions_affiliate_id_idx").on(table.affiliateId),
]);

/* ─── Job Posts (isi halaman /karir) ──────────────────────────────
 * Loker dikurasi admin lewat /admin/jobs: judul, deskripsi, link eksternal,
 * dan foto opsional. Tampil di halaman publik /karir setelah dipublikasikan.
 */

export const jobPosts = pgTable("job_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  company: varchar("company", { length: 200 }),
  location: varchar("location", { length: 200 }),
  /** Deskripsi singkat / requirement dalam teks bebas (baris baru dipertahankan). */
  description: text("description"),
  /** URL pendaftaran eksternal (lamaran mengarah ke luar situs). */
  applyUrl: text("apply_url").notNull(),
  /** Foto/logo: data URL hasil /api/upload atau URL eksternal. */
  imageUrl: text("image_url"),
  isPublished: boolean("is_published").notNull().default(false),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

/* ─── Site Settings ──────────────────────────────────────────────
 * Pengaturan situs key-value yang bisa diubah admin dari /admin/settings
 * (kontak, sosial media, catatan footer) tanpa deploy ulang. */

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

/* ─── Star Scores ────────────────────────────────────────────────
 * Skor STAR terakhir per user per pertanyaan, supaya badge latihan
 * tersinkron lintas perangkat (localStorage tetap dipakai sebagai cache). */

export const starScores = pgTable("star_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionId: varchar("question_id", { length: 80 }).notNull(),
  /** Rata-rata skor S/T/A/R (0.00-5.00). */
  score: numeric("score", { precision: 3, scale: 2 }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
}, (table) => [
  uniqueIndex("star_scores_user_question_idx").on(table.userId, table.questionId),
]);
