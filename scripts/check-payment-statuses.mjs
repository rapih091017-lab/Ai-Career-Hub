// Cek status pembayaran yang benar-benar dipakai.
// Jalankan: node scripts/check-payment-statuses.mjs

import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, "..", ".env"), "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const i = trimmed.indexOf("=");
  if (i > 0) envVars[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
});

const sql = postgres(envVars.DATABASE_URL, { ssl: "require" });
const rows = await sql`
  SELECT payment_status, COUNT(*)::int AS n, COALESCE(SUM(amount),0)::int AS total
  FROM payments GROUP BY payment_status ORDER BY n DESC`;
console.table(rows);
await sql.end();