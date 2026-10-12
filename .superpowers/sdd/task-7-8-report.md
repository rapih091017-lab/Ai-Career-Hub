# Report — Batch T7+T8 (re-compose section + pass copy Indonesia)

Branch `feature/portfolio-themes`. Baseline `2fb3803` (459 tests hijau).

## Ringkasan

- **T7 commit `218036b`** — `feat(portfolio): komposisi asli per tema untuk About, Experience, Education` (3 files, +52/−82)
- **T8 commit `8e37655`** — `feat(portfolio): re-compose Certifications/Organizations/Hobbies + satu suara copy Indonesia` (9 files, +75/−58)

---

## 1. Struktur per tema (apa yang baru, dan kenapa beda)

### Task 7

| Section | Glass | Brutal | Luxe |
|---|---|---|---|
| About | Kartu kaca mengambang + gradient bar + kolom teks & stat pill dalam satu bento (kartu, blur) | Pull-quote berbingkai 4px + bayangan `theme.shadow.card` + drop cap raksasa (bingkai/strip, bukan kartu timeline) | Kolom majalah asimetris `1fr_2fr`, hairline `borderLeft`, drop cap serif — tanpa kartu/bayangan. Copy: `TENTANG` + `Tentang Saya` |
| Experience | **Dipertahankan**: timeline garis gradien + dot lingkaran + kartu double-bezel frosted | **Dipertahankan**: blok bernomor `01/02`, border 3px, offset-shadow solid, rotasi halus | **Re-compose**: ledger baris hairline — kolom kiri tanggal serif (`2020-01 – 2022-01`), kolom kanan posisi serif + perusahaan; `borderTop/borderBottom` per baris; nol kartu, nol bayangan. Sekarang beda mekanisme hierarki (baris vs kartu vs blok), bukan beda warna |
| Experience copy | eyebrow `EXPERIENCE`→`PENGALAMAN` | sudah Indonesia | `Work History`→`Riwayat Pekerjaan`, `Present`→`Sekarang` |
| Education | **Dipertahankan**: kartu bento border gradien `p-[1px]` + ikon toga | **Diperkuat**: stepper vertikal dengan **lencana nomor** `01/02` (sebelumnya ikon — kini "numbered square stepper" sesuai spec) + kartu border 3px + hard shadow | **Re-compose**: ledger hairline — rentang tahun serif di kolom kiri, gelar/institusi/jurusan di kanan; titik-titik timeline & badge tahun dihapus (itu mekanisme kartu). Copy: `EDUCATION`→`PENDIDIKAN`, `Education`→`Pendidikan`, `Present`→`Sekarang` |

### Task 8

| Section | Glass | Brutal | Luxe |
|---|---|---|---|
| Certifications | **Dipertahankan**: grid kartu border gradien + ikon medal glow | **Dipertahankan**: kartu stempel border 3px + lencana tahun | **Re-compose**: ledger baris hairline — nama serif + issuer kiri, angka tahun serif besar kanan; baris adalah `<a>` full-row (target klik tetap ≥44px); background/border/radius kartu dihapus. Eyebrow `CERTIFICATIONS`→`SERTIFIKAT` |
| Organizations | **Dipertahankan**: kartu timeline border gradien + ikon | **Dipertahankan**: blok border 3px + hard shadow | **Re-compose ringan**: nomor lingkaran berlatar primary diganti **numeral serif murni** + penghubung hairline (hierarki = tipografi, bukan lencana); eyebrow `ORGANIZATIONS`→`ORGANISASI` |
| Hobbies | **Dipertahankan**: chip-cloud pill (radius token `radii.pill`, blur) | **Dipertahankan**: grid kotak border 3px + hard shadow | **Re-compose**: dari chip-cloud (identik mekanisme dgn Glass) menjadi **ledger hairline dua-kolom** — numeral serif `01/02` + nama serif + deskripsi; nol ikon, nol chip, nol kartu. Eyebrow `INTERESTS`→`MINAT` |

Semua varian tetap memakai `switch (theme.id)` case eksplisit; props, `data-section-id`, `resolveVisibility`, handler, dan guard `filter`/`return null` per file tidak diubah.

---

## 2. EN → ID (pass copy)

| File | Ditemukan | Diganti ke |
|---|---|---|
| AboutSection | `ABOUT` (badge Brutal), `ABOUT` (eyebrow Luxe), `About Me` | `TENTANG`, `TENTANG`, `Tentang Saya` |
| ExperienceSection | `EXPERIENCE` (Glass), `EXPERIENCE` (Luxe), `Work History`, `Present` | `PENGALAMAN`, `PENGALAMAN`, `Riwayat Pekerjaan`, `Sekarang` |
| EducationSection | `EDUCATION`, `Education`, `– Present` | `PENDIDIKAN`, `Pendidikan`, `– Sekarang` |
| CertificationsSection | `CERTIFICATIONS` | `SERTIFIKAT` |
| OrganizationsSection | `ORGANIZATIONS` | `ORGANISASI` |
| HobbiesSection | `INTERESTS` | `MINAT` |
| HeroSection | `INTRODUCING`, `View Work`, `Get in Touch` | `PERKENALKAN`, `Lihat Karya`, `Hubungi Saya` (menyamakan varian Glass/Brutal) |
| ProjectsSection | `WORK` ×2, `Selected Projects`, `Projects` ×2, `View Project` | `KARYA` ×2, `Karya Pilihan`, `Proyek` (Brutal), `Karya` (Luxe), `Lihat Proyek` |
| SkillsSection | `SKILLS`, `Expertise`, `{n} Areas`, `Core Competencies`, `Languages` | `KEAHLIAN`, `Keahlian`, `{n} Bidang`, `Kompetensi Utama`, `Bahasa` |
| ContactSection | `GET IN TOUCH`, `Let's Work Together`, `I'm always open…`, `Send Email` | `HUBUNGI SAYA`, `Mari Berkolaborasi`, `Saya selalu terbuka untuk membahas proyek baru, ide kreatif, atau peluang kerja sama.`, `Kirim Email` |
| TestimonialsSection | `TESTIMONIALS`, `Kind Words` | `TESTIMONI`, `Kata Mereka` |

