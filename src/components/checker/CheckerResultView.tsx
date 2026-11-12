"use client";

import { useMemo, type ReactNode, type Ref } from "react";
import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";
import { ScoreDonut } from "./ScoreDonut";
import { SectionScoreCard } from "./SectionScoreCard";
import { ImpactForecastCard } from "./ImpactForecastCard";
import HrPointOfView from "./HrPointOfView";
import { KeywordChip, BulletReviewCard, SectionKicker } from "./ResultComponents";
import { ImprovementChecklist, buildChecklistItems } from "./ImprovementChecklist";
import { QuickSummaryCard } from "./QuickSummaryCard";
import { MissingSectionsCard } from "./MissingSectionsCard";
import { StartHereCard, pickStartSteps } from "./StartHereCard";
import { FixInBuilderButton } from "./FixInBuilderButton";
import { SectionNav, type SectionNavItem } from "@/components/ui/SectionNav";
import { Collapsible } from "@/components/ui/Collapsible";
import { useDoneState } from "@/lib/useDoneState";
import { buildHrPointOfView } from "@/lib/checker/hr-point-of-view";
import { KeywordEvidenceBadge, KeywordExtrasBlock, KeywordSourceLine } from "./KeywordAnalysisExtras";
import {
  scoreColor,
  gradeColor,
  atsBadgeColor,
  atsReadinessLabel,
  fitLabelMeta,
  type AnalysisResult,
  type ExperienceSection,
  type SkillsSection,
  type StoredAnalysisResult,
} from "./types";

/**
 * Isi hasil cek CV yang dipakai bersama oleh `/checker` (hasil segar) dan
 * `/checker/[id]` (hasil tersimpan). `variant` hanya memilih kunci teks dan
 * badge yang memang cuma ada di hasil segar (model AI, fit label, bobot).
 */
export type CheckerResultVariant = "fresh" | "stored";

interface CheckerResultViewProps {
  result: StoredAnalysisResult;
  variant: CheckerResultVariant;
  /** Ref pembungkus donut, dipakai animasi masuk di /checker. */
  donutRef?: Ref<HTMLDivElement>;
  /** Ref pembungkus seluruh hasil. */
  resultsRef?: Ref<HTMLDivElement>;
  /** Id pembungkus hasil (hanya /checker/[id] yang memakainya). */
  wrapperId?: string;
  /** Id hasil tersimpan. Bila ada, centang "Sudah diperbaiki" disimpan di
   *  localStorage per id; tanpa id (hasil segar di /checker) hanya di memori. */
  resultId?: string | null;
  /** CTA khusus halaman, dirender di akhir. */
  children?: ReactNode;
  /** Teks CV hasil ekstraksi; bila ada, muncul tombol "Perbaiki di builder". */
  cvText?: string | null;
}

/** Kunci teks yang berbeda antara dua halaman hasil. */
const LABELS = {
  fresh: {
    title: "checker.result-title",
    breakdown: "checker.sec-title",
    summary: "checker.sec-summary",
    experience: "checker.sec-experience",
    skills: "checker.sec-skills",
    education: "checker.sec-education",
    format: "checker.sec-format",
    review: "checker.ai-review",
    atsRecs: "checker.ats-recs",
    keyword: "checker.kw-title",
    synonym: "checker.kw-synonym",
  },
  stored: {
    title: "checker.detail.title",
    breakdown: "checker.detail.section-breakdown",
    summary: "checker.detail.section-summary",
    experience: "checker.detail.section-experience",
    skills: "checker.detail.section-skills",
    education: "checker.detail.section-education",
    format: "checker.detail.section-format",
    review: "checker.detail.review-title",
    atsRecs: "checker.detail.ats-recs",
    keyword: "checker.detail.keyword-title",
    synonym: "checker.detail.keyword-synonyms",
  },
} as const;

