"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import AuthGuard from "@/components/AuthGuard";
import MagneticButton from "@/components/MagneticButton";
import { useToast } from "@/components/ui/toast";
import { LetterPreview } from "@/components/cover-letter/LetterPreview";
import { PICKER_TEMPLATES, getLetterTemplate, letterTemplateText, type LetterTemplate } from "@/components/cover-letter/letterTemplates";
import { fill, localeFor, useTranslation } from "@/lib/i18n";
import { exportPdfViaServer } from "@/lib/pdf-export";
import { useCoverLetterQuota } from "@/hooks/useCoverLetterQuota";
import type { CvData } from "@/components/cv-templates";

/* ── Tipe hasil surat ── */
interface LetterItem {
  id: string;
  cvId: string | null;
  jobTitle: string | null;
  companyName: string | null;
  recipientName: string | null;
  language: "id" | "en";
  style: string;
  subject: string | null;
  letterNumber: string | null;
  attachment: string | null;
  jobSource?: string | null;
  companyAddress?: string | null;
  motivationReason?: string | null;
  futurePlan?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface CvOption {
  id: string;
  jobTitle: string | null;
  updatedAt: string;
}

const VALID_STYLES = ["formal", "casual", "ats", "formal_lengkap", "motivation"] as const;
type LetterStyle = (typeof VALID_STYLES)[number];

function styleLabel(style: string, lang: "id" | "en" = "id"): string {
  if (style === "ats") return "Cover (EN)";
  if (style === "casual") return lang === "en" ? "Casual" : "Kasual";
  if (style === "formal_lengkap") return "Formal + Kop";
  if (style === "motivation") return "Motivation";
  return "Formal";
}

/** Mapping style → template id (untuk URL ?style=) */
function templateIdForStyle(style: string): string {
  if (style === "formal_lengkap") return "formal-lengkap";
  if (style === "ats") return "ats-cover";
  if (style === "motivation") return "motivation";
  if (style === "casual") return "casual";
  return "formal";
}

const STEP_KEYS = ["cl.step-template", "cl.step-data", "cl.step-result"];

export default function SuratLamaranApp({ cvId }: { cvId: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const styleFromUrl = searchParams.get("style");
  const letterFromUrl = searchParams.get("letter");
  const { addToast } = useToast();
  const quota = useCoverLetterQuota();
  const { t, lang } = useTranslation();

  /* ── Stepper ── */
  // Jika datang dengan cvId (dari dashboard/dropdown) atau style (dari ReviewStep),
  // langsung ke Step 2 (Data Surat), template sudah ditentukan dari URL.
  const [activeStep, setActiveStep] = useState(cvId || styleFromUrl ? 1 : 0);

  const [cvData, setCvData] = useState<CvData | null>(null);
  const [cvLoading, setCvLoading] = useState(true);

  // Mode sumber data, default MANUAL agar form nama/data selalu terlihat.
  // (Sebelumnya default "cv" membuat user tanpa CV terjebak: form tersembunyi
  // + tombol generate terkunci "Pilih CV dulu di atas" padahal tidak ada CV.)
  const [sourceMode, setSourceMode] = useState<"cv" | "manual">("manual");
  const [cvOptions, setCvOptions] = useState<CvOption[]>([]);
  const [cvOptionsLoading, setCvOptionsLoading] = useState(false);

  // Data manual, dipakai saat membuat surat dari nol (tanpa CV)
  // Field kaya (pengalaman, pendidikan, skill, deskripsi lowongan) membuat
  // hasil AI jauh lebih relevan, route generate sudah mendukung semua ini.
  const [manual, setManual] = useState({
    fullName: "",
    position: "",
    email: "",
    phone: "",
    address: "",
    summary: "",
    jobDescription: "",
    skills: "",
    workHistory: [{ position: "", company: "", startDate: "", endDate: "", description: "" }],
    education: [{ degree: "", field: "", institution: "" }],
  });

  // Helper update entri dinamis (pengalaman kerja / pendidikan)
  const updateManualEntry = useCallback(
    (key: "workHistory" | "education", index: number, field: string, value: string) => {
      setManual((m) => ({
        ...m,
        [key]: m[key].map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)),
      }));
    },
    []
  );
  // Batas atas entri dinamis, cegah form meledak & surat terlalu panjang
  const MAX_WORK = 5;
  const MAX_EDU = 4;
  const addManualEntry = useCallback((key: "workHistory" | "education") => {
    setManual((m) => {
      const cap = key === "workHistory" ? MAX_WORK : MAX_EDU;
      if (m[key].length >= cap) return m;
      return {
        ...m,
        [key]:
          key === "workHistory"
            ? [...m.workHistory, { position: "", company: "", startDate: "", endDate: "", description: "" }]
            : [...m.education, { degree: "", field: "", institution: "" }],
      };
    });
  }, []);
  const removeManualEntry = useCallback((key: "workHistory" | "education", index: number) => {
    setManual((m) => ({
      ...m,
      [key]: m[key].filter((_, i) => i !== index),
    }));
  }, []);

  // Template terpilih (jenis + format visual)
  const [templateId, setTemplateId] = useState<string>(() =>
    styleFromUrl ? templateIdForStyle(styleFromUrl) : "formal"
  );
  const template: LetterTemplate = getLetterTemplate(templateId);

  // Form state
  const [language, setLanguage] = useState<"id" | "en">(() =>
    (VALID_STYLES.find((s) => s === styleFromUrl) ?? "") === "ats" ? "en" : "id"
  );
  const [style, setStyle] = useState<LetterStyle>(() =>
    VALID_STYLES.find((s) => s === styleFromUrl) ?? "formal"
  );
  const [companyName, setCompanyName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [letterNumber, setLetterNumber] = useState("");
  const [attachment, setAttachment] = useState("");
  const [jobSource, setJobSource] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [motivationReason, setMotivationReason] = useState("");
  const [futurePlan, setFuturePlan] = useState("");

  // Result state
  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [activeLetter, setActiveLetter] = useState<LetterItem | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);

