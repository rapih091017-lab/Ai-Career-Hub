# Task 2 Report — `SafeLink` dan `SafeImg`

**Status:** DONE_WITH_CONCERNS
**Commit:** `0090270` — `feat(portfolio): SafeLink dan SafeImg menutup stored XSS`
**Branch/worktree:** `feature/portfolio-trust` @ `D:\ai-career-hub-portfolio-trust` (base `cdbfecd`)
**Tests:** 24 baru (9 dari brief + 15 adversarial), suite penuh 139/139 hijau (dari 115)

---

## 1. File yang berubah

### `src/components/portfolio/render/SafeLink.tsx` (baru, 108 baris)

Mengimplementasikan persis interface di brief (`SafeLink`, `SafeImg`, `SafeRenderMode`) dengan tiga perubahan dari kode brief — semuanya dibuktikan oleh test, bukan tebakan (lihat §4):

1. **`fromSafeUrl()`** — membalik entity HTML yang ditambahkan `safeUrl()`/`esc()` sebelum nilainya masuk ke React. Tanpa ini setiap `&` di URL jadi `&amp;amp;` di DOM. Alasan teknis ada di docstring fungsi.
2. **`rel="noopener noreferrer"` sekarang dipasang saat `target` ada ATAU href eksternal http(s)** — bukan hanya saat eksternal. Versi brief meninggalkan `target="_blank"` tanpa `rel` pada path relatif, yang tetap membuka `window.opener`.
3. **Data URI SVG ditolak** — allowlist jadi `^data:image/(png|jpeg|jpg|webp|gif);base64,` (lihat §5).
4. Badge "tautan ditolak" memakai token desain `bg-error-container text-on-error-container`, bukan `rounded bg-red-100 text-red-700` dari brief — brief melanggar constraint global "no literal `rounded-*` / warna hex di `render/**`". Ada test yang menjaga ini.

Struktur lain (mode `editor` vs `static`, placeholder `SafeImg`, `loading="lazy"`, `data-editor-mode`) mengikuti brief apa adanya.

### `src/__tests__/portfolio-safe-link.test.tsx` (baru, 24 test)

9 test brief ditulis persis apa adanya (nama, urutan, dan isi assertion tidak diubah), lalu 15 test adversarial ditambahkan.

---

## 2. Perintah & output nyata

**Step 2 — RED (test gagal sebelum ada implementasi):**

```
$ npx vitest run src/__tests__/portfolio-safe-link.test.tsx
 ❯ src/__tests__/portfolio-safe-link.test.tsx (0 test)
⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯
 FAIL  src/__tests__/portfolio-safe-link.test.tsx [ src/__tests__/portfolio-safe-link.test.tsx ]
Error: Failed to resolve import "@/components/portfolio/render/SafeLink" from
"src/__tests__/portfolio-safe-link.test.tsx". Does the file exist?
 Test Files  1 failed (1)
      Tests  no tests
```

**Step 4 — GREEN:**

```
$ npx vitest run src/__tests__/portfolio-safe-link.test.tsx
 Test Files  1 passed (1)
      Tests  24 passed (24)
   Duration  1.22s
```

**Step 5 — suite penuh + typecheck + lint:**

```
$ npm test
 Test Files  10 passed (10)
      Tests  139 passed (139)

$ npx tsc --noEmit
TSC OK

$ npx eslint src/components/portfolio/render/SafeLink.tsx src/__tests__/portfolio-safe-link.test.tsx
  103:5  warning  Using `<img>` ... @next/next/no-img-element
✖ 1 problem (0 errors, 1 warning)
```

Commit: `git add` kedua file → `git commit -m "feat(portfolio): SafeLink dan SafeImg menutup stored XSS"` → `[feature/portfolio-trust 0090270]` 2 files changed, 328 insertions.

---

## 3. Deviasi dari brief + alasannya

