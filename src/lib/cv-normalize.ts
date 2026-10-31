import { newId } from "@/lib/id";
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

// Item tanpa id diberi id baru sekali saat muat; tersimpan oleh autosave berikutnya.
const idOf = (item: Record<string, any>, prefix: string) =>
  typeof item.id === "string" && item.id ? item.id : newId(prefix);

/**
 * Skill bisa tersimpan sebagai array objek, array string ("React"), atau
 * objek per kategori ({ technical: [...], soft: [...] }). Dulu dua bentuk
 * terakhir membuat nama skill hilang (atau builder gagal dimuat).
 */
function rawSkills(v: unknown): Record<string, any>[] {
  const fromList = (list: unknown, category?: string): Record<string, any>[] =>
    Array.isArray(list)
      ? list.flatMap((s) =>
          typeof s === "string"
            ? s.trim() ? [{ name: s.trim(), ...(category ? { category } : {}) }] : []
            : isObj(s) ? [category && !s.category ? { ...s, category } : s] : [],
        )
      : [];
  if (Array.isArray(v)) return fromList(v);
  if (isObj(v)) {
    return [
      ...fromList(v.technical, "technical"),
      ...fromList(v.soft, "soft"),
      ...fromList(v.tools, "tools"),
      ...fromList(v.languages, "tools"),
    ];
  }
  return [];
}

/**
 * Normalisasi item secara additive: field yang tidak dikenal dari item asli
 * tetap ada (spread dulu), field yang dikenal di-override dengan nilai aman.
 */
/** Nilai invalid dibuang (bukan diganti default); renderer menganggap tidak ada = poin. */
function descriptionTypeOf(v: unknown): "bullets" | "paragraph" | undefined {
  return v === "bullets" || v === "paragraph" ? v : undefined;
}

function normalizeLists(src: Record<string, any>) {
  return {
    customFields: arr(src.customFields).map((f) => ({
      ...f,
      id: idOf(f, "cf"),
      label: str(f.label),
      value: str(f.value),
    })),
    workHistory: arr(src.workHistory).map((w) => ({
      ...w,
      id: idOf(w, "wh"),
      position: str(w.position),
      company: str(w.company),
      companyDescription: str(w.companyDescription),
      location: str(w.location),
      startDate: str(w.startDate),
      endDate: str(w.endDate),
      description: str(w.description),
      descriptionType: descriptionTypeOf(w.descriptionType),
      achievement: str(w.achievement),
      visible: w.visible !== false,
      projectUrl: str(w.projectUrl),
    })),
    education: arr(src.education).map((e) => ({
      ...e,
      id: idOf(e, "edu"),
      institution: str(e.institution),
      degree: str(e.degree),
      field: str(e.field),
      startDate: str(e.startDate),
      endDate: str(e.endDate),
      gpa: str(e.gpa),
      visible: e.visible !== false,
    })),
    organisations: arr(src.organisations).map((o) => ({
      ...o,
      id: idOf(o, "org"),
      name: str(o.name),
      position: str(o.position),
      startDate: str(o.startDate),
      endDate: str(o.endDate),
      description: str(o.description),
      descriptionType: descriptionTypeOf(o.descriptionType),
      isPresent: o.isPresent === true,
      visible: o.visible !== false,
    })),
    skills: rawSkills(src.skills).map((s) => ({
      ...s,
      id: idOf(s, "sk"),
      name: str(s.name),
      level: normalizeSkillLevel(s.level),
      category: (SKILL_CATEGORIES as readonly string[]).includes(s.category) ? s.category : "technical",
    })),
    certifications: arr(src.certifications).map((c) => ({
      ...c,
      id: idOf(c, "cert"),
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
