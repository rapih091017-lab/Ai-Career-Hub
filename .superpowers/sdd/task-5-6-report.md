# Batch A — Task 5 (Kontras AA) + Task 6 (Font) — dikerjakan controller inline

Subagent dua kali dibatalkan oleh harness; controller mengerjakan langsung.

## Task 5 — Kontras WCAG AA
- Test rumus WCAG inline (portfolio-contrast.test.ts, 12 test): teks/secondary/muted/primary vs bg >=4.5, onPrimary vs primary >=4.5, focusRing >=3, semua sectionColors.primary vs bg >=4.5. RED awal: 9 gagal (sesuai prediksi audit).
- Hasil perhitungan: irisan putih-di-primary + primary-vs-bg KOSONG untuk tema gelap — menambah token additive onPrimary (glass = tinta #12121F, brutal/luxe = putih) lalu mengganti 12 situs color:"#fff"-di-primary di section.
- Geser nilai (hue dijaga, margin >=4.6): glass #7C5CFC->#8365FC, brutal #FF3366->#E40039, luxe #B8863C->#936B30.
- sectionColors diperdalam: #FFCC00->#8A6400, #33CCFF->#0E7490, #3366FF->#1D4ED8, #8FBC8F->#4C7E4C, #D4A574->#8A6442, #8C7A6A(textMuted)->#6E5F52, dll.
- Test hex lama diperbarui (portfolio-document: #3366FF/#FF3366 -> #1D4ED8/#E40039).
- Verifikasi: contrast 12/12, suite 455 hijau saat itu.

## Task 6 — Font
- Glass fontUrl cdnfonts -> Google Geist (URL diverifikasi 200); export preconnect sudah Google dan tak lagi menabrak fontUrl.
- ThemeFonts.tsx dipasang di preview pada KEDUA cabang render (print + utama).
- Stack fallback eksplisit per tema: ui-sans-serif, system-ui (Luxe display tetap serif).
- DEVASI BRIEF: BuilderEditor TIDAK dipasang — builder ternyata akordeon form murni tanpa kanvas portofolio (asumsi plan salah); font tema tidak dibutuhkan di sana. Test disesuaikan.
- Test font: 3 test baru di portfolio-theme-rules.test.ts.

## Gate akhir batch
npm test 459/459 | npx tsc --noEmit exit 0 | lint 0 errors (28 warning baseline) | cdnfonts 0 (hanya guard string).
Commits: 31cb6c1 (T5), menyusul commit T6.

## Concern
- focusRing brutal/luxe masih hex lama (#FF3366/#B8863C) — lolos >=3.0, sinkronisasi dengan primary baru ditunda (ledger T1).
- colors.accent brutal #FFCC00 tidak masuk pasangan uji (hanya .primary yang diuji sesuai spek).
