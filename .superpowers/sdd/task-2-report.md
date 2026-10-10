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

---

## Fix wave 2

**Commit:** `f211a28` — `fix(portfolio): kebocoran data URI, kegagalan gambar ke AT, paritas safeUrl`
**Base:** `42823ce`
**Tests:** 87 baru, suite penuh 233/233 hijau (dari 146)

### Important 1 — kegagalan placeholder tidak terjangkau screen reader

**Keputusan: pertahankan `role="img"`, rangkai `aria-label` dari alt + teks kegagalan.** Bukan buang role-nya.

Alasannya: `role="img"` bukan sekadar dekorasi. Placeholder itu menggantikan ruang gambar — ia mewakili "di sinilah gambar yang seharusnya". Membuang role-nya membuat teknologi bantu memperlakukan kotak abu-abu itu sebagai teks biasa, pembaca screen reader kehilangan fakta bahwa ada gambar yang gagal dimuat, dan pesannya bercampur dengan konten lain. Dengan merangkai nama aksesibel, satu node gambar membawa dua informasi sekaligus: apa yang mestinya ada (alt) dan bahwa ia gagal dimuat.

Memakai `aria-label` sebagai satu-satunya nama juga menghindari pengulangan: teks "gambar tidak dapat ditampilkan" tetap ada di DOM untuk mata, dan karena anak `role="img"` presentasional dia **tidak** diumumkan dua kali.

Payload yang harus tertangani: `alt` kosong. Sebelumnya itu menghasilkan nama aksesibel kosong — praktis tidak ada yang diumumkan sama sekali. Sekarang label selalu minimal berisi teks kegagalan.

```tsx
const label = [
  alt || null,
  IMAGE_FAILED_TEXT,
  mode === "editor" ? IMAGE_REJECTED_HINT : null,
]
  .filter(Boolean)
  .join(" — ");
```

Tiga test baru menutupnya dengan `toHaveAccessibleName(...)` — yang memang menghitung nama aksesibel, bukan sekadar mencari teks di DOM: satu untuk alt terisi (nama memuat alt **dan** kegagalan), satu untuk alt kosong (nama tetap menyebut kegagalan), satu lagi memastikan `aria-label` tidak pernah kosong.

### Important 2 — allowlist data URI hanya memvalidasi awalan

`ALLOWED_DATA_IMAGE` diganti dua lapis: awalan MIME + **bodi**.

```ts
const DATA_IMAGE_PREFIX = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,/i;
const BASE64_BODY = /^[A-Za-z0-9+/]+={0,2}$/;
```

