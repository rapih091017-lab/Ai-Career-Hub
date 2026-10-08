// Apply migrasi 0011 (affiliate) dan 0012 (job posts) ke database.
// Idempotent: aman dijalankan berulang.
// Jalankan: node --env-file=.env scripts/apply-0011-0012.mjs
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tidak ditemukan. Jalankan dengan --env-file=.env");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

const files = [
  "drizzle/0011_add_affiliate.sql",
  "drizzle/0012_add_job_posts.sql",
];

try {
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    await sql.unsafe(content);
    console.log("OK:", file);
  }
  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public'
      and table_name in ('affiliates', 'referral_clicks', 'referral_conversions', 'job_posts')
    order by table_name
  `;
  console.log("Tabel terverifikasi:", tables.map((t) => t.table_name).join(", "));
  const col = await sql`
    select column_name from information_schema.columns
    where table_name = 'payments' and column_name = 'referral_code'
  `;
  console.log("payments.referral_code:", col.length > 0 ? "ADA" : "TIDAK ADA");
} catch (err) {
  console.error("GAGAL:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
