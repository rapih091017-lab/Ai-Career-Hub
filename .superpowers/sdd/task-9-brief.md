### Task 9: Picker tema — thumbnail nyata + deskripsi per tema

**Files:**
- Modify: `src/app/portfolio/page.tsx` (kartu picker)
- Modify: `src/lib/i18n.tsx` (deskripsi 1 baris per tema, id + en)
- Modify: `src/components/PortfolioSpotlight.tsx` bila memakai mockup sama

**Interfaces:**
- Consumes: `PortfolioDocument` (mode `static`, ukuran mini) atau `TEMPLATE_PREVIEWS` data; `THEMES[id].name`.

- [ ] **Step 1: Tulis test (gagal)**

```ts
  it("kartu picker merender dua tema yang berbeda strukturally, bukan cuma warna", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(join(process.cwd(), "src/app/portfolio/page.tsx"), "utf8");
  // berhenti memakai DOM mockup identik
  expect(src).not.toContain("TEMPLATE_PREVIEWS"); // bila keputusan Anda: render via PortfolioDocument
  expect(src).toContain("theme.descriptionKey"); // kunci deskripsi per kartu
});
```
Sesuaikan assertion dengan keputusan implementasi; inti: dua kartu tema berbeda tidak menghasilkan struktur HTML identik, dan tiap kartu punya deskripsi satu baris.

- [ ] **Step 2: Implementasi**

Ganti mockup JSX identik dengan renderer mini: mount `PortfolioDocument mode="static"` dalam kartu ber-`overflow-hidden` dan tinggi tetap (atau konversi screenshot-style markup per tema bila render penuh terlalu berat — pilih satu, jelaskan di laporan). Tambahkan baris deskripsi satu baris per tema (i18n, contoh nada: Glass "Kaca buram dan bunga cahaya", Brutal "Kotak tajam, bayangan keras", Luxe "Serif besar, ruang lega") dan penanda tema default.

- [ ] **Step 3: Verifikasi + commit**

```bash
npm test && npx tsc --noEmit
git add src/app/portfolio/page.tsx src/lib/i18n.tsx src/components/PortfolioSpotlight.tsx src/__tests__/
git commit -m "feat(portfolio): thumbnail picker dari renderer nyata + deskripsi tema"
```

---
