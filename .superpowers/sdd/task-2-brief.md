### Task 2: `SafeLink` dan `SafeImg`

Menutup celah XSS halaman publik sekarang juga mencegahnya kembali muncul di spec berikutnya.

**Files:**
- Create: `src/components/portfolio/render/SafeLink.tsx`
- Test: `src/__tests__/portfolio-safe-link.test.tsx`

**Interfaces:**
- Consumes: `safeUrl(v: string): string`
- Produces:
  - `<SafeLink href mode className target rel children>` dengan `mode: "editor" | "static"`
  - `<SafeImg src mode alt width height className>`
  - `export type SafeRenderMode = "editor" | "static"`

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-safe-link.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SafeLink, SafeImg } from "@/components/portfolio/render/SafeLink";

describe("SafeLink", () => {
  it("merender tautan https tanpa perubahan", () => {
    render(
      <SafeLink href="https://github.com/teguh" mode="static">Repo</SafeLink>,
    );
    expect(screen.getByRole("link", { name: "Repo" })).toHaveAttribute(
      "href",
      "https://github.com/teguh",
    );
  });

  it("tidak menghasilkan href untuk javascript: di mode static", () => {
    render(<SafeLink href="javascript:alert(1)" mode="static">Jahat</SafeLink>);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Jahat")).toBeInTheDocument();
  });

  it("memberi prefiks https pada domain telanjang", () => {
    render(
      <SafeLink href="linkedin.com/in/teguh" mode="static">LinkedIn</SafeLink>,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://linkedin.com/in/teguh",
    );
  });

  it("memperingatkan editor saat tautan ditolak", () => {
    render(<SafeLink href="data:text/html,x" mode="editor">Fail</SafeLink>);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(/tautan ditolak/i)).toBeInTheDocument();
  });

  it("membuka tautan eksternal di tab baru dengan rel aman", () => {
    render(
      <SafeLink href="https://example.com" mode="static" target="_blank">Ext</SafeLink>,
    );
    const a = screen.getByRole("link");
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("merender mailto dan tel", () => {
    render(
      <>
        <SafeLink href="mailto:teguh@example.com" mode="static">Mail</SafeLink>
        <SafeLink href="tel:+628123456789" mode="static">Tel</SafeLink>
      </>,
    );
    expect(screen.getByRole("link", { name: "Mail" })).toHaveAttribute(
      "href",
      "mailto:teguh@example.com",
    );
    expect(screen.getByRole("link", { name: "Tel" })).toHaveAttribute(
      "href",
      "tel:+628123456789",
    );
  });
});

describe("SafeImg", () => {
  it("merender gambar yang diizinkan", () => {
    render(
      <SafeImg src="/api/portfolio/assets/abc" mode="static" alt="Foto Teguh" width={200} height={200} />,
    );
    expect(screen.getByAltText("Foto Teguh")).toBeInTheDocument();
  });

  it("mengganti gambar dengan skema terlarang menjadi placeholder", () => {
    render(<SafeImg src="javascript:alert(1)" mode="static" alt="X" width={100} height={100} />);
    expect(screen.queryByAltText("X")).toBeNull();
    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
  });

  it("menampilkan placeholder saat src kosong", () => {
    render(<SafeImg src="" mode="static" alt="Kosong" width={10} height={10} />);
    expect(screen.getByText(/gambar tidak dapat ditampilkan/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-safe-link.test.tsx`
Expected: FAIL — modul tidak ada

- [ ] **Step 3: Buat `src/components/portfolio/render/SafeLink.tsx`**

```tsx
"use client";

import { safeUrl } from "@/lib/portfolio-safety";

export type SafeRenderMode = "editor" | "static";

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
        <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
          tautan ditolak - skema tidak diizinkan
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
      {...(external ? { rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

type SafeImgProps = {
  src: string;
  mode: SafeRenderMode;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
};

/**
 * src yang lolos safeUrl. Data URI gambar tetap boleh supaya aset yang
 * sudah di-inline saat export bisa dirender.
 */
export function SafeImg({ src, mode, alt, width, height, className }: SafeImgProps) {
  const value = src ?? "";
  const ok =
    /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);/i.test(value) ||
    safeUrl(value) !== "";

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
      src={value}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      data-editor-mode={mode}
    />
  );
}
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-safe-link.test.tsx`
Expected: PASS — 9 test

- [ ] **Step 5: Typecheck dan commit**

```bash
npx tsc --noEmit
git add src/components/portfolio/render/SafeLink.tsx src/__tests__/portfolio-safe-link.test.tsx
git commit -m "feat(portfolio): SafeLink dan SafeImg menutup stored XSS"
```

---