  /* ── Editor blok paragraf (ergonomi ala builder CV) ──
   * content = sumber kebenaran (disimpan ke DB). ParaBlocks adalah tampilan
   * terstruktur utk editing: di-split per paragraf (\n\n), lalu di-join
   * kembali saat commit. lastContentRef mencegah loop: hanya perubahan
   * content dari LUAR (generate/load) yang menyegarkan blok; edit user
   * lewat blok TIDAK memicu re-split. */
  const [paraBlocks, setParaBlocks] = useState<string[]>([]);
  const lastContentRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastContentRef.current !== content) {
      lastContentRef.current = content;
      setParaBlocks(
        (content ?? "")
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean)
      );
    }
  }, [content]);

  const commitBlocks = useCallback((blocks: string[]) => {
    const joined = blocks.join("\n\n");
    lastContentRef.current = joined;
    setParaBlocks(blocks);
    setContent(joined);
    setDirty(true);
  }, []);

  const updateBlock = useCallback(
    (i: number, value: string) => {
      commitBlocks(paraBlocks.map((b, j) => (j === i ? value : b)));
    },
    [paraBlocks, commitBlocks]
  );

  const moveBlock = useCallback(
    (i: number, dir: -1 | 1) => {
      const j = i + dir;
      if (j < 0 || j >= paraBlocks.length) return;
      const next = [...paraBlocks];
      [next[i], next[j]] = [next[j], next[i]];
      commitBlocks(next);
    },
    [paraBlocks, commitBlocks]
  );

  const removeBlock = useCallback(
    (i: number) => {
      commitBlocks(paraBlocks.filter((_, j) => j !== i));
    },
    [paraBlocks, commitBlocks]
  );

  const addBlock = useCallback(() => {
    setParaBlocks((p) => [...p, ""]);
  }, []);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  /* ── Pilih template → set style + bahasa default ── */
  const selectTemplate = useCallback(
    (tpl: LetterTemplate) => {
      setTemplateId(tpl.id);
      setStyle(tpl.style as LetterStyle);
      if (tpl.style === "formal_lengkap") setLanguage("id");
      else setLanguage(tpl.defaultLang);
    },
    []
  );

  /* ── Load CV data (hanya jika dibuat dari CV) ── */
  useEffect(() => {
    if (!cvId) {
      setCvData(null);
      setCvLoading(false);
      return;
    }
    setCvLoading(true);
    fetch(`/api/cv-documents/${cvId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(fill(t("cl.cv-load-failed"), { status: res.status }));
        return res.json();
      })
      .then((data) => {
        const tc = data.tailoredContent || {};
        const pi = tc.personalInfo || {};
        setCvData({
          fullName: pi.fullName || "",
          phone: pi.phone || "",
          email: pi.email || "",
          address: pi.address || "",
          linkedin: pi.linkedin || "",
          summary: pi.summary || "",
          jobTitle: data.jobTitle || "",
          jobDescription: data.jobDescription || "",
          professionalTitle: pi.professionalTitle || "",
          workHistory: tc.workHistory || [],
          education: tc.education || [],
          organisations: tc.organisations || [],
          skills: tc.skills || [],
          certifications: tc.certifications || [],
          cvLang: tc.cvLang || "id",
          customFields: [],
        } as CvData);
      })
      .catch((err) => addToast({ type: "error", message: err.message }))
      .finally(() => setCvLoading(false));
  }, [cvId, addToast]);

  /* ── Load daftar CV user (untuk pemilih sumber "Dari CV") ──
   * Selalu fetch saat halaman standalone (!cvId), TIDAK digate oleh
   * sourceMode, karena default mode sekarang "manual" dan tombol
   * "Dari CV" butuh daftar ini sudah terisi saat diklik. */
  useEffect(() => {
    if (cvId) return;
    setCvOptionsLoading(true);
    fetch("/api/cv-documents")
      .then((res) => res.json())
      .then((data) => setCvOptions(Array.isArray(data) ? data : []))
      .catch(() => setCvOptions([]))
      .finally(() => setCvOptionsLoading(false));
  }, [cvId]);

  /* ── Load riwayat surat (per CV atau semua surat tanpa CV) ── */
  const loadLetters = useCallback(() => {
    const url = cvId
      ? `/api/cover-letter?cvId=${encodeURIComponent(cvId)}`
      : `/api/cover-letter?standalone=1`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const list: LetterItem[] = Array.isArray(data) ? data : [];
        setLetters(list);
        if (list.length > 0 && !styleFromUrl) {
          if (letterFromUrl) {
            setActiveLetter((prev) => prev ?? list.find((l: LetterItem) => l.id === letterFromUrl) ?? list[0]);
          } else {
            setActiveLetter((prev) => prev ?? list[0]);
          }
        }
      })
      .catch(() => {});
  }, [cvId, styleFromUrl, letterFromUrl]);

  useEffect(() => {
    loadLetters();
  }, [loadLetters]);

  /* ── Fetch detail surat (dengan content) saat surat aktif dipilih ──
   * List API (/api/cover-letter) TIDAK mengembalikan content, hanya detail
   * (/api/cover-letter/[id]) yang lengkap. Tanpa ini, activeLetter.content
   * undefined → LetterPreview crash .split(). */
  const loadLetterDetail = useCallback(
    (id: string) => {
      fetch(`/api/cover-letter/${id}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(t("cl.letter-load-failed")))))
        .then((full) => {
          setSubject(full.subject || "");
          setContent(full.content ?? "");
          setLanguage(full.language || "id");
          if (!styleFromUrl) {
            setStyle((full.style as LetterStyle) || "formal");
            setTemplateId(templateIdForStyle(full.style));
          }
          setCompanyName(full.companyName || "");
          setRecipientName(full.recipientName || "");
          setLetterNumber(full.letterNumber || "");
          setAttachment(full.attachment || "");
          setJobSource(full.jobSource || "");
          setCompanyAddress(full.companyAddress || "");
          setMotivationReason(full.motivationReason || "");
          setFuturePlan(full.futurePlan || "");
          setDirty(false);
          setActiveStep(2);
        })
        .catch(() => {
          /* server down, biarkan default */
        });
    },
    [styleFromUrl]
  );

  // Sinkronkan form language/style dengan surat aktif (ambil detail lengkap)
  useEffect(() => {
    if (activeLetter) {
      loadLetterDetail(activeLetter.id);
    }
  }, [activeLetter?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Generate AI ── */
  const handleGenerate = async () => {
    // Dari nol: minimal nama & posisi agar surat tidak kosong/boros kuota
    if (!sourceCvId && (!manual.fullName.trim() || !manual.position.trim())) {
      addToast({ type: "error", message: t("cl.need-name-position") });
      return;
    }
    setGenerating(true);
    try {
      const body: Record<string, unknown> = {
        language: style === "formal_lengkap" ? "id" : language,
        style,
        companyName: companyName.trim(),
        recipientName: recipientName.trim(),
        letterNumber: letterNumber.trim(),
        attachment: attachment.trim(),
        jobSource: jobSource.trim(),
        companyAddress: companyAddress.trim(),
        motivationReason: motivationReason.trim(),
        futurePlan: futurePlan.trim(),
      };
      if (sourceCvId) {
        body.cvId = sourceCvId;
      } else {
        body.position = manual.position.trim();
        body.fullName = manual.fullName.trim();
        body.email = manual.email.trim();
        body.phone = manual.phone.trim();
        body.address = manual.address.trim();
        body.summary = manual.summary.trim();
        // Field kaya → hasil AI lebih relevan dengan lowongan & pengalaman nyata
        body.jobDescription = manual.jobDescription.trim();
        body.skills = manual.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name }));
        body.workHistory = manual.workHistory
          .filter((w) => w.position.trim() || w.company.trim())
          .map((w) => ({
            position: w.position.trim(),
            company: w.company.trim(),
            startDate: w.startDate.trim(),
            endDate: w.endDate.trim(),
            description: w.description.trim(),
          }));
        body.education = manual.education
          .filter((e) => e.degree.trim() || e.institution.trim())
          .map((e) => ({
            degree: e.degree.trim(),
            field: e.field.trim(),
            institution: e.institution.trim(),
          }));
      }

      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.redirectUrl) {
          addToast({ type: "warning", message: data.message || t("cl.upgrade") });
          setTimeout(() => router.push(data.redirectUrl!), 1500);
          return;
        }
        throw new Error(data.message || data.error || t("cl.gen-failed"));
      }

      const newLetter: LetterItem = {
        id: data.id,
        cvId: sourceCvId,
        jobTitle: cvData?.jobTitle || manual.position.trim() || activeLetter?.jobTitle || null,
        companyName: companyName || null,
        recipientName: recipientName || null,
        language: style === "formal_lengkap" ? "id" : language,
        style,
        subject: data.subject,
        content: data.content,
        letterNumber: data.letterNumber || null,
        attachment: data.attachment || null,
        jobSource: data.jobSource || null,
        companyAddress: data.companyAddress || null,
        motivationReason: data.motivationReason || null,
        futurePlan: data.futurePlan || null,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
      };
      setActiveLetter(newLetter);
      setSubject(data.subject);
      setContent(data.content);
      setDirty(false);
      loadLetters();
      setActiveStep(2);
      addToast({ type: "success", message: t("cl.gen-ok") });
    } catch (err: any) {
      addToast({ type: "error", message: err.message || t("cl.gen-failed") });
    } finally {
      setGenerating(false);
    }
  };

  /* ── Save edits ── */
  const handleSave = async () => {
    if (!activeLetter) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cover-letter/${activeLetter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, subject, letterNumber, attachment, jobSource, companyAddress, motivationReason, futurePlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t("cl.save-failed"));
      setDirty(false);
      setActiveLetter((prev) => (prev ? { ...prev, content, subject, letterNumber, attachment, jobSource, companyAddress, motivationReason, futurePlan, updatedAt: new Date().toISOString() } : prev));
      loadLetters();
      addToast({ type: "success", message: t("cl.saved") });
    } catch (err: any) {
      addToast({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  /* ── Copy text ── */
  const handleCopy = async () => {
    try {
      const isLengkap = activeLetter?.style === "formal_lengkap" || template.format.letterhead;
      let text: string;
      const senderName = cvData?.fullName || manual.fullName || "";
      const senderContact = [cvData?.address || manual.address, cvData?.phone || manual.phone, cvData?.email || manual.email]
        .filter(Boolean)
        .join(" • ");
      if (isLengkap) {
        const senderLines = [senderName || "[Nama Lengkap]", senderContact].filter(Boolean);
        const metaLines = [
          letterNumber ? `Nomor: ${letterNumber}` : "",
          `Lampiran: ${attachment || "1 (satu) berkas"}`,
          `Perihal: ${subject || ""}`,
        ].filter(Boolean);
        text = [...senderLines, "", ...metaLines, "", content].join("\n");
      } else {
        text = `${subject ? `Perihal: ${subject}\n\n` : ""}${content}`;
      }
      await navigator.clipboard.writeText(text);
      addToast({ type: "success", message: t("cl.copied") });
    } catch {
      addToast({ type: "error", message: t("cl.copy-failed") });
    }
  };

  /* ── Export PDF ── */
  const handleExportPdf = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const sender = cvData?.fullName || manual.fullName || "";
      const name = sender ? `${sender}_Surat_Lamaran.pdf` : "Surat_Lamaran.pdf";
      // Margin 0: elemen A4 surat membawa padding sendiri (20mm 22mm),
      // sehingga hasil PDF sama persis dengan preview, tanpa margin ganda.
      // contentAreaMm = 297: satu slice = satu halaman A4 penuh (fallback
      // html2canvas slicing per halaman, auto-download tanpa dialog print).
      const result = await exportPdfViaServer(previewRef.current, name, 0, 297);
      if (!result.ok) {
        addToast({ type: result.redirectUrl ? "warning" : "error", message: result.error || t("cl.pdf-failed") });
      } else if (result.usedFallback) {
        // Versi gambar (fallback), beri tahu user jujur
        addToast({
          type: "warning",
          message: t("cl.pdf-image-fallback"),
        });
      } else {
        addToast({ type: "success", message: "PDF teks berhasil diunduh!" });
      }
    } catch (err) {
      addToast({ type: "error", message: t("cl.pdf-failed") });
    } finally {
      setExporting(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    if (!confirm(t("cl.delete-confirm"))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cover-letter/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t("cl.delete-failed"));
      setLetters((prev) => prev.filter((l) => l.id !== id));
      if (activeLetter?.id === id) {
        const remaining = letters.filter((l) => l.id !== id);
        setActiveLetter(remaining[0] || null);
        if (!remaining[0]) {
          setSubject("");
          setContent("");
        }
      }
      addToast({ type: "success", message: t("cl.deleted") });
    } catch (err: any) {
      addToast({ type: "error", message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const senderName = cvData?.fullName || manual.fullName;
  const senderAddress = cvData?.address || manual.address;
  const senderPhone = cvData?.phone || manual.phone;
  const senderEmail = cvData?.email || manual.email;

  // Sumber CV: dari URL, atau dari surat yang sedang diedit (regenerate pakai data aslinya).
  // HORMATI sourceMode saat halaman standalone: jika user pilih "Isi Manual",
  // data manual dipakai meski surat aktif berasal dari CV (input tidak diabaikan).
  const sourceCvId = cvId ?? (sourceMode === "manual" ? null : activeLetter?.cvId ?? null);
  // Mode "Dari CV" tanpa sumber CV = belum pilih CV → generate belum bisa
  const generateDisabled = !sourceCvId && !activeLetter && sourceMode === "cv";

  const stepMeta = [
    { title: t("cl.s1-title"), desc: t("cl.s1-desc"), icon: "dashboard_customize" },
    { title: t("cl.step-data"), desc: cvId ? t("cl.s2-desc-cv") : t("cl.s2-desc"), icon: "edit_note" },
    { title: t("cl.step-result"), desc: t("cl.s3-desc"), icon: "task_alt" },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-on-background">
        <AppHeader />
        <main className="pt-24 pb-20 px-margin-mobile md:px-gutter">
          <div className="max-w-[1200px] mx-auto space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <Link
                  href={cvId ? `/builder/${cvId}` : "/dashboard"}
                  className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  {cvId ? t("cl.back-builder") : t("bskel.back")}
                </Link>
                <h1 className="font-headline-lg text-on-surface mt-2">
                  {t("cl.title")}
                </h1>
                <p className="font-body-md text-on-surface-variant">
                  {cvId && cvData?.jobTitle
                    ? fill(t("cl.target"), { title: cvData.jobTitle })
                    : t("cl.subtitle")}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {quota && !quota.isUnlimited && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
                    {fill(t("review.quota"), { n: String(quota.remaining), max: String(quota.limit) })}
                  </span>
                )}
                {quota && quota.isUnlimited && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                    Unlimited Premium
                  </span>
                )}
              </div>
            </div>

            {/* ── STEPPER ── */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 shadow-premium-sm px-3 py-3 md:px-5 flex items-center gap-1 overflow-x-auto custom-scrollbar">
              {STEP_KEYS.map((key, i) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveStep(i)}
                  disabled={i === 2 && !activeLetter && letters.length === 0 && !content}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    activeStep === i
                      ? "bg-primary/10 text-primary"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      activeStep === i ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {t(key)}
                </button>
              ))}
            </div>

            {cvLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-40 bg-surface rounded-2xl" />
                <div className="h-96 bg-surface rounded-2xl" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* ════ LEFT: STEP CONTENT ════ */}
                <div className="space-y-5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* ── STEP 1: TEMPLATE ── */}
                      {activeStep === 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{stepMeta[0].icon}</span>
                            </div>
                            <div>
                              <h2 className="font-label-bold text-on-surface">{stepMeta[0].title}</h2>
                              <p className="text-xs text-on-surface-variant">{stepMeta[0].desc}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {PICKER_TEMPLATES.map((tpl) => {
                              const active = templateId === tpl.id;
                              return (
                                <button
                                  key={tpl.id}
                                  type="button"
                                  onClick={() => selectTemplate(tpl)}
                                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all group ${
                                    active
                                      ? "border-primary bg-primary/5 shadow-premium-sm"
                                      : "border-outline-variant/50 hover:border-primary/40 hover:bg-surface-container-lowest"
                                  }`}
                                >
                                  {/* Mini preview format */}
                                  <div
                                    className="w-14 h-[76px] shrink-0 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-2 overflow-hidden"
                                    style={{ fontFamily: tpl.format.fontFamily }}
                                  >
                                    {tpl.format.letterhead ? (
                                      <div className="h-full">
                                        <div className="text-center leading-tight" style={{ fontSize: 6, fontWeight: 700, textTransform: "uppercase", color: tpl.format.accentColor }}>
                                          {senderName || "Nama"}
                                        </div>
                                        <div className="mx-auto my-0.5" style={{ height: 1.5, background: tpl.format.accentColor }} />
                                        <div className="mt-1" style={{ fontSize: 4.5, color: "#444", lineHeight: 1.4 }}>
                                          Perihal: Lorem ipsum dolor sit amet, consectetur...
                                        </div>
                                      </div>
                                    ) : tpl.format.headerStyle === "cover" ? (
                                      <div className="h-full">
                                        <div className="flex items-center justify-between mb-1" style={{ borderBottom: `1.5px solid ${tpl.format.accentColor}`, paddingBottom: 1 }}>
                                          <span style={{ fontSize: 5.5, fontWeight: 700, color: tpl.format.accentColor }}>
                                            {senderName || "Nama"}
                                          </span>
                                          <span className="rounded-full" style={{ width: 3.5, height: 3.5, background: `${tpl.format.accentColor}22`, border: `1px solid ${tpl.format.accentColor}` }} />
                                        </div>
                                        <div style={{ fontSize: 4.5, color: "#444", lineHeight: 1.4 }}>
                                          Re: Application for ... consectetur adipiscing elit...
                                        </div>
                                      </div>
                                    ) : tpl.format.headerStyle === "classic" ? (
                                      <div className="h-full">
                                        <div
                                          className="pb-0.5 mb-1"
                                          style={{ fontSize: 5.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: tpl.format.accentColor, borderBottom: `1px solid #111`, width: "100%" }}
                                        >
                                          Perihal
                                        </div>
                                        <div style={{ fontSize: 4.5, color: "#444", lineHeight: 1.4 }}>
                                          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...
                                        </div>
                                      </div>
                                    ) : tpl.format.headerStyle === "modern" ? (
                                      <div className="h-full">
                                        <div
                                          className="inline-block px-1 py-0.5 mb-1"
                                          style={{ background: `${tpl.format.accentColor}14`, borderLeft: `2px solid ${tpl.format.accentColor}`, fontSize: 5, fontWeight: 700, textTransform: "uppercase", color: tpl.format.accentColor }}
                                        >
                                          Perihal
                                        </div>
                                        <div style={{ fontSize: 4.5, color: "#444", lineHeight: 1.4 }}>
                                          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="h-full">
                                        <div className="flex gap-1 mb-1">
                                          <span className="rounded-sm" style={{ width: 1.5, height: 8, background: tpl.format.accentColor }} />
                                          <span className="mb-1" style={{ fontSize: 5.5, fontWeight: 700, color: tpl.format.accentColor, lineHeight: 1.2 }}>
                                            {letterTemplateText(tpl, lang).label.split(" ")[0]}
                                          </span>
                                        </div>
                                        <div style={{ fontSize: 4.5, color: "#444", lineHeight: 1.4 }}>
                                          Lorem ipsum dolor sit amet, consectetur adipiscing elit...
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-sm font-bold ${active ? "text-primary" : "text-on-surface"}`}>
                                        {letterTemplateText(tpl, lang).label}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-surface-container-high text-on-surface-variant">
                                        {letterTemplateText(tpl, lang).badge}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">{letterTemplateText(tpl, lang).desc}</p>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] text-outline">
                                      <span className="material-symbols-outlined text-[12px]">translate</span>
                                      {tpl.defaultLang === "id" ? t("cl.lang-id") : "English"}
                                      <span className="material-symbols-outlined text-[12px] ml-1">format_size</span>
                                      {tpl.format.fontFamily.includes("Times") ? "Serif" : "Sans"}
                                    </div>
                                  </div>

                                  <span
                                    className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                      active ? "border-primary bg-primary" : "border-outline-variant"
                                    }`}
                                  >
                                    {active && <span className="material-symbols-outlined text-[12px] text-white">check</span>}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          <MagneticButton className="w-full">
                            <button
                              onClick={() => setActiveStep(1)}
                              className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-premium-md"
                            >
                              {t("cl.next-data")}
                              <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </button>
                          </MagneticButton>
                        </div>
                      )}

                      {/* ── STEP 2: DATA & CONFIG ── */}
                      {activeStep === 1 && (
                        <div className="space-y-5">
                          {/* Pemilih sumber data, tampil selalu saat buat dari nol.
                           * (Tanpa !activeLetter: surat manual lama tidak boleh
                           * menyembunyikan form, supaya Generate ulang tetap bisa.) */}
                          {!cvId && (
                            <motion.section className="bg-surface-container-lowest rounded-2xl p-6 shadow-premium-md border border-outline-variant/50">
                              <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>travel_explore</span>
                                </div>
                                <div>
                                  <h2 className="font-label-bold text-on-surface">{t("cl.source-title")}</h2>
                                  <p className="text-xs text-on-surface-variant">{t("cl.source-desc")}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (cvOptions.length === 0 && !cvOptionsLoading) {
                                      // Tidak ada CV untuk dipilih, jangan kunci form manual
                                      setSourceMode("manual");
                                      addToast({ type: "warning", message: t("cl.no-cv") });
                                      return;
                                    }
                                    setSourceMode("cv");
                                  }}
                                  aria-pressed={sourceMode === "cv"}
                                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                                    sourceMode === "cv" ? "border-primary bg-primary/5" : "border-outline-variant/50 hover:border-primary/40"
                                  }`}
                                >
                                  <span className={`material-symbols-outlined text-xl mt-0.5 ${sourceMode === "cv" ? "text-primary" : "text-on-surface-variant"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                    description
                                  </span>
                                  <span>
                                    <span className={`block text-sm font-bold ${sourceMode === "cv" ? "text-primary" : "text-on-surface"}`}>{t("cl.from-cv")}</span>
                                    <span className="block text-[11px] text-on-surface-variant mt-0.5">{t("cl.from-cv-desc")}</span>
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSourceMode("manual")}
                                  aria-pressed={sourceMode === "manual"}
                                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                                    sourceMode === "manual" ? "border-primary bg-primary/5" : "border-outline-variant/50 hover:border-primary/40"
                                  }`}
                                >
                                  <span className={`material-symbols-outlined text-xl mt-0.5 ${sourceMode === "manual" ? "text-primary" : "text-on-surface-variant"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                    edit_note
                                  </span>
                                  <span>
                                    <span className={`block text-sm font-bold ${sourceMode === "manual" ? "text-primary" : "text-on-surface"}`}>{t("cl.manual")}</span>
                                    <span className="block text-[11px] text-on-surface-variant mt-0.5">{t("cl.manual-desc")}</span>
                                  </span>
                                </button>
                              </div>

                              {/* Daftar CV */}
                              {sourceMode === "cv" && (
                                <div className="mt-4 pt-4 border-t border-outline-variant/50">
                                  <p className="text-xs font-semibold text-on-surface-variant mb-2">
                                    {t("cl.pick-cv")}
                                  </p>
                                  {cvOptionsLoading ? (
                                    <div className="space-y-2">
                                      {[1, 2].map((i) => (
                                        <div key={i} className="h-12 bg-surface-container-high rounded-xl animate-pulse" />
                                      ))}
                                    </div>
                                  ) : cvOptions.length > 0 ? (
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                      {cvOptions.map((cv) => (
                                        <button
                                          key={cv.id}
                                          type="button"
                                          onClick={() => router.push(`/surat-lamaran/${cv.id}?style=${style}`)}
                                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-outline-variant/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                                        >
                                          <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                                          </span>
                                          <span className="flex-1 min-w-0">
                                            <span className="block text-xs font-bold text-on-surface truncate">{cv.jobTitle || t("cl.cv-untitled")}</span>
                                            <span className="block text-[10px] text-on-surface-variant">
                                              {t("cl.updated")} {new Date(cv.updatedAt).toLocaleDateString(localeFor(lang))}
                                            </span>
                                          </span>
                                          <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary">chevron_right</span>
                                        </button>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="rounded-xl border border-dashed border-outline-variant p-4 text-center">
                                      <p className="text-xs text-on-surface-variant mb-2">
                                        {t("cl.no-cv-yet")}
                                      </p>
                                      <Link
                                        href="/builder/new"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                                      >
                                        <span className="material-symbols-outlined text-sm">add</span>
                                        {t("cl.new-cv")}
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              )}
                            </motion.section>
                          )}

                          {/* Form data manual, tampil saat mode manual (atau surat
                           * manual lama dibuka: tetap bisa isi ulang data) */}
                          {!cvId && sourceMode === "manual" && (
                            <motion.section className="bg-surface-container-lowest rounded-2xl p-6 shadow-premium-md border border-outline-variant/50 space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                                </div>
                                <div>
                                  <h2 className="font-label-bold text-on-surface">{t("cl.personal")}</h2>
                                  <p className="text-xs text-on-surface-variant">{t("cl.personal-desc")}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.full-name")}</label>
                                  <input
                                    type="text"
                                    value={manual.fullName}
                                    onChange={(e) => setManual((m) => ({ ...m, fullName: e.target.value }))}
                                    placeholder="Andi Pratama"
                                    className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.position")}</label>
                                  <input
                                    type="text"
                                    value={manual.position}
                                    onChange={(e) => setManual((m) => ({ ...m, position: e.target.value }))}
                                    placeholder="Software Engineer"
                                    className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-semibold text-on-surface-variant block mb-1">Email</label>
                                  <input
                                    type="email"
                                    value={manual.email}
                                    onChange={(e) => setManual((m) => ({ ...m, email: e.target.value }))}
                                    placeholder="andi@email.com"
                                    className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.phone")}</label>
                                  <input
                                    type="tel"
                                    value={manual.phone}
                                    onChange={(e) => setManual((m) => ({ ...m, phone: e.target.value }))}
                                    placeholder="0812-3456-7890"
                                    className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.address")}</label>
                                  <input
                                    type="text"
                                    value={manual.address}
                                    onChange={(e) => setManual((m) => ({ ...m, address: e.target.value }))}
                                    placeholder={t("cl.address-ph")}
                                    className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.summary")}</label>
                                  <input
                                    type="text"
                                    value={manual.summary}
                                    onChange={(e) => setManual((m) => ({ ...m, summary: e.target.value }))}
                                    placeholder={t("cl.summary-ph")}
                                    className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                  />
                                </div>
                              </div>

                              {/* ── Deskripsi Lowongan ── */}
                              <div>
                                <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.jd")}</label>
                                <textarea
                                  value={manual.jobDescription}
                                  onChange={(e) => setManual((m) => ({ ...m, jobDescription: e.target.value }))}
                                  rows={3}
                                  placeholder={t("cl.jd-ph")}
                                  className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm leading-relaxed focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y"
                                />
                              </div>

                              {/* ── Skills ── */}
                              <div>
                                <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.skills")}</label>
                                <input
                                  type="text"
                                  value={manual.skills}
                                  onChange={(e) => setManual((m) => ({ ...m, skills: e.target.value }))}
                                  placeholder="React, TypeScript, UI/UX, Agile"
                                  className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                />
                                <p className="text-[11px] text-on-surface-variant mt-1">{t("cl.skills-hint")}</p>
                              </div>

                              {/* ── Pengalaman Kerja ── */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-semibold text-on-surface-variant">{t("cl.work")}</label>
                                  <button
                                    type="button"
                                    onClick={() => addManualEntry("workHistory")}
                                    disabled={manual.workHistory.length >= MAX_WORK}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    {t("cl.add-work")}
                                  </button>
                                </div>
                                {manual.workHistory.map((w, i) => (
                                  <div key={i} className="rounded-xl border border-outline-variant/50 p-3 space-y-2 bg-surface-container-low/40">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        value={w.position}
                                        onChange={(e) => updateManualEntry("workHistory", i, "position", e.target.value)}
                                        placeholder={t("cl.work-position-ph")}
                                        className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={w.company}
                                        onChange={(e) => updateManualEntry("workHistory", i, "company", e.target.value)}
                                        placeholder={t("cl.company-ph")}
                                        className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        value={w.startDate}
                                        onChange={(e) => updateManualEntry("workHistory", i, "startDate", e.target.value)}
                                        placeholder={t("cl.start-ph")}
                                        className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={w.endDate}
                                        onChange={(e) => updateManualEntry("workHistory", i, "endDate", e.target.value)}
                                        placeholder={t("cl.end-ph")}
                                        className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                      />
                                    </div>
                                    <textarea
                                      value={w.description}
                                      onChange={(e) => updateManualEntry("workHistory", i, "description", e.target.value)}
                                      rows={2}
                                      placeholder={t("cl.work-desc-ph")}
                                      className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm leading-relaxed focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y"
                                    />
                                    {manual.workHistory.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeManualEntry("workHistory", i)}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-error hover:bg-error-container/30 px-2 py-1 rounded-lg transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                        {t("common.delete")}
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* ── Pendidikan ── */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-semibold text-on-surface-variant">{t("cl.education")}</label>
                                  <button
                                    type="button"
                                    onClick={() => addManualEntry("education")}
                                    disabled={manual.education.length >= MAX_EDU}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    {t("cl.add-edu")}
                                  </button>
                                </div>
                                {manual.education.map((e, i) => (
                                  <div key={i} className="rounded-xl border border-outline-variant/50 p-3 space-y-2 bg-surface-container-low/40">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <input
                                        type="text"
                                        value={e.degree}
                                        onChange={(ev) => updateManualEntry("education", i, "degree", ev.target.value)}
                                        placeholder={t("cl.degree-ph")}
                                        className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={e.field}
                                        onChange={(ev) => updateManualEntry("education", i, "field", ev.target.value)}
                                        placeholder={t("cl.major-ph")}
                                        className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={e.institution}
                                        onChange={(ev) => updateManualEntry("education", i, "institution", ev.target.value)}
                                        placeholder={t("cl.institution-ph")}
                                        className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                      />
                                    </div>
                                    {manual.education.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeManualEntry("education", i)}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-error hover:bg-error-container/30 px-2 py-1 rounded-lg transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                        {t("common.delete")}
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </motion.section>
                          )}

                          {/* Konfigurasi surat */}
                          <motion.section className="bg-surface-container-lowest rounded-2xl p-6 shadow-premium-md border border-outline-variant/50 space-y-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
                              </div>
                              <div>
                                <h2 className="font-label-bold text-on-surface">{t("cl.config")}</h2>
                                <p className="text-xs text-on-surface-variant">
                                  {cvId
                                    ? t("cl.config-cv")
                                    : sourceMode === "manual"
                                      ? t("cl.config-manual")
                                      : t("cl.config-default")}
                                </p>
                              </div>
                            </div>

                            {/* Bahasa */}
                            <div>
                              <label className="text-sm font-semibold text-on-surface-variant block mb-2">{t("cl.letter-lang")}</label>
                              <div className="grid grid-cols-2 gap-2">
                                {([
                                  { value: "id" as const, label: t("cl.lang-id"), icon: "translate" },
                                  { value: "en" as const, label: "English", icon: "language" },
                                ]).map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setLanguage(opt.value)}
                                    disabled={style === "formal_lengkap" && opt.value === "en"}
                                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                      language === opt.value
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-outline-variant/50 text-on-surface-variant hover:border-primary/40"
                                    } ${style === "formal_lengkap" && opt.value === "en" ? "opacity-40 pointer-events-none" : ""}`}
                                  >
                                    <span className="material-symbols-outlined text-base">{opt.icon}</span>
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Detail tambahan */}
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.company")}</label>
                                <input
                                  type="text"
                                  value={companyName}
                                  onChange={(e) => setCompanyName(e.target.value)}
                                  placeholder="PT Maju Bersama"
                                  className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.recipient")}</label>
                                <input
                                  type="text"
                                  value={recipientName}
                                  onChange={(e) => setRecipientName(e.target.value)}
                                  placeholder={t("cl.recipient-ph")}
                                  className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                />
                              </div>

                              {/* Field spesifik jenis surat, biar AI punya data & hasilnya bukan generik */}
                              {style === "motivation" ? (
                                <>
                                  <div>
                                    <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.motivation-reason")}</label>
                                    <textarea
                                      value={motivationReason}
                                      onChange={(e) => setMotivationReason(e.target.value)}
                                      rows={2}
                                      placeholder={t("cl.motivation-reason-ph")}
                                      className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm leading-relaxed focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.future")}</label>
                                    <textarea
                                      value={futurePlan}
                                      onChange={(e) => setFuturePlan(e.target.value)}
                                      rows={2}
                                      placeholder={t("cl.future-ph")}
                                      className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm leading-relaxed focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y"
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div>
                                    <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.job-source")}</label>
                                    <input
                                      type="text"
                                      value={jobSource}
                                      onChange={(e) => setJobSource(e.target.value)}
                                      placeholder={t("cl.job-source-ph")}
                                      className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                    />
                                    <p className="text-[11px] text-on-surface-variant mt-1">{t("cl.job-source-hint")}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.company-address")}</label>
                                    <input
                                      type="text"
                                      value={companyAddress}
                                      onChange={(e) => setCompanyAddress(e.target.value)}
                                      placeholder={t("cl.company-address-ph")}
                                      className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                    />
                                  </div>
                                </>
                              )}

                              {(style === "formal_lengkap" || template.format.letterhead) && (
                                <>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.letter-number")}</label>
                                      <input
                                        type="text"
                                        value={letterNumber}
                                        onChange={(e) => setLetterNumber(e.target.value)}
                                        placeholder={t("cl.letter-number-ph")}
                                        className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.attachment")}</label>
                                      <input
                                        type="text"
                                        value={attachment}
                                        onChange={(e) => setAttachment(e.target.value)}
                                        placeholder={t("cl.attachment-ph")}
                                        className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                      />
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            <MagneticButton className="w-full">
                              <button
                                onClick={handleGenerate}
                                disabled={generating || generateDisabled}
                                className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-premium-md"
                              >
                                {generating ? (
                                  <>
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    {t("cl.writing")}
                                  </>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                    {generateDisabled
                                      ? (cvOptions.length === 0 ? t("cl.need-manual") : t("cl.need-cv"))
                                      : t("cl.generate")}
                                  </>
                                )}
                              </button>
                            </MagneticButton>
                            <p className="text-[11px] text-center text-on-surface-variant">
                              {quota && !quota.isUnlimited
                                ? fill(t("cl.quota-month"), { n: String(quota.remaining), max: String(quota.limit) })
                                : quota && quota.isUnlimited
                                  ? t("cl.quota-unlimited")
                                  : t("cl.quota-free")}
                            </p>
                          </motion.section>
                        </div>
                      )}

                      {/* ── STEP 3: HASIL & EDIT ── */}
                      {activeStep === 2 && (
                        <div className="space-y-5">
                          {!activeLetter && !content ? (
                            <div className="bg-surface-container-lowest rounded-2xl p-10 shadow-premium-md border border-outline-variant/50 text-center">
                              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-primary text-[28px]">auto_awesome</span>
                              </div>
                              <h3 className="font-label-bold text-on-surface mb-1">{t("cl.empty")}</h3>
                              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mb-5">
                                {t("cl.empty-desc")}
                              </p>
                              <MagneticButton>
                                <button
                                  onClick={() => setActiveStep(1)}
                                  className="bg-primary text-on-primary font-bold px-6 py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                                  {t("cl.to-data")}
                                </button>
                              </MagneticButton>
                            </div>
                          ) : (
                            <motion.section className="bg-surface-container-lowest rounded-2xl p-6 shadow-premium-md border border-outline-variant/50 space-y-4">
                              <div className="flex items-center justify-between">
                                <h2 className="font-label-bold text-on-surface">{t("cl.edit")}</h2>
                                <div className="flex items-center gap-2">
                                  {dirty && (
                                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{t("cl.unsaved")}</span>
                                  )}
                                  <span className="text-[10px] text-on-surface-variant">
                                    {styleLabel(activeLetter?.style || style, lang)} ·{" "}
                                    {(activeLetter?.language || language) === "id" ? t("cl.lang-id-short") : "English"}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.subject")}</label>
                                <input
                                  type="text"
                                  value={subject}
                                  onChange={(e) => { setSubject(e.target.value); setDirty(true); }}
                                  className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                />
                              </div>
                              {(activeLetter?.style === "formal_lengkap" || template.format.letterhead) && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.letter-number")}</label>
                                    <input
                                      type="text"
                                      value={letterNumber}
                                      onChange={(e) => { setLetterNumber(e.target.value); setDirty(true); }}
                                      placeholder="001/CL/08/2026"
                                      className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold text-on-surface-variant block mb-1">{t("cl.attachment")}</label>
                                    <input
                                      type="text"
                                      value={attachment}
                                      onChange={(e) => { setAttachment(e.target.value); setDirty(true); }}
                                      placeholder={t("cl.attachment-ph")}
                                      className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                    />
                                  </div>
                                </div>
                              )}
                              {/* Isi surat, editor blok paragraf (ergonomi ala builder CV) */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-sm font-semibold text-on-surface-variant">{t("cl.body")}</label>
                                  <button
                                    type="button"
                                    onClick={addBlock}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    {t("cl.add-para")}
                                  </button>
                                </div>
                                {paraBlocks.length === 0 ? (
                                  <div className="rounded-xl border border-dashed border-outline-variant p-4 text-center text-xs text-on-surface-variant">
                                    {t("cl.no-body")}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {paraBlocks.map((block, i) => (
                                      <div key={i} className="rounded-xl border border-outline-variant/50 p-3 space-y-2 bg-surface-container-low/40">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-bold uppercase tracking-wide text-outline">
                                            {t("bullet.mode-paragraph")} {i + 1}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => moveBlock(i, -1)}
                                              disabled={i === 0}
                                              title={t("entry.move-up")}
                                              className="w-6 h-6 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                              <span className="material-symbols-outlined text-sm">arrow_upward</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => moveBlock(i, 1)}
                                              disabled={i === paraBlocks.length - 1}
                                              title={t("entry.move-down")}
                                              className="w-6 h-6 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                              <span className="material-symbols-outlined text-sm">arrow_downward</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => removeBlock(i)}
                                              disabled={paraBlocks.length === 1}
                                              title={t("cl.del-para")}
                                              className="w-6 h-6 flex items-center justify-center rounded-lg text-error hover:bg-error-container/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                              <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                          </div>
                                        </div>
                                        <textarea
                                          value={block}
                                          onChange={(e) => updateBlock(i, e.target.value)}
                                          rows={Math.max(3, Math.min(10, block.split("\n").length + 1))}
                                          placeholder={t("cl.para-ph")}
                                          className="w-full rounded-lg border border-outline bg-background p-3 text-sm leading-relaxed focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={handleSave}
                                  disabled={saving || !dirty}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 disabled:opacity-50 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">save</span>
                                  {saving ? t("cl.saving") : t("cl.save")}
                                </button>
                                <button
                                  onClick={handleCopy}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary/10 text-green-deep text-sm font-semibold hover:bg-secondary/20 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">content_copy</span>
                                  {t("cl.copy")}
                                </button>
                                <button
                                  onClick={handleExportPdf}
                                  disabled={exporting}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container text-on-surface text-sm font-semibold hover:bg-surface-container-high disabled:opacity-50 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                                  {exporting ? t("cl.pdf-preparing") : t("cl.pdf")}
                                </button>
                                {activeLetter && (
                                  <button
                                    onClick={() => handleDelete(activeLetter.id)}
                                    disabled={deleting}
                                    className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-error hover:bg-error-container/30 disabled:opacity-50 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-base">delete</span>
                                  </button>
                                )}
                              </div>
                            </motion.section>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* ════ RIGHT: PREVIEW A4 + RIWAYAT ════ */}
                <div className="space-y-5 lg:sticky lg:top-24">
                  {/* Riwayat */}
                  {letters.length > 0 && (
                    <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-premium-sm border border-outline-variant/50">
                      <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-primary">history</span>
                        {fill(t("cl.history"), { n: letters.length })}
                      </h3>
                      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        {letters.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => setActiveLetter(l)}
                            className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                              activeLetter?.id === l.id
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-outline-variant/50 text-on-surface-variant hover:border-primary/40"
                            }`}
                          >
                            {styleLabel(l.style, lang)} ·{" "}
                            {new Date(l.createdAt).toLocaleDateString(localeFor(lang))}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Preview A4, mirip preview builder CV: kertas mengambang di atas
                   * permukaan dim (bukan di dalam kartu berbingkai tebal), dengan
                   * header ramping ala FormatToolbar di builder. */}
                  <div className="rounded-2xl overflow-hidden bg-surface-dim/20 border border-outline-variant/50">
                    <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-surface-container-lowest/80 backdrop-blur-sm border-b border-outline-variant/40">
                      <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
                        {t("cl.preview")} · {letterTemplateText(template, lang).label}
                      </span>
                      {activeLetter && (
                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
                          {activeLetter.language === "id" ? t("cl.lang-id-short") : "English"} · {styleLabel(activeLetter.style, lang)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-center p-3 md:p-5">
                      <LetterPreview
                        ref={previewRef}
                        letter={{
                          subject,
                          content,
                          language: activeLetter?.language || language,
                          style: activeLetter?.style || style,
                          letterNumber,
                          attachment,
                          sender: {
                            fullName: senderName,
                            address: senderAddress,
                            phone: senderPhone,
                            email: senderEmail,
                          },
                        }}
                        format={template.format}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <AppFooter bordered />
      </div>
    </AuthGuard>
  );
}
