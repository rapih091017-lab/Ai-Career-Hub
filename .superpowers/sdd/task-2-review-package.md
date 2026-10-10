# Review package task-2

Base: cdbfecd
Head: HEAD

## Commits

```
8b6810e fix(portfolio): gerbang data URI cocokkan magic number dengan tipe yang diklaim
f211a28 fix(portfolio): kebocoran data URI, kegagalan gambar ke AT, paritas safeUrl
42823ce refactor(portfolio): safeUrlUnescaped pisahkan konteks JSX dari konteks HTML
0090270 feat(portfolio): SafeLink dan SafeImg menutup stored XSS

```

## Diff stat

```
 .superpowers/sdd/task-2-report.md                  | 488 +++++++++++++++++++++
 src/__tests__/portfolio-safe-link.test.tsx         | 413 +++++++++++++++++
 src/__tests__/portfolio-safety.test.ts             | 150 ++++++-
 src/components/portfolio/render/SafeLink.tsx       | 250 +++++++++++
 .../portfolio/render/safe-render-mode.ts           |   8 +
 src/lib/portfolio-safety.ts                        |  64 ++-
 6 files changed, 1363 insertions(+), 10 deletions(-)

```

## Diff

```diff
diff --git a/.superpowers/sdd/task-2-report.md b/.superpowers/sdd/task-2-report.md
new file mode 100644
index 0000000..b4de6b1
--- /dev/null
+++ b/.superpowers/sdd/task-2-report.md
@@ -0,0 +1,488 @@
+﻿# Task 2 Report — `SafeLink` dan `SafeImg`
+
+**Status:** DONE_WITH_CONCERNS
+**Commit:** `0090270` — `feat(portfolio): SafeLink dan SafeImg menutup stored XSS`
+**Branch/worktree:** `feature/portfolio-trust` @ `D:\ai-career-hub-portfolio-trust` (base `cdbfecd`)
+**Tests:** 24 baru (9 dari brief + 15 adversarial), suite penuh 139/139 hijau (dari 115)
+
+---
+
+## 1. File yang berubah
+
+### `src/components/portfolio/render/SafeLink.tsx` (baru, 108 baris)
+
+Mengimplementasikan persis interface di brief (`SafeLink`, `SafeImg`, `SafeRenderMode`) dengan tiga perubahan dari kode brief — semuanya dibuktikan oleh test, bukan tebakan (lihat §4):
+
+1. **`fromSafeUrl()`** — membalik entity HTML yang ditambahkan `safeUrl()`/`esc()` sebelum nilainya masuk ke React. Tanpa ini setiap `&` di URL jadi `&amp;amp;` di DOM. Alasan teknis ada di docstring fungsi.
+2. **`rel="noopener noreferrer"` sekarang dipasang saat `target` ada ATAU href eksternal http(s)** — bukan hanya saat eksternal. Versi brief meninggalkan `target="_blank"` tanpa `rel` pada path relatif, yang tetap membuka `window.opener`.
+3. **Data URI SVG ditolak** — allowlist jadi `^data:image/(png|jpeg|jpg|webp|gif);base64,` (lihat §5).
+4. Badge "tautan ditolak" memakai token desain `bg-error-container text-on-error-container`, bukan `rounded bg-red-100 text-red-700` dari brief — brief melanggar constraint global "no literal `rounded-*` / warna hex di `render/**`". Ada test yang menjaga ini.
+
+Struktur lain (mode `editor` vs `static`, placeholder `SafeImg`, `loading="lazy"`, `data-editor-mode`) mengikuti brief apa adanya.
+
+### `src/__tests__/portfolio-safe-link.test.tsx` (baru, 24 test)
+
+9 test brief ditulis persis apa adanya (nama, urutan, dan isi assertion tidak diubah), lalu 15 test adversarial ditambahkan.
+
+---
+
+## 2. Perintah & output nyata
+
+**Step 2 — RED (test gagal sebelum ada implementasi):**
+
+```
+$ npx vitest run src/__tests__/portfolio-safe-link.test.tsx
+ ❯ src/__tests__/portfolio-safe-link.test.tsx (0 test)
+⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯
+ FAIL  src/__tests__/portfolio-safe-link.test.tsx [ src/__tests__/portfolio-safe-link.test.tsx ]
+Error: Failed to resolve import "@/components/portfolio/render/SafeLink" from
+"src/__tests__/portfolio-safe-link.test.tsx". Does the file exist?
+ Test Files  1 failed (1)
+      Tests  no tests
+```
+
+**Step 4 — GREEN:**
+
+```
+$ npx vitest run src/__tests__/portfolio-safe-link.test.tsx
+ Test Files  1 passed (1)
+      Tests  24 passed (24)
+   Duration  1.22s
+```
+
+**Step 5 — suite penuh + typecheck + lint:**
+
+```
+$ npm test
+ Test Files  10 passed (10)
+      Tests  139 passed (139)
+
+$ npx tsc --noEmit
+TSC OK
+
+$ npx eslint src/components/portfolio/render/SafeLink.tsx src/__tests__/portfolio-safe-link.test.tsx
+  103:5  warning  Using `<img>` ... @next/next/no-img-element
+✖ 1 problem (0 errors, 1 warning)
+```
+
+Commit: `git add` kedua file → `git commit -m "feat(portfolio): SafeLink dan SafeImg menutup stored XSS"` → `[feature/portfolio-trust 0090270]` 2 files changed, 328 insertions.
+
+---
+
+## 3. Deviasi dari brief + alasannya
+
+| Deviasi | Alasan |
+|---|---|
+| `fromSafeUrl()` membalik entity sebelum masuk React | `safeUrl()` mengembalikan output `esc()` — didokumentasikan sebagai "konteks atribut HTML". React menulis atribut lewat `setAttribute()`, tidak ada parser HTML, jadi nilai yang sudah ter-escape akan ter-escape dua kali. Dikonfirmasi empiris, bukan dugaan (§4). |
+| `rel` dipasang juga saat `target` diberikan pada link non-eksternal | `window.opener` di-set untuk `_blank` terlepas dari origin. Link relatif adalah same-origin, jadi ini bukan tabnabbing lintas-origin, tapi tetap membuka handle ke halaman portofolio. `rel` tidak ada efek samping bila `target` tidak `_blank`. |
+| `rounded bg-red-100 text-red-700` → `bg-error-container text-on-error-container` | Constraint global melarang `rounded-*` dan warna literal di `render/**`. `error-container` / `on-error-container` ada di `tailwind.config.ts`. |
+| `svg+xml` dihapus dari allowlist data URI | Lihat §5. |
+| 15 test tambahan | Diminta eksplisit ("think adversarially... if you find a hole, fix it and add the test that proves it"). |
+
+`target` sengaja **tidak** di-whitelist ke `_blank`/`_self`. Nilainya developer-controlled, dan whitelist berisiko merusak task berikutnya yang mungkin memakai named target (mis. preview editor). `rel` dipasang kapan pun `target` truthy, jadi whitelist tidak Adds keamanan apa pun.
+
+---
+
+## 4. Bukti bug double-escape (bukan asumsi)
+
+Untuk membuktikan test §3 bukan test vakum, implementasi sengaja dikembalikan ke versi brief (`href={safe}`) dan suite dijalankan ulang:
+
+```
+ ❯ src/__tests__/portfolio-safe-link.test.tsx (24 tests | 1 failed)
+   × tidak meng-escape ganda tanda & pada query string
+ Expected the element to have attribute:
+ ❯ src/__tests__/portfolio-safe-link.test.tsx:73:38
+      Tests  1 failed | 23 passed (24)
+```
+
+Artinya kode brief akan membuat `https://example.com/p?utm_source=portofolio&utm_medium=link` tersimpan sebagai `...&amp;utm_medium=link` di DOM — query string rusak dan setiap URL ber-parameter tracking rusak.CTLalu dikembalikan ke `fromSafeUrl(safe)` dan 24/24 hijau.
+
+Test SafeImg yang sama (`src` dengan `&`) juga guarding jalur itu.
+
+---
+
+## 5. Keputusan: `data:image/svg+xml`
+
+**Ditolak.** Allowlist jadi `^data:image/(png|jpeg|jpg|webp|gif);base64,`.
+
+Alasan:
+- `/api/upload/route.ts:19` hanya menerima `image/jpeg, image/png, image/webp, image/gif`. Tidak ada sumber SVG yang sah di sistem, jadi mengizinkannya hanya menambah attack surface tanpa kasus pakai.
+- Task hilir meng-inline aset jadi data URI untuk export HTML mandiri. Data URI yang lolos dari komponen React akan ikut terbawa ke file export. Jika satu bagian pipeline memperlakukan string itu sebagai markup (atau ditransplantasi ke `<svg>` inline), SVG membawa `<script>`/`<foreignObject>`/`onload`.
+- "SVG di `<img src>` tidak mengeksekusi script" itu benar, tapi hanya berlaku selama nilainya tidak pernah keluar dari konteks `<img>`. Komponen ini adalah gerbang untuk semua task hilir, dan fail-closed lebih murah daripada mengaudit setiap konsumen.
+
+Konsekuensi yang diketahui dan diterima: placeholder "gambar tidak dapat ditampilkan" muncul untuk SVG. Jika produk nanti mengizinkan upload SVG, allowlist ini adalah tempat yang perlu ditinjau ulang — dan harus lewat relaxasi allowlist upload lebih dulu.
+
+---
+
+## 6. Test adversarial yang ditambahkan (15)
+
+SafeLink: double-escape `&`; trim spasi; skema/host huruf besar (`HTTPS://EXAMPLE.COM`); `rel` pada path relatif + `target="_blank"`; `rel` pada link eksternal tanpa `target`; injeksi header CRLF pada `mailto:` (`"mailto:a@b\r\nBcc: ..."` → ditolak, karena `safeUrl` membuang 0x00–0x1F sebelum cabang apa pun); bypass `/\evil.com`, `/<TAB>/evil.com`, `//evil.com`; `href={undefined as unknown as string}` (runtime undefined meski tipenya `string`); badge editor memakai token desain tanpa `rounded`/hex/warna palet.
+
+SafeImg: data URI raster base64 diterima; `data:image/svg+xml` ditolak; `data:text/html` ditolak; double-escape `&` pada `src`; placeholder muncul juga di mode `editor`; `src={undefined}` tidak crash.
+
+Semua test memberi-motor nyata (React Testing Library + DOM assertions), tanpa mock.
+
+---
+
+## 7. Temuan self-review yang diperbaiki
+
+1. **Double-escaping** (§4) — ditemukan saat menulis test, diperbaiki di implementasi.
+2. **`target="_blank"` tanpa `rel`** pada link relatif — celah `window.opener`; diperbaiki + 1 test.
+3. **`rounded` + palet merah literal** di badge editor — melanggar constraint global; diganti token desain + test yang menyisir `innerHTML` untuk `rounded|red-\d|hex`.
+4. **`SafeImg` meneruskan `value` mentah untuk data URI** di kode brief — pada allowlist lama (`data:image/png;` tanpa `base64`) itu bisa menjadi vektor kedua. Di versi ini allowlist mewajibkan `;base64,` dan data URI tidak lewat `esc()` sama sekali.
+
+Yang diperiksa dan dinyatakan aman: `safeUrl` sudah menolak backslash dan karakter kontrol ASCII sebelum cabang mana pun, jadi normalisasi backslash menjadi slash dan stripping tab/newline oleh browser tidak bisa dieksploitasi; uppercase skema ditangani `/i`; `target` sengaja tidak di-whitelist (§3).
+
+---
+
+## 8. Concern
+
+1. **`safeUrl()` melayani dua konteks yang berbeda.** Sekarang `safeUrl()` mengembalikan output `esc()` yang ditujukan untuk export HTML, sementara jalur React butuh nilai mentah. Saya selesaikan di sisi konsumen (`fromSafeUrl`). Cleaner: tambah `safeUrlRaw()` di `portfolio-safety.ts` dan jadikan `safeUrl()` pembungkus `esc()`-nya — tapi file itu di luar Files section brief, jadi **tidak saya sentuh**. Kalau task berikutnya memakai `safeUrl()` langsung di JSX, ia akan mengulang bug yang sama; pola yang benar adalah `SafeLink`/`SafeImg` saja.
+2. **`SafeImg` memakai `<img>`** → warning `@next/next/no-img-element`. Sengaja: `next/image` butuh allowlist `remotePatterns` dan tidak menerima data URI. Kalau tim ingin warning hilang, tambahkan `// eslint-disable-next-line` dengan komentar alasan, atau konfigurasi exception di `eslint.config`.
+3. **`SafeImg` tidak membedakan mode di placeholder.** Di `mode="editor"` placeholder tampil tanpa badge penjelasan (berbeda dari `SafeLink` yang memberi badge). Cukup informatif menurut saya (teksnya sudah eksplisit), tapi kalau editor perlualasannya, itu penambahan kecil.
+4. **Belum ada konsumen.** Section components masih render `href`/`src` langsung; konversi ke `SafeLink`/`SafeImg` adalah pekerjaan task hilir seperti yangBrief nyatakan.
+5. **`antislop` tidak dijalankan.** `AGENTS.md` meminta konfirmasi kapan ia berlaku (UI/copy/komentar kode). Brief memuat komentar dan className secara verbatim, jadi saya tidak mengubahnya. Kalau mau dijalankan, paling pas setelah task 3+ saat section components benar-benar disentuh.
+6. **Preferensi baris akhir**: git memperingatkan LF→CRLF pada kedua file (attr repo Windows). Tidak ada perubahan disengaja.
+
+## Fix wave 1
+
+### Yang berubah
+
+- `src/lib/portfolio-safety.ts`: logika validasi diekstrak ke helper privat `resolveUrl()` yang mengembalikan URL tervalidasi **tanpa** escaping. Dua fungsi publik di atasnya:
+  - `safeUrl(v)` — `esc(resolveUrl(v))`. Perilaku dan tes lamanya **tidak berubah sama sekali**, hanya badannya yang dipindah.
+  - `safeUrlUnescaped(v)` — `resolveUrl(v)` apa adanya. Fungsi baru.
+- `src/components/portfolio/render/SafeLink.tsx`: `fromSafeUrl()` **dihapus**. `SafeLink` sekarang memanggil `safeUrlUnescaped()`, dan cabang URL pada `SafeImg` memakai `safeUrlUnescaped(value)` menggantikan `fromSafeUrl(safeUrl(value))`.
+
+Logika validasi tidak disentuh. Guard `URL_UNSAFE_CHARS`, penolakan protocol-relative `//host`, penolakan `javascript:` dan `data:`, serta prefiks `https://` untuk domain telanjang semuanya pindah apa adanya ke `resolveUrl()`. Karena kedua fungsi publik memanggil helper yang sama, mustahil satu Receives input valid sementara yang lain menolaknya.
+
+### Nama fungsi baru: `safeUrlUnescaped`
+
+Dipilih karena paling pendek yang masih jujur pada setiap call site. Pasangan nama itu sendiri yang menjelaskan bedanya — `safeUrlUnescaped(x)` terbaca sebagai "validasi URL, tanpa escape" dalam sekali lihat, tanpa perlu membuka doc comment. Kandidat yang saya tolak: `safeUrlAttr` (menyiratkan ada kondisi ketika varian mentah boleh dipakai) dan `jsxSafeUrl` (mengikat API keamanan ke satu framework, padahal aturan ini berlaku untuk semua DOM API yang menulis atribut lewat `setAttribute`).
+
+Laporan Task 2 mengusulkan `safeUrlRaw()`. Itu juga bekerja, tapi kata "raw" tidak langsung menunjuk ke apa yang membuat keduanya berbeda — hanya nama `safeUrlUnescaped` yang memakai kata yang sama dengan doc comment di atasnya.
+
+### Apakah `esc()` masih dibutuhkan
+
+Ya, dan jalur export HTML yang menjadi alasan esc-nya masih hidup. `src/app/portfolio/preview/page.tsx` membangun string HTML mandiri (`<!DOCTYPE html>` di baris 156, lalu `new Blob(...)` dan `a.download` di baris 316-320) dan memakainya `esc()` untuk sekitar 40 titik user content serta `safeUrl()` untuk setiap `href` di dalam string itu. Karena tidak ada React di sana, escaping di `safeUrl()` adalah satu-satunya lapisan yang menahan. Tidak dihapus.
+
+### Bukti red-then-green
+
+Sebelum implementasi, 6 tes baru gagal:
+
+```
+ Test Files  1 failed | 1 passed (2)
+      Tests  6 failed | 42 passed (48)
+TypeError: safeUrlUnescaped is not a function
+ src/__tests__/portfolio-safety.test.ts:102:14
+```
+
+Tes "satu tingkat escape" di `portfolio-safe-link.test.tsx` sudah hijau sebelum perubahan. Itu memang tujuannya: ia mengunci perilaku yang sebelumnya dicapai oleh workaround `fromSafeUrl`, supaya penghapusan helper itu punya regression guard.
+
+Setelah implementasi:
+
+```
+ Test Files  2 passed (2)
+      Tests  48 passed (48)
+```
+
+### Perintah
+
+`npm test` untuk seluruh repo:
+
+```
+ Test Files  10 passed (10)
+      Tests  146 passed (146)
+   Duration  5.03s
+```
+
+Naik dari 139 ke 146, seluruh tes lama tetap hijau tanpa disunting.
+
+`npx tsc --noEmit`:
+
+```
+exit=0
+```
+
+### Kekhawatiran
+
+1. **`esc()` masih diekspor dan masih mudah disalahpakai.** Fungsi ini tetap satu-satunya pertahanan di jalur export. Kalau task hilir memindahkan export ke React, `esc()` harus ikut hilang. Sampai saat itu kontraknya hanya hidup di doc comment.
+2. **`schema.ts` baris 46 memakai `safeUrl(v) !== ""` hanya sebagai predikat validitas.** Tidak terpengaruh pemisahan ini, tapi nilai balik itu sekarang ikut ter-escape sebagai efek samping. Kalau ada yang nanti memeriksa nilai balik itu dan bukan hanya apakah input-nya valid, itu jebakan baru.
+3. **Tes penolakan sengaja membandingkan langsung ke `safeUrl`** (`expect(safeUrlUnescaped(p)).toBe(safeUrl(p))`) alih-alih menyalin daftar payload. Jadi kalau validasi `safeUrl` diperketat belakangan, perbedaan apa pun akan langsung tertangkap.
+4. **`antislop` tidak dijalankan.** `AGENTS.md` meminta konfirmasi kapan ia berlaku untuk pekerjaan komentar kode. Gelombang ini menambah doc comment dan tes dalam Bahasa Indonesia mengikuti gaya berkas yang sudah ada. Kalau `antislop` mau dijalankan, paling pas sekarang, sebelum doc comment ini jadi acuan di task-task berikutnya.
+
+---
+
+## Fix wave 2
+
+**Commit:** `f211a28` — `fix(portfolio): kebocoran data URI, kegagalan gambar ke AT, paritas safeUrl`
+**Base:** `42823ce`
+**Tests:** 87 baru, suite penuh 233/233 hijau (dari 146)
+
+### Important 1 — kegagalan placeholder tidak terjangkau screen reader
+
+**Keputusan: pertahankan `role="img"`, rangkai `aria-label` dari alt + teks kegagalan.** Bukan buang role-nya.
+
+Alasannya: `role="img"` bukan sekadar dekorasi. Placeholder itu menggantikan ruang gambar — ia mewakili "di sinilah gambar yang seharusnya". Membuang role-nya membuat teknologi bantu memperlakukan kotak abu-abu itu sebagai teks biasa, pembaca screen reader kehilangan fakta bahwa ada gambar yang gagal dimuat, dan pesannya bercampur dengan konten lain. Dengan merangkai nama aksesibel, satu node gambar membawa dua informasi sekaligus: apa yang mestinya ada (alt) dan bahwa ia gagal dimuat.
+
+Memakai `aria-label` sebagai satu-satunya nama juga menghindari pengulangan: teks "gambar tidak dapat ditampilkan" tetap ada di DOM untuk mata, dan karena anak `role="img"` presentasional dia **tidak** diumumkan dua kali.
+
+Payload yang harus tertangani: `alt` kosong. Sebelumnya itu menghasilkan nama aksesibel kosong — praktis tidak ada yang diumumkan sama sekali. Sekarang label selalu minimal berisi teks kegagalan.
+
+```tsx
+const label = [
+  alt || null,
+  IMAGE_FAILED_TEXT,
+  mode === "editor" ? IMAGE_REJECTED_HINT : null,
+]
+  .filter(Boolean)
+  .join(" — ");
+```
+
+Tiga test baru menutupnya dengan `toHaveAccessibleName(...)` — yang memang menghitung nama aksesibel, bukan sekadar mencari teks di DOM: satu untuk alt terisi (nama memuat alt **dan** kegagalan), satu untuk alt kosong (nama tetap menyebut kegagalan), satu lagi memastikan `aria-label` tidak pernah kosong.
+
+### Important 2 — allowlist data URI hanya memvalidasi awalan
+
+`ALLOWED_DATA_IMAGE` diganti dua lapis: awalan MIME + **bodi**.
+
+```ts
+const DATA_IMAGE_PREFIX = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,/i;
+const BASE64_BODY = /^[A-Za-z0-9+/]+={0,2}$/;
+```
+
+`=` hanya boleh sebagai padding di ujung (`={0,2}` di akhir), jadi `iV=BOR` dan `iVBOR===` ikut ditolak — keduanya payload base64 yang rusak, bukan sekadar "huruf aneh". Tulisan lain (`"`, `'`, `<`, `&`, `\`, newline, `#`) tidak lolos. Pola lama `^data:image/(png|...)` juga diganti `(?:...)` supaya tidak ada capture group yang menyesatkan.
+
+**Nilai batas: `MAX_DATA_IMAGE_LENGTH = 7 * 1024 * 1024` (7 MiB = 7.340.032 karakter), diukur atas panjang URI keseluruhan.**
+
+Nilainya bukan tebakan "cukup lega". `/api/upload/route.ts:25` menolak file di atas 5 MB dan `:33` meng-encode-nya jadi `data:${type};base64,${base64}`. Base64 mengembang 4/3, jadi file 5 MB menghasilkan 6.666.668 karakter. 7 MiB duduk sedikit di atas angka itu (headroom untuk awalan `data:` dan tipe MIME yang memanjang), jadi gerbang ini **tidak pernah menolak hasil upload yang sah** — sementara tetap membatasi file HTML export mandiri yang meng-inline gambar. Batas yang lebih kecil (mis. 512 KiB atau 2 MiB) akan merusak jalur upload yang sudah ada: foto 2–5 MB akan hilang diganti placeholder, dan itu regresi nyata, bukan sekadar angka yang lebih rapi.
+
+Test batas: tepat-di-batas diterima, satu karakter di atas ditolak, keduanya memakai konstanta yang diekspor — tidak ada angka ajaib di test.
+
+### Important 3 — paritas baru diuji di sisi yang diterima
+
+Test lama membandingkan `safeUrlUnescaped(p) === safeUrl(p)` hanya atas payload yang memang ditolak, jadi ia hanya membuktikan `"" === ""`. Sekarang ada `PARITY_CORPUS` 36 entri dan `it.each` satu test per entri:
+
+```ts
+it.each(PARITY_CORPUS)("%s: kedua fungsi sepakat terima atau menolak", (_label, value) => {
+  expect(safeUrl(value) === "").toBe(safeUrlUnescaped(value) === "");
+});
+```
+
+Korpusnya dua sisi, 36 entri total. 15 entri diterima (https/http, query ber-`&`, karakter HTML di URL yang sah, path relatif, path relatif + query, path relatif uuid, root, domain telanjang dengan dan tanpa path, mailto, mailto ber-`%20`, tel, skema huruf besar, spasi tepi) dan 21 ditolak: 17 string (javascript:, data:text/html, data:image/png, vbscript:, file:, mailto CRLF literal, mailto CRLF ter-encode, protocol-relative dan protocol-relative plus path, backslash, tab, newline, CRLF, path relatif tanpa slash, `//`, string kosong, spasi saja) plus 4 non-string (`undefined`, `null`, angka, objek).
+
+Dua test penjaga tambahan. Satu memastikan korpus itu benar-benar memuat kedua sisi (`accepted.length > 0` dan `rejected.length > 0`), supaya suntingan di masa depan tidak diam-diam membuang sisi yang diterima dan mengembalikan cacat lama tanpa ada test yang gagal. Satu lagi mengunci bahwa varian yang meng-escape dan yang tidak **tetap berbeda** pada input ber-`&`, jadi "paritas" tidak dibaca orang sebagai "jadi identik".
+
+### Important 4 — test SVG sebelumnya tidak menguji SVG
+
+Payload diganti ke bentuk yang benar-benar base64:
+
+```
+data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9J2FsZXJ0KDEpJz48L3N2Zz4=
+```
+
+Payload lama `data:image/svg+xml,<svg onload='alert(1)'/>` tidak punya `;base64,` sama sekali, jadi ia ditolak oleh aturan mana pun — termasuk kalau satu-satunya aturan yang tersisa adalah "base64 itu wajib". Sekarang ini diuji dengan pasangan:
+
+- `data:image/svg+xml;base64,PHN2...` ditolak — payloadnya valid base64, yang salah MIME-nya.
+- `data:image/png;base64,PHN2...` **diterima** — payload identik, yang berbeda hanya MIME-nya.
+
+Kedua test itu tidak bisa lolos bersamaan kalau aturan SVG hilang, karena keduanya memakai payload yang sama persis.
+
+Kedua test ini hijau sebelum dan sesudah perubahan — memang begitulah guard test yang benar. Yang berubah adalah *apa yang mereka bedakan*: versi lama tidak bisa membedakan "SVG ditolak" dari "base64 wajib".
+
+### Minor
+
+| Temuan | Penyelesaian |
+|---|---|
+
+| `"use client"` tidak beralasan | Directive dihapus. Tidak ada hook, state, atau handler di kedua komponen, dan satu-satunya operasi DOM adalah `setAttribute` yang memang dikerjakan React. Nol konsumen di app code (hanya test yang mengimpor), jadi tidak ada yang butuh klien dan jadi rusak. |
+| `SafeRenderMode` di modul terpisah | Pindah ke `src/components/portfolio/render/safe-render-mode.ts`, type-only dan tanpa directive. `SafeLink.tsx` sengaja **tidak** me-re-export, sehingga import lama dari sana gagal di compile time dan task hilir diarahkan ke modul yang dijamin tidak akan pernah jadi client component. Kalau berkas komponen suatu saat acquire `"use client"`, import nilai apa pun darinya akan menarik grafik section ke client bundle secara diam-diam; dari modul baru itu mustahil terjadi. |
+| `resolveUrl` melempar pada `undefined` | Parameter jadi `unknown`, input non-string mengembalikan `""`. `esc()` sudah punya jaminan yang sama, jadi ini menyamakan dua hal, bukan menambah konsep baru. |
+| Injeksi header percent-encoded | `ENCODED_CRLF = /%(?:0d|0a)/i` diterapkan khusus di cabang `mailto:`, setelah guard karakter kontrol. Query mailto yang sah (`%20`) tetap lolos — ada test-nya. |
+| Affordance tautan ditolak | `inertClassName()` membalik token interaktif (`cursor-pointer` → `cursor-default`, `hover:underline` → `no-underline`) dan membuang variant `hover:`/`focus:`/`focus-visible:`/`active:`. Token non-interaktif (`text-primary`, `underline`, `font-semibold`) dipertahankan. Docstring menyatakan eksplisit: **cabang yang diterima memakai `className` apa adanya** — pemanggil yang bertanggung jawab atas gaya interaktif di sana, karena tautannya memang interaktif. |
+| Warning lint `<img>` | `// eslint-disable-next-line @next/next/no-img-element -- next/image tidak menerima data URI, dan aset lewat rute /api/portfolio/assets butuh remotePatterns.` Lint bersih. |
+| `mode` di `SafeImg` | Diberi perilaku, bukan dibuang: di `mode="editor"` placeholder menampilkan badge "ditolak: skema tidak diizinkan" dengan token desain yang sama seperti `SafeLink`, dan badge itu ikut masuk ke nama aksesibel. Ada test yang memastikan penjelasan itu **tidak** muncul di `mode="static"`. |
+| Baris akhir | Ditambahkan di kedua berkas yang diminta. |
+| Loop payload | `it.each` di `portfolio-safe-link.test.tsx` (bypass relative-url, data URI) dan di `portfolio-safety.test.ts` (skema terlarang, protocol-relative/backslash/kontrol). Kegagalan kini menyebut payloadnya sendiri. |
+| Copy | Badge penolakan memakai `&mdash;`, bukan hyphen ASCII. Test mengunci `\u2014` ada dan tidak ada `\s-\s`. |
+
+### Bukti red-then-green
+
+Implementasi sumber di-`git stash`, test baru dibiarkan di tempat, lalu suite dijalankan:
+
+```
+$ git stash push -- src/lib/portfolio-safety.ts src/components/portfolio/render/SafeLink.tsx
+$ npx vitest run src/__tests__/portfolio-safety.test.ts src/__tests__/portfolio-safe-link.test.tsx
+ Test Files  2 failed (2)
+      Tests  19 failed | 33 passed (52)
+
+ FAIL  .../portfolio-safe-link.test.tsx > SafeLink > menolak mailto dengan injeksi header CRLF yang ter-percent-encode
+ FAIL  .../portfolio-safe-link.test.tsx > SafeLink > memakai tanda baca yang benar pada badge penolakan
+ FAIL  .../portfolio-safe-link.test.tsx > SafeLink > melepas affordance interaktif pada tautan yang ditolak
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menyampaikan kegagalan ke teknologi bantu, bukan hanya ke mata
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > tetap menyampaikan kegagalan saat alt kosong
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > memakai nama aksesibel yang tidak kosong saat alt kosong
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan kutip
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan kutip tunggal
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan sudut
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan ampersand
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan backslash
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan newline
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan karakter di luar base64
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan padding di tengah
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan padding berlebih
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan body kosong
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI yang melebihi batas ukuran
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menerima data URI tepat di batas ukuran
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menampilkan placeholder di mode editor dan menjelaskan alasannya
+ FAIL  .../portfolio-safety.test.ts > safeUrl > menolak mailto dengan injeksi header CRLF yang ter-percent-encode
+ FAIL  .../portfolio-safety.test.ts > safeUrl / safeUrlUnescaped terhadap input non-string > ... (6 + 6)
+ FAIL  .../portfolio-safety.test.ts > paritas safeUrl vs safeUrlUnescaped > undefined / null / angka / objek: kedua fungsi sepakat terima atau menolak
+ FAIL  .../portfolio-safety.test.ts > paritas safeUrl vs safeUrlUnescaped > korpus paritas memuat kedua sisi, jangan hanya yang ditolak
+```
+
+(contoh kegagalan nyata dari salah satu kasus — payload berkutip lolos ke gate lama:)
+
+```
+ FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan kutip
+AssertionError: expected element(s) not to be in the document
+- Expected: null
+- Received: <img alt="Uji" src="data:image/png;base64,iVBOR&quot;" ⬦>
+```
+
+Lalu `git stash pop` dan suite yang sama:
+
+```
+ Test Files  2 passed (2)
+      Tests  135 passed (135)
+```
+
+### Perintah
+
+```
+$ npm test
+ Test Files  10 passed (10)
+      Tests  233 passed (233)
+   Duration  4.12s
+```
+
+146 → 233. Baseline 146 diverifikasi ulang dengan men-stash kelima berkas perubahan:
+
+```
+$ git stash push -u -- <5 berkas>   # baseline
+ Test Files  10 passed (10)
+      Tests  146 passed (146)
+```
+
+```
+$ npx tsc --noEmit
+tsc exit: 0
+
+$ npx eslint src/components/portfolio/render/SafeLink.tsx \
+             src/components/portfolio/render/safe-render-mode.ts \
+             src/lib/portfolio-safety.ts
+eslint exit: 0
+```
+
+Sebelum perubahan, `npx eslint src/components/portfolio/render/SafeLink.tsx` melaporkan:
+
+```
+  88:5  warning  Using `<img>` ⬦ @next/next/no-img-element
+✖ 1 problem (0 errors, 1 warning)
+```
+
+### Kekhawatiran
+
+1. **`schema.ts:46` tidak berubah perilakunya, dan itu perlu dicatat.** `urlField` memanggil `safeUrl(v)` di dalam `.refine()`, tapi hanya setelah `z.string()` dan `.transform(trim)` — jadi `v` dijamin string dan `typeof` check baru tidak pernah menyala di sana. Tidak ada perubahan perilaku, tidak ada perubahan file (`schema.ts` di luar scope). Yang berubah hanya untuk pemanggil yang belum tervalidasi: `preview/page.tsx:97` memanggil `safeUrl(p.link)` pada objek dari DB; kalau `p.link` ternyata `undefined`/null (baris lama, migrasi setengah jalan), sebelumnya `resolveUrl` melempar `TypeError` dan halaman preview crash, sekarang mengembalikan `""` dan tautannya di-skip. Itu perbaikan, tapi ia mengubah simptom: data rusak yang dulu terlihat sebagai crash sekarang tampil sebagai tautan yang hilang.
+2. **`MAX_DATA_IMAGE_LENGTH` masih diekspor dari berkas komponen.** Agar batasnya bisa diuji tanpa angka ajaib, konstantanya harus bisa di-import dari test, sedangkan scope hanya mengizinkan satu modul baru dan itu diminta type-only. Konsekuensinya, satu nilai runtime masih bisa di-import dari `render/SafeLink.tsx` tanpa menarik client boundary. Modul baru yang saya buat tetap type-only seperti yang diminta; ia bukan tempat konstanta runtime.
+3. **7 MiB tetap besar untuk satu gambar.** Yang dibatasi adalah satu gambar, bukan jumlah: portofolio dengan delapan foto 5 MB akan menghasilkan HTML export sekitar 50 MB. Gate ini menutup kasus yang paling sering muncul — satu aset raksasa atau payload buatan tangan — bukan masalah embed banyak foto besar sekaligus, dan itu keputusan produk tersendiri (kompres saat upload, atau tolak export di atas ambang).
+4. **`BASE64_BODY` tidak mewajibkan panjang kelipatan 4.** Base64 yang di-padatkan secara ketat akan menolaknya. Saya tidak menambahkannya karena aturan itu tidak perlu untuk payload dari `/api/upload` yang selalu padded, dan akan menolak base64 tanpa padding yang mungkin muncul nanti. Kalau nanti ada sumber data URI lain, tambahkan syarat kelipatan 4.
+5. **`inertClassName()` berbasis daftar token.** Ia mengenal `cursor-pointer` dan variant `hover/focus/active`, tapi utility interaktif yang tidak terdaftar tidak akan dibuang. Kontrak yang benar sudah tertulis di docstring — pemanggil yang mengirim kelas interaktif ke `SafeLink` bertanggung jawab atasnya — tetapi pemanggil yang tidak membaca docstring tetap bisa mendapat span yang terlihat bisa diklik.
+6. **`antislop` tetap belum dijalankan.** Gelombang ini menyentuh copy (badge `&mdash;`), UI (badge baru di placeholder `SafeImg`), dan komentar kode, yaitu tiga dari lima kategori yang disebut `AGENTS.md`. Suntingan copy-nya sengaja dibatasi pada satu glyph supaya diff tetap kecil, tapi kalau `antislop` mau dijalankan untuk section portfolio, sekarang momen yang tepat: dua berkas ini akan jadi template yang di-copy 13 task berikutnya.
+7. **`npm run build` tidak dijalankan.** Gate yang diminta adalah test dan tsc, keduanya bersih. Build baru jadi bukti nyata bahwa penghapusan `"use client"` aman untuk produksi, tapi belum ada app-code yang mengimpor `SafeLink`, jadi build hari ini tidak akan menyentuh berkas ini sama sekali. Buktinya baru akan muncul setelah task 3+.
+
+
+
+---
+
+## Fix wave 3
+
+### 1. Gerbang SVG tidak bisa dilewati dengan menukar label (Penting)
+
+`isAllowedDataImage()` kini memeriksa magic number, bukan cuma awalan dan alphabet base64. Urutannya: awalan harus cocok, body harus alphabet base64, lalu 32 karakter pertama body (24 byte) di-decode dengan `atob` dan dibandingkan dengan tipe yang diklaim. Tipe yang di-sniff: PNG (8 byte `89 50 4E 47 0D 0A 1A 0A`), JPEG (`FF D8 FF`, alias `jpg` dipetakan ke `jpeg`), GIF (`GIF87a`/`GIF89a`), WebP (`RIFF....WEBP`). Hanya 24 byte yang didecode, jadi payload 5 MB tidak ikut di-decode dan biaya sniff tetap konstan.
+
+### 2. Test yang mem-pinning bypass
+
+Test lama "menerima raster base64 dengan payload yang sama bentuknya, jadi aturan SVG yang diuji" dihapus: payload `data:image/png;base64,PHN2ZyBvbmxvYWQ9J2FsZXJ0KDEpJz48L3N2Zz4=` kini ditolak. Penggantinya:
+
+- `menolak svg yang dilabeli png: magic number tidak cocok dengan tipe yang diklaim` (payload identik, sekarang ditolak).
+- `menolak raster asli yang dilabeli format lain` (GIF asli berlabel png).
+- `it.each` 5 kasus: png, jpeg, jpg, gif, webp dengan magic number asli, semuanya diterima. Inilah yang membedakan aturan ini dari sekadar "tolak semua data URI".
+- Dua test lama memakai payload palsu (`"A+/9".repeat(8)` dan `"A".repeat(...)`, yang kebetulan lolos validasi lama). Keduanya diganti payload yang diawali tanda tangan PNG asli, supaya tetap menguji hal yang sama (huruf besar pada tipe MIME, batas ukuran) tanpa bergantung pada kelonggaran yang sudah tidak ada.
+
+### 3. Minor
+
+- Aritmetika `MAX_DATA_IMAGE_LENGTH` dikoreksi. Rute upload menolak file di atas `5 * 1024 * 1024` = 5.242.880 byte, bukan 5.000.000. Base64 menghasilkan 6.990.508 karakter (6.990.530 kalau awalan `data:image/...;base64,` ikut dihitung, karena gate membandingkan panjang seluruh URI). Angka pada brief (6.990.529) ikut dikoreksi. Margin tetap aman, bahkan lebih lega: 7.340.032 ada 349.524 karakter di atas payload terbesar yang sah.
+- `INTERACTIVE_VARIANT` sekarang menangani prefiks: `md:hover:`, `dark:focus-visible:`, `group-hover:`, `peer-active:` ikut dibuang. Docstring menyebut apa yang masih lolos (`data-hover-label`).
+- Komentar `"use client"` ditulis ulang: modul ini memang tidak butuh client boundary, tapi 12 section yang mengimpornya masih `"use client"` dan belum dierealisasi. Komentar tidak lagi menjanjikan server-rendering yang belum terjadi.
+- Ditambah test nama aksesibel mode editor (alt + teks kegagalan + alasan).
+- Test `toBeTruthy()` pada atribut `aria-label` diganti assertion exact-match yang membuktikan tidak ada pemisah sisa saat `alt` kosong.
+- Badge penolakan diseragamkan jadi `ditolak: skema tidak diizinkan` untuk tautan dan gambar. Alasannya pulled ke satu konstanta `REJECTED_REASON`.
+- `CATATAN:` jadi `Catatan:` (all-caps di komentar = teriak).
+
+### 4. Bukti red lalu hijau
+
+RED, sebelum implementasi:
+
+```
+$ npx vitest run src/__tests__/portfolio-safe-link.test.tsx
+ Tests  6 failed | 54 passed (60)
+ FAIL  SafeImg > menolak svg yang dilabeli png: magic number tidak cocok dengan tipe yang diklaim
+AssertionError: expected <img alt="Mislabel" …> to be null
+ FAIL  SafeImg > menolak raster asli yang dilabeli format lain
+ FAIL  SafeLink > melepas affordance interaktif yang berprefiks variant
+ FAIL  SafeLink > memperingatkan editor saat tautan ditolak
+ FAIL  SafeLink > menandai tautan ditolak dengan token desain, tanpa warna atau rounded literal
+ FAIL  SafeLink > memakai tanda baca yang benar pada badge penolakan
+```
+
+GREEN, sesudah:
+
+```
+$ npx vitest run src/__tests__/portfolio-safe-link.test.tsx
+ Tests  60 passed (60)
+
+$ npm test
+ Test Files  10 passed (10)
+      Tests  241 passed (241)
+
+$ npx tsc --noEmit
+tsc exit: 0
+
+$ npx eslint src/components/portfolio/render/SafeLink.tsx src/__tests__/portfolio-safe-link.test.tsx
+(clean, tanpa output)
+```
+
+233 -> 241 test, +8 net.
+
+### 5. Format: sniffed dan dikecualikan
+
+Sniffed: PNG, JPEG (`jpeg` + alias `jpg`), GIF, WebP. Dikecualikan: tidak ada. Empat tipe allowlist semuanya punya cek magic number, jadi tidak ada format yang lolos tanpa diperiksa. SVG tetap tidak ada di allowlist dan tidak bisa dimasukkan dengan menyamar sebagai raster.
+
+### 6. Pass antislop
+
+Skill yang dibaca: `antislop.md` (core, ada di worktree), `skills/antislop-code/SKILL.md` dan `skills/antislop-copywriting/SKILL.md` (folder `skills/` di worktree kosong, dibaca dari repo utama `D:\ai-career-hub\skills\`).
+
+- **R-02 (em dash) pada copy yang benar-benar dirender: TIDAK diubah.** Badge dan nama aksesibel masih memakai em dash (`&mdash;` dan `.join(" — ")`). Alasan: `&mdash;` adalah konvensi rumah di repo ini (`src/app/portfolio/preview/page.tsx:65,79`, `src/app/admin/*`), dan skill copywriting sendiri memberi carve-out "voice override": kalau sample pemilik repo memakai em dash, ikuti sample itu. Ada test yang mem-pinxnya sebagai pilihan tipografi yang disengaja (`memakai tanda baca yang benar pada badge penolakan`). Menghapusnya adalah keputusan copy pemilik, bukan perbaikan defect, dan di luar daftar minor yang diminta. Kalau owners mau R-02 ditegakkan di sini, perubahannya satu glyph di dua tempat plus dua test.
+- **Em dash di komentar kode: dibiarkan.** Komentar bukan teks yang dilihat orang, dan mengeditnya di luar blok yang sedang saya ubah hanya menambah noise.
+- **R-31 (setiap keputusan punya alasan tertulis)**: ini finding wave 2 yang paling sering muncul. Yang diperbaiki: komentar `"use client"` (sekarang hanya menyatakan kondisi nyata), docstring `INTERACTIVE_VARIANT` (sekarang menyebut apa yang lolos dan apa yang tidak), komentar aritmetika (sekarang angkanya benar).
+- **Stiff/loud wording**: `CATATAN:` -> `Catatan:`. Sisa komentar sudah pendek, sentence-case, dan menjelaskan kenapa, bukan apa.
+- **Comment density**: satu komentar per blok logis, tanpa separator dekoratif, tanpa emoji, tanpa end-marker, tanpa TODO kosong.
+- **R-36/C-5**: tidak ada klaim yang dikarang. Komentar hanya mengklaim apa yang kodenya lakukan.
+- **Tidak ada perubahan visual atau palet**: badge tetap memakai token desain, tidak ada warna literal, radius literal, atau gradient baru.
+
+### 7. Kekhawatiran
+
+1. **Sniffing hanya membaca 24 byte.** File polyglot (byte awal PNG tapi isi sebenarnya sesuatu yang lain, atau sebaliknya) tetap bisa lolos. Risikonya rendah untuk jalur ini: URI ini hanya pernah masuk lewat `<img src>`, dan `<img>` tidak pernah mengeksekusi skrip; PNG/JPEG/GIF/WebP yang asli tidak bisa membawa skrip. Yang dilindungi adalah file HTML export mandiri, dan di sana pun URI ini masuk sebagai atribut `src`, bukan markup yang dieksekusi. Kalau nanti ada jalur yang meng-inline data URI sebagai markup (bukan atribut), 24 byte tidak lagi cukup dan validasi penuh dibutuhkan.
+2. **`atob` jadi ambient global.** Tersedia di browser, jsdom, dan Node >= 16, tapi modul yang sebelumnya murni regex dan string sekarang bergantung pada global itu. Kalau dipakai di runtime tanpa `atob`, `decodeHead` mengembalikan `null` dan semua data URI ditolak: fail-closed, bukan fail-open.
+3. **Alias MIME lewat map.** `DECLARED_FORMAT` memetakan tipe MIME ke format hasil sniff. Menambah format ke `DATA_IMAGE_PREFIX` tanpa menambah entri map membuat format itu otomatis ditolak (`undefined` tidak pernah sama dengan hasil sniff), dan TypeScript tidak memberi error untuk itu. Kegagalan selalu ke arah yang aman, tapi tidak kelihatan saat compile.
+4. **Badge berubah dan itu terlihat.** Tiga test yang dulu mencari `/tautan ditolak/i` ikut diperbarui ke `/ditolak: skema tidak diizinkan/i`. Wave berikutnya yang me-copy berkas ini akan membawa copy itu ikut.
+5. **`npm run build` tidak dijalankan.** Gate yang diminta (test + tsc + eslint) semuanya bersih. Tidak ada app-code yang mengimpor `SafeLink` hari ini, jadi build tidak akan menyentuh berkas ini.
\ No newline at end of file
diff --git a/src/__tests__/portfolio-safe-link.test.tsx b/src/__tests__/portfolio-safe-link.test.tsx
new file mode 100644
index 0000000..be63609
--- /dev/null
+++ b/src/__tests__/portfolio-safe-link.test.tsx
@@ -0,0 +1,413 @@
+import "@testing-library/jest-dom/vitest";
+import { describe, it, expect } from "vitest";
+import { render, screen } from "@testing-library/react";
+import {
+  SafeLink,
+  SafeImg,
+  MAX_DATA_IMAGE_LENGTH,
+} from "@/components/portfolio/render/SafeLink";
+
+describe("SafeLink", () => {
+  it("merender tautan https tanpa perubahan", () => {
+    render(
+      <SafeLink href="https://github.com/teguh" mode="static">Repo</SafeLink>,
+    );
+    expect(screen.getByRole("link", { name: "Repo" })).toHaveAttribute(
+      "href",
+      "https://github.com/teguh",
+    );
+  });
+
+  it("tidak menghasilkan href untuk javascript: di mode static", () => {
+    render(<SafeLink href="javascript:alert(1)" mode="static">Jahat</SafeLink>);
+    expect(screen.queryByRole("link")).toBeNull();
+    expect(screen.getByText("Jahat")).toBeInTheDocument();
+  });
+
+  it("memberi prefiks https pada domain telanjang", () => {
+    render(
+      <SafeLink href="linkedin.com/in/teguh" mode="static">LinkedIn</SafeLink>,
+    );
+    expect(screen.getByRole("link")).toHaveAttribute(
+      "href",
+      "https://linkedin.com/in/teguh",
+    );
+  });
+
+  it("memperingatkan editor saat tautan ditolak", () => {
+    render(<SafeLink href="data:text/html,x" mode="editor">Fail</SafeLink>);
+    expect(screen.queryByRole("link")).toBeNull();
+    expect(screen.getByText(/ditolak: skema tidak diizinkan/i)).toBeInTheDocument();
+  });
+
+  it("membuka tautan eksternal di tab baru dengan rel aman", () => {
+    render(
+      <SafeLink href="https://example.com" mode="static" target="_blank">Ext</SafeLink>,
+    );
+    const a = screen.getByRole("link");
+    expect(a).toHaveAttribute("target", "_blank");
+    expect(a).toHaveAttribute("rel", "noopener noreferrer");
+  });
+
+  it("merender mailto dan tel", () => {
+    render(
+      <>
+        <SafeLink href="mailto:teguh@example.com" mode="static">Mail</SafeLink>
+        <SafeLink href="tel:+628123456789" mode="static">Tel</SafeLink>
+      </>,
+    );
+    expect(screen.getByRole("link", { name: "Mail" })).toHaveAttribute(
+      "href",
+      "mailto:teguh@example.com",
+    );
+    expect(screen.getByRole("link", { name: "Tel" })).toHaveAttribute(
+      "href",
+      "tel:+628123456789",
+    );
+  });
+
+  it("menolak mailto dengan injeksi header CRLF yang ter-percent-encode", () => {
+    render(
+      <SafeLink href="mailto:a@b?subject=x%0D%0ABcc:korban@example.com" mode="static">
+        Injeksi</SafeLink>,
+    );
+    expect(screen.queryByRole("link")).toBeNull();
+    expect(screen.getByText("Injeksi")).toBeInTheDocument();
+  });
+
+  it("tidak meng-escape ganda tanda & pada query string", () => {
+    render(
+      <SafeLink
+        href="https://example.com/p?utm_source=portofolio&utm_medium=link"
+        mode="static"
+      >
+        Kampanye</SafeLink>,
+    );
+    expect(screen.getByRole("link")).toHaveAttribute(
+      "href",
+      "https://example.com/p?utm_source=portofolio&utm_medium=link",
+    );
+  });
+
+  it("menyerialkan atribut href dengan satu tingkat escape", () => {
+    const { container } = render(
+      <SafeLink href="https://example.com/p?a=1&b=2" mode="static">Sekali</SafeLink>,
+    );
+    const html = container.innerHTML;
+    expect(html).toContain("&amp;");
+    expect(html).not.toContain("&amp;amp;");
+  });
+
+  it("memangkas spasi di sekitar URL", () => {
+    render(
+      <SafeLink href="   https://example.com/spasi   " mode="static">Spasi</SafeLink>,
+    );
+    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com/spasi");
+  });
+
+  it("mempertahankan huruf besar pada skema dan host", () => {
+    render(
+      <SafeLink href="HTTPS://EXAMPLE.COM/Portofolio" mode="static">Upper</SafeLink>,
+    );
+    expect(screen.getByRole("link")).toHaveAttribute(
+      "href",
+      "HTTPS://EXAMPLE.COM/Portofolio",
+    );
+  });
+
+  it("memberi rel aman pada tautan relatif yang dibuka di tab baru", () => {
+    render(
+      <SafeLink href="/p/teguh" mode="static" target="_blank">Relatif</SafeLink>,
+    );
+    const a = screen.getByRole("link");
+    expect(a).toHaveAttribute("target", "_blank");
+    expect(a).toHaveAttribute("rel", "noopener noreferrer");
+  });
+
+  it("memberi rel aman pada tautan eksternal tanpa target eksplisit", () => {
+    render(<SafeLink href="https://example.com" mode="static">Eksternal</SafeLink>);
+    expect(screen.getByRole("link")).toHaveAttribute("rel", "noopener noreferrer");
+  });
+
+  it("menolak mailto dengan injeksi header CRLF", () => {
+    render(
+      <SafeLink href="mailto:teguh@example.com\r\nBcc: korban@example.com" mode="static">
+        Injeksi</SafeLink>,
+    );
+    expect(screen.queryByRole("link")).toBeNull();
+    expect(screen.getByText("Injeksi")).toBeInTheDocument();
+  });
+
+  it.each([
+    ["backslash", "/\\evil.com"],
+    ["tab", "/\t/evil.com"],
+    ["protocol-relative", "//evil.com"],
+  ])("menolak bypass relative-url dengan %s", (_label, payload) => {
+    render(<SafeLink href={payload} mode="static">Bypass</SafeLink>);
+    expect(screen.queryByRole("link")).toBeNull();
+  });
+
+  it("tidak crash saat href undefined walau tipenya string", () => {
+    render(
+      <SafeLink href={undefined as unknown as string} mode="static">Kosong</SafeLink>,
+    );
+    expect(screen.queryByRole("link")).toBeNull();
+    expect(screen.getByText("Kosong")).toBeInTheDocument();
+  });
+
+  it("menandai tautan ditolak dengan token desain, tanpa warna atau rounded literal", () => {
+    const { container } = render(
+      <SafeLink href="vbscript:msgbox(1)" mode="editor">VBS</SafeLink>,
+    );
+    const badge = screen.getByText(/ditolak: skema tidak diizinkan/i);
+    expect(badge.className).toContain("bg-error-container");
+    expect(badge.className).toContain("text-on-error-container");
+    expect(container.innerHTML).not.toMatch(/rounded|red-\d|#[0-9a-f]{3,6}/i);
+  });
+
+  it("memakai tanda baca yang benar pada badge penolakan", () => {
+    render(<SafeLink href="vbscript:x" mode="editor">VBS</SafeLink>);
+    const badge = screen.getByText(/ditolak: skema tidak diizinkan/i);
+    expect(badge.textContent).toContain(":");
+    expect(badge.textContent).not.toMatch(/\s-\s/);
+  });
+
+  it("melepas affordance interaktif pada tautan yang ditolak", () => {
+    render(
+      <SafeLink
+        href="javascript:alert(1)"
+        mode="static"
+        className="text-primary hover:underline cursor-pointer underline"
+      >
+        mati
+      </SafeLink>,
+    );
+    const span = screen.getByText("mati");
+    expect(span.tagName).toBe("SPAN");
+    expect(span.className).toContain("text-primary");
+    expect(span.className).toContain("underline");
+    expect(span.className).not.toMatch(/cursor-pointer|hover:/);
+  });
+
+  it("melepas affordance interaktif yang berprefiks variant", () => {
+    render(
+      <SafeLink
+        href="javascript:alert(1)"
+        mode="static"
+        className="md:hover:underline dark:hover:underline group-hover:underline focus:underline font-semibold"
+      >
+        mati
+      </SafeLink>,
+    );
+    const span = screen.getByText("mati");
+    expect(span.className).toContain("font-semibold");
+    expect(span.className).not.toMatch(/hover:|focus:/);
+  });
+
+  it("tetap menempelkan class interaktif pada tautan yang diterima", () => {
+    render(
+      <SafeLink
+        href="https://example.com"
+        mode="static"
+        className="hover:underline cursor-pointer"
+      >
+        hidup
+      </SafeLink>,
+    );
+    const a = screen.getByRole("link");
+    expect(a.className).toContain("hover:underline");
+    expect(a.className).toContain("cursor-pointer");
+  });
+
+  it("mempertahankan class non-interaktif pada tautan ditolak di mode editor", () => {
+    render(
+      <SafeLink href="javascript:alert(1)" mode="editor" className="font-semibold">
+        tolak
+      </SafeLink>,
+    );
+    const inner = screen.getByText("tolak");
+    expect(inner.className).toContain("font-semibold");
+  });
+});
+
+describe("SafeImg", () => {
+  it("merender gambar yang diizinkan", () => {
+    render(
+      <SafeImg src="/api/portfolio/assets/abc" mode="static" alt="Foto Teguh" width={200} height={200} />,
+    );
+    expect(screen.getByAltText("Foto Teguh")).toBeInTheDocument();
+  });
+
+  it("mengganti gambar dengan skema terlarang menjadi placeholder", () => {
+    render(<SafeImg src="javascript:alert(1)" mode="static" alt="X" width={100} height={100} />);
+    expect(screen.queryByAltText("X")).toBeNull();
+    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
+  });
+
+  it("menampilkan placeholder saat src kosong", () => {
+    render(<SafeImg src="" mode="static" alt="Kosong" width={10} height={10} />);
+    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
+  });
+
+  it("menyampaikan kegagalan ke teknologi bantu, bukan hanya ke mata", () => {
+    render(
+      <SafeImg src="javascript:alert(1)" mode="static" alt="Foto Wisuda" width={100} height={100} />,
+    );
+    // role="img" membuat seluruh anak presentasional, jadi teks yang terlihat
+    // tidak akan diumumkan. Nama aksesibel harus memuat alt DAN kegagalannya.
+    expect(screen.getByRole("img")).toHaveAccessibleName(
+      /foto wisuda[\s\S]*gambar tidak dapat ditampilkan/i,
+    );
+  });
+
+  it("tetap menyampaikan kegagalan saat alt kosong", () => {
+    render(<SafeImg src="javascript:alert(1)" mode="static" alt="" width={100} height={100} />);
+    expect(screen.getByRole("img")).toHaveAccessibleName(
+      /gambar tidak dapat ditampilkan/i,
+    );
+  });
+
+  it("memakai nama aksesibel yang tepat tanpa pemisah tambahan saat alt kosong", () => {
+    render(<SafeImg src="javascript:alert(1)" mode="static" alt="" width={10} height={10} />);
+    expect(screen.getByRole("img")).toHaveAccessibleName(
+      "gambar tidak dapat ditampilkan",
+    );
+  });
+
+  it("menyertakan alasan penolakan pada nama aksesibel di mode editor", () => {
+    render(
+      <SafeImg src="vbscript:x" mode="editor" alt="Foto Skripsi" width={100} height={100} />,
+    );
+    expect(screen.getByRole("img")).toHaveAccessibleName(
+      /foto skripsi[\s\S]*gambar tidak dapat ditampilkan[\s\S]*skema tidak diizinkan/i,
+    );
+  });
+
+  it("menerima data URI gambar raster untuk export mandiri", () => {
+    const src = "data:image/png;base64,iVBORw0KGgo=";
+    render(<SafeImg src={src} mode="static" alt="Inlined" />);
+    expect(screen.getByAltText("Inlined")).toHaveAttribute("src", src);
+  });
+
+  it("menerima data URI base64 dengan padding dan karakter base64 penuh", () => {
+    const src = `data:image/png;base64,iVBORw0KGgoAAA${"+/9".repeat(8)}=`;
+    render(<SafeImg src={src} mode="static" alt="Alfabet" />);
+    expect(screen.getByAltText("Alfabet")).toHaveAttribute("src", src);
+  });
+
+  it("menolak data URI svg karena bisa membawa skrip, meski base64 valid", () => {
+    render(
+      <SafeImg
+        src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9J2FsZXJ0KDEpJz48L3N2Zz4="
+        mode="static"
+        alt="Svg"
+        width={50}
+        height={50}
+      />,
+    );
+    expect(screen.queryByAltText("Svg")).toBeNull();
+    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
+  });
+
+  it("menolak svg yang dilabeli png: magic number tidak cocok dengan tipe yang diklaim", () => {
+    const src = "data:image/png;base64,PHN2ZyBvbmxvYWQ9J2FsZXJ0KDEpJz48L3N2Zz4=";
+    render(<SafeImg src={src} mode="static" alt="Mislabel" />);
+    expect(screen.queryByAltText("Mislabel")).toBeNull();
+    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
+  });
+
+  it("menolak raster asli yang dilabeli format lain", () => {
+    const src = "data:image/png;base64,R0lGODlhAQABAIAAAA==";
+    render(<SafeImg src={src} mode="static" alt="Tukar label" />);
+    expect(screen.queryByAltText("Tukar label")).toBeNull();
+    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
+  });
+
+  it.each([
+    ["png", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=="],
+    ["jpeg", "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAA="],
+    ["jpg", "data:image/jpg;base64,/9j/4AAQSkZJRgABAQAAAQABAAA="],
+    ["gif", "data:image/gif;base64,R0lGODlhAQABAIAAAA=="],
+    ["webp", "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IA=="],
+  ])("menerima data URI %s yang magic number-nya cocok", (_label, src) => {
+    render(<SafeImg src={src} mode="static" alt="Raster" />);
+    expect(screen.getByAltText("Raster")).toHaveAttribute("src", src);
+  });
+
+  it.each([
+    ["kutip", "data:image/png;base64,iVBOR\""],
+    ["kutip tunggal", "data:image/png;base64,iVBOR'"],
+    ["sudut", "data:image/png;base64,<svg>"],
+    ["ampersand", "data:image/png;base64,iVBOR&x=1"],
+    ["backslash", "data:image/png;base64,iVBOR\\x"],
+    ["newline", "data:image/png;base64,iVBOR\nw0KGgo="],
+    ["karakter di luar base64", "data:image/png;base64,iVBOR#w0KGgo="],
+    ["padding di tengah", "data:image/png;base64,iV=BOR"],
+    ["padding berlebih", "data:image/png;base64,iVBOR==="],
+    ["body kosong", "data:image/png;base64,"],
+    ["tanpa base64", "data:image/png,iVBORw0KGgo="],
+  ])("menolak data URI dengan %s", (_label, src) => {
+    render(<SafeImg src={src} mode="static" alt="Uji" />);
+    expect(screen.queryByAltText("Uji")).toBeNull();
+    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
+  });
+
+  it("tetap menerima huruf besar pada tipe MIME", () => {
+    const src = "data:image/PNG;base64,iVBORw0KGgo=";
+    render(<SafeImg src={src} mode="static" alt="Upper" />);
+    expect(screen.getByAltText("Upper")).toHaveAttribute("src", src);
+  });
+
+  it("menolak data URI yang melebihi batas ukuran", () => {
+    const src = `data:image/png;base64,${"A".repeat(MAX_DATA_IMAGE_LENGTH)}`;
+    render(<SafeImg src={src} mode="static" alt="Raksasa" />);
+    expect(screen.queryByAltText("Raksasa")).toBeNull();
+    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
+  });
+
+  it("menerima data URI tepat di batas ukuran", () => {
+    const prefix = "data:image/png;base64,";
+    const signature = "iVBORw0KGgo";
+    const body = signature + "A".repeat(MAX_DATA_IMAGE_LENGTH - prefix.length - signature.length);
+    const src = prefix + body;
+    expect(src).toHaveLength(MAX_DATA_IMAGE_LENGTH);
+    render(<SafeImg src={src} mode="static" alt="Tepat batas" />);
+    expect(screen.getByAltText("Tepat batas")).toHaveAttribute("src", src);
+  });
+
+  it("menolak data URI non-gambar", () => {
+    render(
+      <SafeImg src="data:text/html;base64,PHNjcmlwdD4=" mode="static" alt="Html" />,
+    );
+    expect(screen.queryByAltText("Html")).toBeNull();
+  });
+
+  it("tidak meng-escape ganda tanda & pada src query", () => {
+    render(
+      <SafeImg src="/api/portfolio/assets/abc?w=200&h=200" mode="static" alt="Query" />,
+    );
+    expect(screen.getByAltText("Query")).toHaveAttribute(
+      "src",
+      "/api/portfolio/assets/abc?w=200&h=200",
+    );
+  });
+
+  it("menampilkan placeholder di mode editor dan menjelaskan alasannya", () => {
+    render(<SafeImg src="vbscript:x" mode="editor" alt="Edit" />);
+    expect(screen.queryByAltText("Edit")).toBeNull();
+    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
+    expect(screen.getByText(/skema tidak diizinkan/i)).toBeInTheDocument();
+  });
+
+  it("tidak menampilkan penjelasan penolakan di mode static", () => {
+    render(<SafeImg src="vbscript:x" mode="static" alt="Statis" />);
+    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
+    expect(screen.queryByText(/skema tidak diizinkan/i)).toBeNull();
+  });
+
+  it("tidak crash saat src undefined walau tipenya string", () => {
+    render(<SafeImg src={undefined as unknown as string} mode="static" alt="Undefined" />);
+    expect(screen.queryByAltText("Undefined")).toBeNull();
+    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
+  });
+});
diff --git a/src/__tests__/portfolio-safety.test.ts b/src/__tests__/portfolio-safety.test.ts
index bc6eb08..cdf70cf 100644
--- a/src/__tests__/portfolio-safety.test.ts
+++ b/src/__tests__/portfolio-safety.test.ts
@@ -1,12 +1,12 @@
 import { describe, it, expect } from "vitest";
-import { esc, safeUrl, isValidSlug } from "@/lib/portfolio-safety";
+import { esc, safeUrl, safeUrlUnescaped, isValidSlug } from "@/lib/portfolio-safety";
 
 describe("esc", () => {
   it("meng-escape karakter HTML berbahaya", () => {
     expect(esc(`<script>alert("x")</script>`)).toBe(
       `&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;`,
     );
   });
 
   it("meng-escape ampersand & apostrophe", () => {
     expect(esc(`Tom & Jerry's`)).toBe(`Tom &amp; Jerry&#39;s`);
@@ -62,26 +62,174 @@ describe("safeUrl", () => {
     expect(safeUrl("/\\evil.com")).toBe("");
     expect(safeUrl("/\\evil.com/path")).toBe("");
   });
 
   it("menolak karakter kontrol yang di-strip browser jadi slash", () => {
     expect(safeUrl("/\t/evil.com")).toBe("");
     expect(safeUrl("/\n/evil.com")).toBe("");
     expect(safeUrl("/\r\n/evil.com")).toBe("");
   });
 
+  it("menolak mailto dengan injeksi header CRLF yang ter-percent-encode", () => {
+    expect(safeUrl("mailto:a@b?subject=x%0D%0ABcc:korban@example.com")).toBe("");
+    expect(safeUrl("mailto:a@b?subject=x%0d%0aBcc:korban@example.com")).toBe("");
+    expect(safeUrl("mailto:a@b?body=%0ANama:%20Korban")).toBe("");
+  });
+
+  it("tetap menerima query mailto yang sah", () => {
+    expect(safeUrl("mailto:a@b.com?subject=Hello%20Dunia")).toBe(
+      "mailto:a@b.com?subject=Hello%20Dunia",
+    );
+  });
+
   it("tetap menerima path aset lokal yang sah", () => {
     const asset = "/api/portfolio/assets/6f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f";
     expect(safeUrl(asset)).toBe(asset);
   });
 });
 
+/**
+ * Non-string runtime tidak boleh membuat modul ini melempar. `esc()` sudah
+ * menerima `unknown`; `safeUrl` harus punya jaminan yang sama supaya pemanggil
+ * yang lupa memvalidasi (mis. baris DB lama) dapat hasil "", bukan exception.
+ */
+describe("safeUrl / safeUrlUnescaped terhadap input non-string", () => {
+  const nonStrings: [string, unknown][] = [
+    ["undefined", undefined],
+    ["null", null],
+    ["angka", 42],
+    ["boolean", true],
+    ["objek", { href: "https://example.com" }],
+    ["array", ["https://example.com"]],
+  ];
+
+  it.each(nonStrings)("safeUrl mengembalikan string kosong untuk %s", (_label, value) => {
+    expect(() => safeUrl(value)).not.toThrow();
+    expect(safeUrl(value)).toBe("");
+  });
+
+  it.each(nonStrings)("safeUrlUnescaped mengembalikan string kosong untuk %s", (_label, value) => {
+    expect(() => safeUrlUnescaped(value)).not.toThrow();
+    expect(safeUrlUnescaped(value)).toBe("");
+  });
+});
+
+/**
+ * Invarian yang dijaga wave perbaikan ini: kedua fungsi hanya berbeda di
+ * escaping, BUKAN di keputusan terima/tolak. Uji paritas harus menutup kedua
+ * sisi — input yang diterima maupun input yang ditolak, di setiap kelas
+ * penolakan — kalau tidak ia hanya menguji `"" === ""`.
+ */
+const PARITY_CORPUS: [string, unknown][] = [
+  // Diterima
+  ["https", "https://github.com/teguh"],
+  ["http", "http://example.com"],
+  ["query ber-&", "https://example.com/p?utm_source=portofolio&utm_medium=link"],
+  ["karakter HTML di URL sah", 'https://a.com/?q="><script>'],
+  ["path relatif", "/api/portfolio/assets/abc"],
+  ["path relatif + query", "/api/portfolio/assets/abc?w=200&h=200"],
+  ["path relatif uuid", "/api/portfolio/assets/6f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f"],
+  ["root", "/"],
+  ["domain telanjang + path", "linkedin.com/in/teguh"],
+  ["domain telanjang", "example.com"],
+  ["mailto", "mailto:teguh@example.com"],
+  ["mailto ber-encode", "mailto:a@b.com?subject=Hello%20Dunia"],
+  ["tel", "tel:+628123456789"],
+  ["huruf besar skema", "HTTPS://EXAMPLE.COM/Portofolio"],
+  ["spasi tepi dipangkas", "   https://example.com/spasi   "],
+  // Ditolak
+  ["javascript:", "javascript:alert(1)"],
+  ["data:text/html", "data:text/html,<script>1</script>"],
+  ["data:image/png", "data:image/png;base64,iVBORw0KGgo="],
+  ["vbscript:", "vbscript:msgbox(1)"],
+  ["file:", "file:///etc/passwd"],
+  ["mailto CRLF literal", "mailto:a@b.com\r\nBcc: korban@example.com"],
+  ["mailto CRLF ter-encode", "mailto:a@b?subject=x%0D%0ABcc:y@z"],
+  ["protocol-relative", "//evil.com"],
+  ["protocol-relative + path", "//evil.com/path"],
+  ["backslash", "/\\evil.com"],
+  ["tab", "/\t/evil.com"],
+  ["newline", "/\n/evil.com"],
+  ["CRLF", "/\r\n/evil.com"],
+  ["path relatif tanpa slash", "api/portfolio/assets/abc"],
+  ["path relatif dengan dua slash", "//"],
+  ["string kosong", ""],
+  ["spasi saja", "   "],
+  // Non-string
+  ["undefined", undefined],
+  ["null", null],
+  ["angka", 42],
+  ["objek", { href: "https://example.com" }],
+];
+
+describe("paritas safeUrl vs safeUrlUnescaped", () => {
+  it.each(PARITY_CORPUS)(
+    "%s: kedua fungsi sepakat terima atau menolak",
+    (_label, value) => {
+      expect(safeUrl(value) === "").toBe(safeUrlUnescaped(value) === "");
+    },
+  );
+
+  it("korpus paritas memuat kedua sisi, jangan hanya yang ditolak", () => {
+    const accepted = PARITY_CORPUS.filter(([, v]) => safeUrlUnescaped(v) !== "");
+    const rejected = PARITY_CORPUS.filter(([, v]) => safeUrlUnescaped(v) === "");
+    expect(accepted.length).toBeGreaterThan(0);
+    expect(rejected.length).toBeGreaterThan(0);
+  });
+});
+
+describe("safeUrlUnescaped", () => {
+  it("mengembalikan URL apa adanya untuk input sah ber-&", () => {
+    const url = "https://example.com/p?utm_source=portofolio&utm_medium=link";
+    expect(safeUrlUnescaped(url)).toBe(url);
+  });
+
+  it("tidak meng-escape tanda &, berbeda dari safeUrl", () => {
+    const url = "/api/portfolio/assets/abc?w=200&h=200";
+    expect(safeUrlUnescaped(url)).toBe(url);
+    expect(safeUrl(url)).toBe("/api/portfolio/assets/abc?w=200&amp;h=200");
+  });
+
+  it("tidak meng-escape karakter HTML di URL yang lolos validasi", () => {
+    const url = `https://a.com/?q="><script>`;
+    expect(safeUrlUnescaped(url)).toBe(url);
+    expect(safeUrl(url)).toBe(`https://a.com/?q=&quot;&gt;&lt;script&gt;`);
+  });
+
+  it("tetap memberi prefiks https pada domain telanjang", () => {
+    expect(safeUrlUnescaped("linkedin.com/in/teguh")).toBe("https://linkedin.com/in/teguh");
+  });
+
+  it.each([
+    ["javascript:", "javascript:alert(1)"],
+    ["data:text/html", "data:text/html,<script>1</script>"],
+    ["data:image/svg+xml", "data:image/svg+xml;base64,PHN2Zz4="],
+    ["vbscript:", "vbscript:msgbox(1)"],
+    ["mailto CRLF ter-encode", "mailto:a@b?subject=x%0D%0ABcc:y@z"],
+  ])("menolak skema terlarang %s seperti safeUrl", (_label, payload) => {
+    expect(safeUrlUnescaped(payload)).toBe("");
+    expect(safeUrlUnescaped(payload)).toBe(safeUrl(payload));
+  });
+
+  it.each([
+    ["protocol-relative", "//evil.com"],
+    ["protocol-relative + path", "//evil.com/path"],
+    ["backslash", "/\\evil.com"],
+    ["tab", "/\t/evil.com"],
+    ["newline", "/\n/evil.com"],
+    ["CRLF", "/\r\n/evil.com"],
+  ])("menolak %s seperti safeUrl", (_label, payload) => {
+    expect(safeUrlUnescaped(payload)).toBe("");
+    expect(safeUrlUnescaped(payload)).toBe(safeUrl(payload));
+  });
+});
+
 describe("isValidSlug", () => {
   it("menerima slug valid", () => {
     expect(isValidSlug("teguh-surya")).toBe(true);
     expect(isValidSlug("teguh123")).toBe(true);
   });
 
   it("menolak slug terlalu pendek / karakter ilegal", () => {
     expect(isValidSlug("ab")).toBe(false);
     expect(isValidSlug("Teguh")).toBe(false); // huruf besar
     expect(isValidSlug("teguh_surya")).toBe(false); // underscore
diff --git a/src/components/portfolio/render/SafeLink.tsx b/src/components/portfolio/render/SafeLink.tsx
new file mode 100644
index 0000000..99d5e76
--- /dev/null
+++ b/src/components/portfolio/render/SafeLink.tsx
@@ -0,0 +1,250 @@
+import { safeUrlUnescaped } from "@/lib/portfolio-safety";
+import type { SafeRenderMode } from "@/components/portfolio/render/safe-render-mode";
+
+/**
+ * Modul ini tidak butuh "use client": tidak ada hook, state, atau handler.
+ * Memaksakannya di sini akan menarik seluruh section yang mengimpor
+ * SafeLink/SafeImg ke client component, padahal komponennya sendiri
+ * server-safe. Menghapus "use client" dari section adalah pekerjaan terpisah.
+ */
+type SafeLinkProps = {
+  href: string;
+  mode: SafeRenderMode;
+  className?: string;
+  target?: string;
+  children: React.ReactNode;
+};
+
+/**
+ * Afordance interaktif yang dibalik pada cabang yang ditolak. `span` bukan
+ * elemen interaktif: `cursor-pointer`/`hover:underline` di atasnya hanya
+ * menjebak pointer dan keyboard tanpa aksi apa pun.
+ *
+ * Catatan: ini hanya berlaku pada cabang DITOLAK. Pada cabang yang diterima
+ * `className` pemanggil dipakai apa adanya — di situ tautannya memang
+ * interaktif, jadi gaya interaktif menjadi urusan pemanggil.
+ */
+const INTERACTIVE_CLASS_SWAPS = new Map([
+  ["cursor-pointer", "cursor-default"],
+  ["cursor-pointer-reset", "cursor-default"],
+  ["hover:cursor-pointer", "hover:cursor-default"],
+  ["hover:underline", "no-underline"],
+  ["hover:no-underline", "underline"],
+]);
+
+/**
+ * Variant interaktif yang dibuang, dengan atau tanpa prefiks: `hover:`,
+ * `md:hover:`, `dark:focus-visible:`, `group-hover:`, `peer-active:`. Yang lolos
+ * hanyalah nama utility yang memuat kata itu tanpa segmen variant, mis.
+ * `data-hover-label`.
+ */
+const INTERACTIVE_VARIANT = /(^|[:-])(hover|focus-visible|focus|active):/;
+
+function inertClassName(className: string | undefined): string | undefined {
+  if (!className) return className;
+  return className
+    .split(/\s+/)
+    .filter(Boolean)
+    .map((token) => {
+      const swap = INTERACTIVE_CLASS_SWAPS.get(token);
+      if (swap) return swap;
+      return INTERACTIVE_VARIANT.test(token) ? null : token;
+    })
+    .filter((token): token is string => token !== null)
+    .join(" ");
+}
+
+/** Alasan penolakan, sama untuk tautan dan gambar supaya badge konsisten. */
+const REJECTED_REASON = "skema tidak diizinkan";
+
+/**
+ * Satu-satunya jalan masuk user-supplied URL ke atribut href.
+ * Mode static: skema terlarang dirender jadi span tanpa href.
+ * Mode editor: skema terlarang diberi tanda merah supaya terlihat saat menyunting.
+ */
+export function SafeLink({ href, mode, className, target, children }: SafeLinkProps) {
+  const safe = safeUrlUnescaped(href ?? "");
+  const inert = inertClassName(className);
+
+  if (!safe) {
+    if (mode !== "editor") return <span className={inert}>{children}</span>;
+    return (
+      <span className="inline-flex flex-wrap items-center gap-1">
+        <span className={inert}>{children}</span>
+        <span className="bg-error-container px-1.5 py-0.5 text-xs font-medium text-on-error-container">
+          ditolak: {REJECTED_REASON}
+        </span>
+      </span>
+    );
+  }
+
+  const external = /^https?:\/\//i.test(safe);
+
+  return (
+    <a
+      href={safe}
+      className={className}
+      {...(target ? { target } : {})}
+      {...(target || external ? { rel: "noopener noreferrer" } : {})}
+    >
+      {children}
+    </a>
+  );
+}
+
+/**
+ * Batas panjang data URI gambar, dalam karakter. Rute upload (`/api/upload`)
+ * menolak file di atas 5 * 1024 * 1024 = 5.242.880 byte. Base64 menambah
+ * sekitar 4/3, jadi payload terbesar yang sah jadi 6.990.508 karakter
+ * (6.990.530 kalau awalan `data:image/...;base64,` ikut dihitung). 7 MiB
+ * (7.340.032) masih 349.524 karakter di atas itu, jadi gerbang ini tidak pernah
+ * menolak hasil upload yang sah, tapi tetap membatasi file HTML export mandiri
+ * yang meng-inline gambar. Foto beresolusi penuh pun sebaiknya lewat rute aset,
+ * bukan inline.
+ */
+export const MAX_DATA_IMAGE_LENGTH = 7 * 1024 * 1024;
+
+/**
+ * Data URI yang boleh: hanya format raster yang sama dengan hasil upload
+ * (`/api/upload`). SVG sengaja tidak ikut: markup-nya bisa membawa skrip, dan
+ * tidak ada sumber SVG yang sah di portofolio ini.
+ *
+ * Awalan saja tidak cukup. Prefiks `data:image/png;base64,` bisa diikuti apa
+ * saja, termasuk `"`, yang tepat menjadi attribute break-out saat URI ini
+ * di-inline ke file HTML export. Bodi-nya karena itu wajib benar-benar alphabet
+ * base64, dan byte hasil dekodenya harus cocok dengan tipe yang diklaim:
+ * tanpa pemeriksaan kedua, `data:image/png;base64,<svg onload=...>` menembus
+ * gerbang hanya dengan menukar labelnya.
+ */
+const DATA_IMAGE_PREFIX = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i;
+const BASE64_BODY = /^[A-Za-z0-9+/]+={0,2}$/;
+
+type RasterFormat = "png" | "jpeg" | "gif" | "webp";
+
+/** Alias MIME ke format yang di-sniff. Tiap tipe di allowlist wajib punya entri. */
+const DECLARED_FORMAT: Record<string, RasterFormat> = {
+  png: "png",
+  jpeg: "jpeg",
+  jpg: "jpeg",
+  gif: "gif",
+  webp: "webp",
+};
+
+/** 32 karakter base64 = 24 byte, cukup untuk semua tanda tangan di bawah. */
+const SNIFF_BASE64_CHARS = 32;
+
+const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
+const GIF_SIGNATURES = ["GIF87a", "GIF89a"];
+
+function ascii(bytes: Uint8Array, from: number, to: number): string {
+  let out = "";
+  for (let i = from; i < to; i++) out += String.fromCharCode(bytes[i]);
+  return out;
+}
+
+/** Format hasil bacaan magic number. `null` kalau tidak dikenali. */
+function sniffFormat(head: Uint8Array): RasterFormat | null {
+  if (head.length >= 8 && PNG_SIGNATURE.every((b, i) => head[i] === b)) return "png";
+  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "jpeg";
+  if (head.length >= 6 && GIF_SIGNATURES.includes(ascii(head, 0, 6))) return "gif";
+  if (head.length >= 12 && ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WEBP") {
+    return "webp";
+  }
+  return null;
+}
+
+/**
+ * Hanya kepala payload yang didecode: 32 karakter base64, bukan 7 MiB. Panjang
+ * dipotong ke kelipatan 4 karena `atob` menolak potongan yang tidak utuh.
+ */
+function decodeHead(body: string): Uint8Array | null {
+  const wanted = Math.min(body.length, SNIFF_BASE64_CHARS);
+  const take = wanted - (wanted % 4);
+  if (take < 4) return null;
+  try {
+    const binary = atob(body.slice(0, take));
+    const head = new Uint8Array(binary.length);
+    for (let i = 0; i < binary.length; i++) head[i] = binary.charCodeAt(i);
+    return head;
+  } catch {
+    return null;
+  }
+}
+
+function isAllowedDataImage(v: string): boolean {
+  if (v.length > MAX_DATA_IMAGE_LENGTH) return false;
+  const prefix = DATA_IMAGE_PREFIX.exec(v);
+  if (!prefix) return false;
+  const body = v.slice(prefix[0].length);
+  if (!BASE64_BODY.test(body)) return false;
+  const head = decodeHead(body);
+  if (!head) return false;
+  return sniffFormat(head) === DECLARED_FORMAT[prefix[1].toLowerCase()];
+}
+
+/** Teks kegagalannya untuk mata; juga potongan dari nama aksesibel placeholder. */
+const IMAGE_FAILED_TEXT = "gambar tidak dapat ditampilkan";
+const IMAGE_REJECTED_HINT = `ditolak: ${REJECTED_REASON}`;
+
+type SafeImgProps = {
+  src: string;
+  mode: SafeRenderMode;
+  alt: string;
+  width?: number | string;
+  height?: number | string;
+  className?: string;
+};
+
+/**
+ * src yang lolos validasi. Data URI gambar raster tetap boleh supaya aset yang
+ * sudah di-inline saat export bisa dirender.
+ */
+export function SafeImg({ src, mode, alt, width, height, className }: SafeImgProps) {
+  const value = src ?? "";
+  const inline = isAllowedDataImage(value);
+  const ok = inline || safeUrlUnescaped(value) !== "";
+
+  if (!ok) {
+    // `role="img"` membuat seluruh anak presentasional, jadi teks "gambar
+    // tidak dapat ditampilkan" TIDAK akan diumumkan kalau ia hanya tinggal di
+    // dalam DOM. Karena itu nama aksesibel dirangkai dari alt + teks kegagalan
+    // (+ alasan, di mode editor) menjadi satu node gambar yang tetap beravi
+    // "ini tempat gambar yang gagal" sekaligus menyatakan kegagalannya.
+    const label = [
+      alt || null,
+      IMAGE_FAILED_TEXT,
+      mode === "editor" ? IMAGE_REJECTED_HINT : null,
+    ]
+      .filter(Boolean)
+      .join(" — ");
+
+    return (
+      <div
+        className={`flex items-center justify-center bg-surface-container text-on-surface-variant ${className ?? ""}`}
+        style={{ width, height }}
+        role="img"
+        aria-label={label}
+      >
+        <span className="px-2 text-center text-xs">{IMAGE_FAILED_TEXT}</span>
+        {mode === "editor" ? (
+          <span className="bg-error-container px-1.5 py-0.5 text-xs font-medium text-on-error-container">
+            {IMAGE_REJECTED_HINT}
+          </span>
+        ) : null}
+      </div>
+    );
+  }
+
+  return (
+    // eslint-disable-next-line @next/next/no-img-element -- next/image tidak menerima data URI, dan aset lewat rute /api/portfolio/assets butuh remotePatterns.
+    <img
+      src={inline ? value : safeUrlUnescaped(value)}
+      alt={alt}
+      width={width}
+      height={height}
+      className={className}
+      loading="lazy"
+      data-editor-mode={mode}
+    />
+  );
+}
diff --git a/src/components/portfolio/render/safe-render-mode.ts b/src/components/portfolio/render/safe-render-mode.ts
new file mode 100644
index 0000000..4b6a526
--- /dev/null
+++ b/src/components/portfolio/render/safe-render-mode.ts
@@ -0,0 +1,8 @@
+/**
+ * Mode render portfolio. Sengaja berada di modul terpisah dari
+ * `render/SafeLink.tsx`: modul ini tidak akan pernah menjadi client
+ * component, jadi mengimpor `SafeRenderMode` darinya tidak bisa diam-diam
+ * menarik `SafeLink`/`SafeImg` — dan karena itu seluruh grafik section —
+ * ke client bundle publik.
+ */
+export type SafeRenderMode = "editor" | "static";
diff --git a/src/lib/portfolio-safety.ts b/src/lib/portfolio-safety.ts
index 3a44684..70cefbb 100644
--- a/src/lib/portfolio-safety.ts
+++ b/src/lib/portfolio-safety.ts
@@ -9,41 +9,87 @@ export function esc(v: unknown): string {
     .replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;")
     .replace(/'/g, "&#39;");
 }
 
 /** Backslash atau karakter kontrol ASCII (0x00-0x1F, 0x7F). */
 const URL_UNSAFE_CHARS = /[\x00-\x1f\x7f\\]/;
 
+/**
+ * CR/LF yang ditulis sebagai percent-encoding, mis. `%0D%0A`. Penjaga karakter
+ * kontrol di atas tidak melihatnya: yang kelihatan hanya `%`, `0`, `D`. Pada
+ * `mailto:` itu berarti header baru (`Bcc:`) diselundupkan ke pesan.
+ */
+const ENCODED_CRLF = /%(?:0d|0a)/i;
+
+/**
+ * Resolusi URL mentah: trim, tolak karakter tidak aman, lalu kembalikan URL
+ * yang sudah tervalidasi TANPA esc(). `""` berarti ditolak.
+ *
+ * Parameter `unknown` dengan hasil `""` untuk non-string: data yang datang dari
+ * JSON/DB bisa punya field kosong tanpa tipe, dan modul ini tidak boleh
+ * melempar exception hanya karena itu. `esc()` sudah punya jaminan yang sama.
+ */
+function resolveUrl(v: unknown): string {
+  if (typeof v !== "string") return "";
+  const t = v.trim();
+  if (URL_UNSAFE_CHARS.test(t)) return "";
+  if (/^mailto:/i.test(t) && ENCODED_CRLF.test(t)) return "";
+  if (/^\/(?!\/)/.test(t)) return t;
+  if (/^(https?:\/\/|mailto:|tel:)/i.test(t)) return t;
+  if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(t)) return "https://" + t;
+  return "";
+}
+
+
 /**
  * Validasi & sanitasi URL. Menerima http/https/mailto/tel, path relatif yang
  * diawali `/`, dan domain telanjang (diberi prefiks https://).
  * Skema lain — javascript:, data:, vbscript:, file: — ditolak dengan "".
  * `//host` (protocol-relative) juga ditolak: di href itu resolve ke origin lain.
  *
  * Backslash dan karakter kontrol ASCII ditolak sebelum cek path relatif: browser
  * menormalkan `\` jadi `/` dan meng-strip tab/newline dari URL, sehingga
  * `/\evil.com` dan `/<TAB>/evil.com` berakhir jadi `//evil.com` (origin lain).
+ *
+ * KONTEKS: output-nya sudah di-esc untuk disisipkan sebagai nilai atribut di
+ * string HTML (jalur export/preview mandiri). Untuk JSX/React jangan pakai ini —
+ * React menulis atribut lewat setAttribute tanpa parser HTML, jadi `&` akan
+ * ter-escape dua kali (`&amp;amp;`). Gunakan `safeUrlUnescaped` di sana.
+ *
+ * Hasil fungsi ini juga jangan pernah diberi ke fetch() atau CSS url() — di sana
+ * `&amp;` bukan pemisah query. Untuk kedua kasus itu pakailah `safeUrlUnescaped`.
+ *
+ * Parameter `unknown`: input non-string menghasilkan `""`, bukan exception.
+ * `schema.ts` memanggilnya setelah `z.string()`, jadi perilakunya di sana tidak
+ * berubah — jaminan ini hanya menutup jalur data yang belum tervalidasi.
  */
-export function safeUrl(v: string): string {
-  const t = v.trim();
-  if (URL_UNSAFE_CHARS.test(t)) return "";
-  // Output `esc()` adalah konteks atribut HTML (href/src); jangan pernah
-  // diberi ke fetch() atau CSS url() — `&amp;` di sana bukan pemisah query.
-  if (/^\/(?!\/)/.test(t)) return esc(t);
-  if (/^(https?:\/\/|mailto:|tel:)/i.test(t)) return esc(t);
-  if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(t)) return esc("https://" + t);
-  return "";
+export function safeUrl(v: unknown): string {
+  return esc(resolveUrl(v));
 }
 
+/**
+ * Validasi URL yang sama persis dengan `safeUrl`, tapi TIDAK meng-escape hasil.
+ *
+ * KONTEKS: komponen React (`SafeLink`, `SafeImg`) yang meneruskan nilai ke
+ * atribut href/src. React sudah meng-escape nilai atribut sendiri, jadi
+ * meng-escape di sini justru merusak URL — `&` jadi `&amp;amp;`.
+ * `safeUrl` tetap ada karena jalur export membangun string HTML secara manual,
+ * di situ tidak ada React yang menolong meng-escape.
+ */
+export function safeUrlUnescaped(v: unknown): string {
+  return resolveUrl(v);
+}
+
+
 /** Slug publik portfolio: huruf kecil, angka, tanda hubung, 3–50 karakter. */
 export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{2,49}$/;
 
 export const RESERVED_SLUGS = new Set([
   "api", "admin", "login", "register", "dashboard", "checker", "builder",
   "p", "portfolio", "profile", "settings", "billing", "payment", "blog",
   "about", "faq", "contact", "karir", "privacy", "terms", "sitemap",
   "robots", "surat-lamaran", "motivation", "preview", "live", "pricing",
   "help", "assets", "static", "_next", "favicon", "manifest", "apple-icon",
 ]);

```
