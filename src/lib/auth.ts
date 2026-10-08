import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import * as schema from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  // Percayai host dari request: dev lokal di port apa pun, serta proxy
  // Vercel/Cloudflare. Tanpa ini NextAuth v5 menolak host non-Vercel dan
  // redirect_uri Google bisa salah, memicu "redirect_uri_mismatch".
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.id) return true;

      const [dbUser] = await db
        .select({ status: schema.users.status })
        .from(schema.users)
        .where(eq(schema.users.id, user.id))
        .limit(1);

      if (!dbUser || dbUser.status === "active") return true;

      // Google sudah memverifikasi email — user pending legacy langsung aktif
      if (account?.provider === "google") {
        await db
          .update(schema.users)
          .set({ status: "active", emailVerified: new Date() })
          .where(eq(schema.users.id, user.id));
        return true;
      }

      return false;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});