`=` hanya boleh sebagai padding di ujung (`={0,2}` di akhir), jadi `iV=BOR` dan `iVBOR===` ikut ditolak — keduanya payload base64 yang rusak, bukan sekadar "huruf aneh". Tulisan lain (`"`, `'`, `<`, `&`, `\`, newline, `#`) tidak lolos. Pola lama `^data:image/(png|...)` juga diganti `(?:...)` supaya tidak ada capture group yang menyesatkan.

**Nilai batas: `MAX_DATA_IMAGE_LENGTH = 7 * 1024 * 1024` (7 MiB = 7.340.032 karakter), diukur atas panjang URI keseluruhan.**

Nilainya bukan tebakan "cukup lega". `/api/upload/route.ts:25` menolak file di atas 5 MB dan `:33` meng-encode-nya jadi `data:${type};base64,${base64}`. Base64 mengembang 4/3, jadi file 5 MB menghasilkan 6.666.668 karakter. 7 MiB duduk sedikit di atas angka itu (headroom untuk awalan `data:` dan tipe MIME yang memanjang), jadi gerbang ini **tidak pernah menolak hasil upload yang sah** — sementara tetap membatasi file HTML export mandiri yang meng-inline gambar. Batas yang lebih kecil (mis. 512 KiB atau 2 MiB) akan merusak jalur upload yang sudah ada: foto 2–5 MB akan hilang diganti placeholder, dan itu regresi nyata, bukan sekadar angka yang lebih rapi.

Test batas: tepat-di-batas diterima, satu karakter di atas ditolak, keduanya memakai konstanta yang diekspor — tidak ada angka ajaib di test.

### Important 3 — paritas baru diuji di sisi yang diterima

Test lama membandingkan `safeUrlUnescaped(p) === safeUrl(p)` hanya atas payload yang memang ditolak, jadi ia hanya membuktikan `"" === ""`. Sekarang ada `PARITY_CORPUS` 36 entri dan `it.each` satu test per entri:

```ts
it.each(PARITY_CORPUS)("%s: kedua fungsi sepakat terima atau menolak", (_label, value) => {
  expect(safeUrl(value) === "").toBe(safeUrlUnescaped(value) === "");
});
```

Korpusnya dua sisi, 36 entri total. 15 entri diterima (https/http, query ber-`&`, karakter HTML di URL yang sah, path relatif, path relatif + query, path relatif uuid, root, domain telanjang dengan dan tanpa path, mailto, mailto ber-`%20`, tel, skema huruf besar, spasi tepi) dan 21 ditolak: 17 string (javascript:, data:text/html, data:image/png, vbscript:, file:, mailto CRLF literal, mailto CRLF ter-encode, protocol-relative dan protocol-relative plus path, backslash, tab, newline, CRLF, path relatif tanpa slash, `//`, string kosong, spasi saja) plus 4 non-string (`undefined`, `null`, angka, objek).

Dua test penjaga tambahan. Satu memastikan korpus itu benar-benar memuat kedua sisi (`accepted.length > 0` dan `rejected.length > 0`), supaya suntingan di masa depan tidak diam-diam membuang sisi yang diterima dan mengembalikan cacat lama tanpa ada test yang gagal. Satu lagi mengunci bahwa varian yang meng-escape dan yang tidak **tetap berbeda** pada input ber-`&`, jadi "paritas" tidak dibaca orang sebagai "jadi identik".

### Important 4 — test SVG sebelumnya tidak menguji SVG

Payload diganti ke bentuk yang benar-benar base64:

```
data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9J2FsZXJ0KDEpJz48L3N2Zz4=
```

Payload lama `data:image/svg+xml,<svg onload='alert(1)'/>` tidak punya `;base64,` sama sekali, jadi ia ditolak oleh aturan mana pun — termasuk kalau satu-satunya aturan yang tersisa adalah "base64 itu wajib". Sekarang ini diuji dengan pasangan:

- `data:image/svg+xml;base64,PHN2...` ditolak — payloadnya valid base64, yang salah MIME-nya.
- `data:image/png;base64,PHN2...` **diterima** — payload identik, yang berbeda hanya MIME-nya.

Kedua test itu tidak bisa lolos bersamaan kalau aturan SVG hilang, karena keduanya memakai payload yang sama persis.

Kedua test ini hijau sebelum dan sesudah perubahan — memang begitulah guard test yang benar. Yang berubah adalah *apa yang mereka bedakan*: versi lama tidak bisa membedakan "SVG ditolak" dari "base64 wajib".

### Minor

| Temuan | Penyelesaian |
|---|---|

| `"use client"` tidak beralasan | Directive dihapus. Tidak ada hook, state, atau handler di kedua komponen, dan satu-satunya operasi DOM adalah `setAttribute` yang memang dikerjakan React. Nol konsumen di app code (hanya test yang mengimpor), jadi tidak ada yang butuh klien dan jadi rusak. |
| `SafeRenderMode` di modul terpisah | Pindah ke `src/components/portfolio/render/safe-render-mode.ts`, type-only dan tanpa directive. `SafeLink.tsx` sengaja **tidak** me-re-export, sehingga import lama dari sana gagal di compile time dan task hilir diarahkan ke modul yang dijamin tidak akan pernah jadi client component. Kalau berkas komponen suatu saat acquire `"use client"`, import nilai apa pun darinya akan menarik grafik section ke client bundle secara diam-diam; dari modul baru itu mustahil terjadi. |
| `resolveUrl` melempar pada `undefined` | Parameter jadi `unknown`, input non-string mengembalikan `""`. `esc()` sudah punya jaminan yang sama, jadi ini menyamakan dua hal, bukan menambah konsep baru. |
| Injeksi header percent-encoded | `ENCODED_CRLF = /%(?:0d|0a)/i` diterapkan khusus di cabang `mailto:`, setelah guard karakter kontrol. Query mailto yang sah (`%20`) tetap lolos — ada test-nya. |
| Affordance tautan ditolak | `inertClassName()` membalik token interaktif (`cursor-pointer` → `cursor-default`, `hover:underline` → `no-underline`) dan membuang variant `hover:`/`focus:`/`focus-visible:`/`active:`. Token non-interaktif (`text-primary`, `underline`, `font-semibold`) dipertahankan. Docstring menyatakan eksplisit: **cabang yang diterima memakai `className` apa adanya** — pemanggil yang bertanggung jawab atas gaya interaktif di sana, karena tautannya memang interaktif. |
| Warning lint `<img>` | `// eslint-disable-next-line @next/next/no-img-element -- next/image tidak menerima data URI, dan aset lewat rute /api/portfolio/assets butuh remotePatterns.` Lint bersih. |
| `mode` di `SafeImg` | Diberi perilaku, bukan dibuang: di `mode="editor"` placeholder menampilkan badge "ditolak: skema tidak diizinkan" dengan token desain yang sama seperti `SafeLink`, dan badge itu ikut masuk ke nama aksesibel. Ada test yang memastikan penjelasan itu **tidak** muncul di `mode="static"`. |
| Baris akhir | Ditambahkan di kedua berkas yang diminta. |
| Loop payload | `it.each` di `portfolio-safe-link.test.tsx` (bypass relative-url, data URI) dan di `portfolio-safety.test.ts` (skema terlarang, protocol-relative/backslash/kontrol). Kegagalan kini menyebut payloadnya sendiri. |
| Copy | Badge penolakan memakai `&mdash;`, bukan hyphen ASCII. Test mengunci `\u2014` ada dan tidak ada `\s-\s`. |

### Bukti red-then-green

Implementasi sumber di-`git stash`, test baru dibiarkan di tempat, lalu suite dijalankan:

```
$ git stash push -- src/lib/portfolio-safety.ts src/components/portfolio/render/SafeLink.tsx
$ npx vitest run src/__tests__/portfolio-safety.test.ts src/__tests__/portfolio-safe-link.test.tsx
 Test Files  2 failed (2)
      Tests  19 failed | 33 passed (52)

 FAIL  .../portfolio-safe-link.test.tsx > SafeLink > menolak mailto dengan injeksi header CRLF yang ter-percent-encode
 FAIL  .../portfolio-safe-link.test.tsx > SafeLink > memakai tanda baca yang benar pada badge penolakan
 FAIL  .../portfolio-safe-link.test.tsx > SafeLink > melepas affordance interaktif pada tautan yang ditolak
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menyampaikan kegagalan ke teknologi bantu, bukan hanya ke mata
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > tetap menyampaikan kegagalan saat alt kosong
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > memakai nama aksesibel yang tidak kosong saat alt kosong
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan kutip
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan kutip tunggal
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan sudut
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan ampersand
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan backslash
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan newline
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan karakter di luar base64
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan padding di tengah
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan padding berlebih
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan body kosong
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI yang melebihi batas ukuran
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menerima data URI tepat di batas ukuran
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menampilkan placeholder di mode editor dan menjelaskan alasannya
 FAIL  .../portfolio-safety.test.ts > safeUrl > menolak mailto dengan injeksi header CRLF yang ter-percent-encode
 FAIL  .../portfolio-safety.test.ts > safeUrl / safeUrlUnescaped terhadap input non-string > ... (6 + 6)
 FAIL  .../portfolio-safety.test.ts > paritas safeUrl vs safeUrlUnescaped > undefined / null / angka / objek: kedua fungsi sepakat terima atau menolak
 FAIL  .../portfolio-safety.test.ts > paritas safeUrl vs safeUrlUnescaped > korpus paritas memuat kedua sisi, jangan hanya yang ditolak
```

(contoh kegagalan nyata dari salah satu kasus — payload berkutip lolos ke gate lama:)

```
 FAIL  .../portfolio-safe-link.test.tsx > SafeImg > menolak data URI dengan kutip
AssertionError: expected element(s) not to be in the document
- Expected: null
- Received: <img alt="Uji" src="data:image/png;base64,iVBOR&quot;" ⬦>
```

Lalu `git stash pop` dan suite yang sama:

```
 Test Files  2 passed (2)
      Tests  135 passed (135)
```

### Perintah

```
$ npm test
 Test Files  10 passed (10)
      Tests  233 passed (233)
   Duration  4.12s
```

146 → 233. Baseline 146 diverifikasi ulang dengan men-stash kelima berkas perubahan:

```
$ git stash push -u -- <5 berkas>   # baseline
 Test Files  10 passed (10)
      Tests  146 passed (146)
```

```
$ npx tsc --noEmit
tsc exit: 0

$ npx eslint src/components/portfolio/render/SafeLink.tsx \
             src/components/portfolio/render/safe-render-mode.ts \
             src/lib/portfolio-safety.ts
eslint exit: 0
```

Sebelum perubahan, `npx eslint src/components/portfolio/render/SafeLink.tsx` melaporkan:

```
  88:5  warning  Using `<img>` ⬦ @next/next/no-img-element
✖ 1 problem (0 errors, 1 warning)
```

### Kekhawatiran

1. **`schema.ts:46` tidak berubah perilakunya, dan itu perlu dicatat.** `urlField` memanggil `safeUrl(v)` di dalam `.refine()`, tapi hanya setelah `z.string()` dan `.transform(trim)` — jadi `v` dijamin string dan `typeof` check baru tidak pernah menyala di sana. Tidak ada perubahan perilaku, tidak ada perubahan file (`schema.ts` di luar scope). Yang berubah hanya untuk pemanggil yang belum tervalidasi: `preview/page.tsx:97` memanggil `safeUrl(p.link)` pada objek dari DB; kalau `p.link` ternyata `undefined`/null (baris lama, migrasi setengah jalan), sebelumnya `resolveUrl` melempar `TypeError` dan halaman preview crash, sekarang mengembalikan `""` dan tautannya di-skip. Itu perbaikan, tapi ia mengubah simptom: data rusak yang dulu terlihat sebagai crash sekarang tampil sebagai tautan yang hilang.
2. **`MAX_DATA_IMAGE_LENGTH` masih diekspor dari berkas komponen.** Agar batasnya bisa diuji tanpa angka ajaib, konstantanya harus bisa di-import dari test, sedangkan scope hanya mengizinkan satu modul baru dan itu diminta type-only. Konsekuensinya, satu nilai runtime masih bisa di-import dari `render/SafeLink.tsx` tanpa menarik client boundary. Modul baru yang saya buat tetap type-only seperti yang diminta; ia bukan tempat konstanta runtime.
3. **7 MiB tetap besar untuk satu gambar.** Yang dibatasi adalah satu gambar, bukan jumlah: portofolio dengan delapan foto 5 MB akan menghasilkan HTML export sekitar 50 MB. Gate ini menutup kasus yang paling sering muncul — satu aset raksasa atau payload buatan tangan — bukan masalah embed banyak foto besar sekaligus, dan itu keputusan produk tersendiri (kompres saat upload, atau tolak export di atas ambang).
4. **`BASE64_BODY` tidak mewajibkan panjang kelipatan 4.** Base64 yang di-padatkan secara ketat akan menolaknya. Saya tidak menambahkannya karena aturan itu tidak perlu untuk payload dari `/api/upload` yang selalu padded, dan akan menolak base64 tanpa padding yang mungkin muncul nanti. Kalau nanti ada sumber data URI lain, tambahkan syarat kelipatan 4.
5. **`inertClassName()` berbasis daftar token.** Ia mengenal `cursor-pointer` dan variant `hover/focus/active`, tapi utility interaktif yang tidak terdaftar tidak akan dibuang. Kontrak yang benar sudah tertulis di docstring — pemanggil yang mengirim kelas interaktif ke `SafeLink` bertanggung jawab atasnya — tetapi pemanggil yang tidak membaca docstring tetap bisa mendapat span yang terlihat bisa diklik.
6. **`antislop` tetap belum dijalankan.** Gelombang ini menyentuh copy (badge `&mdash;`), UI (badge baru di placeholder `SafeImg`), dan komentar kode, yaitu tiga dari lima kategori yang disebut `AGENTS.md`. Suntingan copy-nya sengaja dibatasi pada satu glyph supaya diff tetap kecil, tapi kalau `antislop` mau dijalankan untuk section portfolio, sekarang momen yang tepat: dua berkas ini akan jadi template yang di-copy 13 task berikutnya.
7. **`npm run build` tidak dijalankan.** Gate yang diminta adalah test dan tsc, keduanya bersih. Build baru jadi bukti nyata bahwa penghapusan `"use client"` aman untuk produksi, tapi belum ada app-code yang mengimpor `SafeLink`, jadi build hari ini tidak akan menyentuh berkas ini sama sekali. Buktinya baru akan muncul setelah task 3+.



---

## Fix wave 3

### 1. Gerbang SVG tidak bisa dilewati dengan menukar label (Penting)

`isAllowedDataImage()` kini memeriksa magic number, bukan cuma awalan dan alphabet base64. Urutannya: awalan harus cocok, body harus alphabet base64, lalu 32 karakter pertama body (24 byte) di-decode dengan `atob` dan dibandingkan dengan tipe yang diklaim. Tipe yang di-sniff: PNG (8 byte `89 50 4E 47 0D 0A 1A 0A`), JPEG (`FF D8 FF`, alias `jpg` dipetakan ke `jpeg`), GIF (`GIF87a`/`GIF89a`), WebP (`RIFF....WEBP`). Hanya 24 byte yang didecode, jadi payload 5 MB tidak ikut di-decode dan biaya sniff tetap konstan.

### 2. Test yang mem-pinning bypass

Test lama "menerima raster base64 dengan payload yang sama bentuknya, jadi aturan SVG yang diuji" dihapus: payload `data:image/png;base64,PHN2ZyBvbmxvYWQ9J2FsZXJ0KDEpJz48L3N2Zz4=` kini ditolak. Penggantinya:

- `menolak svg yang dilabeli png: magic number tidak cocok dengan tipe yang diklaim` (payload identik, sekarang ditolak).
- `menolak raster asli yang dilabeli format lain` (GIF asli berlabel png).
- `it.each` 5 kasus: png, jpeg, jpg, gif, webp dengan magic number asli, semuanya diterima. Inilah yang membedakan aturan ini dari sekadar "tolak semua data URI".
- Dua test lama memakai payload palsu (`"A+/9".repeat(8)` dan `"A".repeat(...)`, yang kebetulan lolos validasi lama). Keduanya diganti payload yang diawali tanda tangan PNG asli, supaya tetap menguji hal yang sama (huruf besar pada tipe MIME, batas ukuran) tanpa bergantung pada kelonggaran yang sudah tidak ada.

### 3. Minor

- Aritmetika `MAX_DATA_IMAGE_LENGTH` dikoreksi. Rute upload menolak file di atas `5 * 1024 * 1024` = 5.242.880 byte, bukan 5.000.000. Base64 menghasilkan 6.990.508 karakter (6.990.530 kalau awalan `data:image/...;base64,` ikut dihitung, karena gate membandingkan panjang seluruh URI). Angka pada brief (6.990.529) ikut dikoreksi. Margin tetap aman, bahkan lebih lega: 7.340.032 ada 349.524 karakter di atas payload terbesar yang sah.
- `INTERACTIVE_VARIANT` sekarang menangani prefiks: `md:hover:`, `dark:focus-visible:`, `group-hover:`, `peer-active:` ikut dibuang. Docstring menyebut apa yang masih lolos (`data-hover-label`).
- Komentar `"use client"` ditulis ulang: modul ini memang tidak butuh client boundary, tapi 12 section yang mengimpornya masih `"use client"` dan belum dierealisasi. Komentar tidak lagi menjanjikan server-rendering yang belum terjadi.
- Ditambah test nama aksesibel mode editor (alt + teks kegagalan + alasan).
- Test `toBeTruthy()` pada atribut `aria-label` diganti assertion exact-match yang membuktikan tidak ada pemisah sisa saat `alt` kosong.
- Badge penolakan diseragamkan jadi `ditolak: skema tidak diizinkan` untuk tautan dan gambar. Alasannya pulled ke satu konstanta `REJECTED_REASON`.
- `CATATAN:` jadi `Catatan:` (all-caps di komentar = teriak).

### 4. Bukti red lalu hijau

RED, sebelum implementasi:

```
$ npx vitest run src/__tests__/portfolio-safe-link.test.tsx
 Tests  6 failed | 54 passed (60)
 FAIL  SafeImg > menolak svg yang dilabeli png: magic number tidak cocok dengan tipe yang diklaim
AssertionError: expected <img alt="Mislabel" …> to be null
 FAIL  SafeImg > menolak raster asli yang dilabeli format lain
 FAIL  SafeLink > melepas affordance interaktif yang berprefiks variant
 FAIL  SafeLink > memperingatkan editor saat tautan ditolak
 FAIL  SafeLink > menandai tautan ditolak dengan token desain, tanpa warna atau rounded literal
 FAIL  SafeLink > memakai tanda baca yang benar pada badge penolakan
```

GREEN, sesudah:

```
$ npx vitest run src/__tests__/portfolio-safe-link.test.tsx
 Tests  60 passed (60)

$ npm test
 Test Files  10 passed (10)
      Tests  241 passed (241)

$ npx tsc --noEmit
tsc exit: 0

$ npx eslint src/components/portfolio/render/SafeLink.tsx src/__tests__/portfolio-safe-link.test.tsx
(clean, tanpa output)
```

233 -> 241 test, +8 net.

### 5. Format: sniffed dan dikecualikan

Sniffed: PNG, JPEG (`jpeg` + alias `jpg`), GIF, WebP. Dikecualikan: tidak ada. Empat tipe allowlist semuanya punya cek magic number, jadi tidak ada format yang lolos tanpa diperiksa. SVG tetap tidak ada di allowlist dan tidak bisa dimasukkan dengan menyamar sebagai raster.

### 6. Pass antislop

Skill yang dibaca: `antislop.md` (core, ada di worktree), `skills/antislop-code/SKILL.md` dan `skills/antislop-copywriting/SKILL.md` (folder `skills/` di worktree kosong, dibaca dari repo utama `D:\ai-career-hub\skills\`).

- **R-02 (em dash) pada copy yang benar-benar dirender: TIDAK diubah.** Badge dan nama aksesibel masih memakai em dash (`&mdash;` dan `.join(" — ")`). Alasan: `&mdash;` adalah konvensi rumah di repo ini (`src/app/portfolio/preview/page.tsx:65,79`, `src/app/admin/*`), dan skill copywriting sendiri memberi carve-out "voice override": kalau sample pemilik repo memakai em dash, ikuti sample itu. Ada test yang mem-pinxnya sebagai pilihan tipografi yang disengaja (`memakai tanda baca yang benar pada badge penolakan`). Menghapusnya adalah keputusan copy pemilik, bukan perbaikan defect, dan di luar daftar minor yang diminta. Kalau owners mau R-02 ditegakkan di sini, perubahannya satu glyph di dua tempat plus dua test.
- **Em dash di komentar kode: dibiarkan.** Komentar bukan teks yang dilihat orang, dan mengeditnya di luar blok yang sedang saya ubah hanya menambah noise.
- **R-31 (setiap keputusan punya alasan tertulis)**: ini finding wave 2 yang paling sering muncul. Yang diperbaiki: komentar `"use client"` (sekarang hanya menyatakan kondisi nyata), docstring `INTERACTIVE_VARIANT` (sekarang menyebut apa yang lolos dan apa yang tidak), komentar aritmetika (sekarang angkanya benar).
- **Stiff/loud wording**: `CATATAN:` -> `Catatan:`. Sisa komentar sudah pendek, sentence-case, dan menjelaskan kenapa, bukan apa.
- **Comment density**: satu komentar per blok logis, tanpa separator dekoratif, tanpa emoji, tanpa end-marker, tanpa TODO kosong.
- **R-36/C-5**: tidak ada klaim yang dikarang. Komentar hanya mengklaim apa yang kodenya lakukan.
- **Tidak ada perubahan visual atau palet**: badge tetap memakai token desain, tidak ada warna literal, radius literal, atau gradient baru.

### 7. Kekhawatiran

1. **Sniffing hanya membaca 24 byte.** File polyglot (byte awal PNG tapi isi sebenarnya sesuatu yang lain, atau sebaliknya) tetap bisa lolos. Risikonya rendah untuk jalur ini: URI ini hanya pernah masuk lewat `<img src>`, dan `<img>` tidak pernah mengeksekusi skrip; PNG/JPEG/GIF/WebP yang asli tidak bisa membawa skrip. Yang dilindungi adalah file HTML export mandiri, dan di sana pun URI ini masuk sebagai atribut `src`, bukan markup yang dieksekusi. Kalau nanti ada jalur yang meng-inline data URI sebagai markup (bukan atribut), 24 byte tidak lagi cukup dan validasi penuh dibutuhkan.
2. **`atob` jadi ambient global.** Tersedia di browser, jsdom, dan Node >= 16, tapi modul yang sebelumnya murni regex dan string sekarang bergantung pada global itu. Kalau dipakai di runtime tanpa `atob`, `decodeHead` mengembalikan `null` dan semua data URI ditolak: fail-closed, bukan fail-open.
3. **Alias MIME lewat map.** `DECLARED_FORMAT` memetakan tipe MIME ke format hasil sniff. Menambah format ke `DATA_IMAGE_PREFIX` tanpa menambah entri map membuat format itu otomatis ditolak (`undefined` tidak pernah sama dengan hasil sniff), dan TypeScript tidak memberi error untuk itu. Kegagalan selalu ke arah yang aman, tapi tidak kelihatan saat compile.
4. **Badge berubah dan itu terlihat.** Tiga test yang dulu mencari `/tautan ditolak/i` ikut diperbarui ke `/ditolak: skema tidak diizinkan/i`. Wave berikutnya yang me-copy berkas ini akan membawa copy itu ikut.
5. **`npm run build` tidak dijalankan.** Gate yang diminta (test + tsc + eslint) semuanya bersih. Tidak ada app-code yang mengimpor `SafeLink` hari ini, jadi build tidak akan menyentuh berkas ini.