import type {
  ActionPlan,
  BulletItem,
  DurationRewrite,
  FormatCheck,
  FormatCheckStatus,
  HrFlag,
  HrQuestion,
  HrScan,
  HrScanField,
  HrScanStatus,
  ImpactForecast,
  IssueItem,
  KnockoutRisk,
  KnockoutStatus,
  KeywordAnalysis,
  KeywordEvidence,
  KeywordEvidenceLevel,
  KeywordPlacement,
  KeywordPlacementPriority,
  KeywordRequirement,
  KeywordRequirementStatus,
  KeywordSource,
  MissingSection,
  NarrativeFeedback,
  SectionTopFix,
  QuickFix,
  QuickFixImpact,
  QuickFixTargetSection,
  QuickSummary,
  StoredAnalysisResult,
  StoredBreakdown,
  WeightsApplied,
} from "@/components/checker/types";

/** Baris yang dikembalikan `/api/checker/history/[id]`. `aiModel` sengaja tidak
 *  ada di sini: route itu tidak pernah mengirimkannya, dan field tersebut
 *  disimpan di dalam `fullResult` — bukan sebagai kolom sendiri. */
interface StoredResult {
  scores?: unknown;
  aiFeedback?: unknown;
  fullResult?: unknown;
}

type AnyRecord = Record<string, any>;

/** Objek atau apa pun yang tidak bisa dibaca property-nya (string, null, array). */
function asRecord(v: unknown): AnyRecord {
  return isRecord(v) ? v : {};
}

