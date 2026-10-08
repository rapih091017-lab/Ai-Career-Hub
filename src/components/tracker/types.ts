/** Tipe ringan untuk Job Tracker, dipakai komponen client. Sengaja tidak
 * mengimpor schema DB supaya bundle client tidak ikut membawa drizzle. */

export interface Stage {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
}

export interface TrackedJob {
  id: string;
  stageId: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string | null;
  description: string | null;
  salaryNote: string | null;
  notes: string | null;
  contactName: string | null;
  contactInfo: string | null;
  appliedAt: string | null;
  position: number;
  cvId: string | null;
  coverLetterId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CvOption {
  id: string;
  jobTitle: string;
}

export interface LetterOption {
  id: string;
  jobTitle: string | null;
  companyName: string | null;
}
