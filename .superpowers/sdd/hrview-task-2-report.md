# Laporan Task 2 — kembalikan tabel GRADE yang hilang dari prompt v4

Status: DONE_WITH_CONCERNS
Commit: `4422809` (branch `master`, satu commit)
Ruang lingkup: persis empat file yang disebut brief.

---

## 1. Apa yang berubah per file

### `src/lib/ai/prompts/analysis-v4.ts`

a) **Tabel GRADE dikembalikan di aturan keras #5** (`analysis-v4.ts:46-51`), teks persis dari brief:

```
5. grade WAJIB mengikuti threshold overall_score di tabel GRADE ini, tanpa kecuali:
   - 85-100: A
   - 70-84: B
   - 50-69: C
   - 0-49: D
   Tidak boleh menebak angka lain, dan tidak boleh memberi grade di luar A/B/C/D.
```

Angka diambil dari prompt v3 (85 / 70 / 50 / 0) supaya arti grade lama tidak berubah.
Tidak ada angka lain yang ditambahkan.

b) **Verifikasi akhir (b) diperketat** (`analysis-v4.ts:207`), teks persis dari brief:

```
(b) grade WAJIB sama dengan hasil tabel GRADE di atas untuk overall_score yang kamu tulis. Kalau tidak cocok, angka itu salah.
```

c) **Step 5b — satu sumber kebenaran untuk penanda.** `PROMPT_MARKERS` ditambahkan ke
import dari `./shared`, lalu blok input memakai `${PROMPT_MARKERS.cv}` dan
`${PROMPT_MARKERS.jd}` (`analysis-v4.ts:347-350`) menggantikan literal
`=== CV KANDIDAT ===` dan `=== JOB DESCRIPTION TARGET ===`. Nilai yang dirender ke model
tidak berubah — hanya sumber literalnya.

Tidak ada perubahan lain di file ini. `analysis-v3.ts` tidak disentuh.

### `src/lib/ai/adapter.ts`

Step 5c. `injectInputData` kini `export` supaya bisa diuji langsung, dan keempat
penyisipan memakai bentuk fungsi, persis seperti brief:

```ts
export function injectInputData(prompt: string, data: string): string {
  const { cv, jd } = splitCvJd(data);
  return prompt
    .replace("{{INPUT_DATA}}", () => data)
    .replace("{{CV_TEXT}}", () => cv)
    .replace("{{JD_TEXT}}", () => jd)
    .replace("{{PROFILE_DATA}}", () => data);
}
```

Ditambah komentar berbahasa Indonesia yang menjelaskan *mengapa*: data pengguna bisa
memuat `$&`, `` $` ``, dan `$'`, yang ditafsirkan sebagai pola pengganti bila `replace`
diberi string biasa. JSDoc menjelaskan alasan fungsi ini diekspor (konsisten dengan
`splitCvJd` yang sudah diekspor di Task 1).

### `src/__tests__/checker-grade-prompt.test.ts` (baru)

Tiga test pertama verbatim dari brief Step 1. Ditambah satu `describe` untuk Step 5b:

- `template menulis penanda lewat PROMPT_MARKERS, bukan literal` — membaca sumber
  `analysis-v4.ts` dengan `readFileSync`, memastikan `PROMPT_MARKERS.cv` dan
  `PROMPT_MARKERS.jd` ada, dan literal penando sudah tidak ada lagi.
- `penanda yang muncul di prompt sama dengan yang dicari adapter` — nilai yang dirender
  ke model tetap `=== CV KANDIDAT ===` dan `=== JOB DESCRIPTION TARGET ===`, jadi
  penggantian literal tidak mengubah apa yang dikirim ke model.

### `src/__tests__/ai-prompt-markers.test.ts`

Import ditambah `injectInputData` (mock `openai` yang sudah ada dipertahankan).
Ditambah `describe("penyuntikan data ke prompt")` dengan dua test:

- CV berisi `$&`, `` $` ``, dan `$'` masuk utuh ke `{{CV_TEXT}}` (persis diminta brief).
- Data mentah berisi `$&` tetap utuh di `{{INPUT_DATA}}`, `{{CV_TEXT}}`, dan
  `{{PROFILE_DATA}}` — keempat placeholder yang diubah kena perlakuan yang sama.

