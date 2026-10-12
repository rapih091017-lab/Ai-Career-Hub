### Task 8: API draft + `usePortfolioDraft`

**Files:**
- Create: `src/lib/portfolio/usePortfolioDraft.ts`
- Create: `src/app/api/portfolio/draft/route.ts`
- Test: `src/__tests__/portfolio-draft-store.test.ts`

**Interfaces:**
- Consumes: `db`, `portfolioDrafts`, `draftPayloadSchema`
- Produces:
  - `GET /api/portfolio/draft?draftId=` → `{ draftId, name, data, updatedAt }`, atau draft terbaru bila `draftId` kosong
  - `POST /api/portfolio/draft` → `{ draftId }` (201)
  - `PATCH /api/portfolio/draft` → `{ updatedAt }`
  - `DELETE /api/portfolio/draft?draftId=` → `{ ok: true }`
  - `cacheKey`, `readCache`, `writeCache`, `clearCache`, `usePortfolioDraft`

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-draft-store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  cacheKey,
  readCache,
  writeCache,
  clearCache,
  type CachedDraft,
} from "@/lib/portfolio/usePortfolioDraft";

const draft = {
  name: "Portfolio saya",
  data: { formData: {} },
  updatedAt: "2026-10-10T00:00:00.000Z",
} as unknown as CachedDraft;

