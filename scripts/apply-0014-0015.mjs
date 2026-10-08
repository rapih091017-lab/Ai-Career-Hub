// Apply migrasi 0014 (rekening affiliate) + 0015 (pengaturan situs). Idempotent.
// Jalankan: node --env-file=.env scripts/apply-0014-0015.mjs
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tidak ditemukan. Jalankan dengan --env-file=.env");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

try {
  for (const file of ["drizzle/0014_affiliate_bank.sql", "drizzle/0015_site_settings.sql"]) {
    await sql.unsafe(readFileSync(file, "utf8"));
    console.log("OK:", file);
  }
  const cols = await sql`
    select column_name from information_schema.columns
    where table_name = 'affiliates'
      and column_name in ('bank_name', 'bank_account_number', 'bank_account_holder')
    order by column_name
  `;
  console.log("Kolom affiliate:", cols.map((c) => c.column_name).join(", "));
  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name = 'site_settings'
  `;
  console.log("Tabel site_settings:", tables.length > 0 ? "ADA" : "TIDAK ADA");
} catch (err) {
  console.error("GAGAL:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
