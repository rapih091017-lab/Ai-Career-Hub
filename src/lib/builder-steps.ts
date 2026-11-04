/**
 * Langkah form builder CV. Urutan di STEP_IDS = urutan stepper; indeks dipakai
 * komponen stepper, jadi kode lain memakai STEP.X, bukan angka.
 */
export const STEP_IDS = ["target", "personal", "experience", "education", "organizations", "skills", "review"] as const;
export type StepId = (typeof STEP_IDS)[number];

const at = (id: StepId) => STEP_IDS.indexOf(id);

export const STEP = {
  TARGET: at("target"),
  PERSONAL: at("personal"),
  EXPERIENCE: at("experience"),
  EDUCATION: at("education"),
  ORGANIZATIONS: at("organizations"),
  SKILLS: at("skills"),
  REVIEW: at("review"),
} as const;

export const LAST_STEP = STEP_IDS.length - 1;

/** Kunci i18n judul, deskripsi, dan ikon tiap langkah. */
export const STEP_META: Record<StepId, { title: string; desc: string; icon: string }> = {
  target: { title: "builder.step-target", desc: "builder.desc-target", icon: "work_history" },
  personal: { title: "builder.step-personal", desc: "builder.desc-personal", icon: "person" },
  experience: { title: "builder.step-experience", desc: "builder.desc-experience", icon: "work" },
  education: { title: "builder.step-education", desc: "builder.desc-education", icon: "school" },
  organizations: { title: "builder.step-org", desc: "builder.desc-org", icon: "groups" },
  skills: { title: "builder.step-skills", desc: "builder.desc-skills", icon: "star" },
  review: { title: "builder.step-review", desc: "builder.desc-review", icon: "visibility" },
};

/** Langkah yang dihitung untuk kelengkapan CV (semua kecuali Review). */
export const CONTENT_STEPS = STEP_IDS.filter((id) => id !== "review");

/** Langkah form untuk kunci section CV (klik section di pratinjau). Section kustom → Keahlian & Lainnya. */
export function stepForSection(key: string): number {
  switch (key) {
    case "header":
    case "summary":
      return STEP.PERSONAL;
    case "experience":
      return STEP.EXPERIENCE;
    case "education":
      return STEP.EDUCATION;
    case "organizations":
      return STEP.ORGANIZATIONS;
    default:
      return STEP.SKILLS;
  }
}
