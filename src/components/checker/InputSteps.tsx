"use client";

import { useTranslation } from "@/lib/i18n";

/** Nomor langkah di form input. */
export function StepNumber({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-lime font-display text-sm font-bold text-on-light"
    >
      {n}
    </span>
  );
}

export type AnalyzePhase = "read" | "extract" | "analyze";

const PHASES: { key: AnalyzePhase; label: string }[] = [
  { key: "read", label: "checker.progress.read" },
  { key: "extract", label: "checker.progress.extract" },
  { key: "analyze", label: "checker.progress.analyze" },
];

/**
 * Tiga tahap proses (Baca file → Ekstrak teks → Analisis). Tahap diambil dari
 * state halaman, bukan timer, jadi tidak ada persentase karangan.
 */
export function AnalyzeProgress({ phase, note }: { phase: AnalyzePhase; note?: string }) {
  const { t } = useTranslation();
  const current = PHASES.findIndex((p) => p.key === phase);

  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <ol className="flex items-start gap-2">
        {PHASES.map((p, i) => {
          const state = i < current ? "done" : i === current ? "active" : "todo";
          return (
            <li key={p.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  state === "done"
                    ? "border-ink bg-lime text-on-light"
                    : state === "active"
                      ? "border-ink bg-paper text-ink"
                      : "border-ink/20 bg-paper text-ink-soft"
                }`}
              >
                {state === "done" ? (
                  <span className="material-symbols-outlined select-none text-base" aria-hidden="true">check</span>
                ) : state === "active" ? (
                  <span className="material-symbols-outlined animate-spin select-none text-base" aria-hidden="true">progress_activity</span>
                ) : (
                  i + 1
                )}
              </span>
              <span className={`text-xs leading-tight ${state === "todo" ? "text-ink-soft" : "font-bold text-ink"}`}>
                {t(p.label)}
                <span className="sr-only">
                  {" "}
                  ({t(state === "done" ? "checker.progress.state-done" : state === "active" ? "checker.progress.state-active" : "checker.progress.state-todo")})
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      {note && <p className="text-center text-sm text-ink-soft">{note}</p>}
    </div>
  );
}
