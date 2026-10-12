### Task 11: `ai-map.ts` + undo stack

Mematikan bug `applyAllAi` yang menulis `formData.hero = {…}` dan menghapus overwrite massal `experiences`.

**Files:**
- Create: `src/lib/portfolio/ai-map.ts`
- Create: `src/lib/portfolio/useUndoStack.ts`
- Modify: `src/app/portfolio/build/page.tsx`
- Modify: `src/app/portfolio/live/page.tsx`
- Test: `src/__tests__/portfolio-ai-map.test.ts`

**Interfaces:**
- Produces:
  - `applyAiSuggestion(data, res): { data, changes: AiChange[] }`
  - `mergeExperiences(current, incoming): { merged, addedCount, keptCount }`
  - `useUndoStack<T>(initial, limit?)` → `{ state, set, undo, redo, canUndo, canRedo, reset }`

- [ ] **Step 1: Tulis test yang gagal**

`src/__tests__/portfolio-ai-map.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { applyAiSuggestion, mergeExperiences } from "@/lib/portfolio/ai-map";

const formData = {
  heroPhotoUrl: "",
  heroHeadline: "Taufferan Lama",
  heroSubHeadline: "",
  heroFirstName: "Teguh",
  heroLastName: "Surya",
  heroBio: "Bio lama",
  aboutText: "About lama",
  aboutYearsExp: "",
  aboutProjectsDone: "",
  aboutClientsHappy: "",
  skillsMain: "Lama",
  skillsTools: "",
  skillsLanguages: "",
  contactEmail: "",
  contactPhone: "",
  contactLinkedin: "",
  contactGithub: "",
};

const base = {
  formData,
  projects: [],
  experiences: [],
  educations: [],
  certifications: [],
  organizations: [],
  hobbies: [],
  testimonials: [],
  extraLinks: [],
} as never;

describe("applyAiSuggestion", () => {
  it("menulis ke field datar yang benar, bukan objek baru", () => {
    const res = {
      hero: { headline: "Frontend Developer", sub_headline: "React & TypeScript" },
      about: { meta_description: "Deskripsi baru", paragraphs: ["Paragraf 1."] },
    } as never;

    const { data } = applyAiSuggestion(base, res);
    const f = (data as never as { formData: Record<string, string> }).formData;

    expect(f.heroHeadline).toBe("Frontend Developer");
    expect(f.heroSubHeadline).toBe("React & TypeScript");
    expect(f.aboutText).toContain("Paragraf 1.");
    expect(f.hero).toBeUndefined();
  });

  it("mempertahankan nilai yang tidak disentuh AI", () => {
    const { data } = applyAiSuggestion(base, { hero: { headline: "Baru" } } as never);
    const f = (data as never as { formData: Record<string, string> }).formData;
    expect(f.heroFirstName).toBe("Teguh");
    expect(f.heroBio).toBe("Bio lama");
  });

  it("melaporkan field yang berubah untuk ditampilkan sebagai diff", () => {
    const { changes } = applyAiSuggestion(base, { hero: { headline: "Baru" } } as never);
    expect(changes.map((c) => c.field)).toContain("heroHeadline");
  });

  it("mengembalikan input apa adanya bila respons kosong", () => {
    const { data, changes } = applyAiSuggestion(base, {} as never);
    expect(data).toBe(base);
    expect(changes).toHaveLength(0);
  });
});

describe("mergeExperiences", () => {
  const cur = [
    { id: "e1", company: "Acme", position: "Dev", startDate: "2022-01", endDate: "2023-01", description: "" },
  ];

  it("menambah entri baru tanpa menghapus entri lama", () => {
    const incoming = [
      { id: "ai1", company: "Globex", position: "FE", startDate: "2023-02", endDate: "2024-01", description: "" },
    ];
    const r = mergeExperiences(cur as never, incoming as never);
    expect(r.merged).toHaveLength(2);
    expect(r.keptCount).toBe(1);
    expect(r.addedCount).toBe(1);
  });

  it("tidak menggandakan entri dengan perusahaan dan posisi sama", () => {
    const incoming = [
      { id: "ai2", company: "Acme", position: "Dev", startDate: "2022-01", endDate: "2023-01", description: "" },
    ];
    expect(mergeExperiences(cur as never, incoming as never).addedCount).toBe(0);
  });

  it("mengembalikan array kosong tanpa merusak input", () => {
    expect(mergeExperiences([] as never, [] as never).merged).toEqual([]);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/portfolio-ai-map.test.ts`
Expected: FAIL

- [ ] **Step 3: Buat `src/lib/portfolio/ai-map.ts`**

