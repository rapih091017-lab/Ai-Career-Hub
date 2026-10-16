// Cari sinonim yang dobel (kunci `weak` sama, entah id atau en).
//
// Jalankan: node scripts/find-duplicate-synonyms.mjs

import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const source = readFileSync(join(root, "src/data/resume-synonyms.ts"), "utf8");
const idBlock = source.slice(source.indexOf("id: ["), source.indexOf("en: ["));
const enBlock = source.slice(source.indexOf("en: ["));

function duplicates(block) {
  const words = [...block.matchAll(/weak:\s*"([^"]+)"/g)].map((m) => m[1].trim().toLowerCase());
  const seen = new Set();
  const out = new Set();
  for (const word of words) {
    if (seen.has(word)) out.add(word);
    seen.add(word);
  }
  return [...out];
}

const dupId = duplicates(idBlock);
const dupEn = duplicates(enBlock);

console.log(`entri id: ${([...idBlock.matchAll(/weak:/g)]).length}`);
console.log(`entri en: ${([...enBlock.matchAll(/weak:/g)]).length}`);
console.log(`duplikat id: ${dupId.length}`);
for (const d of dupId) console.log(`   ${d}`);
console.log(`duplikat en: ${dupEn.length}`);
for (const d of dupEn) console.log(`   ${d}`);

process.exit(dupId.length + dupEn.length > 0 ? 1 : 0);