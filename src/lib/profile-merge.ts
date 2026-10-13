/**
 * Pembersihan dan penggabungan hasil impor profil.
 *
 * Hasil ekstraksi AI tidak pernah rapi 100%: tanggal bisa "Jan 2020", "2020",
 * atau "Present"; perusahaan dan jabatan bisa terbalik; entri yang sama bisa
 * muncul dua kali. Modul ini membersihkan semuanya dengan aturan murni (tanpa
 * AI) sebelum masuk ke form, lalu menggabungkannya dengan data yang sudah ada.
 *
 * Fungsi di sini murni (tanpa efek samping) supaya bisa diuji tanpa database.
 */

export interface ImportedWork {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  isPresent?: boolean;
}

export interface ImportedEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  isPresent?: boolean;
}

export interface ImportedOrganisation {
  id: string;
  name: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  isPresent?: boolean;
}

export interface ImportedSkill {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
}

export interface ImportedCertification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface ImportedProfile {
  personalInfo: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    linkedin: string;
    portfolioUrl: string;
    summary: string;
  };
  workHistory: ImportedWork[];
  education: ImportedEducation[];
  organisations: ImportedOrganisation[];
  skills: ImportedSkill[];
  certifications: ImportedCertification[];
}

export type MergeMode = "fill-empty" | "replace";

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, mei: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, agu: 8,
  sep: 9, sept: 9, september: 9, oct: 10, okt: 10, october: 10, nov: 11, november: 11,
  dec: 12, des: 12, december: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Satu tanggal menjadi `YYYY-MM`.
 *
 * Menerima bentuk yang sering muncul di CV dan di ringkasan LinkedIn:
 * "2020", "Jan 2020", "Januari 2020", "2020-03", "03/2020".
 * Mengembalikan string kosong kalau tidak ada isinya.
 */
export function normalizeDate(input: string | undefined | null): string {
  const raw = (input ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "present" || raw === "sekarang" || raw === "current" || raw === "now") return "present";

  const yyyymm = raw.match(/^(\d{4})[-/](\d{1,2})$/);
  if (yyyymm) return `${yyyymm[1]}-${pad(Number(yyyymm[2]))}`;

  const mm_yyyy = raw.match(/^(\d{1,2})[-/](\d{4})$/);
  if (mm_yyyy) return `${mm_yyyy[2]}-${pad(Number(mm_yyyy[1]))}`;

  const monthName = raw.match(/([a-z]{3,9})\.?\s+(\d{4})/);
  if (monthName) {
    const month = MONTHS[monthName[1].slice(0, 9)];
    if (month) return `${monthName[2]}-${pad(month)}`;
  }

  const year = raw.match(/\b(\d{4})\b/);
  if (year) return `${year[1]}-01`;

  return "";
}

const clean = (value: string | undefined | null) => (value ?? "").replace(/\s+/g, " ").trim();

/** Kata yang menandai sebuah entri Definitely bukan nama perusahaan. */
const NOT_A_COMPANY =
  /^(freelance|freelancer|self[- ]employed|wirausaha|independent|umkm|personal|home)$/i;

const POSITION_HINT =
  /(engineer|developer|programmer|analyst|designer|manager|staff|lead|head|director|officer|consultant|specialist|intern|associate|senior|junior|administrator|accountant|marketer|planner|technician|supervisor|executive|founder|owner|researcher|lecturer|instructor|freelance)/i;

/**
 * Perbaiki perusahaan dan jabatan yang tertukar.
 *
 * Ringkasan LinkedIn sering menulis "Staff Engineer, PT Maju Jaya" (jabatan
 * dulu). Tanpa dibalik, form menampilkan perusahaan "Staff Engineer".
 */
export function fixSwappedRole(
  a: string,
  b: string,
): { position: string; company: string } {
  const first = clean(a);
  const second = clean(b);
  const firstLooksLikeRole = POSITION_HINT.test(first);
  const secondLooksLikeRole = POSITION_HINT.test(second);

  if (firstLooksLikeRole && !secondLooksLikeRole && !NOT_A_COMPANY.test(first)) {
    return { position: first, company: second };
  }
  if (secondLooksLikeRole && !firstLooksLikeRole && !NOT_A_COMPANY.test(second)) {
    return { position: second, company: first };
  }
  return { position: first, company: second };
}