```ts
import type { PortfolioData } from "@/components/portfolio-templates/types";

export type AiChange = {
  field: string;
  label: string;
  from: string;
  to: string;
};

type Dict = Record<string, unknown>;
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/**
 * Satu-satunya cara respons /api/portfolio/suggest masuk ke state portfolio.
 * Respons bersarang dipetakan ke field datar PortfolioFormData, jadi tidak
 * mungkin ada kunci asing yang tersimpan dan ikut terbit.
 */
export function applyAiSuggestion(
  data: PortfolioData,
  res: Dict,
): { data: PortfolioData; changes: AiChange[] } {
  const form = { ...data.formData } as Record<string, string>;
  const changes: AiChange[] = [];

  const set = (field: string, value: unknown, label: string) => {
    const next = str(value);
    if (!next) return;
    const from = String(form[field] ?? "");
    if (from === next) return;
    form[field] = next;
    changes.push({ field, label, from, to: next });
  };

  const hero = (res.hero ?? {}) as Dict;
  set("heroHeadline", hero.headline, "Judul peran");
  set("heroSubHeadline", hero.sub_headline, "Sub-judul");
  set("heroBio", hero.bio, "Bio singkat");

  const about = (res.about ?? {}) as Dict;
  const paragraphs = Array.isArray(about.paragraphs) ? about.paragraphs : [];
  set(
    "aboutText",
    paragraphs.map(str).filter(Boolean).join("\n\n") || about.meta_description,
    "Tentang saya",
  );

  const skills = (res.skills_display ?? {}) as Dict;
  const mainSkills = Array.isArray(skills.skills) ? skills.skills : [];
  set(
    "skillsMain",
    mainSkills.map(str).filter(Boolean).join(", "),
    "Keahlian utama",
  );

  if (changes.length === 0) return { data, changes };
  return { data: { ...data, formData: form as unknown as PortfolioData["formData"] }, changes };
}

/**
 * AI tidak boleh menghapus pekerjaan yang sudah diketik user. Entri dengan
 * perusahaan dan posisi yang sama dianggap duplikat dan dilewati.
 */
export function mergeExperiences(
  current: PortfolioData["experiences"],
  incoming: PortfolioData["experiences"],
): { merged: PortfolioData["experiences"]; addedCount: number; keptCount: number } {
  const key = (e: { company?: string; position?: string }) =>
    `${(e.company ?? "").trim().toLowerCase()}|${(e.position ?? "").trim().toLowerCase()}`;

  const seen = new Set(current.map(key));
  const added: PortfolioData["experiences"] = [];
  for (const exp of incoming) {
    const k = key(exp);
    if (seen.has(k)) continue;
    seen.add(k);
    added.push(exp);
  }

  return {
    merged: [...current, ...added],
    addedCount: added.length,
    keptCount: current.length,
  };
}
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/portfolio-ai-map.test.ts`
Expected: PASS — 7 test

- [ ] **Step 5: Buat `src/lib/portfolio/useUndoStack.ts`**

```ts
"use client";

import { useCallback, useRef, useState } from "react";

export function useUndoStack<T>(initial: T, limit = 50) {
  const [state, setState] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);

  const set = useCallback(
    (next: T | ((p: T) => T)) => {
      setState((prev) => {
        const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        if (Object.is(value, prev)) return prev;
        past.current = [...past.current.slice(-(limit - 1)), prev];
        future.current = [];
        return value;
      });
    },
    [limit],
  );

  const undo = useCallback(() => {
    setState((prev) => {
      const last = past.current[past.current.length - 1];
      if (last === undefined) return prev;
      past.current = past.current.slice(0, -1);
      future.current = [prev, ...future.current];
      return last;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const [next, ...rest] = future.current;
      if (next === undefined) return prev;
      future.current = rest;
      past.current = [...past.current, prev];
      return next;
    });
  }, []);

  const reset = useCallback((value: T) => {
    past.current = [];
    future.current = [];
    setState(value);
  }, []);

  return {
    state,
    set,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    reset,
  };
}
```

- [ ] **Step 6: Ganti pemanggil di kedua builder**

`src/app/portfolio/build/page.tsx`, ganti `applyAllAi`:

```ts
const { data: merged, changes } = applyAiSuggestion(data, aiSuggestions);
if (changes.length === 0) {
  setAiError("AI tidak mengembalikan perubahan baru.");
  return;
}
pushUndo();
setData(merged);
setAiChanges(changes);
```

`src/app/portfolio/live/page.tsx`, ganti `handleAiGenerate`:

```ts
const mergedExp = mergeExperiences(experiences, incomingExperiences);
pushUndo();
setExperiences(mergedExp.merged);
setAiDiff({
  addedExperiences: mergedExp.addedCount,
  keptExperiences: mergedExp.keptCount,
});
```

Tampilkan `changes` sebagai daftar before/after, bukan toast yang disappears.

- [ ] **Step 7: Test, typecheck, commit**

```bash
npm test
npx tsc --noEmit
git add src/lib/portfolio/ai-map.ts src/lib/portfolio/useUndoStack.ts src/app/portfolio/build/page.tsx src/app/portfolio/live/page.tsx src/__tests__/portfolio-ai-map.test.ts
git commit -m "fix(portfolio): mapping AI terpusat dan undo stack"
```

---