function isRecord(v: unknown): v is AnyRecord {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Angka finite atau null. Kolom jsonb bisa berisi string/null karena baris rusak
 *  atau terpotong, dan angka pengganti selalu jadi klaim yang tidak berdasar. */
function toNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Angka finite, atau default kalau memang tidak ada. Dipakai untuk field yang
 *  nolnya berarti "tidak ada", bukan "salah": `scores` dan `match_rate_pct` sudah
 *  calculado sendiri di route analyze dan selalu tersimpan. */
function toScore(v: unknown, fallback: number): number {
  return toNumber(v) ?? fallback;
}

function toText(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Teks yang isinya cuma spasi dianggap tidak ada — entri seperti itu hanya jadi
 *  bullet kosong di UI. */
function toTextList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

/** Issue boleh string polos (hasil lama) maupun objek { text, severity, source_excerpt }.
 *  Entri string tidak boleh dibuang, karena UI membacanya lewat toIssueItems();
 *  yang dibuang hanya entri tanpa teks, karena jadi bullet kosong. */
function toIssueList(v: unknown): (string | IssueItem)[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => {
    if (typeof x === "string") return x.trim().length > 0;
    return isRecord(x) && typeof x.text === "string" && x.text.trim().length > 0;
  });
}

/** Skor sebuah section, atau null kalau tidak pernah dihitung. Section tanpa skor
 *  tidak boleh dibuat-buat: kartu SectionScoreCard selalu menampilkan persentase,
 *  jadi skor 50 hasil `.catch()` schema akan terbaca sebagai skor asli. */
function toSectionScore(v: unknown): number | null {
  return isRecord(v) ? toNumber(v.score) : null;
}

/** Alasan skor section (v5); string kosong = field tidak ikut, bukan "" di UI. */
function toScoreReason(v: unknown): string | undefined {
  return toText(v).trim() || undefined;
}

/** Perbaikan terbesar satu section; tanpa judul tidak ada yang ditampilkan. */
function toTopFix(v: unknown): SectionTopFix | undefined {
  if (!isRecord(v)) return undefined;
  const title = toText(v.title).trim();
  if (!title) return undefined;
  const copyText = toText(v.copy_text).trim();
  const replaces = toText(v.replaces).trim();
  return {
    title,
    ...(copyText ? { copy_text: copyText } : {}),
    ...(replaces ? { replaces } : {}),
  };
}

const FORMAT_CHECK_STATUSES: readonly FormatCheckStatus[] = ["ok", "perlu_perbaikan", "tidak_dapat_dinilai"];

/** Cek format ATS: id/label kosong atau status invalid = butir dibuang. */
function toFormatChecks(v: unknown): FormatCheck[] {
  if (!Array.isArray(v)) return [];
  const out: FormatCheck[] = [];
  for (const raw of v) {
    if (!isRecord(raw)) continue;
    const id = toText(raw.id).trim();
    const label = toText(raw.label).trim();
    const status = FORMAT_CHECK_STATUSES.includes(raw.status as FormatCheckStatus)
      ? (raw.status as FormatCheckStatus)
      : null;
    if (!id || !label || !status) continue;
    const note = toText(raw.note).trim();
    out.push({ id, label, status, ...(note ? { note } : {}) });
    if (out.length >= 8) break;
  }
  return out;
}

/**
 * `missing_sections` menerima string (format lama) ATAU objek { name,
 * why_it_matters, template_copy_text }. String dinormalkan jadi { name } supaya
 * UI hanya memproses satu bentuk; entri tanpa nama dibuang — judul kartu tidak
 * boleh kosong.
 */
export function toMissingSections(v: unknown): MissingSection[] {
  if (!Array.isArray(v)) return [];
  const out: MissingSection[] = [];
  for (const raw of v) {
    if (typeof raw === "string") {
      const name = raw.trim();
      if (name) out.push({ name });
      continue;
    }
    if (!isRecord(raw)) continue;
    const name = toText(raw.name).trim();
    if (!name) continue;
    const why = toText(raw.why_it_matters).trim();
    const template = toText(raw.template_copy_text).trim();
    out.push({
      name,
      ...(why ? { why_it_matters: why } : {}),
      ...(template ? { template_copy_text: template } : {}),
    });
  }
  return out;
}

/** Hanya section yang punya skor yang diteruskan. Baris lama yang `breakdown`-nya
 *  terpotong jadi tampil sebagian, bukan lima kartu dengan angka tebakan. */
function toBreakdown(v: unknown): StoredBreakdown | null {
  if (!isRecord(v)) return null;
  const out: StoredBreakdown = {};

  const summaryScore = toSectionScore(v.summary);
  if (summaryScore !== null) {
    const summaryReason = toScoreReason(v.summary.score_reason);
    const summaryFix = toTopFix(v.summary.top_fix);
    const hasSkills = typeof v.summary.has_skills_and_achievement === "boolean"
      ? v.summary.has_skills_and_achievement
      : undefined;
    const rewrite = toText(v.summary.rewrite_copy_text).trim();
    out.summary = {
      score: summaryScore,
      issues: toIssueList(v.summary.issues),
      suggestions: toTextList(v.summary.suggestions),
      ...(summaryReason ? { score_reason: summaryReason } : {}),
      ...(summaryFix ? { top_fix: summaryFix } : {}),
      ...(hasSkills !== undefined ? { has_skills_and_achievement: hasSkills } : {}),
      ...(rewrite ? { rewrite_copy_text: rewrite } : {}),
    };
  }

  const experienceScore = toSectionScore(v.experience);
  if (experienceScore !== null) {
    const quantification = toNumber(v.experience.quantification_pct);
    const expReason = toScoreReason(v.experience.score_reason);
    const expFix = toTopFix(v.experience.top_fix);
    const bulletsTotal = toNumber(v.experience.bullets_total);
    const bulletsWithout = toNumber(v.experience.bullets_without_result);
    // "X dari Y poin" hanya bermakna kalau keduanya ada dan X ≤ Y; selain itu
    // keduanya hilang, bukan jadi angka yang saling membantah di UI.
    const bulletsValid =
      bulletsTotal !== null && bulletsWithout !== null && bulletsWithout <= bulletsTotal;
    out.experience = {
      score: experienceScore,
      issues: toIssueList(v.experience.issues),
      suggestions: toTextList(v.experience.suggestions),
      // Hanya isi kalau AI mengirimnya; undefined berarti chip kuantifikasi tidak tampil.
      ...(quantification !== null ? { quantification_pct: quantification } : {}),
      ...(expReason ? { score_reason: expReason } : {}),
      ...(expFix ? { top_fix: expFix } : {}),
      ...(bulletsValid
        ? { bullets_total: Math.round(bulletsTotal!), bullets_without_result: Math.round(bulletsWithout!) }
        : {}),
    };
  }

  const skillsScore = toSectionScore(v.skills);
  if (skillsScore !== null) {
    const missingSkills = toTextList(v.skills.missing_skills);
    const groupedRaw = toText(v.skills.grouped_skills_copy_text).trim();
    // grouped_skills_copy_text HANYA boleh memakai skill yang sudah ada di CV:
    // bila satu pun missing_skills muncul di dalamnya, teksnya dibuang —
    // menempelnya berarti meminta kandidat mengklaim skill yang belum dikuasai.
    const groupedNorm = groupedRaw.toLowerCase();
    const groupedLeaksMissing = missingSkills.some((skill) => groupedNorm.includes(skill.toLowerCase()));
    const grouped = groupedRaw && !groupedLeaksMissing ? groupedRaw : undefined;
    const unproven = toTextList(v.skills.unproven_skills);
    const skillsReason = toScoreReason(v.skills.score_reason);
    const skillsFix = toTopFix(v.skills.top_fix);
    out.skills = {
      score: skillsScore,
      issues: toIssueList(v.skills.issues),
      suggestions: toTextList(v.skills.suggestions),
      missing_skills: missingSkills,
      recommendations: toTextList(v.skills.recommendations),
      ...(skillsReason ? { score_reason: skillsReason } : {}),
      ...(skillsFix ? { top_fix: skillsFix } : {}),
      ...(unproven.length > 0 ? { unproven_skills: unproven } : {}),
      ...(grouped ? { grouped_skills_copy_text: grouped } : {}),
    };
  }

  const educationScore = toSectionScore(v.education);
  if (educationScore !== null) {
    const eduReason = toScoreReason(v.education.score_reason);
    const eduFix = toTopFix(v.education.top_fix);
    const eduCopy = toText(v.education.copy_text).trim();
    out.education = {
      score: educationScore,
      relevance: toText(v.education.relevance),
      suggestions: toTextList(v.education.suggestions),
      ...(eduReason ? { score_reason: eduReason } : {}),
      ...(eduFix ? { top_fix: eduFix } : {}),
      ...(eduCopy ? { copy_text: eduCopy } : {}),
    };
  }

  const formatAtsScore = toSectionScore(v.format_ats);
  if (formatAtsScore !== null) {
    const atsReason = toScoreReason(v.format_ats.score_reason);
    const atsFix = toTopFix(v.format_ats.top_fix);
    const atsChecks = toFormatChecks(v.format_ats.checks);
    out.format_ats = {
      score: formatAtsScore,
      issues: toIssueList(v.format_ats.issues),
      tips: toTextList(v.format_ats.tips),
      ...(atsReason ? { score_reason: atsReason } : {}),
      ...(atsFix ? { top_fix: atsFix } : {}),
      ...(atsChecks.length > 0 ? { checks: atsChecks } : {}),
    };
  }

  return Object.keys(out).length > 0 ? out : null;
}

const KEYWORD_SOURCES: readonly KeywordSource[] = ["job_description", "role_generic"];
const EVIDENCE_LEVELS: readonly KeywordEvidenceLevel[] = ["dibuktikan", "hanya_daftar_skill"];
const PLACEMENT_PRIORITIES: readonly KeywordPlacementPriority[] = ["critical", "nice"];
const REQUIREMENT_STATUSES: readonly KeywordRequirementStatus[] = ["terpenuhi", "sebagian", "tidak_ada"];
const PLACEMENT_RANK: Record<KeywordPlacementPriority, number> = { critical: 0, nice: 1 };

/** Apakah `source` salah satu dari dua nilai yang boleh ada. */
function toKeywordSource(v: unknown): KeywordSource | undefined {
  return KEYWORD_SOURCES.includes(v as KeywordSource) ? (v as KeywordSource) : undefined;
}

/**
 * Bukti per keyword matched. Item gugur bila level invalid, keyword bukan
 * anggota matched, atau (kalau teks CV tersedia) excerpt bukan potongan CV.
 * Kutipan yang tidak bisa diverifikasi dibuang, bukan ditulis ulang.
 */
function toEvidenceList(v: unknown, matched: string[], cvText?: string): KeywordEvidence[] {
  if (!Array.isArray(v)) return [];
  const matchedSet = new Set(matched.map((keyword) => keyword.toLowerCase()));
  const out: KeywordEvidence[] = [];
  for (const raw of v) {
    if (!isRecord(raw)) continue;
    const keyword = toText(raw.keyword).trim();
    const level = EVIDENCE_LEVELS.includes(raw.level as KeywordEvidenceLevel)
      ? (raw.level as KeywordEvidenceLevel)
      : null;
    if (!keyword || !level || !matchedSet.has(keyword.toLowerCase())) continue;
    const excerpt = toText(raw.excerpt).trim();
    const safeExcerpt = excerpt && isVerbatimCvText(cvText, excerpt) ? excerpt : "";
    out.push({ keyword, level, ...(safeExcerpt ? { excerpt: safeExcerpt } : {}) });
  }
  return out;
}

/** Kartu penempatan: tanpa where/copy_text/priority valid tidak ada yang ditampilkan. */
function toPlacementList(v: unknown): KeywordPlacement[] {
  if (!Array.isArray(v)) return [];
  const out: KeywordPlacement[] = [];
  for (const raw of v) {
    if (!isRecord(raw)) continue;
    const keyword = toText(raw.keyword).trim();
    const where = toText(raw.where).trim();
    const copyText = toText(raw.copy_text).trim();
    const priority = PLACEMENT_PRIORITIES.includes(raw.priority as KeywordPlacementPriority)
      ? (raw.priority as KeywordPlacementPriority)
      : null;
    if (!keyword || !where || !copyText || !priority) continue;
    const replaces = toText(raw.replaces).trim();
    out.push({
      keyword,
      priority,
      where,
      copy_text: copyText,
      ...(replaces ? { replaces } : {}),
    });
  }
  // critical dulu (stabil), baru dipotong 8: kalau dipotong saat iterasi,
  // item nice di depan bisa menggusur item critical di belakang.
  return out
    .sort((a, b) => PLACEMENT_RANK[a.priority] - PLACEMENT_RANK[b.priority])
    .slice(0, 8);
}

/** Syarat lowongan: hanya bermakna kalau sumbernya memang lowongan (JD). */
function toRequirementList(v: unknown, source: KeywordSource | undefined, cvText?: string): KeywordRequirement[] {
  if (source !== "job_description" || !Array.isArray(v)) return [];
  const out: KeywordRequirement[] = [];
  for (const raw of v) {
    if (!isRecord(raw)) continue;
    const requirement = toText(raw.requirement).trim();
    const status = REQUIREMENT_STATUSES.includes(raw.status as KeywordRequirementStatus)
      ? (raw.status as KeywordRequirementStatus)
      : null;
    if (!requirement || !status) continue;
    const evidence = toText(raw.evidence).trim();
    const tip = toText(raw.tip).trim();
    out.push({
      requirement,
      status,
      ...(evidence && isVerbatimCvText(cvText, evidence) ? { evidence } : {}),
      ...(tip ? { tip } : {}),
    });
    if (out.length >= 12) break;
  }
  return out;
}

/**
 * Bentuk akhir keywordAnalysis untuk respons live dan baris tersimpan.
 *
 * `opts.source` (route, deterministik dari ada/tidaknya JD) MENANG atas nilai
 * tersimpan; nilai di luar dua enum tidak pernah dipakai. `opts.cvText` dipakai
 * memeriksa excerpt/evidence ke teks CV; baris tersimpan sudah divalidasi saat
 * ditulis, jadi tanpa cvText keduanya diteruskan apa adanya.
 * `match_rate_pct` TIDAK diubah caranya: angka dari AI diteruskan apa adanya.
 */
export function toKeywordAnalysis(
  v: unknown,
  opts?: { source?: KeywordSource; cvText?: string },
): KeywordAnalysis | null {
  if (!isRecord(v)) return null;
  const matched = toTextList(v.matched);
  const source = opts?.source ?? toKeywordSource(v.source);
  const evidence = toEvidenceList(v.evidence, matched, opts?.cvText);
  const placements = toPlacementList(v.placements);
  const requirements = toRequirementList(v.requirements, source, opts?.cvText);
  const semanticMatched = v.semantic_matched !== undefined ? toTextList(v.semantic_matched) : undefined;
  const semanticRate = v.semantic_match_rate_pct !== undefined ? toNumber(v.semantic_match_rate_pct) : null;
  return {
    matched,
    missing_critical: toTextList(v.missing_critical),
    missing_nice_to_have: toTextList(v.missing_nice_to_have),
    synonym_suggestions: toTextList(v.synonym_suggestions),
    match_rate_pct: toScore(v.match_rate_pct, 0),
    ...(source ? { source } : {}),
    ...(evidence.length > 0 ? { evidence } : {}),
    ...(placements.length > 0 ? { placements } : {}),
    ...(requirements.length > 0 ? { requirements } : {}),
    ...(semanticMatched !== undefined ? { semantic_matched: semanticMatched } : {}),
    ...(semanticRate !== null ? { semantic_match_rate_pct: semanticRate } : {}),
  };
}

function toNarrativeFeedback(v: unknown): NarrativeFeedback | null {
  if (!isRecord(v)) return null;
  return {
    overall_assessment: toText(v.overall_assessment),
    strengths: toTextList(v.strengths),
    areas_for_improvement: toTextList(v.areas_for_improvement),
    ats_recommendations: toTextList(v.ats_recommendations),
  };
}

function toActionPlan(v: unknown): ActionPlan | null {
  if (!isRecord(v)) return null;
  return {
    quick_wins: toTextList(v.quick_wins),
    short_term: toTextList(v.short_term),
    long_term: toTextList(v.long_term),
  };
}

/** Komponen BulletReviewCard membaca field tiap item langsung (section, issues,
 *  suggested_rewrite, priority), jadi tiap baris diluruskan di sini: entri yang
 *  bukan objek dibuang, field yang hilang diisi default yang sama dengan schema. */
function toBulletReview(v: unknown): BulletItem[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isRecord).map((item) => {
    const cari = toNumber(item.cari_score);
    return {
      section: toText(item.section),
      original_text: toText(item.original_text),
      issues: toIssueList(item.issues),
      suggested_rewrite: toText(item.suggested_rewrite),
      priority:
        item.priority === "High" || item.priority === "Medium" || item.priority === "Low" ? item.priority : "Medium",
      ...(cari !== null ? { cari_score: cari } : {}),
    };
  });
}

