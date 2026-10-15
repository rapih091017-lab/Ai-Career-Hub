import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Setiap kunci i18n yang dipakai di kode harus ada di kamus.
 *
 * Regresi nyata: `pricing.table.unlimited` terhapus saat kamus diedit, dan
 * landing menampilkan teks mentah `pricing.table.unlimited` di dalam tabel
 * perbandingan. Tidak ada error, tidak ada test yang gagal, tapi halaman jadi
 * tidak layak dilihat. Test ini menutup kelas bug itu.
 */

const dictSource = readFileSync("src/lib/i18n.tsx", "utf8");
const dictKeys = new Set(
  [...dictSource.matchAll(/^\s*"([a-zA-Z0-9._-]+)":\s*\{/gm)].map((m) => m[1]),
);

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "__tests__") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = sourceFiles("src");

describe("kamus i18n", () => {
  it("punya cukup banyak entri untuk disebut lengkap", () => {
    expect(dictKeys.size).toBeGreaterThan(1000);
  });

  it("tidak punya kunci ganda", () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const match of dictSource.matchAll(/^\s*"([a-zA-Z0-9._-]+)":\s*\{/gm)) {
      const key = match[1];
      if (seen.has(key)) duplicates.push(key);
      seen.add(key);
    }
    expect(duplicates, `kunci dobel: ${duplicates.join(", ")}`).toEqual([]);
  });

  it("semua kunci yang dipakai di kode ada di kamus", () => {
    const missing = new Map<string, string[]>();

    for (const file of files) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, index) => {
        // Hanya panggilan satu argumen dan literal statis. Panggilan dengan
        // teks cadangan atau kunci dinamis sengaja dilewati.
        for (const match of line.matchAll(/\bt\(\s*"([a-zA-Z0-9._-]+)"\s*\)/g)) {
          const key = match[1];
          if (dictKeys.has(key)) continue;
          const list = missing.get(key) ?? [];
          list.push(`${file}:${index + 1}`);
          missing.set(key, list);
        }
      });
    }

    const report = [...missing.entries()]
      .map(([key, locations]) => `${key} (${locations[0]})`)
      .join(", ");
    expect(missing.size, `kunci hilang: ${report}`).toBe(0);
  });

  it("nilai bahasa Indonesia dan Inggris sama-sama terisi", () => {
    const empties: string[] = [];
    for (const match of dictSource.matchAll(/^\s*"([a-zA-Z0-9._-]+)":\s*\{\s*id:\s*"([^"]*)",\s*en:\s*"([^"]*)"\s*\}/gm)) {
      const [, key, id, en] = match;
      if (!id.trim()) empties.push(`${key} (id)`);
      if (!en.trim()) empties.push(`${key} (en)`);
    }
    expect(empties, `tertranslation kosong: ${empties.slice(0, 5).join(", ")}`).toEqual([]);
  });
});