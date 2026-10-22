"use client";

import { useId, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { buildHrPointOfView, type HrFinding } from "@/lib/checker/hr-point-of-view";
import { CopyButton } from "./CopyButton";
import {
  severityMeta,
  type AnalysisResult,
  type HrFlag,
  type HrScanStatus,
  type KnockoutStatus,
} from "./types";

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
    return <p className="mt-2 text-body-md text-ink-soft">{emptyText}</p>;
  }
  return (
    <ul className="mt-2 space-y-3">
      {findings.map((finding, index) => {
        // Lencana memakai severityMeta supaya warna dan labelnya sama persis
        // dengan kartu Skor Per Section; kata severity tetap ada di lencana,
        // jadi pembaca yang tidak membedakan warna tetap membaca tingkatnya.
        const badge = severityMeta(finding.severity ?? undefined, t);
        return (
          <li key={`${finding.text}-${index}`} className="border-l-2 border-ink/15 pl-3">
            <p className="text-body-md text-ink">{finding.text}</p>
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
              <p className="mt-1.5 whitespace-pre-wrap break-words rounded-md border-l-2 border-ink/15 bg-surface-container-low px-2 py-1 text-label-sm italic text-ink-soft">
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

/* ══ Panel HR v5 (prompt 3) ═══════════════════════════════════════════
   Blok tambahan: scan 30 detik, red/green flag berbukti, pertanyaan HR,
   risiko syarat wajib, dan format durasi kerja. Teks di sini hardcoded
   Bahasa Indonesia — blok baru belum punya kunci i18n dan prompt 3 melarang
   mengubah file lain. Setiap blok muncul hanya kalau datanya ada, jadi baris
   lama tampil persis seperti sebelumnya tanpa kotak kosong. */

const HR_SCAN_ORDER = ["last_title", "total_experience", "top_achievement", "key_skills"] as const;

const HR_SCAN_LABEL: Record<(typeof HR_SCAN_ORDER)[number], string> = {
  last_title: "Jabatan terakhir",
  total_experience: "Total pengalaman",
  top_achievement: "Pencapaian utama",
  key_skills: "Kunci keahlian",
};

const SCAN_STATUS: Record<HrScanStatus, { label: string; cls: string }> = {
  terbaca: { label: "Terbaca", cls: "border-green-deep/40 bg-primary-fixed text-on-primary-fixed" },
  samar: { label: "Samar", cls: "border-tertiary/50 bg-tertiary-container text-on-tertiary-container" },
  tidak_terbaca: { label: "Tidak terbaca", cls: "border-error/50 bg-error-container text-on-error-container" },
};

const KNOCKOUT_STATUS: Record<KnockoutStatus, { label: string; cls: string }> = {
  terpenuhi: { label: "Terpenuhi", cls: "border-green-deep/40 bg-primary-fixed text-on-primary-fixed" },
  belum_terlihat: { label: "Belum terlihat", cls: "border-tertiary/50 bg-tertiary-container text-on-tertiary-container" },
  tidak_ada: { label: "Tidak ada", cls: "border-error/50 bg-error-container text-on-error-container" },
};

/** Bukti CV ditampilkan sebagai kutipan, satu gaya dengan FindingList. */
function EvidenceQuote({ text }: { text: string }) {
  return (
    <p className="mt-1.5 whitespace-pre-wrap break-words rounded-md border-l-2 border-ink/15 bg-surface-container-low px-2 py-1 text-label-sm italic text-ink-soft">
      {"\u201C"}
      {text}
      {"\u201D"}
    </p>
  );
}

function FlagItem({ flag }: { flag: HrFlag }) {
  return (
    <li
      className={`border-l-2 pl-3 ${flag.type === "red" ? "border-error/50" : "border-green-deep/40"}`}
    >
      <p className="text-body-md text-ink">{flag.label}</p>
      {flag.evidence ? <EvidenceQuote text={flag.evidence} /> : null}
      {flag.fix ? (
        <div className="mt-1.5">
          {flag.fix.replaces ? (
            <p className="text-label-sm text-ink-soft">
              Mengganti: <span className="italic">{flag.fix.replaces}</span>
            </p>
          ) : null}
          <CopyButton text={flag.fix.copy_text} label="Salin perbaikan" />
        </div>
      ) : null}
    </li>
  );
}

/** Akordeon pertanyaan HR: satu terbuka pada satu waktu, aria-expanded benar. */
function HrQuestionsAccordion({ questions }: { questions: NonNullable<AnalysisResult["hrQuestions"]> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <ul className="mt-2 divide-y divide-ink/10 rounded-xl border-[1.5px] border-ink/15 bg-surface-container-low">
      {questions.map((item, index) => {
        const open = openIndex === index;
        return (
          <li key={index}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : index)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-body-md font-semibold text-ink"
            >
              {item.question}
              <span
                className={`material-symbols-outlined select-none text-lg transition-transform ${open ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                expand_more
              </span>
            </button>
            {open ? (
              <div className="space-y-1 px-3 pb-3 text-body-sm text-ink-soft">
                {item.why_asked ? (
                  <p>
                    <span className="font-bold text-ink">Kenapa ditanyakan: </span>
                    {item.why_asked}
                  </p>
                ) : null}
                {item.answer_tip ? (
                  <p>
                    <span className="font-bold text-ink">Tips menjawab: </span>
                    {item.answer_tip}
                  </p>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/** Blok tambahan panel HR; seluruhnya kondisional terhadap data. */
function HrPanelExtra({ result }: { result: AnalysisResult }) {
  const hrScan = result.hrScan ?? null;
  const hrFlags = result.hrFlags ?? [];
  const hrQuestions = result.hrQuestions ?? [];
  const knockoutRisks = result.knockoutRisks ?? [];
  const durationRewrite = result.durationRewrite ?? null;

  const redFlags = hrFlags.filter((flag) => flag.type === "red");
  const greenFlags = hrFlags.filter((flag) => flag.type === "green");
  const hasAny =
    hrScan !== null ||
    hrFlags.length > 0 ||
    hrQuestions.length > 0 ||
    knockoutRisks.length > 0 ||
    durationRewrite !== null;
  if (!hasAny) return null;

  return (
    <div className="mt-5 space-y-5 border-t-[1.5px] border-ink/10 pt-5">
      {/* ── 1. Scan 30 detik ── */}
      {hrScan ? (
        <div>
          <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-green-deep">
            Yang HR tangkap dalam 30 detik
          </h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {HR_SCAN_ORDER.map((key) => {
              const field = hrScan[key];
              if (!field) return null;
              const status = SCAN_STATUS[field.status];
              return (
                <div key={key} className="rounded-xl border-[1.5px] border-ink/15 bg-surface-container-low p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-label-sm font-bold uppercase tracking-wide text-ink-soft">
                      {HR_SCAN_LABEL[key]}
                    </p>
                    <span
                      className={`shrink-0 rounded-full border-[1.5px] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${status.cls}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  {field.value ? (
                    <p className="mt-1 text-body-md text-ink">{field.value}</p>
                  ) : (
                    <p className="mt-1 text-body-sm text-ink-soft">CV tidak menyebutkannya.</p>
                  )}
                  {field.note ? (
                    <p className="mt-1 text-label-sm text-ink-soft">{field.note}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ── 2. Red/green flag berbukti ── */}
      {hrFlags.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-error">
              Perlu diperiksa
            </h3>
            {redFlags.length === 0 ? (
              <p className="mt-2 text-body-md text-ink-soft">Tidak ada.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {redFlags.map((flag, index) => (
                  <FlagItem key={index} flag={flag} />
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-green-deep">
              Patut dipertahankan
            </h3>
            {greenFlags.length === 0 ? (
              <p className="mt-2 text-body-md text-ink-soft">Tidak ada.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {greenFlags.map((flag, index) => (
                  <FlagItem key={index} flag={flag} />
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {/* ── 3. Pertanyaan yang kemungkinan ditanyakan HR ── */}
      {hrQuestions.length > 0 ? (
        <div>
          <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-green-deep">
            Pertanyaan yang kemungkinan ditanyakan HR
          </h3>
          <HrQuestionsAccordion questions={hrQuestions} />
        </div>
      ) : null}

      {/* ── 4. Risiko syarat wajib ── */}
      {knockoutRisks.length > 0 ? (
        <div>
          <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-error">
            Risiko syarat wajib
          </h3>
          <ul className="mt-2 space-y-3">
            {knockoutRisks.map((risk, index) => {
              const status = KNOCKOUT_STATUS[risk.status];
              return (
                <li key={index} className="border-l-2 border-ink/15 pl-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-body-md text-ink">{risk.requirement}</p>
                    <span
                      className={`shrink-0 rounded-full border-[1.5px] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${status.cls}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  {risk.evidence ? <EvidenceQuote text={risk.evidence} /> : null}
                  {risk.tip ? <p className="mt-1.5 text-body-sm text-ink-soft">{risk.tip}</p> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* ── 5. Kartu format durasi kerja ── */}
      {durationRewrite ? (
        <div className="rounded-xl border-[1.5px] border-ink/15 bg-surface-container-low p-4">
          <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-green-deep">
            Format durasi kerja
          </h3>
          <p className="mt-2 text-body-md text-ink">{durationRewrite.copy_text}</p>
          {durationRewrite.replaces ? (
            <p className="mt-1 text-label-sm text-ink-soft">
              Mengganti: <span className="italic">{durationRewrite.replaces}</span>
            </p>
          ) : null}
          <div className="mt-2">
            <CopyButton text={durationRewrite.copy_text} label="Salin format" />
          </div>
          {/* Catatan statis dari brief: jujur soal durasi yang dihitung. */}
          <p className="mt-2 text-label-sm text-ink-soft">
            Tetap jujur. Pertahankan tahun jika portal lowongan memintanya.
          </p>
        </div>
      ) : null}
    </div>
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
      className="rounded-[18px] border-[2.5px] border-ink bg-paper p-6 shadow-hard"
    >
      {/* Headline-md, bukan token yang lebih kecil: preflight membuat heading
          mewarisi ukuran body, jadi kelas yang tidak ada di config membuat
          judul panel jadi lebih kecil dari judul kolom di bawahnya. */}
      <h2 id={titleId} className="font-headline-md text-headline-md text-ink">
        {t(`${keyPrefix}hrview-title`)}
      </h2>
      <p className="mt-1 text-body-md text-ink-soft">{t(`${keyPrefix}hrview-subtitle`)}</p>

      {/* Level dan arah karier bukan temuan, jadi tetap tampil walau daftar
          temuan kosong. Sembunyikan keduanya dan panel jadi kehilangan
          informasi yang paling sering dibutuhkan pembaca. */}
      {view.seniority ? (
        <p className="mt-3 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-green-deep">
          {/* Tanpa titik-kolon: pemisah nilai begitu membaca seperti label
              sistem, bukan seperti orang yang sedang menyebut posisi kandidat. */}
          {t(`${keyPrefix}hrview-level`).replace("{level}", pick(LEVEL_LABEL[view.seniority]))}
        </p>
      ) : null}

      {journey ? <p className="mt-1 text-body-md text-ink-soft">{journey}</p> : null}

      {/* Kesimpulan didahulukan: pembaca yang cemas ingin jawabannya dulu,
          baru buktinya. Panel kosong sudah punya kalimat sendiri. */}
      {!view.isEmpty ? <p className="mt-3 text-body-md font-semibold text-ink">{verdict}</p> : null}

      {view.isEmpty ? (
        <p className="mt-4 text-body-md text-ink-soft">{t(`${keyPrefix}hrview-empty`)}</p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-error">{t(`${keyPrefix}hrview-stopping`)}</h3>
            <FindingList
              findings={view.stopping}
              t={t}
              emptyText={t(`${keyPrefix}hrview-stopping-empty`)}
            />
          </div>
          <div>
            <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-green-deep">{t(`${keyPrefix}hrview-continuing`)}</h3>
            <FindingList
              findings={view.continuing}
              t={t}
              emptyText={t(`${keyPrefix}hrview-continuing-empty`)}
            />
          </div>
        </div>
      )}

      {/* Blok v5 (prompt 3): semua kondisional, jadi baris lama tidak
          mendapat kotak kosong. */}
      {result ? <HrPanelExtra result={result} /> : null}
    </section>
  );
}