---

## 2. Bukti TDD (perintah + output)

### Run 1 — gagal, sebelum implementasi

```
npx vitest run src/__tests__/checker-grade-prompt.test.ts src/__tests__/ai-prompt-markers.test.ts --reporter=dot
```

```
 Test Files  2 failed (2)
      Tests  6 failed | 9 passed (15)
```

Enam kegagalan, masing-masing membuktikan satu test berarti:

1. `prompt memuat ambang grade lengkap` — `expected ... to contain '0-49'`.
2. `setiap ambang disebut dengan huruf grade yang benar` — `expected 'GRADE di bawah)...' to match /85-100[^\n]*\bA\b/`. Teks yang tertangkap bukti prompt hanya memuat frasa *"GRADE di bawah)"* tanpa tabel apa pun.
3. `grade wajib konsisten dengan overall_score` — regex tidak match; baris yang masih ada di prompt adalah `5. grade WAJIB mengikuti threshold overall_score (tabel GRADE di bawah).`
4. `template menulis penanda lewat PROMPT_MARKERS, bukan literal` — sumber file `expected 'import {\n SECURITY_GUARDRAIL,...' to contain 'PROMPT_MARKERS.cv'`.
5. `CV yang memuat pola pengganti regex tetap masuk utuh` — gagal saat memanggil `injectInputData`, yang saat itu belum diekspor.
6. `data mentah yang memuat pola pengganti juga tetap utuh` — idem.

### Run 2 — dua masih gagal (bug di test, bukan di implementasi)

```
 Test Files  2 failed (2)
      Tests  2 failed | 13 passed (15)
```

Keduanya adalah masalah pada brief dan pada ekspektasi test yang saya tulis sendiri;
keduanya sudah diperbaiki (lihat bagian 3). Tidak ada satu pun yang menandakan
implementasi salah.

### Run 3 — hijau

```
npx vitest run src/__tests__/checker-grade-prompt.test.ts src/__tests__/ai-prompt-markers.test.ts --reporter=dot
 Test Files  2 passed (2)
      Tests  15 passed (15)
```

### Typecheck

```
npx tsc --noEmit -p tsconfig.json
```

Tidak ada output sama sekali, exit code 0.

### Suite penuh

```
npx vitest run --reporter=dot
 Test Files  72 passed | 1 skipped (73)
      Tests  849 passed | 1 skipped (850)
   Duration  25.89s
```

---

## 3. Ambiguitas di brief dan cara penyelesaiannya

### A. Regex test #3 tidak akan pernah match dengan teks prompt yang diberikan brief

Brief Step 1 menyertakan regex:

```ts
/grade[^\n]*(Wajib|wajib|MUST|must)[^\n]*overall_score/
```

Brief Step 3 menyuruh menulis aturan dengan huruf kapital **`WAJIB`**. Regex bersifat
case-sensitive dan tidak punya bentuk `WAJIB`, jadi dengan teks prompt apa adanya test
#3 tidak akan hijau. Itulah yang terlihat di Run 2.

**Penyelesaian:** teks prompt dipertahankan persis seperti brief (pakai `WAJIB`),
karena itu string yang benar-benar dibaca model dan konsisten dengan gaya file yang
memakai `WAJIB` di aturan lain. Yang dilepas adalah regex test, ditambah satu
alternatif:

```ts
/grade[^\n]*(WAJIB|Wajib|wajib|MUST|must)[^\n]*overall_score/
```

Perubahan ini satu baris pada test, bukan pelonggaran intent: test tetap membuktikan
ada baris yang mengikat grade ke `overall_score` dengan kata "wajib". Membendingkan
sebaliknya — menulis "Wajib" di prompt supaya regex asli cocok — akan membuat prompt
yang dikirim ke model berbeda dari yang diminta brief.

### B. Ekspektasi awal test `{{INPUT_DATA}}` salah

