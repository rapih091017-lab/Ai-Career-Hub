/**
 * Mode render portfolio. Sengaja berada di modul terpisah dari
 * `render/SafeLink.tsx`: modul ini tidak akan pernah menjadi client
 * component, jadi mengimpor `SafeRenderMode` darinya tidak bisa diam-diam
 * menarik `SafeLink`/`SafeImg` — dan karena itu seluruh grafik section —
 * ke client bundle publik.
 */
export type SafeRenderMode = "editor" | "static";
