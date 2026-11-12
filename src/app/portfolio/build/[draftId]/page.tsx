"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { usePortfolioDraft } from "@/lib/portfolio/usePortfolioDraft";
import PortfolioSkeleton from "@/components/portfolio/PortfolioSkeleton";
import BuilderEditor from "@/components/portfolio/builder/BuilderEditor";
import { useTranslation } from "@/lib/i18n";

export default function BuilderPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = use(params);
  const router = useRouter();
  const { t } = useTranslation();
  const draft = usePortfolioDraft(draftId);

  // AuthGuard membungkus semua cabang: status login dicek dulu, baru
  // skeleton atau "tidak ditemukan" (tamu tidak melihat isi halaman draft).
  return <AuthGuard>{body()}</AuthGuard>;

  function body() {
    if (draft.loading) return <PortfolioSkeleton message={t("pf.draft-loading")} />;

    if (!draft.data) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background">
          <span className="material-symbols-outlined text-6xl text-outline" aria-hidden="true">
            description
          </span>
          <p className="text-sm text-on-surface-variant">{t("pf.draft-missing")}</p>
          <button
            type="button"
            onClick={() => router.replace("/portfolio/build")}
            className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary"
          >
            {t("pf.draft-new")}
          </button>
        </div>
      );
    }

    return <BuilderEditor draft={draft} />;
  }
}
