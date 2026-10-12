### Task 9: API aset + upload ke storage server

Menghapus jebakan base64: foto 4 MB tidak lagi menjadi string 4 MB di dalam draft JSON.

**Files:**
- Create: `src/lib/portfolio/assets.ts`
- Create: `src/app/api/portfolio/assets/route.ts`
- Create: `src/app/api/portfolio/assets/[id]/route.ts`
- Create: `src/components/portfolio/render/PortfolioPhotoUpload.tsx`
- Modify: `src/app/portfolio/build/page.tsx`
- Delete: `src/components/portfolio/PhotoUpload.tsx` (bila sudah tidak ada importer)
- Test: `src/__tests__/portfolio-assets.test.ts`

**Interfaces:**
- Produces:
  - `MAX_ASSET_BYTES`, `ALLOWED_MIME`, `isAllowedMime`, `assetUrl`, `readImageSize`, `fitsDimensionBudget`, `dimensionWarning`
  - `POST /api/portfolio/assets` (multipart, field `file`) → `{ id, url, width, height, bytes, deduplicated }`
  - `GET /api/portfolio/assets/[id]` → bytes, hanya untuk pemiliknya
  - `<PortfolioPhotoUpload value onChange label hint className />`

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-assets.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  MAX_ASSET_BYTES,
  ALLOWED_MIME,
  isAllowedMime,
  fitsDimensionBudget,
  dimensionWarning,
  readImageSize,
} from "@/lib/portfolio/assets";