/** Bobot dipakai sebagai penjelasan skor ("35% experience"), jadi bobot yang
 *  hilang berarti angka itu tidak pernah ada. Lebih jujur catatan bobotnya
 *  disembunyikan daripada menampilkan 0% yang mengarang. */
function toWeightsApplied(v: unknown): WeightsApplied | null {
  if (!isRecord(v) || typeof v.role_category !== "string") return null;
  const summary = toNumber(v.summary_weight);
  const experience = toNumber(v.experience_weight);
  const skills = toNumber(v.skills_weight);
  const education = toNumber(v.education_weight);
  const formatAts = toNumber(v.format_ats_weight);
  if (summary === null || experience === null || skills === null || education === null || formatAts === null) {
    return null;
  }
  return {
    role_category: v.role_category,
    summary_weight: summary,
    experience_weight: experience,
    skills_weight: skills,
    education_weight: education,
    format_ats_weight: formatAts,
  };
}

/** Proyeksi skor adalah angka yang ditampilkan sebagai janji hasil, jadi hanya
 *  diteruskan kalau ketiganya benar-benar ada; kalau tidak, kartu disembunyikan
 *  oleh ImpactForecastCard yang memeriksa sendiri. */
function toImpactForecast(v: unknown): ImpactForecast | null {
  if (!isRecord(v)) return null;
  const current = toNumber(v.current_score);
  const quickWins = toNumber(v.projected_after_quick_wins);
  const allFixes = toNumber(v.projected_after_all_fixes);
  if (current === null || quickWins === null || allFixes === null) return null;
  return {
    current_score: current,
    projected_after_quick_wins: quickWins,
    projected_after_all_fixes: allFixes,
  };
}

