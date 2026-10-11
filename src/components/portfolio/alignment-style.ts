import type { CSSProperties } from "react";
import type { SectionId } from "./types";

const ALLOWED = ["left", "center", "right"];

/**
 * Petakan peta perataan (alignment per section, dari draft maupun payload
 * publish) ke properti sectionStyle PortfolioDocument. Nilai di luar
 * kiri/tengah/kanan dibuang supaya tidak pernah masuk inline style.
 */
export function alignmentToSectionStyle(
  alignment: Record<string, "left" | "center" | "right"> | undefined,
): Partial<Record<SectionId, CSSProperties>> | undefined {
  if (!alignment) return undefined;
  const entries = Object.entries(alignment).filter(([, v]) =>
    ALLOWED.includes(v),
  );
  if (entries.length === 0) return undefined;
  return Object.fromEntries(
    entries.map(([id, textAlign]) => [id, { textAlign }]),
  ) as Partial<Record<SectionId, CSSProperties>>;
}
