import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Scan sumber, bukan runtime: bug ini tidak muncul saat route dipanggil, tapi
// saat teks pengguna berisi "$&" tersisip ke prompt tanpa error. Penjaga paling
// murah adalah memeriksa bentuk kodenya sendiri.
//
// Aturan: setiap `.replace(pola, pengganti)` di file yang merakit prompt AI
// harus memakai BENTUK FUNGSI (`() => nilai`) atau literal tanpa interpolasi
// sebagai pengganti. String biasa sebagai argumen kedua membuat "$&", "$`", dan
// "$'" pada teks pengguna ditafsirkan sebagai pola pengganti.

const PROMPT_SOURCE_FILES = ["src/lib/ai/adapter.ts", ...collectRouteFiles("src/app/api")];

// Pengecualian yang masih terbuka: sudah diketahui, tapi perbaikannya di luar
// lingkup file yang boleh disentuh pada putaran ini. Kalau sudah diperbaiki,
// entri ini harus dihapus — test "tidak ada pengecualian yang basi" gagal
// sampai dihapus, jadi daftar ini tidak bisa lapuk diam-diam.
const KNOWN_UNFIXED: Record<string, number> = {
  "src/app/api/cv-documents/create/route.ts": 2,
};

type Finding = { line: number; call: string };

function collectRouteFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectRouteFiles(full));
    // Separator dinormalkan supaya nama file yang tampil di kegagalan test
    // sama dengan kunci daftar pengecualian, apa pun sistem operasinya.
    else if (entry === "route.ts") out.push(full.split(/[\\/]/).join("/"));
  }
  return out;
}

function skipQuoted(src: string, start: number): number {
  const quote = src[start];
  let i = start + 1;
  while (i < src.length) {
    if (src[i] === "\\") {
      i += 2;
      continue;
    }
    if (src[i] === quote) return i + 1;
    i++;
  }
  return src.length;
}

function skipRegex(src: string, start: number): number {
  let i = start + 1;
  let inClass = false;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (inClass) {
      if (c === "]") inClass = false;
      i++;
      continue;
    }
    if (c === "[") {
      inClass = true;
      i++;
      continue;
    }
    if (c === "/") {
      i++;
      while (i < src.length && /[a-z]/.test(src[i])) i++;
      return i;
    }
    if (c === "\n") return start + 1;
    i++;
  }
  return src.length;
}

// Pembagian atau regex? Heuristik standa: `/` memulai regex kalau karakter
// kode sebelumnya tidak bisa mengakhiri nilai.
function isRegexStart(src: string, at: number): boolean {
  for (let i = at - 1; i >= 0; i--) {
    const c = src[i];
    if (/\s/.test(c)) continue;
    return "(,=:[!&|?{};+-*%<>~^".includes(c);
  }
  return true;
}

type Token = { raw: string; end: number };

// Baca satu argumen: literal string, regex literal, atau ekspresi bebas
// (identifier, operator, kurung). Berhenti di koma atau tutup kurung di level
// atas. String di dalamnya dilewati utuh supaya `.replace(` di dalam literal
// tidak ikut terhitung.
function readArg(src: string, start: number): Token | null {
  let i = start;
  while (i < src.length && /\s/.test(src[i])) i++;
  const first = src[i];

  if (first === '"' || first === "'" || first === "`") {
    const end = skipQuoted(src, i);
    return { raw: src.slice(i, end), end };
  }
  if (first === "/" && isRegexStart(src, i)) {
    const end = skipRegex(src, i);
    return { raw: src.slice(i, end), end };
  }

  let depth = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "(" || c === "[" || c === "{") {
      depth++;
      i++;
      continue;
    }
    if (c === ")" || c === "]" || c === "}") {
      // Kurung pembuka fungsi panah (`() => nilai`) belum selesai dibaca.
      if (depth === 0) break;
      depth--;
      i++;
      continue;
    }
    if (c === ";" || (c === "," && depth === 0)) break;
    if (c === "\n" && depth === 0) {
      // Baris lanjutan sah kalau baris berikutnya masih ekspresi, bukan
      // pernyataan baru.
      const rest = src.slice(i).trimStart();
      if (!/^(?:\.|\?|:|\+|-|\*|%|&&|\|\||\?\?|\)|,|})/.test(rest)) break;
    }
    i++;
  }
  if (i === start) return null;
  return { raw: src.slice(start, i).trim(), end: i };
}