Versi pertama test kedua menuliskan harapan bahwa semua placeholder berisi CV yang
sudah dipisah. Factanya `{{INPUT_DATA}}` dan `{{PROFILE_DATA}}` menerima `data` mentah apa adanya —
termasuk penanda bloknya — sedangkan `{{CV_TEXT}}` menerima potongan yang sudah dipisah
oleh `splitCvJd`. Test dipecah menjadi tiga assertion terpisah supaya perbedaan ini
justru terdokumentasi.

### C. Penempatan assertion Step 5b

Brief mengizinkan assertion Step 5b di `checker-grade-prompt.test.ts` **atau** di test
marker yang sudah ada. Dipilih `checker-grade-prompt.test.ts` supaya file marker yang
sudah ada tidak makin membesar. `ai-prompt-markers.test.ts` tetap masuk commit karena
`injectInputData` diuji di sana, sesuai brief.

### D. Penamaan test kedua

Judul pertama yang saya tulis ("penanda gagal disisipkan sebagai string ganti di mana
pun") membingungkan — yang diuji bukan penanda, melainkan data mentah. Diganti menjadi
"data mentah yang memuat pola pengganti juga tetap utuh".

### E. Satu test di luar brief

Brief hanya meminta satu test (`$&` masuk utuh ke `{{CV_TEXT}}`). Test kedua untuk
`{{INPUT_DATA}}` dan `{{PROFILE_DATA}}` saya tambahkan karena perubahan pada keempat
baris `.replace` meluas ke semua placeholder, dan tanpa test itu dua pertiga perubahan
tidak tertutup. Rendah risiko, satu `describe` block.

---

## 4. Kekhawatiran

1. **Distribusi grade akan bergerak.** Begitu tabel ditegakkan, grade yang tampil bisa
   berbeda dari sebelumnya karena sebelumnya model menebak. Skema UI tidak berubah.
   Pernyataan "hasil lama tidak berubah artinya" di brief merujuk pada **ambang**, bukan
   pada tebakan lama yang memang salah — ini konsekuensi yang memang diinginkan task.
2. **Baris validasi (b) panjang.** Sekitar 140 karakter dalam satu baris, keluar dari
   gaya baris pendek daftar (a)–(g). Karena diambil verbatim dari brief, tidak saya
   pecah. Kalau mau dirapikan, sebaiknya jadi keputusan terpisah.
3. **`injectInputData` kini bagian API modul.** Harmless — fungsi murni tanpa efek
   samping — dan konsisten dengan `splitCvJd` yang sudah diekspor di Task 1.
4. **Test 5b bergantung pada CWD.** `readFileSync("src/lib/ai/prompts/analysis-v4.ts")`
   hanya benar bila test dijalankan dari root repo. Pola ini sudah dipakai test marker
   yang ada sebelumnya (yang membaca `src/lib/ai/adapter.ts`), jadi bukan masalah baru —
   tapi ia akan rusak kalau vitest dipanggil dari direktori lain.
5. **`analysis-v3.ts` dibiarkan apa adanya** sesuai instruksi. Ia masih memuat tabel GRADE
   versinya sendiri; step ini tidak menambah drift baru di sana.
---

# Laporan Task 2 (lanjutan) — perbaikan findings: `$&` pada `injectUserContext`

Status: DONE_WITH_CONCERNS
Commit: `4110ad7` (branch `master`, satu commit)
Ruang lingkup: persis dua file yang disebut brief — `src/lib/ai/adapter.ts` dan
`src/__tests__/ai-prompt-markers.test.ts`.

---

## 1. Temuan yang ditutup

Commit sebelumnya (`4422809`) sudah benar memperbaiki empat `.replace` di
`injectInputData`, tapi bug yang sama masih ada satu fungsi lebih awal:
`injectUserContext` masih memanggil

```ts
return prompt.replace("{{USER_CONTEXT}}", contextStr);
```

dengan string biasa. `contextStr` memuat `ctx.targetRole` dan `ctx.industry`, dan di
route checker (`src/app/api/checker/analyze/route.ts:194-198, 219-223`) `targetRole`
(`roleHint`) disusun dari baris-baris CV kandidat. Jadi CV yang memuat `$&` tetap
merusak prompt lewat jalur ini — tujuan fix sebelumnya belum tercapai. Jalur yang sama
ikut terdampak oleh fitur lain yang mengirim judul lowongan atau industri lewat
`buildUserContext`.

## 2. Isi perubahan

### `src/lib/ai/adapter.ts`

a) `injectUserContext` diekspor, dengan alasan yang sama seperti `splitCvJd` dan
   `injectInputData`: yang diuji harus kode aslinya, bukan salinan logikanya.

