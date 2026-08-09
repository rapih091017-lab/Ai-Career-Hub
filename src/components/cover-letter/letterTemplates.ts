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
    label: "Surat Lamaran Formal",
    badge: "Resmi",
    desc: "Surat lamaran resmi Indonesia tanpa kop: tempat/tanggal, perihal, kepada Yth., isi, penutup. Cocok untuk surat digital/email lamaran.",
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
    label: "Surat Lamaran Formal",
    badge: "Kop Surat",
    desc: "Surat resmi Indonesia lengkap: kop surat, nomor, lampiran, perihal. Cocok untuk BUMN, korporasi, dan instansi pemerintah.",
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
    label: "Cover Letter Modern (EN)",
    badge: "ATS · English",
    desc: "Cover letter English yang padat, keyword-friendly, satu halaman. Cocok untuk perusahaan luar negeri, startup, dan tech.",
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
    badge: "Beasiswa · Program",
    desc: "Surat motivasi yang tulus & berkesan. Cocok untuk beasiswa, program pertukaran, magang bergengsi, dan fresh graduate.",
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
  label: "Surat Kasual",
  badge: "Startup · Kreatif",
  desc: "Nada hangat namun profesional. Cocok untuk startup dan perusahaan kreatif.",
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
