# Task 3 Report — Migrasi token 6 section sisa + Layer A tanpa pengecualian

Status: **SELESAI, semua hijau.** Branch `feature/portfolio-themes`.

## 1. Perubahan test (Layer A)

`src/__tests__/portfolio-theme-rules.test.ts`:

- **`PENDING_FILES` dihapus total** (variabel + guard `if (PENDING_FILES.includes(name)) return;` + komentar). Mekanisme ini hanya menampung enam file Task 3, jadi tidak ada mekanisme pengganti — Layer A kini menyapu semua file `sections/` + `render/` tanpa pengecualian.
- **Penguatan 1 — regex `shadow-*` melebar:**
  `/\bshadow-(sm|md|lg|xl|2xl|premium[\w-]*)\b/` →
  `/\bshadow-(xs|sm|md|lg|xl|2xl|inner|none|premium[\w-]*|\[[^\]]+\])/`
  (`\b` penutup dilepas agar alternatif `shadow-[...]` dengan karakter non-word terakhir tetap tertangkap.)
- **Penguatan 2 — rule baru `backdropFilter` literal:** `/backdropFilter:\s*["'`]/`
  (`backdropFilter: theme.blur.card` TIDAK match — hanya kuotasi literal yang dilarang.)
- **Penguatan 3 — hex melebar ke 8 digit:** `/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6})\b/`
  Allowlist `#fff`/`#ffffff` tetap di `stripAllowed` (tidak diubah).

## 2. Bukti RED (Step 1) — tiga penguatan

Output penuh: `.superpowers/sdd/task-3-red.txt`

```
❯ src/__tests__/portfolio-theme-rules.test.ts (20 tests | 6 failed)
   × CertificationsSection.tsx bebas literal   [rounded-*, borderRadius, boxShadow, backdropFilter, inline fontFamily, hex warna]
   × EducationSection.tsx bebas literal         [rounded-*, borderRadius, boxShadow, backdropFilter, inline fontFamily, hex warna]
   × ExperienceSection.tsx bebas literal        [rounded-*, borderRadius, boxShadow, backdropFilter, inline fontFamily]
   × HobbiesSection.tsx bebas literal           [rounded-*, borderRadius, boxShadow, backdropFilter, inline fontFamily]
   × OrganizationsSection.tsx bebas literal     [rounded-*, borderRadius, boxShadow, backdropFilter, inline fontFamily, hex warna]
   × TestimonialsSection.tsx bebas literal      [rounded-*, borderRadius, backdropFilter, inline fontFamily]
  Tests  6 failed | 14 passed (20)
```

Kontribusi per penguatan:

1. **`shadow-*` melebar** — grep seluruh `sections/` + `render/` terhadap `shadow-(xs|sm|md|lg|xl|2xl|inner|none)|shadow-\[`: **0 match**. Aturan kini menutup celah yang ditemukan review Task 2; tidak ada pelanggaran tersisa di file mana pun (RED tidak bertambah dari aturan ini).
2. **`backdropFilter` literal** — **menyumbang RED di keenam file** (label `backdropFilter literal` muncul di semua daftar kegagalan di atas). Rule lama tidak punya aturan ini sama sekali, jadi tanpa penguatan ini enam literal `backdropFilter: "blur(20px)"` akan lolos senyap. Setelah migrasi → `backdropFilter: theme.blur.card`; grep pasca-migrasi: 0 match.
3. **Hex 8 digit `#RRGGBBAA`** — grep `#[0-9a-fA-F]{8}\b` di sections+render: **0 match**. Aturan preventif, tak ada pelanggaran; hex 6 digit biasa tetap tertangkap (lihat §5).

## 3. Bukti GREEN (Step 3)

Output penuh: `.superpowers/sdd/task-3-green.txt`

```
npx vitest run src/__tests__/portfolio-theme-rules.test.ts
  Test Files  1 passed (1)
  Tests  20 passed (20)

npm test
  Test Files  25 passed (25)
  Tests  426 passed (426)

npx tsc --noEmit → exit 0 (tanpa error)
```

## 4. Inventaris literal per file (before → after)

Semua baris "before" ada di git HEAD (f40d2a1), "after" = bentuk sekarang. Total **76 literal** dimigrasi.