b) Penyisipan memakai replacer fungsi:

```ts
return prompt.replace("{{USER_CONTEXT}}", () => contextStr);
```

c) Komentar berbahasa Indonesia di baris itu menjelaskan *mengapa*: isi konteks adalah
   data pengguna, `$&` di sana adalah isi biasa (kandidat menulis tentang regex atau
   shell), dan kalau memakai string biasa prompt ikut rusak tanpa error.

Tidak ada perubahan perilaku lain: `if (!ctx) return prompt`, format `contextStr`,
dan urutan placeholder lainnya tetap apa adanya.

### Audit `.replace` lain di file yang sama

Semua `.replace` di `adapter.ts` diperiksa satu per satu. Hanya satu yang tersisa
menyisipkan data pengguna dengan string biasa, yaitu baris yang diperbaiki di atas:

| Baris (sesudah fix) | Pola | Replacement | Status |
|---|---|---|---|
| `adapter.ts:97` | string | **fungsi** | diperbaiki |
| `adapter.ts:91` `sanitizeText` | regex `/[\uD800-\uDFFF]/g` | string kosong `""` | aman, tidak memuat data pengguna |
| `adapter.ts:118` `splitCvJd` | regex `/^=== ROLE CATEGORY:[^\n]*\n+/` | string kosong `""` | aman |
| `adapter.ts:160` `parseAIResponse` | regex code fence | string kosong `""` | aman |

Tidak ada penggantian yang tersisa.

### `src/__tests__/ai-prompt-markers.test.ts`

Import ditambah `injectUserContext`; mock `openai` yang sudah ada dipertahankan.
Ditambah satu `describe("penyuntikan konteks pengguna ke system prompt")` dengan
empat test:

1. `targetRole` yang memuat `$&`, `` $` ``, dan `$'` tetap utuh, sekaligus memastikan
   placeholder tidak menyisipkan dirinya sendiri ke dalam isi.
2. `industry` yang memuat `$&` juga tetap utuh (jalur yang sama, nilai yang berbeda).
3. Perilaku lain tidak berubah: konteks lengkap untuk `Data Analyst` /
   `E-commerce` / `mid` / `en` tetap terisi, prompt dibungkus tetap utuh di bagian
   depan dan belakang.
4. Tanpa konteks, prompt dikembalikan apa adanya.

Test 3 dan 4 adalah penjaga regresi: keduanya harus tetap hijau sebelum dan sesudah
fix, jadi hanya test 1 dan 2 yang membuktikan fix ini.

## 3. Bukti TDD (perintah + output)

### Run 1 — gagal, tapi alasan belum tepat

```
npx vitest run src/__tests__/ai-prompt-markers.test.ts --reporter=dot
```

```
 Test Files  1 failed (1)
      Tests  4 failed | 10 passed (14)
```

Keempat test baru gagal dengan `TypeError: injectUserContext is not a function`.
Ini memang kegagalan yang benar (fungsi belum diekspor), tapi belum membuktikan
bug-nya: semua test gagal serempak karena satu hal yang tidak terkait.

### Run 2 — gagal untuk alasan yang tepat (ekspor saja, tanpa fix)

`injectUserContext` diekspor lebih dulu, `.replace` **belum** diubah:

```
npx vitest run src/__tests__/ai-prompt-markers.test.ts --reporter=dot
```

```
 Test Files  1 failed (1)
      Tests  2 failed | 12 passed (14)

 FAIL  penyuntikan konteks pengguna ke system prompt > industri yang memuat pola pengganti juga tetap utuh
AssertionError: expected '--- USER CONTEXT ---\nPosisi Target: …' to contain 'Fintech $&'

- Expected
+ Received
- Fintech $&
+ --- USER CONTEXT ---
+ Posisi Target: (tidak disebutkan)
+ Industri: Fintech {{USER_CONTEXT}}
+ Tingkat Pengalaman: (tidak disebutkan)
+ Bahasa CV: Indonesia
+ --- END CONTEXT ---
```

