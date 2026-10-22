"use client";

import { CopyButton } from "./CopyButton";
import type { KeywordAnalysis, KeywordPlacement, KeywordRequirement } from "./types";

/**
 * Elemen tambahan panel keyword (prompt 5), semua kondisional terhadap data:
 * baris lama tanpa field baru tidak mendapat elemen apa pun.
 *
 * Bahasa desain mengikuti panel checker yang sudah ada: kartu `border-ink`,
 * chip `border-[1.5px]` dengan token warna tema, heading kapital kecil
 * `text-xs`, ikon material-symbols. Teks UI Bahasa Indonesia (belum ada
 * kunci i18n untuk blok baru).
 */

const SOURCE_META = {
  job_description: {
    icon: "content_paste",
    label: "Dihitung dari lowongan yang kamu tempel",
  },
  role_generic: {
    icon: "work",
    label: "Dihitung dari kebutuhan umum role ini",
  },
} as const;

/**
 * Chip sumber + keterangan kedekatan skor. Muncul hanya kalau `source` ada
 * (dihitung route); baris lama tidak punya source, jadi panelnya tak berubah.
 */
export function KeywordSourceLine({ analysis }: { analysis: KeywordAnalysis | null | undefined }) {
  if (!analysis?.source) return null;
  const meta = SOURCE_META[analysis.source];
  if (!meta) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink/20 bg-surface-container-low px-2.5 py-1 text-xs font-semibold text-ink">
        <span className="material-symbols-outlined select-none text-[14px]" aria-hidden="true">
          {meta.icon}
        </span>
        {meta.label}
      </span>
      <span className="text-xs text-ink-soft">Kecocokan kata kunci, bukan skor ATS resmi</span>
    </div>
  );
}

const EVIDENCE_META = {
  dibuktikan: {
    icon: "verified",
    label: "Terbukti di pengalaman",
    cls: "border-green-deep/40 bg-primary-fixed text-on-primary-fixed",
  },
  hanya_daftar_skill: {
    icon: "list",
    label: "Hanya daftar skill",
    cls: "border-tertiary/50 bg-tertiary-container text-on-tertiary-container",
  },
} as const;

/**
 * Badge bukti untuk satu keyword matched. Tanpa entri evidence (baris lama)
 * menghasilkan null, jadi chip keyword tetap tampil sendirian seperti sebelumnya.
 * Kutipan CV yang menyertai badge dibuat `title`, bukan blok terpisah: badge
 * harus sekecil chip di sebelahnya, tidak menggandakan panel kutipan.
 */
export function KeywordEvidenceBadge({
  analysis,
  keyword,
}: {
  analysis: KeywordAnalysis | null | undefined;
  keyword: string;
}) {
  const entry = analysis?.evidence?.find(
    (item) => item.keyword.toLowerCase() === keyword.toLowerCase(),
  );
  if (!entry) return null;
  const meta = EVIDENCE_META[entry.level];
  if (!meta) return null;
  return (
    <span
      title={entry.excerpt ? `Bukti: ${entry.excerpt}` : undefined}
      className={`inline-flex items-center gap-1 rounded-full border-[1.5px] px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${meta.cls}`}
    >
      <span className="material-symbols-outlined select-none text-xs" aria-hidden="true">
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}

const PLACEMENT_CHIP = {
  critical: "border-error/50 bg-error-container text-on-error-container",
  nice: "border-tertiary/50 bg-tertiary-container text-on-tertiary-container",
} as const;

const PLACEMENT_LABEL = { critical: "Kritis", nice: "Pelengkap" } as const;

function PlacementCard({ placement }: { placement: KeywordPlacement }) {
  return (
    <div className="rounded-xl border-[1.5px] border-ink/15 bg-surface-container-low p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`shrink-0 rounded-full border-[1.5px] px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${PLACEMENT_CHIP[placement.priority]}`}
        >
          {PLACEMENT_LABEL[placement.priority]}
        </span>
        <span className="min-w-0 text-sm font-bold text-ink">{placement.keyword}</span>
      </div>
      <p className="mt-1.5 text-xs text-ink-soft">
        <span className="font-bold text-green-deep">Ganti di: </span>
        {placement.where}
      </p>
      {placement.replaces ? (
        <p className="mt-0.5 text-xs text-ink-soft">
          Teks lama: <span className="italic">{placement.replaces}</span>
        </p>
      ) : null}
      <div className="mt-2 rounded-md border border-ink/10 bg-paper px-2.5 py-1.5 text-xs leading-relaxed text-ink">
        {placement.copy_text}
      </div>
      <div className="mt-2">
        <CopyButton text={placement.copy_text} label="Salin revisi" />
      </div>
    </div>
  );
}

const REQUIREMENT_CHIP = {
  terpenuhi: { label: "Terpenuhi", cls: "border-green-deep/40 bg-primary-fixed text-on-primary-fixed" },
  sebagian: { label: "Sebagian", cls: "border-tertiary/50 bg-tertiary-container text-on-tertiary-container" },
  tidak_ada: { label: "Tidak ada", cls: "border-error/50 bg-error-container text-on-error-container" },
} as const;

function RequirementsTable({ requirements }: { requirements: KeywordRequirement[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border-[1.5px] border-ink/15">
      <table className="w-full min-w-[420px] border-collapse text-left align-top">
        <thead>
          <tr className="bg-surface-container-low text-xs font-extrabold uppercase tracking-[0.06em] text-ink-soft">
            <th className="px-3 py-2">Syarat</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Bukti / catatan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {requirements.map((risk, index) => {
            const chip = REQUIREMENT_CHIP[risk.status];
            return (
              <tr key={index}>
                <td className="px-3 py-2 text-xs font-semibold text-ink">{risk.requirement}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex shrink-0 rounded-full border-[1.5px] px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${chip.cls}`}
                  >
                    {chip.label}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-ink-soft">
                  {risk.evidence ? <span className="italic">&ldquo;{risk.evidence}&rdquo;</span> : null}
                  {risk.tip ? <p className={risk.evidence ? "mt-1" : undefined}>{risk.tip}</p> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Blok penempatan + tabel syarat lowongan. `requirements` hanya dirender bila
 * sumbernya memang lowongan (guard ganda: mapper sudah membuangnya).
 */
export function KeywordExtrasBlock({ analysis }: { analysis: KeywordAnalysis | null | undefined }) {
  const placements = analysis?.placements ?? [];
  const requirements =
    analysis?.source === "job_description" ? (analysis.requirements ?? []) : [];
  if (placements.length === 0 && requirements.length === 0) return null;

  return (
    <div className="mt-4 space-y-5">
      {placements.length > 0 ? (
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-[0.06em] text-green-deep">
            Penempatan untuk keyword yang kurang
          </h3>
          {/* Catatan statis, cukup satu kali untuk semua kartu. */}
          <p className="mt-1 text-xs italic text-ink-soft">
            Tambahkan hanya jika benar-benar kamu kuasai
          </p>
          <div className="mt-2 space-y-2">
            {placements.map((placement, index) => (
              <PlacementCard key={index} placement={placement} />
            ))}
          </div>
        </div>
      ) : null}

      {requirements.length > 0 ? (
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-[0.06em] text-green-deep">
            Syarat dari lowongan
          </h3>
          <div className="mt-2">
            <RequirementsTable requirements={requirements} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
