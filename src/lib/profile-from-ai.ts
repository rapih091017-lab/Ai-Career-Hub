/**
 * Profil master dari hasil parse teks CV (generator AI yang sudah
 * dinormalisasi di cv-documents/create). Hanya field yang benar-benar ada
 * yang diisi; level skill yang tidak valid dibuang, bukan diganti default.
 */

type Str = string | null | undefined;

export interface NormalizedAiCv {
  personalInfo: Record<string, Str>;
  workHistory: Array<{ position?: Str; company?: Str; startDate?: Str; endDate?: Str; description?: Str }>;
  education: Array<{ institution?: Str; degree?: Str; field?: Str; startDate?: Str; endDate?: Str; gpa?: Str }>;
  skills: Array<{ name?: Str; level?: Str }>;
  certifications: Array<{ name?: Str; issuer?: Str; year?: Str }>;
}

const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const txt = (v: Str) => (typeof v === "string" && v.trim() ? v.trim() : null);
const newId = () => (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function profileFromAiData(ai: NormalizedAiCv) {
  const p = ai.personalInfo ?? {};
  const personalInfo = {
    fullName: txt(p.fullName),
    phone: txt(p.phone),
    email: txt(p.email),
    address: txt(p.address),
    linkedin: txt(p.linkedin),
    portfolioUrl: txt(p.portfolioUrl),
    summary: txt(p.summary),
  };
  const workHistory = (ai.workHistory ?? [])
    .filter((w) => txt(w.position) || txt(w.company))
    .map((w) => ({
      id: newId(),
      company: txt(w.company) ?? "",
      position: txt(w.position) ?? "",
      startDate: txt(w.startDate),
      endDate: txt(w.endDate),
      description: txt(w.description),
    }));
  const education = (ai.education ?? [])
    .filter((e) => txt(e.institution))
    .map((e) => ({
      id: newId(),
      institution: txt(e.institution) ?? "",
      degree: txt(e.degree) ?? "",
      field: txt(e.field),
      startDate: txt(e.startDate),
      endDate: txt(e.endDate),
      ...(txt(e.gpa) ? { gpa: txt(e.gpa) } : {}),
    }));
  const skills = (ai.skills ?? [])
    .filter((s) => txt(s.name))
    .map((s) => {
      const level = SKILL_LEVELS.find((l) => l === s.level);
      return { id: newId(), name: txt(s.name) ?? "", ...(level ? { level } : {}) };
    });
  const certifications = (ai.certifications ?? [])
    .filter((c) => txt(c.name))
    .map((c) => ({ id: newId(), name: txt(c.name) ?? "", issuer: txt(c.issuer) ?? "", year: txt(c.year) ?? "" }));

  const hasPersonal = Object.values(personalInfo).some(Boolean);
  return {
    personalInfo: hasPersonal ? personalInfo : null,
    workHistory: workHistory.length ? workHistory : null,
    education: education.length ? education : null,
    skills: skills.length ? skills : null,
    certifications: certifications.length ? certifications : null,
  };
}

/** Profil dianggap berisi bila ada nama, pengalaman, atau pendidikan. */
export function profileHasContent(profile: ReturnType<typeof profileFromAiData>): boolean {
  return Boolean(profile.personalInfo?.fullName || profile.workHistory || profile.education);
}
