// Apply migrasi 0013 (approval affiliate). Idempotent.
// Jalankan: node --env-file=.env scripts/apply-0013-affiliate-approval.mjs
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tidak ditemukan. Jalankan dengan --env-file=.env");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

try {
  await sql.unsafe(readFileSync("drizzle/0013_affiliate_approval.sql", "utf8"));
  console.log("OK: drizzle/0013_affiliate_approval.sql");
  const cols = await sql`
    select column_name from information_schema.columns
    where table_name = 'affiliates' and column_name in ('status', 'application_note', 'reviewed_at', 'approved_at')
    order by column_name
  `;
  console.log("Kolom terverifikasi:", cols.map((c) => c.column_name).join(", "));
  const rows = await sql`select status, count(*)::int as n from affiliates group by status`;
  console.log("Status affiliate:", rows.map((r) => `${r.status}=${r.n}`).join(", ") || "(kosong)");
} catch (err) {
  console.error("GAGAL:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
