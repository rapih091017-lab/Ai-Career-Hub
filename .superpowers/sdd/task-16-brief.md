### Task 16: Verifikasi akhir & pemeriksaan mutu

**Files:**
- Modify: berkas mana pun yang gagal pemeriksaan

**Interfaces:**
- Memastikan semua constraint global terpenuhi

- [ ] **Step 1: Typecheck dan test penuh**

```bash
npx tsc --noEmit
npm test
```
Expected: 0 error TypeScript, semua test lulus.

- [ ] **Step 2: Build produksi**

```bash
$env:DATABASE_URL='postgresql://build:build@localhost:5432/build'
$env:AUTH_SECRET='build-only-secret'
$env:DEEPSEEK_API_KEY='build-only-key'
$env:NEXT_PUBLIC_BASE_URL='http://localhost:3000'
npm run build
```
Expected: build sukses, `/p/[slug]` dan route export ter-render.

- [ ] **Step 3: Lint**

```bash
npm run lint -- --no-warn-ignored
```
Expected: 0 error. Warning yang sudah ada sebelumnya boleh tetap.

- [ ] **Step 4: Pemeriksaan mutu layout portfolio**

```bash
rg -n 'text-\[(8|9|10|11)px\]' src/components/portfolio src/app/portfolio
```
Expected: tidak ada hasil.

```bash
rg -n 'rounded-full|rounded-\[' src/components/portfolio/render
```
Expected: tidak ada hasil. Berkas render baru tidak boleh meng-hardcode bentuk.

```bash
rg -n '#[0-9A-Fa-f]{6}' src/components/portfolio/render
```
Expected: tidak ada warna hex. Semua warna lewat token tema.

- [ ] **Step 5: Pastikan tidak ada tautan mentah di pohon publik**

```bash
rg -n 'href=\{' src/components/portfolio/sections
```
Expected: setiap hasil adalah `<SafeLink>`, bukan `<a>`. Jika masih ada `<a href={...}>`, ganti dengan `SafeLink`.

- [ ] **Step 6: Verifikasi manual di browser**

Jalankan `npm run dev`, lalu periksa:

1. `/portfolio/build` membuat draft lalu mengarahkan ke `/portfolio/build/<id>`
2. Menutup tab dan membuka kembali: draft masih ada, dari server
3. Mematikan jaringan, mengetik,Gpada banner offline muncul dan isinya tersimpan di cache
4. Preview, halaman publik, dan file HTML export punya isi yang sama
5. `?print=1` menyembunyikan grain dan orb
6. Asset yang diunggah tampil di preview, publik, dan export
7. Unpublish membuat halaman 404 tetapi data masih ada; publish ulang mengembalikan slug yang sama
8. Semua tombol hero menggulir ke section yang benar

- [ ] **Step 7: Commit akhir bila ada perbaikan**

```bash
git add -A
git commit -m "fix(portfolio): perbaikan hasil pemeriksaan mutu"
```

---