export function CheckerResultView({ result, variant, donutRef, resultsRef, wrapperId, resultId, children, cvText }: CheckerResultViewProps) {
  const { t, lang } = useTranslation();
  const L = LABELS[variant];
  const fresh = variant === "fresh";

  const {
    scores,
    summary,
    fitLabel,
    grade,
    atsPrediction,
    breakdown,
    keywordAnalysis,
    narrativeFeedback,
    actionPlan,
    bulletReview,
    missingSections,
    weightsApplied,
    impactForecast,
    aiModel,
    quickSummary,
  } = result;

  const color = scoreColor(scores.overall);
  const gc = gradeColor(grade);
  const atsBadge = atsBadgeColor(atsPrediction);
  const fitMeta = fitLabelMeta(fitLabel, t);

  // Hitungan di judul kata kunci/bullet: hasil segar memakai template {n},
  // hasil tersimpan menambahkan "(n)" di belakang judul.
  const countLabel = (freshKey: string, storedKey: string, n: number) =>
    fresh ? t(freshKey).replace("{n}", String(n)) : `${t(storedKey)} (${n})`;

  // v4, chip "X% terkuantifikasi" pada kartu Experience (kalau AI mengirimnya)
  const quantPct = (breakdown?.experience as ExperienceSection | undefined)?.quantification_pct;
  const quantChip = typeof quantPct === "number"
    ? {
        label: t("checker.quant-label"),
        value: `${quantPct}% ${t("checker.quant-label").toLowerCase()}`,
        hint: t("checker.quant-hint").replace("{pct}", String(quantPct)),
        tone: (quantPct >= 50 ? "green" : quantPct >= 25 ? "amber" : "red") as "green" | "amber" | "red",
      }
    : undefined;

  const donut = <ScoreDonut score={scores.overall} color={color} label={t("checker.score-label")} />;

  const done = useDoneState(resultId ? `checker_done:${resultId}` : null);
  const startSteps = useMemo(() => pickStartSteps(quickSummary, actionPlan), [quickSummary, actionPlan]);
  const checklistCount = useMemo(
    () => buildChecklistItems(actionPlan, missingSections, keywordAnalysis).length,
    [actionPlan, missingSections, keywordAnalysis],
  );
  const hrView = useMemo(() => buildHrPointOfView(result as AnalysisResult), [result]);

  // Ringkasan satu baris tiap bagian yang dilipat. Angka hanya dari data yang
  // ada; bila datanya kosong, kalimatnya tanpa angka.
  const hrCount = hrView.stopping.length + hrView.continuing.length;
  const hrSummary =
    hrCount > 0
      ? t("checker.collapse.hr")
          .replace("{stop}", String(hrView.stopping.length))
          .replace("{go}", String(hrView.continuing.length))
      : t("checker.collapse.hr-empty");

  const sectionsPresent = breakdown ? Object.values(breakdown).filter(Boolean) : [];
  const hasBreakdown = !!breakdown && Object.keys(breakdown).length > 0;
  const issueCount = sectionsPresent.reduce(
    (n, sec) => n + ((sec as { issues?: unknown[] }).issues?.length ?? 0),
    0,
  );
  const breakdownSummary = t(issueCount > 0 ? "checker.collapse.breakdown" : "checker.collapse.breakdown-no-issue")
    .replace("{n}", String(sectionsPresent.length))
    .replace("{issues}", String(issueCount));

  const missingCount = (missingSections ?? []).filter(
    (m) => m && typeof m.name === "string" && m.name.trim().length > 0,
  ).length;

  const atsRecCount = narrativeFeedback?.ats_recommendations.length ?? 0;
  const reviewSummary =
    atsRecCount > 0
      ? t("checker.collapse.review").replace("{n}", String(atsRecCount))
      : t("checker.collapse.review-empty");

  const keywordGeneric = keywordAnalysis?.source === "role_generic";
  const keywordSummary = keywordAnalysis
    ? t("checker.collapse.keyword")
        .replace("{found}", String(keywordAnalysis.matched.length))
        .replace("{critical}", String(keywordAnalysis.missing_critical.length))
        .replace("{nice}", String(keywordAnalysis.missing_nice_to_have.length))
    : undefined;

  // Daftar isi: hanya bagian yang dirender; SectionNav juga menyaring id
  // yang tidak ada di halaman.
  const navItems: SectionNavItem[] = [
    { id: "section-ringkas", label: t("checker.nav.score") },
    ...(startSteps.length > 0 ? [{ id: "section-mulai", label: t("checker.start.title"), count: startSteps.length }] : []),
    ...(quickSummary ? [{ id: "section-ringkasan", label: t("checker.nav.summary") }] : []),
    ...(checklistCount > 0 ? [{ id: "section-checklist", label: t("checker.nav.checklist"), count: checklistCount }] : []),
    { id: "section-hr", label: t("checker.nav.hr"), ...(hrCount > 0 ? { count: hrCount } : {}) },
    ...(hasBreakdown ? [{ id: "section-skor", label: t("checker.nav.breakdown"), count: sectionsPresent.length }] : []),
    ...(missingCount > 0 ? [{ id: "section-missing", label: t("checker.nav.missing"), count: missingCount }] : []),
    ...(narrativeFeedback ? [{ id: "section-review", label: t("checker.nav.review") }] : []),
    ...(keywordAnalysis ? [{ id: "section-keyword", label: t("checker.nav.keyword") }] : []),
    ...(bulletReview && bulletReview.length > 0
      ? [{ id: "section-bullet", label: t("checker.nav.bullet"), count: bulletReview.length }]
      : []),
  ];

  return (
    <SectionNav items={navItems}>
    <div ref={resultsRef} className="space-y-10" id={wrapperId}>
      <section id="section-ringkas" className="flex scroll-mt-32 flex-col items-center lg:scroll-mt-28">
        {fresh ? <div ref={donutRef}>{donut}</div> : donut}

        <h1 className="mb-2 text-center font-display text-headline-lg font-bold text-ink">{t(L.title)}</h1>
        {fresh ? (
          <p className="mb-5 max-w-[52ch] text-center text-body-md leading-relaxed text-ink-soft">{summary || t("checker.result-subtitle")}</p>
        ) : (
          <p className="mb-5 max-w-[480px] text-center text-body-md leading-relaxed text-ink-soft">
            {summary?.slice(0, 120) || t("checker.detail.summary-fallback")}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {grade && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${gc.bg} ${gc.text} ${gc.border}`}>
              <span className="text-lg">Grade {grade}</span>
            </div>
          )}
          {atsPrediction && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${atsBadge.bg} ${atsBadge.text}`}>
              <span className={`w-2 h-2 rounded-full ${atsBadge.dot}`} />
              {/* Enum di data tidak diubah, hanya tampilan. */}
              {atsReadinessLabel(atsPrediction, lang)}
            </div>
          )}
          {fresh && fitMeta.desc && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${fitMeta.bg} ${fitMeta.text}`}>
              <span className="material-symbols-outlined text-lg select-none">{fitMeta.icon}</span>
              {fitLabel}{fitMeta.desc ? ` · ${fitMeta.desc.split(",")[0]}` : ""}
            </div>
          )}
          {fresh && aiModel && (
            <div
              className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-sm font-semibold ${
                aiModel === "V4 Pro"
                  ? "border-green-deep/40 bg-primary-fixed text-on-primary-fixed"
                  : "border-ink/20 bg-surface-container-low text-ink"
              }`}
              title={aiModel === "V4 Pro" ? t("checker.model-v4pro") : t("checker.model-v4flash")}
            >
              <span className="material-symbols-outlined select-none text-lg">{aiModel === "V4 Pro" ? "auto_awesome" : "bolt"}</span>
              {aiModel === "V4 Pro" ? "DeepSeek V4 Pro" : "DeepSeek V4 Flash"}
            </div>
          )}
        </div>

        {/* Keterangan kesiapan dibaca: estimasi, bukan skor ATS resmi. */}
        {atsPrediction && (
          <p className="mt-3 text-center text-xs text-ink-soft">
            Kesiapan dibaca HR &amp; mesin: estimasi, bukan skor ATS resmi; tiap perusahaan memakai sistem berbeda.
          </p>
        )}

        {/* Transparansi bobot penilaian (role category) */}
        {fresh && weightsApplied && weightsApplied.role_category !== "general" && (
          <p className="mt-3 flex flex-wrap items-center justify-center gap-1 text-center text-xs text-ink-soft">
            <span className="material-symbols-outlined select-none text-[13px]">tune</span>
            {t("checker.weights-note")
              .replace("{cat}", weightsApplied.role_category.replace("_", " "))
              .replace("{ex}", String(Math.round((weightsApplied.experience_weight || 0) * 100)))
              .replace("{sk}", String(Math.round((weightsApplied.skills_weight || 0) * 100)))
              .replace("{ed}", String(Math.round((weightsApplied.education_weight || 0) * 100)))}
          </p>
        )}
      </section>

      {/* ── Mulai dari sini: maksimal 3 langkah, tidak dirender tanpa data ── */}
      {/* Tombol utama "Perbaiki di builder" menempel di kartu ini; tanpa
          langkah, tombolnya tetap tampil sendiri. */}
      {startSteps.length > 0 ? (
        <StartHereCard steps={startSteps} done={done} action={<FixInBuilderButton cvText={cvText} />} />
      ) : (
        <FixInBuilderButton cvText={cvText} />
      )}

      {/* Ringkasan 10 detik. Baris lama tidak punya field ini di fullResult,
          jadi mapper menghasilkan null dan kartu tidak muncul. */}
      {quickSummary && (
        <div id="section-ringkasan" className="scroll-mt-32 lg:scroll-mt-28">
          <QuickSummaryCard
            analysis={result}
            summary={quickSummary}
            hideFixIndexes={startSteps.flatMap((s) => (typeof s.fixIndex === "number" ? [s.fixIndex] : []))}
          />
        </div>
      )}

      {impactForecast && <ImpactForecastCard forecast={impactForecast} />}

      {/* ── Checklist perbaikan (terbuka: ini daftar kerja utama) ── */}
      <div id="section-checklist" className="scroll-mt-32 lg:scroll-mt-28">
        <ImprovementChecklist actionPlan={actionPlan} missingSections={missingSections} keywordAnalysis={keywordAnalysis} done={done} />
      </div>

      {/* ── Bagian detail: dilipat, ringkasan satu baris dari data yang ada ── */}
      {/* Wrapper section-hr selalu ada supaya tombol "Lihat" punya tujuan. */}
      <Collapsible id="section-hr" title={t("checker.nav.hr")} summary={hrSummary}>
        {fresh ? (
          <HrPointOfView result={result as AnalysisResult} />
        ) : (
          <HrPointOfView result={result as AnalysisResult} keyPrefix="checker.detail." />
        )}
      </Collapsible>

      {hasBreakdown && (
        <Collapsible id="section-skor" title={t("checker.nav.breakdown")} summary={breakdownSummary}>
          {/* Kartu hanya dirender untuk section yang benar-benar punya skor. Kolom
              jsonb bisa terpotong, dan skor default hanya akan menampilkan
              persentase yang tidak pernah dihitung. */}
          {breakdown && Object.keys(breakdown).length > 0 && (
            <motion.section
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <div className="px-1">
                <SectionKicker>{t("checker.kicker-breakdown")}</SectionKicker>
                <h2 className="font-display text-headline-md font-bold text-ink">{t(L.breakdown)}</h2>
              </div>
              {breakdown.summary && (
                <SectionScoreCard title={t(L.summary)} score={breakdown.summary.score} issues={breakdown.summary.issues} suggestions={breakdown.summary.suggestions} delay={0.2} sectionKey="summary" analysis={result} />
              )}
              {breakdown.experience && (
                <SectionScoreCard title={t(L.experience)} score={breakdown.experience.score} issues={breakdown.experience.issues} suggestions={breakdown.experience.suggestions} delay={0.25} statChip={quantChip} sectionKey="experience" analysis={result} />
              )}
              {breakdown.skills && (
                <SectionScoreCard title={t(L.skills)} score={breakdown.skills.score} issues={(breakdown.skills as SkillsSection).missing_skills} suggestions={(breakdown.skills as SkillsSection).recommendations} delay={0.3} sectionKey="skills" analysis={result} />
              )}
              {breakdown.education && (
                // relevance bisa kosong di baris lama; tanpa penjaga, SectionScoreCard
                // menampilkan bullet ISSUES tanpa teks apa pun.
                <SectionScoreCard title={t(L.education)} score={breakdown.education.score} issues={breakdown.education.relevance ? [breakdown.education.relevance] : []} suggestions={breakdown.education.suggestions} delay={0.35} sectionKey="education" analysis={result} />
              )}
              {breakdown.format_ats && (
                <SectionScoreCard title={t(L.format)} score={breakdown.format_ats.score} issues={breakdown.format_ats.issues} suggestions={breakdown.format_ats.tips} delay={0.4} sectionKey="format_ats" analysis={result} />
              )}
            </motion.section>
          )}

        </Collapsible>
      )}

      {/* Section yang belum ada: tampil hanya bila ada isinya. */}
      {missingCount > 0 && (
        <Collapsible id="section-missing" title={t("checker.nav.missing")} summary={t("checker.collapse.missing").replace("{n}", String(missingCount))}>
          <MissingSectionsCard items={missingSections} />
        </Collapsible>
      )}

      {narrativeFeedback && (
        <Collapsible id="section-review" title={t("checker.nav.review")} summary={reviewSummary}>
          <motion.section
            className="space-y-5 rounded-[18px] border-[2.5px] border-ink bg-paper p-6 shadow-hard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <SectionKicker>{t("checker.kicker-narrative")}</SectionKicker>
            <h2 className="font-display text-headline-md font-bold text-ink">{t(L.review)}</h2>
            <div className="rounded-xl border-[2.5px] border-ink bg-lime/25 p-4">
              <p className="text-sm leading-relaxed text-ink">{narrativeFeedback.overall_assessment}</p>
            </div>
            {/* Kolom Kelebihan dan Perlu Diperbaiki sengaja tidak ada: isinya
                sudah tampil di panel Sisi HR, lengkap dengan kutipan CV. */}
            {narrativeFeedback.ats_recommendations.length > 0 && (
              <div className="rounded-xl border-[1.5px] border-ink/15 bg-surface-container-low p-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-green-deep">
                  <span className="material-symbols-outlined select-none text-sm">description</span>
                  {t(L.atsRecs)}
                </h3>
                <ul className="space-y-1">
                  {narrativeFeedback.ats_recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
                      <span className="mt-0.5 select-none text-green-deep">→</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.section>
        </Collapsible>
      )}

      {keywordAnalysis && (
        <Collapsible id="section-keyword" title={t("checker.nav.keyword")} summary={keywordSummary}>
          <motion.section
            className="space-y-5 rounded-[18px] border-[2.5px] border-ink bg-paper p-6 shadow-hard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                {/* Tanpa lowongan (source role_generic) tidak ada kecocokan
                    lowongan yang dinilai: kicker diganti, persen disembunyikan. */}
                <SectionKicker>{t(keywordGeneric ? "checker.kicker-keyword-generic" : "checker.kicker-keyword")}</SectionKicker>
                <h2 className="font-display text-headline-md font-bold text-ink">{t(L.keyword)}</h2>
              </div>
              {!keywordGeneric && (
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold text-ink">{keywordAnalysis.match_rate_pct}%</span>
                <div className="h-2 w-16 overflow-hidden rounded-full bg-ink/10">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, rgb(var(--c-green)), rgb(var(--c-lime)))" }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${keywordAnalysis.match_rate_pct}%` }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
              )}
            </div>
            {keywordGeneric && (
              <p className="text-xs font-semibold text-ink-soft">{t("checker.keyword-generic-note")}</p>
            )}

            {/* Sumber daftar + keterangan; muncul hanya bila source ada. */}
            <KeywordSourceLine analysis={keywordAnalysis} />

            <div className="space-y-4">
              {keywordAnalysis.matched.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.06em] text-green-deep">
                    {countLabel("checker.kw-found", "checker.detail.keyword-found", keywordAnalysis.matched.length)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {keywordAnalysis.matched.map((kw, i) => (
                      <span key={i} className="inline-flex flex-wrap items-center gap-1">
                        <KeywordChip text={kw} variant="found" />
                        <KeywordEvidenceBadge analysis={keywordAnalysis} keyword={kw} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {keywordAnalysis.missing_critical.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.06em] text-error">
                    {countLabel("checker.kw-critical", "checker.detail.keyword-missing-critical", keywordAnalysis.missing_critical.length)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordAnalysis.missing_critical.map((kw, i) => (
                      <KeywordChip key={i} text={kw} variant="missing" />
                    ))}
                  </div>
                </div>
              )}
              {keywordAnalysis.missing_nice_to_have.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.06em] text-tertiary">
                    {countLabel("checker.kw-nice", "checker.detail.keyword-missing-nice", keywordAnalysis.missing_nice_to_have.length)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordAnalysis.missing_nice_to_have.map((kw, i) => (
                      <KeywordChip key={i} text={kw} variant="nice" />
                    ))}
                  </div>
                </div>
              )}
              {keywordAnalysis.synonym_suggestions.length > 0 && (
                <div className="rounded-xl border-[1.5px] border-ink/15 bg-surface-container-low p-4">
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.06em] text-ink-soft">{t(L.synonym)}</p>
                  <ul className="space-y-1">
                    {keywordAnalysis.synonym_suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
                        <span className="mt-0.5 select-none text-green-deep">→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Kartu penempatan + tabel syarat; null bila tidak ada data. */}
            <KeywordExtrasBlock analysis={keywordAnalysis} />
          </motion.section>
        </Collapsible>
      )}

      {bulletReview && bulletReview.length > 0 && (
        <Collapsible id="section-bullet" title={t("checker.nav.bullet")} summary={t("checker.collapse.bullet").replace("{n}", String(bulletReview.length))}>
          <motion.section
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            <div className="px-1">
              <SectionKicker>{t("checker.kicker-bullet")}</SectionKicker>
              <h2 className="font-display text-headline-md font-bold text-ink">
                {countLabel("checker.bullet-title", "checker.detail.bullet-title", bulletReview.length)}
              </h2>
            </div>
            <div className="space-y-2">
              {bulletReview.map((item, i) => (
                <BulletReviewCard key={i} item={item} index={i} />
              ))}
            </div>
          </motion.section>
        </Collapsible>
      )}

      {children}
    </div>
    </SectionNav>
  );
}