function isSafeReplacement(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  // Literal string apa adanya. Interpolasi template tetap-danger karena
  // isinya bisa berisi "$&" dari pengguna.
  if (/^(['"`])[\s\S]*\1$/.test(t) && !/\$\{/.test(t)) return true;
  if (/^(?:function\b|\([^()]*\)\s*(?::[^=<>]*)?=>|\w+\s*=>|async\b)/.test(t)) return true;
  return /^-?\d+(?:\.\d+)?$/.test(t) || /^(?:true|false|null|undefined)$/.test(t);
}

function scan(src: string): Finding[] {
  const findings: Finding[] = [];
  let i = 0;

  while (i < src.length) {
    const c = src[i];

    if (c === "/" && src[i + 1] === "/") {
      const nl = src.indexOf("\n", i);
      i = nl === -1 ? src.length : nl;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? src.length : end + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      i = skipQuoted(src, i);
      continue;
    }
    if (c === "/" && isRegexStart(src, i)) {
      i = skipRegex(src, i);
      continue;
    }

    if (src.startsWith(".replace(", i)) {
      const open = i + ".replace(".length;
      const first = readArg(src, open);
      let cursor = open;
      if (first) {
        cursor = first.end;
        while (cursor < src.length && /\s/.test(src[cursor])) cursor++;
        if (src[cursor] === ",") {
          const second = readArg(src, cursor + 1);
          if (second) {
            if (!isSafeReplacement(second.raw)) {
              findings.push({
                line: src.slice(0, i).split("\n").length,
                call: src.slice(i, second.end + 1).replace(/\s+/g, " ").trim(),
              });
            }
            cursor = Math.max(second.end, cursor + 1);
          }
        }
      }
      i = Math.max(cursor, i + 1);
      continue;
    }

    i++;
  }

  return findings;
}

function scanAll(): Record<string, Finding[]> {
  const out: Record<string, Finding[]> = {};
  for (const file of PROMPT_SOURCE_FILES) {
    const found = scan(readFileSync(file, "utf8"));
    if (found.length > 0) out[file] = found;
  }
  return out;
}

describe("keamanan penyuntikan teks pengguna ke prompt AI", () => {
  it("scanner benar-benar menangkap pola berbahaya", () => {
    // Penjaga untuk test-nya sendiri: kalau scanner ini diam-diam rusak, test
    // utama akan hijau tanpa alasan.
    const sample = [
      "const a = template.replace('{{CV_TEXT}}', () => cv);",
      "const b = template.replace('{{CV_TEXT}}', 'literal polos');",
      "const c = template.replace('{{CV_TEXT}}', cv);",
      "const d = template.replace(/\\{\\{BULLET_MAX\\}\\}/g, useReasoner ? '5' : '3');",
      "const e = template.replace(/x/, userText);",
      "// template.replace('{{CV_TEXT}}', cv) di komentar bukan kode",
      "const f = tpl.replace(/[\\\\%_]/g, (ch) => '\\\\' + ch);",
    ].join("\n");

    expect(scan(sample).map((f) => f.line)).toEqual([3, 4, 5]);
  });

  it("tidak ada penyuntingan string biasa di file prompt AI", () => {
    const found = scanAll();
    const violations: string[] = [];
    for (const [file, items] of Object.entries(found)) {
      const tolerated = KNOWN_UNFIXED[file] ?? 0;
      items.slice(tolerated).forEach((f) => violations.push(`${file}:${f.line} → ${f.call}`));
    }

    expect(violations).toEqual([]);
  });

  it("daftar pengecualian yang basi langsung dibersihkan", () => {
    const found = scanAll();

    const stale = Object.entries(KNOWN_UNFIXED)
      .filter(([file, tolerated]) => (found[file]?.length ?? 0) !== tolerated)
      .map(([file]) => file);

    expect(stale).toEqual([]);
  });
});