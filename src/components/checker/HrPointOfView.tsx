"use client";

import { useId } from "react";
import { useTranslation } from "@/lib/i18n";
import { buildHrPointOfView, type HrFinding } from "@/lib/checker/hr-point-of-view";
import { severityMeta, type AnalysisResult } from "./types";

type Bilingual = { id: string; en: string };

// Label dan warna severity diambil dari severityMeta, satu-satunya sumber
// yang sudah dipakai SectionScoreCard dan ResultComponents. Menulis ulang 4
// kata dan 4 pasangan warna di sini berarti punya dua tempat untuk dijaga
// berbeda, dan badge di halaman yang sama bisa berbeda isinya.

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
  // "Menyamping" adalah translitliterasi "Sideways"; yang dimaksud memang
  // berhenti bergerak ke atas.
  Sideways: { id: "stagnan", en: "stagnant" },
  Declining: { id: "turun", en: "declining" },
} as const satisfies Record<string, Bilingual>;

const GROWTH_LABEL = {
  Fast: { id: "pesat", en: "fast" },
  // "Wajar" berarti pantas atau masuk akal, bukan kecepatan yang biasa saja.
  Normal: { id: "sedang", en: "steady" },
  Slow: { id: "pelan", en: "slow" },
} as const satisfies Record<string, Bilingual>;

function FindingList({
  findings,
  t,
  emptyText,
}: {
  findings: HrFinding[];
  /** Label severity diambil lewat t supaya pakai kunci yang sama dengan kartu lain. */
  t: (key: string) => string;
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
      {findings.map((finding, index) => {
        // Lencana memakai severityMeta supaya warna dan labelnya sama persis
        // dengan kartu Skor Per Section; kata severity tetap ada di lencana,
        // jadi pembaca yang tidak membedakan warna tetap membaca tingkatnya.
        const badge = severityMeta(finding.severity ?? undefined, t);
        return (
          <li key={`${finding.text}-${index}`} className="border-l-2 border-outline-variant/60 pl-3">
            <p className="text-body-md text-on-background">{finding.text}</p>
            {badge ? (
              <span
                className={`mt-1.5 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badge.cls}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} aria-hidden="true" />
                {badge.label}
              </span>
            ) : null}
            {finding.quote ? (
              // Kutipan tidak dipotong: setengah kutipan lebih buruk daripada
              // tidak mengomentari sama sekali. Tanda kutip dibuka di sini
              // karena tanpa ini teksnya cuma blok monospace abu-abu 12px -
              // ukuran terkecil di halaman dan wajah yang salah untuk kalimat
              // CV beberapa baris, sehingga bukti yang paling berharga itu
              // terbaca seperti keluaran log dan terlewatkan pembaca.
              <p className="mt-1.5 whitespace-pre-wrap break-words rounded-md bg-surface-container-low px-2 py-1 text-label-sm italic text-on-surface-variant">
                {"\u201C"}
                {finding.quote}
                {"\u201D"}
              </p>
            ) : null}
          </li>
        );
      })}
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

  // Arah dan laju karier diletakkan bersama level, bukan di kaki panel. Dulu
  // panel ditutup dengan "Arah karier: turun - pelan" tepat sebelum skor, jadi
  // pembaca yang sedang menunggu hasil keluar di catatan paling rendah. Di
  // posisi ini barisnya jadi konteks pembuka, dan panel berakhir di kolom
  // "lanjut baca".
  const journey = [
    view.progression ? `${t(`${keyPrefix}hrview-journey`)}: ${pick(PROGRESSION_LABEL[view.progression])}` : null,
    view.growthRate ? `${t(`${keyPrefix}hrview-pace`)}: ${pick(GROWTH_LABEL[view.growthRate])}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(" · ");

  // Panel dibuat untuk menjawab satu pertanyaan: apakah HR lanjut membaca.
  // Tanpa kalimat ini pengguna hanya menerima dua daftar dan harus menebak
  // sendiri kesimpulannya. Tiga kasus, dan tidak satu pun mengklaim CV-nya
  // bagus - hanya menyatakan apa yang ada di layar.
  const verdict =
    view.stopping.length === 0
      ? t(`${keyPrefix}hrview-verdict-clear`)
      : view.continuing.length > 0
        ? t(`${keyPrefix}hrview-verdict-mixed`)
        : t(`${keyPrefix}hrview-verdict-stop`);

  return (
    // Kelas kartu sama persis dengan kartu-kartu saudaranya di halaman yang sama
    // (Potensi Peningkatan Skor, Review oleh AI). Tiga dialek kartu berbeda
    // dalam satu halaman membuat panel yang paling penting terlihat paling
    // kurang jadi.
    <section
      aria-labelledby={titleId}
      className="rounded-2xl border border-surface-container-high bg-surface p-6 shadow-premium-md"
    >
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
          {/* Tanpa titik-kolon: pemisah nilai begitu membaca seperti label
              sistem, bukan seperti orang yang sedang menyebut posisi kandidat. */}
          {t(`${keyPrefix}hrview-level`).replace("{level}", pick(LEVEL_LABEL[view.seniority]))}
        </p>
      ) : null}

      {journey ? <p className="mt-1 text-body-md text-on-surface-variant">{journey}</p> : null}

      {/* Kesimpulan didahulukan: pembaca yang cemas ingin jawabannya dulu,
          baru buktinya. Panel kosong sudah punya kalimat sendiri. */}
      {!view.isEmpty ? <p className="mt-3 text-body-md font-medium text-on-background">{verdict}</p> : null}

      {view.isEmpty ? (
        <p className="mt-4 text-body-md text-on-surface-variant">{t(`${keyPrefix}hrview-empty`)}</p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="text-label-bold text-on-background">{t(`${keyPrefix}hrview-stopping`)}</h3>
            <FindingList
              findings={view.stopping}
              t={t}
              emptyText={t(`${keyPrefix}hrview-stopping-empty`)}
            />
          </div>
          <div>
            <h3 className="text-label-bold text-on-background">{t(`${keyPrefix}hrview-continuing`)}</h3>
            <FindingList
              findings={view.continuing}
              t={t}
              emptyText={t(`${keyPrefix}hrview-continuing-empty`)}
            />
          </div>
        </div>
      )}
    </section>
  );
}
