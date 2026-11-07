"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/nav/SiteHeader";
import AppFooter from "@/components/AppFooter";
import { useTranslation } from "@/lib/i18n";
import { extractPdfTextClient } from "@/lib/pdf-extract-client";
import { anonIdHeaders } from "@/lib/anon-id";
import { StepNumber } from "@/components/checker/InputSteps";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface HistoryItem {
  id: string;
  branding: string;
  overallScore: number;
  grade: string;
  verdict: string | null;
  createdAt: string;
}

function scoreTone(score: number): string {
  if (score >= 75) return "bg-green-50 border-green-300 text-green-700";
  if (score >= 45) return "bg-amber-50 border-amber-300 text-amber-700";
  return "bg-red-50 border-red-300 text-red-700";
}

/**
 * Halaman masuk fitur. Dua input sudah cukup: arah branding dan resume.
 *
 * Resume dibaca di browser, jadi PDF beberapa MB tidak perlu diunggah dan
 * tidak tersangkut batas body serverless. Kolom tempel disediakan untuk PDF
 * hasil scan yang tidak punya lapisan teks.
 */
export default function LinkedInOptimizerPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();

  const [branding, setBranding] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pasted, setPasted] = useState("");
  // Sumber resume: satu tab aktif, jadi tidak ada lagi "teks menimpa PDF" diam-diam.
  const [source, setSource] = useState<"upload" | "paste">("upload");
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState<"idle" | "reading" | "submitting">("idle");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = stage !== "idle";

  /* Riwayat hanya untuk pengguna login; tamu mendapat 401 dan daftar disembunyikan. */
  useEffect(() => {
    fetch("/api/linkedin-optimizer/history")
      .then(async (res) => (res.ok ? res.json() : []))
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  const pickFile = useCallback((next: File | null) => {
    setError("");
    if (!next) {
      setFile(null);
      return;
    }
    const isPdf = next.type === "application/pdf" || next.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError(t("lo.form.file-type"));
      return;
    }
    if (next.size > MAX_FILE_BYTES) {
      setError(t("lo.form.file-too-big"));
      return;
    }
    setFile(next);
  }, [t]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (busy) return;
      setError("");

      if (!branding.trim()) {
        setError(t("lo.form.branding-required"));
        return;
      }

      let resumeText = source === "paste" ? pasted.trim() : "";

      if (source === "paste" && !resumeText) {
        setError(t("lo.form.resume-required"));
        return;
      }

      if (source === "upload") {
        if (!file) {
          setError(t("lo.form.resume-required"));
          return;
        }
        setStage("reading");
        try {
          resumeText = (await extractPdfTextClient(file)).trim();
        } catch {
          setStage("idle");
          setError(t("lo.form.error"));
          return;
        }
        if (resumeText.length < 50) {
          setStage("idle");
          setError(t("lo.form.pdf-empty"));
          return;
        }
      }

      setStage("submitting");
      try {
        const res = await fetch("/api/linkedin-optimizer/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...anonIdHeaders() },
          body: JSON.stringify({ resumeText, branding: branding.trim(), lang }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.id) {
          setStage("idle");
          setError(
            typeof data.message === "string" && data.message
              ? data.message
              : t("lo.form.error"),
          );
          return;
        }

        router.push(`/linkedin-optimizer/${data.id}`);
      } catch {
        setStage("idle");
        setError(t("lo.form.error"));
      }
    },
    [branding, busy, file, lang, pasted, router, source, t],
  );

  return (
    <div className="flex min-h-screen flex-col bg-desk text-ink">
      <SiteHeader variant="pill" />

      <main className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20 pt-24 md:px-6 md:pt-28">
        <p className="kicker">{t("lo.kicker")}</p>
        <h1 className="max-w-[22ch] font-display text-headline-lg font-bold text-ink">
          {t("lo.title")}
        </h1>
        <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-ink-soft">
          {t("lo.subtitle")}
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-[20px] border-[2.5px] border-ink bg-paper p-5 shadow-hard md:p-7"
        >
          {/* Arah branding */}
          <div>
            <label htmlFor="lo-branding" className="flex items-center gap-2 text-sm font-extrabold text-ink">
              <StepNumber n={1} />
              {t("lo.form.branding-label")}
            </label>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              {t("lo.form.branding-hint")}
            </p>
            <input
              id="lo-branding"
              value={branding}
              onChange={(event) => setBranding(event.target.value)}
              maxLength={300}
              placeholder={t("lo.form.branding-placeholder")}
              className="mt-2.5 w-full rounded-xl border-2 border-edge/60 bg-paper px-3.5 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-soft/70 focus:border-green-deep"
            />
          </div>

          {/* Resume: tab Unggah PDF | Tempel teks */}
          <fieldset className="min-w-0">
            <legend className="flex items-center gap-2 text-sm font-extrabold text-ink">
              <StepNumber n={2} />
              {t("lo.form.resume-step")}
            </legend>
            <div role="tablist" aria-label={t("lo.form.resume-step")} className="mt-2.5 inline-flex w-full rounded-full border-2 border-edge/60 bg-surface-container-low/40 p-1 sm:w-auto">
              {(["upload", "paste"] as const).map((mode) => (
                <button
                  key={mode}
                  id={`lo-tab-${mode}`}
                  type="button"
                  role="tab"
                  aria-selected={source === mode}
                  aria-controls={`lo-panel-${mode}`}
                  tabIndex={source === mode ? 0 : -1}
                  onClick={() => setSource(mode)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                      event.preventDefault();
                      const next = mode === "upload" ? "paste" : "upload";
                      setSource(next);
                      document.getElementById(`lo-tab-${next}`)?.focus();
                    }
                  }}
                  className={`min-h-[40px] flex-1 rounded-full px-4 text-sm font-bold transition-colors sm:flex-none ${
                    source === mode ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {t(mode === "upload" ? "lo.form.tab-upload" : "lo.form.tab-paste")}
                </button>
              ))}
            </div>

            {source === "upload" ? (
              <div id="lo-panel-upload" role="tabpanel" aria-labelledby="lo-tab-upload" className="mt-3">
                <p className="text-xs text-ink-soft">{t("lo.form.file-hint")}</p>
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragActive(false);
                    pickFile(event.dataTransfer.files?.[0] ?? null);
                  }}
                  className={`mt-2.5 rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
                    dragActive ? "border-green-deep bg-lime/10" : "border-edge/50 bg-surface-container-low/40"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="sr-only"
                    onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
                  />
                  {file ? (
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      <span className="material-symbols-outlined select-none text-[20px] text-green-deep" aria-hidden="true">
                        description
                      </span>
                      <span className="max-w-full truncate text-sm font-semibold text-ink">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="rounded-full border border-ink/20 px-2 py-0.5 text-xs font-bold text-ink transition-colors hover:border-ink hover:bg-surface-container-low"
                      >
                        {t("lo.form.remove", "Ganti file")}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex flex-col items-center gap-1.5 text-sm font-semibold text-ink"
                    >
                      <span className="material-symbols-outlined select-none text-[26px] text-ink-soft" aria-hidden="true">
                        upload_file
                      </span>
                      {t("lo.form.drop")}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div id="lo-panel-paste" role="tabpanel" aria-labelledby="lo-tab-paste" className="mt-3">
                <label htmlFor="lo-paste" className="block text-xs text-ink-soft">
                  {t("lo.form.paste-hint")}
                </label>
                <textarea
                  id="lo-paste"
                  value={pasted}
                  onChange={(event) => setPasted(event.target.value)}
                  rows={8}
                  placeholder={t("lo.form.paste-placeholder")}
                  className="mt-2 w-full resize-y rounded-xl border-2 border-edge/60 bg-paper px-3.5 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-soft/70 focus:border-green-deep"
                />
              </div>
            )}
          </fieldset>

          {error ? (
            <p role="alert" className="rounded-xl border-[1.5px] border-error/50 bg-error-container px-3.5 py-2.5 text-sm font-semibold text-on-error-container">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border-[2.5px] border-on-light bg-lime px-6 text-sm font-extrabold text-on-light shadow-[0_3px_0_rgb(var(--c-print))] transition-transform active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {stage === "reading"
                ? t("lo.form.reading")
                : stage === "submitting"
                  ? t("lo.form.submitting")
                  : t("lo.form.submit")}
            </button>
            <p className="text-xs text-ink-soft">{t("lo.guest-note")}</p>
          </div>
        </form>

        {/* Riwayat */}
        {historyLoading ? (
          <section className="mt-12">
            <h2 className="font-display text-[20px] font-bold text-ink">{t("lo.history.title")}</h2>
            <p className="mt-2 text-sm text-ink-soft">{t("lo.history.loading")}</p>
          </section>
        ) : history.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-[20px] font-bold text-ink">{t("lo.history.title")}</h2>
            <ul className="mt-3 space-y-2">
              {history.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/linkedin-optimizer/${item.id}`}
                    className="flex items-center gap-4 rounded-[14px] border-2 border-ink/80 bg-paper p-3.5 shadow-hard-ink-sm transition-transform hover:-translate-y-0.5"
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold ${scoreTone(item.overallScore)}`}
                    >
                      {item.overallScore}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {item.branding}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-soft">
                        {item.verdict || t("lo.result.grade", "Grade") + " " + item.grade}
                      </span>
                    </span>
                    <span className="material-symbols-outlined shrink-0 select-none text-ink-soft" aria-hidden="true">
                      chevron_right
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      <AppFooter />
    </div>
  );
}
