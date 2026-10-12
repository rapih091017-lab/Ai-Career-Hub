import { THEMES } from "../themes";

/**
 * Memuat font tema aktif untuk editor/preview. Halaman publik dan file export
 * sudah punya jalur sendiri. Bukan next/font: hasil /_next/static/… menjadi URL
 * mati di dalam file export HTML mandiri.
 */
export default function ThemeFonts({ themeId }: { themeId: string }) {
  const theme = THEMES[themeId] ?? THEMES.glass;
  if (!theme.fontUrl) return null;
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={theme.fontUrl} />
    </>
  );
}