### ExperienceSection.tsx (16)
| Before | After |
|---|---|
| L21 class `rounded-full` (eyebrow) | `borderRadius: theme.radii.pill` inline |
| L45 class `rounded-full` (dot timeline) | `borderRadius: theme.radii.pill` inline |
| L46 `boxShadow: \`0 0 0 4px ${primary}20\`` | `boxShadow: theme.shadow.card` |
| L55 `borderRadius: "2rem"` (bezel luar glass) | `theme.radii.image` |
| L58 `borderRadius: "calc(2rem - 0.25rem)"` | `theme.radii.card` |
| L59 `boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)"` | `theme.shadow.card` |
| L60 `backdropFilter: "blur(20px)"` | `theme.blur.card` |
| L127 `borderRadius: "1.25rem"` (kartu brutal) | `theme.radii.card` |
| L130 `borderRadius: "calc(1.25rem - 0.5rem)"` | `theme.radii.card` |
| L172 class `rounded-[1.25rem]` (plat bayang brutal) | `borderRadius: theme.radii.card` inline |
| L201 `fontFamily: "Playfair Display, serif"` | `theme.typography.display` |
| L217 `borderRadius: "2rem"` (bezel luxe) | `theme.radii.image` |
| L220 `borderRadius: "calc(2rem - 0.25rem)"` | `theme.radii.card` |
| L221 `boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)"` | `theme.shadow.card` |
| L232 `fontFamily: "Playfair Display, serif"` | `theme.typography.display` |
| L244 class `rounded-full` (chip tanggal luxe) | `borderRadius: theme.radii.pill` inline |

### EducationSection.tsx (14)
| Before | After |
|---|---|
| L44 `borderRadius: "2rem"` | `theme.radii.image` |
| L48 `borderRadius: "calc(2rem - 1px)"` | `theme.radii.card` |
| L49 `backdropFilter: "blur(20px)"` | `theme.blur.card` |
| L50 `boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)"` | `theme.shadow.card` |
| L54 class `rounded-2xl` (ikon glass) | `borderRadius: theme.radii.card` inline |
| L143 `borderRadius: "0.75rem"` (stepper brutal) | `theme.radii.card` (Brutal = `"0"`, siku — signature) |
| L144 `boxShadow: \`6px 6px 0px ${border}\`` | `theme.shadow.card` |
| L150 `color: "#1A1A1A"` (badge brutal) | `theme.colors.text` |
| L195 `fontFamily: "Playfair Display, serif"` | `theme.typography.display` |
| L215 class `rounded-full` (dot tahun luxe) | `borderRadius: theme.radii.pill` inline |
| L223 class `rounded-full` (badge tahun luxe) | `borderRadius: theme.radii.pill` inline |
| L228 `borderRadius: "1.5rem"` | `theme.radii.card` |
| L229 `borderRadius: "calc(1.5rem - 0.25rem)"` | `theme.radii.card` |
| L230 `fontFamily: "Playfair Display, serif"` | `theme.typography.display` |

### CertificationsSection.tsx (14)
| Before | After |
|---|---|
| L45 `borderRadius: "1.5rem"` | `theme.radii.card` |
| L50 `borderRadius: "calc(1.5rem - 1px)"` | `theme.radii.card` |
| L51 `backdropFilter: "blur(20px)"` | `theme.blur.card` |
| L52 `boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)"` | `theme.shadow.card` |
| L54 class `rounded-2xl` (ikon glass) | `borderRadius: theme.radii.card` inline |
| L69 class `rounded-full` (chip tahun glass) | `borderRadius: theme.radii.pill` inline |
| L122 `borderRadius: "0.75rem"` (kartu brutal) | `theme.radii.card` (siku) |
| L123 `boxShadow: \`6px 6px 0px ${border}\`` | `theme.shadow.card` |
| L128 `stroke="#1A1A1A"` (svg brutal) | `stroke={theme.colors.text}` |
| L171 `fontFamily: "Playfair Display, serif"` | `theme.typography.display` |
| L192 `borderRadius: "1.25rem"` (list luxe) | `theme.radii.card` |
| L195 class `rounded-full` (lingkaran ikon luxe) | `borderRadius: theme.radii.pill` inline |
| L202 `fontFamily: "Playfair Display, serif"` | `theme.typography.display` |
| L211 class `rounded-full` (chip tahun luxe) | `borderRadius: theme.radii.pill` inline |

