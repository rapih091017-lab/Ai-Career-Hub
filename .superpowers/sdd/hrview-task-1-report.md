# Laporan Task 1 — Perbaiki penanda CV/JD yang panting

Status: DONE_WITH_CONCERNS
Commit: `eabdcfa0d4a5a444bf8e07358339495dd1133d68`
Branch: `master`

---

## 1. Yang diubah per file

### `src/lib/ai/prompts/shared.ts` (modify)

Menambah satu export konstanta di bagian atas file, sebelum export lain:

```ts
export const PROMPT_MARKERS = {
  cv: "=== CV KANDIDAT ===",
  jd: "=== JOB DESCRIPTION TARGET ===",
  /** Penanda versi lama. Tetap dikenali supaya prompt yang ditulis sebelum
   *  jd ada tidak ikut rusak, tapi tidak boleh dipakai lagi saat menulis prompt. */
  legacyJd: "=== JOB DESCRIPTION ===",
} as const;
```

`legacyJd` adalah tambahan di luar cuplikan brief. Alasannya ada di bagian 3 (Defect B).

### `src/lib/ai/adapter.ts` (modify)

- Import baru: `import { PROMPT_MARKERS } from "@/lib/ai/prompts/shared";`
- Blok `injectInputData` diganti: logic pemisahan dipindah ke fungsi
  `export function splitCvJd(data)` yang baru, lalu `injectInputData` tinggal
  memanggilnya. Fungsi sengaja diekspor supaya bisa diuji langsung, bukan
  lewat salinan logika di dalam file test.
- `injectInputData` sekarang memakai `.replace("{{CV_TEXT}}", cv)` dan
  `.replace("{{JD_TEXT}}", jd)` dari hasil split.
- Penanda literal tidak lagi ditulis di file ini; semuanya lewat
  `PROMPT_MARKERS`.

### `src/app/api/checker/analyze/route.ts` (modify)

- Import baru: `import { PROMPT_MARKERS } from "@/lib/ai/prompts/shared";`
- Baris `userPrompt` sekarang memakai `${PROMPT_MARKERS.cv}` dan
  `${PROMPT_MARKERS.jd}` (bentuk string setelah perubahan isinya identik
  dengan sebelumnya — nilai penandanya sama persis, yang berubah adalah
  sumbernya).

### `src/__tests__/ai-prompt-markers.test.ts` (test, baru)

Semua isi test dari Step 1 dan Step 6 brief dipakai apa adanya. Ditambah satu
blok `vi.mock("openai", ...)` di bagian atas — lihat bagian 3 (Defect C).

---

## 2. Perintah test yang dijalankan

### Step 2 — test harus gagal (RED)

```
npx vitest run src/__tests__/ai-prompt-markers.test.ts --reporter=dot
```

Output (dipotong di bagian yang relevan):

```
 RUN  v4.1.10 D:/ai-career-hub

xx

⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯

 FAIL  src/__tests__/ai-prompt-markers.test.ts > penanda blok CV dan JD > adapter dan route memakai penanda yang sama
AssertionError: expected 'import OpenAI from "openai";\nimport …' to contain 'PROMPT_MARKERS'

- Expected
+ Received

- PROMPT_MARKERS
+ import OpenAI from "openai";
+ import { ZodSchema, ZodError } from "zod";
+ import { AI_SCHEMAS, AiTaskType } from "./prompts/schemas";

 Test Files  1 failed (1)
      Tests  2 failed (2)
```

Test kedua gagal di baris `expect(route).toContain("PROMPT_MARKERS.jd")`.
Kedua test gagal karena alasan yang benar (konstanta belum ada di kedua file),
jadi testnya memang membuktikan bug-nya, bukan gagal karena salah import atau
setup.

### Step 7 — setelah implementasi (GREEN)

```
npx vitest run src/__tests__/ai-prompt-markers.test.ts --reporter=dot
```

```
 RUN  v4.1.10 D:/ai-career-hub

·····

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  1.67s
```

Catatan: brief menyebut "Expected: PASS (7 test)", padahal Step 1 menulis 2 test
dan Step 6 menulis 3 test — total 5. Semua 5 ada dan hijau.

### Step 8a — typecheck