Inilah bukti korupsinya: `Fintech $&` menjadi `Fintech {{USER_CONTEXT}}` — `$&`
ditafsirkan sebagai "substring yang cocok", yaitu placeholder itu sendiri, dan
disisipkan ke dalam isi konteks. Tidak ada error, prompt hanya diam-diam berubah
isi. Test 1 gagal dengan gejala serupa. Dua test penjaga regresi (3 dan 4) hijau,
seperti yang diharapkan.

### Run 3 — hijau setelah fix

```
npx vitest run src/__tests__/ai-prompt-markers.test.ts --reporter=dot
```

```
 Test Files  1 passed (1)
      Tests  14 passed (14)
   Duration  1.08s
```

### Suite penuh

```
npx vitest run --reporter=dot
```

```
 Test Files  72 passed | 1 skipped (73)
      Tests  853 passed | 1 skipped (854)
   Duration  25.66s
```

(Naik dari 850 menjadi 854 test — empat test baru, nol test yang hilang.)

### Typecheck

```
npx tsc --noEmit -p tsconfig.json
```

Tanpa output, exit code 0.

## 4. Kekhawatiran

1. **Bug yang sama masih ada di luar dua file ini, dan tidak saya sentuh karena
  _constraints.** `src/app/api/checker/analyze/route.ts:204-207` menulis
   `ANALYSIS_PROMPT_V4.replace(/\{\{ROLE_CATEGORY\}\}/g, roleCat)` dengan string
   biasa. Saat ini `roleCat` berasal dari kategori yang dipilih, bukan teks bebas,
   jadi belum exploitable — tapi kalau nilainya nanti berasal dari input pengguna,
   pola yang sama terulang. Perbaikannya satu baris, sama seperti di sini. Perlu
   task sendiri supaya tidak melanggar batas dua file.
2. **Pola `.replace` ini ada di route lain juga.** Beberapa route menyusun
   `userPrompt` dengan `.replace(..., nilaiPengguna)`. Audit menyeluruh di luar
   `adapter.ts` belum dilakukan; temuan ini hanya menutup jalur `adapter.ts`.
   Saran: tambahkan test sumber yang memindai `.replace(/regex/, nilaiNonLiteral)`
   di seluruh `src/app/api/`, supaya kelas bug ini tidak bisa masuk diam-diam lagi.
3. **`injectUserContext` kini bagian API modul** — fungsi murni tanpa efek samping,
   konsisten dengan `splitCvJd` dan `injectInputData` yang sudah diekspor.
4. **Bug lama sempat ada di produksi tanpa terdeteksi.** Tidak ada error, hanya isi
   prompt yang berubah, jadi mustahil terlihat dari log. Test sumber (membaca file dan
   assert polanya) adalah penjaga yang tepat untuk kelas bug ini — hanya menambah
   satu untuk `injectUserContext` akan menutup kasus ini, bukan kasus berikutnya.

---

# Laporan Task 2 (lanjutan 2) — Finding A: route checker, Finding B: penjaga regresi

Status: DONE_WITH_CONCERNS
Commit: `2da3abc` (branch `master`, satu commit)
Ruang lingkup: `src/app/api/checker/analyze/route.ts` + satu file test baru
(`src/__tests__/ai-prompt-replace-safety.test.ts`). `ai-prompt-markers.test.ts` tidak
disentuh karena test baru lebih tepat berdiri sendiri (tidak perlu mock `openai`).

---

## 1. Finding A — `route.ts:204-207`

Tiga penyuntingan placeholder di `ANALYSIS_PROMPT_V4` kini memakai bentuk fungsi:

```ts
systemPrompt: ANALYSIS_PROMPT_V4
  // Bentuk fungsi dipakai, bukan string biasa: isinya berasal dari input
  // pengguna (role dari form, isi dari kode), dan "$&" pada data itu akan
  // ditafsirkan sebagai pola pengganti kalau dipakai string biasa. Prompt
  // jadi rusak tanpa error, jadi bentuk fungsi dipakai sejak awal.
  .replace(/\{\{ROLE_CATEGORY\}\}/g, () => roleCat)
  .replace(/\{\{OUTPUT_LANGUAGE\}\}/g, () => outputLang)
  // Kedalaman bullet review mengikuti tier akses, hemat token untuk free/flash.
  .replace(/\{\{BULLET_MAX\}\}/g, () => (useReasoner ? "5" : "3")),
```

Perilaku prompt tidak berubah: nilai yang masuk ke model identik untuk input yang
tidak memuat `$&`, dan untuk input `$&` sekarang tidak rusak. `roleCat` sendiri
sudah tervalidasi sebagai nilai select, jadi ini pencegahan, bukan perbaikan bug
yang tereksploitasi.

## 2. Finding B — test sumber yang menangkap kelas bug ini

File baru `src/__tests__/ai-prompt-replace-safety.test.ts`. Berbeda dari test
sebelumnya yang menguji *nilai* yang keluar dari fungsi, test ini memindai
*bentuk kode* di file yang merakit prompt AI.

**Ruang lingkup:** `src/lib/ai/adapter.ts` + seluruh `src/app/api/**/route.ts`
(ditemukan rekursif). Tidak menyisir aplikasi lain.

**Aturan:** setiap `.replace(pola, pengganti)` di file-file itu harus memakai bentuk
fungsi (`() => nilai`, `(ch) => ...`, `function`, arrow async) atau literal tanpa
interpolasi (string `'...'`, `"..."`, backtick tanpa `${}`; angka;
`true/false/null/undefined`). Selain itu = pelanggaran.

Aturan sengaja dibuat lebih luas dari "variabel berisi data pengguna", karena yang
dipakai di repo hari ini hanyalah placeholder dan literal, jadi tidak ada false
positive, sementara pola seperti `.replace(/x/, userText)` langsung tertangkap.
Verifikasi mutasi ada di bagian 3.

**Cara kerja scanner:** satu tokenisasi jalan (bukan satu regex besar). Mode kode
melompati komentar baris, komentar blok, literal string/template, dan literal regex
(dengan penanganan char-class serta heuristik regex-vs-pembagian). `.replace(` di
dalam komentar atau string tidak ikut terhitung — ini yang mencegah false positive
dari komentar berbahasa Indonesia yang menjelaskan bug-nya sendiri.

Tiga test:

1. `scanner benar-benar menangkap pola berbahaya` — penjaga untuk test-nya sendiri.
   Memindai sampel tujuh baris dan menyatakan persis baris mana yang harus
   dilaporkan (`.replace('{{CV_TEXT}}', cv)`,
   `.replace(/\{\{BULLET_MAX\}\}/g, useReasoner ? '5' : '3')`, dan
   `.replace(/x/, userText)`), sementara bentuk fungsi, literal polos, panah
   `(ch) => ...`, dan `.replace` di dalam komentar semuanya harus lolos. Tanpa test
   ini, scanner yang diam-diam rusak akan membuat test utama hijau tanpa alasan.
2. `tidak ada penyuntingan string biasa di file prompt AI` — aturan utamanya.
3. `daftar pengecualian yang basi langsung dibersihkan` — lihat bagian 4.

## 3. Bukti TDD (perintah + output)

### Run 1 — RED

```
npx vitest run src/__tests__/ai-prompt-replace-safety.test.ts --reporter=verbose
```