| Deviasi | Alasan |
|---|---|
| `fromSafeUrl()` membalik entity sebelum masuk React | `safeUrl()` mengembalikan output `esc()` — didokumentasikan sebagai "konteks atribut HTML". React menulis atribut lewat `setAttribute()`, tidak ada parser HTML, jadi nilai yang sudah ter-escape akan ter-escape dua kali. Dikonfirmasi empiris, bukan dugaan (§4). |
| `rel` dipasang juga saat `target` diberikan pada link non-eksternal | `window.opener` di-set untuk `_blank` terlepas dari origin. Link relatif adalah same-origin, jadi ini bukan tabnabbing lintas-origin, tapi tetap membuka handle ke halaman portofolio. `rel` tidak ada efek samping bila `target` tidak `_blank`. |
| `rounded bg-red-100 text-red-700` → `bg-error-container text-on-error-container` | Constraint global melarang `rounded-*` dan warna literal di `render/**`. `error-container` / `on-error-container` ada di `tailwind.config.ts`. |
| `svg+xml` dihapus dari allowlist data URI | Lihat §5. |
| 15 test tambahan | Diminta eksplisit ("think adversarially... if you find a hole, fix it and add the test that proves it"). |

`target` sengaja **tidak** di-whitelist ke `_blank`/`_self`. Nilainya developer-controlled, dan whitelist berisiko merusak task berikutnya yang mungkin memakai named target (mis. preview editor). `rel` dipasang kapan pun `target` truthy, jadi whitelist tidak Adds keamanan apa pun.

---

## 4. Bukti bug double-escape (bukan asumsi)

Untuk membuktikan test §3 bukan test vakum, implementasi sengaja dikembalikan ke versi brief (`href={safe}`) dan suite dijalankan ulang:

```
 ❯ src/__tests__/portfolio-safe-link.test.tsx (24 tests | 1 failed)
   × tidak meng-escape ganda tanda & pada query string
 Expected the element to have attribute:
 ❯ src/__tests__/portfolio-safe-link.test.tsx:73:38
      Tests  1 failed | 23 passed (24)
```

Artinya kode brief akan membuat `https://example.com/p?utm_source=portofolio&utm_medium=link` tersimpan sebagai `...&amp;utm_medium=link` di DOM — query string rusak dan setiap URL ber-parameter tracking rusak.CTLalu dikembalikan ke `fromSafeUrl(safe)` dan 24/24 hijau.

Test SafeImg yang sama (`src` dengan `&`) juga guarding jalur itu.

---

## 5. Keputusan: `data:image/svg+xml`

**Ditolak.** Allowlist jadi `^data:image/(png|jpeg|jpg|webp|gif);base64,`.

Alasan:
- `/api/upload/route.ts:19` hanya menerima `image/jpeg, image/png, image/webp, image/gif`. Tidak ada sumber SVG yang sah di sistem, jadi mengizinkannya hanya menambah attack surface tanpa kasus pakai.
- Task hilir meng-inline aset jadi data URI untuk export HTML mandiri. Data URI yang lolos dari komponen React akan ikut terbawa ke file export. Jika satu bagian pipeline memperlakukan string itu sebagai markup (atau ditransplantasi ke `<svg>` inline), SVG membawa `<script>`/`<foreignObject>`/`onload`.
- "SVG di `<img src>` tidak mengeksekusi script" itu benar, tapi hanya berlaku selama nilainya tidak pernah keluar dari konteks `<img>`. Komponen ini adalah gerbang untuk semua task hilir, dan fail-closed lebih murah daripada mengaudit setiap konsumen.

Konsekuensi yang diketahui dan diterima: placeholder "gambar tidak dapat ditampilkan" muncul untuk SVG. Jika produk nanti mengizinkan upload SVG, allowlist ini adalah tempat yang perlu ditinjau ulang — dan harus lewat relaxasi allowlist upload lebih dulu.

---

## 6. Test adversarial yang ditambahkan (15)

SafeLink: double-escape `&`; trim spasi; skema/host huruf besar (`HTTPS://EXAMPLE.COM`); `rel` pada path relatif + `target="_blank"`; `rel` pada link eksternal tanpa `target`; injeksi header CRLF pada `mailto:` (`"mailto:a@b\r\nBcc: ..."` → ditolak, karena `safeUrl` membuang 0x00–0x1F sebelum cabang apa pun); bypass `/\evil.com`, `/<TAB>/evil.com`, `//evil.com`; `href={undefined as unknown as string}` (runtime undefined meski tipenya `string`); badge editor memakai token desain tanpa `rounded`/hex/warna palet.

SafeImg: data URI raster base64 diterima; `data:image/svg+xml` ditolak; `data:text/html` ditolak; double-escape `&` pada `src`; placeholder muncul juga di mode `editor`; `src={undefined}` tidak crash.

