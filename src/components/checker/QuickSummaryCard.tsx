"use client";

import { motion } from "motion/react";
import { CopyButton } from "./CopyButton";
import { SectionKicker } from "./ResultComponents";
import { buildChangePack } from "@/lib/checker/copy";
import { useTranslation } from "@/lib/i18n";
import { scrollToSection } from "@/components/ui/SectionNav";
import {
  gradeColor,
  type QuickFix,
  type QuickSummary,
  type StoredAnalysisResult,
} from "./types";

/**
 * Anchor stabil tiap section hasil, dipakai tombol "Lihat" di kartu ringkasan.
 * Wajib sama persis dengan id wrapper section di `/checker` dan `/checker/[id]`.
 */
export const SECTION_ANCHORS: Record<QuickFix["target_section"], string> = {
  hr: "section-hr",
  skor: "section-skor",
  keyword: "section-keyword",
  checklist: "section-checklist",
};

const IMPACT_CHIP: Record<QuickFix["impact"], string> = {
  Tinggi: "border-error/50 bg-error-container text-on-error-container",
  Sedang: "border-tertiary/50 bg-tertiary-container text-on-tertiary-container",
  Rendah: "border-green-deep/40 bg-primary-fixed text-on-primary-fixed",
};

interface QuickSummaryCardProps {
  /** Dipakai untuk badge grade dan menghitung "Salin semua perubahan". */
  analysis: StoredAnalysisResult;
  /** Hasil mapper `toQuickSummary` — sudah bersih dari fix invalid dan dibatasi. */
  summary: QuickSummary;
  /** Indeks top_fixes yang sudah tampil di kartu "Mulai dari sini". Bila
   *  diisi, perbaikan itu tidak diulang; sisanya dilipat sebagai
   *  "Perbaikan lain (N)". Tanpa prop ini daftar tampil penuh seperti dulu. */
  hideFixIndexes?: number[];
}

/**
 * Kartu "Ringkasan 10 detik": verdict, 3 kekuatan, dan maksimal 5 perbaikan
 * prioritas lintas section di paling atas halaman hasil. Tanpa angka poin per
 * fix — hanya level dampak dan estimasi menit, sesuai data dari mapper.
 */
