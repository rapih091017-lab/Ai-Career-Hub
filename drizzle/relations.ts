import { relations } from "drizzle-orm/relations";
import { users, sessions, accounts, cvDocuments, masterProfiles, payments, checkerResults, slugHistory, profiles, usageLogs } from "./schema";

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	sessions: many(sessions),
	accounts: many(accounts),
	cvDocuments: many(cvDocuments),
	masterProfiles: many(masterProfiles),
	payments: many(payments),
	checkerResults: many(checkerResults),
	slugHistories: many(slugHistory),
	profiles: many(profiles),
	usageLogs: many(usageLogs),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const cvDocumentsRelations = relations(cvDocuments, ({one, many}) => ({
	user: one(users, {
		fields: [cvDocuments.userId],
		references: [users.id]
	}),
	masterProfile: one(masterProfiles, {
		fields: [cvDocuments.masterProfileId],
		references: [masterProfiles.id]
	}),
	payments: many(payments),
}));

export const masterProfilesRelations = relations(masterProfiles, ({one, many}) => ({
	cvDocuments: many(cvDocuments),
	user: one(users, {
		fields: [masterProfiles.userId],
		references: [users.id]
	}),
	profiles: many(profiles),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	user: one(users, {
		fields: [payments.userId],
		references: [users.id]
	}),
	cvDocument: one(cvDocuments, {
		fields: [payments.cvDocumentId],
		references: [cvDocuments.id]
	}),
}));

export const checkerResultsRelations = relations(checkerResults, ({one}) => ({
	user: one(users, {
		fields: [checkerResults.userId],
		references: [users.id]
	}),
}));

export const slugHistoryRelations = relations(slugHistory, ({one}) => ({
	user: one(users, {
		fields: [slugHistory.userId],
		references: [users.id]
	}),
}));

export const profilesRelations = relations(profiles, ({one}) => ({
	user: one(users, {
		fields: [profiles.userId],
		references: [users.id]
	}),
	masterProfile: one(masterProfiles, {
		fields: [profiles.masterProfileId],
		references: [masterProfiles.id]
	}),
}));

export const usageLogsRelations = relations(usageLogs, ({one}) => ({
	user: one(users, {
		fields: [usageLogs.userId],
		references: [users.id]
	}),
}));