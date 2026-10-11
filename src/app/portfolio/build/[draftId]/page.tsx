"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { usePortfolioDraft } from "@/lib/portfolio/usePortfolioDraft";
import PortfolioSkeleton from "@/components/portfolio/PortfolioSkeleton";
import BuilderEditor from "@/components/portfolio/builder/BuilderEditor";

export default function BuilderPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = use(params);
  const router = useRouter();
  const draft = usePortfolioDraft(draftId);

  if (draft.loading) return <PortfolioSkeleton message="Memuat draft" />;

  if (!draft.data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background">
        <span className="material-symbols-outlined text-6xl text-outline" aria-hidden="true">
          description
        </span>
        <p className="text-sm text-on-surface-variant">Draft tidak ditemukan.</p>
        <button
          type="button"
          onClick={() => router.replace("/portfolio/build")}
          className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary"
        >
          Mulai draft baru
        </button>
      </div>
    );
  }

  return (
    <AuthGuard>
      <BuilderEditor draft={draft} />
    </AuthGuard>
  );
}
