import type { Config } from "tailwindcss";

/**
 * Token warna memakai CSS variable supaya tema terang dan gelap bisa
 * berbagi nama token yang sama. Nilai RGB (spasi terpisah) disimpan di
 * `src/app/globals.css`, bukan di sini, supaya dark mode cukup
 * menimpa variable-nya.
 */
const tone = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: tone("background"),
        "surface-variant": tone("surface-variant"),
        "inverse-primary": tone("inverse-primary"),
        "surface-tint": tone("surface-tint"),
        secondary: tone("secondary"),
        "on-error-container": tone("on-error-container"),
        "on-background": tone("on-background"),
        "on-tertiary-container": tone("on-tertiary-container"),
        "on-secondary-fixed": tone("on-secondary-fixed"),
        outline: tone("outline"),
        "tertiary-fixed-dim": tone("tertiary-fixed-dim"),
        "on-primary-fixed": tone("on-primary-fixed"),
        "error-container": tone("error-container"),
        "surface-container-high": tone("surface-container-high"),
        "on-primary-container": tone("on-primary-container"),
        "primary-container": tone("primary-container"),
        "surface-container-lowest": tone("surface-container-lowest"),
        "secondary-fixed-dim": tone("secondary-fixed-dim"),
        "on-secondary": tone("on-secondary"),
        "secondary-container": tone("secondary-container"),
        "on-secondary-container": tone("on-secondary-container"),
        tertiary: tone("tertiary"),
        primary: tone("primary"),
        "on-surface": tone("on-surface"),
        "on-secondary-fixed-variant": tone("on-secondary-fixed-variant"),
        "surface-dim": tone("surface-dim"),
        "on-tertiary": tone("on-tertiary"),
        "on-primary-fixed-variant": tone("on-primary-fixed-variant"),
        "tertiary-container": tone("tertiary-container"),
        "on-tertiary-fixed-variant": tone("on-tertiary-fixed-variant"),
        "on-error": tone("on-error"),
        "inverse-surface": tone("inverse-surface"),
        surface: tone("surface"),
        "surface-bright": tone("surface-bright"),
        "tertiary-fixed": tone("tertiary-fixed"),
        "outline-variant": tone("outline-variant"),
        "on-surface-variant": tone("on-surface-variant"),
        "on-primary": tone("on-primary"),
        "surface-container-highest": tone("surface-container-highest"),
        "secondary-fixed": tone("secondary-fixed"),
        "primary-fixed-dim": tone("primary-fixed-dim"),
        "inverse-on-surface": tone("inverse-on-surface"),
        "on-tertiary-fixed": tone("on-tertiary-fixed"),
        "surface-container-low": tone("surface-container-low"),
        "primary-fixed": tone("primary-fixed"),
        error: tone("error"),
        "surface-container": tone("surface-container"),

        // Palet tema (Evergreen + Lime). Nama ini yang dipakai komponen
        // baru, token di atas tetap dipertahankan supaya markup lama
        // tidak perlu disentuh.
        desk: tone("desk"),
        paper: tone("paper"),
        evergreen: tone("evergreen"),
        "evergreen-deep": tone("evergreen-deep"),
        green: tone("green"),
        "green-deep": tone("green-deep"),
        lime: tone("lime"),
        "lime-bright": tone("lime-bright"),
        ink: tone("ink"),
        "ink-soft": tone("ink-soft"),
        hairline: tone("hairline"),
        rule: tone("rule"),
        // Pasangan tetap untuk permukaan brand yang tidak berbalik di mode
        // gelap. Pakai ini, bukan `paper`/`ink`, saat latarnya evergreen,
        // ink, atau lime.
        "on-dark": tone("on-dark"),
        "on-light": tone("on-light"),
        cream: tone("cream"),
        footer: tone("footer"),
        "brand-dark": tone("brand-dark"),
        "brand-green": tone("brand-green"),
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.375rem",
        md: "0.625rem",
        lg: "0.875rem",
        xl: "1.125rem",
        "2xl": "1.5rem",
        "3xl": "1.75rem",
        "4xl": "2.75rem",
        full: "9999px",
      },
      spacing: {
        "margin-mobile": "20px",
        gutter: "24px",
        "margin-desktop": "40px",
        "container-max": "1200px",
        "shell": "1180px",
        "section-padding": "96px",
        "card-padding": "40px",
      },
      fontFamily: {
        display: ["'Stack Sans Headline'", "system-ui", "sans-serif"],
        "headline-lg": ["'Stack Sans Headline'", "system-ui", "sans-serif"],
        "headline-md": ["'Stack Sans Headline'", "system-ui", "sans-serif"],
        "body-lg": ["Inter", "system-ui", "sans-serif"],
        "body-md": ["Inter", "system-ui", "sans-serif"],
        "label-bold": ["Inter", "system-ui", "sans-serif"],
        "label-sm": ["Inter", "system-ui", "sans-serif"],
        serif: ["Literata", "Georgia", "'Times New Roman'", "serif"],
        script: ["Caveat", "cursive"],
        reader: ["'Atkinson Hyperlegible Next'", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        display: ["clamp(2.5rem, 4.6vw, 4rem)", { lineHeight: "1.04", letterSpacing: "-0.03em", fontWeight: "700" }],
        "headline-lg": ["clamp(1.875rem, 3.8vw, 3.125rem)", { lineHeight: "1.06", letterSpacing: "-0.03em", fontWeight: "700" }],
        "headline-md": ["clamp(1.375rem, 2.2vw, 1.75rem)", { lineHeight: "1.16", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-sm": ["1.125rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "700" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.55", fontWeight: "400" }],
        "label-bold": ["0.875rem", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "700" }],
        "label-sm": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em", fontWeight: "600" }],
        "label-xs": ["0.71875rem", { lineHeight: "1.3", letterSpacing: "0.06em", fontWeight: "700" }],
      },
      boxShadow: {
        // Motif identitas tema: kartu seperti kertas di atas meja, bukan
        // panel UI yang melayang. Bayangan offset, tanpa blur.
        hard: "6px 6px 0 var(--shadow-hard-color)",
        "hard-sm": "4px 4px 0 var(--shadow-hard-color)",
        "hard-lg": "10px 10px 0 var(--shadow-hard-color)",
        "hard-ink": "4px 4px 0 var(--c-ink)",
        "hard-ink-sm": "3px 3px 0 var(--c-ink)",
      },
      keyframes: {
        ripple: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.5)", opacity: "0.5" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg) translateX(var(--radius)) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(var(--radius)) rotate(-360deg)" },
        },
        "ach-node-in": {
          "0%": { opacity: "0", transform: "translateY(26px) rotate(var(--node-rot, 0deg))" },
          "100%": { opacity: "1", transform: "rotate(var(--node-rot, 0deg))" },
        },
        "ach-persona-in": {
          "0%": { opacity: "0.4", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        "ach-door-in": {
          "0%": { opacity: "0.2", filter: "blur(6px)", transform: "translateY(6px)" },
          "100%": { opacity: "1", filter: "none", transform: "none" },
        },
        "ach-caret-blink": {
          "50%": { opacity: "0" },
        },
      },
      animation: {
        ripple: "ripple 3s ease-out infinite",
        orbit: "orbit calc(var(--duration) * 1s) linear infinite",
        "ach-node-in": "ach-node-in 0.65s cubic-bezier(0.22, 1, 0.36, 1) backwards",
        "ach-persona-in": "ach-persona-in 0.36s cubic-bezier(0.16, 1, 0.3, 1) both",
        "ach-door-in": "ach-door-in 0.42s cubic-bezier(0.16, 1, 0.3, 1) both",
        "ach-caret-blink": "ach-caret-blink 1s step-end infinite",
      },
    },
  },
};

export default config;
