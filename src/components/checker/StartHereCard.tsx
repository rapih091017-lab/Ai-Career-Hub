"use client";

import { CopyButton } from "./CopyButton";
import { SectionKicker } from "./ResultComponents";
import { SECTION_ANCHORS } from "./QuickSummaryCard";
import { scrollToSection } from "@/components/ui/SectionNav";
import { useTranslation } from "@/lib/i18n";
import type { DoneState } from "@/lib/useDoneState";
import type { ActionPlan, QuickFix, QuickFixImpact, QuickSummary } from "./types";

/** Satu langkah di kartu "Mulai dari sini". */
export interface StartStep {
  id: string;
  title: string;
  /** Hanya ada bila sumbernya quick fix dari AI. */
  impact?: QuickFixImpact;
  est_minutes?: number;
  copy_text?: string;
  /** Anchor tujuan tombol "Lompat ke bagian". */
  anchor: string;
}

const IMPACT_RANK: Record<QuickFixImpact, number> = { Tinggi: 0, Sedang: 1, Rendah: 2 };

const IMPACT_CHIP: Record<QuickFixImpact, string> = {
  Tinggi: "border-error/50 bg-error-container text-on-error-container",
  Sedang: "border-tertiary/50 bg-tertiary-container text-on-tertiary-container",
  Rendah: "border-green-deep/40 bg-primary-fixed text-on-primary-fixed",
};

/** Prefix id centang langkah di penyimpanan bersama. */
export const START_DONE_PREFIX = "start:";

/**
 * Tiga langkah pertama: quick fix diurutkan dampak Tinggi→Sedang→Rendah lalu
 * menit paling sedikit (tanpa menit di belakang). Bila tidak ada quick fix,
 * pakai quick win dari rencana aksi tanpa level dampak atau menit.
 */
export function pickStartSteps(quickSummary?: QuickSummary | null, actionPlan?: ActionPlan | null): StartStep[] {
  const fixes = quickSummary?.top_fixes ?? [];
  if (fixes.length > 0) {
    const minutes = (f: QuickFix) => (typeof f.est_minutes === "number" ? f.est_minutes : Number.POSITIVE_INFINITY);
    return [...fixes]
      .sort((a, b) => IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact] || minutes(a) - minutes(b))
      .slice(0, 3)
      .map((f, i) => ({
        id: `fix-${f.id || i}`,
        title: f.title,
        impact: f.impact,
        est_minutes: f.est_minutes,
        copy_text: f.copy_text,
        anchor: SECTION_ANCHORS[f.target_section],
      }));
  }
  const plan = [...(actionPlan?.quick_wins ?? []), ...(actionPlan?.short_term ?? [])].filter((s) => s.trim());
  return plan.slice(0, 3).map((text, i) => ({ id: `plan-${i}`, title: text.trim(), anchor: SECTION_ANCHORS.checklist }));
}

interface StartHereCardProps {
  steps: StartStep[];
  done: DoneState;
}

export function StartHereCard({ steps, done }: StartHereCardProps) {
  const { t } = useTranslation();
  if (steps.length === 0) return null;

  const ids = steps.map((s) => START_DONE_PREFIX + s.id);
  const doneCount = done.countDone(ids);

  return (
    <section
      id="section-mulai"
      aria-labelledby="start-here-title"
      className="scroll-mt-32 space-y-4 rounded-[18px] border-[2.5px] border-ink bg-lime/20 p-6 shadow-hard lg:scroll-mt-28"
    >
      <div>
        <SectionKicker>{t("checker.start.kicker")}</SectionKicker>
        <h2 id="start-here-title" className="font-display text-headline-md font-bold text-ink">
          {t("checker.start.title")}
        </h2>
        <p className="mt-1 text-xs font-semibold text-ink-soft" aria-live="polite">
          {t("checker.start.progress").replace("{done}", String(doneCount)).replace("{total}", String(steps.length))}
        </p>
      </div>

      <ol className="space-y-2">
        {steps.map((step, i) => {
          const key = START_DONE_PREFIX + step.id;
          const isDone = done.isDone(key);
          const checkId = `start-done-${step.id}`;
          return (
            <li key={step.id} className="rounded-xl border-[1.5px] border-ink/20 bg-paper p-3">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink font-display text-xs font-bold text-ink">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className={`text-sm font-semibold leading-snug ${isDone ? "text-ink-soft line-through" : "text-ink"}`}>
                    {step.title}
                  </p>
                  {(step.impact || typeof step.est_minutes === "number") && (
                    <div className="flex flex-wrap items-center gap-2">
                      {step.impact && (
                        <span className={`rounded-full border-[1.5px] px-2 py-0.5 text-xs font-extrabold uppercase tracking-[0.05em] ${IMPACT_CHIP[step.impact]}`}>
                          {t("checker.start.impact").replace("{level}", step.impact)}
                        </span>
                      )}
                      {typeof step.est_minutes === "number" && (
                        <span className="text-xs font-semibold text-ink-soft">±{step.est_minutes} {t("checker.start.minutes")}</span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollToSection(step.anchor)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-full border-[1.5px] border-ink px-3 py-1 text-xs font-bold text-ink transition-colors hover:bg-surface-container"
                    >
                      {t("checker.start.jump")}
                      <span className="material-symbols-outlined select-none text-[13px]" aria-hidden="true">arrow_downward</span>
                    </button>
                    {step.copy_text && <CopyButton text={step.copy_text} label={t("checker.start.copy")} />}
                    <label htmlFor={checkId} className="inline-flex min-h-[36px] cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
                      <input
                        id={checkId}
                        type="checkbox"
                        checked={isDone}
                        onChange={() => done.toggle(key)}
                        className="h-4 w-4 accent-[rgb(var(--c-green))]"
                      />
                      {t("checker.start.done")}
                    </label>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
