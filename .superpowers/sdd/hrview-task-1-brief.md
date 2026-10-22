# Brief Task 1

Sumber: `docs/superpowers/plans/2026-10-18-checker-hr-point-of-view.md` (bagian Task 1)

Semua nilai, nama file, dan cuplikan kode di bawah diambil langsung dari plan.
Jadikan isi brief ini acuan requirements; jangan mengarang nilai lain.

### Task 1: Perbaiki penanda CV/JD yang panting

**Files:**
- Modify: `src/lib/ai/prompts/shared.ts`
- Modify: `src/lib/ai/adapter.ts:94-107`
- Modify: `src/app/api/checker/analyze/route.ts:206`
- Test: `src/__tests__/ai-prompt-markers.test.ts`

**Interfaces:**
- Consumes: tidak ada
- Produces:
  - `PROMPT_MARKERS: { cv: string; jd: string }` dari `@/lib/ai/prompts/shared`
  - `splitCvJd(data: string): { cv: string; jd: string }` diekspor dari `@/lib/ai/adapter` supaya perilaku pemisahan bisa diuji langsung, bukan diuji lewat salinan logika di dalam test

**Konteks.** `adapter.ts:96` mencari penanda `"=== JOB DESCRIPTION ==="`, sementara route menulis `"=== JOB DESCRIPTION TARGET ==="`. Karena `indexOf` mengembalikan `-1`, `{{CV_TEXT}}` diisi seluruh user prompt (termasuk isi JD) dan `{{JD_TEXT}}` kosong � padahal `analysis-v4.ts:344` minta keduanya terpisah.

**Kenapa tidak langsung ganti konstantanya.** Adapter dipakai bersama banyak prompt. Kalau dipaksa cuma mengenali satu penanda, pemanggil lain ikut rusak. Jadi penandanya dipindah ke satu tempat dan adapter menerima keduanya.

- [ ] **Step 1: Tulis test yang gagal**

Buat `src/__tests__/ai-prompt-markers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PROMPT_MARKERS } from "@/lib/ai/prompts/shared";
import { splitCvJd } from "@/lib/ai/adapter";

describe("penanda blok CV dan JD", () => {
  it("adapter dan route memakai penanda yang sama", () => {
    // Sumber-drift ini pernah terjadi: adapter cari "=== JOB DESCRIPTION ==="
    // sementara route nulis "=== JOB DESCRIPTION TARGET ===", sehingga
    // {{JD_TEXT}} terkirim kosong ke model.
    const adapter = readFileSync("src/lib/ai/adapter.ts", "utf8");
    const route = readFileSync("src/app/api/checker/analyze/route.ts", "utf8");

    expect(adapter).toContain("PROMPT_MARKERS");
    expect(route).toContain("PROMPT_MARKERS");
    // Tidak boleh ada penanda yang ditulis manual di kedua file.
    expect(adapter).not.toContain('"=== JOB DESCRIPTION ==="');
    expect(route).not.toContain('"=== JOB DESCRIPTION TARGET ==="');
  });

  it("penanda JD yang dipakai route persis sama dengan yang dicari adapter", () => {
    const route = readFileSync("src/app/api/checker/analyze/route.ts", "utf8");
    expect(route).toContain("PROMPT_MARKERS.jd");
    expect(PROMPT_MARKERS.jd).toBe("=== JOB DESCRIPTION TARGET ===");
    expect(PROMPT_MARKERS.cv).toBe("=== CV KANDIDAT ===");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/ai-prompt-markers.test.ts --reporter=dot`
Expected: FAIL � `PROMPT_MARKERS` belum ada di `shared.ts`.

- [ ] **Step 3: Tambahkan `PROMPT_MARKERS` ke `shared.ts`**

Buka `src/lib/ai/prompts/shared.ts`, tambahkan di bagian atas sebelum export lain:

```ts
/**
 * Penanda blok yang memisahkan CV dari deskripsi lowongan di user prompt.
 *
 * Dipakai oleh route penyusun prompt dan oleh adapter saat menyuntikkan data.
 * Semula masing-masing menulis penanda sendiri dan tidak sama, sehingga
 * {{CV_TEXT}} berisi seluruh prompt dan {{JD_TEXT}} kosong.
 */
export const PROMPT_MARKERS = {
  cv: "=== CV KANDIDAT ===",
  jd: "=== JOB DESCRIPTION TARGET ===",
} as const;
```

- [ ] **Step 4: Ubah `injectInputData` di adapter**

Ganti blok `injectInputData` (sekitar baris 94-107) dengan:

