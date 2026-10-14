// Backup isi tabel packages sebelum/ sesudah revisi kuota paket.
// Jalankan: node scripts/backup-packages-state.mjs <path-output.json>

import postgres from "postgres";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = process.argv[2];

const envContent = readFileSync(resolve(__dirname, "..", ".env"), "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex > 0) {
    envVars[trimmed.slice(0, eqIndex).trim()] = trimmed.slice(eqIndex + 1).trim();
  }
});

const sql = postgres(envVars.DATABASE_URL, { ssl: "require" });

const packages = await sql`
  SELECT key, name, price, period_days, monthly, limits, active, sort_order
  FROM packages ORDER BY sort_order`;

// Transaksi gabungan ("a+b") tidak terpecah saat resolve akses, jadi ini daftar
// pesanan yang hak aksesnya bisa hilang kalau bug itu tidak diperbaiki.
const combinedPayments = await sql`
  SELECT id, user_id, package_type, amount, payment_status, paid_at
  FROM payments
  WHERE payment_status = 'success' AND package_type LIKE '%+%'
  ORDER BY paid_at DESC`;

const payload = {
  capturedAt: new Date().toISOString(),
  packages,
  combinedPayments,
};
if (outPath) {
  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`ditulis ke ${outPath}`);
} else {
  console.log(JSON.stringify(payload, null, 2));
}
await sql.end();