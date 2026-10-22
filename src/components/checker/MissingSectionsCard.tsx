"use client";

import { CopyButton } from "./CopyButton";
import type { MissingSection } from "./types";

/**
 * Kartu "Section yang belum ada" (prompt 4).
 *
 * Item dari mapper sudah berbentuk objek { name, why_it_matters?,
 * template_copy_text? } — string lama dinormalkan jadi { name }, jadi entri
 * format lama tampil namanya tanpa tombol salin (tidak ada template-nya).
 * Tanpa item, kartu tidak dirender sama sekali.
 *
 * Teks UI hardcoded Bahasa Indonesia: blok baru belum punya kunci i18n.
 */
export function MissingSectionsCard({ items }: { items?: MissingSection[] | null }) {
  const list = (items ?? []).filter((item) => item && typeof item.name === "string" && item.name.trim().length > 0);
  if (list.length === 0) return null;

  return (
    <section
      aria-label="Section yang belum ada"
      className="rounded-[18px] border-[2.5px] border-ink bg-paper p-6 shadow-hard"
    >
      <h2 className="font-headline-md text-headline-md text-ink">Section yang belum ada</h2>
      <p className="mt-1 text-body-md text-ink-soft">
        Bagian ini sering dicari HR; tambahkan hanya bila memang relevan dengan pengalamanmu.
      </p>
      <ul className="mt-3 space-y-3">
        {list.map((item, index) => (
          <li key={index} className="border-l-2 border-ink/15 pl-3">
            <p className="text-body-md font-semibold text-ink">{item.name}</p>
            {item.why_it_matters ? (
              <p className="mt-0.5 text-body-sm text-ink-soft">{item.why_it_matters}</p>
            ) : null}
            {/* Salin template hanya bila item memang objek dengan template. */}
            {item.template_copy_text ? (
              <div className="mt-1.5">
                <CopyButton text={item.template_copy_text} label="Salin template" />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
