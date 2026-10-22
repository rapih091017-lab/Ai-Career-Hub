# Brief Task 6

Sumber: `docs/superpowers/plans/2026-10-18-checker-hr-point-of-view.md` (bagian Task 6)

Semua nilai, nama file, dan cuplikan kode di bawah diambil langsung dari plan.
Jadikan isi brief ini acuan requirements; jangan mengarang nilai lain.

### Task 6: Pasang panel di dua halaman dan pangkas kolom duplikat

**Files:**
- Modify: `src/app/checker/page.tsx` (dekat awal blok hasil, sekitar baris 736-786)
- Modify: `src/app/checker/[id]/page.tsx` (sekitar baris 167-200 dan blok Review oleh AI)
- Test: `src/__tests__/checker-hrview-wiring.test.ts`

**Interfaces:**
- Consumes: `HrPointOfView` (Task 5)
- Produces: tidak ada

**Konteks.** Kolom Kelebihan dan Perlu Diperbaiki di bagian "Review oleh AI" isinya sama dengan kolom kanan dan kiri panel baru. Kalau keduanya dibiarkan, kelemahan yang sama tampil dua kali dalam satu halaman. Yang tersisa hanya `overall_assessment` dan Rekomendasi ATS; judul bagian tidak diubah.

- [ ] **Step 1: Tulis test kontrak yang gagal**

Buat `src/__tests__/checker-hrview-wiring.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("panel sisi HR terpasang di kedua halaman hasil", () => {
  for (const file of ["src/app/checker/page.tsx", "src/app/checker/[id]/page.tsx"]) {
    it(`${file} merender panel Sisi HR sebelum skor`, () => {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("HrPointOfView");
      // Panel harus muncul sebelum blok skor, bukan di bawah.
      expect(source.indexOf("<HrPointOfView")).toBeGreaterThan(-1);
      expect(source.indexOf("<HrPointOfView")).toBeLessThan(source.indexOf("checker.result-title"));
    });

    it(`${file} tidak lagi menampilkan kolom yang isinya sudah ada di panel`, () => {
      const source = readFileSync(file, "utf8");
      // strengths dan areas_for_improvement sudah tampil di panel Sisi HR.
      expect(source).not.toContain("narrativeFeedback?.strengths");
      expect(source).not.toContain("narrativeFeedback?.areas_for_improvement");
    });

    it(`${file} tetap menampilkan ringkasan dan rekomendasi ATS`, () => {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("narrativeFeedback?.overall_assessment");
      expect(source).toContain("narrativeFeedback?.ats_recommendations");
    });
  }
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/checker-hrview-wiring.test.ts --reporter=dot`
Expected: FAIL — `HrPointOfView` belum dirender di kedua halaman.

- [ ] **Step 3: Pasang panel di `/checker`**

Di `src/app/checker/page.tsx`, di dalam blok hasil (setelah `</div>` penutup top bar, sebelum blok skor `checker.result-title`), tambahkan:

```tsx
            <HrPointOfView result={result} />
```

Tambahkan import di bagian atas:

```tsx
import HrPointOfView from "@/components/checker/HrPointOfView";
```

- [ ] **Step 4: Pangkas kolom duplikat di `/checker`**

Di `src/app/checker/page.tsx` sekitar baris 881-914, di dalam `motion.section` "Review oleh AI", hapus **seluruh** pembungkus kisi dua kolom berikut beserta kedua anaknya:

```tsx
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              {narrativeFeedback.strengths.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm select-none">check_circle</span>
                    {t("checker.strengths")}
                  </h3>
                  <ul className="space-y-1.5">
                    {narrativeFeedback.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-green-800 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5 select-none">?</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for improvement */}
              {narrativeFeedback.areas_for_improvement.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm select-none">warning</span>
                    {t("checker.improvements")}
                  </h3>
                  <ul className="space-y-1.5">
                    {narrativeFeedback.areas_for_improvement.map((a, i) => (
                      <li key={i} className="text-xs text-red-800 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5 select-none">?</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
```

Setelah dihapus, urutan di dalam `motion.section` jadi: `<h2>` "Review oleh AI" — blok `overall_assessment` — blok Rekomendasi ATS (`checker.ats-recs`). Ketiganya tidak boleh disentuh.

- [ ] **Step 5: Pasang panel di `/checker/[id]`**

Di `src/app/checker/[id]/page.tsx`, di dalam blok hasil sebelum judul, tambahkan:

```tsx
        <HrPointOfView result={result} />
```

Tambahkan import:

```tsx
import HrPointOfView from "@/components/checker/HrPointOfView";
```

Pastikan `result` di halaman ini adalah state hasil analisis yang sudah di-map lewat `analysisFromFullResult` (Task 3 Step 6), sehingga `meta` dan `atsPredictionDetail`-nya sudah ada.

Gunakan prefix kunci `checker.detail.hrview-*`, jadi teruskan prefix-nya:

```tsx
        <HrPointOfView result={result} keyPrefix="checker.detail." />
```

Prop `keyPrefix` sudah disiapkan di Task 5 Step 4, jadi tidak ada perubahan komponen lagi di task ini.

- [ ] **Step 6: Pangkas kolom duplikat di `/checker/[id]`**

Di `src/app/checker/[id]/page.tsx` sekitar baris 255-283, hapus pembungkus `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">` beserta dua anaknya — kolom `t("checker.detail.strengths")` dan kolom `t("checker.detail.improve")`. Struktur bloknya sama persis dengan di `/checker`, hanya nama kuncinya berbeda.

Yang tetap ada setelah penghapusan: judul bagian review, blok `checker.detail.overall-assessment`, dan blok rekomendasi ATS.

- [ ] **Step 7: Jalankan test**

Run: `npx vitest run src/__tests__/checker-hrview-wiring.test.ts --reporter=dot`
Expected: PASS (6 test).

- [ ] **Step 8: Typecheck, suite penuh, dan build**

Run: `npx tsc --noEmit -p tsconfig.json` — tidak ada output.
Run: `npx vitest run --reporter=dot` — semua hijau.
Run: `npm run build` — harus selesai dengan "Compiled successfully".

- [ ] **Step 9: Commit**

```bash
git add "src/app/checker/page.tsx" "src/app/checker/[id]/page.tsx" src/components/checker/HrPointOfView.tsx src/__tests__/checker-hrview-wiring.test.ts
git commit -m "feat(checker): pasang panel Sisi HR dan pangkas kolom yang sama

Panelnya muncul paling atas di /checker dan /checker/[id] supaya hasil baru
dan hasil tersimpan sama persis.

Kolom Kelebihan dan Perlu Diperbaiki di Review oleh AI dihapus karena
isinya sudah tampil di panel ? kalau dibiarkan, kelemahan yang sama muncul
dua kali dalam satu halaman. Overall assessment dan rekomendasi ATS tetap
ada, judul bagian tidak diubah."
```

---

