/**
 * Jalankan migrasi 0024 (perbaikan nilai paket) di luar drizzle-kit.
 * Pemakaian: node scripts/apply-0024-pricing-value.mjs
 * Membaca DATABASE_URL dari environment / .env.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(here, "..", "drizzle", "0024_pricing_value.sql");
const sqlText = readFileSync(sqlPath, "utf8");

let url = process.env.DATABASE_URL;
if (!url) {
  const envText = readFileSync(join(here, "..", ".env"), "utf8");
  const line = envText.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
  url = line ? line.slice("DATABASE_URL=".length) : undefined;
}
if (!url) {
  console.error("DATABASE_URL belum di-set.");
  process.exit(1);
}

const sql = postgres(url);
try {
  await sql.unsafe(sqlText);
  const rows = await sql`select key, name, price, period_days from packages where key in ('cv_starter','portfolio_web','bundle_hemat') order by key`;
  console.log("0024 selesai. Paket tersentuh:");
  for (const r of rows) {
    console.log(`  ${r.key} | ${r.name} | ${r.price}/${r.period_days}d`);
  }
} finally {
  await sql.end({ timeout: 3 });
}
