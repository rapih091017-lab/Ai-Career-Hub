### Task 8: Re-compose section B — Certifications, Organizations, Hobbies (× 3) + pass copy publik

**Files:**
- Modify: `src/components/portfolio/sections/CertificationsSection.tsx`, `OrganizationsSection.tsx`, `HobbiesSection.tsx`
- Modify: semua `src/components/portfolio/sections/*.tsx` (pass copy — hanya string Inggris yang tersisa)
- Modify: `src/__tests__/portfolio-theme-fingerprint.test.ts` (pastikan `PENDING_SECTIONS` tetap/berakhir kosong)

**Interfaces:**
- Sama dengan Task 7.

- [ ] **Step 1: Re-compose ketiga section (pola identik Task 7)**

Perhatian: `HobbiesSection` Glass saat ini chip-cloud — chip bulat berpotensi melanggar `radii.pill`/aturan tema; pastikan tetap lolos Layer A.

- [ ] **Step 2: Pass copy Indonesia di SEMUA section**

`rg -n 'View Work|INTRODUCING|Selected Projects|Nowhere|Read More|Core Competencies|WORK\b' src/components/portfolio/sections/` → nol hasil setelah pass. Cari juga string campur lain dengan membaca tiap file (test boleh ditambah: `it("tanpa string Inggris terdeteksi", …)` dengan daftar kata sasaran — pilih kata yang benar-benar ada, jangan daftar kosong yang selalu lolos).

- [ ] **Step 3: Fingerprint `PENDING_SECTIONS` kosong + verifikasi**

```bash
npm test && npx tsc --noEmit
```
Banding visual 3 tema untuk ketiga section, deskripsi di laporan.

- [ ] **Step 4: Commit**

```bash
git add src/components/portfolio/sections src/__tests__/
git commit -m "feat(portfolio): re-compose Certifications/Organizations/Hobbies + satu suara copy Indonesia"
```

---
