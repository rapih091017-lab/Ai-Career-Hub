/**
 * Jalankan satu file SQL ke database dari terminal.
 *
 * Dipakai karena mesin ini tidak punya `psql`, sedangkan migrasi di folder
 * `drizzle/` dijalankan manual (jurnal drizzle-kit tidak memuat entri baru).
 *
 *   node scripts/apply-sql.mjs drizzle/0026_linkedin_optimizations.sql
 *
 * DATABASE_URL dibaca dari `.env.local` lalu `.env` (BOM di awal file
 * dibuang, karena `.env.local` proyek ini menyimpannya).
 */
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const file = process.argv[2];
if (!file) {
  console.error("Pakai: node scripts/apply-sql.mjs <file.sql>");
  process.exit(1);
}

const sqlPath = path.resolve(process.cwd(), file);
if (!fs.existsSync(sqlPath)) {
  console.error(`File tidak ditemukan: ${sqlPath}`);
  process.exit(1);
}

function readDatabaseUrl() {
  for (const name of [".env.local", ".env"]) {
    const envPath = path.resolve(process.cwd(), name);
    if (!fs.existsSync(envPath)) continue;
    const raw = fs.readFileSync(envPath, "utf8").replace(/^\uFEFF/, "");
    const line = raw
      .split(/\r?\n/)
      .find((row) => row.trim().startsWith("DATABASE_URL="));
    if (!line) continue;
    const value = line
      .slice(line.indexOf("=") + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (value) return value;
  }
  return process.env.DATABASE_URL || "";
}

const url = readDatabaseUrl();
if (!url) {
  console.error("DATABASE_URL tidak ditemukan di .env.local, .env, atau environment.");
  process.exit(1);
}

const host = new URL(url).hostname;
const sql = postgres(url, {
  max: 1,
  ssl: host === "localhost" || host === "127.0.0.1" ? false : "require",
});

try {
  const statement = fs.readFileSync(sqlPath, "utf8");
  await sql.unsafe(statement);
  console.log(`Selesai: ${path.basename(sqlPath)} dijalankan ke ${host}.`);
} catch (error) {
  console.error("Gagal menjalankan SQL:", error.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
