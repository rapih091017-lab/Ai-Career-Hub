"use client";

import { useEffect, useId, useState } from "react";
import { Term } from "@/components/guide/Term";
import { guideFeature, type GuideFeatureId } from "@/lib/guide-features";
import { useTranslation } from "@/lib/i18n";

const collapseKey = (id: string) => `guide_howto_${id}_collapsed`;

function readCollapsed(id: string): boolean {
  try {
    return localStorage.getItem(collapseKey(id)) === "1";
  } catch {
    return false;
  }
}

/** Kotak "Cara pakai": tiga langkah bernomor yang bisa dilipat; status lipat diingat per fitur. */
export function HowToUse({ id, className = "" }: { id: GuideFeatureId; className?: string }) {
  const { t } = useTranslation();
  const feature = guideFeature(id);
  const [collapsed, setCollapsed] = useState(false);
  const panelId = useId();

  // Dibaca sesudah mount agar render server dan klien sama.
  useEffect(() => setCollapsed(readCollapsed(id)), [id]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(collapseKey(id), next ? "1" : "0");
    } catch {
      /* storage tidak bisa diakses */
    }
  };

  return (
    <section className={`rounded-[14px] border-2 border-ink/15 bg-paper px-4 py-3 ${className}`} data-howto={id}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-controls={panelId}
        aria-label={collapsed ? t("guide.howto.show") : t("guide.howto.hide")}
        className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-bold text-ink"
      >
        <span className="material-symbols-outlined text-[18px] text-green-deep" aria-hidden="true">lightbulb</span>
        {t("guide.howto.title")}
        <span className={`material-symbols-outlined ml-auto text-[20px] transition-transform ${collapsed ? "" : "rotate-180"}`} aria-hidden="true">expand_more</span>
      </button>
      <div id={panelId} hidden={collapsed}>
        <ol className="mt-1 space-y-2 pb-1">
          {(["s1", "s2", "s3"] as const).map((s, i) => (
            <li key={s} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark font-mono text-[12px] font-bold text-lime" aria-hidden="true">
                {i + 1}
              </span>
              <span>{t(`guide.f.${id}.${s}`)}</span>
            </li>
          ))}
        </ol>
        {feature.terms && feature.terms.length > 0 && (
          <p className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-ink/10 pt-2 text-xs text-ink-soft">
            <span className="font-semibold">{t("guide.howto.terms")}</span>
            {feature.terms.map((term) => (
              <Term key={term} id={term} />
            ))}
          </p>
        )}
      </div>
    </section>
  );
}
