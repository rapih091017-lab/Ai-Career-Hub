# Portfolio Spec 2 — Fondasi Tema (Tema Jadi Nyata)

Tanggal: 2026-10-12
Status: Disetujui ("gas langsung eksekusi")
Pendahulu: `2026-10-10-portfolio-trust-design.md` (Spec 1, sudah merge ke master)
Penyusun keputusan: tiga konsultan paralel (design critique / engineering review / minimalist specialist) — rulings diadukan oleh controller, arahan user menang atas skills bila bentrok.

## Masalah

Audit tematik + review konsultan menemukan:

1. **Tema adalah recolor, bukan identitas.** 6 dari 12 section (About, Experience, Education,
   Certifications, Organizations, Hobbies) memakai kerangka layout identik antar tema.
   Konsultan desain menemukan lebih dalam: Luxe sebagian besar hanyalah kerangka kartu
   Glass di-recolor (LuxeProjects kartu 2rem double-bezel, LuxeEducation kartu 1.5rem,
   LuxeHobbies = chip cloud Glass + serif) — aturan "Luxe = tanpa kartu" yang tertulis
   melanggar kode yang ship.
2. **Neo Brutal melanggar namanya**: radius 1.25–2rem di seluruh section.
3. **Ketiga tema gagal WCAG AA**: Brutal aksen `#FF3366` ≈3.5:1, Luxe aksen `#B8863C`
   ≈3.1:1 + body `#8C7A6A` ≈4.0:1, Glass aksen `#7C5CFC` ≈4.2:1; `sectionColors`
   statistik Brutal `#FFCC00` ≈1.6:1 di krem.
4. **Font tema tak dimuat di editor**: builder/preview merender fallback sistem. Lebih
   buruk: `fontUrl` Glass memakai `fonts.cdnfonts.com` yang **dilanggar CSP sendiri**
   (`middleware.ts` style-src/font-src hanya mengizinkan Google Fonts) → tema default
   selalu fallback di halaman publik hari ini; export pun preconnect ke origin yang salah.
5. **Picker tema tak bisa membedakan apa pun**: tiga kartu thumbnail = DOM mockup identik
   beda warna. Konsultan menilai pemahaman user 4/10.
6. **Voice campur EN/ID per tema**: Luxe mengeluarkan "View Work / INTRODUCING /
   PORTFOLIO", tema lain "Halo, Saya" — pelanggaran constraint copy Indonesia.
7. **Focus ring pakai teal app** `#0d7377` di atas Glass ≈2.2:1, nyaris tak terlihat.
8. `cssVars` (`--p-*`) mati (ditulis, tak pernah dibaca); inline `fontFamily` hardcode di
   6+ tempat membuat token tipografi mati sebelum ada.

Rating konsultan terhadap desain awal: identitas visual 6, brand-fit 5, enforceability 7,
pemahaman user 4 (→7 dengan thumbnail asli).

## Tujuan

- Tiap tema punya **signature mekanis** yang dijaga test, bukan selera lepas: setiap
  section bisa dikenali temanya dari crop 300px.
- Semua token teks lolos WCAG AA, focus ring per tema terlihat, font tema tampil
  identik di builder, preview, halaman publik, dan file export.
- Picker menampilkan thumbnail DOM asli per tema + satu baris deskripsi.

## Keputusan yang menimpa instruksi langsung (dikutip dari user)

| Instruksi user | Keputusan konsultan (diterima) | Alasan |
|---|---|---|
| install `lucide-react` | **Jangan** | ContactSection sudah punya SVG brand inline; lucide tak punya WhatsApp/TikTok (banyak dipakai pelamar Indonesia); satu keluarga ikon baru hanya untuk ikon sosial melanggar disiplin dependensi. Ikon sosial → SVG inline stroke-1. |
| install `framer-motion` | **Jangan** | Repo memakai `motion` (fork resmi, API identik). Dua library animasi = duplikasi bundel. |
| copy-paste `MinimalistHero` ke `/components/ui` | **Komponen ditolak sebagai unit; idenya ditulis ulang** | Yang bertahan dari komponen: lingkaran/foto, tipografi raksasa, bio. Yang dibuang: `h-screen` (lompatan iOS), header logo+nav+hamburger (dokumen single-scroll), footer sosial bawaan, fallback CDN `21st.dev`, seluruh literal style. |
| Tema Minimalist di Spec 2 | **Diundur jadi Spec 2.5 (fast-follow)** | Menulis 12 varian Minimalist sebelum re-compose = pasti ditulis ulang. Copy "3 tema" tetap akurat sampai Minimalist rilis, jadi diedit sekali di Spec 2.5. |

