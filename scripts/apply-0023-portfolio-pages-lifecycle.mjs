/**
 * Jalankan migrasi 0023 (portfolio_pages_lifecycle) di luar drizzle-kit.
 * Pemakaian: node --env-file=.env scripts/apply-0023-portfolio-pages-lifecycle.mjs
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
  await sql.unsafe(readFileSync("drizzle/0023_portfolio_pages_lifecycle.sql", "utf8"));
  console.log("OK: drizzle/0023_portfolio_pages_lifecycle.sql");
  const rows = await sql`SELECT status, count(*)::int AS n FROM portfolio_pages GROUP BY status ORDER BY status`;
  console.log("0023 selesai. portfolio_pages per status:", rows);
} finally {
  await sql.end();
}
