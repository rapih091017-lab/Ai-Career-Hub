// Cari kunci i18n yang dipakai di kode tapi tidak ada di kamus.
//
// Jalankan: node scripts/find-missing-i18n.mjs
//
// Penyebab paling sering: kunci terhapus saat kamus diedit. Gejalanya di layar
// adalah teks mentah seperti `pricing.table.unlimited` muncul di halaman.

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const dictSource = readFileSync(join(root, "src/lib/i18n.tsx"), "utf8");
const dictKeys = new Set(
  [...dictSource.matchAll(/^\s*"([a-zA-Z0-9._-]+)":\s*\{/gm)].map((m) => m[1]),
);

// Kunci yang memang tidak pernah ada karena dipakai di luar konteks kamus.
const ALLOW_MISSING = new Set([
  "nav.menu-label", // ada, tapi wandai eksplisit supaya perubahan terlihat
]);

const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "__tests__") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
};
walk(join(root, "src"));

const missing = new Map(); // key -> [file:line]

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const lines = source.split("\n");
  lines.forEach((line, index) => {
    // Hanya panggilan satu argumen dan literal statis. Panggilan dengan
    // fallback (`t(key, "teks")`) dan kunci dinamis (`t("a." + b)`) dilewati.
    const matches = line.matchAll(/\bt\(\s*"([a-zA-Z0-9._-]+)"\s*\)/g);
    for (const match of matches) {
      const key = match[1];
      if (dictKeys.has(key) || ALLOW_MISSING.has(key)) continue;
      const relative = file.replace(`${root}\\`, "").replace(`${root}/`, "");
      const list = missing.get(key) ?? [];
      list.push(`${relative}:${index + 1}`);
      missing.set(key, list);
    }
  });
}

if (missing.size === 0) {
  console.log(`Semua kunci i18n yang dipakai ada. Total kunci di kamus: ${dictKeys.size}`);
  process.exit(0);
}

console.log(`Kunci hilang: ${missing.size}`);
for (const [key, locations] of [...missing.entries()].sort()) {
  console.log(`  ${key}`);
  for (const location of locations.slice(0, 3)) console.log(`      ${location}`);
  if (locations.length > 3) console.log(`      ... ${locations.length - 3} lokasi lain`);
}
process.exit(1);