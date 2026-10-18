import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

// Scan sumber, bukan runtime: bug ini tidak muncul saat route dipanggil, tapi
// saat teks pengguna berisi "$&" tersisip ke prompt tanpa error. Penjaga paling
// murah adalah memeriksa bentuk kodenya sendiri.
//
// Aturan: setiap `.replace(pola, pengganti)` di file yang merakit prompt AI
// harus memakai BENTUK FUNGSI (`() => nilai`) atau literal tanpa interpolasi
// sebagai pengganti. String biasa sebagai argumen kedua membuat "$&", "$`", dan
// "$'" pada teks pengguna ditafsirkan sebagai pola pengganti.
//
// Bentuk kodenya dibaca lewat AST TypeScript, bukan lewat tokenizer sendiri.
// Parser mini pernah salah pada tiga kasus nyata: `.replace` di dalam template
// literal multi-baris (backtick tidak melacak `${...}`), `.replaceAll` yang
// punya semantik "$&" persis sama tapi tidak dikenali, dan argumen regex
// diikuti akses properti (`/(X)/.source`) yang bikin parser berhenti sebelum
// membaca argumen kedua. AST tidak punya heuristic apa pun untuk ketiganya.

const PROMPT_SOURCE_FILES = ["src/lib/ai/adapter.ts", ...collectRouteFiles("src/app/api")];

// Pengecualian yang masih terbuka: sudah diketahui, tapi perbaikannya di luar
// lingkup file yang boleh disentuh pada putaran ini. Kuncinya teks panggilan
// yang tepat, bukan jumlah: kalau jumlah yang jadi kunci, memperbaiki satu
// pelanggaran lama sambil menambah yang baru di file yang sama tetap hijau.
// Test "daftar pengecualian yang basi langsung dibersihkan" gagal begitu
// panggilan ini hilang, jadi daftar ini tidak bisa lapuk diam-diam.
const KNOWN_UNFIXED: Record<string, string[]> = {
  "src/app/api/cv-documents/create/route.ts": [
    '.replace("{{CURRENT_DATE}}", todayDate)',
    '.replace("{{TARGET_LANGUAGE}}", targetLang)',
  ],
};

type Finding = { line: number; call: string };

const CALL_TEXT_LIMIT = 120;

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

// Bentuk pengganti yang tidak mungkin menafsirkan "$&" dari data pengguna:
// fungsi, atau literal yang isinya sudah pasti sebelum runtime.
function isSafeReplacement(node: ts.Expression): boolean {
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return true;
  // Template literal dengan `${...}` sengaja tidak aman: isinya bisa berisi "$&".
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return true;
  if (ts.isNumericLiteral(node)) return true;
  if (ts.isIdentifier(node) && ["true", "false", "null", "undefined"].includes(node.text)) return true;
  return [
    ts.SyntaxKind.TrueKeyword,
    ts.SyntaxKind.FalseKeyword,
    ts.SyntaxKind.NullKeyword,
  ].includes(node.kind);
}

function isReplaceCallee(expr: ts.Expression): boolean {
  if (!ts.isPropertyAccessExpression(expr)) return false;
  return expr.name.text === "replace" || expr.name.text === "replaceAll";
}

function scan(file: string, src: string): Finding[] {
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const findings: Finding[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && isReplaceCallee(node.expression)) {
      const replacement = node.arguments[1];
      if (replacement && !isSafeReplacement(replacement)) {
        const call = node.getText(sf).replace(/\s+/g, " ").trim();
        findings.push({
          line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
          call: call.length > CALL_TEXT_LIMIT ? `${call.slice(0, CALL_TEXT_LIMIT)}…` : call,
        });
      }
    }
    // Rekursif tanpa batas: `.replace` bersarang di dalam argumen atau di dalam
    // `${...}` template literal tetap ikut ditemukan.
    ts.forEachChild(node, visit);
  };

  visit(sf);
  return findings;
}

function scanAll(): Record<string, Finding[]> {
  const out: Record<string, Finding[]> = {};
  for (const file of PROMPT_SOURCE_FILES) {
    const found = scan(file, readFileSync(file, "utf8"));
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

    expect(scan("sample.ts", sample).map((f) => f.line)).toEqual([3, 4, 5]);
  });

  it("scanner menangkap kasus yang dulu lolos", () => {
    // Tiga kasus yang lolos pada parser mini sebelumnya, plus satu
    // kasus pembagian supaya tidak ada sisa heuristic regex-vs-bagian.
    const sample = [
      // 1. `.replace` di dalam template literal multi-baris: dulu tak terlihat
      // karena backtick tidak melacak `${...}`.
      "const tpl = `isi prompt ${base.replace('{{CV}}', cv)}`;",
      // 2. `replaceAll` punya semantik "$&" yang sama, dulu tidak dikenali.
      "const u = template.replaceAll('{{CV_TEXT}}', cv);",
      // 3. Argumen regex yang diikuti akses properti: dulu parser berhenti
      // sebelum membaca argumen kedua.
      "const v = template.replace(/(X)/.source, userText);",
      // 4. Pembagian, bukan regex: `/` di sini tidak boleh menggeser pembacaan
      //    argumen. Argumen kedua tetap identifier, jadi tetap dilaporkan.
      "const w = (total / 2).toString().replace('1', s);",
      // Bentuk aman di template literal dan replaceAll tetap harus lolos.
      "const x = `isi ${base.replaceAll('{{CV}}', () => cv)}`;",
      "const y = template.replaceAll('{{CV_TEXT}}', 'literal polos');",
    ].join("\n");

    expect(scan("sample.ts", sample).map((f) => f.line)).toEqual([1, 2, 3, 4]);
  });

  it("tidak ada penyuntingan string biasa di file prompt AI", () => {
    const found = scanAll();
    const violations: string[] = [];
    for (const [file, items] of Object.entries(found)) {
      const tolerated = KNOWN_UNFIXED[file] ?? [];
      for (const f of items) {
        if (tolerated.some((needle) => f.call.includes(needle))) continue;
        violations.push(`${file}:${f.line} → ${f.call}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("daftar pengecualian yang basi langsung dibersihkan", () => {
    const found = scanAll();
    const stale: string[] = [];

    for (const [file, needles] of Object.entries(KNOWN_UNFIXED)) {
      const calls = found[file]?.map((f) => f.call) ?? [];
      // Set equality dua arah: tiap entri harus cocok dengan temuan nyata, dan
      // tiap temuan yang ditoleransi harus punya entri — jadi memperbaiki satu
      // pelanggaran lama sambil menambah yang baru di file yang sama tetap gagal.
      for (const needle of needles) {
        if (!calls.some((call) => call.includes(needle))) stale.push(`${file} → tak ada lagi: ${needle}`);
      }
      for (const call of calls) {
        if (!needles.some((n) => call.includes(n))) stale.push(`${file} → tak tertoleransi: ${call}`);
      }
    }

    expect(stale).toEqual([]);
  });
});