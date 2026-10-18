"use client";

import { useId } from "react";
import { useTranslation, type Lang } from "@/lib/i18n";
import { buildHrPointOfView, type HrFinding } from "@/lib/checker/hr-point-of-view";
import type { AnalysisResult } from "./types";

type Bilingual = { id: string; en: string };

type Severity = NonNullable<HrFinding["severity"]>;

// Keempat label severity sengaja satu bentuk: kata sifat yang naik-turun
// gradasi, dari "Rendah" sampai "Berat banget". Kalau cuma satu yang berupa
// klausa, tingkat lain terdengar seperti kategori sedangkan yang pertama
// terdengar seperti catatan pribadi.
const SEVERITY_LABEL: Record<Severity, Bilingual> = {
  critical: { id: "Berat banget", en: "Very serious" },
  high: { id: "Tinggi", en: "High" },
  medium: { id: "Sedang", en: "Medium" },
  low: { id: "Rendah", en: "Low" },
};

// Severity juga dibedakan secara visual supaya yang "Berat banget" kelihatan
// sekilas. Pembedaan memakai token ukuran dan warna yang sudah membawa weight
// sendiri, bukan utilitas font-weight yang bisa kalah urutan dari token teks.
// Kata severity tetap ada di semua tingkat: orang yang tidak membedakan warna
// tetap membaca tingkatnya, bukan hanya warnanya.
const SEVERITY_STYLE: Record<Severity, string> = {
  critical: "text-label-bold text-error",
  high: "text-label-sm text-on-background",
  medium: "text-label-sm text-on-surface-variant",
  low: "text-label-sm text-on-surface-variant",
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

function FindingList({
  findings,
  lang,
  emptyText,
}: {
  findings: HrFinding[];
  lang: Lang;
  /** Kalimat jujur untuk kolom yang memang kosong, bukan sekadar ruang kosong. */
  emptyText: string;
}) {
  // Judul kolom selalu tampil, jadi kolom kosong harus menjelaskan dirinya
  // sendiri: tanpa kalimat, judul tebal di atas area hampa terbaca seperti
  // panel yang belum selesai dimuat.
  if (findings.length === 0) {
    return <p className="mt-2 text-body-md text-on-surface-variant">{emptyText}</p>;
  }
  return (
    <ul className="mt-2 space-y-3">
      {findings.map((finding, index) => (
        <li key={`${finding.text}-${index}`} className="border-l-2 border-outline-variant/60 pl-3">
          <p className="text-body-md text-on-background">{finding.text}</p>
          {finding.severity ? (
            <p className={`mt-1 ${SEVERITY_STYLE[finding.severity]}`}>
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
  // Id dibuat per-instance: panel yang sama bisa muncul dua kali di satu
  // halaman, dan aria-labelledby yang menunjuk id ganda menunjuk heading yang
  // salah untuk pembaca screen reader.
  const titleId = useId();
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
    <section aria-labelledby={titleId} className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
      {/* Headline-md, bukan token yang lebih kecil: preflight membuat heading
          mewarisi ukuran body, jadi kelas yang tidak ada di config membuat
          judul panel jadi lebih kecil dari judul kolom di bawahnya. */}
      <h2 id={titleId} className="font-headline-md text-headline-md text-on-background">
        {t(`${keyPrefix}hrview-title`)}
      </h2>
      <p className="mt-1 text-body-md text-on-surface-variant">{t(`${keyPrefix}hrview-subtitle`)}</p>

      {/* Level dan arah karier bukan temuan, jadi tetap tampil walau daftar
          temuan kosong. Sembunyikan keduanya dan panel jadi kehilangan
          informasi yang paling sering dibutuhkan pembaca. */}
      {view.seniority ? (
        <p className="mt-3 text-label-bold text-on-surface-variant">
          {t(`${keyPrefix}hrview-level`)}: {pick(LEVEL_LABEL[view.seniority])}
        </p>
      ) : null}

      {view.isEmpty ? (
        <p className="mt-4 text-body-md text-on-surface-variant">{t(`${keyPrefix}hrview-empty`)}</p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="text-label-bold text-on-background">{t(`${keyPrefix}hrview-stopping`)}</h3>
            <FindingList
              findings={view.stopping}
              lang={lang}
              emptyText={t(`${keyPrefix}hrview-stopping-empty`)}
            />
          </div>
          <div>
            <h3 className="text-label-bold text-on-background">{t(`${keyPrefix}hrview-continuing`)}</h3>
            <FindingList
              findings={view.continuing}
              lang={lang}
              emptyText={t(`${keyPrefix}hrview-continuing-empty`)}
            />
          </div>
        </div>
      )}

      {journey ? (
        <p className="mt-4 border-t border-outline-variant/50 pt-3 text-body-md text-on-surface-variant">
          {journey}
        </p>
      ) : null}
    </section>
  );
}