### OrganizationsSection.tsx (11)
| Before | After |
|---|---|
| L40 `borderRadius: "1.5rem"` | `theme.radii.card` |
| L44 `borderRadius: "calc(1.5rem - 1px)"` | `theme.radii.card` |
| L45 `backdropFilter: "blur(20px)"` | `theme.blur.card` |
| L46 `boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)"` | `theme.shadow.card` |
| L49 class `rounded-2xl` (ikon glass) | `borderRadius: theme.radii.card` inline |
| L115 `borderRadius: "0.75rem"` (baris brutal) | `theme.radii.card` (siku) |
| L116 `boxShadow: \`6px 6px 0px ${border}\`` | `theme.shadow.card` |
| L121 `color: "#1A1A1A"` (periode brutal) | `theme.colors.text` |
| L158 `fontFamily: "Playfair Display, serif"` | `theme.typography.display` |
| L176 class `rounded-full` (nomor luxe) | `borderRadius: theme.radii.pill` inline |
| L184 `fontFamily: "Playfair Display, serif"` | `theme.typography.display` |

### HobbiesSection.tsx (7)
| Before | After |
|---|---|
| L47 class `rounded-full` (chip cloud glass) | `borderRadius: theme.radii.pill` inline (Brutal pill = `"0"` → badge kotak, signature disengaja) |
| L50 `backdropFilter: "blur(20px)"` | `theme.blur.card` |
| L100 `borderRadius: "0.75rem"` (kotak brutal) | `theme.radii.card` (siku) |
| L101 `boxShadow: \`4px 4px 0px ${border}\`` | `theme.shadow.card` (→ `6px 6px`, lihat §7) |
| L140 `fontFamily: "Playfair Display, serif"` | `theme.typography.display` |
| L159 `borderRadius: "999px"` (chip luxe) | `theme.radii.pill` |
| L164 `fontFamily: "Playfair Display, serif"` | `theme.typography.display` |

### TestimonialsSection.tsx (14)
| Before | After |
|---|---|
| L24 class `rounded-full` (blob glass) | `borderRadius: theme.radii.pill` inline (`blur-[120px]` dipertahankan, lihat §8) |
| L54 `borderRadius: "1.5rem"` | `theme.radii.card` |
| L58 `borderRadius: "calc(1.5rem - 1px)"` | `theme.radii.card` |
| L59 `backdropFilter: "blur(20px)"` | `theme.blur.card` |
| L63 class `rounded-full` (avatar glass) | `borderRadius: theme.radii.pill` inline |
| L75 class `rounded-full` (titik pemisah) | `borderRadius: theme.radii.pill` inline |
| L92 class `rounded-full` (dot carousel) | `borderRadius: theme.radii.pill` inline |
| L142 `borderRadius: "0.75rem"` (kartu brutal) | `theme.radii.card` (siku) |
| L143 `boxShadow: i % 2 === 0 ? \`6px...\` : \`-6px...\`` | `boxShadow: theme.shadow.card` |
| L196 `fontFamily: "Playfair Display, serif"` | `theme.typography.display` |
| L212 `borderRadius: "2rem"` (bezel luxe) | `theme.radii.image` |
| L215 `borderRadius: "calc(2rem - 0.25rem)"` | `theme.radii.card` |
| L221 `fontFamily: "Playfair Display, serif"` | `theme.typography.display` |
| L243 `fontFamily: "Playfair Display, serif"` | `theme.typography.display` |

`items.slice(0, 3)`, semua `key`/id item, props, dan copy Indonesia tidak disentuh (diff hanya baris style — lihat numstat §3, +/- seimbang per file).

## 5. Pemetaan hex → token

