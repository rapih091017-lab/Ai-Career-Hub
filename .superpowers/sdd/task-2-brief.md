### Task 2: Migrasi token file A + test larangan sumber (Layer A)

**Files:**
- Modify: `src/components/portfolio/sections/HeroSection.tsx`, `AboutSection.tsx`, `StatsSection.tsx`, `ProjectsSection.tsx`, `SkillsSection.tsx`, `ContactSection.tsx`
- Modify: `src/__tests__/portfolio-theme-rules.test.ts` (tambah blok Layer A)

**Interfaces:**
- Consumes: token dari Task 1 (`theme.radii.card`, `theme.blur.card`, `theme.shadow.card`, `theme.typography.display`, `theme.focusRing`).
- Produks: keenam file bebas literal; Layer A test hijau untuk keenam file (file lain menyusul di Task 3 — test sudah menyapu semua, jadi Task 2 hanya boleh menyalakan subset atau menulis penuh + Task 3 menyelesaikan: **pilih menulis penuh dan pasang `expect` per-file di akhir Task 3** — instruksi: tulis test penuh sekarang dengan pasangan file→daftar, `it.each` per file; file Task 3 ditandai `todo` sementara dan dihapus tandanya di Task 3).

- [ ] **Step 1: Tulis test Layer A (gagal untuk file yang belum dimigrasi)**

Tambahkan ke `portfolio-theme-rules.test.ts`:

```ts
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SECTIONS_DIR = join(process.cwd(), "src/components/portfolio/sections");
const RENDER_DIR = join(process.cwd(), "src/components/portfolio/render");

/** Literal yang dilarang — wajib lewat token tema. */
const BANNED: { label: string; re: RegExp }[] = [
  { label: "rounded-*", re: /\brounded-(full|[a-z0-9]+)\b/ },
  { label: "shadow-*", re: /\bshadow-(sm|md|lg|xl|2xl|premium[\w-]*)\b/ },
  { label: "backdrop-blur*", re: /\bbackdrop-blur\b/ },
  { label: "borderRadius literal", re: /borderRadius:\s*["'`]/ },
  { label: "boxShadow literal", re: /boxShadow:\s*["'`]/ },
  { label: "inline fontFamily", re: /fontFamily:\s*["'`]/ },
  { label: "hex warna", re: /#[0-9a-fA-F]{6}\b/ },
];

// File yang belum dimigrasi: Task 3 menyelesaikannya. Hapus entri ini di Task 3.
const PENDING_FILES = [
  "ExperienceSection.tsx", "EducationSection.tsx", "CertificationsSection.tsx",
  "OrganizationsSection.tsx", "HobbiesSection.tsx", "TestimonialsSection.tsx",
];

const sourceFiles = [
  ...readdirSync(SECTIONS_DIR).map((f) => join(SECTIONS_DIR, f)),
  ...readdirSync(RENDER_DIR).filter((f) => f.endsWith(".tsx")).map((f) => join(RENDER_DIR, f)),
];

function stripAllowed(src: string): string {
  // allowlist putih; komentar diabaikan agar aturan tidak menangkap diskusi
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/#fff(?:fff)?\b/gi, "");
}

describe("Layer A: larangan literal di section & render", () => {
  it.each(sourceFiles.map((f) => [f]))("%s bebas literal", (file: string) => {
    const name = file.split(/[\\/]/).pop()!;
    if (PENDING_FILES.includes(name)) return; // Task 3 menghapus entri ini
    const src = stripAllowed(readFileSync(file, "utf8"));
    const found = BANNED.filter((b) => b.re.test(src)).map((b) => b.label);
    expect(found, `${name}: literal terlarang`).toEqual([]);
  });
});
```

- [ ] **Step 2: Jalankan — 6 file Task 3 (todo) lolos; keenam file Task 2 gagal**

Run: `npx vitest run src/__tests__/portfolio-theme-rules.test.ts`
Expected: kegagalan berisi daftar literal di file Task 2.

- [ ] **Step 3: Migrasi 6 file — pola pertukaran**

Untuk SETIAP literal, ganti dengan token. Pola:

```tsx
// SEBELUM (contoh nyata AboutSection)
style={{ borderRadius: "1.5rem", boxShadow: "0 8px 32px rgba(0,0,0,.35)", backdropFilter: "blur(12px)" }}
style={{ fontFamily: "Playfair Display, serif" }}
className="text-[24px] font-bold"

// SESUDAH
style={{ borderRadius: theme.radii.card, boxShadow: theme.shadow.card, backdropFilter: theme.blur.card }}
style={{ fontFamily: theme.typography.display }}
```

Aturan per templat ketiga varian di tiap file:
- `borderRadius` literal → `theme.radii.*` (`card`/`button`/`pill`/`image`, pilih yang paling sesuai per pemakaian; nilai Brutal otomatis `"0"`).
- `boxShadow` literal → `theme.shadow.card` (bila bayangannya berbeda per posisi, pakai `card` juga — satu bayangan per tema adalah bagian signature).
- `backdropFilter`/`blur(` literal → gabung `theme.blur.card` + `theme.blur.glow` bila keduanya dipakai di tempat berbeda; kosongkan string bila token kosong (Brutal).
- `fontFamily` inline → `theme.typography.display` / `.body` / `.eyebrow`.
- Hex di JSX → warna dari `theme.colors.*`. Hex **hanya** `#fff`/`#ffffff` (stroke) diperbolehkan. Khusus hex yang tersembunyi di `previewGradient`/SVG `stroke` — `previewGradient` (theme-level, bukan file section) di luar scan; `stroke="#fff"` aman.
- Class Tailwind `rounded-*`/`shadow-*` → pindah ke objek `style` token atau hapus bila redundan.

Nilai token Task 1 bisa terbukti tidak cocok dengan literal yang dihapus (mis. ada 3 ukuran radius berbeda dalam satu tema). Dalam kasus itu: **jangan** menambah field token baru tanpa menambahkannya ke `ThemeDefinition` + ketiga tema + test kelengkapan. Laporkan di laporan bila menambah.

- [ ] **Step 4: Jalankan Layer A untuk keenam file (hijau) + seluruh suite**

Run: `npx vitest run src/__tests__/portfolio-theme-rules.test.ts` lalu `npm test`, `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/components/portfolio/sections/HeroSection.tsx src/components/portfolio/sections/AboutSection.tsx src/components/portfolio/sections/StatsSection.tsx src/components/portfolio/sections/ProjectsSection.tsx src/components/portfolio/sections/SkillsSection.tsx src/components/portfolio/sections/ContactSection.tsx src/__tests__/portfolio-theme-rules.test.ts
git commit -m "refactor(portfolio): migrasi token 6 section pertama, Layer A larangan literal"
```

---
