"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { scoreColor, sectionScoreColor, severityMeta, toIssueItems, type FormatCheck, type IssueItem } from "./types";
import { useTranslation } from "@/lib/i18n";
import { CopyButton } from "./CopyButton";
import { buildSectionChangePack, type PackSection } from "@/lib/checker/copy";
import type { StoredAnalysisResult } from "./types";

/**
 * Caption bobot dari `weightsApplied`. Skema menyimpan bobot 0–1 (WeightField);
 * baris lama bisa berisi persen utuh (20, 35), jadi nilai >1 dianggap sudah
 * persen — bukan menebak. Tanpa bobot (hilang/nol/NaN): TIDAK MERENDER apa pun,
 * karena "Bobot skor 0%" adalah klaim palsu.
 */
function weightCaption(weight?: number): string | null {
  if (typeof weight !== "number" || !Number.isFinite(weight) || weight <= 0) return null;
  const pct = weight <= 1 ? Math.round(weight * 100) : Math.round(weight);
  return `Bobot skor ${pct}%`;
}

/** Ikon + label teks supaya status cek tetap terbaca tanpa membedakan warna. */
const CHECK_META: Record<FormatCheck["status"], { icon: string; label: string; cls: string }> = {
  ok: { icon: "check_circle", label: "OK", cls: "border-green-deep/40 bg-primary-fixed text-on-primary-fixed" },
  perlu_perbaikan: { icon: "error", label: "Perlu perbaikan", cls: "border-error/50 bg-error-container text-on-error-container" },
  tidak_dapat_dinilai: { icon: "help", label: "Tidak dapat dinilai", cls: "border-ink/20 bg-surface-container-low text-ink-soft" },
};

function CopyBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-md border-[1.5px] border-ink/15 bg-surface-container-low p-3">
      <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-green-deep">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-ink">{text}</p>
      <div className="mt-1.5">
        <CopyButton text={text} label="Salin teks" />
      </div>
    </div>
  );
}

