/**
 * Fixture hasil cek CV lengkap untuk uji render halaman hasil. Disusun dari
 * fixture yang sudah ada (checker-section-details, checker-hr-panel-v5) plus
 * field v5 lain supaya hampir semua section ikut dirender.
 */
export const CV_TEXT =
  "Frontend Developer di PT Maju dari 2020 sampai 2023. Membangun fitur login. React, Next.js, TypeScript. S1 Ilmu Komputer.";

export const FULL_RESULT: Record<string, unknown> = {
  extractedText: CV_TEXT,
  grade: "C",
  atsPrediction: "Borderline",
  fitLabel: "Fair",
  aiModel: "V4 Flash",
  weightsApplied: {
    role_category: "tech",
    summary_weight: 0.2,
    experience_weight: 0.35,
    skills_weight: 0.25,
    education_weight: 0.1,
    format_ats_weight: 0.1,
  },
  meta: { detected_seniority: "mid", jd_present: true },
  careerVelocity: { title_progression: "Upward" },
  atsPredictionDetail: { risk_factors: [], strengths: [] },
  hrScan: {
    last_title: { value: "Frontend Developer", status: "terbaca" },
    total_experience: { value: "3 tahun", status: "terbaca" },
    top_achievement: { value: null, status: "tidak_terbaca", note: "CV tidak menyebut angka" },
    key_skills: { value: "React, Next.js", status: "samar" },
  },
  hrFlags: [
    {
      type: "red",
      label: "Pindah kerja 4 kali dalam 3 tahun",
      evidence: "PT Maju dari 2020 sampai 2023",
      fix: { copy_text: "Menjelaskan alasan pindah secara singkat" },
    },
    { type: "green", label: "Jabatan naik konsisten", evidence: "Frontend Developer di PT Maju" },
  ],
  hrQuestions: [
    {
      question: "Kenapa hanya bertahan 3 tahun di PT Maju?",
      why_asked: "Riwayat kerja di CV",
      answer_tip: "Jawab dengan alasan jujur.",
    },
  ],
  knockoutRisks: [
    { requirement: "Pengalaman minimal 3 tahun", status: "terpenuhi", evidence: "2020 sampai 2023" },
  ],
  quickSummary: {
    verdict: "Fondasi solid, tapi pencapaian belum terukur.",
    top_strengths: ["Stack sesuai lowongan", "Riwayat kerja jelas"],
    top_fixes: [
      { id: "f1", title: "Tambah angka di bullet login", target_section: "checklist", impact: "Sedang", est_minutes: 10 },
      { id: "f2", title: "Masukkan TypeScript ke ringkasan", target_section: "keyword", impact: "Tinggi", est_minutes: 5, copy_text: "TypeScript | Next.js" },
      { id: "f3", title: "Rapikan urutan tanggal", target_section: "skor", impact: "Rendah" },
      { id: "f4", title: "Jelaskan perpindahan kerja", target_section: "hr", impact: "Tinggi", est_minutes: 15 },
    ],
  },
  impactForecast: { current_score: 62, projected_after_quick_wins: 70, projected_after_all_fixes: 78 },
  breakdown: {
    summary: {
      score: 55,
      issues: ["Belum menyebut TypeScript"],
      suggestions: ["Sebut stack utama di kalimat pertama"],
      score_reason: "Summary belum menyebut TypeScript",
      top_fix: { title: "Tambah TypeScript di awal", copy_text: "TypeScript | Next.js" },
    },
    experience: {
      score: 60,
      issues: ["Bullet tanpa hasil"],
      suggestions: ["Tambahkan dampak"],
      quantification_pct: 20,
      bullets_total: 5,
      bullets_without_result: 2,
    },
    skills: { score: 70, missing_skills: ["Docker"], recommendations: ["Tambah Docker bila pernah pakai"] },
    education: { score: 80, relevance: "S1 Ilmu Komputer", suggestions: [] },
    format_ats: {
      score: 45,
      issues: ["Urutan tanggal acak"],
      tips: ["Urutkan dari terbaru"],
      checks: [{ id: "chron", label: "Urutan kronologis", status: "perlu_perbaikan" }],
    },
  },
  missingSections: [
    { name: "Sertifikasi", why_it_matters: "Menunjukkan pembelajaran", template_copy_text: "Sertifikasi — [nama sertifikasi] ([tahun])" },
  ],
  narrativeFeedback: {
    overall_assessment: "CV rapi, tapi dampak kerja belum terlihat.",
    strengths: [],
    areas_for_improvement: [],
    ats_recommendations: ["Pakai judul section standar"],
  },
  keywordAnalysis: {
    match_rate_pct: 60,
    matched: ["React", "Next.js"],
    missing_critical: ["Docker"],
    missing_nice_to_have: ["GraphQL"],
    synonym_suggestions: ["Frontend → Front-End"],
  },
  actionPlan: {
    quick_wins: ["Tambah angka di bullet login", "Sebut TypeScript di ringkasan"],
    short_term: ["Tambah section sertifikasi"],
    long_term: ["Bangun proyek dengan Docker"],
  },
  bulletReview: [
    {
      section: "experience",
      original_text: "Membangun fitur login",
      issues: ["Tanpa hasil"],
      suggested_rewrite: "Membangun fitur login untuk [jumlah orang] pengguna",
      priority: "High",
    },
  ],
};

export const STORED_ROW = {
  id: "fx1",
  scores: { overall: 62, keywordGap: 50, contextRelevance: 60, atsRules: 55 },
  aiFeedback: { keywordGap: "", contextRelevance: "", atsRules: "", summary: "Fondasi solid, tapi pencapaian belum terukur." },
  fullResult: FULL_RESULT,
  createdAt: null,
};