/* ── Ringkasan 10 detik (v5) ── */

const QUICK_TARGETS: readonly QuickFixTargetSection[] = ["hr", "skor", "keyword", "checklist"];
const QUICK_IMPACTS: readonly QuickFixImpact[] = ["Tinggi", "Sedang", "Rendah"];
const QUICK_IMPACT_RANK: Record<QuickFixImpact, number> = { Tinggi: 0, Sedang: 1, Rendah: 2 };

/** Satu perbaikan cepat. Nilai di luar daftar tertutup (target_section/impact
 *  sembarangan, title kosong) membuat SELURUH fix dibuang, bukan diganti default:
 *  chip dampak dan tombol "Lihat" menampilkan klaim yang tidak boleh dikarang.
 *  `est_minutes` dibulatkan lalu dibatasi 1–60; bukan angka (null setelah
 *  `.catch(undefined)` schema) → fieldnya tidak ikut, tampil tanpa menit. */
function toQuickFix(v: unknown): QuickFix | null {
  if (!isRecord(v)) return null;
  const title = toText(v.title).trim();
  const target = QUICK_TARGETS.includes(v.target_section as QuickFixTargetSection)
    ? (v.target_section as QuickFixTargetSection)
    : null;
  const impact = QUICK_IMPACTS.includes(v.impact as QuickFixImpact)
    ? (v.impact as QuickFixImpact)
    : null;
  if (!title || !target || !impact) return null;

  const estRaw = toNumber(v.est_minutes);
  const estMinutes = estRaw === null ? undefined : Math.min(60, Math.max(1, Math.round(estRaw)));
  const copyText = toText(v.copy_text).trim();
  return {
    id: toText(v.id).trim(),
    title,
    target_section: target,
    impact,
    ...(estMinutes !== undefined ? { est_minutes: estMinutes } : {}),
    ...(copyText ? { copy_text: copyText } : {}),
  };
}

