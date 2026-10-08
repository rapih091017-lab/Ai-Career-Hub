// Apply migrasi 0016 (star_scores). Idempotent.
// Jalankan: node --env-file=.env scripts/apply-0016-star-scores.mjs
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tidak ditemukan. Jalankan dengan --env-file=.env");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

try {
  await sql.unsafe(readFileSync("drizzle/0016_star_scores.sql", "utf8"));
  console.log("OK: drizzle/0016_star_scores.sql");
  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name = 'star_scores'
  `;
  console.log("Tabel star_scores:", tables.length > 0 ? "ADA" : "TIDAK ADA");
} catch (err) {
  console.error("GAGAL:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
