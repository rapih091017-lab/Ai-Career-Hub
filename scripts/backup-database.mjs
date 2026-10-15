// Dump database ke file SQL gzip.
//
// Jalankan: node scripts/backup-database.mjs [direktori-tujuan]
//
// Dipakai manual dan oleh workflow .github/workflows/db-backup.yml.
// Memakai pg_dump supaya hasilnya bisa dipulihkan dengan perintah:
//   gunzip -c backup.sql.gz | psql "$DATABASE_URL"
//
// GitHub runner sudah membawa postgresql-client, jadi tidak perlu memasang
// apa-apa di sana.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync } from "node:fs";
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

// Environment proses (CI) menang, lalu .env, lalu .env.local.
const env = {
  ...readEnv(join(root, ".env.local")),
  ...readEnv(join(root, ".env")),
  ...process.env,
};
const databaseUrl = env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL tidak ditemukan.");
  process.exit(1);
}

const targetDir = resolve(process.argv[2] ?? join(root, "backups"));
mkdirSync(targetDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const sqlFile = join(targetDir, `ai-career-hub-${stamp}.sql`);
const gzFile = `${sqlFile}.gz`;

const PG_DUMP_CANDIDATES = [
  "pg_dump",
  "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe",
  "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe",
  "C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe",
];

function resolveBin(names) {
  for (const bin of names) {
    try {
      execFileSync(bin, ["--version"], { stdio: "ignore" });
      return bin;
    } catch {
      // coba berikutnya
    }
  }
  return null;
}

const pgDump = resolveBin(PG_DUMP_CANDIDATES);
if (!pgDump) {
  console.error(
    "pg_dump tidak ditemukan.\n" +
      "Pasang PostgreSQL client, atau jalankan script cadangan tanpa pg_dump:\n" +
      "  node scripts/backup-database-fallback.mjs",
  );
  process.exit(2);
}

console.log(`Dump -> ${gzFile}`);
execFileSync(pgDump, ["--dbname", databaseUrl, "--no-owner", "--no-acl"], {
  maxBuffer: 1024 * 1024 * 512,
});

// Rantai pg_dump -> gzip supaya file di disk langsung terkompresi.
const gzip = resolveBin(["gzip", "C:\\Program Files\\Git\\usr\\bin\\gzip.exe"]);
if (gzip) {
  execFileSync(gzip, ["-f", sqlFile], { stdio: "inherit" });
} else {
  // Tanpa gzip, file .sql biasa masih bisa dipulihkan.
  console.warn("gzip tidak ditemukan, menyimpan tanpa kompresi.");
}

const finalFile = gzip ? gzFile : sqlFile;
const sizeKb = Math.round(statSync(finalFile).size / 1024);
console.log(`Selesai: ${finalFile} (${sizeKb} KB)`);

if (sizeKb === 0) {
  console.error("File backup kosong, sesuatu salah.");
  unlinkSync(finalFile);
  process.exit(3);
}