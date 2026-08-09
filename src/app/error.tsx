"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "Terjadi Kesalahan | AI Career Hub";
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#fbf8fe]">
      <div className="text-center space-y-6 max-w-md px-5">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl text-red-500">error</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1b1b1f]">{t("error.title")}</h1>
        <p className="text-sm text-[#4a4452]">{error.message || t("error.subtitle")}</p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-full bg-[#0d7377] text-white font-semibold hover:opacity-90 transition-all active:scale-95"
        >
          {t("error.retry")}
        </button>
      </div>
    </div>
  );
}
