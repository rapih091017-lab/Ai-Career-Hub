import { safeUrlUnescaped } from "@/lib/portfolio-safety";
import type { SafeRenderMode } from "@/components/portfolio/render/safe-render-mode";

/**
 * Modul ini server-renderable: tidak ada hook, state, atau handler. Jangan
 * menambahkan "use client" di sini — setiap section portfolio yang mengimpor
 * SafeLink/SafeImg akan ikut ter-render di client.
 */
type SafeLinkProps = {
  href: string;
  mode: SafeRenderMode;
  className?: string;
  target?: string;
  children: React.ReactNode;
};

/**
 * Afordance interaktif yang dibalik pada cabang yang ditolak. `span` bukan
 * elemen interaktif: `cursor-pointer`/`hover:underline` di atasnya hanya
 * menjebak pointer dan keyboard tanpa aksi apa pun.
 *
 * CATATAN: ini hanya berlaku pada cabang DITOLAK. Pada cabang yang diterima
 * `className` pemanggil dipakai apa adanya — di situ tautannya memang
 * interaktif, jadi gaya interaktif menjadi urusan pemanggil.
 */
const INTERACTIVE_CLASS_SWAPS = new Map([
  ["cursor-pointer", "cursor-default"],
  ["cursor-pointer-reset", "cursor-default"],
  ["hover:cursor-pointer", "hover:cursor-default"],
  ["hover:underline", "no-underline"],
  ["hover:no-underline", "underline"],
]);

/** Variant interaktif yang dibuang seluruhnya. */
const INTERACTIVE_VARIANT = /^(hover|focus|focus-visible|active):/;

function inertClassName(className: string | undefined): string | undefined {
  if (!className) return className;
  return className
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const swap = INTERACTIVE_CLASS_SWAPS.get(token);
      if (swap) return swap;
      return INTERACTIVE_VARIANT.test(token) ? null : token;
    })
    .filter((token): token is string => token !== null)
    .join(" ");
}

/**
 * Satu-satunya jalan masuk user-supplied URL ke atribut href.
 * Mode static: skema terlarang dirender jadi span tanpa href.
 * Mode editor: skema terlarang diberi tanda merah supaya terlihat saat menyunting.
 */
export function SafeLink({ href, mode, className, target, children }: SafeLinkProps) {
  const safe = safeUrlUnescaped(href ?? "");
  const inert = inertClassName(className);

  if (!safe) {
    if (mode !== "editor") return <span className={inert}>{children}</span>;
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <span className={inert}>{children}</span>
        <span className="bg-error-container px-1.5 py-0.5 text-xs font-medium text-on-error-container">
          tautan ditolak &mdash; skema tidak diizinkan
        </span>
      </span>
    );
  }

  const external = /^https?:\/\//i.test(safe);

  return (
    <a
      href={safe}
      className={className}
      {...(target ? { target } : {})}
      {...(target || external ? { rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

/**
 * Batas panjang data URI gambar, dalam karakter. Diambil dari rute upload
 * (`/api/upload`): file maks 5 MB di-base64 menjadi 4/3 x 5.000.000 =
 * 6.666.668 karakter. 7 MiB (7.340.032) sedikit di atas itu, jadi gerbang ini
 * tidak pernah menolak hasil upload yang sah, tapi tetap membatasi file HTML
 * export mandiri yang meng-inline gambar. Foto beresolusi penuh pun sebaiknya
 * lewat rute aset, bukan inline.
 */
export const MAX_DATA_IMAGE_LENGTH = 7 * 1024 * 1024;

/**
 * Data URI yang boleh: hanya format raster yang sama dengan hasil upload
 * (`/api/upload`). SVG sengaja tidak ikut: markup-nya bisa membawa skrip, dan
 * tidak ada sumber SVG yang sah di portofolio ini.
 *
 * Awalan saja tidak cukup. prefixed `data:image/png;base64,` bisa diikuti apa
 * saja — termasuk `"`, yang tepat menjadi attribute break-out saat URI ini
 * di-inline ke file HTML export. Bodi-nya karena itu wajib benar-benar
 * alphabet base64 (huruf besar/kecil, angka, `+`, `/`) plus padding `=` di
 * ujung, tidak ada karakter lain sama sekali.
 */
const DATA_IMAGE_PREFIX = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,/i;
const BASE64_BODY = /^[A-Za-z0-9+/]+={0,2}$/;

function isAllowedDataImage(v: string): boolean {
  if (v.length > MAX_DATA_IMAGE_LENGTH) return false;
  const prefix = DATA_IMAGE_PREFIX.exec(v);
  if (!prefix) return false;
  return BASE64_BODY.test(v.slice(prefix[0].length));
}

/** Teks kegagalannya untuk mata; juga potongan dari nama aksesibel placeholder. */
const IMAGE_FAILED_TEXT = "gambar tidak dapat ditampilkan";
const IMAGE_REJECTED_HINT = "ditolak: skema tidak diizinkan";

type SafeImgProps = {
  src: string;
  mode: SafeRenderMode;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
};

/**
 * src yang lolos validasi. Data URI gambar raster tetap boleh supaya aset yang
 * sudah di-inline saat export bisa dirender.
 */
export function SafeImg({ src, mode, alt, width, height, className }: SafeImgProps) {
  const value = src ?? "";
  const inline = isAllowedDataImage(value);
  const ok = inline || safeUrlUnescaped(value) !== "";

  if (!ok) {
    // `role="img"` membuat seluruh anak presentasional, jadi teks "gambar
    // tidak dapat ditampilkan" TIDAK akan diumumkan kalau ia hanya tinggal di
    // dalam DOM. Karena itu nama aksesibel dirangkai dari alt + teks kegagalan
    // (+ alasan, di mode editor) menjadi satu node gambar yang tetap beravi
    // "ini tempat gambar yang gagal" sekaligus menyatakan kegagalannya.
    const label = [
      alt || null,
      IMAGE_FAILED_TEXT,
      mode === "editor" ? IMAGE_REJECTED_HINT : null,
    ]
      .filter(Boolean)
      .join(" — ");

    return (
      <div
        className={`flex items-center justify-center bg-surface-container text-on-surface-variant ${className ?? ""}`}
        style={{ width, height }}
        role="img"
        aria-label={label}
      >
        <span className="px-2 text-center text-xs">{IMAGE_FAILED_TEXT}</span>
        {mode === "editor" ? (
          <span className="bg-error-container px-1.5 py-0.5 text-xs font-medium text-on-error-container">
            {IMAGE_REJECTED_HINT}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- next/image tidak menerima data URI, dan aset lewat rute /api/portfolio/assets butuh remotePatterns.
    <img
      src={inline ? value : safeUrlUnescaped(value)}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      data-editor-mode={mode}
    />
  );
}