/**
 * Normalisasi Ringkasan 10 detik untuk respons live (route analyze) dan baris
 * tersimpan. Null kalau `verdict` dan `top_fixes` sama-sama kosong — termasuk
 * baris lama yang fieldnya tidak pernah ada, sehingga kartu tidak muncul, bukan
 * tampil judul tanpa isi.
 *
 * Urutan deterministik: Tinggi → Sedang → Rendah, lalu `est_minutes` naik
 * (tanpa menit dianggap paling besar supaya yang ber-estimasi menang). `sort`
 * stabil, jadi fix dengan peringkat sama tetap sesuai urutan input → input sama
 * selalu menghasilkan output sama. Cap 5 fix / 3 strengths dipotong SETELAH
 * sort. Idempoten: hasil dinormalisasi tidak berubah saat diproses ulang, jadi
 * route analyze (respons + penyimpanan) dan mapper baris tersimpan aman memakai
 * fungsi yang sama.
 */
export function toQuickSummary(v: unknown): QuickSummary | null {
  if (!isRecord(v)) return null;
  const verdict = toText(v.verdict).trim();
  const topFixes = (Array.isArray(v.top_fixes) ? v.top_fixes : [])
    .map(toQuickFix)
    .filter((fix): fix is QuickFix => fix !== null)
    .sort((a, b) =>
      QUICK_IMPACT_RANK[a.impact] - QUICK_IMPACT_RANK[b.impact] ||
      (a.est_minutes ?? Number.POSITIVE_INFINITY) - (b.est_minutes ?? Number.POSITIVE_INFINITY))
    .slice(0, 5);
  if (!verdict && topFixes.length === 0) return null;
  return {
    verdict,
    top_strengths: toTextList(v.top_strengths).slice(0, 3),
    top_fixes: topFixes,
  };
}