/** Blok tambahan v5 per section; seluruhnya kondisional terhadap data. */
function SectionExtras({ sectionKey, analysis }: { sectionKey: PackSection; analysis: StoredAnalysisResult }) {
  const breakdown = analysis.breakdown;

  if (sectionKey === "summary") {
    const summary = breakdown?.summary;
    if (!summary) return null;
    return (
      <div className="space-y-2">
        {summary.has_skills_and_achievement ? (
          <span className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-green-deep/40 bg-primary-fixed px-2 py-0.5 text-xs font-bold text-on-primary-fixed">
            <span className="material-symbols-outlined select-none text-[13px]" aria-hidden="true">check</span>
            Memuat keahlian dan pencapaian
          </span>
        ) : null}
        {summary.rewrite_copy_text ? (
          <CopyBlock label="Siap salin: rewrite summary" text={summary.rewrite_copy_text} />
        ) : null}
      </div>
    );
  }

  if (sectionKey === "experience") {
    const exp = breakdown?.experience;
    if (!exp) return null;
    const { bullets_total: total, bullets_without_result: without } = exp;
    // Tampil hanya bila keduanya ada dan X ≤ Y (mapper sudah menjaga; guard
    // di UI supaya angka yang saling membantah tidak pernah sampai layar).
    const showBullets = typeof total === "number" && typeof without === "number" && without <= total;
    if (!showBullets) return null;
    return (
      <p className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-tertiary/50 bg-tertiary-container px-2.5 py-1 text-xs font-bold text-on-tertiary-container">
        <span className="material-symbols-outlined select-none text-[14px]" aria-hidden="true">format_list_bulleted</span>
        {without} dari {total} poin belum menyebut hasil
      </p>
    );
  }

  if (sectionKey === "skills") {
    const skills = breakdown?.skills;
    if (!skills) return null;
    const unproven = skills.unproven_skills ?? [];
    const missing = skills.missing_skills ?? [];
    return (
      <div className="space-y-2">
        {unproven.length > 0 ? (
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-ink-soft">
              Tercantum tapi belum terbukti di pengalaman
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {unproven.map((skill, i) => (
                <span key={i} className="rounded-full border-[1.5px] border-tertiary/50 bg-tertiary-container px-2 py-0.5 text-xs font-bold text-on-tertiary-container">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {skills.grouped_skills_copy_text ? (
          <CopyBlock label="Siap salin: baris skills terkelompok" text={skills.grouped_skills_copy_text} />
        ) : null}
        {missing.length > 0 ? (
          // Catatan statis: missing_skills TIDAK PERNAH ikut teks salin.
          <p className="text-xs italic text-ink-soft">
            Missing skills ditandai untuk referensi saja; tambahkan hanya jika benar-benar kamu kuasai.
          </p>
        ) : null}
      </div>
    );
  }

  if (sectionKey === "education") {
    const edu = breakdown?.education;
    if (!edu?.copy_text) return null;
    return <CopyBlock label="Siap salin: format blok pendidikan" text={edu.copy_text} />;
  }

  // format_ats
  const ats = breakdown?.format_ats;
  const checks = ats?.checks ?? [];
  if (checks.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-ink-soft">
        Cek format ATS
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {checks.map((check) => {
          const meta = CHECK_META[check.status];
          return (
            <li key={check.id} className="flex items-start gap-2 text-xs text-ink-soft">
              <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide ${meta.cls}`}>
                <span className="material-symbols-outlined select-none text-[12px]" aria-hidden="true">{meta.icon}</span>
                {meta.label}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-ink">{check.label}</span>
                {check.note ? <span className="block text-xs">{check.note}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Section breakdown score bar with expandable issues/suggestions */
export function SectionScoreCard({
  title,
  score,
  issues,
  suggestions,
  delay,
  statChip,
  sectionKey,
  analysis,
}: {
  title: string;
  score: number;
  issues?: unknown;
  suggestions?: string[];
  delay: number;
  /** Chip stat tambahan di samping skor (mis. persentase bullet terkuantifikasi) */
  statChip?: { label: string; value: string; hint?: string; tone?: "green" | "amber" | "red" };
  /** v5: kunci section di breakdown — aktifkan extras + salin per section. */
  sectionKey?: PackSection;
  /** v5: sumber data extras, bobot, dan pack section. */
  analysis?: StoredAnalysisResult;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const barColor = sectionScoreColor(score);
  // Normalisasi bentuk lama (string[]) & baru ({text, source_excerpt, severity}[])
  const issueItems: IssueItem[] = toIssueItems(issues);

  const sectionData = sectionKey && analysis ? analysis.breakdown?.[sectionKey] : undefined;
  const scoreReason = sectionData && "score_reason" in sectionData ? sectionData.score_reason : undefined;
  const topFix = sectionData && "top_fix" in sectionData ? sectionData.top_fix : undefined;
  const weight =
    sectionKey && analysis?.weightsApplied
      ? analysis.weightsApplied[`${sectionKey}_weight` as const]
      : undefined;
  const caption = weightCaption(weight);
  const changePack =
    sectionKey && analysis ? buildSectionChangePack(sectionKey, analysis) : "";

  return (
    <motion.div
      className="overflow-hidden rounded-[18px] border-[2.5px] border-ink bg-paper shadow-hard-sm"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-container-low"
      >
        <div className="mr-4 flex-1">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-bold text-ink">{title}</span>
            <span className="ml-2 flex shrink-0 items-center gap-2">
              {statChip && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${
                    statChip.tone === "green"
                      ? "border-green-deep/40 bg-primary-fixed text-on-primary-fixed"
                      : statChip.tone === "red"
                        ? "border-error/50 bg-error-container text-on-error-container"
                        : "border-tertiary/50 bg-tertiary-container text-on-tertiary-container"
                  }`}
                  title={statChip.hint}
                >
                  <span className="material-symbols-outlined text-[12px] select-none" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
                  {statChip.value}
                </span>
              )}
              <span className="font-display text-base font-bold" style={{ color: scoreColor(score) }}>
                {score}%
              </span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: "0%" }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
            />
          </div>
        </div>
        <span className="material-symbols-outlined select-none text-ink-soft transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          expand_more
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t-[1.5px] border-hairline px-4 pb-4 pt-3">
              {/* v5: alasan skor didahulukan — pembaca bertanya "kenapa" sebelum melihat daftar. */}
              {scoreReason && (
                <p className="text-xs leading-relaxed text-ink">
                  <span className="font-bold">Kenapa skor ini: </span>
                  {scoreReason}
                </p>
              )}
              {caption && <p className="text-xs text-ink-soft">{caption}</p>}

              {sectionKey && analysis ? <SectionExtras sectionKey={sectionKey} analysis={analysis} /> : null}

              {topFix && (
                <div className="rounded-md border-l-2 border-tertiary/50 bg-surface-container-low px-3 py-2">
                  <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-green-deep">
                    Perbaikan terbesar
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-ink">{topFix.title}</p>
                  {topFix.replaces ? (
                    <p className="mt-0.5 text-xs text-ink-soft">
                      Mengganti: <span className="italic">{topFix.replaces}</span>
                    </p>
                  ) : null}
                  {topFix.copy_text ? (
                    <div className="mt-1.5">
                      <CopyButton text={topFix.copy_text} label="Salin perbaikan" />
                    </div>
                  ) : null}
                </div>
              )}

              {issueItems.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.06em] text-error">{t("checker.detail.issues")}</p>
                  <ul className="space-y-1">
                    {issueItems.map((iss, i) => {
                      const sev = severityMeta(iss.severity, t);
                      return (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-ink-soft">
                          <span className="mt-0.5 select-none text-error/70">•</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                              <span>{iss.text}</span>
                              {sev && (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-bold uppercase tracking-wide ${sev.cls}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                                  {sev.label}
                                </span>
                              )}
                            </span>
                            {iss.source_excerpt && (
                              <span className="mt-1 block rounded-md border-l-2 border-error/40 bg-surface-container-low px-2 py-1 text-xs italic text-ink-soft">
                                &ldquo;{iss.source_excerpt}&rdquo;
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {suggestions && suggestions.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.06em] text-green-deep">{t("checker.detail.suggestions")}</p>
                  <ul className="space-y-1">
                    {suggestions.map((sug, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-ink-soft">
                        <span className="mt-0.5 select-none text-green-deep">→</span>
                        {sug}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {issueItems.length === 0 && (!suggestions || suggestions.length === 0) && (
                <p className="text-xs italic text-ink-soft">{t("checker.detail.no-notes")}</p>
              )}

              {changePack && (
                <div className="border-t-[1.5px] border-hairline pt-2">
                  <CopyButton text={changePack} label="Salin semua perubahan section ini" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
