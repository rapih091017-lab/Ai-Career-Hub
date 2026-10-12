# Spec 2.5 — Tema Minimalist + Re-compose Hero

Tanggal: 2026-10-12
Status: disetujui user (briefing lisan, 6 bagian)
Fondasi: Spec 2 "Fondasi Tema" (`2026-10-12-portfolio-theme-foundation-design.md`) — token layer, enforcement 2 layer, font Google-only, dan re-compose 6 section tetap berlaku dan diperluas ke tema keempat.

## 1. Tujuan

1. Menambah tema keempat **Minimalist**: putih/ink, satu grotesk, kontras skala ekstrem, tanpa gradien, tanpa bayangan, tanpa kartu.
2. **Re-compose Hero** untuk keempat tema dengan komposisi berbeda (bukan recolor), memakai ide dari referensi `MinimalistHero`: lingkaran/foto, tipografi raksasa, bio.
3. Menyelaraskan copy "3 tema" → "4 tema".

Non-goal: field konten baru (lokasi/availability), animasi masuk baru, tema kelima, perubahan layout di luar 9 section + hero. Komponen `MinimalistHero` dari referensi **tidak** dipakai sebagai unit — hanya idenya. `h-screen`/`100dvh`, `lucide-react`, `framer-motion`, dan `next/font` tetap ditolak.

## 2. Keputusan bersama (dikonfirmasi user)

| Topik | Keputusan |
|---|---|
| Pemotongan scope | Hero untuk 3 tema existing dulu (pola terkunci), lalu Minimalist sebagai implementasi keempat |
| Kedalaman Hero | Komposisi berubah per tema; elemen konten sama |
| Hero tanpa foto | Fallback khas per tema (orb / blok inisial / monogram / lingkaran) |
| Karakter Minimalist | Monokrom + grotesk, kontras tipe ekstrem |
| Identitas struktural | 9 section struktural; `stats`, `skills`, `testimonials` token-only |
| Tema default | Glass tetap default |

## 3. Arsitektur

```
src/components/portfolio/
  themes.ts                      + entri `minimalist`
  sections/HeroSection.tsx       dispatch ke 4 komposisi
  hero/shared.tsx                kontrak konten + helper (initials, fallback foto)
  hero/variants.tsx              heroGlass / heroBrutal / heroLuxe / heroMinimalist
  sections/*.tsx                 + case "minimalist" pada 9 section struktural
```

- `ThemeId` gaining `"minimalist"`. Kolom DB `varchar(50)` → **tanpa migrasi**.
- `DEFAULT_THEME_ID` tetap `"glass"`.
- Batas file: `HeroSection.tsx` pecah ke `hero/` bila tembus ~500 baris; kontrak konten tetap di satu tempat agar fallback tidak terduplikasi.

## 4. Token `minimalist`

| Token | Nilai |
|---|---|
| `bg` / `surface` / `surfaceVariant` | `#FFFFFF` / `#FAFAFA` / `#F4F4F5` |
| `onSurface` / `onSurfaceVariant` | `#111111` / `#52525B` |
| `primary` / `onPrimary` | `#111111` / `#FFFFFF` |
| `secondary` | `#71717A` |
| `outline` / `outlineVariant` | `#D4D4D8` / `#E4E4E7` |
| `error` | `#B91C1C` |
| `radius` / `blur` / `shadow` | `0` / none / none |
| `typography` | Instrument Sans untuk display/body/eyebrow |
| `fontUrl` | Google Fonts `Instrument Sans` |

Skala tipografi: display 88px `letter-spacing -0.03em`, body 15px, eyebrow 11px uppercase `letter-spacing 0.18em`.

**Aturan kontras:** hairline dekoratif (`outline`, `outlineVariant`) tidak wajib 3:1; setiap border yang interaktif (input, tombol, kontrol) memakai `onSurfaceVariant` agar lolos WCAG 1.4.11.

## 5. Hero

Kontrak konten bersama (`hero/shared.tsx`): eyebrow (`heroHeadline`), nama (`heroFirstName` + `heroLastName`), bio (`heroBio`), CTA `#projects` dan `#contact`, foto opsional (`heroPhotoUrl`). Lokasi tidak dipakai.

| Tema | Komposisi | Fallback tanpa foto |
|---|---|---|
| Glass | Foto full-bleed + scrim gradien; nama besar kiri bawah; meta kanan atas; CTA pil kaca | Orb blur gradien + inisial |
| Brutal | Dua blok: tipografi mono + nama grotesk kapital dengan hard offset shadow; bingkai foto siku sedikit miring | Kotak siku berisi inisial + hard shadow |
| Luxe | Split editorial: kolom serif raksasa + garis rambut, kolom kanan foto setinggi penuh; banyak ruang kosong; tanpa kartu | Monogram serif besar tanpa bingkai |
| Minimalist | Lingkaran foto (atau inisial) + nama grotesk raksasa, bio satu paragraf di bawah garis rambut; putih, tanpa isian, tanpa bayangan | Lingkaran inisial |