/** Grade dan prediksi ATS punya daftar nilai tertutup; jsonb bisa berisi apa saja,
 *  sedangkan UI mewarnainya berdasarkan daftar itu. */
function toGrade(v: unknown): "A" | "B" | "C" | "D" | null {
  return v === "A" || v === "B" || v === "C" || v === "D" ? v : null;
}

function toAtsPrediction(v: unknown): "Likely Pass" | "Borderline" | "Likely Fail" | null {
  return v === "Likely Pass" || v === "Borderline" || v === "Likely Fail" ? v : null;
}

/** Badge model hanya boleh menampilkan model yang benar-benar dipakai; nilai
 *  di luar daftar itu (atau baris lama yang belum menyimpannya) jadi undefined. */
function toAiModel(v: unknown): "V4 Pro" | "V4 Flash" | undefined {
  return v === "V4 Pro" || v === "V4 Flash" ? v : undefined;
}

/* ── Panel HR (v5, prompt 3) ── */

const HR_SCAN_KEYS = ["last_title", "total_experience", "top_achievement", "key_skills"] as const;
const HR_SCAN_STATUSES: readonly HrScanStatus[] = ["terbaca", "samar", "tidak_terbaca"];
const HR_FLAG_TYPES = ["red", "green"] as const;
const KNOCKOUT_STATUSES: readonly KnockoutStatus[] = ["terpenuhi", "belum_terlihat", "tidak_ada"];