```
npx tsc --noEmit -p tsconfig.json
```

Tidak ada output. Bersih.

### Step 8b — suite penuh

```
npx vitest run --reporter=dot
```

```
 Test Files  71 passed | 1 skipped (72)
      Tests  839 passed | 1 skipped (840)
   Duration  25.73s
```

Tidak ada test lama yang gagal. Warning `act(...)` dan "Reduced Motion" yang
muncul di stderr sudah ada sebelum perubahan ini (test pricing-section dan
portfolio-picker), tidak terkait.

---

## 3. Hal yang ambigu atau salah di brief, dan cara saya menyelesaikannya

Brief punya tiga defect. Semuanya saya perbaiki di sisi implementasi, bukan
dengan weakens test, supaya semua assertion dari brief tetap utuh.

### Defect A — regex ter-escape dua kali (fatal, test mustahil hijau)

Cuplikan Step 4 menulis:

```ts
.replace(/^=== ROLE CATEGORY:[^\\n]*\\n+/, "")
```

Dalam TypeScript itu berarti "huruf apa saja kecuali backslash dan `n`" dan
"backslash literal diikuti satu atau lebih `n`" — bukan newline. Role category
tidak akan pernah terbuang.

**Resolusi:** ditulis `/^=== ROLE CATEGORY:[^\n]*\n+/`. Kemungkinan brief ini
melewati satu lapis escaping saat plan ditulis. Test Step 6 pertama hanya
hijau dengan bentuk yang benar, jadi ini perbaikan yang tidak bisa dielakkan.

### Defect B — Step 1 melarang literal penanda, Step 4 memakainya (kontradiksi)

Test Step 1 berisi:

```ts
expect(adapter).not.toContain('"=== JOB DESCRIPTION ==="');
```

tapi implementasi Step 4 sendiri menulis literal itu di `adapter.ts` sebagai
penanda legacy. Dua instruksi brief saling meniadakan — dengan implementasi
literal brief, test itu pasti merah (sudah saya buktikan: run ketiga gagal
dengan `expected ... not to contain '"=== JOB DESCRIPTION ==="'`).

Dua pilihan: longgarkan assertion-nya, atau pindahkan literal penanda legacy ke
satu-satunya tempat yang memang ditunjuk brief.

