### Task 3: Migrasi token file B + buka todo Layer A

**Files:**
- Modify: `src/components/portfolio/sections/ExperienceSection.tsx`, `EducationSection.tsx`, `CertificationsSection.tsx`, `OrganizationsSection.tsx`, `HobbiesSection.tsx`, `TestimonialsSection.tsx`
- Modify: `src/__tests__/portfolio-theme-rules.test.ts` (hapus `PENDING_FILES`)

**Interfaces:**
- Sama dengan Task 2; setelah ini Layer A menyapu semua file tanpa pengecualian.

- [ ] **Step 1: Tulis test yang menuntut ke enam file (gagal)**

Jika `PENDING_FILES` masih berisi entri, test tetap lolos — jadi langkah pertama: **hapus `PENDING_FILES`** dan jalankan.

Run: `npx vitest run src/__tests__/portfolio-theme-rules.test.ts` → gagal di ke-enam file.

- [ ] **Step 2: Migrasi ke-enam file dengan pola identik Task 2 Step 3**

- Perhatian khusus `ExperienceSection`: `boxShadow` kartu timeline + `borderRadius` varian Luxe; `EducationSection`: stepper Brutal (harus jadi siku, `radii: 0` alami); `HobbiesSection` & `TestimonialsSection`: chip/rounded-full pill → `theme.radii.pill`.

- [ ] **Step 3: Verifikasi penuh**

```bash
npx vitest run src/__tests__/portfolio-theme-rules.test.ts   # 0 gagal, 0 pending
npm test
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/portfolio/sections src/__tests__/portfolio-theme-rules.test.ts
git commit -m "refactor(portfolio): migrasi token 6 section sisa, Layer A tanpa pengecualian"
```

---
