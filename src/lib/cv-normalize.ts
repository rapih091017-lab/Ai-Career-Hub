import type { CvData, SkillEntry } from "@/components/cv-templates";

export const EMPTY_CV_DATA: CvData = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  linkedin: "",
  portfolioUrl: "",
  summary: "",
  selfEvaluation: "",
  employmentStatus: "",
  jobTitle: "",
  jobDescription: "",
  professionalTitle: "",
  workHistory: [],
  education: [],
  organisations: [],
  skills: [],
  certifications: [],
  customFields: [],
  cvLang: "id",
};

const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const SKILL_CATEGORIES = ["technical", "soft", "tools"] as const;

/** Teks: string dipakai apa adanya, angka diubah ke string, lainnya kosong. */
const str = (v: unknown): string =>
  typeof v === "string" ? v : typeof v === "number" && Number.isFinite(v) ? String(v) : "";

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);

const arr = (v: unknown): Record<string, any>[] => (Array.isArray(v) ? v.filter(isObj) : []);

/** Level tidak valid/kosong → "" (tidak dipaksa "intermediate"). */
export function normalizeSkillLevel(v: unknown): SkillEntry["level"] {
  return (SKILL_LEVELS as readonly string[]).includes(v as string) ? (v as SkillEntry["level"]) : "";
}

function fallbackId(prefix: string, i: number): string {
  return `${prefix}_${i}_${Date.now()}`;
}

const idOf = (item: Record<string, any>, prefix: string, i: number) =>
  typeof item.id === "string" && item.id ? item.id : fallbackId(prefix, i);

/**
 * Normalisasi item secara additive: field yang tidak dikenal dari item asli
 * tetap ada (spread dulu), field yang dikenal di-override dengan nilai aman.
 */
function normalizeLists(src: Record<string, any>) {
  return {
    customFields: arr(src.customFields).map((f, i) => ({
      ...f,
      id: idOf(f, "cf", i),
      label: str(f.label),
      value: str(f.value),
    })),
    workHistory: arr(src.workHistory).map((w, i) => ({
      ...w,
      id: idOf(w, "wh", i),
      position: str(w.position),
      company: str(w.company),
      companyDescription: str(w.companyDescription),
      location: str(w.location),
      startDate: str(w.startDate),
      endDate: str(w.endDate),
      description: str(w.description),
      achievement: str(w.achievement),
      visible: w.visible !== false,
      projectUrl: str(w.projectUrl),
    })),
    education: arr(src.education).map((e, i) => ({
      ...e,
      id: idOf(e, "edu", i),
      institution: str(e.institution),
      degree: str(e.degree),
      field: str(e.field),
      startDate: str(e.startDate),
      endDate: str(e.endDate),
      gpa: str(e.gpa),
      visible: e.visible !== false,
    })),
    organisations: arr(src.organisations).map((o, i) => ({
      ...o,
      id: idOf(o, "org", i),
      name: str(o.name),
      position: str(o.position),
      startDate: str(o.startDate),
      endDate: str(o.endDate),
      description: str(o.description),
      isPresent: o.isPresent === true,
      visible: o.visible !== false,
    })),
    skills: arr(src.skills).map((s, i) => ({
      ...s,
      id: idOf(s, "sk", i),
      name: str(s.name),
      level: normalizeSkillLevel(s.level),
      category: (SKILL_CATEGORIES as readonly string[]).includes(s.category) ? s.category : "technical",
    })),
    certifications: arr(src.certifications).map((c, i) => ({
      ...c,
      id: idOf(c, "cert", i),
      name: str(c.name),
      issuer: str(c.issuer),
      year: str(c.year),
    })),
  };
}

/**
 * Ubah respons GET /api/cv-documents/[id] menjadi CvData builder.
 * Mendukung format lama (bersarang di `personalInfo`) dan format datar.
 * Field tak dikenal dipertahankan agar tidak hilang saat disimpan ulang.
 */
export function normalizeCvDocument(data: unknown): CvData {
  const doc = isObj(data) ? data : {};
  const tc = doc.tailoredContent;
  if (!isObj(tc)) return { ...EMPTY_CV_DATA, customFields: [], workHistory: [], education: [], organisations: [], skills: [], certifications: [] };

  if ("personalInfo" in tc) {
    // personalInfo dibuang setelah diratakan: kalau ikut tersimpan, muat
    // berikutnya akan membaca nilai lama dari sana lagi.
    const { personalInfo, ...rest } = tc;
    const pi = isObj(personalInfo) ? personalInfo : {};
    return {
      ...EMPTY_CV_DATA,
      ...rest,
      fullName: str(pi.fullName),
      phone: str(pi.phone),
      email: str(pi.email),
      address: str(pi.address),
      linkedin: str(pi.linkedin),
      portfolioUrl: str(pi.portfolioUrl),
      summary: str(pi.summary),
      selfEvaluation: str(tc.selfEvaluation) || str(pi.selfEvaluation),
      employmentStatus: str(tc.employmentStatus) || str(pi.employmentStatus),
      professionalTitle: str(pi.professionalTitle),
      jobTitle: str(doc.jobTitle),
      jobDescription: str(doc.jobDescription),
      cvLang: tc.cvLang === "en" ? "en" : "id",
      ...normalizeLists({ ...tc, customFields: tc.customFields ?? pi.customFields }),
    } as CvData;
  }

  return {
    ...EMPTY_CV_DATA,
    ...tc,
    fullName: str(tc.fullName),
    phone: str(tc.phone),
    email: str(tc.email),
    address: str(tc.address),
    linkedin: str(tc.linkedin),
    summary: str(tc.summary),
    jobTitle: str(tc.jobTitle),
    jobDescription: str(tc.jobDescription),
    cvLang: tc.cvLang === "en" ? "en" : "id",
    ...normalizeLists(tc),
  } as CvData;
}

/**
 * Nama skill untuk konteks AI: semua skill bernama kecuali level Pemula.
 * Skill tanpa level tetap ikut (dulu terbuang karena filter hanya
 * menerima intermediate/advanced).
 */
export function aiSkillNames(skills: SkillEntry[]): string[] {
  return skills.filter((s) => s.name.trim() && s.level !== "beginner").map((s) => s.name.trim());
}
