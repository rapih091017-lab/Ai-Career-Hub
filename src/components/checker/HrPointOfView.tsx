"use client";

import { useTranslation, type Lang } from "@/lib/i18n";
import { buildHrPointOfView, type HrFinding } from "@/lib/checker/hr-point-of-view";
import type { AnalysisResult } from "./types";

type Bilingual = { id: string; en: string };

const SEVERITY_LABEL: Record<NonNullable<HrFinding["severity"]>, Bilingual> = {
  critical: { id: "Bikin berhenti total", en: "Hard stop" },
  high: { id: "Tinggi", en: "High" },
  medium: { id: "Sedang", en: "Medium" },
  low: { id: "Ringan", en: "Low" },
};

const LEVEL_LABEL = {
  entry: { id: "entry", en: "entry" },
  mid: { id: "menengah", en: "mid" },
  senior: { id: "senior", en: "senior" },
  lead: { id: "lead", en: "lead" },
} as const satisfies Record<string, Bilingual>;

const PROGRESSION_LABEL = {
  "Strong Upward": { id: "naik tajam", en: "rising sharply" },
  Upward: { id: "naik", en: "rising" },
  Stable: { id: "datar", en: "flat" },
  Sideways: { id: "menyamping", en: "sideways" },
  Declining: { id: "turun", en: "declining" },
} as const satisfies Record<string, Bilingual>;

const GROWTH_LABEL = {
  Fast: { id: "pesat", en: "fast" },
  Normal: { id: "wajar", en: "steady" },
  Slow: { id: "pelan", en: "slow" },
} as const satisfies Record<string, Bilingual>;

function FindingList({ findings, lang }: { findings: HrFinding[]; lang: Lang }) {
  // Kolom tanpa temuan sengaja dikosongkan: judulnya tetap muncul supaya
  // terbaca "tidak ada yang bikin saya berhenti", bukan "tidak ada yang dicek".
  if (findings.length === 0) return null;
  return (
    <ul className="space-y-3">
      {findings.map((finding, index) => (
        <li key={`${finding.text}-${index}`} className="border-l-2 border-outline-variant/60 pl-3">
          <p className="text-body-sm text-on-background">{finding.text}</p>
          {finding.severity ? (
            <p className="mt-1 text-label-sm text-on-surface-variant">
              {SEVERITY_LABEL[finding.severity][lang]}
            </p>
          ) : null}
          {finding.quote ? (
            // Kutipan tidak boleh dipotong: setengah kutipan lebih buruk
            // daripada tidak mengomentari, jadi biarkan saja membungkus.
            <p className="mt-1.5 whitespace-pre-wrap break-words font-mono text-label-sm text-on-surface-variant">
              {finding.quote}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * Panel pandangan sisi HR.
 *
 * Ditaruh paling atas hasil, sebelum angka, karena pertanyaan yang membuat
 * orang membuka halaman ini adalah "kep-view nggak sama HR?" bukan "skornya
 * berapa?".
 */
export default function HrPointOfView({
  result,
  keyPrefix = "checker.",
}: {
  result: AnalysisResult | null;
  /** Prefix kunci i18n: "checker." atau "checker.detail.". */
  keyPrefix?: string;
}) {
  const { t, lang } = useTranslation();
  const pick = (value: Bilingual) => (lang === "en" ? value.en : value.id);
  const view = buildHrPointOfView(result);

  // Arah dan laju boleh salah satu saja. Tiap bagian dirakit sendiri-sendiri
  // supaya bagian yang kosong hilang utuh, bukan menyisakan kata tanpa isi.
  const journey = [
    view.progression ? `${t(`${keyPrefix}hrview-journey`)}: ${pick(PROGRESSION_LABEL[view.progression])}` : null,
    view.growthRate ? `${t(`${keyPrefix}hrview-pace`)}: ${pick(GROWTH_LABEL[view.growthRate])}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(" · ");

  return (
    <section aria-labelledby="hrview-title" className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
      <h2 id="hrview-title" className="font-headline-sm text-headline-sm text-on-background">
        {t(`${keyPrefix}hrview-title`)}
      </h2>
      <p className="mt-1 text-body-sm text-on-surface-variant">{t(`${keyPrefix}hrview-subtitle`)}</p>

      {/* Level dan perjalanan bukan temuan, jadi tetap tampil walau daftar
          temuan kosong. Sembunyikan keduanya dan panel jadi kehilangan
          informasi yang paling sering dibutuhkan pembaca. */}
      {view.seniority ? (
        <p className="mt-3 text-label-bold text-on-surface-variant">
          {t(`${keyPrefix}hrview-level`)}: {pick(LEVEL_LABEL[view.seniority])}
        </p>
      ) : null}

      {view.isEmpty ? (
        <p className="mt-4 text-body-sm text-on-surface-variant">{t(`${keyPrefix}hrview-empty`)}</p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="text-label-bold text-on-background">{t(`${keyPrefix}hrview-stopping`)}</h3>
            <div className="mt-2">
              <FindingList findings={view.stopping} lang={lang} />
            </div>
          </div>
          <div>
            <h3 className="text-label-bold text-on-background">{t(`${keyPrefix}hrview-continuing`)}</h3>
            <div className="mt-2">
              <FindingList findings={view.continuing} lang={lang} />
            </div>
          </div>
        </div>
      )}

      {journey ? (
        <p className="mt-4 border-t border-outline-variant/50 pt-3 text-body-sm text-on-surface-variant">
          {journey}
        </p>
      ) : null}
    </section>
  );
}