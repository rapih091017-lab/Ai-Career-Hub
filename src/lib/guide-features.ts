/**
 * Daftar fitur untuk panduan: halaman /panduan, tombol Panduan, tur, dan kotak "Cara pakai"
 * semuanya membaca dari sini, jadi teks langkah sama di setiap tempat.
 *
 * Teks ada di src/lib/i18n-dict/guide.ts dengan pola kunci `guide.f.<id>.<bagian>`.
 */
/** Kunci tur builder CV (nilai lama dipertahankan agar pengguna lama tidak melihat tur lagi). */
export const TOUR_SEEN_KEY = "cv_builder_tour_seen";

/** title/body/narrow berisi kunci i18n. */
export interface TourStep {
  title: string;
  body: string;
  /** Teks untuk layar < lg bila berbeda (pratinjau & toolbar ada di layar terpisah). */
  narrow?: string;
  /** Elemen yang disorot (`data-tour`), dicoba berurutan; yang pertama terlihat dipakai. Kosong = dialog tanpa sorotan. */
  anchors: string[];
}

export function tourSeen(storageKey: string = TOUR_SEEN_KEY): boolean {
  try {
    return localStorage.getItem(storageKey) === "1";
  } catch {
    // Storage tidak bisa diakses: anggap sudah dilihat agar tur tidak muncul tiap kali dibuka.
    return true;
  }
}

export function markTourSeen(storageKey: string) {
  try {
    localStorage.setItem(storageKey, "1");
  } catch {
    /* storage tidak bisa diakses */
  }
}

/** Hapus penanda agar tur muncul lagi saat fitur dibuka (tombol "Tampilkan tur" di /panduan). */
export function resetTourSeen(storageKey: string) {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    /* storage tidak bisa diakses */
  }
}

export type GuideFeatureId =
  | "checker"
  | "builder"
  | "resumes"
  | "linkedin"
  | "letter"
  | "portfolio"
  | "interview"
  | "tracker"
  | "careerpath"
  | "karir"
  | "careerhub"
  | "dashboard";

export interface GuideFeature {
  id: GuideFeatureId;
  href: string;
  icon: string;
  /** Kunci localStorage penanda tur sudah dilihat. Tanpa nilai = fitur ini tidak punya tur. */
  tourKey?: string;
  /** Langkah tur; tidak diisi untuk tur yang didefinisikan di builder-nya sendiri. */
  tour?: TourStep[];
  /** Istilah glosarium yang relevan (lihat GLOSSARY). */
  terms?: GlossaryId[];
}

export type GlossaryId = "ats" | "keyword" | "score" | "star" | "bullet" | "jd" | "headline" | "placeholder" | "template";

export const GLOSSARY: GlossaryId[] = ["ats", "keyword", "score", "jd", "bullet", "star", "headline", "placeholder", "template"];

/** Kunci localStorage tur builder portofolio (didefinisikan di BuilderEditor). */
export const PORTFOLIO_BUILDER_TOUR_KEY = "portfolio_builder_tour_seen";

function steps(id: GuideFeatureId, anchors: string[][]): TourStep[] {
  return anchors.map((a, i) => ({
    title: `guide.tour.${id}.${i + 1}.title`,
    body: `guide.tour.${id}.${i + 1}.body`,
    anchors: a,
  }));
}

export const tourKeyFor = (id: GuideFeatureId) => `guide_tour_${id}_seen`;

export const GUIDE_FEATURES: GuideFeature[] = [
  {
    id: "checker",
    href: "/checker",
    icon: "fact_check",
    tourKey: tourKeyFor("checker"),
    tour: steps("checker", [["checker-cv"], ["checker-jd"], ["checker-submit"]]),
    terms: ["ats", "keyword", "jd", "score"],
  },
  { id: "builder", href: "/builder/new", icon: "auto_awesome", tourKey: TOUR_SEEN_KEY, terms: ["template", "bullet", "keyword"] },
  {
    id: "resumes",
    href: "/my-resumes",
    icon: "folder",
    tourKey: tourKeyFor("resumes"),
    tour: steps("resumes", [["resumes-new"], ["resumes-filter"], ["resumes-list"]]),
  },
  {
    id: "linkedin",
    href: "/linkedin-optimizer",
    icon: "person_search",
    tourKey: tourKeyFor("linkedin"),
    tour: steps("linkedin", [["lo-direction"], ["lo-resume"], ["lo-submit"]]),
    terms: ["headline", "keyword", "placeholder"],
  },
  {
    id: "letter",
    href: "/surat-lamaran",
    icon: "mail",
    tourKey: tourKeyFor("letter"),
    tour: steps("letter", [["cl-steps"], ["cl-panel"], ["cl-history"]]),
    terms: ["jd", "template"],
  },
  {
    id: "portfolio",
    href: "/portfolio",
    icon: "web",
    tourKey: tourKeyFor("portfolio"),
    tour: steps("portfolio", [["pf-status"], ["pf-build"], ["pf-preview"]]),
  },
  {
    id: "interview",
    href: "/interview",
    icon: "record_voice_over",
    tourKey: tourKeyFor("interview"),
    tour: steps("interview", [["iv-search"], ["iv-positions"], ["iv-practice"]]),
    terms: ["star"],
  },
  {
    id: "tracker",
    href: "/tracker",
    icon: "view_kanban",
    tourKey: tourKeyFor("tracker"),
    tour: steps("tracker", [["tr-add"], ["tr-stages"], ["tr-board"]]),
  },
  {
    id: "careerpath",
    href: "/career-path",
    icon: "route",
    tourKey: tourKeyFor("careerpath"),
    tour: steps("careerpath", [["cp-list"], ["cp-list"], []]),
    terms: ["keyword"],
  },
  {
    id: "karir",
    href: "/karir",
    icon: "work",
    tourKey: tourKeyFor("karir"),
    tour: steps("karir", [["karir-jobs"], ["karir-portals"], []]),
  },
  { id: "careerhub", href: "/career-hub", icon: "menu_book" },
  {
    id: "dashboard",
    href: "/dashboard",
    icon: "dashboard",
    tourKey: tourKeyFor("dashboard"),
    tour: steps("dashboard", [["dash-tools"], ["dash-next"], ["dash-letters"], ["dash-cvs"]]),
  },
];

export function guideFeature(id: GuideFeatureId): GuideFeature {
  const f = GUIDE_FEATURES.find((x) => x.id === id);
  if (!f) throw new Error(`fitur panduan tidak dikenal: ${id}`);
  return f;
}

/** Kunci teks per fitur; dipakai halaman /panduan dan tes kelengkapan kamus. */
export const FEATURE_TEXT_PARTS = ["name", "what", "when", "s1", "s2", "s3", "free", "q", "a"] as const;

export const guideHref = (id: GuideFeatureId) => `/panduan#${id}`;
