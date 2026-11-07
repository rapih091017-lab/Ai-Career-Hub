"use client";

import { ScoreDonut } from "@/components/checker/ScoreDonut";
import { gradeColor, scoreColor } from "@/components/checker/types";
import { useTranslation } from "@/lib/i18n";
import { useDoneState } from "@/lib/useDoneState";
import { SectionNav, scrollToSection, type SectionNavItem } from "@/components/ui/SectionNav";
import type { LinkedInResult, LinkedInSectionKey, LinkedInSectionScore } from "@/lib/linkedin-optimizer/result";
import { RewriteCard } from "./RewriteCard";
import { ScoreBreakdown } from "./ScoreBreakdown";

/** Bagian skor → kartu rewrite yang memperbaikinya. Pendidikan tidak punya
 *  rewrite, jadi lompat ke rincian skor. */
const SECTION_TARGET: Record<LinkedInSectionKey, string> = {
  headline: "lo-headline",
  about: "lo-about",
  experience_titles: "lo-experience",
  experience_descriptions: "lo-experience",
  skills: "lo-skills",
  education: "lo-rincian",
};

/** Tiga bagian dengan skor terendah; urutan asli dipakai bila skornya sama. */
export function lowestSections(sections: LinkedInSectionScore[], n = 3): LinkedInSectionScore[] {
  return sections
    .map((section, index) => ({ section, index }))
    .sort((a, b) => a.section.score - b.section.score || a.index - b.index)
    .slice(0, n)
    .map((x) => x.section);
}

/** Lompat ke kartu tujuan; bila kartunya tidak dirender, ke rincian skor. */
function jumpTo(id: string) {
  scrollToSection(document.getElementById(id) ? id : "lo-rincian");
}

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
  resultId,
}: {
  result: LinkedInResult;
  branding: string;
  /** Id hasil; centang "Sudah diterapkan" disimpan di localStorage per id. */
  resultId?: string | null;
}) {
  const { t } = useTranslation();
  const color = scoreColor(result.overallScore);
  const grade = gradeColor(result.grade);
  const done = useDoneState(resultId ? `lo_done:${resultId}` : null);
  const lowest = lowestSections(result.sections);

  // Kartu rewrite yang benar-benar ada (RewriteCard tidak merender teks kosong).
  const rewrites = [
    ...(result.headline.text.trim() ? ["headline"] : []),
    ...(result.about.text.trim() ? ["about"] : []),
    ...result.experience.flatMap((item, i) => (item.bullets.join("").trim() ? [`exp-${i}`] : [])),
    ...(result.skills.text.trim() ? ["skills"] : []),
  ];
  const doneCount = done.countDone(rewrites);
  const doneProp = (key: string) => ({ checked: done.isDone(key), onToggle: () => done.toggle(key) });
  const hasExperience = result.experience.some((item) => item.bullets.join("").trim());

  const navItems: SectionNavItem[] = [
    { id: "lo-skor", label: t("lo.nav.score") },
    ...(lowest.length > 0 ? [{ id: "lo-mulai", label: t("lo.result.start-title"), count: lowest.length }] : []),
    ...(result.sections.length > 0 ? [{ id: "lo-rincian", label: t("lo.nav.breakdown"), count: result.sections.length }] : []),
    ...(result.headline.text.trim() ? [{ id: "lo-headline", label: t("lo.result.headline") }] : []),
    ...(result.about.text.trim() ? [{ id: "lo-about", label: t("lo.result.about") }] : []),
    ...(hasExperience
      ? [{ id: "lo-experience", label: t("lo.nav.experience"), count: result.experience.filter((item) => item.bullets.join("").trim()).length }]
      : []),
    ...(result.skills.text.trim() ? [{ id: "lo-skills", label: t("lo.result.skills") }] : []),
  ];

  return (
    <SectionNav items={navItems}>
    <div className="space-y-12">
      {/* Skor + vonis */}
      <section id="lo-skor" className="flex scroll-mt-32 flex-col lg:scroll-mt-28 items-center gap-8 md:flex-row md:items-start md:gap-10">
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

      {/* Mulai dari sini: tiga bagian dengan skor terendah, apa adanya dari data */}
      {lowest.length > 0 ? (
        <section id="lo-mulai" aria-labelledby="lo-mulai-title" className="scroll-mt-32 rounded-[18px] border-[2.5px] border-ink bg-lime/20 p-5 shadow-hard-sm lg:scroll-mt-28">
          <h2 id="lo-mulai-title" className="font-display text-headline-md font-bold text-ink">
            {t("lo.result.start-title")}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">{t("lo.result.start-lede")}</p>
          <ol className="mt-4 space-y-2">
            {lowest.map((section, i) => (
              <li key={section.key} className="flex flex-col gap-2 rounded-xl border-[1.5px] border-ink/20 bg-paper p-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink font-display text-xs font-bold text-ink">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink">
                      {t(`lo.section.${section.key}`, section.key)}{" "}
                      <span className="text-xs font-semibold text-ink-soft">· {t("lo.result.lowest")}</span>
                    </p>
                    {section.suggestion ? (
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{section.suggestion}</p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => jumpTo(SECTION_TARGET[section.key])}
                  className="inline-flex min-h-[36px] shrink-0 items-center gap-1 self-start rounded-full border-[1.5px] border-ink px-3 py-1 text-xs font-bold text-ink transition-colors hover:bg-surface-container sm:self-center"
                >
                  {t("lo.result.jump")}
                  <span className="material-symbols-outlined select-none text-[13px]" aria-hidden="true">arrow_downward</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Rincian skor */}
      <section id="lo-rincian" className="scroll-mt-32 lg:scroll-mt-28">
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
        {rewrites.length > 0 ? (
          <p className="mt-2 text-xs font-semibold text-ink-soft" aria-live="polite">
            {t("lo.result.applied-progress").replace("{done}", String(doneCount)).replace("{total}", String(rewrites.length))}
          </p>
        ) : null}

        <div className="mt-5 space-y-4">
          <RewriteCard
            id="lo-headline"
            label={t("lo.result.headline")}
            text={result.headline.text}
            why={result.headline.why}
            done={doneProp("headline")}
          />

          <RewriteCard
            id="lo-about"
            label={t("lo.result.about")}
            text={result.about.text}
            why={result.about.why}
            done={doneProp("about")}
          />

          {hasExperience ? (
            <div id="lo-experience" className="scroll-mt-32 space-y-4 lg:scroll-mt-28">
              {result.experience.map((item, index) => (
                <RewriteCard
                  key={`${item.company}-${item.title}-${index}`}
                  label={item.title}
                  note={[item.company, item.period].filter(Boolean).join(" · ")}
                  text={item.bullets.join("\n")}
                  fold
                  done={doneProp(`exp-${index}`)}
                />
              ))}
            </div>
          ) : null}

          <RewriteCard
            id="lo-skills"
            label={t("lo.result.skills")}
            text={result.skills.text}
            why={result.skills.note}
            done={doneProp("skills")}
          />
        </div>
      </section>
    </div>
    </SectionNav>
  );
}