## Non-goal

Tema Minimalist (Spec 2.5, desain sudah terkunci di riset konsultan), field konten baru
(lokasi/availability — Spec Konten), perbaikan AI (Spec AI), dot/ornament lain di luar
daftar kualitas.

## Arsitektur

### 1. Token layer — field bertipe di `ThemeDefinition`

Ditambahkan (additive-only, di atas `ThemeColors` yang sudah ada):

```ts
radii:   { card: string; button: string; pill: string; image: string };
blur:    { card: string; glow: string };        // "" = tanpa blur
shadow:  { card: string; focus: string };       // "none" sah
typography: { display: string; body: string; eyebrow: string }; // family, bukan ukuran
focusRing: { color: string; width: string };
```

Dipakai sebagai nilai inline-style di section (`style={{ borderRadius: theme.radii.card }}`),
bukan CSS-var dan bukan Tailwind config — `renderToStaticMarkup` menyalin objek style
langsung ke export; `var(--p-*)` stringly-typed gagal senyap; Tailwind JIT tak bisa nilai
runtime per tema.

Aturan keras:

- **Kunci lama `ThemeColors` tidak boleh pernah di-rename.** Rename akan diam-diam
  membuang `sectionColors` milik user yang tersimpan di jsonb `portfolio_pages`
  (`themeForSection` hanya menerapkan kunci yang `key in colors`, tanpa error).
- **`cssVars` dihapus** dari `ThemeDefinition` (ditulis 3 tempat, nol pembaca — bukan
  dihidupkan lagi).
- Inline `fontFamily` literal di file section **dibekukan** (larangan di test) — keluarga
  font datang dari `theme.typography.*`.

Nilai per tema: Brutal `radii.* = "0"` seragam, `blur.* = ""`, `shadow.card` hard tanpa
blur; Glass `radii ≥ 1rem`, `blur.card` wajib terisi; Luxe `shadow.card = "none"`.
Minimalist (Spec 2.5) wajib `shadow.card = "none"` dan `radii ≤ 4px`.

### 2. Enforcement — dua layer Vitest (bukan ESLint)

Repo tidak punya CI lint (hanya `secret-scan.yml`); aturan hidup di `npm test`.

**Layer A — larangan sumber** (`src/__tests__/portfolio-theme-rules.test.ts`),
scan `src/components/portfolio/sections/*.tsx` + `render/**`:

- `rounded-[a-z0-9]`, `shadow-[a-z]`, `backdrop-blur`, literal `borderRadius: "` /
  `boxShadow: "` → wajib lewat token
- hex `#xxxxxx` dengan **allowlist hanya `#fff`/`#ffffff`** (stroke SVG putih di badge aman
  di semua permukaan non-putih; jangan membuat token khusus untuk itu)
- **inline `fontFamily`** → pakai `theme.typography.*`
- test: regex opsional lintas-file tetap menangani kutipan yang memang tak boleh berubah

**Layer B — semantik lewat token + markup hasil render:**

- Data token: `THEMES.brutal.radii.card === "0"` (dan ketiganya), Glass `blur.card` terisi,
  Luxe `shadow.card === "none"`, `focusRing.color` tiap tema ≠ `#0d7377` (teal app).
- Markup: `renderToStaticMarkup(<PortfolioDocument mode="static" themeId=…>)` per tema:
  Glass wajib memuat `backdrop-filter:blur(`, Brutal tidak boleh punya radius non-nol
  inline, Luxe nilai `box-shadow` hanya `none`.
