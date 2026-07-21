# Dashboard + CV Builder Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membuat halaman dashboard sebagai central hub setelah login, dan memperbaiki flow "Buat CV Baru" dengan pemilihan template terlebih dahulu.

**Architecture:** Dashboard page (`/dashboard`) sebagai halaman client-side dengan AuthGuard. TemplatePicker sebagai komponen reusable. API endpoint baru untuk list CV. Flow: Dashboard → Pilih Template → Isi Posisi (opsional) → Builder.

**Tech Stack:** Next.js 15 App Router, Tailwind v3, Drizzle ORM (`@/db`), NextAuth v5 (`@/lib/auth`)

## Global Constraints
- File haram: `package.json`, `next.config.*`, `tailwind.config.*`, `tsconfig.json`, `.env*`, `eslint.config.*`, `drizzle.config.ts`
- Aksi haram: `npm install`, ganti versi dep, pakai Prisma/MongoDB, bikin `src/lib/db.ts` (pakai `@/db`), ubah ESM/CommonJS config
- `CvData` itu FLAT: `cvData.summary` (BUKAN `cvData.personalInfo.summary`)
- JSX valid: 1 attribut per event, tag ditutup dengan `>`, tidak ada trailing `"`
- Type safe: Cek type/interface sebelum pakai prop tambahan
- Ikut pola yang sudah ada di codebase

---

### Task 1: Template Data + API List CV

**Files:**
- Create: `src/lib/templates.ts`
- Create: `src/app/api/cv-documents/route.ts`
- Modify: `src/app/api/cv-documents/create/route.ts`

**Interfaces:**
- Consumes: `db` dari `@/db`, `auth` dari `@/lib/auth`, schema `cvDocuments` dari `@/db/schema`
- Produces: `CV_TEMPLATES` constant, `GET /api/cv-documents` endpoint, modified `POST /api/cv-documents/create`

- [ ] **Step 1: Create templates data file**

`src/lib/templates.ts`:
```ts
export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  defaultFont: string;
  primaryColor: string;
}

export const CV_TEMPLATES: CVTemplate[] = [
  {
    id: "minimal-dark-v1",
    name: "Minimal Dark",
    description: "Template gelap modern dengan aksen ungu, cocok untuk tech & startup",
    thumbnail: "/templates/minimal-dark.png",
    defaultFont: "Inter",
    primaryColor: "#6d3bd7",
  },
  {
    id: "professional-blue",
    name: "Professional Blue",
    description: "Template biru profesional, cocok untuk corporate & formal",
    thumbnail: "/templates/professional-blue.png",
    defaultFont: "Inter",
    primaryColor: "#2563eb",
  },
  {
    id: "clean-white",
    name: "Clean White",
    description: "Template putih bersih dengan aksen hijau, minimalis & elegan",
    thumbnail: "/templates/clean-white.png",
    defaultFont: "Inter",
    primaryColor: "#059669",
  },
];

export const DEFAULT_TEMPLATE_ID = "minimal-dark-v1";
```

- [ ] **Step 2: Create GET /api/cv-documents route**

`src/app/api/cv-documents/route.ts`:
```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { cvDocuments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "AUTH_REQUIRED", message: "Anda harus login terlebih dahulu" },
      { status: 401 }
    );
  }

  const docs = await db
    .select({
      id: cvDocuments.id,
      jobTitle: cvDocuments.jobTitle,
      templateId: cvDocuments.templateId,
      createdAt: cvDocuments.createdAt,
      updatedAt: cvDocuments.updatedAt,
    })
    .from(cvDocuments)
    .where(eq(cvDocuments.userId, session.user.id))
    .orderBy(desc(cvDocuments.createdAt));

  return NextResponse.json(docs, { status: 200 });
}
```

- [ ] **Step 3: Modify POST /api/cv-documents/create to accept templateId and make jobTitle optional**

Modify `src/app/api/cv-documents/create/route.ts`:

Changes:
1. `const { jobTitle, jobDescription, templateId } = body;`
2. Remove `if (!jobTitle?.trim() || !jobDescription?.trim())` — hanya validasi `jobDescription` saja
3. Add `templateId: templateId?.trim() || DEFAULT_TEMPLATE_ID,` to the insert values
4. Import `DEFAULT_TEMPLATE_ID` from `@/lib/templates`

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { masterProfiles, cvDocuments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_TEMPLATE_ID } from "@/lib/templates";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "AUTH_REQUIRED", message: "Anda harus login terlebih dahulu" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const { jobTitle, jobDescription, templateId } = body;

  if (!jobDescription?.trim()) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "Deskripsi pekerjaan wajib diisi" },
      { status: 400 },
    );
  }

  const [masterProfile] = await db
    .select()
    .from(masterProfiles)
    .where(eq(masterProfiles.userId, session.user.id))
    .limit(1);

  if (!masterProfile) {
    return NextResponse.json(
      { error: "PROFILE_NOT_FOUND", message: "Silakan isi profil terlebih dahulu", redirectUrl: "/profile" },
      { status: 404 },
    );
  }

  const tailoredContent = {
    personalInfo: masterProfile.personalInfo ?? null,
    workHistory: masterProfile.workHistory ?? null,
    education: masterProfile.education ?? null,
    organisations: masterProfile.organisations ?? null,
    skills: masterProfile.skills ?? null,
  };

  const [newDoc] = await db
    .insert(cvDocuments)
    .values({
      userId: session.user.id,
      masterProfileId: masterProfile.id,
      jobTitle: jobTitle?.trim() ?? null,
      jobDescription: jobDescription.trim(),
      tailoredContent,
      templateId: templateId?.trim() || DEFAULT_TEMPLATE_ID,
    })
    .returning();

  return NextResponse.json(newDoc, { status: 201 });
}
```

---

### Task 2: TemplatePicker Component

**Files:**
- Create: `src/components/TemplatePicker.tsx`

**Interfaces:**
- Consumes: `CV_TEMPLATES`, `CVTemplate` dari `@/lib/templates`
- Produces: `<TemplatePicker>` component with `onSelect(templateId, jobTitle)` callback

- [ ] **Step 1: Create TemplatePicker component**

```tsx
"use client";

import { useState } from "react";
import { CV_TEMPLATES, type CVTemplate } from "@/lib/templates";

interface TemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string, jobTitle?: string) => void;
}

