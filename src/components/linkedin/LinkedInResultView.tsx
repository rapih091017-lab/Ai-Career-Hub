"use client";

import { ScoreDonut } from "@/components/checker/ScoreDonut";
import { gradeColor, scoreColor } from "@/components/checker/types";
import { useTranslation } from "@/lib/i18n";
import type { LinkedInResult } from "@/lib/linkedin-optimizer/result";
import { RewriteCard } from "./RewriteCard";
import { ScoreBreakdown } from "./ScoreBreakdown";

/**
 * Susunan halaman hasil, dari kesimpulan ke tindakan: skor total, alasan,
 * rincian per bagian, lalu teks yang bisa langsung ditempel.
 *
 * Semua bagian bersifat kondisional. Kalau model tidak mengirim rewrite
 * tertentu, kartunya tidak muncul — tidak ada kotak kosong yang terlihat
 * seperti hasil yang gagal dimuat.
 */
export function LinkedInResultView({
  result,
  branding,
}: {
  result: LinkedInResult;
  branding: string;
}) {
  const { t } = useTranslation();
  const color = scoreColor(result.overallScore);
  const grade = gradeColor(result.grade);

  return (
    <div className="space-y-12">
      {/* Skor + vonis */}
      <section className="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-10">
        <div className="flex shrink-0 flex-col items-center">
          <ScoreDonut score={result.overallScore} color={color} label={t("lo.result.score-label")} />
          <span
            className={`-mt-2 inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-extrabold ${grade.bg} ${grade.text} ${grade.border}`}
          >
            {t("lo.result.grade", "Grade")} {result.grade}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {branding ? (
            <p className="mb-3 inline-flex flex-wrap items-center gap-1.5 rounded-lg border border-edge/40 bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-ink-soft">
              <span className="font-extrabold uppercase tracking-[0.06em] text-green-deep">
                {t("lo.result.branding")}:
              </span>
              {branding}
            </p>
          ) : null}
          <h2 className="font-display text-headline-md font-bold text-ink">
            {t("lo.result.verdict-title")}
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
            {result.verdict || t("lo.section.none")}
          </p>
        </div>
      </section>

      {/* Rincian skor */}
      <section>
        <h2 className="font-display text-headline-md font-bold text-ink">
          {t("lo.result.breakdown-title")}
        </h2>
        <p className="mt-1.5 max-w-[58ch] text-sm leading-relaxed text-ink-soft">
          {t("lo.result.breakdown-lede")}
        </p>
        <div className="mt-5">
          <ScoreBreakdown sections={result.sections} />
        </div>
      </section>

      {/* Teks siap tempel */}
      <section>
        <h2 className="font-display text-headline-md font-bold text-ink">
          {t("lo.result.rewrite-title")}
        </h2>
        <p className="mt-1.5 max-w-[58ch] text-sm leading-relaxed text-ink-soft">
          {t("lo.result.rewrite-lede")}
        </p>

        <div className="mt-5 space-y-4">
          <RewriteCard
            label={t("lo.result.headline")}
            text={result.headline.text}
            why={result.headline.why}
          />

          <RewriteCard
            label={t("lo.result.about")}
            text={result.about.text}
            why={result.about.why}
          />

          {result.experience.map((item, index) => (
            <RewriteCard
              key={`${item.company}-${item.title}-${index}`}
              label={item.title}
              note={[item.company, item.period].filter(Boolean).join(" · ")}
              text={item.bullets.join("\n")}
            />
          ))}

          <RewriteCard
            label={t("lo.result.skills")}
            text={result.skills.text}
            why={result.skills.note}
          />
        </div>
      </section>
    </div>
  );
}