- Paritas `THEME_IDS` ↔ `Object.keys(THEMES)` (`THEMES` bertipe `Record<string,…>`, drift
  saat ini lolos kompilasi).
- Default-branch `switch (theme.id)` di 12 section: setiap tema dalam `THEME_IDS` wajib
  punya `case` eksplisit — lupa = test gagal (bukan diam-diam render Glass).

**DOM-fingerprint (bukti "bukan recolor"):** render tiap section di 3 tema, ekstrak
kerangka DOM (tag urutan + jumlah elemen struktural, abaikan teks/warna), hash per pasangan
tema untuk 12 section — **semua 36 pasangan wajib berbeda**. Inilah test yang menangkap
`LuxeHobbies ≈ GlassHobbies` yang lolos audit visual.

**Lintas-tema (bagian minimalis jatuh ke Spec 2.5):** uji Luxe sekarang: kroma token
> 0.02 DAN display font harus serif. Spec 2.5 menambah uji Minimalist: kroma ≤ 0.02 dan
tanpa `serif` di semua `font-family` — dua uji saling menutup.

**Anggaran layout-family per tema:** tiap gaya komposisi (baris-bergaris, kartu-kisi,
kolom-terpusat, dst.) maksimal dipakai untuk satu theme family — mencegah 12 section
Minimalist nanti berubah jadi 12 baris hairline seragam.

`sectionColors` (override warna per section) **mekanismenya dipertahankan** (user override
tersimpan di jsonb), tapi nilai default per section ikut uji kontras dan tidak ditambah.

### 3. Kontras — rumus WCAG di dalam test, tanpa dependensi baru

`src/__tests__/portfolio-contrast.test.ts` mengimplementasi rumus sRGB→linear→luminance→
rasio (~25 baris). Pasangan wajib per tema, semuanya dari `theme.colors` terhadap `bg`:

| Pasangan | Ambang | Alasan |
|---|---|---|
| `text` | ≥4.5 | body |
| `textSecondary` | ≥4.5 | body sekunder |
| `textMuted` | ≥4.5 | dirender di `text-xs` |
| `primary` | ≥4.5 | eyebrow kecil & label |
| `focusRing` | ≥3.0 | WCAG 1.4.11 komponen UI |
| putih (`#fff`) di atas `primary` | ≥4.5 | badge putih-di-primary (dilupakan spec awal) |
| setiap `sectionColors[sec].primary` | ≥4.5 | dirender sebagai teks |

Perbaikan nilai warna: geser karakter (sama hue, nilai lebih pekat/terang) — tidak
mengganti karakter tema. Riak yang diterima: test yang mengunci hex lama
(`portfolio-export.test.ts`, `portfolio-document.test.tsx`, `portfolio-dead-code.test.ts`)
diperbarui di task yang sama. Transparan (`rgba`/opasitas) dikecualikan dari perhitungan
statis dan wajib dicatat, bukan diam-diam dilewati.

### 4. Font — `<link>` Google Fonts + `ThemeFonts`, `next/font` ditolak

`next/font` menghasilkan `url(/_next/static/media/…)` relatif yang **mati di file export
HTML mandiri** (perangkap yang sudah terdokumentasi `pdf-export.ts`) dan akan menyuntik
`@font-face` ke seluruh app shell.

- Satu komponen `ThemeFonts({ themeId })`: `<link rel="preconnect">` + `<link
  rel="stylesheet" href={THEMES[id].fontUrl}>` (+jsDelivr fallback bila diperlukan).
  Dipasang di `/portfolio/preview` dan halaman builder untuk tema aktif; ganti tema =
  React unmount/re-add, browser cache menyerap, `font-family` berganti instan.
- **Semua `fontUrl` wajib Google Fonts.** Perbaikan darurat: Geist pindah dari
  `fonts.cdnfonts.com` (dilarang CSP → tema default publik selalu fallback hari ini);
  preconnect export ikut diperbaiki. Daftar font: Geist (Glass), Space Grotesk (Brutal),
  Playfair Display + Sora (Luxe), Instrument Sans (Minimalist, Spec 2.5).
