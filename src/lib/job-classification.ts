/**
 * Klasifikasi lowongan: kategori rekrutmen, tipe kerja, dan batas akhir.
 *
 * Satu sumber untuk API, form admin, dan tampilan publik, supaya kategori
 * yang bisa dipilih admin sama persis dengan yang bisa difilter pengunjung.
 * Kalau tidak, lowongan bisa tersimpan sebagai kategori yang tidak pernah
 * muncul di filter mana pun.
 */

export const JOB_TYPES = ["staff", "mt", "odp"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_TYPE_LABELS: Record<JobType, { id: string; en: string }> = {
  staff: { id: "Staff", en: "Staff" },
  mt: { id: "MT", en: "Management Trainee" },
  odp: { id: "ODP", en: "ODP" },
};

/** Warna badge per kategori supaya mata bisa memindai daftar tanpa membaca. */
export const JOB_TYPE_BADGE_CLASS: Record<JobType, string> = {
  staff: "bg-blue-100 text-blue-700 border-blue-200",
  mt: "bg-emerald-100 text-emerald-700 border-emerald-200",
  odp: "bg-orange-100 text-orange-700 border-orange-200",
};

export const EMPLOYMENT_TYPES = ["full_time", "part_time", "internship"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, { id: string; en: string }> = {
  full_time: { id: "Full Time", en: "Full Time" },
  part_time: { id: "Part Time", en: "Part Time" },
  internship: { id: "Internship", en: "Internship" },
};

export const JOB_SORTS = ["newest", "title", "company"] as const;
export type JobSort = (typeof JOB_SORTS)[number];

export const JOB_SORT_LABELS: Record<JobSort, { id: string; en: string }> = {
  newest: { id: "Terbaru", en: "Newest" },
  title: { id: "Judul A-Z", en: "Title A-Z" },
  company: { id: "Perusahaan A-Z", en: "Company A-Z" },
};

export function isJobType(value: string): value is JobType {
  return (JOB_TYPES as readonly string[]).includes(value);
}

export function isEmploymentType(value: string): value is EmploymentType {
  return (EMPLOYMENT_TYPES as readonly string[]).includes(value);
}

export function isJobSort(value: string): value is JobSort {
  return (JOB_SORTS as readonly string[]).includes(value);
}

/**
 * Status batas akhir dalam bahasa manusia.
 *
 * `null` berarti tidak diisi, jadi lowongan tidak pernah terlihat "ditutup"
 * hanya karena admin lupa mengisi tanggal.
 */
export function deadlineStatus(
  deadline: string | Date | null,
  now: Date = new Date(),
): { state: "none" | "closed" | "closing" | "open"; labelId: string; days: number | null } {
  if (!deadline) return { state: "none", labelId: "karir.deadline-none", days: null };
  const end = new Date(deadline);
  // Deadline dibaca sebagai akhir hari, jadi lowongan yang ditutup hari ini
  // masih bisa dilamar sampai malam.
  end.setHours(23, 59, 59, 999);
  const diff = end.getTime() - now.getTime();
  if (diff < 0) return { state: "closed", labelId: "karir.deadline-closed", days: null };
  const days = Math.ceil(diff / 86_400_000);
  if (days <= 3) return { state: "closing", labelId: "karir.deadline-closing", days };
  return { state: "open", labelId: "karir.deadline-open", days };
}