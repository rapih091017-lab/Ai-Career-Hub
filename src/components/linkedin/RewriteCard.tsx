"use client";

import { CopyButton } from "@/components/checker/CopyButton";
import { useTranslation } from "@/lib/i18n";

/**
 * Satu bagian LinkedIn yang sudah ditulis ulang.
 *
 * Tombol salin memakai CopyButton yang sama dengan checker: teks disalin
 * sebagai teks polos, dan placeholder [angka]/[persen] tetap diperingatkan
 * supaya tidak ikut terkirim apa adanya.
 */
export function RewriteCard({
  label,
  text,
  why,
  note,
}: {
  label: string;
  text: string;
  why?: string;
  note?: string;
}) {
  const { t } = useTranslation();
  if (!text.trim()) return null;

  return (
    <article className="rounded-[18px] border-[2.5px] border-ink bg-paper p-5 shadow-hard-sm">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h3 className="font-display text-[19px] font-bold leading-tight text-ink">{label}</h3>
          {note ? <p className="mt-0.5 text-xs font-semibold text-ink-soft">{note}</p> : null}
        </div>
        <CopyButton text={text} label={t("lo.result.copy", "Salin")} />
      </div>

      <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">
        {text}
      </p>

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