**Resolusi:** literal legacy dipindah ke `PROMPT_MARKERS.legacyJd` di
`shared.ts`, dan `adapter.ts` mereferensikannya. Semua assertion Step 1 tetap
persis seperti brief, dan intent brief ("penandanya dipindah ke satu tempat
supaya tidak bisa lagi berbeda") justru lebih terpenuhi. Konsekuensinya: tipe
`PROMPT_MARKERS` jadi punya tiga key, bukan dua seperti tertulis di bagian
"Produces" brief.

### Defect C — `jd` masih berisi marker, tapi test mengharapkan isinya saja

Step 4 menulis `data.slice(cut).trim()`, jadi penanda JD ikut tertinggal di
`jdText`. Test Step 6 mengharapkan `jd` = `"Butuh AWS"` tanpa marker. Dua test
gagal karena itu (run kedua: `expected '=== JOB DESCRIPTION ===\nButuh AWS' to
be 'Butuh AWS'`).

**Resolusi:** dihitung penanda mana yang cocok, lalu `slice(cut + marker.length)`
— persis seperti perilaku `injectInputData` yang lama
(`data.slice(jdIndex + JD_MARKER.length)`), sehingga tidak ada regresi
perilaku untuk pemanggil lain.

### Defect D — mengimpor `adapter.ts` di test membuat test crash sebelum jalan

`adapter.ts` menjalankan `new OpenAI({...})` di level modul. SDK OpenAI
melempar `Missing credentials` kalau `DEEPSEEK_API_KEY`/`OPENAI_API_KEY` tidak
ada, dan `setup-globals.ts` tidak menyetelnya. Import langsung
`import { splitCvJd } from "@/lib/ai/adapter"` membuat seluruh file test gagal
saat load (`Tests  no tests`), bukan gagal dengan assertion yang bermakna.

**Resolusi:** tambah `vi.mock("openai", ...)` di file test dengan stub kelas
minimal. Ini satu-satunya file di luar empat file yang boleh saya ubah yang
layak disentuh — `setup-globals.ts` ada di luar scope, dan menyetel env
global untuk semua test demi satu file test ini juga berlebihan. Tidak ada
panggilan jaringan yang terjadi; `splitCvJd` adalah fungsi murni.

### Catatan kecil

- Karakter `�` di beberapa tempat brief (commit message: "dikirim kosong �")
  adalah artefak encoding. Diganti dengan `-`.
- Tambahan di luar brief pada `adapter.ts`: import `PROMPT_MARKERS` memakai
  alias `@/lib/ai/prompts/shared` seperti diminta brief, berdampingan dengan
  import relatif `"./prompts/schemas"` yang sudah ada. Keduanya resolve ke
  modul yang sama.

---

## 4. Kekhawatiran

1. **`PROMPT_MARKERS` punya tiga key, bukan dua** seperti diklaim brief di
   bagian "Produces". Jika task berikutnya melakukan narrowing tipe atau
   spread objek ini ke tempat yang menganneksikan hanya `cv`/`jd`, itu akan
   terlihat. Saya pilih ini karena menjaga assertion brief tetap utuh.

2. **Test Step 1 adalah grep terhadap source code**, bukan uji perilaku. Ia
   menangkap drift penanda yang ditulis manual, tapi tidak menangkap pemanggil
   lain yang menyusun prompt dengan format sendiri. Test Step 6 menutup
   perilaku splitter-nya, tapi tidak menutup pemanggil yang lain. Kalau ada
   endpoint lain yang mengirim format penanda berbeda ke `callAI`, jalur itu
   tidak terpakai test. Saya belum menyisir seluruh pemanggil `callAI` karena
   itu di luar scope task ini.

3. **Isi `{{CV_TEXT}}` jadi lebih bersih dari sebelumnya.** Dulu `cv` berisi
   marker `=== CV KANDIDAT ===` dan baris `=== ROLE CATEGORY: ... ===`; sekarang
   keduanya dibuang. `analysis-v4.ts` tidak saya periksa untuk memastikan
   ekspektasinya tidak bergantung pada penanda itu — brief melarang menyentuh
   file di luar empat, dan membaca tanpa mengubah tetap di luar scope. Perilaku
   ini layak diverifikasi di task berikutnya.

4. **`vi.mock("openai")` tidak memengaruhi test lain** (mock bersifat per-file
   di Vitest), tapi menambah satu maintenance point: kalau `adapter.ts` nanti
   diubah cara menginisialisasi kliennya, stub ini harus ikut disesuaikan.

---

# Laporan perbaikan review — Task 1

Status: DONE
Commit: (lihat `git log -1`)
Branch: `master`

Dua temuan review yang ditandai Important, keduanya di `splitCvJd`.

## 1. Temuan 1 — isi CV ikut terhapus diam-diam

### Diagnosis

Implementasi sebelumnya:

```ts
const cvOnly = cvText
  .replace(/^=== ROLE CATEGORY:[^\n]*\n+/, "")
  .split(PROMPT_MARKERS.cv)
  .pop()!
  .trim();
```

`.split(marker).pop()` mengambil teks setelah kemunculan penanda **terakhir**.
Jadi penanda `=== CV KANDIDAT ===` yang muncul di tengah isi CV kandidat —
kasus nyata: kandidat menyalin prompt AI sebelumnya ke kolom CV — diperlakukan
sebagai batas, dan semua teks sebelum penanda itu dibuang tanpa jejak.
`{{CV_TEXT}}` yang terkirim ke model tinggal ekornya.

### Test lebih dulu (RED)

Test baru `CV yang memuat penanda di tengah teks tidak ikut terpotong` memakai
CV yang punya penanda di tengah (`Riwayat: pernah pakai prompt lama` di atas
`Python, SQL, 3 tahun`).

```
npx vitest run src/__tests__/ai-prompt-markers.test.ts --reporter=dot
```

```
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯

 FAIL  src/__tests__/ai-prompt-markers.test.ts > pemisahan CV dan JD di prompt > CV yang memuat penanda di tengah teks
tidak ikut terpotong
AssertionError: expected 'Python, SQL, 3 tahun' to be 'Riwayat: pernah pakai prompt lama\n==…' // Object.is equality
- Expected
+ Received
- Riwayat: pernah pakai prompt lama
- === CV KANDIDAT ===
  Python, SQL, 3 tahun
 ❯ src/__tests__/ai-prompt-markers.test.ts:85:16

 Test Files  1 failed (1)
      Tests  1 failed | 7 passed (8)
```

Gagal karena alasan yang benar: yang diterima adalah teks setelah penanda
terakhir, persis gejala yang dilaporkan. Test `penanda JD yang muncul paling
awal dipakai sebagai batas` dan `data kosong menghasilkan kedua bagian kosong`
sudah hijau pada langkah ini.

### Perbaikan

Penanda hanya dibuang kalau dia benar-benar header blok, yaitu di baris paling
awal setelah baris kategori posisi dibuang. Sisanya dibiarkan utuh:

```ts
let body = cvText.replace(/^=== ROLE CATEGORY:[^\n]*\n+/, "");
if (body.startsWith(PROMPT_MARKERS.cv)) {
  body = body.slice(PROMPT_MARKERS.cv.length);
}
const cvOnly = body.trim();
```

Memakai `startsWith` + `slice` (bukan regex) supaya penanda diperlakukan sebagai
teks biasa dan tidak perlu di-escape.

## 2. Temuan 2 — cabang `useLegacy` tidak punya test

Branch ini nol coverage: step brief hanya pernah mengirim satu penanda, jadi
cabangnya boleh ditulis ulang tanpa test mana pun yang merah. Ditambah test
`penanda JD yang muncul paling awal dipakai sebagai batas` yang mengunci
perilaku yang dinyatakan di komentar kode: **penanda yang muncul paling awal
adalah batasnya**. Test ini mengirim kedua penanda dalam dua urutan (lawas dulu
dan sekarang dulu), jadi kedua percabangan `useLegacy` benar-benar tertutup dan
terbukti.

## 3. Perintah verifikasi

### Test file yang diperluas

```
npx vitest run src/__tests__/ai-prompt-markers.test.ts --reporter=dot
```

```
 Test Files  1 passed (1)
      Tests  8 passed (8)
   Duration  1.04s
```

### Suite penuh

```
npx vitest run --reporter=dot
```

```
 Test Files  71 passed | 1 skipped (72)
      Tests  842 passed | 1 skipped (843)
   Duration  22.18s
```

 Naik dari 839 ke 842: tiga test baru, nol test lama yang berubah atau gagal.

### Typecheck

```
npx tsc --noEmit -p tsconfig.json
```

Tidak ada output, exit 0.

## 4. Kekhawatiran

1. **Penanda `=== JOB DESCRIPTION ===` di dalam isi CV masih memotong CV.**
   Temuan review menyebut ini kelas masalah yang sama, dan memang benar —
   kandidat yang menyalin prompt lama bisa membawa penanda lawas ke dalam CV
   dan `cut` puncaknya jatuh di sana. Saya tidak mengubahnya karena brief
   meminta perilaku "penanda paling awal adalah batas" tetap dijaga,
   dan perubahan aturan batas itu keputusan produk (bagaimana kalau tiga
   penanda muncul?) yang layak task tersendiri. Test baru di bagian 2 justru
   mengunci perilaku yang sekarang, jadi mengubahnya nanti harus ikut
   mengubah test itu.

2. **Perbaikan ini menambah kondisi, bukan menghapus.** `.split().pop()`
   diganti `startsWith` + `slice`; keduanya satu jalur, tidak ada fallback
   yang bisa gagal diam-diam. Test yang mengunci perilaku lama (CV tanpa
   penanda, CV dengan penanda di header) tetap hijau tanpa diubah.

3. **Penanda hanya dikenali di awal baris, bukan setelah spasi.** Kalau prompt
  suatu hari menulis marker dengan indentasi, `startsWith` tidak
   akan menangkapnya dan penanda ikut masuk ke `{{CV_TEXT}}`. Tidak ada
   pemanggil yang melakukan itu sekarang, jadi tidak ada guard tambahan —
   tapi itu titik yang perlu diperhatikan kalau format prompt berubah.
