# Portfolio Web Generator — Spec 1: Trust & Persistence

Tanggal: 2026-10-10
Status: Disetujui (approving user: "GAS")
Bagian dari: Program 4-spec (1 Trust → 2 Tema → 3 Konten → 4 AI terverifikasi)

## Masalah

Audit menemukan lima cacat struktural yang membuat produk ini tidak bisa dipercaya
dan tidak akan dipakai berulang:

1. **Draft hanya di browser.** `/portfolio/build` menulis ke `localStorage["portfolio_draft"]`,
   `/portfolio/live` menulis ke `localStorage["portfolio_live_data"]`. Dua kunci, tanpa
   migrasi, nol penyimpanan draft di server. User yang mengisi 12 section kehilangan
   segalanya saat ganti perangkat atau clear cache.
2. **Gambar menipu sistem.** `/api/upload` mengembalikan base64 data URL. Foto 3 MB menjadi
   string ~4 MB di localStorage yang quota-nya 5 MB. `catch {}` di `build/page.tsx:486` dan
   `live/page.tsx:83` menelan error quota, sehingga UI tetap menampilkan "Tersimpan" padahal
   tidak ada yang tersimpan.
3. **XSS tersimpan di halaman publik.** `safeUrl()` ada dan teruji, tapi hanya dipakai di
   jalur export (`portfolio/preview/page.tsx:39`). Path yang dilihat dunia —
   `PublishedPortfolio` → `/p/[slug]` — mengoper string mentah ke `href` di
   `ProjectsSection.tsx:88`, `CertificationsSection.tsx:39`, `ContactSection.tsx:69`.
   Skema `javascript:` menjadi stored XSS di URL publik.
4. **Tiga renderer berbeda.** Builder canvas, halaman preview, dan hasil export adalah tiga
   implementasi terpisah yang pasti berbeda: preview mengabaikan `sectionOrder`
   (`preview/page.tsx:333-344` hardcoded), `sectionColors` hanya di-mount di builder
   (`PortfolioCanvas.tsx:45-67`), `fontSize`/`alignment` tidak dikirim ke publish
   (`PublishDialog.tsx:116-117`), dan export adalah satu layout yang di-recolor tiga kali
   tanpa satu pun `<img>`.
5. **Siklus publish destruktif.** Unpublish adalah `DELETE` keras (`publish/route.ts:189`)
   dan marker trial tidak pernah dihapus, sehingga user gratis yang salah klik Unpublish
   kehilangan URL-nya permanen. `portfolio_trial_uses` juga tidak punya file `.sql` —
   route-nya query tabel yang belum pernah dibuat di DB mana pun.

## Tujuan

Setelah spec ini, lima hal berikut benar secara konstruksi, bukan oleh disiplin:

- Draft tersimpan di server dan pulih di perangkat mana pun.
- Builder, preview, halaman publik, file HTML, dan tampilan print menghasilkan output yang
  identik.
- Tidak ada URL yang bisa dieksekusi di halaman publik.
- Menutup portfolio lalu membukanya kembali mengembalikan slug yang sama.
- Konten user tidak hilang karena satu klik.

## Nicht-goal

Konten baru (link demo+repo, level skill, custom section) adalah Spec 3. Kesesuaian visual
tema adalah Spec 2. Pencegahan fabrikasi angka AI adalah Spec 4. Semua yang masih merusak
tidak bisa diterima sampai spec masing-masing selesai.

## Arsitektur

### 1. Penyimpanan draft di server

Tabel baru `portfolio_drafts`:

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users cascade | satu user boleh banyak draft |
| `name` | varchar(120) | default "Portfolio saya" |
| `data` | jsonb NOT NULL default `'{}'` | tervalidasi Zod di server |
| `created_at` / `updated_at` | timestamp | |

Route `/portfolio/build` → `/portfolio/build/[draftId]`. `/portfolio/live` menjadi
redirect: menerima `?draftId=`, lalu mengarahkan ke `/portfolio/build/[draftId]` supaya ada
satu entry point saja. Draft yang sudah ada tetap bisa dibuka lewat pengalihan ini,
bukan dihapus.

`localStorage` turun kelas menjadi **cache write-through** dengan satu kunci
(`portfolio_cache_v1_<draftId>`):

- Baca: server dulu; kalau fetch gagal atau offline, pakai cache dan tampilkan banner
  "Offline — perubahan disimpan di perangkat ini".
