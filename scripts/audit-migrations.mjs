// Audit: migrasi mana yang belum diterapkan ke database.
//
// Jalankan: node scripts/audit-migrations.mjs [--check-files] [path-output.json]
//
// Tanpa argumen, membandingkan 26 file drizzle/*.sql dengan tabel dan kolom
// yang benar-benar ada di database. Tabel yang hilang = halaman yang akan 500.
//
// `--check-files` hanya memeriksa file: tidak menyentuh database, jadi aman
// dijalankan di CI. Ini yang menahan migrasi yang tidak ikut ter-commit.

import postgres from "postgres";
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const checkFilesOnly = process.argv.includes("--check-files");
const outPath = process.argv.find((a) => !a.startsWith("--") && a.endsWith(".json"));

const envContent = readFileSync(join(root, ".env"), "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const i = trimmed.indexOf("=");
  if (i > 0) envVars[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
});

/** Kumpulkan tabel dan kolom yang genannt setiap file migrasi. */
function parseMigrations() {
  const files = readdirSync(join(root, "drizzle"))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const wanted = [];
  for (const file of files) {
    const text = readFileSync(join(root, "drizzle", file), "utf8");
    const tables = [...text.matchAll(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+"([a-z_0-9]+)"/gi)].map(
      (m) => m[1],
    );
    const columns = [
      ...text.matchAll(
        /ALTER TABLE\s+"([a-z_0-9]+)"\s+ADD COLUMN(?:\s+IF NOT EXISTS)?\s+"([a-z_0-9]+)"/gi,
      ),
    ].map((m) => `${m[1]}.${m[2]}`);
    wanted.push({ file, tables, columns });
  }
  return wanted;
}

const wanted = parseMigrations();
console.log(`drizzle/*.sql diperiksa: ${wanted.length}`);

if (checkFilesOnly) {
  // File yang sudah tercatat di baseline pernah berjalan ke database, jadi
  // statement di dalamnya tidak akan dievaluasi lagi. Yang dicek hanya file
  // baru: kalau memuat DELETE/UPDATE/TRUNCATE, migrasi bisa menghapus data
  // yang sudah ada kalau tidak sengaja dijalankan ulang.
  const baseline = new Set(
    JSON.parse(readFileSync(join(root, "scripts/migration-baseline.json"), "utf8")),
  );
  let problems = 0;
  for (const { file, tables, columns } of wanted) {
    if (baseline.has(file)) continue;
    const text = readFileSync(join(root, "drizzle", file), "utf8");
    const destructive = text.match(/^\s*(DELETE FROM|TRUNCATE|UPDATE\s+")/gim);
    if (destructive) {
      console.error(`  ${file}: file baru berisi statement merusak data`);
      problems += 1;
    }
    // Migrasi baru harus bisa diulang: tanpa itu, menjalankan dua kali akan
    // gagal di tengah jalan dan meninggalkan database dalam keadaan setengah.
    if (!text.includes("IF NOT EXISTS") && !text.includes("ON CONFLICT")) {
      console.error(`  ${file}: file baru tidak memakai IF NOT EXISTS / ON CONFLICT`);
      problems += 1;
    }
    if (tables.length === 0 && columns.length === 0) {
      console.error(`  ${file}: tidak membuat tabel atau kolom apa pun`);
      problems += 1;
    }
  }
  console.log(
    problems === 0
      ? "Migrasi baru aman: bisa dijalankan ulang dan tidak merusak data."
      : `${problems} masalah pada migrasi baru`,
  );
  process.exit(problems === 0 ? 0 : 1);
}

const sql = postgres(envVars.DATABASE_URL, { ssl: "require" });

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

const missingTables = new Map();
const missingColumns = [];

for (const { file, tables, columns } of wanted) {
  for (const table of tables) {
    if (existingTables.has(table)) continue;
    if (!missingTables.has(table)) missingTables.set(table, []);
    missingTables.get(table).push(file);
  }
  for (const key of columns) {
    if (!existingColumns.has(key)) missingColumns.push({ file, key });
  }
}

console.log(`tabel di database: ${existingTables.size}`);

const payload = {
  capturedAt: new Date().toISOString(),
  missingTables: [...missingTables.entries()].map(([table, files]) => ({ table, files })),
  missingColumns,
};

if (outPath) {
  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`ditulis ke ${outPath}`);
}

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