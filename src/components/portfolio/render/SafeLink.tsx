"use client";

import { safeUrl } from "@/lib/portfolio-safety";

export type SafeRenderMode = "editor" | "static";

/**
 * safeUrl mengembalikan nilai yang sudah di-esc untuk konteks atribut HTML
 * (jalur export). React menulis atribut lewat setAttribute — tidak ada parser
 * HTML di sana — jadi entity harus dibalik dulu, kalau tidak `&` jadi
 * `&amp;amp;` dan query string rusak.
 */
function fromSafeUrl(escaped: string): string {
  return escaped
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

type SafeLinkProps = {
  href: string;
  mode: SafeRenderMode;
  className?: string;
  target?: string;
  children: React.ReactNode;
};

/**
 * Satu-satunya jalan masuk user-supplied URL ke atribut href.
 * Mode static: skema terlarang dirender jadi span tanpa href.
 * Mode editor: skema terlarang diberi tanda merah supaya terlihat saat menyunting.
 */
export function SafeLink({ href, mode, className, target, children }: SafeLinkProps) {
  const safe = safeUrl(href ?? "");

  if (!safe) {
    if (mode !== "editor") return <span className={className}>{children}</span>;
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <span className={className}>{children}</span>
        <span className="bg-error-container px-1.5 py-0.5 text-xs font-medium text-on-error-container">
          tautan ditolak - skema tidak diizinkan
        </span>
      </span>
    );
  }

  const external = /^https?:\/\//i.test(safe);

  return (
    <a
      href={fromSafeUrl(safe)}
      className={className}
      {...(target ? { target } : {})}
      {...(target || external ? { rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

/**
 * Data URI yang boleh: hanya format raster yang sama dengan hasil upload
 * (`/api/upload`). SVG sengaja tidak ikut: markup-nya bisa membawa skrip, dan
 * tidak ada sumber SVG yang sah di portofolio ini.
 */
const ALLOWED_DATA_IMAGE = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i;

type SafeImgProps = {
  src: string;
  mode: SafeRenderMode;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
};

/**
 * src yang lolos safeUrl. Data URI gambar raster tetap boleh supaya aset yang
 * sudah di-inline saat export bisa dirender.
 */
export function SafeImg({ src, mode, alt, width, height, className }: SafeImgProps) {
  const value = src ?? "";
  const inline = ALLOWED_DATA_IMAGE.test(value);
  const ok = inline || safeUrl(value) !== "";

  if (!ok) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-container text-on-surface-variant ${className ?? ""}`}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <span className="px-2 text-center text-xs">gambar tidak dapat ditampilkan</span>
      </div>
    );
  }

  return (
    <img
      src={inline ? value : fromSafeUrl(safeUrl(value))}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      data-editor-mode={mode}
    />
  );
}