- Tulis: ke server (debounce 1200 ms) **dan** ke cache. Kegagalan cache tidak pernah
  ditelan diam-diam; banner offline yang sama dipakai sebagai penanya.

`isHydrated` / `mounted` guard dipertahankan agar draft server tidak tertimpa cache kosong
pada render pertama.

### 2. Aset gambar di luar draft JSON

Tabel baru `portfolio_assets`:

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users cascade | |
| `mime` | varchar(32) | `image/jpeg`, `image/png`, `image/webp` |
| `bytes` | integer | ukuran asli |
| `width` / `height` | integer | untuk reserve aspect-ratio, mencegah layout shift |
| `sha256` | char(64) | unik bersama `user_id` untuk dedupe |
| `created_at` | timestamp | |

`POST /api/portfolio/assets` menerima multipart, memvalidasi MIME dan ukuran maksimum
4 MB, menghitung sha256, mengembalikan URL `/api/portfolio/assets/[id]`. Payload gambar
disimpan sebagai bytea. Dedupe: hash yang sama milik user yang sama mengembalikan URL yang
sama tanpa menyimpan ulang.

Draft JSON hanya menyimpan URL pendek. **Export meng-inline gambar**: sebelum
`renderToStaticMarkup`, setiap URL aset di-fetch lalu di konversi ke data URI, sehingga file
HTML tetap mandiri.

`GET /api/portfolio/assets/[id]` menolak aset milik user lain dan aset yang tidak
dirujuk oleh draft milik user tersebut.

`/api/upload` yang mengembalikan base64 tidak diubah di spec ini; dampaknya pada CV
upload di luar scope dan dicatat sebagai temuan lanjutan.

### 3. Satu renderer

`src/lib/portfolio/render/PortfolioDocument.tsx` — satu pohon React:

```tsx
type RenderMode = "editor" | "static";

<PortfolioDocument
  data={PortfolioData}
  themeId={ThemeId}
  mode={RenderMode}
  fontSize="base" | "large"
  sectionOrder={SectionId[]}
  sectionVisibility={Record<SectionId, boolean>}
  sectionColors={Record<SectionId, {primary, accent}> | null}
  onSectionClick?: (id: SectionId) => void
/>
```

Perilaku mode:

| | `editor` | `static` |
|---|---|---|
| Framer Motion | aktif, hormati `useReducedMotion` | dimatikan, render state awal |
| `id` per section | ada | ada |
| `onSectionClick` | aktif | tidak |
| Drag handle | di luar dokumen | tidak |
| `position:fixed` grain/orb | ada | ada, tapi dimatikan oleh print stylesheet |

Empat konsumen:

1. `PortfolioCanvas.tsx` → `mode="editor"`
2. `/portfolio/preview` → `mode="editor"` di dalam frame perangkat
3. `/p/[slug]/page.tsx` → `mode="static"` (server component, `force-dynamic`)
4. `GET /api/portfolio/export` → `renderToStaticMarkup(mode="static")` dibungkus dokumen
   HTML lengkap dengan `<style>` inline dan `<link>` font

Tambahkan `id` pada setiap section (`hero`, `about`, `stats`, `experience`, `education`,
`projects`, `skills`, `certifications`, `organizations`, `hobbies`, `testimonials`,
`contact`), yang memperbaiki 16 tombol hero yang sekarang menjadi anchor mati.

`sectionColors` dipindahkan ke dalam dokumen sehingga builder dan halaman publik memakai
warna yang sama.

**Dihapus:** `generateExportHtml` (`preview/page.tsx:42-195`),
`src/components/portfolio-templates/html-generators.ts` (719 baris, 0 referensi),
`src/lib/portfolioTemplates.ts`, fungsi `esc` dari `portfolio-safety.ts` (renderer React
melindungi diri sendiri), field `heroBgUrl` dan `heroCreativeTitle` (0 konsumen), dan
`SECTION_META`'s `stats` yang tidak punya form.

### 4. Keamanan URL

Komponen `src/components/portfolio/render/SafeLink.tsx`:

```tsx
<SafeLink href={userInput} mode={mode} className={...}>
```

