// Hapus satu baris checker_results buatan uji.
// Jalankan: node scripts/delete-checker-result.mjs <id>
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const text = readFileSync(join(root, ".env.local"), "utf8").replace(/^\uFEFF/, "");
const line = text.split("\n").find((l) => l.startsWith("DATABASE_URL="));
if (!line) throw new Error("DATABASE_URL tidak ada di .env.local");
const url = line.slice(13).trim().replace(/^"|"$/g, "");

const id = process.argv[2];
if (!id) throw new Error("berikan id baris");

const sql = postgres(url, { ssl: "require", max: 1 });
try {
  const rows = await sql`delete from checker_results where id = ${id} returning id`;
  console.log("dihapus:", rows.length, "baris untuk id", id);
} finally {
  await sql.end({ timeout: 5 });
}