Semua test memberi-motor nyata (React Testing Library + DOM assertions), tanpa mock.

---

## 7. Temuan self-review yang diperbaiki

1. **Double-escaping** (§4) — ditemukan saat menulis test, diperbaiki di implementasi.
2. **`target="_blank"` tanpa `rel`** pada link relatif — celah `window.opener`; diperbaiki + 1 test.
3. **`rounded` + palet merah literal** di badge editor — melanggar constraint global; diganti token desain + test yang menyisir `innerHTML` untuk `rounded|red-\d|hex`.
4. **`SafeImg` meneruskan `value` mentah untuk data URI** di kode brief — pada allowlist lama (`data:image/png;` tanpa `base64`) itu bisa menjadi vektor kedua. Di versi ini allowlist mewajibkan `;base64,` dan data URI tidak lewat `esc()` sama sekali.

Yang diperiksa dan dinyatakan aman: `safeUrl` sudah menolak backslash dan karakter kontrol ASCII sebelum cabang mana pun, jadi normalisasi backslash menjadi slash dan stripping tab/newline oleh browser tidak bisa dieksploitasi; uppercase skema ditangani `/i`; `target` sengaja tidak di-whitelist (§3).

---

## 8. Concern

1. **`safeUrl()` melayani dua konteks yang berbeda.** Sekarang `safeUrl()` mengembalikan output `esc()` yang ditujukan untuk export HTML, sementara jalur React butuh nilai mentah. Saya selesaikan di sisi konsumen (`fromSafeUrl`). Cleaner: tambah `safeUrlRaw()` di `portfolio-safety.ts` dan jadikan `safeUrl()` pembungkus `esc()`-nya — tapi file itu di luar Files section brief, jadi **tidak saya sentuh**. Kalau task berikutnya memakai `safeUrl()` langsung di JSX, ia akan mengulang bug yang sama; pola yang benar adalah `SafeLink`/`SafeImg` saja.
2. **`SafeImg` memakai `<img>`** → warning `@next/next/no-img-element`. Sengaja: `next/image` butuh allowlist `remotePatterns` dan tidak menerima data URI. Kalau tim ingin warning hilang, tambahkan `// eslint-disable-next-line` dengan komentar alasan, atau konfigurasi exception di `eslint.config`.
3. **`SafeImg` tidak membedakan mode di placeholder.** Di `mode="editor"` placeholder tampil tanpa badge penjelasan (berbeda dari `SafeLink` yang memberi badge). Cukup informatif menurut saya (teksnya sudah eksplisit), tapi kalau editor perlualasannya, itu penambahan kecil.
4. **Belum ada konsumen.** Section components masih render `href`/`src` langsung; konversi ke `SafeLink`/`SafeImg` adalah pekerjaan task hilir seperti yangBrief nyatakan.
5. **`antislop` tidak dijalankan.** `AGENTS.md` meminta konfirmasi kapan ia berlaku (UI/copy/komentar kode). Brief memuat komentar dan className secara verbatim, jadi saya tidak mengubahnya. Kalau mau dijalankan, paling pas setelah task 3+ saat section components benar-benar disentuh.
6. **Preferensi baris akhir**: git memperingatkan LF→CRLF pada kedua file (attr repo Windows). Tidak ada perubahan disengaja.

## Fix wave 1

### Yang berubah

- `src/lib/portfolio-safety.ts`: logika validasi diekstrak ke helper privat `resolveUrl()` yang mengembalikan URL tervalidasi **tanpa** escaping. Dua fungsi publik di atasnya:
  - `safeUrl(v)` — `esc(resolveUrl(v))`. Perilaku dan tes lamanya **tidak berubah sama sekali**, hanya badannya yang dipindah.
  - `safeUrlUnescaped(v)` — `resolveUrl(v)` apa adanya. Fungsi baru.
- `src/components/portfolio/render/SafeLink.tsx`: `fromSafeUrl()` **dihapus**. `SafeLink` sekarang memanggil `safeUrlUnescaped()`, dan cabang URL pada `SafeImg` memakai `safeUrlUnescaped(value)` menggantikan `fromSafeUrl(safeUrl(value))`.

