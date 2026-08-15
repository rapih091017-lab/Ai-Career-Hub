/**
 * Template Surat — setiap JENIS surat punya kombinasi
 * gaya penulisan (style → prompt AI) + format visual (preview A4) sendiri.
 *
 * Template ini dipakai oleh SuratLamaranApp (stepper) untuk:
 *  - kartu pemilih template (langkah 1)
 *  - format preview A4 (font, aksen, kop surat)
 */
export interface LetterTemplate {
  id: string;
  /** Jenis surat — dipakai untuk grouping & label */
  type: "lamaran" | "cover" | "motivation";
  /** style yang dikirim ke API generate (harus valid di backend) */
  style: "formal" | "formal_lengkap" | "ats" | "casual" | "motivation";
  label: string;
  badge: string;
  desc: string;
  icon: string;
  /** bahasa default */
  defaultLang: "id" | "en";
  /** format visual preview */
  format: {
    fontFamily: string;
    accentColor: string;
    headerStyle: "kop" | "modern" | "warm";
    subjectUppercase: boolean;
    bodyAlign: "justify" | "left";
    bodySize: string;
    letterhead?: boolean; // tampilkan kop surat
  };
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: "formal",
    type: "lamaran",
    style: "formal",
    label: "Surat Lamaran Kerja",
    badge: "Resmi",
    desc: "Surat lamaran kerja resmi Indonesia: hook pembuka, bukti pengalaman, kecocokan dengan lowongan, penutup + ajakan wawancara. Untuk lamaran ke perusahaan via email/unggah.",
    icon: "description",
    defaultLang: "id",
    format: {
      fontFamily: "'Times New Roman', 'Georgia', 'Calibri', serif",
      accentColor: "#111111",
      headerStyle: "modern",
      subjectUppercase: true,
      bodyAlign: "justify",
      bodySize: "12pt",
    },
  },
  {
    id: "formal-lengkap",
    type: "lamaran",
    style: "formal_lengkap",
    label: "Surat Lamaran + Kop",
    badge: "Kop Surat",
    desc: "Surat lamaran resmi lengkap dengan kop surat, nomor, lampiran, perihal. Untuk BUMN, korporasi, dan instansi pemerintah.",
    icon: "markunread_mailbox",
    defaultLang: "id",
    format: {
      fontFamily: "'Times New Roman', 'Georgia', 'Calibri', serif",
      accentColor: "#111111",
      headerStyle: "kop",
      subjectUppercase: true,
      bodyAlign: "justify",
      bodySize: "12pt",
      letterhead: true,
    },
  },
  {
    id: "ats-cover",
    type: "cover",
    style: "ats",
    label: "Cover Letter (EN)",
    badge: "ATS · English",
    desc: "Cover letter English padat & keyword-friendly: hook kuantitatif, bukti tersusun, sisipan kata kunci dari deskripsi lowongan. Untuk perusahaan luar negeri/startup tech.",
    icon: "auto_awesome",
    defaultLang: "en",
    format: {
      fontFamily: "'Calibri', 'Segoe UI', 'Helvetica', sans-serif",
      accentColor: "#0d7377",
      headerStyle: "modern",
      subjectUppercase: true,
      bodyAlign: "left",
      bodySize: "11pt",
    },
  },
  {
    id: "motivation",
    type: "motivation",
    style: "motivation",
    label: "Motivation Letter",
    badge: "Bukan untuk Melamar Kerja",
    desc: "BUKAN surat lamaran kerja — untuk beasiswa, program pertukaran, magang bergengsi, atau fresh graduate. Fokus passion, alasan personal, tujuan jangka panjang.",
    icon: "emoji_events",
    defaultLang: "id",
    format: {
      fontFamily: "'Calibri', 'Segoe UI', 'Arial', sans-serif",
      accentColor: "#b45309",
      headerStyle: "warm",
      subjectUppercase: false,
      bodyAlign: "justify",
      bodySize: "12pt",
    },
  },
];

/** Template kasual — opsional pelengkap di bawah template utama */
export const CASUAL_TEMPLATE: LetterTemplate = {
  id: "casual",
  type: "lamaran",
  style: "casual",
  label: "Surat Lamaran Kasual",
  badge: "Startup · Kreatif",
  desc: "Surat lamaran kerja dengan nada hangat namun tetap profesional. Cocok untuk startup, perusahaan kreatif, dan tim yang santai.",
  icon: "waving_hand",
  defaultLang: "id",
  format: {
    fontFamily: "'Calibri', 'Segoe UI', 'Arial', sans-serif",
    accentColor: "#e85d75",
    headerStyle: "modern",
    subjectUppercase: false,
    bodyAlign: "left",
    bodySize: "12pt",
  },
};

export function getLetterTemplate(id: string): LetterTemplate {
  return (
    LETTER_TEMPLATES.find((t) => t.id === id) ??
    (CASUAL_TEMPLATE.id === id ? CASUAL_TEMPLATE : LETTER_TEMPLATES[0])
  );
}

/** Semua template yang muncul di kartu pemilih */
export const PICKER_TEMPLATES: LetterTemplate[] = [...LETTER_TEMPLATES, CASUAL_TEMPLATE];
