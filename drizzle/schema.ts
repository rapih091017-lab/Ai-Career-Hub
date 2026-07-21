import { pgTable, unique, text, timestamp, foreignKey, uuid, integer, varchar, boolean, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const verificationTokens = pgTable("verification_tokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	unique("verification_tokens_token_unique").on(table.token),
]);

export const sessions = pgTable("sessions", {
	sessionToken: text("session_token").primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const accounts = pgTable("accounts", {
	userId: uuid("user_id").notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text("provider_account_id").notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text(),
	email: text().notNull(),
	emailVerified: timestamp("email_verified", { mode: 'string' }),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	passwordHash: text("password_hash"),
	status: varchar({ length: 20 }).default('active').notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const packages = pgTable("packages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	price: integer().notNull(),
	periodDays: integer("period_days").notNull(),
	monthly: boolean().default(false),
	limits: jsonb(),
	badge: varchar({ length: 50 }),
	description: text(),
	active: boolean().default(true).notNull(),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("packages_key_key").on(table.key),
]);

export const cvDocuments = pgTable("cv_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	masterProfileId: uuid("master_profile_id").notNull(),
	jobTitle: varchar("job_title", { length: 255 }).notNull(),
	jobDescription: text("job_description").notNull(),
	tailoredContent: jsonb("tailored_content"),
	templateId: varchar("template_id", { length: 50 }).default('minimal-dark-v1'),
	schemaVersion: varchar("schema_version", { length: 10 }).default('1.0'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "cv_documents_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.masterProfileId],
			foreignColumns: [masterProfiles.id],
			name: "cv_documents_master_profile_id_master_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const masterProfiles = pgTable("master_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	personalInfo: jsonb("personal_info"),
	workHistory: jsonb("work_history"),
	education: jsonb(),
	organisations: jsonb(),
	skills: jsonb(),
	schemaVersion: varchar("schema_version", { length: 10 }).default('1.0'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "master_profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("master_profiles_user_id_unique").on(table.userId),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	cvDocumentId: uuid("cv_document_id"),
	orderId: varchar("order_id", { length: 100 }).notNull(),
	transactionId: varchar("transaction_id", { length: 100 }),
	packageType: varchar("package_type", { length: 50 }).notNull(),
	amount: integer().notNull(),
	paymentMethod: varchar("payment_method", { length: 50 }),
	paymentStatus: varchar("payment_status", { length: 50 }).default('pending').notNull(),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	rawNotification: jsonb("raw_notification"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "payments_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.cvDocumentId],
			foreignColumns: [cvDocuments.id],
			name: "payments_cv_document_id_cv_documents_id_fk"
		}).onDelete("set null"),
	unique("payments_order_id_unique").on(table.orderId),
	unique("payments_transaction_id_unique").on(table.transactionId),
]);

export const checkerResults = pgTable("checker_results", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	anonymousFingerprint: jsonb("anonymous_fingerprint"),
	cvTextExtracted: text("cv_text_extracted").notNull(),
	jobDescription: text("job_description").notNull(),
	scores: jsonb().notNull(),
	aiFeedback: jsonb("ai_feedback").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "checker_results_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const slugHistory = pgTable("slug_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	oldSlug: varchar("old_slug", { length: 50 }).notNull(),
	userId: uuid("user_id").notNull(),
	replacedAt: timestamp("replaced_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "slug_history_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("slug_history_old_slug_unique").on(table.oldSlug),
]);

export const profiles = pgTable("profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	masterProfileId: uuid("master_profile_id").notNull(),
	slug: varchar({ length: 50 }).notNull(),
	theme: varchar({ length: 50 }).default('minimal-dark').notNull(),
	isPublic: boolean("is_public").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.masterProfileId],
			foreignColumns: [masterProfiles.id],
			name: "profiles_master_profile_id_master_profiles_id_fk"
		}).onDelete("cascade"),
	unique("profiles_user_id_unique").on(table.userId),
	unique("profiles_slug_unique").on(table.slug),
]);

export const usageLogs = pgTable("usage_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	anonymousFingerprint: jsonb("anonymous_fingerprint"),
	actionType: varchar("action_type", { length: 50 }).notNull(),
	resourceId: uuid("resource_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "usage_logs_user_id_users_id_fk"
		}).onDelete("set null"),
]);
