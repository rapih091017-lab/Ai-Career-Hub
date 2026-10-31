import type { CertificationEntry, SkillEntry } from "@/components/cv-templates";

/**
 * Logika tampilan section Keahlian & Sertifikasi yang dipakai bersama oleh
 * pratinjau dan PDF builder; keduanya dirender oleh AtsBaseRenderer.
 */

export const SKILL_LEVEL_LABELS: Record<"id" | "en", Record<Exclude<SkillEntry["level"], "">, string>> = {
  id: { beginner: "Pemula", intermediate: "Menengah", advanced: "Mahir" },
  en: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
};

const CATEGORY_ORDER = ["technical", "soft", "tools"] as const;

/** "React (Mahir)" bila showLevel dan level terisi; selain itu nama saja. */
export function formatSkill(skill: SkillEntry, showLevel: boolean, lang: "id" | "en"): string {
  const name = skill.name.trim();
  if (!showLevel || !skill.level) return name;
  const label = SKILL_LEVEL_LABELS[lang][skill.level];
  return label ? `${name} (${label})` : name;
}

/** Kelompokkan skill bernama per kategori. Kategori tanpa skill bernama dibuang. */
export function groupNamedSkills(skills: SkillEntry[]): [string, SkillEntry[]][] {
  const groups: Record<string, SkillEntry[]> = { technical: [], soft: [], tools: [] };
  for (const s of skills) {
    if (!s.name?.trim()) continue;
    const cat = s.category && s.category in groups ? s.category : "technical";
    groups[cat].push(s);
  }
  return CATEGORY_ORDER.map((c) => [c, groups[c]] as [string, SkillEntry[]]).filter(([, list]) => list.length > 0);
}

/** Sertifikasi yang punya nama. */
export function namedCertifications(certs: CertificationEntry[] | undefined): CertificationEntry[] {
  return (certs ?? []).filter((c) => c.name?.trim());
}

/** "Nama · Penerbit (Tahun)". */
export function formatCertification(c: CertificationEntry): string {
  return `${c.name.trim()}${c.issuer?.trim() ? ` · ${c.issuer.trim()}` : ""}${c.year?.trim() ? ` (${c.year.trim()})` : ""}`;
}