function keyOf(parts: (string | undefined)[]): string {
  return parts
    .map((p) => clean(p).toLowerCase())
    .filter(Boolean)
    .join("|");
}

/** Bersihkan satu hasil impor sebelum digabung ke form. */
export function normalizeImportedProfile(raw: ImportedProfile): ImportedProfile {
  const seenWork = new Set<string>();
  const workHistory = (raw.workHistory ?? [])
    .map((item, index) => {
      const roles = fixSwappedRole(item.position ?? "", item.company ?? "");
      const startDate = normalizeDate(item.startDate);
      const endDateRaw = normalizeDate(item.endDate);
      const isPresent = Boolean(item.isPresent) || endDateRaw === "present";
      return {
        id: item.id || `w${index + 1}`,
        company: roles.company,
        position: roles.position,
        startDate,
        endDate: isPresent ? "" : endDateRaw,
        description: clean(item.description),
        isPresent,
      };
    })
    .filter((item) => item.company || item.position)
    .filter((item) => {
      const key = keyOf([item.company, item.position, item.startDate]);
      if (seenWork.has(key)) return false;
      seenWork.add(key);
      return true;
    });

  const seenEducation = new Set<string>();
  const education = (raw.education ?? [])
    .map((item, index) => ({
      id: item.id || `e${index + 1}`,
      institution: clean(item.institution),
      degree: clean(item.degree),
      field: clean(item.field),
      startDate: normalizeDate(item.startDate),
      endDate: normalizeDate(item.endDate) === "present" ? "" : normalizeDate(item.endDate),
      gpa: clean(item.gpa),
      isPresent: Boolean(item.isPresent),
    }))
    .filter((item) => item.institution || item.degree)
    .filter((item) => {
      const key = keyOf([item.institution, item.degree]);
      if (seenEducation.has(key)) return false;
      seenEducation.add(key);
      return true;
    });

  const seenOrg = new Set<string>();
  const organisations = (raw.organisations ?? [])
    .map((item, index) => {
      const startDate = normalizeDate(item.startDate);
      const endDateRaw = normalizeDate(item.endDate);
      const isPresent = Boolean(item.isPresent) || endDateRaw === "present";
      return {
        id: item.id || `o${index + 1}`,
        name: clean(item.name),
        position: clean(item.position),
        startDate,
        endDate: isPresent ? "" : endDateRaw === "present" ? "" : endDateRaw,
        description: clean(item.description),
        isPresent,
      };
    })
    .filter((item) => item.name)
    .filter((item) => {
      const key = keyOf([item.name, item.position]);
      if (seenOrg.has(key)) return false;
      seenOrg.add(key);
      return true;
    });

  const seenSkill = new Set<string>();
  const skills = (raw.skills ?? [])
    .map((item, index) => ({
      id: item.id || `s${index + 1}`,
      name: clean(item.name),
      level: item.level ?? "intermediate",
    }))
    .filter((item) => item.name)
    .filter((item) => {
      const key = item.name.toLowerCase();
      if (seenSkill.has(key)) return false;
      seenSkill.add(key);
      return true;
    });

  const seenCert = new Set<string>();
  const certifications = (raw.certifications ?? [])
    .map((item, index) => ({
      id: item.id || `c${index + 1}`,
      name: clean(item.name),
      issuer: clean(item.issuer),
      year: (item.year ?? "").match(/\d{4}/)?.[0] ?? "",
    }))
    .filter((item) => item.name)
    .filter((item) => {
      const key = keyOf([item.name, item.issuer]);
      if (seenCert.has(key)) return false;
      seenCert.add(key);
      return true;
    });

  return {
    personalInfo: {
      fullName: clean(raw.personalInfo?.fullName),
      phone: clean(raw.personalInfo?.phone),
      email: clean(raw.personalInfo?.email).toLowerCase(),
      address: clean(raw.personalInfo?.address),
      linkedin: clean(raw.personalInfo?.linkedin),
      portfolioUrl: clean(raw.personalInfo?.portfolioUrl),
      summary: clean(raw.personalInfo?.summary),
    },
    workHistory,
    education,
    organisations,
    skills,
    certifications,
  };
}

