// Cadangan database tanpa pg_dump.
//
// Jalankan: node scripts/backup-database-fallback.mjs [direktori-tujuan]
//
// Dipakai kalau PostgreSQL client tidak tersedia di mesin (mis. laptop tanpa
// psql). Backup ditulis sebagai SQL: satu blok COPY untuk tiap tabel, jadi
// pemulihannya hanya perlu `psql "$DATABASE_URL" < backup.sql`.
//
// Kekurangannya jelas: hanya data, bukan struktur tabel, dan tidak sekompres
// pg_dump. Untuk pemulihan total tetap pakai scripts/backup-database.mjs.

import postgres from "postgres";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function readEnv(file) {
  if (!existsSync(file)) return {};
  const vars = {};
  readFileSync(file, "utf-8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const i = trimmed.indexOf("=");
      if (i > 0) vars[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
    });
  return vars;
}

const env = {
  ...readEnv(join(root, ".env.local")),
  ...readEnv(join(root, ".env")),
  ...process.env,
};
if (!env.DATABASE_URL) {
  console.error("DATABASE_URL tidak ditemukan.");
  process.exit(1);
}

const targetDir = resolve(process.argv[2] ?? join(root, "backups"));
mkdirSync(targetDir, { recursive: true });

const sql = postgres(env.DATABASE_URL, { ssl: "require" });

const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name`;

const lines = [
  "-- Cadangan data AI Career Hub",
  `-- Dibuat: ${new Date().toISOString()}`,
  "-- Dipulihkan: psql \"$DATABASE_URL\" < nama-file-ini.sql",
  "SET client_encoding = 'UTF8';",
  "",
];

const literal = (value) => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "t" : "f";
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (Buffer.isBuffer(value)) return `'\\x${value.toString("hex")}'`;
  if (typeof value === "object") return `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
  return `'${String(value).replaceAll("'", "''")}'`;
};

let totalRows = 0;
for (const { table_name: table } of tables) {
  const rows = await sql.unsafe(`SELECT * FROM "${table}"`);
  lines.push(`-- ${table}: ${rows.length} baris`);
  if (rows.length === 0) {
    lines.push("");
    continue;
  }
  const columns = Object.keys(rows[0]);
  const columnList = columns.map((c) => `"${c}"`).join(", ");
  lines.push(`DELETE FROM "${table}";`);
  for (const row of rows) {
    const values = columns.map((c) => literal(row[c])).join(", ");
    lines.push(`INSERT INTO "${table}" (${columnList}) VALUES (${values});`);
    totalRows += 1;
  }
  lines.push("");
}

lines.push(`-- total ${totalRows} baris`);

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outFile = join(targetDir, `ai-career-hub-data-${stamp}.sql`);
writeFileSync(outFile, lines.join("\n"), "utf8");

console.log(
  `Selesai: ${outFile} (${tables.length} tabel, ${totalRows} baris, ${Math.round(statSync(outFile).size / 1024)} KB)`,
);
console.log(`Pemulihan: psql "$DATABASE_URL" < "${outFile}"`);

await sql.end();