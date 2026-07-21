#!/usr/bin/env node
/**
 * Admin: Approve a pending user registration.
 * Usage: node scripts/approve-user.mjs <email>
 * Example: node scripts/approve-user.mjs rapih091017@gmail.com
 *
 * Sets user status from "pending" to "active".
 * Also lists all pending users if no email is provided.
 */

import postgres from "postgres";

const email = process.argv[2];
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL env variable not set!");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: "require" });

try {
  if (!email) {
    // ── List all pending users ──
    const pending = await sql`
      SELECT id, name, email, created_at FROM users WHERE status = 'pending' ORDER BY created_at ASC
    `;

    if (pending.length === 0) {
      console.log("✅ Tidak ada user yang menunggu persetujuan.");
    } else {
      console.log(`📋 ${pending.length} user menunggu persetujuan:\n`);
      for (const u of pending) {
        console.log(`   - ${u.name || "(no name)"} (${u.email}) — daftar: ${u.created_at}`);
        console.log(`     Approve: node scripts/approve-user.mjs ${u.email}`);
      }
    }
  } else {
    // ── Approve specific user ──
    const [user] = await sql`
      SELECT id, name, email, status FROM users WHERE email = ${email} LIMIT 1
    `;

    if (!user) {
      console.error(`❌ User "${email}" tidak ditemukan.`);
      process.exit(1);
    }

    if (user.status === "active") {
      console.log(`⚠️  User ${email} sudah active.`);
    } else {
      await sql`
        UPDATE users SET status = 'active' WHERE email = ${email}
      `;
      console.log(`✅ User ${email} (${user.name}) telah di-ACTIVATE!`);
      console.log(`   Sekarang bisa login.`);
    }
  }
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