type Ided = { id: string };
const idField = (item: Ided, fields: string[]) =>
  fields
    .map((f) => String((item as unknown as Record<string, unknown>)[f] ?? "").toLowerCase())
    .join("|");

function mergeList<T extends Ided>(
  current: T[],
  incoming: T[],
  mode: MergeMode,
  keyFields: string[],
  prefix: string,
): T[] {
  if (mode === "replace") return incoming;
  const seen = new Set(current.map((item) => idField(item, keyFields)));
  const nextId = current.length;
  const additions = incoming.filter((item) => {
    const key = idField(item, keyFields);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...current, ...additions.map((item, index) => ({ ...item, id: item.id || `${prefix}${nextId + index + 1}` }))];
}

/**
 * Gabungkan hasil impor dengan profil yang sudah ada.
 *
 * `fill-empty` (default): isi hanya kolom yang kosong, sisanya tidak disentuh.
 * Ini yang membuat impor terasa cerdas — data yang sudah benar tidak hilang
 * hanya karena AI tidak menemukan field itu di dokumen.
 */
export function mergeImportedProfile(
  current: ImportedProfile,
  imported: ImportedProfile,
  mode: MergeMode = "fill-empty",
): ImportedProfile {
  const cleanImport = normalizeImportedProfile(imported);

  if (mode === "replace") return cleanImport;

  const pick = (existing: string, incoming: string) => (existing.trim() ? existing : incoming);

  return {
    personalInfo: {
      fullName: pick(current.personalInfo.fullName, cleanImport.personalInfo.fullName),
      phone: pick(current.personalInfo.phone, cleanImport.personalInfo.phone),
      email: pick(current.personalInfo.email, cleanImport.personalInfo.email),
      address: pick(current.personalInfo.address, cleanImport.personalInfo.address),
      linkedin: pick(current.personalInfo.linkedin, cleanImport.personalInfo.linkedin),
      portfolioUrl: pick(current.personalInfo.portfolioUrl, cleanImport.personalInfo.portfolioUrl),
      summary: pick(current.personalInfo.summary, cleanImport.personalInfo.summary),
    },
    workHistory: mergeList(current.workHistory, cleanImport.workHistory, mode, ["company", "position"], "w"),
    education: mergeList(current.education, cleanImport.education, mode, ["institution", "degree"], "e"),
    organisations: mergeList(current.organisations, cleanImport.organisations, mode, ["name", "position"], "o"),
    skills: mergeList(current.skills, cleanImport.skills, mode, ["name"], "s"),
    certifications: mergeList(current.certifications, cleanImport.certifications, mode, ["name", "issuer"], "c"),
  };
}

export interface ImportSummary {
  workHistory: number;
  education: number;
  organisations: number;
  skills: number;
  certifications: number;
  /** Bagian yang akan terisi baru, bukan menimpa data yang sudah ada. */
  filledFields: string[];
  /** Entri yang sudah ada di profil dan tidak jadi digandakan. */
  duplicates: number;
}

/** Ringkasan isi hasil impor, supaya pengguna tahu apa yang akan berubah. */
export function summarizeImportedProfile(current: ImportedProfile, imported: ImportedProfile): ImportSummary {
  const cleanImport = normalizeImportedProfile(imported);
  const merged = mergeImportedProfile(current, cleanImport, "fill-empty");

  const fieldLabels: [keyof ImportedProfile["personalInfo"], string][] = [
    ["fullName", "Nama"],
    ["phone", "Telepon"],
    ["email", "Email"],
    ["address", "Alamat"],
    ["linkedin", "LinkedIn"],
    ["portfolioUrl", "Portfolio"],
    ["summary", "Ringkasan"],
  ];
  const filledFields = fieldLabels
    .filter(([key]) => !current.personalInfo[key].trim() && merged.personalInfo[key].trim())
    .map(([, label]) => label);

  const existingWork = new Set(current.workHistory.map((w) => keyOf([w.company, w.position])));
  const duplicates = cleanImport.workHistory.filter((w) => existingWork.has(keyOf([w.company, w.position]))).length;

  return {
    workHistory: cleanImport.workHistory.length,
    education: cleanImport.education.length,
    organisations: cleanImport.organisations.length,
    skills: cleanImport.skills.length,
    certifications: cleanImport.certifications.length,
    filledFields,
    duplicates,
  };
}