- Terima `https:`, `http:`, `mailto:`, `tel:`, dan path relatif yang diawali `/`.
- Domain telanjang seperti `linkedin.com/in/x` mendapat prefiks `https://`.
- Skema lain — `javascript:`, `data:`, `vbscript:`, `file:` — ditolak.
- `mode="static"`: dirender sebagai `<span>` tanpa `href`, ditambahkan
  `aria-label`/title yang menjelaskan tautan ditolak.
- `mode="editor"`: dirender dengan `href="#"` dan **sorotan merah + label** "tautan
  ditolak — skema tidak diizinkan", supaya masalah terlihat saat menyunting, bukan
  setelah terbit.

Membungkus setiap `href` dan `src` di pohon portfolio. Ini menutup celah XSS yang ada
sekarang dan menutup celah yang sama di spec-spec berikutnya secara default.

### 5. Skema Zod

`src/lib/portfolio/schema.ts`:

- `portfolioDataSchema` — bentuk penuh `PortfolioData` (Spec 3 akan memperluasnya; spec ini
  menetapkan bentuk saat ini sebagai bentuk dasar).
- `publishPayloadSchema` — `{ draftId, slug, themeId, data, fontSize, alignment }`.
- `draftPayloadSchema` — `{ name, data }`.

Aturan: panjang maksimum string per field (memakai nilai `maxLength` yang sudah ada di
form), jumlah maksimum item per array (projects 60, experiences 40, educations 20,
certifications 40, organizations 20, hobbies 30, testimonials 30, extraLinks 12),
tanggal harus cocok `YYYY-MM` atau `YYYY-MM` dengan hari, `endDate >= startDate`, setiap
URL wajib lolos `safeUrl`, dan slug wajib lolos `isValidSlug` **dan** bukan di
`RESERVED_SLUGS`.

Publish ditolak bila nama kosong, atau `formData.heroFirstName` kosong. Publish portfolio
yang secara visual kosong ditolak dengan pesan yang menyebut section mana yang kosong.

`PublishDialog` berhenti punya `SLUG_REGEX` sendiri — satu sumber kebenaran adalah
`portfolio-safety.ts`.

### 6. Siklus publish

`portfolio_pages` dapat kolom `status` dengan default `'draft'`, nilai
`'draft' | 'published' | 'archived'`. `published_at` menjadi nullable.

| Aksi | formerly | sekarang |
|---|---|---|
| Publish | INSERT/UPDATE | INSERT/UPDATE + `status='published'` |
| Unpublish | `DELETE` | `status='archived'`, baris dan slug utuh |
| Publish ulang | ditolak 403 | restore `status='published'`, slug sama |
| Hapus permanen | — | `DELETE`, dengan konfirmasi, slug dilepas |

Entitlement: `portfolio_trial_uses` **dihapus** (termasuk file SQL yang tidak pernah ada).
Aturan baru menghitung `portfolio_pages` dengan `status='published'`:

| Paket | Portfolio aktif |
|---|---|
| Free | 1 |
| `portfolio_web` | 5 |
| Premium / Bundle / Business | 5 |

Kuota ini **berbeda** dari `limits.portfolio_web` di `src/lib/access.ts`, yang saat ini
berarti kuota panggilan AI per bulan (free `false`, `portfolio_web` 1, premium
`unlimited`). Kuota portfolio aktifadalah field baru sebagai field baru
`maxActivePortfolios` pada definisi paket, supaya tidak menabrak makna lama yang sudah
dipakai route `/api/portfolio/suggest`.

Draft, preview, export HTML, print, dan unpublish tidak pernah memakai kuota. Menutup dan
membuka kembali juga tidak memakai kuota. Gate dihitung dari baris published, bukan dari
marker sekali-pakai, jadi tidak bisa dilewati dan tidak bisa kehilangan hak secara tidak
sengaja.

`PublishDialog.refresh()` yang fail-open (asumsi kuota tersedia saat fetch gagal) diganti:
state `unknown` yang menampilkan tombol Publish nonaktif sampai konfirmasi sukses.

### 7. Distribusi

- `generateMetadata` di `/p/[slug]` memakai `seo.pageTitle` lalu `seo.keywords` bila ada
  (keduanya sudah dihasilkan AI sejak lama lalu dibuang), dengan fallback ke nama dan
  `heroBio`. Menambah `canonical`.
- **OG image:** `GET /api/portfolio/og/[slug]` memakai `ImageResponse` dari `next/og`.
  Komposisinya mengikuti tema: warna `theme.colors`, nama, headline, foto (di-fetch dari
  aset), dan aksen. Ukuran 1200×630.
