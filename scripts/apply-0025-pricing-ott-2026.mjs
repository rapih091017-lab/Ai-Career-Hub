// Menyamakan isi paket satuan di database dengan keputusan harga terbaru.
//
// Jalankan: node scripts/apply-0025-pricing-ott-2026.mjs
//
// Yang diubah:
//  1. Paket satuan dinaikkan isinya, supaya tidak lebih buruk dari gratis.
//     Gratis turun ke 1x per fitur, paket satuan naik (Cek CV 1 -> 3x cek,
//     Surat Lamaran 1 -> 2x surat, Paket Lengkap 2/1/1 -> 3/3/2).
//  2. portfolio_web tidak lagi dijual sebagai produk satuan (active = false).
//     Definisinya tetap ada di kode supaya pembayaran lama tidak kehilangan hak.
//
// Idempoten: aman dijalankan berulang kali.

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
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex > 0) {
    envVars[trimmed.slice(0, eqIndex).trim()] = trimmed.slice(eqIndex + 1).trim();
  }
});

const DATABASE_URL = envVars.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: "require" });

const ALL_FALSE = {
  bulk_analyzer: false,
  white_label: false,
};

const UPDATES = [
  {
    key: "cek_cv",
    limits: {
      ai_cv_generate: false,
      cv_analyzer: 3,
      ai_revision: false,
      ai_suggestion: false,
      cover_letter: false,
      portfolio_web: false,
      pdf_export: false,
      ...ALL_FALSE,
    },
  },
  {
    key: "bikin_cv",
    limits: {
      ai_cv_generate: 3,
      cv_analyzer: false,
      ai_revision: 5,
      ai_suggestion: 5,
      cover_letter: false,
      portfolio_web: false,
      pdf_export: "unlimited",
      ...ALL_FALSE,
    },
  },
  {
    key: "surat_lamaran",
    limits: {
      ai_cv_generate: false,
      cv_analyzer: false,
      ai_revision: false,
      ai_suggestion: false,
      cover_letter: 2,
      portfolio_web: false,
      pdf_export: false,
      ...ALL_FALSE,
    },
  },
  {
    key: "paket_lamaran",
    limits: {
      ai_cv_generate: 3,
      cv_analyzer: 3,
      ai_revision: 5,
      ai_suggestion: 5,
      cover_letter: 2,
      portfolio_web: false,
      pdf_export: "unlimited",
      ...ALL_FALSE,
    },
  },
];

async function main() {
  try {
    console.log("Sebelum:");
    const before = await sql`
      SELECT key, active, limits FROM packages
      WHERE key IN ('cek_cv','bikin_cv','surat_lamaran','paket_lamaran','portfolio_web')
      ORDER BY sort_order`;
    for (const row of before) {
      console.log(` ${row.key} active=${row.active} ${JSON.stringify(row.limits)}`);
    }

    for (const u of UPDATES) {
      // sql.json() wajib: parameter string biasa disimpan sebagai JSON *string*
      // di kolom jsonb (double-encoded), dan pembacaan limits-nya gagal.
      await sql`
        UPDATE packages
        SET limits = ${sql.json(u.limits)}, updated_at = now()
        WHERE key = ${u.key}`;
      console.log(`updated ${u.key}`);
    }

    // portfolio_web keluar dari daftar harga. Barisnya tetap ada supaya
    // pembayaran lama yang memakainya tetap resolve.
    await sql`
      UPDATE packages
      SET active = false, updated_at = now()
      WHERE key = 'portfolio_web'`;
    console.log("updated portfolio_web -> active=false");

    console.log("\nSesudah:");
    const after = await sql`
      SELECT key, active, limits FROM packages
      WHERE key IN ('cek_cv','bikin_cv','surat_lamaran','paket_lamaran','portfolio_web')
      ORDER BY sort_order`;
    for (const row of after) {
      console.log(` ${row.key} active=${row.active} ${JSON.stringify(row.limits)}`);
    }

    const activeKeys = await sql`
      SELECT key FROM packages WHERE active = true ORDER BY sort_order`;
    console.log("\nPaket aktif sekarang:", activeKeys.map((r) => r.key).join(", "));
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();