"use client";

import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n";
import { BUILDER_FROM_CHECKER_PATH, saveCheckerHandoff } from "@/lib/checker/builder-handoff";

interface FixInBuilderButtonProps {
  /** Teks CV hasil ekstraksi checker. Tanpa teks, tombol tidak dirender. */
  cvText?: string | null;
}

/**
 * Tombol utama hasil cek: buka builder dengan teks CV yang sama sebagai draf.
 * Tamu diarahkan login dulu, lalu kembali ke builder lewat ?next=.
 */
export function FixInBuilderButton({ cvText }: FixInBuilderButtonProps) {
  if (!cvText || cvText.trim().length < 20) return null;
  return <FixInBuilderAction cvText={cvText} />;
}

function FixInBuilderAction({ cvText }: { cvText: string }) {
  const { t } = useTranslation();
  const router = useRouter();

  // Status login dibaca saat klik (getSession), bukan useSession, supaya
  // komponen tidak butuh SessionProvider di setiap halaman hasil.
  const go = async () => {
    saveCheckerHandoff(cvText, window.location.href);
    const session = await getSession().catch(() => null);
    router.push(
      session?.user
        ? BUILDER_FROM_CHECKER_PATH
        : `/login?next=${encodeURIComponent(BUILDER_FROM_CHECKER_PATH)}`,
    );
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border-[1.5px] border-ink/20 bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-snug text-ink-soft">
        {t("checker.fix-builder.desc")}
      </p>
      <button
        type="button"
        onClick={go}
        className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-lime px-6 font-display text-sm font-bold text-on-light shadow-[0_3px_0_rgb(var(--c-ink))] transition-all hover:-translate-y-0.5 active:translate-y-0.5"
      >
        {t("checker.fix-builder.cta")}
        <span aria-hidden="true" className="material-symbols-outlined select-none text-[18px]">arrow_forward</span>
      </button>
    </div>
  );
}