Logika validasi tidak disentuh. Guard `URL_UNSAFE_CHARS`, penolakan protocol-relative `//host`, penolakan `javascript:` dan `data:`, serta prefiks `https://` untuk domain telanjang semuanya pindah apa adanya ke `resolveUrl()`. Karena kedua fungsi publik memanggil helper yang sama, mustahil satu Receives input valid sementara yang lain menolaknya.

### Nama fungsi baru: `safeUrlUnescaped`

Dipilih karena paling pendek yang masih jujur pada setiap call site. Pasangan nama itu sendiri yang menjelaskan bedanya — `safeUrlUnescaped(x)` terbaca sebagai "validasi URL, tanpa escape" dalam sekali lihat, tanpa perlu membuka doc comment. Kandidat yang saya tolak: `safeUrlAttr` (menyiratkan ada kondisi ketika varian mentah boleh dipakai) dan `jsxSafeUrl` (mengikat API keamanan ke satu framework, padahal aturan ini berlaku untuk semua DOM API yang menulis atribut lewat `setAttribute`).

Laporan Task 2 mengusulkan `safeUrlRaw()`. Itu juga bekerja, tapi kata "raw" tidak langsung menunjuk ke apa yang membuat keduanya berbeda — hanya nama `safeUrlUnescaped` yang memakai kata yang sama dengan doc comment di atasnya.

### Apakah `esc()` masih dibutuhkan

Ya, dan jalur export HTML yang menjadi alasan esc-nya masih hidup. `src/app/portfolio/preview/page.tsx` membangun string HTML mandiri (`<!DOCTYPE html>` di baris 156, lalu `new Blob(...)` dan `a.download` di baris 316-320) dan memakainya `esc()` untuk sekitar 40 titik user content serta `safeUrl()` untuk setiap `href` di dalam string itu. Karena tidak ada React di sana, escaping di `safeUrl()` adalah satu-satunya lapisan yang menahan. Tidak dihapus.

### Bukti red-then-green

Sebelum implementasi, 6 tes baru gagal:

```
 Test Files  1 failed | 1 passed (2)
      Tests  6 failed | 42 passed (48)
TypeError: safeUrlUnescaped is not a function
 src/__tests__/portfolio-safety.test.ts:102:14
```

Tes "satu tingkat escape" di `portfolio-safe-link.test.tsx` sudah hijau sebelum perubahan. Itu memang tujuannya: ia mengunci perilaku yang sebelumnya dicapai oleh workaround `fromSafeUrl`, supaya penghapusan helper itu punya regression guard.

Setelah implementasi:

```
 Test Files  2 passed (2)
      Tests  48 passed (48)
```

### Perintah

`npm test` untuk seluruh repo:

```
 Test Files  10 passed (10)
      Tests  146 passed (146)
   Duration  5.03s
```

Naik dari 139 ke 146, seluruh tes lama tetap hijau tanpa disunting.

`npx tsc --noEmit`:

```
exit=0
```

### Kekhawatiran

1. **`esc()` masih diekspor dan masih mudah disalahpakai.** Fungsi ini tetap satu-satunya pertahanan di jalur export. Kalau task hilir memindahkan export ke React, `esc()` harus ikut hilang. Sampai saat itu kontraknya hanya hidup di doc comment.
2. **`schema.ts` baris 46 memakai `safeUrl(v) !== ""` hanya sebagai predikat validitas.** Tidak terpengaruh pemisahan ini, tapi nilai balik itu sekarang ikut ter-escape sebagai efek samping. Kalau ada yang nanti memeriksa nilai balik itu dan bukan hanya apakah input-nya valid, itu jebakan baru.
3. **Tes penolakan sengaja membandingkan langsung ke `safeUrl`** (`expect(safeUrlUnescaped(p)).toBe(safeUrl(p))`) alih-alih menyalin daftar payload. Jadi kalau validasi `safeUrl` diperketat belakangan, perbedaan apa pun akan langsung tertangkap.
4. **`antislop` tidak dijalankan.** `AGENTS.md` meminta konfirmasi kapan ia berlaku untuk pekerjaan komentar kode. Gelombang ini menambah doc comment dan tes dalam Bahasa Indonesia mengikuti gaya berkas yang sudah ada. Kalau `antislop` mau dijalankan, paling pas sekarang, sebelum doc comment ini jadi acuan di task-task berikutnya.

