# Report — I3, I5, M10

Status: **SELESAI** — semua temuan diperbaiki, TDD diikuti untuk I3 & I5, seluruh verifikasi bersih.

## Verifikasi (final tree)

| Command | Hasil |
|---|---|
| `npx vitest run --reporter=dot` | 79 file pass, 1 skip; 935 test pass, 1 skip; exit 0 |
| `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| `npm run build` | exit 0 |

Test baru: `checker-breakdown-parity.test.ts` (2 test), `checker-prompt-strengths.test.ts` (3 test).

## Commits

1. `4c2357a` — fix(checker): penjaga breakdown hasil segar disamakan dengan hasil tersimpan
   - `src/app/checker/page.tsx`, `src/__tests__/checker-breakdown-parity.test.ts`
2. `b55a155` — fix(checker): prompt v4 mewajibkan strength berbentuk objek lengkap kutipan CV
   - `src/lib/ai/prompts/analysis-v4.ts`, `src/__tests__/checker-prompt-strengths.test.ts`
3. `fd4fb32` — fix(checker): pulihkan karakter banner komentar types yang rusak
   - `src/components/checker/types.ts`

Setiap commit diverifikasi terpisah: test terkait + `tsc --noEmit` dijalankan setelah commit masing-masing, exit 0. Full suite/build dijalankan di tree final (ketiga perubahan sudah ada).

## I3 — paritas guard breakdown

**RED → GREEN (TDD):**
- Test ditulis dulu (`checker-breakdown-parity.test.ts`): baca kedua `page.tsx`, assert 7 guard ada di keduanya. Gagal 1 test: `src/app/checker/page.tsx` — `guard hilang` untuk semua 7 guard (halaman detail lulus; 1 test pass). Gagal karena guard memang tidak ada, bukan typo.
- Guard yang ditambahkan ke `src/app/checker/page.tsx` (persis meniru `[id]/page.tsx`):
  1. `breakdown && Object.keys(breakdown).length > 0 && (` — breakdown kosong total → blok disembunyikan
  2-5. `breakdown.summary/experience/skills/education/format_ats && (` — section hilang tidak dirender
  6. `breakdown.education.relevance ? [breakdown.education.relevance] : []` — relevance kosong tidak jadi bullet ISSUES kosong
- Verifikasi side-by-side via ekstraksi blok "PER-SECTION BREAKDOWN" kedua file: struktur guard identik; satu-satunya beda token adalah kunci i18n (`checker.sec-*` vs `checker.detail.section-*`), yang memang disengaja (di-pinned `checker-hrview-wiring.test.ts`).
- Test paritas: baca sumber kedua halaman, assert daftar guard yang sama. Bukan shared helper — perbedaan kunci i18n antar halaman membuat helper butuh props label per halaman, sedangkan test sumber menangkap guard apa pun yang ditambah/dihapus.

## I5 — bentuk `ats_prediction.strengths` di prompt

**RED → GREEN (TDD):**
- Test dulu (`checker-prompt-strengths.test.ts`): 3 test gagal semua — blok output memuat `"strengths": string[]`, contoh kerja pakai string polos, aturan verbatim tidak menyebut strengths. Gagal karena prompt memang bentuk lama.
- Perubahan `src/lib/ai/prompts/analysis-v4.ts`:
  1. Blok SKEMA OUTPUT: `"strengths": [{ "text": string, "source_excerpt": string | null }]`
  2. Contoh kerja: dua entri strengths jadi objek, satu `source_excerpt` null, satu verbatim `"Membangun fitur login menggunakan React dan Node.js"` (substring CV yang memang muncul di contoh `bullet_review`)
  3. ATURAN KERAS #6: `source_excerpt pada risk_factors, strengths, dan issues: ... substring PERSIS ...` — model tahu verbatim berlaku untuk strengths juga. Verification (e) sudah generik ("tiap source_excerpt"), tidak diubah.
- `schemas.ts` TIDAK disentuh — union string/objek tetap untuk hasil lama (bukan pelemahan validasi). Fixture objek di `checker-hr-point-of-view-ui.test.tsx` kini mewakili bentuk yang benar-benar diproduksi.

## M10 — karakter banner komentar rusak

- Base: `a6ad866` (commit terakhir yang bersih; kerusakan masuk lewat `7e6d7d7`).
- 3 baris dikembalikan persis ke base: L3 `/* ── Types ── */`, L37 `/* ── Severity badge ... ── */`, L227 `/* ── Helpers ── */`.
- `git diff` = +3/−3, hanya 3 baris itu. Line ending CRLF file utuh (279/279 baris CRLF, sama seperti sebelumnya).

## Constraints check

- Interface/mounting panel HR: tidak disentuh.
- `schemas.ts`: tidak diubah sama sekali.
- String user-facing baru: tidak ada (guard + komentar + konten prompt; prompt bukan UI string; tanpa tambahan key i18n).
- Komentar baru berbahasa Indonesia, menjelaskan *why*.

## Concerns

1. Heading blok breakdown tetap beda antar halaman di bahasa **en** ("Scores per Section" vs "Section Breakdown", i18n `checker.sec-title` vs `checker.detail.section-breakdown`) — di luar tiga guard yang diminta I3; tidak disentuh karena mengubah satu sisi = mengubah copy yang sudah ada di dua locale.
2. Contoh kerja di prompt tumbuh ~130 karakter output (bentuk objek); aturan #6 tumbuh 1 baris. Asumsi "adds no tokens" dari temuan hampir nol, bukan tepat nol.
3. Test paritas berbasis baca-sumber (konvensi repo, sama seperti `checker-hrview-wiring.test.ts`) — menjamin guard ada, bukan perilaku render runtime. Perilaku runtime per guard dicakup secara tidak langsung oleh bentuk JSX yang sama persis.