**Dipertahankan dengan sadar**: `Tools` (id i18n rumah `live.form.tools` = "Tools"), `Project Selesai` (id i18n), `Detail`, `Email`/`LinkedIn`/`GitHub` (nama merek). Identifier (`skillsLanguages`, `isPresent`, dll) bukan copy — tidak disentuh.

Guard: `Layer C` baru di `portfolio-theme-rules.test.ts` — 12 file section × daftar frasa sasaran (huruf besar-sensitif, komentar di-strip dulu), nol hasil setelah pass. `rg` sweep brief: nol hasil.

---

## 3. Test — output nyata per commit

**Setelah T7 (`218036b`):**
```
npx vitest run portfolio-theme-rules + fingerprint + contrast
 Test Files  3 passed (3)
      Tests  53 passed (53)
npm test
 Test Files  27 passed (27)
      Tests  459 passed (459)
npx tsc --noEmit   → exit 0 (tanpa output)
```

**Setelah T8 (`8e37655`):**
```
npx vitest run portfolio-theme-rules + fingerprint + contrast
 Test Files  3 passed (3)
      Tests  65 passed (65)   ← 53 + 12 Layer C baru
npm test
 Test Files  27 passed (27)
      Tests  471 passed (471)   ← diulang 2×, hijau dua-duanya
npx tsc --noEmit   → exit 0
```
`PENDING_SECTIONS` di fingerprint test: `[]` (tidak diubah — sudah kosong; tes jalan penuh, 12 section × 3 tema semua beda kerangka).
Layer A (larangan literal): nol literal baru — semua gaya dari `theme.radii/blur/shadow/typography/onPrimary/colors`.
Contrast: 12/12 — tidak ada hex baru.

---

## 4. Visual — bukti & delta yang diterima

Preview live tidak bisa dibuka (AuthGuard + draft di DB). Sebagai gantinya: fixture sama dgn fingerprint test → `renderToStaticMarkup` per tema → dibungkus HTML + Tailwind v3 yang dikompilasi dari sumber → Chromium headless (JS mati supaya guard `<noscript>` reveal aktif) → screenshot per `data-section-id` (18 file, di `%TEMP%\opencode\pf-visual\`). Artefak dump sudah dihapus dari repo.

Delta yang diterima (terlihat di screenshot):
- **Experience**: Glass = kartu membungkuk + dot timeline (gelap); Brutal = bingkai hitam tebal + stempel `01/02` merah; Luxe = ledger polos dgn tanggal serif emas — tiga mekanisme hierarki beda.
- **Education**: Glass = kartu gradien + ikon; Brutal = stepper bernomor + bayangan offset padat; Luxe = baris hairline tahun-serif, ruang kosong lega (bukan kartu).
- **Hobbies**: Glass = chip pill; Brutal = kotak grid + hard shadow; Luxe = baris `01 Fotografi — Deskripsi`.
- **Certifications Luxe**: baris `<a>` hairline, tahun serif rata kanan.
- **Organizations Luxe**: numeral serif hijau + garis penghubung, tanpa lencana bulat.
- Luxe di kelima section kini **nol `background` kartu, nol `box-shadow`** sesuai token `shadow.card = "none"`.

---

## 5. Concerns

1. **Flake pernah muncul 1×**: satu run `npm test` di tengah batch gagal 1/471, dua run berikutnya (kode identik) hijau 471/471. Test gagal tidak teridentifikasi (log hilang karena buffering) — kemungkinan timing test lain, bukan batch ini; kalau muncul lagi, tangkap dgn `vitest --reporter=verbose`.
2. Banding visual lewat jalur render-statik, bukan `/portfolio/preview` live (butuh login + draft terisi) — jika mau verifikasi end-to-end, jalankan preview dengan draft berisi data.
3. `Tools` dan `Project Selesai` sengaja dipertahankan (id i18n rumah memakai bentuk itu); kalau mau 100% Indonesia baku, ubah juga di `src/lib/i18n.tsx`.
4. File `.superpowers/sdd/*` sudah "Modified" sejak sebelum batch ini (LF↔CRLF + tulisan batch sebelumnya) — tidak disentuh, tidak ikut di-commit.
5. Baris komentar English lama di file section dibiarkan (sweep = teks tampilan); komentar baru/hasil edit memakai bahasa Indonesia.
