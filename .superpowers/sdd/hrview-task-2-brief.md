# Brief Task 2

Sumber: `docs/superpowers/plans/2026-10-18-checker-hr-point-of-view.md` (bagian Task 2)

Semua nilai, nama file, dan cuplikan kode di bawah diambil langsung dari plan.
Jadikan isi brief ini acuan requirements; jangan mengarang nilai lain.

### Task 2: Kembalikan tabel GRADE yang hilang dari prompt v4

**Files:**
- Modify: `src/lib/ai/prompts/analysis-v4.ts:43-46`, `:199-205`
- Test: `src/__tests__/checker-grade-prompt.test.ts`

**Interfaces:**
- Consumes: tidak ada
- Produces: tidak ada (perilaku AI saja)

**Konteks.** `analysis-v4.ts:45` menyuruh AI mengikuti "tabel GRADE", dan `:201` menyebutnya lagi ? tapi tabel itu tidak pernah ada di file tersebut. Ambangnya hanya ada di `analysis-v3.ts` yang sudah tidak dipakai. Artinya grade yang tampil ke user sedang ditebak AI.

Angka diambil dari v3 supaya hasil lama tidak berubah artinya: 85?100 A, 70?84 B, 50?69 C, 0?49 D.

- [ ] **Step 1: Tulis test yang gagal**

Buat `src/__tests__/checker-grade-prompt.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ANALYSIS_PROMPT_V4 } from "@/lib/ai/prompts/analysis-v4";

describe("tabel GRADE di prompt v4", () => {
  it("prompt memuat ambang grade lengkap", () => {
    // Prompt menyuruh AI ikutin "tabel GRADE", jadi tabelnya wajib ada.
    // Tanpa ini grade yang tampil ke user hanya tebakan model.
    expect(ANALYSIS_PROMPT_V4).toContain("85-100");
    expect(ANALYSIS_PROMPT_V4).toContain("70-84");
    expect(ANALYSIS_PROMPT_V4).toContain("50-69");
    expect(ANALYSIS_PROMPT_V4).toContain("0-49");
  });

  it("setiap ambang disebut dengan huruf grade yang benar", () => {
    const gradeTable = ANALYSIS_PROMPT_V4.match(/GRADE[\s\S]{0,600}/g)?.join("\n") ?? "";
    expect(gradeTable).toMatch(/85-100[^\n]*\bA\b/);
    expect(gradeTable).toMatch(/70-84[^\n]*\bB\b/);
    expect(gradeTable).toMatch(/50-69[^\n]*\bC\b/);
    expect(gradeTable).toMatch(/0-49[^\n]*\bD\b/);
  });

  it("grade wajib konsisten dengan overall_score", () => {
    expect(ANALYSIS_PROMPT_V4).toMatch(/grade[^\n]*(Wajib|wajib|MUST|must)[^\n]*overall_score/);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/checker-grade-prompt.test.ts --reporter=dot`
Expected: FAIL ? tabel GRADE tidak ada di prompt.

- [ ] **Step 3: Tambahkan tabel GRADE**

Di `src/lib/ai/prompts/analysis-v4.ts`, cari aturan nomor 5 (sekitar baris 45). Ganti baris itu menjadi:

```ts
5. grade WAJIB mengikuti threshold overall_score di tabel GRADE ini, tanpa kecuali:
   - 85-100: A
   - 70-84: B
   - 50-69: C
   - 0-49: D
   Tidak boleh menebak angka lain, dan tidak boleh memberi grade di luar A/B/C/D.
```

Lalu cari bagian validasi (sekitar baris 201) yang berbunyi `(b) grade sesuai threshold tabel GRADE`, dan ganti menjadi:

```ts
(b) grade WAJIB sama dengan hasil tabel GRADE di atas untuk overall_score yang kamu tulis. Kalau tidak cocok, angka itu salah.
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/checker-grade-prompt.test.ts --reporter=dot`
Expected: PASS (3 test).

- [ ] **Step 5: Typecheck dan suite penuh**

Run: `npx tsc --noEmit -p tsconfig.json` ? tidak ada output.
Run: `npx vitest run --reporter=dot` ? semua hijau.

- [ ] **Step 5b: Buat template prompt ikut memakai `PROMPT_MARKERS`**

Di `src/lib/ai/prompts/analysis-v4.ts` sekitar baris 341-345, blok input masih menulis penanda sebagai literal:

```
=== CV KANDIDAT ===
{{CV_TEXT}}

=== JOB DESCRIPTION TARGET ===
{{JD_TEXT}}
```

Ganti literal itu dengan `${PROMPT_MARKERS.cv}` dan `${PROMPT_MARKERS.jd}`. Ini menutup sumber kebenaran kedua: selama template masih menulis literal, mengubah `PROMPT_MARKERS` akan memindahkan route dan adapter tapi template sistem diam-diam memakai header lama.

Tambahkan import di `analysis-v4.ts` kalau belum ada, dan tambahkan assertion di `src/__tests__/checker-grade-prompt.test.ts` atau test marker yang sudah ada bahwa `analysis-v4.ts` mengimpor `PROMPT_MARKERS` dan tidak lagi memuat literal penanda itu sebagai string.

- [ ] **Step 5c: Cegah `cv` merusak template saat disisipkan**

Di `src/lib/ai/adapter.ts`, `injectInputData` memakai `prompt.replace("{{CV_TEXT}}", cv)`. `String.prototype.replace` dengan string pengganti menafsirkan `$&`, `` $` ``, dan `$'` sebagai bagian dari pola. CV yang memuat `$&` � wajar terjadi pada teks tentang regex atau shell � akan merusak isi `{{CV_TEXT}}` di prompt.

Ganti penyisipan yang memakai data pengguna agar memakai fungsi pengembalian:

```ts
  return prompt
    .replace("{{INPUT_DATA}}", () => data)
    .replace("{{CV_TEXT}}", () => cv)
    .replace("{{JD_TEXT}}", () => jd)
    .replace("{{PROFILE_DATA}}", () => data);
```

Tambahkan test yang membuktikan CV berisi `$&` masuk utuh ke `{{CV_TEXT}}`. Karena `injectInputData` tidak diekspor, test ini exercised lewat `splitCvJd` tidak cukup � ekspor `injectInputData` juga supaya bisa diuji langsung.
- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/prompts/analysis-v4.ts src/lib/ai/adapter.ts src/__tests__/checker-grade-prompt.test.ts src/__tests__/ai-prompt-markers.test.ts
git commit -m "fix(prompt): kembalikan tabel GRADE yang hilang dari prompt v4

Prompt menyuruh AI mengikuti 'tabel GRADE', tapi tabel itu tidak pernah ada
di file ini. Ambangnya hanya ada di prompt v3 yang sudah tidak dipakai,
jadi grade yang tampil ke pengguna selama ini ditebak model.

Ambang ditambahkan dengan angka yang sama seperti v3 supaya hasil lama
tidak berubah artinya."
```

---