/** Spasi dan kapitalisasi bukan bagian dari bukti: "Bertumbuh  % " dianggap
 *  kutipan "bertumbuh %" dari CV. Hanya dipakai untuk MEMERIKSA, bukan
 *  menampilkan — teks asli tetap yang disimpan. */
function normalizeForEvidence(s: string): string {
  return s.replace(/\s+/g, " ").toLowerCase().trim();
}

/**
 * `evidence` sah hanya kalau berupa potongan teks CV sendiri; selain itu
 * kosongkan (flag tetap ada, buktinya hilang). `cvText` kosong berarti teks CV
 * tidak tersedia untuk diperiksa (mis. hasil tersimpan sudah divalidasi saat
 * ditulis) — bukti diteruskan apa adanya.
 */
export function isVerbatimCvText(cvText: string | undefined, evidence: string): boolean {
  const needle = normalizeForEvidence(evidence);
  if (!needle) return false;
  if (!cvText || !cvText.trim()) return true;
  return normalizeForEvidence(cvText).includes(needle);
}

function toHrScanField(v: unknown): HrScanField | null {
  if (!isRecord(v)) return null;
  const status = HR_SCAN_STATUSES.includes(v.status as HrScanStatus) ? (v.status as HrScanStatus) : null;
  // Status invalid = kunci dibuang, bukan jadi "terbaca" palsu di kotak HR.
  if (!status) return null;
  const value = toText(v.value).trim() || null;
  const note = toText(v.note).trim();
  return { value, status, ...(note ? { note } : {}) };
}

