# Task 2 Report — Migrasi token 6 section pertama (Layer A)

Status: **SELESAI**. Layer A hijau untuk keenam file, suite penuh hijau, tsc bersih.

## Komitmen

- Test Layer A di-append ke `src/__tests__/portfolio-theme-rules.test.ts` persis seperti brief
  (imports + `SECTIONS_DIR`/`RENDER_DIR`/`BANNED`/`PENDING_FILES`/`stripAllowed`/`describe` — mekanisme
  `PENDING_FILES` dipertahankan utuh untuk Task 3).
- Enam file section dimigrasi token per token.

## Perintah + output nyata

**Red (setelah test ditulis, sebelum migrasi):**

```
npx vitest run src/__tests__/portfolio-theme-rules.test.ts
 ❯ src/__tests__/portfolio-theme-rules.test.ts (20 tests | 6 failed) 16ms
     × ...sections\AboutSection.tsx bebas literal
     × ...sections\ContactSection.tsx bebas literal
     × ...sections\HeroSection.tsx bebas literal
     × ...sections\ProjectsSection.tsx bebas literal
     × ...sections\SkillsSection.tsx bebas literal
     × ...sections\StatsSection.tsx bebas literal
 Test Files  1 failed (1)
      Tests  6 failed | 14 passed (20)
```

Tiap kegagalan berisi daftar label (contoh AboutSection):
`[ "rounded-*", "borderRadius literal", "boxShadow literal", "inline fontFamily" ]`.
Keenam file Task 2 gagal; 6 file Task 3 lolos via `PENDING_FILES`; 3 file `render/*.tsx` lolos
(`PortfolioDocument.tsx` punya `fontFamily:` diikuti ternary — tidak cocok regex kutip;
`PortfolioPhotoUpload.tsx` pakai `borderRadius: 12` numerik).

**Green (setelah migrasi):**

```
npx vitest run src/__tests__/portfolio-theme-rules.test.ts
 Test Files  1 passed (1)
      Tests  20 passed (20)
```

**Suite penuh:**

```
npm test
 Test Files  25 passed (25)
      Tests  426 passed (426)     # 411 sebelumnya + 15 kasus Layer A
```

**Typecheck:**

```
npx tsc --noEmit
exit=0
```

## Inventaris literal — sebelum → sesudah

Scanner: regex `BANNED` yang sama dengan test (komentar & `#fff`/`#ffffff` di-strip dulu).
Sebelum = output `node .superpowers/sdd/inventory.js` (merah), sesudah = scan ulang → **0 baris untuk keenam file**.

| File | rounded-* | borderRadius literal | boxShadow literal | fontFamily literal | hex 6-digit | Total sebelum | Sesudah |
|---|---|---|---|---|---|---|---|
| HeroSection.tsx | 6 | 7 | 4 | 5 | 0 | 22 | **0** |
| AboutSection.tsx | 4 | 1 | 1 | 2 | 0 | 8 | **0** |
| StatsSection.tsx | 1 | 3 | 1 | 1 | 0 | 6 | **0** |
| ProjectsSection.tsx | 3 | 7 | 2 | 2 | 0 | 14 | **0** |
| SkillsSection.tsx | 4 | 7 | 3 | 1 | 0 | 15 | **0** |
| ContactSection.tsx | 4 | 4 | 1 | 1 | 0 | 10 | **0** |

Literal di luar daftar test tapi wajib ikut migrasi menurut brief (Step 3):

- `backdropFilter: "blur(...)"` ×5 → `theme.blur.card` (About, Stats, Projects, Skills, Contact).
- Kelas bracket yang tidak kena regex tetap dipindah ke token agar sudut konsisten setelah migrasi:
  Stats `rounded-[calc(100px-4px)]` → `style borderRadius: theme.radii.card`,
  Projects `rounded-[1.25rem]` (ghost) → `theme.radii.card`,
  Contact `rounded-[2rem]` (ghost) → `theme.radii.card`.
- Kelas `blur-[80px]`/`blur-[100px]`/`blur-[120px]` (orb dekoratif, filter biasa bukan backdrop) dibiarkan —
  bukan literal terlarang dan bukan `blur(`.

## Penambahan slot token

**Tidak ada.** `types.ts` dan nilai token di `themes.ts` tidak disentuh. Semua literal muat di
`radii.{card,button,pill,image}`, `shadow.card`, `blur.{card,glow}`, `typography.{display,body,eyebrow}`.

## Pilihan substitusi hex

**Tidak ada hex 6-digit** di enam file. Hanya `#fff` (allowlist) dan `rgba(...)` yang tidak dilarang.
`color: "#fff"` pada tombol/brutal badge dibiarkan sesuai allowlist.

