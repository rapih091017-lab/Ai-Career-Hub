"use client";

import type { ReactNode } from "react";
import { Popover } from "@/components/ui/popover";
import type { GlossaryId } from "@/lib/guide-features";
import { fill, useTranslation } from "@/lib/i18n";

/**
 * Istilah dengan definisi satu kalimat. Dibuka dengan tap/klik atau Enter, ditutup Escape.
 * Tanpa children, label memakai nama istilah dari glosarium.
 */
export function Term({ id, children }: { id: GlossaryId; children?: ReactNode }) {
  const { t } = useTranslation();
  const name = t(`glossary.${id}.term`);
  return (
    <Popover
      label={fill(t("guide.term.aria"), { term: name })}
      panelClassName="max-w-[min(18rem,calc(100vw-16px))]"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          data-term={id}
          className="inline-flex min-h-8 items-center rounded px-0.5 font-semibold text-ink underline decoration-dotted decoration-2 underline-offset-4 hover:bg-lime/20 aria-expanded:bg-lime/20"
        >
          {children ?? name}
        </button>
      )}
    >
      <p className="text-xs leading-relaxed">
        <span className="font-semibold text-on-surface">{name}. </span>
        <span className="text-on-surface-variant">{t(`glossary.${id}.def`)}</span>
      </p>
    </Popover>
  );
}