- Skenario gagal: font gagal dimuat → stack fallback eksplisit per tema
  (`'Space Grotesk', ui-sans-serif, system-ui` dsb) sehingga hierarki tetap terbaca.

### 5. Re-compose 6 section × 3 tema (18 implementasi)

Section yang kerangkanya sama antar tema: **About, Experience, Education, Certifications,
Organizations, Hobbies**. Untuk tiap tema, kerangka harus berbeda struktural:

- Glass: bento/gradien-border/kolom-glass (acuan yang sudah ada)
- Brutal: blok bernomor, offset shadow, sudut siku, tilt
- Luxe: hairline rule, kolom asimetris, tipografi serif sebagai pengganti kartu

Kerangka di sini berarti urutan elemen, mekanisme hierarki (kartu vs baris vs kolom), dan
struktur layout — bukan sekadar nilai warna/radius. Section yang sudah punya wajah beda
(Projects, Contact, Stats, Skills, Testimonials, Hero) disesuaikan hanya bila melanggar
token rule atau kontras.

### 6. Pass copy Indonesia

Seluruh keluaran publik (12 section × 3 tema) memakai bahasa Indonesia. Buang
"View Work", "INTRODUCING", "PORTFOLIO" gaya editorial Inggris di Luxe; samakan label
CTA dengan bahasa tema lain ("Lihat Karya", "Hubungi Saya"). Kunci i18n hanya bila
memang wajib — sebagian copy section adalah data display, ikuti konvensi file yang ada.

### 7. Picker tema: thumbnail nyata + satu baris deskripsi

Kartu theme picker di `/portfolio` (dan padanannya) berhenti memakai mockup DOM identik:
render **properti mini nyata** `PortfolioDocument` (fixture `TEMPLATE_PREVIEWS` tetap)
per tema, plus deskripsi satu baris per tema dalam bahasa Indonesia, plus penanda tema
default. Grid tetap 3 kolom di Spec 2; kolom keempat menyusul di Spec 2.5.

## Data flow / kompatibilitas

- **Tanpa migrasi DB.** `portfolioPages.theme` varchar lama tetap diterima
  (`THEME_IDS` bersifat additive; `resolveTheme` fallback Glass untuk id asing — sudah
  ber-te).
- `sectionColors` user di jsonb tetap diterapkan (kunci additive-only).
- Nilai warna baru **disengaja** mengubah tampilan halaman publik yang sudah terbit.
- Export dibuat ulang per request → file lama tak pernah basi.

## Pengujian

| Task | Test |
|---|---|
| Token layer | paritas `THEME_IDS`↔`THEMES`; field token lengkap di 3 tema; `cssVars` nol referensi |
| Enforcement | Layer A red → hijau setelah migrasi; token/semantic assert; DOM-fingerprint 36 pasangan; switch-case 3 tema eksplisit |
| Kontras | rumus WCAG vs semua pasangan; test hex lama diperbarui |
| Font | `ThemeFonts` merender link untuk tema aktif; semua `fontUrl` origin Google; tak ada inline `fontFamily` |
| Re-compose | per section × tema: render + fingerprint; copy Indonesia (tidak ada string EN yang ditarget) |
| Picker | kartu picker merender dua tema berbeda secara struktural (bukan warna) |
| Gate akhir | 4 konsumen identik; suite penuh hijau; build + lint 0 error |

## Kualitas

Antislop (ui, code, copy) berjalan **selama pengerjaan**. Constraint global tetap: text-xs
floor, tanpa dead control, salinan Indonesia fasih, `render/**` bebas literal
`rounded-*`/`shadow-*`/hex (kini ke seluruh section file).

## Di luar cakupan

Tema Minimalist (Spec 2.5 dengan desain terkunci: palet putih-murni+tinta, Instrument
Sans, masthead hairline, lingkaran ring, nama raksasa watermark, 12 arah section ledger,
daftar anti-pattern) · field konten baru · AI · lokasi · custom domain · reduksi-motion
batch (kecuali disentuh alami oleh section yang dirombak).