```
 x scanner benar-benar menangkap pola berbahaya -> expected [ 1, 3, 4, 5, 7 ] to deeply equal [ 3, 4, 5 ]
 x tidak ada penyuntingan string biasa di file prompt AI
 x daftar pengecualian yang basi langsung dibersihkan

AssertionError: expected [ ...(11) ] to deeply equal []
- []
+ [
+   "src/lib/ai/adapter.ts:97 -> .replace(\"{{USER_CONTEXT}}\", ()",
+   "src/lib/ai/adapter.ts:156 -> .replace(\"{{INPUT_DATA}}\", ()",
+   "src/lib/ai/adapter.ts:157 -> .replace(\"{{CV_TEXT}}\", ()",
+   "src/lib/ai/adapter.ts:158 -> .replace(\"{{JD_TEXT}}\", ()",
+   "src/lib/ai/adapter.ts:159 -> .replace(\"{{PROFILE_DATA}}\", ()",
+   "src\\app\\api\\checker\\analyze\\route.ts:204 -> .replace(/\\{\\{ROLE_CATEGORY\\}\\}/g, roleCat)",
+   "src\\app\\api\\checker\\analyze\\route.ts:205 -> .replace(/\\{\\{OUTPUT_LANGUAGE\\}\\}/g, outputLang)",
+   "src\\app\\api\\checker\\analyze\\route.ts:207 -> .replace(/\\{\\{BULLET_MAX\\}\\}/g, useReasoner ? \"5\" : \"3\")",
+   "src\\app\\api\\cv-documents\\create\\route.ts:65 -> .replace(\"{{CURRENT_DATE}}\", todayDate)",
+   "src\\app\\api\\cv-documents\\create\\route.ts:65 -> .replace(\"{{TARGET_LANGUAGE}}\", targetLang)",
+   "src\\app\\api\\jobs\\route.ts:42 -> .replace(/[\\\\%_]/g, (ch)",
+ ]

 Test Files  1 failed (1)
      Tests  3 failed (3)
```

Enam temuan di `adapter.ts` dan `jobs/route.ts` adalah **false positive dari scanner
sendiri**, bukan temuan di kode: `readArg` versi pertama salah memperlakukan kurung
pembuka fungsi panah (`()`) sebagai akhir ekspresi, sehingga `() => contextStr`
terpotong jadi `()`. Diperbaiki dengan menghormati kedalaman kurung.

### Run 2 — RED untuk alasan yang tepat

Setelah parser diperbaiki, `route.ts` belum disentuh:

```
 Tests  2 failed | 1 passed (3)

+ [
+   "src\\app\\api\\checker\\analyze\\route.ts:204 -> .replace(/\\{\\{ROLE_CATEGORY\\}\\}/g, roleCat)",
+   "src\\app\\api\\checker\\analyze\\route.ts:205 -> .replace(/\\{\\{OUTPUT_LANGUAGE\\}\\}/g, outputLang)",
+   "src\\app\\api\\checker\\analyze\\route.ts:207 -> .replace(/\\{\\{BULLET_MAX\\}\\}/g, useReasoner ? \"5\" : \"3\")",
+   "src\\app\\api\\cv-documents\\create\\route.ts:65 -> .replace(\"{{CURRENT_DATE}}\", todayDate)",
+   "src\\app\\api\\cv-documents\\create\\route.ts:65 -> .replace(\"{{TARGET_LANGUAGE}}\", targetLang)",
+ ]
```

Tiga temuan pertama = Finding A. Dua terakhir = temuan baru di luar lingkup file
yang boleh disentuh (bagian 4). Tidak ada satu pun false positive di 19 pemakaian
`.replace()` yang lain di ruang lingkup; semuanya sudah diaudit satu per satu lewat:

```
rg -n --no-heading "\.replace\(" src/lib/ai/adapter.ts src/app/api
```

### Run 3 — masih 2 gagal, karena nama file berseparator berbeda

Jalur dari `path.join` memakai `\` sedangkan kunci `KNOWN_UNFIXED` memakai `/`,
jadi allowlist tidak cocok. Separator dinormalkan di `collectRouteFiles`.

### Run 4 — GREEN

```
npx vitest run src/__tests__/ai-prompt-replace-safety.test.ts --reporter=verbose

 v scanner benar-benar menangkap pola berbahaya 4ms
 v tidak ada penyuntingan string biasa di file prompt AI 68ms
 v daftar pengecualian yang basi langsung dibersihkan 53ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

### Verifikasi mutasi — test benar-benar menangkap reintroduksi

`.replace(/\{\{ROLE_CATEGORY\}\}/g, () => roleCat)` dikembalikan sementara menjadi
`roleCat`, lalu test dijalankan lagi:

