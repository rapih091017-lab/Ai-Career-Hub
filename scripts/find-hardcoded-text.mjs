// Cari teks UI mentah di JSX yang tidak lewat t().
//
// Jalankan: node scripts/find-hardcoded-text.mjs [--detail] [--file <pola>]
//
// Yang dihitung: teks di antara tag JSX dan atribut aria-label, title,
// placeholder, alt berisi literal string. Heuristik regex, bukan parser:
// tujuannya peta kasar per file, bukan bukti nol.

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const args = process.argv.slice(2);
const detail = args.includes("--detail");
const fileFilter = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;

// Folder/file yang sengaja dilewati: konten data, artikel, server-only, tes, admin,
// dan renderer CV/PDF (labelnya mengikuti cvLang, bukan bahasa UI).
const SKIP_PATH = [
  /\/__tests__\//,
  /\.test\.tsx$/,
  /^src\/data\//,
  /^src\/content\//,
  /^src\/emails\//,
  /^src\/app\/api\//,
  /^src\/app\/admin\//,
  /^src\/components\/admin\//,
  /^src\/app\/karir\//,
  /^src\/app\/career-hub\//,
  /^src\/app\/blog\//,
  /\/(route|opengraph-image|twitter-image|icon|sitemap|robots)\.tsx$/,
  /^src\/components\/cv-templates\//,
  /^src\/components\/pdf\//,
  /Renderer\.tsx$/,
  // Isi portofolio publik: bahasa mengikuti isi portofolio, bukan bahasa UI pengunjung.
  /^src\/components\/portfolio\/sections\//,
  /^src\/components\/portfolio-templates\//,
];

// Teks yang boleh mentah: brand, singkatan, istilah yang sama di dua bahasa.
const ALLOW = new Set([
  "CV", "ATS", "AI", "PDF", "DOCX", "LinkedIn", "Google", "WhatsApp", "Email", "Gmail",
  "OK", "Ok", "STAR", "HR", "GPA", "IPK", "URL", "Career Hub", "Dashboard",
  "Headline", "About", "Skills", "Portfolio", "Instagram", "GitHub", "Behance",
  "Dribbble", "Medium", "Twitter", "X", "TikTok", "YouTube", "Telegram", "Midtrans",
  "DeepSeek", "Pro", "Premium", "Basic", "Free", "Lite", "MT", "Staff", "Bold", "Italic", "Grade",
]);

const SERVER_ONLY = /^\s*import\s+["']server-only["']/m;

const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".tsx")) files.push(full);
  }
};
walk(join(root, "src"));

// Minimal satu kata dua huruf; buang KODE, path, dan kebab-case.
const isWordy = (s) => {
  const text = s.replace(/&[a-z]+;/g, " ").trim();
  if (!text || ALLOW.has(text)) return false;
  if (!/[A-Za-z]{2,}/.test(text)) return false;
  if (/^[A-Z0-9_\-./:]+$/.test(text)) return false;
  if (/^[a-z]+(-[a-z0-9]+)+$/.test(text)) return false;
  if (/:\/\/|@|^\d+x+$|^Rp\b/.test(text)) return false; // URL, email, contoh nomor, mata uang
  return true;
};

const results = [];
for (const file of files) {
  const rel = relative(root, file).replace(/\\/g, "/");
  if (SKIP_PATH.some((re) => re.test(rel))) continue;
  if (fileFilter && !rel.includes(fileFilter)) continue;
  const src = readFileSync(file, "utf8");
  if (SERVER_ONLY.test(src)) continue;
  // Komentar dikosongkan (panjang baris tetap) supaya nomor baris benar.
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
  const hits = [];
  const lineOf = (i) => code.slice(0, i).split("\n").length;
  for (const m of code.matchAll(/>([^<>{}`=;()]*[A-Za-z][^<>{}`=;()]*)(?=<|\{)/g)) {
    const raw = m[1];
    const before = code[m.index - 1];
    if (before === "=" || before === "-") continue; // => dan ->
    if (!isWordy(raw)) continue;
    if (/^\s*(\w+\s*)?(\|\||&&|\?|:)/.test(raw)) continue; // ekspresi TS, bukan teks
    if (/^\s*(Ctrl|Shift|Alt|Cmd|Esc)\b/.test(raw)) continue; // pintasan keyboard
    // Nama ikon Material di dalam <span className="material-symbols...">.
    const tagStart = code.lastIndexOf("<", m.index);
    if (/material-(symbols|icons)/.test(code.slice(tagStart, m.index)) && /^\s*[a-z0-9_]+\s*$/.test(raw)) continue;
    hits.push({ line: lineOf(m.index), text: raw.trim().replace(/\s+/g, " ") });
  }
  for (const m of code.matchAll(/\b(aria-label|title|placeholder|alt)=("([^"]*)"|'([^']*)')/g)) {
    const raw = m[3] ?? m[4] ?? "";
    if (!isWordy(raw)) continue;
    hits.push({ line: lineOf(m.index), text: `${m[1]}="${raw}"` });
  }
  if (hits.length) results.push({ rel, hits });
}

results.sort((a, b) => b.hits.length - a.hits.length || a.rel.localeCompare(b.rel));
const total = results.reduce((n, r) => n + r.hits.length, 0);
for (const r of results) {
  console.log(`${String(r.hits.length).padStart(4)}  ${r.rel}`);
  if (detail) for (const h of r.hits) console.log(`        ${h.line}: ${h.text.slice(0, 100)}`);
}
console.log(`\nTotal teks mentah: ${total} di ${results.length} file`);
