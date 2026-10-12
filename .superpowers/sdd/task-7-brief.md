### Task 7: Re-compose section A — About, Experience, Education (× 3 tema)

**Files:**
- Modify: `src/components/portfolio/sections/AboutSection.tsx`, `ExperienceSection.tsx`, `EducationSection.tsx`

**Interfaces:**
- Consumes: token, kontras, `resolveVisibility` tidak berubah; props per section tidak berubah (jangan ubah signature — `PortfolioDocument` bergantung padanya).

- [ ] **Step 1: Baca pola varian + tetapkan struktur per tema (deskripsi singkat di laporan)**

Untuk tiap section tetapkan kerangka yang BERBEDA struktural antar tema:
- **Glass**: kartu efek kaca / bento / kolom kontras (acuan yang sudah ada — jangan dipakai ulang utuh di tema lain).
- **Brutal**: blok bernomor atau strip dengan bayangan hard, sudut siku, rotasi halus, border tebal.
- **Luxe**: baris hairline / kolom asimetris dengan serif sebagai hierarki — **tanpa kartu** (kini melanggar aturan Luxe; re-compose ini memperbaikinya).

- [ ] **Step 2: Implementasi — komposisi benar-benar berbeda, bukan restyle**

Aturan: urutan elemen, mekanisme hierarki (kartu vs baris vs kolom), dan struktur layout berbeda; tidak boleh hanya nilai warna/radius. `switch (theme.id)` punya case eksplisit per tema. `onSectionClick`, id anchor, dan `resolveVisibility` tidak berubah.

- [ ] **Step 3: Copy Indonesia**

Ganti string Inggris yang menyentuh ketiga section ini (mis. `Core Competencies`, label eyebrow Inggris) dengan bahasa Indonesia fasih. Konsisten antar tema.

- [ ] **Step 4: Verifikasi**

```bash
npm test   # Layer A + Layer B + fingerprint + kontras harus tetap hijau
npx tsc --noEmit
```
Tambahan: buka preview (`/portfolio/preview?template=…`) dan bandingkan tiga tema secara visual untuk ketiga section — ini tugas dengan bukti visual, lampirkan deskripsi singkat perbandingan di laporan.

- [ ] **Step 5: Commit**

```bash
git add src/components/portfolio/sections/AboutSection.tsx src/components/portfolio/sections/ExperienceSection.tsx src/components/portfolio/sections/EducationSection.tsx
git commit -m "feat(portfolio): komposisi asli per tema untuk About, Experience, Education"
```

---
