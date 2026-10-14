// Audit: migrasi mana yang belum diterapkan ke database.
//
// Jalankan: node scripts/audit-migrations.mjs
//
// Membaca setiap file drizzle/NNNN_*.sql, mengambil nama tabel yang dibuat
// (CREATE TABLE / ALTER TABLE ADD COLUMN), lalu membandingkan dengan tabel dan
// kolom yang benar-benar ada. Tabel yang hilang = halaman yang akan 500.

import postgres from "postgres";
import { readFileSync, readdirSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const envContent = readFileSync(join(root, ".env"), "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const i = trimmed.indexOf("=");
  if (i > 0) envVars[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
});

const sql = postgres(envVars.DATABASE_URL, { ssl: "require" });

const files = readdirSync(join(root, "drizzle"))
  .filter((f) => f.endsWith(".sql"))
  .sort();

const existingTables = new Set(
  (await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  ).map((r) => r.table_name),
);

const existingColumns = new Set(
  (await sql`
    SELECT table_name || '.' || column_name AS c
    FROM information_schema.columns
    WHERE table_schema = 'public'`
  ).map((r) => r.c),
);

const missingTables = new Map(); // table -> [files]
const missingColumns = []; // { file, column }

for (const file of files) {
  const text = readFileSync(join(root, "drizzle", file), "utf8");
  for (const m of text.matchAll(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+"([a-z_0-9]+)"/gi)) {
    const table = m[1];
    if (existingTables.has(table)) continue;
    if (!missingTables.has(table)) missingTables.set(table, []);
    missingTables.get(table).push(file);
  }
  for (const m of text.matchAll(/ALTER TABLE\s+"([a-z_0-9]+)"\s+ADD COLUMN(?:\s+IF NOT EXISTS)?\s+"([a-z_0-9]+)"/gi)) {
    const key = `${m[1]}.${m[2]}`;
    if (!existingColumns.has(key)) missingColumns.push({ file, key });
  }
}

console.log(`drizzle/*.sql diperiksa: ${files.length}`);
console.log(`tabel di database: ${existingTables.size}`);

if (missingTables.size === 0 && missingColumns.length === 0) {
  console.log("\nSemua migrasi sudah menerapkan di database ini.");
} else {
  if (missingTables.size > 0) {
    console.log("\nTABEL BELUM ADA:");
    for (const [table, src] of missingTables) {
      console.log(`  ${table}  <- ${[...new Set(src)].join(", ")}`);
    }
  }
  if (missingColumns.length > 0) {
    console.log("\nKOLOM BELUM ADA:");
    for (const { file, key } of missingColumns) console.log(`  ${key}  <- ${file}`);
  }
  console.log("\nHalaman yang memakai objek ini akan 500 sampai migrasinya dijalankan.");
}

await sql.end();