export default function TemplatePicker({ isOpen, onClose, onSelect }: TemplatePickerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [step, setStep] = useState<"pick" | "form">("pick");

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setStep("form");
  };

  const handleCreate = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate, jobTitle.trim() || undefined);
    }
  };

  const handleBack = () => {
    setStep("pick");
    setSelectedTemplate(null);
  };

  const selected = CV_TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e4e1e7]">
          <div className="flex items-center gap-3">
            {step === "form" && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-[#4a4452] hover:text-[#6d3bd7] transition-colors"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
              </button>
            )}
            <h2 className="text-xl font-bold text-[#1b1b1f]">
              {step === "pick" ? "Pilih Template CV" : "Buat CV Baru"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#eae7ed] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Step: Pick Template */}
        {step === "pick" && (
          <div className="p-6">
            <p className="text-sm text-[#4a4452] mb-6">
              Pilih template CV yang sesuai dengan style kamu. Kamu bisa menggantinya nanti.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CV_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className={`group relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                    selectedTemplate === template.id
                      ? "border-[#6d3bd7] bg-[#ebdcff]/20"
                      : "border-[#e4e1e7] hover:border-[#6d3bd7]/50"
                  }`}
                >
                  {/* Template Preview Thumbnail Placeholder */}
                  <div
                    className="w-full h-32 rounded-lg mb-3 flex items-center justify-center"
                    style={{ backgroundColor: template.primaryColor + "15" }}
                  >
                    <span
                      className="text-3xl font-bold opacity-30"
                      style={{ color: template.primaryColor }}
                    >
                      CV
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#1b1b1f] mb-1">{template.name}</h3>
                  <p className="text-xs text-[#4a4452] leading-relaxed">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Form */}
        {step === "form" && selected && (
          <div className="p-6">
            {/* Selected template indicator */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#f6f2f8] mb-6">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: selected.primaryColor + "20" }}
              >
                <span className="text-lg font-bold" style={{ color: selected.primaryColor }}>
                  CV
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1b1b1f]">{selected.name}</p>
                <p className="text-xs text-[#4a4452]">{selected.description}</p>
              </div>
            </div>

            {/* Job Title Input */}
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-sm font-semibold text-[#4a4452]">
                Target Posisi <span className="text-[#7b7483] font-normal">(opsional)</span>
              </label>
              <input
                className="w-full p-3 rounded-lg border border-[#ccc3d4] bg-[#fbf8fe] text-base focus:outline-none focus:border-[#6d3bd7] focus:shadow-[0_0_0_2px_rgba(109,59,215,0.1)] transition-all"
                placeholder="Frontend Developer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
              <p className="text-xs text-[#7b7483] flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Mengisi posisi membantu AI menyesuaikan konten CV-mu dengan lebih baik
              </p>
            </div>

            {/* Action */}
            <button
              onClick={handleCreate}
              className="w-full bg-[#6d3bd7] text-white font-semibold py-3 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              Buat CV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Task 3: Dashboard Page

**Files:**
- Create: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `AppHeader` dari `@/components/AppHeader`, `AuthGuard` dari `@/components/AuthGuard`, `AppFooter` dari `@/components/AppFooter`, `TemplatePicker` dari `@/components/TemplatePicker`, `GET /api/cv-documents`
- Produces: Halaman `/dashboard` yang bisa diakses user login

- [ ] **Step 1: Create dashboard page**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import AuthGuard from "@/components/AuthGuard";
import TemplatePicker from "@/components/TemplatePicker";

interface CVItem {
  id: string;
  jobTitle: string | null;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [cvList, setCvList] = useState<CVItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  useEffect(() => {
    fetch("/api/cv-documents")
      .then((res) => res.json())
      .then((data) => {
        setCvList(Array.isArray(data) ? data : []);
      })
      .catch(() => setCvList([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreateCV = async (templateId: string, jobTitle?: string) => {
    setShowTemplatePicker(false);
    try {
      const res = await fetch("/api/cv-documents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: jobTitle || "",
          jobDescription: " ", // minimal trigger untuk create 
          templateId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        router.push(`/builder/${data.id}`);
      } else {
        if (data.error === "PROFILE_NOT_FOUND") {
          alert("Kamu belum punya profil. Arahkan ke halaman profil...");
          router.push(data.redirectUrl || "/profile");
        } else {
          alert(data.message || "Gagal membuat CV");
        }
      }
    } catch {
      alert("Gagal terhubung ke server");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus CV ini?")) return;
    try {
      const res = await fetch(`/api/cv-documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCvList((prev) => prev.filter((cv) => cv.id !== id));
      } else {
        alert("Gagal menghapus CV");
      }
    } catch {
      alert("Gagal menghapus CV");
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#fbf8fe] text-[#1b1b1f]">
        <AppHeader />

        <main className="pt-24 pb-20 px-5 md:px-10">
          <div className="max-w-[900px] mx-auto">
            {/* Welcome Section */}
            <section className="mb-10">
              <h1 className="text-[28px] font-bold mb-2">Dashboard</h1>
              <p className="text-base text-[#4a4452]">
                Kelola CV dan portofolio kamu di sini.
              </p>
            </section>

            {/* Quick Actions */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <button
                onClick={() => setShowTemplatePicker(true)}
                className="bg-white rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-[#e4e1e7]/50 hover:shadow-md hover:border-[#6d3bd7]/30 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#ebdcff] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#6d3bd7] text-2xl">edit_document</span>
                </div>
                <h3 className="font-semibold text-[#1b1b1f] mb-1">Buat CV Baru</h3>
                <p className="text-sm text-[#4a4452]">Buat CV profesional dengan template AI</p>
              </button>

              <Link
                href="/checker"
                className="bg-white rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-[#e4e1e7]/50 hover:shadow-md hover:border-[#6d3bd7]/30 transition-all text-left block group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#dfccff]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#665783] text-2xl">search</span>
                </div>
                <h3 className="font-semibold text-[#1b1b1f] mb-1">Cek CV</h3>
                <p className="text-sm text-[#4a4452]">Analisis CV dengan AI secara gratis</p>
              </Link>

              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-[#e4e1e7]/50 opacity-60 cursor-not-allowed">
                <div className="w-12 h-12 rounded-xl bg-[#f6f2f8] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[#6d3bd7] text-2xl">public</span>
                </div>
                <h3 className="font-semibold text-[#1b1b1f] mb-1">Web Portfolio</h3>
                <p className="text-sm text-[#4a4452]">Segera hadir</p>
              </div>
            </section>

            {/* CV History */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1b1b1f]">Riwayat CV</h2>
                <button
                  onClick={() => setShowTemplatePicker(true)}
                  className="text-sm font-semibold text-[#6d3bd7] hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Buat Baru
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin h-8 w-8 border-4 border-[#6d3bd7] border-t-transparent rounded-full" />
                </div>
              ) : cvList.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-dashed border-[#ccc3d4] text-center">
                  <div className="w-16 h-16 rounded-full bg-[#ebdcff] flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-[#6d3bd7] text-3xl">description</span>
                  </div>
                  <h3 className="font-semibold text-[#1b1b1f] mb-2">Belum Ada CV</h3>
                  <p className="text-sm text-[#4a4452] mb-6">
                    Buat CV pertamamu dengan template profesional berbasis AI.
                  </p>
                  <button
                    onClick={() => setShowTemplatePicker(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#6d3bd7] text-white font-semibold rounded-lg hover:opacity-90 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Buat CV Pertama
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cvList.map((cv) => (
                    <div
                      key={cv.id}
                      className="bg-white rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-[#e4e1e7]/50 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#1b1b1f] truncate">
                          {cv.jobTitle || "CV tanpa judul"}
                        </h3>
                        <p className="text-xs text-[#4a4452] mt-0.5">
                          Template: {cv.templateId} · Dibuat: {new Date(cv.createdAt).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => router.push(`/builder/${cv.id}`)}
                          className="px-4 py-2 rounded-lg bg-[#6d3bd7]/10 text-[#6d3bd7] text-sm font-semibold hover:bg-[#6d3bd7]/20 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cv.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>

        <AppFooter bordered />

        <TemplatePicker
          isOpen={showTemplatePicker}
          onClose={() => setShowTemplatePicker(false)}
          onSelect={handleCreateCV}
        />
      </div>
    </AuthGuard>
  );
}
```

- [ ] **Step 2: Add DELETE endpoint reference**

Note: The delete button uses `DELETE /api/cv-documents/[id]` which already exists in `src/app/api/cv-documents/[id]/route.ts` (the `DELETE` method is already exported there). No changes needed.

---

### Task 4: Simplify Builder New Page

**Files:**
- Modify: `src/app/builder/new/page.tsx`

**Interfaces:**
- Consumes: `searchParams.templateId` dari URL
- Produces: Halaman builder/new yang lebih sederhana, langsung redirect atau form minimal

- [ ] **Step 1: Simplify builder/new page**

Ubah `src/app/builder/new/page.tsx` untuk menerima `templateId` dari search params dan menyederhanakan flow. Halaman ini sekarang bisa diakses:
1. Dari dashboard dengan templateId — langsung auto-create CV dengan jobTitle opsional
2. Dari link langsung — tampilkan form job description saja

```tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AuthGuard from "@/components/AuthGuard";

export default function BuilderNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Auto-create if templateId is provided (coming from dashboard)
  useEffect(() => {
    if (templateId) {
      handleCreate();
    }
  }, [templateId]);

  const handleCreate = async () => {
    if (isLoading) return;

    if (!jobDescription.trim()) {
      setErrorMessage("Silakan isi deskripsi pekerjaan terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/cv-documents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: jobTitle.trim() || undefined,
          jobDescription: jobDescription.trim(),
          templateId: templateId || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/builder/${data.id}`);
      } else {
        if (data.error === "PROFILE_NOT_FOUND") {
          setErrorMessage("Kamu belum punya profil. Mengarahkan ke halaman profil...");
          setTimeout(() => router.push(data.redirectUrl || "/profile"), 1500);
        } else {
          setErrorMessage(data.message || "Terjadi kesalahan");
        }
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("Gagal terhubung ke server. Periksa koneksi Anda.");
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#fbf8fe] text-[#1b1b1f]">
        <AppHeader />

        <main className="flex justify-center pt-20 pb-16 px-5">
          <div className="w-full max-w-[600px] flex flex-col gap-6">
            <div className="text-center space-y-4">
              <h1 className="text-[32px] leading-10 font-bold text-[#1b1b1f]">
                Buat CV Baru
              </h1>
              <p className="text-base leading-6 text-[#4a4452] max-w-[500px] mx-auto">
                Paste deskripsi pekerjaan yang kamu lamar. CV akan disesuaikan secara otomatis.
              </p>
            </div>

            <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-6 md:p-10 flex flex-col gap-6 border border-[#e4e1e7]/50">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#4a4452]">
                  Target Posisi <span className="text-[#7b7483] font-normal">(opsional)</span>
                </label>
                <input
                  className="w-full p-3 rounded-lg border border-[#ccc3d4] bg-[#fbf8fe] text-base focus:outline-none focus:border-[#6d3bd7] focus:shadow-[0_0_0_2px_rgba(109,59,215,0.1)] transition-all"
                  placeholder="Frontend Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
                <p className="text-xs text-[#7b7483] flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Mengisi posisi membantu AI menyesuaikan konten CV-mu
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#4a4452]">
                  Deskripsi Pekerjaan
                </label>
                <textarea
                  className="w-full p-3 rounded-lg border border-[#ccc3d4] bg-[#fbf8fe] text-base resize-none focus:outline-none focus:border-[#6d3bd7] focus:shadow-[0_0_0_2px_rgba(109,59,215,0.1)] transition-all"
                  placeholder="Tempel deskripsi lowongan pekerjaan di sini..."
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 p-4 rounded-lg bg-red-100/30 border border-red-200">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-lg select-none shrink-0">error</span>
                  <p className="text-sm text-[#93000a]">{errorMessage}</p>
                </div>
              )}

              <button
                className="w-full bg-[#6d3bd7] text-white font-bold py-4 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                onClick={handleCreate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Membuat CV...
                  </>
                ) : (
                  "Mulai Buat CV"
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - ✅ Halaman `/dashboard` sebagai central hub — Task 3
   - ✅ Flow "Buat CV Baru": Dashboard → Pilih Template → Isi Posisi (opsional) → Builder — Task 2 + Task 3
   - ✅ Template selection sheet — Task 2
   - ✅ `GET /api/cv-documents` endpoint — Task 1
   - ✅ Template data — Task 1
   - ✅ jobTitle dibuat opsional — Task 1 Step 3
   - ✅ Note opsional "membantu AI menyesuaikan" — Task 2
   - ✅ Quick actions: Cek CV, Buat CV Baru, Portfolio Web — Task 3
   - ✅ Riwayat CV dengan Edit/Hapus — Task 3
   - ✅ Empty state — Task 3
   - ✅ AuthGuard di dashboard — Task 3

2. **Placeholder scan:** No TBD, TODO, or vague requirements.

3. **Type consistency:** 
   - `DEFAULT_TEMPLATE_ID` from templates.ts used in create route — ✅
   - `CVTemplate` interface matches usage — ✅
   - `GET /api/cv-documents` returns `{ id, jobTitle, templateId, createdAt, updatedAt }[]` — ✅