## Aturan pemetaan yang dipakai

- Kartu/bezel kontainer → `radii.card`; frame foto → `radii.image` lalu bagian dalam → `radii.card`
  (bagian dalam harus ≤ luar − padding agar tepi tidak menonjol).
- Tombol → `radii.button`; badge/pill/dot/partikel → `radii.pill`.
- Satu bayangan per tema → `shadow.card` sesuai brief.
- `fontFamily` luxe: `"Playfair Display, serif"` → `typography.display`, `"Sora, sans-serif"` →
  `typography.eyebrow`/`.body` — string token luxe persis sama → tanpa delta visual.

## Delta visual yang diterima

1. Radius kartu glass/luxe 1rem–2.5rem → `radii.card` 1.5rem / `radii.image` 2rem (Δ ≤ 0.5rem kecuali poin 2).
2. LuxeContact frame luar 2.5rem → `radii.image` 2rem (Δ0.5rem), dalam calc(2.25rem) → `radii.image` 2rem
   (Δ0.25rem). `radii.card` (1.5rem) terlalu jauh (Δ1.0rem) — nilai token tidak diubah, pilih slot terdekat.
3. Brutal: semua radius (1rem/1.25rem/1.5rem/2rem/100px/`rounded-full`/`rounded-[...]`) → `"0"`.
   Sudut kotak + badge kotak = signature Neo Brutal, disengaja.
4. Brutal shadow: offset literal (5px/6px/8px/10px) → `shadow.card` `6px 6px 0 0 currentColor`;
   warna `currentColor` = teks `#1A1A1A` = warna border lama → praktis identik kecuali poin "Concerns" #1.
5. Stats glass: bubble kehilangan `0 8px 32px primaryGlow`, sisanya `shadow.card` (inset highlight tetap).
   `backdropFilter` 30px → 20px.
6. Skills glass chip: bayang-glow `0 2px 8px primaryGlow` → `shadow.card` inset.
7. Skills brutal: `5px 5px 0` / `6px 6px 0` → `shadow.card` `6px 6px 0 0 currentColor` (≈ identik).
8. Luxe: bayang inset Projects/Hero-photo hilang → `"none"` (signature luxe tanpa bayang).
9. Glass card `rounded-2xl`(1rem)/`2rem` → 1.5rem (Δ0.5rem).
10. About glass icon holder 36px: `rounded-lg` 0.5rem → `radii.card` 1.5rem → radius ter-clamp jadi lingkaran
    (dulu kotak-membulat). Delta terbesar non-brutal di file ini.
11. Hero whileHover badge: bayang-hover mengecil (4px→6px statis) — efek hover-offset dilepas, satu bayangan per tema.
12. Partikel/orb `rounded-full` → `radii.pill` (9999px di glass/luxe → lingkaran tetap; brutal → kotak, disengaja).

## Concerns

1. **Hero brutal badge nama** (`BrutalHero`, `color: "#fff"` di atas `primary`): bayang `8px 8px 0 ${border}`
   (hitam) → `shadow.card` yang memakai `currentColor` = putih → bayang jadi putih di atas krem, hampir
   tak terlihat. Brief melarang literal `boxShadow`, jadi dipakai token; delta ini nyata dan paling terasa.
   Task 5 (kontras/penyempurnaan) atau review desain perlu memutuskan: ubah warna teks badge, atau terima.
2. Kehilangan glow `primaryGlow` pada Stats/Skills glass — konsekuensi aturan "satu bayangan per tema".
3. `FloatingParticles` (Hero) kini memanggil `usePortfolioTheme()` — komponen berbagi lintas tema, aman.
4. File `.superpowers/sdd/task-1-brief.md`, `task-1-report.md`, `task-2-brief.md` sudah berubah sebelum
   task ini dimulai (bukan perubahan saya) dan **tidak** ikut di-commit.
5. `PENDING_FILES` dibiarkan persis sesuai brief — Task 3 yang menghapusnya.
6. Helper `node .superpowers/sdd/inventory.js` dibiarkan ter-untrack untuk dipakai ulang Task 3.

## Fix wave 1 (controller)
- Important dari review: badge hero Brutal pakai currentColor untuk bayangan tapi set color #fff -> bayangan putih di krem. Dipindah: color teks putih ke span dalam, elemen luar mewarisi warna teks tema (gelap) sehingga bayangan hard hitam kembali; whileHover boxShadow duplikat dihapus. Verifikasi 426/426 + Layer A 20/20 + tsc 0.