```ts
/**
 * Pisahkan CV dari deskripsi lowongan di user prompt.
 *
 * Dua penanda diterima supaya prompt yang ditulis sebelum konstanta ini ada
 * tetap jalan. Yang dipakai adalah penanda yang muncul lebih dulu.
 *
 * Diekspor supaya pemisahan ini bisa diuji langsung, bukan lewat salinan
 * logika di dalam file test.
 */
export function splitCvJd(data: string): { cv: string; jd: string } {
  const jdIndex = data.indexOf(PROMPT_MARKERS.jd);
  const legacyJdIndex = data.indexOf("=== JOB DESCRIPTION ===");
  const cut =
    jdIndex === -1 ? legacyJdIndex : legacyJdIndex === -1 ? jdIndex : Math.min(jdIndex, legacyJdIndex);

  const cvText = sanitizeText(cut === -1 ? data : data.slice(0, cut).trim());
  const jdText = sanitizeText(cut === -1 ? "" : data.slice(cut).trim());

  // Buang penanda dan baris kategori posisi, supaya yang masuk ke {{CV_TEXT}}
  // benar-benar isi CV saja.
  const cvOnly = cvText
    .replace(/^=== ROLE CATEGORY:[^\\n]*\\n+/, "")
    .split(PROMPT_MARKERS.cv)
    .pop()!
    .trim();

  return { cv: cvOnly, jd: jdText };
}

function injectInputData(prompt: string, data: string): string {
  const { cv, jd } = splitCvJd(data);

  return prompt
    .replace("{{INPUT_DATA}}", data)
    .replace("{{CV_TEXT}}", cv)
    .replace("{{JD_TEXT}}", jd)
    .replace("{{PROFILE_DATA}}", data);
}
```

Tambahkan import di bagian atas `adapter.ts`:

```ts
import { PROMPT_MARKERS } from "@/lib/ai/prompts/shared";
```

- [ ] **Step 5: Ubah route agar memakai penanda yang sama**

Di `src/app/api/checker/analyze/route.ts`, ganti baris `userPrompt` (sekitar baris 206) dengan:

```ts
      userPrompt: `=== ROLE CATEGORY: ${roleCat} ===\n\n${PROMPT_MARKERS.cv}\n${extractedText}\n\n${PROMPT_MARKERS.jd}\n${jd || (outputLang === "en" ? "No job description provided." : "Tidak ada deskripsi pekerjaan.")}`,
```

Tambahkan import di `route.ts`:

```ts
import { PROMPT_MARKERS } from "@/lib/ai/prompts/shared";
```

- [ ] **Step 6: Tambahkan test perilaku split**

Tambahkan ke `src/__tests__/ai-prompt-markers.test.ts`:

```ts
describe("pemisahan CV dan JD di prompt", () => {
  // Menguji kode asli, bukan salinan logika di dalam test. Kalau logikanya
  // dicopy ke sini, testnya tetap hijau walau fungsi aslinya rusak.
  it("deskripsi lowongan tidak ikut masuk ke bagian CV", () => {
    const data = [
      "=== ROLE CATEGORY: tech ===",
      "",
      PROMPT_MARKERS.cv,
      "Python, SQL, 3 tahun",
      "",
      PROMPT_MARKERS.jd,
      "Butuh engineer yang paham AWS",
    ].join("\n");
    const { cv, jd } = splitCvJd(data);
    expect(cv).toBe("Python, SQL, 3 tahun");
    expect(jd).toBe("Butuh engineer yang paham AWS");
  });

  it("prompt lama dengan penanda lawas tetap terpisah", () => {
    const data = ["Python, SQL", "", "=== JOB DESCRIPTION ===", "Butuh AWS"].join("\n");
    const { cv, jd } = splitCvJd(data);
    expect(cv).toBe("Python, SQL");
    expect(jd).toBe("Butuh AWS");
  });

  it("data tanpa penanda apa pun tidak dihapus", () => {
    const { cv, jd } = splitCvJd("hanya teks bebas");
    expect(cv).toBe("hanya teks bebas");
    expect(jd).toBe("");
  });
});
```

- [ ] **Step 7: Jalankan test**

Run: `npx vitest run src/__tests__/ai-prompt-markers.test.ts --reporter=dot`
Expected: PASS (7 test).

- [ ] **Step 8: Typecheck dan jalankan suite penuh**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tidak ada output.

Run: `npx vitest run --reporter=dot`
Expected: semua hijau, tidak ada test lama yang gagal.

- [ ] **Step 9: Commit**

```bash
git add src/lib/ai/prompts/shared.ts src/lib/ai/adapter.ts src/app/api/checker/analyze/route.ts src/__tests__/ai-prompt-markers.test.ts
git commit -m "fix(prompt): pisahkan CV dan deskripsi lowongan dengan benar

injectInputData mencari penanda '=== JOB DESCRIPTION ===' sementara route
menulis '=== JOB DESCRIPTION TARGET ==='. Karena indexOf mengembalikan -1,
{{CV_TEXT}} diisi seluruh user prompt termasuk isi lowongan, dan {{JD_TEXT}}
dikirim kosong � padahal prompt v4 minta keduanya terpisah.

Penandanya dipindah ke satu tempat supaya tidak bisa lagi berbeda antara
route dan adapter, dan adapter tetap menerima penanda lama supaya pemanggil
lain tidak ikut rusak."
```

---

