# Task 4 Report — Layer B semantik + DOM-fingerprint pasangan

Status: **SELESAI, semua hijau.** Branch `feature/portfolio-themes`.

## 1. Perubahan kode

### `src/__tests__/portfolio-theme-rules.test.ts`

- **Blok Layer B ditambahkan persis brief** (4 test): token signature, markup Glass/Brutal/Luxe, cek `case` eksplisit per tema, serif+kroma Luxe. Impor baru: `beforeAll`, `createElement`, `renderToStaticMarkup`, `PortfolioDocument`. `beforeAll` meniru mock `matchMedia` + `IntersectionObserver` dari `portfolio-document.test.tsx` — tanpa keduanya render section di jsdom melempar (bukan test yang dilunakkan, plumbing lingkungan).
- **Pelebaran 1 — `boxShadow` jangkar kunci:**  
  `/boxShadow:\s*["'`]/` → `/boxShadow:\s*[^,;\n]*["'`]/`  
  Deviasi kecil dari teks brief (`[^;\n]*`): pemisah properti objek adalah koma, jadi `[^;\n]` akan menandai baris sah seperti `boxShadow: theme.shadow.card, border: \`1px solid ...\``. `[^,;\n]` tetap menangkap escape ternary (`boxShadow: i % 2 === 0 ? \`6px...\``) dan tetap meloloskan baris ber-token — keduanya dibuktikan di §2.
- **Pelebaran 2 — rule baru `rounded bracket`:** `/\brounded-\[[^\]]+\]/`  
  `\b` penutup dibuang: `]` karakter non-word, jadi `\b` di belakangnya takkan pernah cocok diikuti spasi — pola identik dengan rule `shadow-[...]` Task 3.

### `src/__tests__/portfolio-theme-fingerprint.test.ts` (baru)

Render nyata per tema via `PortfolioDocument` + `renderToStaticMarkup` (`richData` — 12 section terisi, bukan null), kerangka = **urutan tag HTML** per section (teks, atribut, `style` dibuang → beda warna/angka tidak dihitung beda struktur). 12 test (`DEFAULT_SECTION_ORDER`), `PENDING_SECTIONS = []`. Alasan memilih jalur ini, bukan branch-slice sumber: §3.

`themes.ts` dan struktur section tidak disentuh.

## 2. Bukti RED — `.superpowers/sdd/task-4-red.txt`

Scratch `_red-evidence.test.ts` (dihapus setelah dijalankan): **7 failed | 6 passed (13)**.

**Layer B — mutasi pasangan (bukti assert menggigit; kode nyata sudah hijau sejak awal, 0 kegagalan nyata):**

```
× aturan Luxe (tanpa bayangan) bila dijalankan di markup Brutal harus gagal
  AssertionError: expected [ '6px 6px 0 0 currentColor', …(1) ] to deeply equal []
× aturan Brutal (radius nol) bila dijalankan di markup Glass harus gagal
  AssertionError: expected [ '1.5rem' ] to deeply equal []
× aturan switch-case bila satu tema absen dari sumber harus gagal
  AssertionError: expected 'case "glass": return <GlassX />; case…' to match /["']luxe["']/
× aturan blur Glass bila dialihkan ke Luxe harus gagal
  AssertionError: expected '' not to be ''
```

**Pelebaran Layer A — regex lama vs baru terhadap baris historis git:**

```
× regex boxShadow LAMA melewatkan escape ternary — harus gagal (bukti lolos)
  AssertionError: expected false to be true
× regex rounded LAMA melewatkan rounded-[2rem] — harus gagal (bukti lolos)
  AssertionError: expected false to be true
✓ regex boxShadow BARU menangkap escape ternary            (pass)
✓ regex boxShadow BARU tetap meloloskan baris ber-token     (pass)
✓ regex rounded BARU menangkap bracket                      (pass)
```

Sumber baris historis: `boxShadow: i % 2 === 0 ? \`6px 6px 0px ${theme.colors.border}\` : ...` (TestimonialsSection L143 di `9123c10~1`, dimigrasi Task 3) dan `rounded-[2rem]` (ContactSection L124 di `b54d20d`). Terhadap kode sekarang kedua pelebaran **0 match** (Tasks 2–3 sudah memigrasi semua) — jadi RED nyata tidak mungkin; bukti dipindahkan ke baris historis + scratch mutasi.

**Kenapa branch-slice sumber ditolak (1 test pass = bukti non-diskriminatif):**

```
✓ dipotong per case lalu nama komponen dinetralkan, kerangka 12 file identik antar tema
```

Semua 12 file section punya cabang `case "glass"/"brutal"/"luxe"` berbentuk `return <GlassX f={...} />;` — bedanya **hanya nama komponen**. Setelah `(Glass|Brutal|Luxe)` dinetralkan, kerangka ketiga cabang identik di 12/12 file. Fingerprint sumber akan selalu lolos tanpa membuktikan apa pun.

**Bukti fingerprint DOM menggigit (1 red):**

```
× tiga render dipaksa memakai tema sama harus menghasilkan kerangka identik
  AssertionError: expected 1 to be 3
```

**Observasi (pass, dicatat):** markup Glass dengan `miniData` berisi **0** `box-shadow` (`box-shadow count=0`), jadi mutasi aturan Luxe hanya bisa dibuktikan pada markup berbayangan (Brutal). Markup Luxe sendiri punya tepat 1 `box-shadow:none` — assert-nya menangkal Luxe yang pernah diberi bayangan nyata.

## 3. Keputusan pendekatan fingerprint

| | Branch-slice sumber | Render HTML |
|---|---|---|
| Objek | badan `case "<tema>":` | output `renderToStaticMarkup` per tema |
| Hasil | beda **hanya** nama komponen (12/12 identik setelah dinetralkan) | kerangka tag beda **pairwise** di 12/12 section, `kosong=0` |

**Dipilih: render HTML** (jalur wajib brief karena branch-slice terbukti non-diskriminatif saat penulisan). Probe awal: ketiga varian `tagUniq=3` (pasangan beda) untuk semua 12 section dengan `richData` — tidak ada section yang masuk `PENDING_SECTIONS`. Strip dilakukan ke teks, atribut, dan `style` saja; hex/angka warna memang hidup di `style` sehingga otomatis netral.

## 4. Bukti GREEN — `.superpowers/sdd/task-4-green.txt`

```
npx vitest run src/__tests__/portfolio-theme-rules.test.ts
  Test Files  1 passed (1)
      Tests  24 passed (24)          # 20 (Layer A, dengan 2 pelebaran) + 4 (Layer B)

npx vitest run src/__tests__/portfolio-theme-fingerprint.test.ts
  Test Files  1 passed (1)
      Tests  12 passed (12)

npm test
  Test Files  26 passed (26)
      Tests  442 passed (442)        # 426 baseline + 4 Layer B + 12 fingerprint
  (exit 0)

npx tsc --noEmit → exit 0 (tanpa error)
```

Layer B hijau **percobaan pertama** — tidak ada kegagalan kode nyata; seluruh literal sudah dimigrasi Task 2–3 dan `case` per tema sudah eksplisit di 12 file (dikonfirmasi juga oleh rule switch-case Layer B).

## 5. Concerns

- **Assert serif Luxe lemah:** `/serif/i` juga cocok pada `"sans-serif"` — mutasi ke `THEMES.brutal.typography.display` tetap lolos (terbukti di red run). Assert `bg ≠ #FFFFFF` juga hanya menangkal putih murni. Test dibiarkan persis brief (dilarang melunakkan; penguatan di luar mandat). Kalau mau diperkuat: `/serif\s*$/` pada `typography.display`.
- **`boxShadow` multi-line** (`boxShadow:` newline lalu template) tetap lolos — `[^,;\n]` tak boleh lintas baris. Tidak ada pola itu di `sections/`+`render/`; upgrade path: parser AST, hanya bila pola itu muncul.
- **`heroPhotoUrl` kosong** di `richData` → `<img>` tidak ikut fingerprint. Bila Task 7/8 menambah elemen yang bergantung foto, isi `heroPhotoUrl` dengan data-URL kecil agar kerangka hero lengkap.
- **`borderRadius: 12` numerik** (`PortfolioPhotoUpload.tsx`, render) lolos rule berjangkar-kuotasi — di luar dua pelebaran yang diminta, dan komponen ini tidak ikut render statis `PortfolioDocument`.
- **Aturan `boxShadow` baru punya satu celah tersisa:** literal yang diawali ekspresi ber-koma sebelum kuotasi pertama (mis. `boxShadow: cond(a, b) ? \`x\``) lolos karena `[^,;\n]` berhenti di koma. Celah ini sengaja dibayar demi tidak menandai baris `boxShadow: theme.shadow.card, border: \`...\`` yang sah; belum ada pola celah itu di kode, dan jalur upgrade-nya parser AST.
- Working tree sudah berisi modifikasi ledger `.superpowers/*.md` sebelum Task 4. **Tidak ikut di-commit** — sesuai brief hanya dua file test.

## Fix wave 1 (controller)
- Test serif Luxe diperketat: regex sebelumnya /serif/i lolos berkas 'sans-serif' (nyaris tanpa daya). Kini: wajib mulai 'Playfair Display', serif dan bebas sans-serif + guard Glass/Brutal wajib sans. 443/443, tsc 0, rules file 25/25.
