/**
 * Jalankan migrasi 0022 (portfolio_assets) di luar drizzle-kit.
 * Pemakaian: node --env-file=.env scripts/apply-0022-portfolio-assets.mjs
 */
import postgres from "postgres";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tidak ditemukan. Jalankan dengan --env-file=.env");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require" });
try {
  await sql.unsafe(readFileSync("drizzle/0022_portfolio_assets.sql", "utf8"));
  console.log("OK: drizzle/0022_portfolio_assets.sql");
  const [{ n }] = await sql`select count(*)::int as n from "portfolio_assets"`;
  console.log("0022 selesai. Baris portfolio_assets:", n);
} finally {
  await sql.end();
}