Batas teknis:
- Tanpa `h-screen`/`100dvh`; tinggi dari padding + `clamp()`, kolom foto dibatasi max ±520px.
- Scroll-cue hanya di Brutal (label mono "SCROLL").
- Semua komposisi harus utuh di `mode="static"` (ekspor HTML/PDF) — tidak bergantung pada animasi masuk.

## 6. Sembilan section struktural Minimalist

Bahan: putih, hairline `#E4E4E7`, teks tinta, satu grotesk, tanpa isian, tanpa bayangan. Nomor section (`01 / TENTANG`) jadi satu-satunya penanda struktur.

| Section | Komposisi |
|---|---|
| Hero | Lingkaran + nama raksasa + bio |
| About | Dua kolom asimetris: kiri `01 / TENTANG` + hairline, kanan paragraf 20px; tiga angka stats sebagai teks polos dipisah garis vertikal |
| Stats | Angka + label sebaris, dipisah hairline; tanpa lingkaran (`radius 0` + tanpa shadow) |
| Experience | Satu kolom; baris `2023—2026 · Posisi` kiri, perusahaan 18px kanan; `borderTop` hairline; tanpa kartu |
| Education | Dua kolom; label `02 / PENDIDIKAN`; baris institution + degree + tahun dipisah hairline |
| Projects | Satu kolom daftar besar: nomor `01`, gambar full-bleed bila ada, nama + deskripsi + tech |
| Skills | Tag hairline siku (tanpa isian warna) |
| Certifications | Baris `Nama — Penerbit · Tahun` dipisah hairline; tanpa ikon, tanpa chip |
| Organizations | Baris `Nama` kiri, `Peran` kanan, hairline di tengah |
| Hobbies | Label + teks Interest; tanpa ikon |
| Testimonials | Kutipan tanpa kartu: tanda kutip besar + teks + nama; hairline di atas |
| Contact | Email besar 30px sebagai tautan (underline hairline, bukan blok); kolom kanan tautan sosial; tanpa form |

**Koreksi saat implementasi:** `stats`, `skills`, dan `testimonials` ternyata sudah punya tiga varian eksplisit per tema (bukan sekadar token). Membiarkan Minimalist jatuh ke `default` berarti kartu gelap Glass bocor ke halaman putih, jadi ketiganya ikut diberi varian Minimalist yang ringan. Konsekuensinya favorable: seluruh 12 section tetap punya `case "minimalist"`, sehingga tidak diperlukan pengecualian di test paritas.

Semua nilai berasal dari token; aturan Layer A yang ada tetap berlaku dan diperluas ke 4 tema.

## 7. Penegakan test

1. `portfolio-theme-rules.test.ts` — loop 4 tema: Layer A, `fontUrl` Google-only, `minimalist` wajib `radius 0` + `shadow none`.
2. `portfolio-theme-fingerprint.test.ts` — **seluruh 12 section** wajib pairwise-distinct untuk keempat tema (lihat koreksi §6: tidak ada section token-only).
3. `portfolio-contrast.test.ts` — pasangan kontras `minimalist` (≥7 pasangan, ambang AA).
4. **Paritas switch-case** — tiap section sudah punya `case "minimalist"`; dijaga test Layer B yang sudah ada (`portfolio-theme-rules.test.ts`), jadi tidak perlu test paritas baru.
5. `portfolio-picker.test.tsx` — 4 kartu; `Tema bawaan` tetap di Glass; deskripsi satu baris untuk Minimalist; thumbnail tetap menyembunyikan hero.

## 8. Copy

"3 tema" → "4 tema" di: kartu pricing (`3 pilihan tema desain modern`), landing/spotlight, metadata, deskripsi tema di picker.

## 9. Verifikasi

- Otomatis: `npm test`, `npx tsc --noEmit`, `npm run lint` (0 error), `npm run build`.
- Visual: harness (`QA_HARNESS=1`, menulis ke direktori temp) untuk 4 tema, lalu konfirmasi akhir user di Chrome untuk hero + picker (headless tidak meng-hydrate halaman login).

## 10. Rollout

Tanpa migrasi DB. Portfolio terbit tidak tersentuh. Default tetap Glass. `portfolio_pages.theme` yang bernilai `'minimalist'` diperlakukan sebagai tema valid oleh `THEMES`.
