### Task 10: Gate akhir — 4 konsumen identik + suite penuh

**Files:**
- Modify: hanya bila gate menemukan kegagalan

**Interfaces:**
- Verifikasi, tanpa fitur baru.

- [ ] **Step 1: Test penuh + typecheck + lint + build**

```bash
npm test
npx tsc --noEmit
npm run lint -- --no-warn-ignored   # harus 0 error
$env:DATABASE_URL='postgresql://build:build@localhost:5432/build'; $env:AUTH_SECRET='build-only-secret'; $env:DEEPSEEK_API_KEY='build-only-key'; $env:NEXT_PUBLIC_BASE_URL='http://localhost:3000'; npm run build
```

- [ ] **Step 2: Cek konstraint (nol temuan)**

```bash
rg -n 'text-\[(8|9|10|11)px\]' src/components/portfolio src/app/portfolio     # nol
rg -n 'rounded-|shadow-|backdrop-blur|#[0-9a-fA-F]{6}' src/components/portfolio/sections src/components/portfolio/render -g '*.tsx'   # nol (setelah stripAllowlist)
rg -n 'cdnfonts|View Work|INTRODUCING|Selected Projects' src/                  # nol
```

- [ ] **Step 3: Smoke 4 konsumen (server lokal, env .env sudah valid)**

`npm run dev` → untuk `themeId` di `glass|brutal|luxe`: `/portfolio/preview?template=<id>` 200, `/api/portfolio/export?draftId=<id>` menghasilkan HTML dengan font link Google + tanpa `backdrop-filter` yang salah, `/p/<slug>` 200 bila ada data uji (atau n/a). Catat hasil per tema.

- [ ] **Step 4: Commit hasil perbaikan bila ada**

```bash
git add -A && git commit -m "fix(portfolio): perbaikan hasil gate spec 2" # hanya bila ada perubahan
```

---