```
$ npx vitest run src/__tests__/ai-prompt-replace-safety.test.ts --reporter=dot

+   "src/app/api/checker/analyze/route.ts:208 -> .replace(/\\{\\{ROLE_CATEGORY\\}\\}/g, roleCat)",

 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
```

File dikembalikan seperti semula setelahnya, terverifikasi lewat
`rg -n "ROLE_CATEGORY" src/app/api/checker/analyze/route.ts`.

### Suite penuh

```
npx vitest run --reporter=dot

 Test Files  73 passed | 1 skipped (74)
      Tests  856 passed | 1 skipped (857)
   Duration  39.93s
```

Naik dari 854 menjadi 857 test: tiga test baru, nol test yang hilang. Test yang
ter-skip sudah ter-skip sebelum task ini, yaitu
`src/__tests__/portfolio-theme-fingerprint.test.ts:122` (`it.skip` untuk
`PENDING_SECTIONS`, disengaja). Tidak ada skip baru.

### Typecheck

```
npx tsc --noEmit -p tsconfig.json
```

Tanpa output, exit code 0.

## 4. Temuan baru di luar lingkup file yang boleh disentuh

Aturan yang cukup presisi untuk tidak ber-false-positive **tetap** menandai
`src/app/api/cv-documents/create/route.ts:65`:

```ts
systemPrompt: GENERATOR_PROMPT_V2.replace("{{CURRENT_DATE}}", todayDate).replace("{{TARGET_LANGUAGE}}", targetLang),
```

Ini pola yang sama persis: `todayDate` dan `targetLang` dikirim sebagai string
biasa. Hari ini belum exploitable, karena `todayDate` berasal dari `new Date()`
dan `targetLang` adalah hasil validasi string yang di-trim. Tapi ini persis
"satu perubahan validasi lagi" seperti yang dimaksud Finding A, jadi saya
laporkan sebagai temuan terbuka, bukan saya perbaiki karena
`cv-documents/create/route.ts` di luar file yang boleh saya ubah.

Konsekuensinya untuk test: `KNOWN_UNFIXED` berisi entri
`"src/app/api/cv-documents/create/route.ts": 2`. Allowlist ini **bukan** pengecualian
diam-diam:

- Test utama tetap gagal kalau ada pelanggaran baru di file itu.
- Test `daftar pengecualian yang basi langsung dibersihkan` menghitung ulang jumlah
  pelanggaran nyata dan gagal kalau angkanya tidak sama dengan yang tercatat. Jadi
  begitu `cv-documents/create/route.ts` diperbaiki, test gagal dan memaksa entri
  dihapus. Allowlist tidak bisa lapuk.

Kalau task berikutnya mengizinkan file itu, perbaikannya dua baris
(`() => todayDate`, `() => targetLang`) lalu hapus entri allowlist.

## 5. Kekhawatiran

1. **Dua pelanggaran masih terbuka di `cv-documents/create/route.ts`** (bagian 4).
   Perbaikannya sepele, tapi harus di file yang benar.
2. **Aturan lebih luas dari "data pengguna".** `.replace(pola, KONSTANTA)` di file
   prompt akan ikut dilaporkan walau aman. Itu derau yang bisa diterima supaya
   scanner tetap sederhana; kalau someday mengganggu, allowlist per-needle adalah
   jalan keluarnya.
3. **Scanner adalah parser mini, bukan parser JS.** Heuristik regex-vs-pembagian
   bisa salah pada kode yang belum ada (misalnya regex yang muncul setelah `)`).
   Kalau nanti ada false positive, titik yang perlu diperbaiki adalah `isRegexStart`,
   bukan dengan melonggarkan assertion test.
4. **Test bergantung pada CWD**, sama seperti `ai-prompt-markers.test.ts` yang sudah
   ada (`readFileSync` dengan path relatif dari root repo). Konvensi yang sudah dipakai
   repo, bukan masalah baru.
5. **Kunci allowlist memakai separator `/`** sementara `readFileSync` membaca apa
   adanya. Aman di Windows dan POSIX karena `node:fs` menerima keduanya; separator
   sudah dinormalkan supaya pesan kegagalan dan kunci allowlist identik.