- `sitemap.ts` menambahkan semua `portfolio_pages` dengan `status='published'`.
- `robots.ts` baru: izinkan `/p/` dan `/api/portfolio/assets/`, larang
  `/portfolio/build`, `/portfolio/live`, `/portfolio/preview`, `/api/`.
- `TitleUpdater` di root layout dikecualikan untuk path `/p/` dan `/api/` — sekarang ia
  menimpa title per-portfolio dengan judul generik situs.

### 8. Print dan PDF

Tombol **"Simpan PDF"** membuka `/p/slug?print=1` (atau route print lokal untuk draft
belum terbit) dengan print stylesheet:

```css
@media print {
  @page { size: A4; margin: 12mm; }
  .pf-atmosphere { display: none !important; }   /* grain, orb, particle */
  .pf-chrome     { display: none !important; }   /* nav builder, tombol */
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pf-card       { break-inside: avoid; box-shadow: none !important; }
  h1, h2, h3     { break-after: avoid; }
}
```

`box-shadow` dan `backdrop-filter` dimatikan saat print karena keduanya tidak tercetak di
browser dan menghasilkan kotak abu-abu. `?print=1` memaksa `mode="static"`.

Mengapa bukan headless Chromium: repo sudah punya `pdf-server` terpisah dengan
`puppeteer-core` untuk CV, sementara menambahnya ke Next.js di Vercel berarti binary
300 MB dan cold start. Print view memberi hasil yang dijamin identik dengan halaman,
berjalan offline, nol biaya server.

### 9. Perbaikan AI yang masuk spec ini

- `src/lib/portfolio/ai-map.ts` — satu fungsi `applyAiSuggestion(state, response)` yang
  memetakan respons bersarang API ke bentuk datar `PortfolioData`. Semua pemanggil
  (``build`` dan ``live``) memakainya. Bug `applyAllAi` yang menulis `formData.hero =
  {…}` hilang karena konstruktor mapping tinggal satu.
- Undo stack `useUndoStack` — setiap tindakan AI dan setiap bulk action mendorong snapshot;
  `Ctrl+Z` di editor. Membatasi 50 langkah.
- AI generate di `/portfolio/live` tidak lagi mengganti seluruh array `experiences`. Ia
  menggabungkan dan menampilkan diff per entri untuk diterima satu per satu.
- `fieldLabels` yang memetakan nama field datar yang tidak pernah dikembalikan API
  dihapus; label berasal dari mapping.

Pencegahan fabrikasi angka, badge provenance, dan perluasan polish ke 12 section adalah
Spec 4.

## Data flow

**Menyunting:**
`usePortfolioDraft(draftId)` → baca server (cache fallback) → state React → render
`PortfolioDocument mode="editor"` → perubahan → debounce 1200 ms → `PATCH
/api/portfolio/draft` + tulis cache.

**Menerbitkan:**
`PublishDialog` → validasi Zod client (UX) → `POST /api/portfolio/publish` → validasi Zod
server (otoritas) → cek entitlement → upsert `portfolio_pages` → kembalikan URL.

**Mengekspor:**
`GET /api/portfolio/export?draftId=` → muat draft + aset → inline gambar sebagai data URI →
`renderToStaticMarkup(<PortfolioDocument mode="static">)` → bungkus dokumen HTML →
`Content-Disposition: attachment`.

**Mencetak:**
`/p/slug?print=1` → `PortfolioDocument mode="static"` → stylesheet `@media print` →
dialog print browser.

## Penanganan error

| Situasi | Perilaku |
|---|---|
| Draft gagal dimuat | cache dipakai; banner offline; writer tetap aktif |
| Draft gagal disimpan | banner "menyimpan gagal" + tombol coba lagi; cache tetap punya data |
| Aset > 4 MB atau MIME salah | 413/415 dengan pesan yang menyebut batas |
| Aset hilang saat export | placeholder kotak + alt teks, bukan export gagal total |
| Slug dipakai user lain | 409 dengan saran slug alternatif, form tetap terbuka |
| Kuota portfolio habis | 403 + `upgradeUrl`; Portfolio **tidak** dihapus dari daftar |
| Metadata fetch gagal di dialog | tombol Publish nonaktif, bukan form menipu |
| Export gagal | pesan menyebut aset mana yang bermasalah |

