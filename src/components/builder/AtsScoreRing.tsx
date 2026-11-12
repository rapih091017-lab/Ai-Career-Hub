"use client";

import { Tooltip } from "@/components/ui/popover";
import { useTranslation } from "@/lib/i18n";

/**
 * Persentase kata kunci deskripsi lowongan yang ditemukan di CV. 0 bila
 * deskripsi lowongan belum diisi, jadi angkanya diganti tanda "–".
 */
export function AtsScoreRing({ score }: { score: number }) {
  const { t } = useTranslation();
  const circumference = 2 * Math.PI * 16; // r=16
  const offset = circumference * (1 - score / 100);
  const empty = score <= 0;
  const tip = empty
    ? "Kecocokan kata kunci: isi deskripsi lowongan di langkah Target Pekerjaan untuk melihat angkanya"
    : `Kecocokan kata kunci dengan deskripsi lowongan: ${score}%`;

  return (
    <Tooltip text={tip}>
    <div tabIndex={0} className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-lg px-2 py-1 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-label={tip} role="img">
      <div className="relative w-6 h-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle className="stroke-current text-primary/20" cx="18" cy="18" fill="none" r="16" strokeWidth="3" />
          <circle
            className="stroke-current text-primary"
            cx="18" cy="18" fill="none" r="16"
            strokeDasharray={circumference.toFixed(2)}
            strokeDashoffset={offset.toFixed(2)}
            strokeLinecap="round" strokeWidth="3"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-primary">{empty ? "–" : `${score}%`}</span>
      </div>
      <span className="text-[10px] font-semibold text-on-surface-variant whitespace-nowrap">{t("ring.keywords")}</span>
    </div>
    </Tooltip>
  );
}