/** Scan 30 detik. Kunci dengan status invalid dibuang; semua-kunci-rusak → null. */
export function toHrScan(v: unknown): HrScan | null {
  if (!isRecord(v)) return null;
  const out: HrScan = {};
  for (const key of HR_SCAN_KEYS) {
    const field = toHrScanField(v[key]);
    if (field) out[key] = field;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function toHrFlagFix(v: unknown): HrFlag["fix"] | undefined {
  if (!isRecord(v)) return undefined;
  const copyText = toText(v.copy_text).trim();
  if (!copyText) return undefined;
  const replaces = toText(v.replaces).trim();
  return { copy_text: copyText, ...(replaces ? { replaces } : {}) };
}

/** Red/green flag: type/label invalid membuat SELURUH baris dibuang; evidence
 *  divalidasi ke teks CV bila tersedia. */
export function toHrFlags(v: unknown, cvText?: string): HrFlag[] {
  if (!Array.isArray(v)) return [];
  const out: HrFlag[] = [];
  for (const raw of v) {
    if (!isRecord(raw)) continue;
    const type = HR_FLAG_TYPES.includes(raw.type as HrFlag["type"])
      ? (raw.type as HrFlag["type"])
      : null;
    const label = toText(raw.label).trim();
    if (!type || !label) continue;
    const evidence = toText(raw.evidence).trim();
    const fix = toHrFlagFix(raw.fix);
    out.push({
      type,
      label,
      ...(evidence && isVerbatimCvText(cvText, evidence) ? { evidence } : {}),
      ...(fix ? { fix } : {}),
    });
    if (out.length >= 8) break;
  }
  return out;
}

/** Pertanyaan HR: question kosong = baris dibuang; tanpa cap 5 bisa jadi daftar
 *  yang tidak pernah selesai dibaca. */
export function toHrQuestions(v: unknown): HrQuestion[] {
  if (!Array.isArray(v)) return [];
  const out: HrQuestion[] = [];
  for (const raw of v) {
    if (!isRecord(raw)) continue;
    const question = toText(raw.question).trim();
    if (!question) continue;
    const whyAsked = toText(raw.why_asked).trim();
    const answerTip = toText(raw.answer_tip).trim();
    out.push({
      question,
      ...(whyAsked ? { why_asked: whyAsked } : {}),
      ...(answerTip ? { answer_tip: answerTip } : {}),
    } as HrQuestion);
    if (out.length >= 5) break;
  }
  return out;
}

/** Risiko syarat wajib: requirement kosong atau status invalid = baris dibuang;
 *  evidence divalidasi ke teks CV seperti hr_flags. */
export function toKnockoutRisks(v: unknown, cvText?: string): KnockoutRisk[] {
  if (!Array.isArray(v)) return [];
  const out: KnockoutRisk[] = [];
  for (const raw of v) {
    if (!isRecord(raw)) continue;
    const requirement = toText(raw.requirement).trim();
    const status = KNOCKOUT_STATUSES.includes(raw.status as KnockoutStatus)
      ? (raw.status as KnockoutStatus)
      : null;
    if (!requirement || !status) continue;
    const evidence = toText(raw.evidence).trim();
    const tip = toText(raw.tip).trim();
    out.push({
      requirement,
      status,
      ...(evidence && isVerbatimCvText(cvText, evidence) ? { evidence } : {}),
      ...(tip ? { tip } : {}),
    });
    if (out.length >= 8) break;
  }
  return out;
}

/** Format durasi kerja: tanpa copy_text tidak ada yang bisa disalin, jadi null. */
export function toDurationRewrite(v: unknown): DurationRewrite | null {
  if (!isRecord(v)) return null;
  const copyText = toText(v.copy_text).trim();
  if (!copyText) return null;
  const replaces = toText(v.replaces).trim();
  return { copy_text: copyText, ...(replaces ? { replaces } : {}) };
}

/**
 * Bentukkan hasil analisis dari baris yang tersimpan di `checker_results`.
 *
 * Dipisah dari komponen supaya bisa diuji dan supaya kolom jsonb yang tidak
 * lengkap tidak dipercaya begitu saja. Aturannya satu: apa yang tidak ada di
 * baris tidak dimunculkan sebagai angka — section breakdown, bobot, dan proyeksi
 * skor hilang kalau tidak lengkap, bukan diisi default yang terlihat meyakinkan.
 *
 * `meta`, `careerVelocity`, dan `atsPredictionDetail` diteruskan apa adanya:
 * seluruh field di dalamnya opsional di sisi Client, jadi panel sisi HR bisa
 * menampilkan fallback sendiri tanpa angka yang mengarang.
 */
export function analysisFromFullResult(id: string, data: StoredResult): StoredAnalysisResult {
  const scores = asRecord(data.scores);
  const feedback = asRecord(data.aiFeedback);
  const full = asRecord(data.fullResult);

  return {
    id,
    scores: {
      overall: toScore(scores.overall, 0),
      keywordGap: toScore(scores.keywordGap, 0),
      contextRelevance: toScore(scores.contextRelevance, 0),
      atsRules: toScore(scores.atsRules, 0),
    },
    aiFeedback: {
      keywordGap: toText(feedback.keywordGap),
      contextRelevance: toText(feedback.contextRelevance),
      atsRules: toText(feedback.atsRules),
      summary: toText(feedback.summary),
    },
    summary: toText(feedback.summary),
    grade: toGrade(full.grade),
    atsPrediction: toAtsPrediction(full.atsPrediction),
    breakdown: toBreakdown(full.breakdown),
    keywordAnalysis: toKeywordAnalysis(full.keywordAnalysis),
    narrativeFeedback: toNarrativeFeedback(full.narrativeFeedback),
    actionPlan: toActionPlan(full.actionPlan),
    bulletReview: toBulletReview(full.bulletReview),
    missingSections: toMissingSections(full.missingSections),
    weightsApplied: toWeightsApplied(full.weightsApplied),
    impactForecast: toImpactForecast(full.impactForecast),
    meta: full.meta ?? null,
    careerVelocity: full.careerVelocity ?? null,
    atsPredictionDetail: full.atsPredictionDetail ?? null,
    // Disimpan route analyze di dalam full_result, bukan jadi kolom sendiri.
    aiModel: toAiModel(full.aiModel),
    // Baris lama tanpa field ini → null, jadi kartu Ringkasan 10 detik tidak muncul.
    quickSummary: toQuickSummary(full.quickSummary),
    /* Panel HR (prompt 3). Evidence sudah divalidasi ke teks CV di route
     * analyze saat baris ditulis, jadi mapper di sini tidak memeriksa ulang. */
    hrScan: toHrScan(full.hrScan),
    hrFlags: toHrFlags(full.hrFlags),
    hrQuestions: toHrQuestions(full.hrQuestions),
    knockoutRisks: toKnockoutRisks(full.knockoutRisks),
    durationRewrite: toDurationRewrite(full.durationRewrite),
  };
}
