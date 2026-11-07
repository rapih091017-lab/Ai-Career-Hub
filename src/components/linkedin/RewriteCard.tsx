"use client";

import { useId, useState } from "react";
import { CopyButton } from "@/components/checker/CopyButton";
import { useTranslation } from "@/lib/i18n";

/**
 * Satu bagian LinkedIn yang sudah ditulis ulang.
 *
 * Tombol salin memakai CopyButton yang sama dengan checker: teks disalin
 * sebagai teks polos, dan placeholder [angka]/[persen] tetap diperingatkan
 * supaya tidak ikut terkirim apa adanya.
 */
/** Teks lebih dari ini (baris) dilipat; sisanya dibuka lewat tombol. */
const FOLD_LINES = 3;

export function RewriteCard({
  label,
  text,
  why,
  note,
  id,
  fold = false,
  done,
}: {
  label: string;
  text: string;
  why?: string;
  note?: string;
  /** Id anchor untuk daftar isi. */
  id?: string;
  /** Lipat teks panjang (dipakai rewrite pengalaman). */
  fold?: boolean;
  /** Centang "Sudah diterapkan". */
  done?: { checked: boolean; onToggle: () => void };
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  const checkId = useId();
  if (!text.trim()) return null;

  const lines = text.split("\n");
  const folded = fold && lines.length > FOLD_LINES && !expanded;
  const shown = folded ? lines.slice(0, FOLD_LINES).join("\n") : text;

  return (
    <article id={id} className="scroll-mt-32 rounded-[18px] border-[2.5px] border-ink bg-paper p-5 shadow-hard-sm lg:scroll-mt-28">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h3 className="font-display text-[19px] font-bold leading-tight text-ink">{label}</h3>
          {note ? <p className="mt-0.5 text-xs font-semibold text-ink-soft">{note}</p> : null}
        </div>
        <CopyButton text={text} label={t("lo.result.copy", "Salin")} />
      </div>

      <p id={bodyId} className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">
        {shown}
      </p>
      {fold && lines.length > FOLD_LINES ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 inline-flex min-h-[36px] items-center gap-1 text-xs font-bold text-green-deep underline underline-offset-2"
        >
          {expanded
            ? t("lo.result.fold-less")
            : t("lo.result.fold-more").replace("{n}", String(lines.length - FOLD_LINES))}
        </button>
      ) : null}

      {done ? (
        <label htmlFor={checkId} className="mt-3 flex min-h-[36px] cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
          <input
            id={checkId}
            type="checkbox"
            checked={done.checked}
            onChange={done.onToggle}
            className="h-4 w-4 accent-[rgb(var(--c-green))]"
          />
          {t("lo.result.applied")}
        </label>
      ) : null}

      {why ? (
        <p className="mt-4 border-t border-hairline pt-3 text-xs leading-relaxed text-ink-soft">
          <span className="font-extrabold uppercase tracking-[0.06em] text-green-deep">
            {t("lo.result.why")}:{" "}
          </span>
          {why}
        </p>
      ) : null}
    </article>
  );
}
