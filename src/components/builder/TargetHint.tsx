"use client";

import { createContext, useContext } from "react";
import { useTranslation } from "@/lib/i18n";

interface TargetHintValue {
  /** Judul posisi target belum diisi. */
  missing: boolean;
  /** Pindah ke langkah Target Pekerjaan dan fokus ke judul posisi. */
  goToTarget: () => void;
}

const TargetHintContext = createContext<TargetHintValue | null>(null);

export const TargetHintProvider = TargetHintContext.Provider;

/** Di luar builder (mis. portofolio) context tidak ada: catatan tidak tampil. */
export function useTargetHint(): TargetHintValue | null {
  return useContext(TargetHintContext);
}

/** Catatan kecil di dekat tombol AI saat judul posisi target masih kosong. Tombol AI tetap bisa dipakai. */
export function TargetMissingNote({ className = "" }: { className?: string }) {
  const hint = useTargetHint();
  const { t } = useTranslation();
  if (!hint?.missing) return null;
  return (
    <p className={`text-xs text-on-surface-variant ${className}`}>
      {t("hint.target")}{" "}
      <button
        type="button"
        onClick={hint.goToTarget}
        className="inline-flex min-h-6 items-center font-semibold text-green-deep underline underline-offset-2 hover:text-primary"
      >
        {t("hint.fill-now")}
      </button>
    </p>
  );
}
