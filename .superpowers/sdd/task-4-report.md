# Task 4 Report — Builder, preview, publik pakai satu renderer

**Commit:** `a1b65a2` — `refactor(portfolio): builder, preview, publik pakai satu renderer`

## Per-file changes

### `src/components/portfolio/render/PortfolioDocument.tsx`
- Tambah prop opsional `sectionWrapper?: (id, node) => ReactNode` — khusus editor, supaya canvas bisa membungkus tiap section dengan wrapper sortable dnd-kit TANPA merender section sendiri. Halaman publik tidak memakainya, pohon render tetap satu.
- Tambah prop opsional `sectionStyle?: Partial<Record<SectionId, CSSProperties>>` — meneruskan gaya per section dari editor (perataan teks `alignment` builder, sebelumnya diterapkan lewat wrapper children di live/page). Ini menjaga fitur alignment tetap hidup setelah children API canvas dihapus.

### `src/components/portfolio/PortfolioCanvas.tsx`
- Hapus semua 12 import section. Sekarang menerima `data: PortfolioData` (bukan `children` dengan `data-section-id`) dan merender lewat `<PortfolioDocument mode="editor" …>`.
- **ThemeContext/SectionThemeProvider ownership:** `ThemeContext` tetap DIDEFINISIKAN di PortfolioCanvas (diekspor; PortfolioDocument tetap mengimpornya dari `../PortfolioCanvas` — tidak dipindah, tidak perlu update import). `SectionThemeProvider` DIHAPUS dari canvas: PortfolioDocument sudah handle per-section warna lewat `themeForSection` (baca `theme.sectionColors` + override user), jadi WYSIWYG builder vs publik sekarang identik. `usePortfolioTheme` tetap diekspor dan dipakai 12 section.
- **Drag wrapper selamat:** `SortableSection` (dnd-kit `useSortable`, drag handle, selection ring) kini diberikan sebagai `sectionWrapper` callback. Satu drag handle saja, `SortableContext`/`DndContext`/`DragOverlay` tetap di canvas.
- Canvas tidak lagi menyetel `--p-font-size-*` sendiri (FONT_SIZE_MAP duplikat dihapus); ukuran font datang dari PortfolioDocument lewat prop `fontSize`.
- Klik-select section kini lewat `onSectionClick` dokumen, bukan wrapper div tambahan.

### `src/app/portfolio/live/page.tsx` (builder — ikut diubah, bukan bagian brief tapi wajib karena children API canvas hilang)
- Hapus 12 import section + `renderSection`. Kirim `data={canvasData}` ke canvas.
- Teruskan `fontSize={fontSize}` (dari localStorage draft `portfolio_live_data` — tidak di-default-kan diam-diam; state sudah membaca draft), `sectionStyle` dari `alignment`.
- `PublishDialog` tetap menerima `canvasData` yang sama.

### `src/app/portfolio/preview/page.tsx`
- Hapus 12 import section + daftar hardcoded. Render `<PortfolioDocument data themeId mode="editor" sectionOrder sectionVisibility fontSize />`.
- Draft dibaca dari `portfolio_live_data` dulu (draft lengkap builder, berisi sectionOrder/sectionVisibility/fontSize), fallback `portfolio_draft`. Sebelumnya hanya `portfolio_draft` — itu penyebab preview mengabaikan order.
- `ThemeContext.Provider` eksternal dihapus (dokumen yang punya).

### `src/app/p/[slug]/page.tsx`
- Tidak lagi lewat `PublishedPortfolio`; render `PortfolioDocument mode="static"` langsung, meneruskan `sectionOrder`, `sectionVisibility`, `sectionColors`, `fontSize` dari jsonb (`row.data`). `fontSize` fallback `"medium"` hanya bila field memang tidak ada di payload. Footer publik dipertahankan inline.

### Tests
- `src/__tests__/portfolio-consumers.test.tsx` — 4 source-text test dari brief. TDD: ditulis dulu, FAIL (3/4), lalu PASS setelah implementasi.
- `src/__tests__/portfolio-schema.test.ts` — test canvas diperbarui: canvas tidak lagi menerima children, jadi test render canvas dengan `data` nyata dan assert `[data-section-id="hero"]` absen / "SEKSI_ABOUT" tampil (behavioral, stub matchMedia+IntersectionObserver).

## Commands & output

```
npx vitest run src/__tests__/portfolio-consumers.test.tsx   → FAIL (expected, 3 fail)
npx vitest run src/__tests__/portfolio-consumers.test.tsx src/__tests__/portfolio-schema.test.ts
  → Test Files 2 passed (2), Tests 70 passed (70)
npm test   → Test Files 12 passed (12), Tests 276 passed (276)
npx tsc --noEmit → TSC_OK (setelah 3 perbaikan tipe: themeId as ThemeId di 3 call site, CSSProperties import dari react, sectionStyle mapping textAlign)
npx next lint --dir src/app/portfolio → No ESLint warnings or errors
```

## WYSIWYG check
- `sectionColors`: kini satu jalur — `themeForSection` di PortfolioDocument, dipakai canvas + preview + publik. Per-section warna builder = publik. ✔
- `sectionOrder` & `sectionVisibility`: ketiga konsumen meneruskan. ✔
- `fontSize`: builder draft → canvas → dokumen; publik dari jsonb. Tidak ada default diam bila data ada. ✔

## Deviasi / concern
- `src/app/portfolio/live/page.tsx` ikut dimodifikasi (di luar daftar file brief) — tidak bisa dihindari: props canvas berubah dari children ke `data`. Perubahan minimal: hapus import section, kirim `data` + `sectionStyle`.
- `PublishedPortfolio.tsx` kini tidak dipakai `p/[slug]` (masih dipakai test `portfolio-schema.test.ts`). Tidak dihapus — biarkan keputusan penghapusan ke task pembersihan, agar diff task ini fokus.
- Alignment per section (`alignment` builder) kini mengalir lewat `sectionStyle` dokumen, bukan wrapper children — perilaku sama.
