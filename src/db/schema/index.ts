import { pgTable, text, timestamp, uuid, jsonb, boolean, integer, varchar } from "drizzle-orm/pg-core";

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
    summary: string | null;
  }>(),
  workHistory: jsonb("work_history").$type<Array<{
    id: string;
    company: string;
    position: string;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  }>>(),
  education: jsonb("education").$type<Array<{
    id: string;
    institution: string;
    degree: string;
    field: string | null;
    startDate: string | null;
    endDate: string | null;
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
  amount: integer("amount").notNull(),
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

export const slugHistory = pgTable("slug_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  oldSlug: varchar("old_slug", { length: 50 }).notNull().unique(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  replacedAt: timestamp("replaced_at", { mode: "date" }).defaultNow(),
});
