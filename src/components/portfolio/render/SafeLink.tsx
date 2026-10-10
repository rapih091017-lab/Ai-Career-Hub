import { safeUrlUnescaped } from "@/lib/portfolio-safety";
import type { SafeRenderMode } from "@/components/portfolio/render/safe-render-mode";

/**
 * Modul ini tidak butuh "use client": tidak ada hook, state, atau handler.
 * Memaksakannya di sini akan menarik seluruh section yang mengimpor
 * SafeLink/SafeImg ke client component, padahal komponennya sendiri
 * server-safe. Menghapus "use client" dari section adalah pekerjaan terpisah.
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
 * Catatan: ini hanya berlaku pada cabang DITOLAK. Pada cabang yang diterima
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

/**
 * Variant interaktif yang dibuang, dengan atau tanpa prefiks: `hover:`,
 * `md:hover:`, `dark:focus-visible:`, `group-hover:`, `peer-active:`. Yang lolos
 * hanyalah nama utility yang memuat kata itu tanpa segmen variant, mis.
 * `data-hover-label`.
 */
const INTERACTIVE_VARIANT = /(^|[:-])(hover|focus-visible|focus|active):/;

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

/** Alasan penolakan, sama untuk tautan dan gambar supaya badge konsisten. */
const REJECTED_REASON = "skema tidak diizinkan";

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
          ditolak: {REJECTED_REASON}
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
 * Batas panjang data URI gambar, dalam karakter. Rute upload (`/api/upload`)
 * menolak file di atas 5 * 1024 * 1024 = 5.242.880 byte. Base64 menambah
 * sekitar 4/3, jadi payload terbesar yang sah jadi 6.990.508 karakter
 * (6.990.530 kalau awalan `data:image/...;base64,` ikut dihitung). 7 MiB
 * (7.340.032) masih 349.524 karakter di atas itu, jadi gerbang ini tidak pernah
 * menolak hasil upload yang sah, tapi tetap membatasi file HTML export mandiri
 * yang meng-inline gambar. Foto beresolusi penuh pun sebaiknya lewat rute aset,
 * bukan inline.
 */
export const MAX_DATA_IMAGE_LENGTH = 7 * 1024 * 1024;

/**
 * Data URI yang boleh: hanya format raster yang sama dengan hasil upload
 * (`/api/upload`). SVG sengaja tidak ikut: markup-nya bisa membawa skrip, dan
 * tidak ada sumber SVG yang sah di portofolio ini.
 *
 * Awalan saja tidak cukup. Prefiks `data:image/png;base64,` bisa diikuti apa
 * saja, termasuk `"`, yang tepat menjadi attribute break-out saat URI ini
 * di-inline ke file HTML export. Bodi-nya karena itu wajib benar-benar alphabet
 * base64, dan byte hasil dekodenya harus cocok dengan tipe yang diklaim:
 * tanpa pemeriksaan kedua, `data:image/png;base64,<svg onload=...>` menembus
 * gerbang hanya dengan menukar labelnya.
 */
const DATA_IMAGE_PREFIX = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i;
const BASE64_BODY = /^[A-Za-z0-9+/]+={0,2}$/;

type RasterFormat = "png" | "jpeg" | "gif" | "webp";

/** Alias MIME ke format yang di-sniff. Tiap tipe di allowlist wajib punya entri. */
const DECLARED_FORMAT: Record<string, RasterFormat> = {
  png: "png",
  jpeg: "jpeg",
  jpg: "jpeg",
  gif: "gif",
  webp: "webp",
};

/** 32 karakter base64 = 24 byte, cukup untuk semua tanda tangan di bawah. */
const SNIFF_BASE64_CHARS = 32;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const GIF_SIGNATURES = ["GIF87a", "GIF89a"];

function ascii(bytes: Uint8Array, from: number, to: number): string {
  let out = "";
  for (let i = from; i < to; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

/** Format hasil bacaan magic number. `null` kalau tidak dikenali. */
function sniffFormat(head: Uint8Array): RasterFormat | null {
  if (head.length >= 8 && PNG_SIGNATURE.every((b, i) => head[i] === b)) return "png";
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "jpeg";
  if (head.length >= 6 && GIF_SIGNATURES.includes(ascii(head, 0, 6))) return "gif";
  if (head.length >= 12 && ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WEBP") {
    return "webp";
  }
  return null;
}

/**
 * Hanya kepala payload yang didecode: 32 karakter base64, bukan 7 MiB. Panjang
 * dipotong ke kelipatan 4 karena `atob` menolak potongan yang tidak utuh.
 */
function decodeHead(body: string): Uint8Array | null {
  const wanted = Math.min(body.length, SNIFF_BASE64_CHARS);
  const take = wanted - (wanted % 4);
  if (take < 4) return null;
  try {
    const binary = atob(body.slice(0, take));
    const head = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) head[i] = binary.charCodeAt(i);
    return head;
  } catch {
    return null;
  }
}

function isAllowedDataImage(v: string): boolean {
  if (v.length > MAX_DATA_IMAGE_LENGTH) return false;
  const prefix = DATA_IMAGE_PREFIX.exec(v);
  if (!prefix) return false;
  const body = v.slice(prefix[0].length);
  if (!BASE64_BODY.test(body)) return false;
  const head = decodeHead(body);
  if (!head) return false;
  return sniffFormat(head) === DECLARED_FORMAT[prefix[1].toLowerCase()];
}

/** Teks kegagalannya untuk mata; juga potongan dari nama aksesibel placeholder. */
const IMAGE_FAILED_TEXT = "gambar tidak dapat ditampilkan";
const IMAGE_REJECTED_HINT = `ditolak: ${REJECTED_REASON}`;

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
