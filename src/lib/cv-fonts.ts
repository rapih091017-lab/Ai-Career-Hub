/**
 * Font CV yang dimuat sama persis di pratinjau dan di PDF server.
 *
 * Berkas woff2 (subset latin, OFL) ada di `public/fonts/cv/`. Pratinjau
 * memuatnya lewat URL `/fonts/cv/...`, server membaca berkas yang sama lalu
 * menyematkannya sebagai data: URI. Nama family diberi awalan "CV " supaya
 * tidak pernah tertukar dengan font sistem atau font aplikasi.
 *
 * Modul ini dipakai klien dan server, jadi tidak boleh memakai fs.
 */

export interface CvFont {
  id: string;
  /** Nama family di @font-face. */
  family: string;
  /** Nama di dropdown. */
  label: string;
  generic: "sans-serif" | "serif";
}

export const CV_FONTS: readonly CvFont[] = [
  { id: "inter", family: "CV Inter", label: "Inter", generic: "sans-serif" },
  { id: "plus-jakarta-sans", family: "CV Plus Jakarta Sans", label: "Plus Jakarta Sans", generic: "sans-serif" },
  { id: "roboto", family: "CV Roboto", label: "Roboto", generic: "sans-serif" },
  { id: "open-sans", family: "CV Open Sans", label: "Open Sans", generic: "sans-serif" },
  { id: "arimo", family: "CV Arimo", label: "Arial (Arimo)", generic: "sans-serif" },
  { id: "carlito", family: "CV Carlito", label: "Calibri (Carlito)", generic: "sans-serif" },
  { id: "tinos", family: "CV Tinos", label: "Times New Roman (Tinos)", generic: "serif" },
];

export const DEFAULT_CV_FONT = CV_FONTS[0];

/** Nilai CSS font-family untuk satu font CV. Nilai ini juga yang disimpan. */
export const cvFontValue = (f: CvFont) => `'${f.family}', ${f.generic}`;

/**
 * Petakan nilai font apa pun (termasuk nilai lama tersimpan seperti
 * "Arial, sans-serif" atau "'Times New Roman', serif") ke font CV.
 * Font yang tidak dikenal jatuh ke Inter (serif → Tinos).
 */
export function resolveCvFont(value: unknown): CvFont {
  const v = typeof value === "string" ? value.toLowerCase() : "";
  const byId = (id: string) => CV_FONTS.find((f) => f.id === id)!;
  for (const f of CV_FONTS) if (v.includes(f.family.toLowerCase())) return f;
  // Font pertama di daftar yang menentukan; urutan cek mengikuti kata kunci.
  const first = v.split(",")[0] ?? "";
  const rules: [RegExp, string][] = [
    [/plus jakarta/, "plus-jakarta-sans"],
    [/open sans/, "open-sans"],
    [/roboto/, "roboto"],
    [/inter/, "inter"],
    [/arial|arimo|helvetica/, "arimo"],
    [/calibri|carlito/, "carlito"],
    [/times|tinos|georgia/, "tinos"],
  ];
  for (const [re, id] of rules) if (re.test(first)) return byId(id);
  for (const [re, id] of rules) if (re.test(v)) return byId(id);
  if (/(^|[^-])\bserif\s*$/.test(v)) return byId("tinos");
  return DEFAULT_CV_FONT;
}

/** CSS font-family siap pakai untuk nilai font apa pun. */
export const cvFontStack = (value: unknown) => cvFontValue(resolveCvFont(value));

export const CV_FONT_VARIANTS = [
  { weight: 400, style: "normal" },
  { weight: 400, style: "italic" },
  { weight: 700, style: "normal" },
  { weight: 700, style: "italic" },
] as const;

export const cvFontFile = (f: CvFont, v: (typeof CV_FONT_VARIANTS)[number]) =>
  `${f.id}-latin-${v.weight}-${v.style}.woff2`;

/** Aturan @font-face; `src(file)` menentukan URL (path publik atau data: URI). */
export function cvFontFaceCss(fonts: readonly CvFont[], src: (file: string) => string): string {
  return fonts
    .flatMap((f) =>
      CV_FONT_VARIANTS.map(
        (v) =>
          `@font-face{font-family:'${f.family}';font-style:${v.style};font-weight:${v.weight};font-display:block;src:url(${src(cvFontFile(f, v))}) format('woff2');}`,
      ),
    )
    .join("\n");
}

/** CSS untuk pratinjau di peramban: semua font dari /fonts/cv. */
export const CV_FONT_FACE_CSS_PUBLIC = cvFontFaceCss(CV_FONTS, (file) => `/fonts/cv/${file}`);
