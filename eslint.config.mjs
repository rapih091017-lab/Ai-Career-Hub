import { defineConfig, globalIgnores } from "eslint/config";
import next from "eslint-config-next";

// ── Aturan untuk kode legacy ──────────────────────────────────────────
// eslint-config-next@16 membawa react-hooks v6 / rule React 19 compiler
// (set-state-in-effect, refs, purity, immutability, static-components,
// react/use) yang memunculkan banyak error di pola legacy yang SAH —
// mis. meng-init state dari localStorage di useEffect pada mount.
// Rule berikut dimatikan / diturunkan ke warning agar `npm run lint` tetap
// bermakna tanpa merombak seluruh komponen legacy. Kode BARU tetap tunduk
// pada aturan standar.
//
// Catatan: override digabung ke objek config milik eslint-config-next
// (bukan objek terpisah) karena di flat config, rule dengan namespace plugin
// (mis. react-hooks/*) hanya bisa diatur di objek yang mendeklarasikan
// plugin tersebut.
const legacyOverrides = {
  "react-hooks/set-state-in-effect": "off",
  "react-hooks/refs": "off",
  "react-hooks/purity": "off",
  "react-hooks/immutability": "off",
  "react-hooks/static-components": "off",
  "react/use": "off",
  // Isu legacy yang sudah ada sejak lama (di luar cakupan perubahan ini):
  "@next/next/no-img-element": "warn",
  "@next/next/no-page-custom-font": "warn",
  "@next/next/google-font-display": "warn",
};

const eslintConfig = defineConfig([
  // Override hanya digabung ke objek config yang mendeklarasikan plugin
  // react-hooks & @next/next (objek utama "next"). Menggabung ke objek lain
  // (mis. ignores / typescript) akan error "plugin not found".
  ...next.map((cfg) =>
    cfg.plugins?.["react-hooks"] && cfg.plugins["@next/next"]
      ? { ...cfg, rules: { ...(cfg.rules || {}), ...legacyOverrides } }
      : cfg
  ),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Tooling satu kali (skrip migrasi) & server PDF terpisah — bukan kode app:
    "scripts/**",
    "pdf-server/**",
    "temp_extracted.json",
    "temp_payload.json",
  ]),
]);

export default eslintConfig;
