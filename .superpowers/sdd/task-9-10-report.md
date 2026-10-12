# Batch C — T9 (Picker) + T10 (Gate) — controller inline (subagent batal)

## T9 — Thumbnail picker nyata
- State awal: test portfolio-picker.test.tsx sudah ada (RED 3/3) tapi implementasi terpotong di tengah (fixture ada, kartu masih mockup TEMPLATE_PREVIEWS tanpa import = tsc rusak). Controller menyambung.
- Kartu kini me-render PortfolioDocument mode=static dengan fixture per tema (THEME_THUMBNAILS), di-clip tinggi 168px + scale 0.62 — struktur HTML per tema benar-benar berbeda (bukan beda warna).
- Deskripsi satu baris via i18n portfolio.theme.{glass|brutal|luxe}-desc + lencana Tema bawaan di tema default (DEFAULT_THEME_ID).
- TEMPLATE_PREVIEWS dihapus dari page (0 sisa di src di luar guard test).
- Test: 3/3 hijau (dua kartu struktur beda, deskripsi+lencana, sumber tanpa mockup).

## T10 — Gate akhir
| Gate | Hasil |
|---|---|
| npm test | 474/474 (flake cv-pdf-debug lolos di run final) |
| npx tsc --noEmit | exit 0 |
| npm run lint | 0 errors, 28 warning baseline (exit 0) |
| grep text-[8..11px] | 0 |
| grep cdnfonts/View Work/INTRODUCING/Selected Projects | 0 (hanya guard string di test) |
| npm run build | Compiled successfully, exit 0 |
| smoke HTTP (server worktree port 3002) | /portfolio 200, / 200, /portfolio/preview?template=brutal 200, ?template=luxe 200 |

Catatan smoke: halaman /portfolio client-gated (AuthGuard) sehingga teks kartu tak terbaca dari SSR — kebenaran render dibuktikan test jsdom T9. Server lama di port 3000 (kode master) sengaja tidak dipakai untuk probe kode branch.
