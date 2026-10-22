"use client";

import { useTranslation } from "@/lib/i18n";
import { CopyButton } from "./CopyButton";
import { SectionKicker } from "./ResultComponents";
import type { MissingSection } from "./types";

/**
 * Kartu "Section yang belum ada" (prompt 4).
 *
 * Item dari mapper sudah berbentuk objek { name, why_it_matters?,
 * template_copy_text? } — string lama dinormalkan jadi { name }, jadi entri
 * format lama tampil namanya tanpa tombol salin (tidak ada template-nya).
 * Tanpa item, kartu tidak dirender sama sekali.
 */
export function MissingSectionsCard({ items }: { items?: MissingSection[] | null }) {
  const { t } = useTranslation();
  const list = (items ?? []).filter((item) => item && typeof item.name === "string" && item.name.trim().length > 0);
  if (list.length === 0) return null;

  return (
    <section
      aria-label={t("checker.missing-title")}
      className="rounded-[18px] border-[2.5px] border-ink bg-paper p-6 shadow-hard"
    >
      <SectionKicker>{t("checker.kicker-missing")}</SectionKicker>
      <h2 className="font-headline-md text-headline-md text-ink">{t("checker.missing-title")}</h2>
      <p className="mt-1 text-body-md text-ink-soft">{t("checker.missing-desc")}</p>
      <ul className="mt-3 space-y-3">
        {list.map((item, index) => (
          <li key={index} className="border-l-2 border-ink/15 pl-3">
            <p className="text-body-md font-semibold text-ink">{item.name}</p>
            {item.why_it_matters ? (
              <p className="mt-0.5 text-body-sm text-ink-soft">{item.why_it_matters}</p>
            ) : null}
            {/* Salin template hanya bila item memang objek dengan template. */}
            {item.template_copy_text ? (
              <div className="mt-1.5">
                <CopyButton text={item.template_copy_text} label={t("checker.missing-copy")} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