export function QuickSummaryCard({ analysis, summary, hideFixIndexes }: QuickSummaryCardProps) {
  const gc = gradeColor(analysis.grade);
  const changePack = buildChangePack(analysis);
  const { t } = useTranslation();
  const hidden = new Set(hideFixIndexes ?? []);
  const fixes = summary.top_fixes.map((fix, i) => ({ fix, i })).filter(({ i }) => !hidden.has(i));

  return (
    <motion.section
      aria-label={t("checker.nav.summary")}
      className="space-y-4 rounded-[18px] border-[2.5px] border-ink bg-paper p-6 shadow-hard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <SectionKicker>{t("checker.kicker-summary")}</SectionKicker>

      {/* ── Header: judul + grade badge yang sudah ada ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-headline-md font-bold text-ink">
          <span className="material-symbols-outlined select-none text-tertiary" aria-hidden="true">
            bolt
          </span>
          {t("checker.nav.summary")}
        </h2>
        {analysis.grade && (
          <span
            className={`inline-flex items-center rounded-full border-[1.5px] px-3 py-1 font-display text-sm font-bold ${gc.bg} ${gc.text} ${gc.border}`}
          >
            Grade {analysis.grade}
          </span>
        )}
      </div>

      {summary.verdict && <p className="text-sm leading-relaxed text-ink">{summary.verdict}</p>}

      {/* ── Kekuatan utama (maksimal 3, sudah dibatasi mapper) ── */}
      {summary.top_strengths.length > 0 && (
        <ul aria-label={t("qs.strengths")} className="space-y-1">
          {summary.top_strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-ink">
              <span
                className="material-symbols-outlined mt-0.5 select-none text-base text-green-deep"
                aria-hidden="true"
              >
                check_circle
              </span>
              {s}
            </li>
          ))}
        </ul>
      )}

      {/* ── Daftar perbaikan prioritas ── */}
      {fixes.length > 0 && !hideFixIndexes && (
        <ul aria-label={t("qs.priority")} className="space-y-2">
          {fixes.map(({ fix, i }) => (
            <li
              key={fix.id || i}
              className="flex flex-col items-stretch gap-2 rounded-xl border-[1.5px] border-ink/15 bg-surface-container-low px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3"
            >
              {/* Di mobile judul dapat baris penuh; tanpa ini (flex-1 di baris
                  yang sama dengan badge + dua tombol) judulnya pecah satu kata
                  per baris di lebar 390px. */}
              <span className="text-sm font-semibold leading-snug text-ink sm:min-w-0 sm:flex-1">
                {fix.title}
              </span>
              <span
                className={`shrink-0 rounded-full border-[1.5px] px-2 py-0.5 text-xs font-extrabold uppercase tracking-[0.05em] ${IMPACT_CHIP[fix.impact]}`}
              >
                {fix.impact}
              </span>
              {typeof fix.est_minutes === "number" && (
                <span className="shrink-0 text-xs font-semibold text-ink-soft">
                  ±{fix.est_minutes} menit
                </span>
              )}
              <button
                type="button"
                onClick={() => scrollToSection(SECTION_ANCHORS[fix.target_section])}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border-[1.5px] border-ink px-3 py-1 text-xs font-bold text-ink transition-all hover:bg-surface-container active:scale-95"
              >
                {t("qs.view")}
                <span className="material-symbols-outlined select-none text-[13px]" aria-hidden="true">
                  arrow_forward
                </span>
              </button>
              {fix.copy_text && <CopyButton text={fix.copy_text} label={t("checker.start.copy")} />}
            </li>
          ))}
        </ul>
      )}
      {/* Perbaikan yang tidak masuk "Mulai dari sini": tetap bisa dibuka. */}
      {fixes.length > 0 && hideFixIndexes && (
        <details className="group rounded-xl border-[1.5px] border-ink/15">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
            {t("checker.quick.other-fixes").replace("{n}", String(fixes.length))}
            <span className="material-symbols-outlined select-none text-base transition-transform group-open:rotate-180" aria-hidden="true">expand_more</span>
          </summary>
          <div className="px-3 pb-3">
            <ul aria-label={t("qs.priority")} className="space-y-2">
              {fixes.map(({ fix, i }) => (
                <li
                  key={fix.id || i}
                  className="flex flex-col items-stretch gap-2 rounded-xl border-[1.5px] border-ink/15 bg-surface-container-low px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3"
                >
                  {/* Di mobile judul dapat baris penuh; tanpa ini (flex-1 di baris
                      yang sama dengan badge + dua tombol) judulnya pecah satu kata
                      per baris di lebar 390px. */}
                  <span className="text-sm font-semibold leading-snug text-ink sm:min-w-0 sm:flex-1">
                    {fix.title}
                  </span>
                  <span
                    className={`shrink-0 rounded-full border-[1.5px] px-2 py-0.5 text-xs font-extrabold uppercase tracking-[0.05em] ${IMPACT_CHIP[fix.impact]}`}
                  >
                    {fix.impact}
                  </span>
                  {typeof fix.est_minutes === "number" && (
                    <span className="shrink-0 text-xs font-semibold text-ink-soft">
                      ±{fix.est_minutes} menit
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => scrollToSection(SECTION_ANCHORS[fix.target_section])}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border-[1.5px] border-ink px-3 py-1 text-xs font-bold text-ink transition-all hover:bg-surface-container active:scale-95"
                  >
                    {t("qs.view")}
                    <span className="material-symbols-outlined select-none text-[13px]" aria-hidden="true">
                      arrow_forward
                    </span>
                  </button>
                  {fix.copy_text && <CopyButton text={fix.copy_text} label={t("checker.start.copy")} />}
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}

      {/* ── Salin semua perubahan; nonaktif kalau tidak ada yang bisa disalin ── */}
      <div className="flex flex-wrap items-center gap-3 border-t-[1.5px] border-ink/10 pt-4">
        {changePack ? (
          <CopyButton text={changePack} label={t("qs.copy-all")} />
        ) : (
          <>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-1 rounded-full border-[1.5px] border-ink/20 px-3 py-1.5 text-xs font-bold text-ink-soft opacity-60"
            >
              <span className="material-symbols-outlined select-none text-sm" aria-hidden="true">
                content_copy
              </span>
              {t("qs.copy-all")}
            </button>
            <p className="text-xs font-semibold text-ink-soft">
              {t("qs.nothing-to-copy")}
            </p>
          </>
        )}
      </div>
    </motion.section>
  );
}
