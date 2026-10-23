"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SiteHeader from "@/components/nav/SiteHeader";
import AppFooter from "@/components/AppFooter";
import { LinkedInResultView } from "@/components/linkedin/LinkedInResultView";
import { useTranslation } from "@/lib/i18n";
import { anonIdHeaders } from "@/lib/anon-id";
import { buildLinkedInResult, type LinkedInResult } from "@/lib/linkedin-optimizer/result";

/**
 * Halaman hasil memuat baris tersimpan, bukan memanggil model lagi.
 * Header anonim ikut dikirim supaya tamu bisa membuka hasilnya sendiri tanpa
 * membuat akun; pemiliknya diperiksa di route API.
 */
export default function LinkedInOptimizerResultPage() {
  const params = useParams();
  const { t, lang } = useTranslation();
  const id = params?.id as string;

  const [result, setResult] = useState<LinkedInResult | null>(null);
  const [branding, setBranding] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/linkedin-optimizer/history/${id}`, { headers: anonIdHeaders() })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(t("lo.result.not-found"));
        return data;
      })
      .then((data) => {
        const built = buildLinkedInResult(data.fullResult);
        if (!built) throw new Error(t("lo.result.not-found"));
        setResult(built);
        setBranding(typeof data.branding === "string" ? data.branding : "");
        setCreatedAt(typeof data.createdAt === "string" ? data.createdAt : null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("lo.result.not-found")))
      .finally(() => setLoading(false));
  }, [id, t]);

  return (
    <div className="flex min-h-screen flex-col bg-desk text-ink">
      <SiteHeader variant="pill" />

      <main className="mx-auto w-full max-w-[820px] flex-1 px-5 pb-20 pt-24 md:px-6 md:pt-28">
        <Link
          href="/linkedin-optimizer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-soft transition-colors hover:text-ink"
        >
          <span className="material-symbols-outlined select-none text-[16px]" aria-hidden="true">
            arrow_back
          </span>
          {t("lo.result.back")}
        </Link>

        {loading ? (
          <div className="mt-8 animate-pulse space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-52 w-52 rounded-full bg-surface-container-high" />
              <div className="h-6 w-24 rounded-full bg-surface-container-high" />
            </div>
            <div className="h-24 rounded-[18px] bg-surface-container-high" />
            <div className="h-24 rounded-[18px] bg-surface-container-high" />
            <p className="text-center text-sm text-ink-soft">{t("lo.result.loading")}</p>
          </div>
        ) : error ? (
          <div className="mt-10 rounded-[18px] border-[2.5px] border-ink bg-paper p-6 text-center shadow-hard-sm">
            <p className="text-sm font-semibold text-ink">{error}</p>
            <Link
              href="/linkedin-optimizer"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-full border-[2.5px] border-on-light bg-lime px-5 text-sm font-extrabold text-on-light"
            >
              {t("lo.result.back")}
            </Link>
          </div>
        ) : result ? (
          <div className="mt-8">
            <p className="kicker">{t("lo.kicker")}</p>
            <h1 className="max-w-[24ch] font-display text-headline-lg font-bold text-ink">
              {t("lo.result.title", "Profil LinkedIn versi upgrade")}
            </h1>
            {createdAt ? (
              <p className="mt-2 text-xs text-ink-soft">
                {new Date(createdAt).toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : null}

            <div className="mt-10">
              <LinkedInResultView result={result} branding={branding} />
            </div>
          </div>
        ) : null}
      </main>

      <AppFooter />
    </div>
  );
}