| File | Literal | Token | Nilai hasil |
|---|---|---|---|
| EducationSection L150 | `color: "#1A1A1A"` | `theme.colors.text` | `#1A1A1A` (Brutal) — **identik, delta 0** |
| OrganizationsSection L121 | `color: "#1A1A1A"` | `theme.colors.text` | `#1A1A1A` — **identik** |
| CertificationsSection L128 | `stroke="#1A1A1A"` | `stroke={theme.colors.text}` | `#1A1A1A` — **identik** |

`color: "#fff"`, `stroke="#fff"` dipertahankan (allowlist `#fff`/`#ffffff`). Hex 8 digit: tidak ada di file ini. Kontras sempurna = urusan Task 5.

## 6. Slot token baru

**Tidak ada.** Semua literal muat di token yang ada (`radii.card/image/pill`, `shadow.card`, `blur.card`, `typography.display`, `colors.text`). `themes.ts` dan `types.ts` tidak diubah.

## 7. Delta visual yang diterima

1. **Radii Brutal → `"0"` di semua yang semula membulat** (signature): stepper pendidikan `0.75rem`→0, kartu sertifikat/organisasi/hobi/testimoni `0.75/1.25rem`→0, chip `rounded-full`→kotak, plat bayang Experience `rounded-[1.25rem]`→0, ikon `rounded-2xl`→0.
2. **Bezel dalam menyusut ke `radii.card` (1.5rem)**: `calc(2rem − 0.25rem)` = 1.75rem → 1.5rem (glass/luxe). Pola identik Task 2 (Contact/Hero).
3. **Ikon `rounded-2xl` glass (1rem) → `radii.card` (1.5rem)** — mengikuti Task 2 AboutSection.
4. **List sertifikat luxe `1.25rem` → `1.5rem`** (`radii.card`).
5. **Bayangan brutal `${border}` → `shadow.card` (`6px 6px 0 0 currentColor`)**: warna Brutal `border` = `text` = `#1A1A1A`, currentColor di section = teks root → warna sama, offset identik. Hobbies `4px 4px` → `6px 6px` (melebar 2px, per pola "satu bayangan per tema").
6. **Testimonials brutal kehilangan alternasi kiri/kanan** (`-6px` ganjil) → satu `shadow.card` seragam. Aturan Task 2 eksplisit: "bila bayangannya berbeda per posisi, pakai `card` juga — satu bayangan per tema adalah bagian signature."
7. **Dot timeline Experience (glass) kehilangan halo** `0 0 0 4px primary@12.5%` → `shadow.card` inset (glass). Halo 4px tak bisa diekspresikan token mana pun yang ada; dipilih ikut pola "boxShadow literal → shadow.card" alih-alih menambah slot untuk satu pemakaian.
8. **Bayangan inset glass/luxe hilang** (`inset 0 1px 1px rgba(255,255,255,.06)` / `inset 0 1px 2px rgba(0,0,0,.03)`) → Luxe `shadow.card` = `"none"`, Glass = highlight inset tipis (sudah sama persis nilainya untuk glass). Task 2 melakukan hal yang sama.
9. **Luxe `fontFamily: "Playfair Display, serif"` → `theme.typography.display`** (`'Playfair Display', serif`) — equivalen, delta 0.

## 8. Concerns

- `blur-[120px]` (Testimonials, Hero) & `blur-[80px]` (About) dibiarkan: bukan objek aturan mana pun (hanya `backdrop-blur` yang dilarang), dan Task 2 juga membiarkannya. Kalau mau disterilkan, tambah rule `blur-\[` di iterasi berikut — perlu pemetaan ke `theme.blur.glow` per tema.
- Halo dot timeline Experience (§7.7) kini hilang. Jika designer ingin balik: tambah slot `shadow.ring` (extend `ThemeShadow` + isi 3 tema + tambah assert di test kelengkapan) — bukan edit nilai token lama.
- `textShadow: \`0 0 60px ${primaryGlow}\`` (Hero, Task 2) lolos karena properti `textShadow` bukan objek rule; di luar scope Task 3.
- `theme.shadow.focus` (`focusRing` juga) belum dipakai file section mana pun — kandidat Task 6+ (fokus aksesibilitas).
- Working tree berisi modifikasi `.superpowers/sdd/*.md` yang sudah ada SEBELUM Task 3 (ledger). **Tidak ikut di-commit** — hanya `src/` sesuai brief.