## Migrasi

| File | Isi |
|---|---|
| `drizzle/0021_portfolio_drafts.sql` | `portfolio_drafts` + index `user_id` |
| `drizzle/0022_portfolio_assets.sql` | `portfolio_assets`, unik `(user_id, sha256)` |
| `drizzle/0023_portfolio_pages_lifecycle.sql` | tambah `status`, `published_at` nullable, indeks `(status)`, salin `portfolio_trial_uses` ke hitungan published lalu `DROP TABLE portfolio_trial_uses` |

Migrasi 0023 tidak perlu memindahkan data: `portfolio_trial_uses` praktis tidak pernah ada
di DB mana pun karena tidak ada file `.sql` yang pernah membuatnya, dan route yang
mengacunya akan dihapus bersamaan. `DROP TABLE IF EXISTS` dipakai supaya migrasi aman
di lingkungan mana pun. Kalau ternyata ada baris di suatu lingkungan, environment itu perlu
ditangani manual di luar migrasi — cukup sedikit, dan itu disengaja.

## Pengujian

| Area | Kasus |
|---|---|
| Skema Zod | payload valid; string melebihi batas; array melebihi batas; `endDate < startDate`; URL skema terlarang; slug terlarang; portfolio kosong |
| `SafeLink` | `javascript:` → tanpa href di static + badge di editor; `mailto:`/`tel:` lolos; domain telanjang mendapat prefiks; path relatif lolos |
| Renderer | `renderToStaticMarkup` 3 tema × 2 mode menghasilkan HTML mandiri dengan `<style>` inline; semua section terlihat muncul berurutan `sectionOrder`; `sectionVisibility` Hide bekerja |
| Export | `<img>` ada dan berupa data URI; font ter-link; aset yang hilang tidak mematikan export |
| Aset | upload → sha256 sama → URL sama; MIME ditolak; aset user lain 403 |
| Publish | publish → archive → publish mengembalikan slug sama; kuota free = 1 aktif; archive tidak menambah kuota; hard delete melepas slug |
| Undo | 50 langkah; AI apply bisa di-undo; state setelah undo identik dengan sebelum |
| Print | `@media print` mematikan `.pf-atmosphere`; snapshot CSS |
| Migrate | 0023 jalan pada DB dengan dan tanpa baris trial |

## Mutu — aturan yang wajib dijaga

Diterapkan selama pengerjaan, bukan di akhir:

- `src/components/portfolio/render/**` tidak boleh memakai literal `rounded-*`,
  `shadow-*`, `backdrop-blur`, atau warna hex. Semuanya lewat token tema (Spec 2
 ^*_sedapkan token layer-nya di sini agar tidak mengulang). Hardcode di dalam section
  yang ada sekarang adalah utang yang harus dihapus bertahap, dan tidak boleh bertambah.
- Tidak ada `text-[8px]` sampai `text-[11px]` di mana pun; batas bawah `text-xs`.
- Semua target sentuh minimal 44×44 di mobile. Handle drag yang hanya muncul saat hover
  harus punya padanan tombol atas/bawah yang selalu terlihat.
- Tidak ada kontrol mati. Elemen yang tampak bisa diklik harus punya handler; kalau belum
  ada, tampilkan sebagai teks biasa.
- Setiap bagian punya empty state yang mengarahkan ke aksi, bukan celah kosong.
- Copy dalam bahasa Indonesia yang lugas, bukan terjemahan harfiah.

## Copy portfolio yang sudah basi

`FeatureTabs.tsx:84-92` dan `PortfolioSpotlight.tsx:7-11` mengiklankan nama tema
"Modern Slate", "Minimal Dark", dan "Modern Blue" — tiga nama yang tidak ada di mana pun
dalam sistem tema sebenarnya. Landing page dan tab Fitur menampilkan janji yang tidak pernah ada. Spec 1 mengganti ketiganya dengan nama tema asli (Glassmorphism, Neo Brutal,
Editorial Luxe) beserta deskripsi singkat yang jujur. Perbaikan visual mockup di
`/portfolio` adalah Spec 2.

## Di luar cakupan

Headless PDF server-side · custom domain · subdomain · edit warna tema · import LinkedIn ·
revisi versi · kolaborasi · dan seluruh Spec 2-4.