describe("validasi aset", () => {
  it("membatasi ukuran 4 MB", () => {
    expect(MAX_ASSET_BYTES).toBe(4194304);
  });

  it("hanya menerima gambar yang didukung", () => {
    expect(isAllowedMime("image/png")).toBe(true);
    expect(isAllowedMime("image/webp")).toBe(true);
    expect(isAllowedMime("image/svg+xml")).toBe(false);
    expect(isAllowedMime("application/pdf")).toBe(false);
  });

  it("menandai gambar yang melebihi anggaran dimensi", () => {
    expect(fitsDimensionBudget(4000, 3000)).toBe(false);
    expect(fitsDimensionBudget(1600, 1200)).toBe(true);
    expect(dimensionWarning(4000, 3000)).toContain("4000");
  });

  it("membaca dimensi PNG dari header", () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x03, 0x20, 0x00, 0x00, 0x01, 0xe0,
    ]);
    expect(readImageSize(png, "image/png")).toEqual({ width: 800, height: 480 });
  });

  it("mengembalikan null untuk format tak didukung", () => {
    expect(readImageSize(Buffer.alloc(4), "image/webp")).toBeNull();
  });

  it("menyebutkan daftar format yang diterima", () => {
    expect(ALLOWED_MIME.join(", ")).toContain("image/webp");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-assets.test.ts`
Expected: FAIL

- [ ] **Step 3: Buat `src/lib/portfolio/assets.ts`**

```ts
export const MAX_ASSET_BYTES = 4 * 1024 * 1024;

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export function isAllowedMime(mime: string): boolean {
  return (ALLOWED_MIME as readonly string[]).includes(mime);
}

/** Dimensi maksimum agar file export tidak terlalu berat. */
export const BUDGET_PX = 2200;

export function fitsDimensionBudget(width: number, height: number): boolean {
  return Math.max(width, height) <= BUDGET_PX;
}

export function dimensionWarning(width: number, height: number): string {
  return `Gambar ${width}x${height} px melebihi ${BUDGET_PX} px. Berkas export akan berat, pertimbangkan gambar yang lebih kecil.`;
}

export function assetUrl(id: string): string {
  return `/api/portfolio/assets/${id}`;
}

/** Deteksi dimensi PNG/GIF/JPEG dari header byte tanpa library gambar. */
export function readImageSize(
  buf: Buffer,
  mime: string,
): { width: number; height: number } | null {
  if (mime === "image/png" && buf.length > 24 && buf.readUInt32BE(12) === 0x49484452) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (mime === "image/gif" && buf.length > 10) {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  if (mime === "image/jpeg") {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-assets.test.ts`
Expected: PASS — 6 test

- [ ] **Step 5: Buat `src/app/api/portfolio/assets/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioAssets } from "@/db/schema";
import {
  MAX_ASSET_BYTES,
  ALLOWED_MIME,
  isAllowedMime,
  assetUrl,
  readImageSize,
} from "@/lib/portfolio/assets";

export const dynamic = "force-dynamic";

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return errorResponse("NO_FILE", "Tidak ada berkas yang diunggah", 400);
  }

  if (!isAllowedMime(file.type)) {
    return errorResponse(
      "UNSUPPORTED_TYPE",
      `Format ${file.type || "tidak dikenal"} tidak didukung. Gunakan: ${ALLOWED_MIME.join(", ")}.`,
      415,
    );
  }

  if (file.size > MAX_ASSET_BYTES) {
    return errorResponse(
      "FILE_TOO_LARGE",
      `Ukuran maksimal 4 MB. Berkas ini ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      413,
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buf).digest("hex");

  const [existing] = await db
    .select()
    .from(portfolioAssets)
    .where(
      and(eq(portfolioAssets.userId, auth.userId), eq(portfolioAssets.sha256, sha256)),
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({
      id: existing.id,
      url: assetUrl(existing.id),
      width: existing.width,
      height: existing.height,
      bytes: existing.bytes,
      deduplicated: true,
    });
  }

  const size = readImageSize(buf, file.type);
  const [row] = await db
    .insert(portfolioAssets)
    .values({
      userId: auth.userId,
      mime: file.type,
      bytes: buf.byteLength,
      width: size?.width ?? null,
      height: size?.height ?? null,
      sha256,
      data: buf,
    })
    .returning({ id: portfolioAssets.id });

  return NextResponse.json(
    {
      id: row.id,
      url: assetUrl(row.id),
      width: size?.width ?? null,
      height: size?.height ?? null,
      bytes: buf.byteLength,
      deduplicated: false,
    },
    { status: 201 },
  );
});
```

- [ ] **Step 6: Buat route aset yang melayani editor sekaligus halaman publik**

`src/app/api/portfolio/assets/[id]/route.ts`. Route ini **tidak** memakai `withAuth`, karena halaman `/p/[slug]` dibuka anonim dan gambar di dalamnya harus tampil. Akses diberikan bila salah satu berlaku: aset milik user yang sedang login, atau id aset dirujuk oleh data portfolio berstatus `published`.

```ts
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioAssets, portfolioPages } from "@/db/schema";

export const dynamic = "force-dynamic";

export const GET = async (
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) => {
  const { id } = await ctx.params;

  const [row] = await db
    .select()
    .from(portfolioAssets)
    .where(eq(portfolioAssets.id, id))
    .limit(1);

  if (!row) return errorResponse("ASSET_NOT_FOUND", "Gambar tidak ditemukan", 404);

  const session = await getServerSession(auth);
  const isOwner = !!session?.user?.id && session.user.id === row.userId;

  if (!isOwner) {
    const needle = `/api/portfolio/assets/${id}`;
    const pages = await db
      .select({ data: portfolioPages.data })
      .from(portfolioPages)
      .where(eq(portfolioPages.status, "published"));
    const referenced = pages.some((p) =>
      JSON.stringify(p.data ?? "").includes(needle),
    );
    if (!referenced) {
      return errorResponse("ASSET_NOT_FOUND", "Gambar tidak ditemukan", 404);
    }
  }

  return new NextResponse(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(row.bytes),
    },
  });
};
```

Sesuaikan nama import session dengan yang dipakai repo ini - baca `src/lib/api-utils.ts` bagian `withAuth` untuk melihat bagaimana session diambil, lalu pakai pola yang sama tanpa fungsi tersebut.

Hapusroute privat terpisah; tidak ada lagi.

- [ ] **Step 7: Buat `src/components/portfolio/render/PortfolioPhotoUpload.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";
import {
  ALLOWED_MIME,
  MAX_ASSET_BYTES,
  dimensionWarning,
  fitsDimensionBudget,
} from "@/lib/portfolio/assets";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint?: string;
  className?: string;
};

export default function PortfolioPhotoUpload({
  value,
  onChange,
  label,
  hint,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setNotice(null);

    if (file.size > MAX_ASSET_BYTES) {
      setError(
        `Ukuran maksimal 4 MB. Berkas ini ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      );
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/portfolio/assets", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal mengunggah gambar");
        return;
      }
      onChange(json.url as string);
      if (json.width && json.height && !fitsDimensionBudget(json.width, json.height)) {
        setNotice(dimensionWarning(json.width, json.height));
      }
    } catch {
      setError("Gagal mengunggah gambar. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <span className="mb-1 block text-sm font-medium text-on-surface">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant px-4 text-sm font-semibold disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden>upload</span>
          {busy ? "Mengunggah" : "Pilih gambar"}
        </button>
        <span className="truncate text-xs text-on-surface-variant">
          {value ? value : "Belum ada gambar"}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIME.join(",")}
        onChange={onPick}
        className="sr-only"
        aria-label={label}
      />
      {hint ? <p className="mt-1 text-xs text-on-surface-variant">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs font-medium text-red-700">{error}</p> : null}
      {notice ? <p className="mt-1 text-xs text-amber-700">{notice}</p> : null}
    </div>
  );
}
```

- [ ] **Step 8: Arahkan builder ke komponen baru**

Di `src/app/portfolio/build/page.tsx`, ganti pemakaian `PhotoUpload` untuk `heroPhotoUrl` dengan `PortfolioPhotoUpload`. Hapus alur yang menyimpan base64 ke `formData.heroPhotoUrl`.

- [ ] **Step 9: Test, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add src/lib/portfolio/assets.ts "src/app/api/portfolio/assets/route.ts" "src/app/api/portfolio/assets/[id]/route.ts" src/components/portfolio/render/PortfolioPhotoUpload.tsx src/components/portfolio/PhotoUpload.tsx src/app/portfolio/build/page.tsx src/__tests__/portfolio-assets.test.ts
git commit -m "feat(portfolio): aset gambar di server, bukan base64 di draft JSON"
```

---