describe("cache draft", () => {
  beforeEach(() => localStorage.clear());

  it("membuat kunci cache per draft", () => {
    expect(cacheKey("abc")).toBe("portfolio_cache_v1_abc");
  });

  it("menulis dan membaca cache", () => {
    writeCache("abc", draft);
    expect(readCache("abc")).toEqual(draft);
  });

  it("mengembalikan null saat cache kosong atau rusak", () => {
    expect(readCache("kosong")).toBeNull();
    localStorage.setItem(cacheKey("rusak"), "{bukan json");
    expect(readCache("rusak")).toBeNull();
  });

  it("membersihkan cache", () => {
    writeCache("abc", draft);
    clearCache("abc");
    expect(readCache("abc")).toBeNull();
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-draft-store.test.ts`
Expected: FAIL

- [ ] **Step 3: Buat `src/lib/portfolio/usePortfolioDraft.ts`**

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ValidatedPortfolioData } from "./schema";

export type CachedDraft = {
  name: string;
  data: ValidatedPortfolioData;
  updatedAt: string;
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function cacheKey(draftId: string): string {
  return `portfolio_cache_v1_${draftId}`;
}

export function readCache(draftId: string): CachedDraft | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(draftId));
    if (!raw) return null;
    return JSON.parse(raw) as CachedDraft;
  } catch {
    return null;
  }
}

export function writeCache(draftId: string, draft: CachedDraft): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(cacheKey(draftId), JSON.stringify(draft));
  } catch {
    // Cache penuh atau ditolak browser. Tidak menggagalkan alur: server
    // tetap sumber kebenaran dan banner offline memberi tahu user.
  }
}

export function clearCache(draftId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(cacheKey(draftId));
  } catch {
    /* diabaikan */
  }
}

const DEBOUNCE_MS = 1200;

export type UsePortfolioDraftResult = {
  draftId: string | null;
  data: ValidatedPortfolioData | null;
  setData: (
    next: ValidatedPortfolioData | ((p: ValidatedPortfolioData) => ValidatedPortfolioData),
  ) => void;
  name: string;
  setName: (n: string) => void;
  status: SaveStatus;
  offline: boolean;
  error: string | null;
  lastSavedAt: string | null;
  retry: () => void;
  loading: boolean;
};

export function usePortfolioDraft(draftId: string | null): UsePortfolioDraftResult {
  const [data, setDataState] = useState<ValidatedPortfolioData | null>(null);
  const [name, setName] = useState("Portfolio saya");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<ValidatedPortfolioData | null>(null);
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!draftId) {
      setLoading(false);
      return;
    }
    if (hydratedFor.current === draftId) return;
    hydratedFor.current = draftId;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/portfolio/draft?draftId=${draftId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("gagal memuat");
        const json = (await res.json()) as CachedDraft;
        if (cancelled) return;
        setDataState(json.data);
        setName(json.name);
        setLastSavedAt(json.updatedAt);
        setOffline(false);
        writeCache(draftId, json);
      } catch {
        const cached = readCache(draftId);
        if (cancelled) return;
        if (cached) {
          setDataState(cached.data);
          setName(cached.name);
          setLastSavedAt(cached.updatedAt);
          setOffline(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [draftId]);

  const flush = useCallback(async () => {
    if (!draftId || !pending.current) return;
    const body = pending.current;
    pending.current = null;
    setStatus("saving");
    try {
      const res = await fetch("/api/portfolio/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, name, data: body }),
      });
      if (!res.ok) throw new Error("gagal menyimpan");
      const json = (await res.json()) as { updatedAt: string };
      setStatus("saved");
      setError(null);
      setOffline(false);
      setLastSavedAt(json.updatedAt);
      writeCache(draftId, { name, data: body, updatedAt: json.updatedAt });
    } catch {
      setStatus("error");
      setOffline(true);
      setError("Perubahan belum masuk server. Ketuk coba lagi.");
      writeCache(draftId, { name, data: body, updatedAt: new Date().toISOString() });
    }
  }, [draftId, name]);

  const setData = useCallback(
    (next: ValidatedPortfolioData | ((p: ValidatedPortfolioData) => ValidatedPortfolioData)) => {
      setDataState((prev) => {
        if (!prev) return prev;
        const value = typeof next === "function" ? next(prev) : next;
        pending.current = value;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
        return value;
      });
    },
    [flush],
  );

  const retry = useCallback(() => {
    if (!pending.current) return;
    void flush();
  }, [flush]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return {
    draftId,
    data,
    setData,
    name,
    setName,
    status,
    offline,
    error,
    lastSavedAt,
    retry,
    loading,
  };
}
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-draft-store.test.ts`
Expected: PASS — 4 test

- [ ] **Step 5: Buat `src/app/api/portfolio/draft/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioDrafts } from "@/db/schema";
import { draftPayloadSchema } from "@/lib/portfolio/schema";

export const dynamic = "force-dynamic";

const pick = {
  id: portfolioDrafts.id,
  name: portfolioDrafts.name,
  data: portfolioDrafts.data,
  updatedAt: portfolioDrafts.updatedAt,
};

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const draftId = request.nextUrl.searchParams.get("draftId");

  const base = draftId
    ? and(eq(portfolioDrafts.id, draftId), eq(portfolioDrafts.userId, auth.userId))
    : eq(portfolioDrafts.userId, auth.userId);

  const [row] = await db
    .select(pick)
    .from(portfolioDrafts)
    .where(base)
    .orderBy(desc(portfolioDrafts.updatedAt))
    .limit(1);

  if (!row) {
    return draftId
      ? errorResponse("DRAFT_NOT_FOUND", "Draft tidak ditemukan", 404)
      : NextResponse.json({ draftId: null });
  }

  return NextResponse.json({
    draftId: row.id,
    name: row.name,
    data: row.data,
    updatedAt: row.updatedAt.toISOString(),
  });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = draftPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "INVALID_DATA",
      parsed.error.issues[0]?.message ?? "Data draft tidak valid",
      400,
      { issues: parsed.error.issues },
    );
  }

  const [row] = await db
    .insert(portfolioDrafts)
    .values({
      userId: auth.userId,
      name: parsed.data.name ?? "Portfolio saya",
      data: parsed.data.data as Record<string, unknown>,
    })
    .returning({ id: portfolioDrafts.id });

  return NextResponse.json({ draftId: row.id }, { status: 201 });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const raw = (await request.json().catch(() => null)) as {
    draftId?: string;
    name?: string;
    data?: unknown;
  } | null;

  if (!raw?.draftId) {
    return errorResponse("INVALID_BODY", "draftId wajib diisi", 400);
  }

  const parsed = draftPayloadSchema.safeParse({ name: raw.name, data: raw.data });
  if (!parsed.success) {
    return errorResponse(
      "INVALID_DATA",
      parsed.error.issues[0]?.message ?? "Data draft tidak valid",
      400,
      { issues: parsed.error.issues },
    );
  }

  const [existing] = await db
    .select({ id: portfolioDrafts.id })
    .from(portfolioDrafts)
    .where(
      and(eq(portfolioDrafts.id, raw.draftId), eq(portfolioDrafts.userId, auth.userId)),
    )
    .limit(1);

  if (!existing) {
    return errorResponse("DRAFT_NOT_FOUND", "Draft tidak ditemukan", 404);
  }

  const [row] = await db
    .update(portfolioDrafts)
    .set({
      name: parsed.data.name ?? "Portfolio saya",
      data: parsed.data.data as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(portfolioDrafts.id, raw.draftId))
    .returning({ updatedAt: portfolioDrafts.updatedAt });

  return NextResponse.json({ updatedAt: row.updatedAt.toISOString() });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json().catch(() => ({}))) as { draftId?: string };
  const draftId = request.nextUrl.searchParams.get("draftId") ?? body.draftId;

  if (!draftId) {
    return errorResponse("INVALID_BODY", "draftId wajib diisi", 400);
  }

  await db
    .delete(portfolioDrafts)
    .where(and(eq(portfolioDrafts.id, draftId), eq(portfolioDrafts.userId, auth.userId)));

  return NextResponse.json({ ok: true });
});
```

- [ ] **Step 6: Typecheck dan commit**

```bash
npx tsc --noEmit
git add src/lib/portfolio/usePortfolioDraft.ts src/app/api/portfolio/draft/route.ts src/__tests__/portfolio-draft-store.test.ts
git commit -m "feat(portfolio): API draft + hook dengan cache write-through"
```

---
