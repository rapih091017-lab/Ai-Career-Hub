"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import AppHeader from "@/components/AppHeader";
import AuthGuard from "@/components/AuthGuard";
import { AtsBaseRenderer, TEMPLATE_STYLES, type CvData } from "@/components/cv-templates";
import { CvPagedPreview, measurePageCount, untabSecondaryPages } from "@/components/cv-templates/print";
import { LINE_HEIGHT, cvPrintFormatFromData, cvRenderProps } from "@/lib/cv-print-format";
import { cvFontValue, resolveCvFont } from "@/lib/cv-fonts";
import { useInlineEditable } from "@/hooks/useInlineEditable";
import { EditableText, scheduleCaretCheck } from "@/components/cv-templates/EditableText";
import { focusableIn, formTargetFor, getCvPath, setCvPath, stepForPath } from "@/lib/cv-edit-path";
import type { CvEditBindings } from "@/components/cv-templates";
import type { BlockStyleControls } from "@/components/builder/FormatToolbar";
import { aiSkillNames } from "@/lib/cv-normalize";
import dynamic from "next/dynamic";
const AIProposalModal = dynamic(() => import("@/components/AIProposalModal"), { ssr: false });
import { useToast } from "@/components/ui/toast";
import { Field } from "@/components/builder/Field";
import { StepperSteps, BottomNav } from "@/components/builder/StepperNav";
import { SummarySection } from "@/components/builder/SummarySection";
import { TargetPekerjaanSection } from "@/components/builder/TargetPekerjaanSection";
import { SkillSection } from "@/components/builder/SkillSection";
import { WorkCard } from "@/components/builder/WorkCard";
import { EducationCard } from "@/components/builder/EducationCard";
import { OrgCard } from "@/components/builder/OrgCard";
import { FormatToolbar } from "@/components/builder/FormatToolbar";
import { FitA4 } from "@/components/builder/FitA4";
import { DisplaySettingsModal } from "@/components/builder/DisplaySettingsModal";
import { ReviewStep } from "@/components/builder/ReviewStep";
import { SectionOrderModal } from "@/components/builder/SectionOrderModal";
import { SortableList } from "@/components/builder/SortableList";
import { PanelSplitter, usePanelSplit } from "@/components/builder/PanelSplitter";
import { AddSectionPanel } from "@/components/builder/AddSectionPanel";
import { CustomSectionCard, RemoveSectionButton, UnusedSectionCard } from "@/components/builder/SectionControls";
import { HiddenSectionNotice } from "@/components/builder/SkillSection";
import { ConfirmModal, type ConfirmAction } from "@/components/ui/confirm-modal";
import { arrayMove } from "@dnd-kit/sortable";
import {
  LAINNYA_ID,
  addCustomSection,
  isRemovableSection,
  purgeSectionContent,
  removeSection,
  restoreSection,
  sectionHasSavedContent,
  sectionLabel,
  unusedBuiltinSections,
  updateCustomSection,
} from "@/lib/section-manager";
import { AtsScoreInsight } from "@/components/builder/AtsScoreInsight";
import { BuilderLoadingSkeleton, BuilderErrorState } from "@/components/builder/BuilderSkeleton";
import { useTranslation } from "@/lib/i18n";
import { useBuilderHelpers } from "@/hooks/useBuilderHelpers";
import { useBuilderAI } from "@/hooks/useBuilderAI";
import { useBuilderFormat } from "@/hooks/useBuilderFormat";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useFetchCvData } from "@/hooks/useFetchCvData";


const STEP_KEYS = [
  "builder.step-personal",
  "builder.step-target",
  "builder.step-experience",
  "builder.step-education",
  "builder.step-org",
  "builder.step-skills",
  "builder.step-review",
];

/* ───────── component ───────── */

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const cvId = params.id as string;

  const [activeStep, setActiveStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();
  const steps = STEP_KEYS.map((k) => t(k));
  const [collapsedWorkIds, setCollapsedWorkIds] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  // templateId baru ikut autosave setelah user benar-benar memilih template.
  const [templateTouched, setTemplateTouched] = useState(false);
  const [leftPct, setLeftPct] = usePanelSplit();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  /* ── Data Fetch ── */
  const { cvData, isLoading, fetchError, selectedTemplateId, loadedUpdatedAt, setCvData, setSelectedTemplateId } = useFetchCvData(cvId);

  /* ── Auto-Save ── */
  const { saveStatus, lastSaved, flush: flushAutoSave, getUpdatedAt, errorMessage: saveErrorMessage, overwrite: overwriteServer } = useAutoSave(cvId, cvData, !isLoading && !fetchError, loadedUpdatedAt, templateTouched ? selectedTemplateId : undefined);

  /* ── Format Settings Hook ── */
  const format = useBuilderFormat({
    cvId,
    cvData,
    setCvData,
    ready: !isLoading && !fetchError,
    templateId: selectedTemplateId,
    flush: flushAutoSave,
  });

  /* ── Compute margin & page dimensions ── */
  const contentRef = useRef<HTMLDivElement>(null);
  const [allPageCount, setAllPageCount] = useState(1);

  // Jumlah halaman diukur dari kontainer multikolom halaman pertama
  // (lihat CvPagedPreview): sama dengan pemenggalan Chromium saat cetak.
  const contentMounted = !isLoading && !fetchError;
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const measure = () => {
      if (alive) setAllPageCount(measurePageCount(el));
    };
    // Debounce: saat mengetik, ukur ulang sekali setelah jeda, bukan tiap tombol.
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 150);
    };
    measure();
    // Font CV dimuat belakangan; ukur ulang setelah siap.
    void document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    const mo = new MutationObserver(update);
    mo.observe(el, { childList: true, subtree: true, characterData: true, attributes: true });
    return () => {
      alive = false;
      clearTimeout(timer);
      ro.disconnect();
      mo.disconnect();
    };
  }, [format.marginPadding, contentMounted]);

  // Halaman pratinjau yang memegang fokus: hanya halaman ini yang dibaca pembaca layar.
  const [focusPage, setFocusPage] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);
  const onPreviewFocus = useCallback((e: React.FocusEvent) => {
    const n = Number((e.target as HTMLElement).closest("[data-cv-page]")?.getAttribute("data-cv-page"));
    if (n > 0) setFocusPage(n);
  }, []);
  // Fokus pindah di dalam pratinjau: halaman aktif diatur oleh focusin berikutnya, bukan direset.
  const onPreviewBlur = useCallback((e: React.FocusEvent) => {
    const next = e.relatedTarget as Node | null;
    if (next && previewRef.current?.contains(next)) return;
    setFocusPage(1);
  }, []);

  /* ── AI & Scoring Hook ── */
  const ai = useBuilderAI({ cvData, setCvData, cvId, activeStep, setActiveStep, addToast });

  /* ── CRUD Helpers Hook ── */
  const helpers = useBuilderHelpers({ setCvData, setCustomSections: format.setCustomSections, setSectionOrder: format.setSectionOrder });

  const {
    updateField, addWork, updateWork, removeWork, moveWorkUp, moveWorkDown, toggleWorkVisible,
    updateWorkDescription, toggleWorkCollapse,
    addEducation, updateEducation, removeEducation, moveEduUp, moveEduDown, toggleEduVisible,
    addOrganization, updateOrganization, removeOrganization, moveOrgUp, moveOrgDown, toggleOrgVisible,
    setOrgPresent,
    addSkill, updateSkill, removeSkill,
    addCertification, updateCertification, removeCertification,
    updateLainnyaContent,
  } = helpers;

  const {
    fontFamily, setFontFamily, fontSize, setFontSize, textAlign, setTextAlign,
    showDividers, setShowDividers, customPrimaryColor, setCustomPrimaryColor,
    spacingMode, setSpacingMode, headerLayout, setHeaderLayout,
    marginMode, setMarginMode, sectionOrder, setSectionOrder,
    sectionVisibility, setSectionVisibility, customSections, setCustomSections,
    showDisplaySettings, setShowDisplaySettings, showSectionOrderModal, setShowSectionOrderModal,
    isPdfExporting, setIsPdfExporting, marginPadding,
    showSkillLevel, setShowSkillLevel,
    dividers, toggleDivider,
    sectionStyles, setSectionStyle, resetSectionStyle, applySectionStyleToAll,
  } = format;

  /* ── Gaya per bagian: bagian yang sedang diatur (null = global) ── */
  const [styleTarget, setStyleTarget] = useState<string | null>(null);
  const inlineEditable = useInlineEditable();
  // Layar < lg: pratinjau penuh (overlay) terbuka.
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  /* ── Section tersembunyi ── */
  // Section dianggap tersembunyi bila dimatikan di pengaturan tampilan atau
  // tidak ada di urutan section. Kartu form memberi tahu user + tombol Tampilkan.
  const isSectionHidden = (key: string) => sectionVisibility[key] === false || !sectionOrder.includes(key);
  const showSection = (key: string) => {
    setSectionVisibility((prev) => ({ ...prev, [key]: true }));
    setSectionOrder((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  // CV tanpa layout memakai nilai lama builder (Inter 11pt), jadi dianggap punya override.
  const hasStyleOverrides =
    !cvData.layout ||
    ["fontFamily", "fontSize", "textAlign", "primaryColor", "sectionStyles"].some((k) => cvData.layout?.[k as keyof typeof cvData.layout] !== undefined);

  /* ── Kelola section: hapus (dengan Urungkan), pakai lagi, tambah kustom ── */
  const unusedSections = unusedBuiltinSections(cvData);
  const isSectionUnused = (key: string) => unusedSections.includes(key);
  const labelOf = (key: string) => sectionLabel(cvData, key);
  const requestRemoveSection = (key: string) => {
    const label = labelOf(key);
    setConfirm({
      title: `Hapus bagian ${label} dari CV?`,
      message: "Bagian ini tidak tampil lagi di CV dan PDF. Isinya tetap tersimpan, jadi bisa dipakai lagi kapan saja lewat \"Pakai lagi\".",
      confirmLabel: "Hapus dari CV",
      cancelLabel: "Batal",
      onConfirm: () => {
        // Posisi dihitung dari state terbaru di dalam updater, bukan dari closure render.
        const pos = { index: -1 };
        setCvData((prev) => {
          const res = removeSection(prev, key);
          if (!res) return prev;
          pos.index = res.orderIndex;
          return res.cv;
        });
        addToast({
          type: "info",
          message: `Bagian ${label} dihapus dari CV. Isinya tetap tersimpan.`,
          duration: 8000,
          // Urungkan hanya mengembalikan urutan; isi tidak pernah dihapus, jadi editan baru aman.
          action: { label: "Urungkan", onClick: () => setCvData((prev) => restoreSection(prev, key, pos.index)) },
        });
      },
    });
  };
  const requestPurgeSection = (key: string) => {
    const label = labelOf(key);
    setConfirm({
      title: `Hapus permanen isi ${label}?`,
      message: "Semua isi bagian ini dihapus dan tidak bisa dikembalikan.",
      confirmLabel: "Hapus permanen",
      cancelLabel: "Batal",
      variant: "danger",
      onConfirm: () => setCvData((prev) => purgeSectionContent(prev, key)),
    });
  };
  const restoreUnused = (key: string) => setCvData((prev) => restoreSection(prev, key));
  const addCustom = (title: string) => setCvData((prev) => addCustomSection(prev, title)?.cv ?? prev);
  const customOnly = customSections.filter((c) => c.id !== LAINNYA_ID);
  const unusedForPanel = unusedSections.map((key) => ({ key, label: labelOf(key), hasContent: sectionHasSavedContent(cvData, key) }));
  const moveSection = (from: number, to: number) =>
    setSectionOrder((prev) => (to < 0 || to >= prev.length ? prev : arrayMove(prev, from, to)));
  // "Semua garis" aktif bila setiap section (selain yang pertama) bergaris.
  const hasDivider = (key: string) => dividers[key] ?? showDividers;
  const allDividers = sectionOrder.length > 1 && sectionOrder.slice(1).every(hasDivider);
  const moveEntry = (list: "workHistory" | "education" | "organisations") => (from: number, to: number) =>
    setCvData((prev) => ({ ...prev, [list]: arrayMove(prev[list] as unknown[], from, to) }));

  const {
    aiJdKeywords, setAiJdKeywords, reducedMotion, computeAtsScore,
    sectionCompletion, cvCompleteness, aiModal, setAiModal,
  } = ai;



  /* ── PDF Export ── */

  // Format tampilan dari cvData.layout; server PDF membentuknya dengan fungsi yang sama dari DB.
  const printFormat = useMemo(() => cvPrintFormatFromData(cvData, selectedTemplateId), [cvData, selectedTemplateId]);

  const inlineEditableRef = useRef(inlineEditable);
  inlineEditableRef.current = inlineEditable;
  // Klik section di pratinjau → pilih bagian untuk diatur gayanya (layar lebar) dan lompat ke langkah form terkait.
  const handlePreviewSectionClick = useCallback((sectionKey: string) => {
    if (inlineEditableRef.current) setStyleTarget(sectionKey);
    // Layar kecil: tap di pratinjau = kembali ke form di langkah yang sesuai.
    else if (!window.matchMedia("(min-width: 1024px)").matches) setMobilePreviewOpen(false);
    const sectionStepMap: Record<string, number> = {
      header: 0,
      summary: 0,
      experience: 2,
      education: 3,
      skills: 5,
      certifications: 5,
      selfEvaluation: 5,
      lainnya: 5,
      organizations: 4,
    };
    // Section kustom diisi di langkah Keahlian & Lainnya.
    const step = sectionStepMap[sectionKey] ?? 5;
    if (step !== undefined) setActiveStep(step);
  }, []);

  // Elemen pratinjau di-memo: render ulang hanya saat data/format CV berubah,
  // bukan saat status autosave, modal, dsb. berubah.
  const renderProps = useMemo(() => {
    const { marginMm: _marginMm, ...rest } = cvRenderProps(cvData, printFormat, selectedTemplateId);
    return rest;
  }, [cvData, printFormat, selectedTemplateId]);
  /* ── Edit langsung di pratinjau ── */
  // Riwayat perubahan dari pratinjau (per sesi edit), untuk Ctrl+Z / Ctrl+Shift+Z di luar field.
  const editHistory = useRef<{ undo: PreviewEdit[]; redo: PreviewEdit[] }>({ undo: [], redo: [] });
  const cvDataRef = useRef(cvData);
  cvDataRef.current = cvData;
  // Riwayat dibuang saat konflik antartab (409), dan per path saat field itu diubah di luar pratinjau.
  useEffect(() => {
    if (saveStatus === "conflict") editHistory.current = { undo: [], redo: [] };
  }, [saveStatus]);
  useEffect(() => {
    const h = editHistory.current;
    const stale = new Set<string>();
    const latest = (list: PreviewEdit[], path: string) => list.findLast((x) => x.path === path);
    // Field yang sedang diedit di pratinjau berubah karena ketikan sendiri; entrinya menyusul saat blur.
    const editing = (document.activeElement as HTMLElement | null)?.getAttribute("data-cv-edit") !== null
      ? document.activeElement?.getAttribute("data-cv-path")
      : null;
    for (const path of new Set([...h.undo, ...h.redo].map((x) => x.path))) {
      if (path === editing) continue;
      const cur = getCvPath(cvData, path);
      const u = latest(h.undo, path);
      const r = latest(h.redo, path);
      // Nilai sekarang harus sama dengan "sesudah" entri undo terakhir atau "sebelum" entri redo terakhir.
      if (!(u && cur === u.after) && !(r && cur === r.before)) stale.add(path);
    }
    if (stale.size) {
      h.undo = h.undo.filter((x) => !stale.has(x.path));
      h.redo = h.redo.filter((x) => !stale.has(x.path));
    }
  }, [cvData]);
  const onPreviewEdit = useCallback((path: string, value: string) => setCvData((prev) => setCvPath(prev, path, value)), [setCvData]);
  const onPreviewSession = useCallback((path: string, before: string, after: string) => {
    const h = editHistory.current;
    h.undo.push({ path, before, after });
    if (h.undo.length > EDIT_HISTORY_MAX) h.undo.shift();
    h.redo = [];
  }, []);
  const onPreviewConflict = useCallback(
    () => addToast({ type: "info", message: "Teks ini baru saja diubah di tempat lain. Isi terbaru yang dipakai; ketikan di pratinjau tidak disimpan." }),
    [addToast],
  );
  const editBindings = useMemo<CvEditBindings>(
    () => ({ Text: EditableText, editable: inlineEditable, onEdit: onPreviewEdit, onSession: onPreviewSession, onConflict: onPreviewConflict }),
    [inlineEditable, onPreviewEdit, onPreviewSession, onPreviewConflict],
  );

  const previewContent = useMemo(
    () => <AtsBaseRenderer {...renderProps} onSectionClick={handlePreviewSectionClick} onToggleDivider={toggleDivider} selectedSection={styleTarget} edit={editBindings} />,
    [renderProps, handlePreviewSectionClick, toggleDivider, styleTarget, editBindings],
  );

  // Jumlah halaman berubah saat mengetik: pastikan caret tetap di salinan yang terlihat.
  useEffect(() => {
    scheduleCaretCheck();
  }, [allPageCount]);

  /** Lompat ke langkah form untuk path, lalu scroll & fokus ke field/entrinya. */
  const jumpToField = useCallback((path: string) => {
    setMobilePreviewOpen(false);
    setActiveStep(stepForPath(path));
    const [head, id] = path.split(".");
    if (head === "workHistory" && id) setCollapsedWorkIds((prev) => (prev.has(id) ? new Set([...prev].filter((x) => x !== id)) : prev));
    // Langkah form beranimasi masuk; tunggu sampai field ada (maks ±2,5 dtk).
    const started = performance.now();
    const tick = () => {
      const target = formTargetFor(path);
      const exact = target?.matches("input, textarea, select") || !!target?.getAttribute("data-cv-field");
      if (target && (exact || performance.now() - started > 600)) {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
        focusableIn(target)?.focus({ preventScroll: true });
        return;
      }
      if (performance.now() - started < 2500) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  // Petunjuk sekali saja saat pertama kali hover pratinjau (hanya bila bisa edit langsung).
  const [editHint, setEditHint] = useState(false);
  const hintChecked = useRef(false);
  const onPreviewEnter = useCallback(() => {
    if (hintChecked.current || !inlineEditableRef.current) return;
    hintChecked.current = true;
    try {
      if (localStorage.getItem(EDIT_HINT_KEY)) return;
    } catch {
      /* storage tidak bisa diakses: petunjuk tetap tampil sekali di sesi ini */
    }
    setEditHint(true);
  }, []);
  const markHintSeen = useCallback(() => {
    try {
      localStorage.setItem(EDIT_HINT_KEY, "1");
    } catch {
      /* storage tidak bisa diakses */
    }
  }, []);
  const closeHint = useCallback(() => {
    markHintSeen();
    setEditHint(false);
  }, [markHintSeen]);
  // Dianggap sudah dilihat setelah tampil ≥ 2 detik (atau ditutup); hilang sendiri setelah 6 detik.
  useEffect(() => {
    if (!editHint) return;
    const seen = setTimeout(markHintSeen, 2000);
    const hide = setTimeout(() => setEditHint(false), 6000);
    return () => {
      clearTimeout(seen);
      clearTimeout(hide);
    };
  }, [editHint, markHintSeen]);

  // Klik teks non-edit di pratinjau (poin, tanggal, skill, …) → field form-nya.
  const onPreviewClick = useCallback(
    (e: React.MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("[data-cv-edit][contenteditable]")) return;
      const path = t.closest("[data-cv-path]")?.getAttribute("data-cv-path");
      if (path) jumpToField(path);
    },
    [jumpToField],
  );

  // Setelah tiap render pratinjau: tombol/teks di halaman 2+ keluar dari urutan Tab.
  useEffect(() => {
    if (previewRef.current) untabSecondaryPages(previewRef.current);
  }, [previewContent, allPageCount]);

  /* ── Toolbar: konteks global atau satu bagian ── */
  const styleTargets = useMemo(
    () => [{ key: "header", label: "Header & kontak" }, ...renderProps.sectionOrder.map((key) => ({ key, label: sectionLabel(cvData, key) }))],
    [renderProps.sectionOrder, cvData],
  );
  // Bagian yang sudah tidak tampil (dihapus/disembunyikan) tidak bisa tetap terpilih.
  const activeTarget = styleTarget && styleTargets.some((x) => x.key === styleTarget) ? styleTarget : null;
  const targetStyle = activeTarget ? sectionStyles[activeTarget] : undefined;
  const effFont = activeTarget ? targetStyle?.fontFamily ?? cvFontValue(resolveCvFont(fontFamily)) : fontFamily;
  const effSize = activeTarget ? targetStyle?.fontSize ?? fontSize : fontSize;
  const effAlign = activeTarget
    ? targetStyle?.textAlign ?? (activeTarget === "header" ? (headerLayout === "left" ? "left" : "center") : textAlign)
    : textAlign;
  const blockControls: BlockStyleControls = {
    targets: styleTargets,
    target: activeTarget,
    onTargetChange: setStyleTarget,
    hasStyle: !!targetStyle,
    lineHeight: targetStyle?.lineHeight ?? LINE_HEIGHT[spacingMode],
    titleColor: targetStyle?.titleColor ?? (activeTarget === "header" ? "#111111" : renderProps.style.sectionTitle),
    onLineHeightChange: (v) => activeTarget && setSectionStyle(activeTarget, { lineHeight: v }),
    onTitleColorChange: (v) => activeTarget && setSectionStyle(activeTarget, { titleColor: v }),
    onApplyAll: () => activeTarget && applySectionStyleToAll(activeTarget, styleTargets.map((x) => x.key)),
    onReset: () => activeTarget && resetSectionStyle(activeTarget),
  };

  const handleExportPdf = async () => {
    setIsPdfExporting(true);
    try {
      // PDF dibuat server dari data di DB, jadi perubahan terakhir harus tersimpan dulu.
      const saved = await flushAutoSave();
      if (!saved) {
        addToast({ type: "error", message: "Perubahan terakhir belum tersimpan. Periksa koneksi lalu coba unduh lagi." });
        return;
      }
      const res = await fetch(`/api/cv-documents/${cvId}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedUpdatedAt: getUpdatedAt() ?? undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const fallback =
          res.status === 409
            ? "CV berubah di tab lain. Muat ulang halaman ini lalu unduh lagi."
            : res.status === 429
            ? "Terlalu sering mengunduh PDF. Tunggu sebentar lalu coba lagi."
            : res.status === 401
              ? "Sesi login berakhir. Masuk lagi lalu unduh ulang."
              : "Gagal membuat PDF. Coba lagi sebentar lagi.";
        // 409: pesan klien yang dipakai, karena user perlu tahu harus memuat ulang.
        const serverMsg = res.status !== 409 && body && typeof body.message === "string" ? body.message : "";
        addToast({ type: "error", message: serverMsg || fallback });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileNameFromDisposition(res.headers.get("Content-Disposition")) ?? "CV.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      addToast({ type: "success", message: t("builder.pdf-export-success") });
    } catch (err) {
      console.error("PDF Export Error:", err);
      addToast({ type: "error", message: "Gagal mengunduh PDF. Periksa koneksi lalu coba lagi." });
    } finally {
      setIsPdfExporting(false);
    }
  };

  /* ── save ── */

  // Simpan manual lewat autosave (cek konflik, tanpa kirim ulang yang ditolak).
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const ok = await flushAutoSave();
      if (ok) addToast({ type: "success", message: t("builder.save-success") });
      else addToast({ type: "error", message: t("builder.save-failed") });
    } finally {
      setIsSaving(false);
    }
  }, [flushAutoSave, addToast, t]);

  /* ── section title helper ── */

  const sectionMeta = [
    { title: t("builder.step-personal"), desc: t("builder.desc-personal"), icon: "person" },
    { title: t("builder.step-target"), desc: t("builder.desc-target"), icon: "work_history" },
    { title: t("builder.step-experience"), desc: t("builder.desc-experience"), icon: "work" },
    { title: t("builder.step-education"), desc: t("builder.desc-education"), icon: "school" },
    { title: t("builder.step-org"), desc: t("builder.desc-org"), icon: "groups" },
    { title: t("builder.step-skills"), desc: t("builder.desc-skills"), icon: "star" },
    { title: t("builder.step-review"), desc: t("builder.desc-review"), icon: "visibility" },
  ];





  /* ── Keyboard Shortcuts ── */
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  const isSavingRef = useRef(isSaving);
  isSavingRef.current = isSaving;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Enter → Save (with guard against double-save)
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (!isSavingRef.current) {
          handleSaveRef.current();
        }
        return;
      }

      // Ctrl+ArrowLeft/Right pindah step, TAPI saat fokus di field isian
      // kombinasi ini milik navigasi teks (mis. lompat kata), jangan direbut.
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (typing) return;

      // Urungkan/ulangi edit dari pratinjau. Di dalam field, undo bawaan peramban yang dipakai.
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'y')) {
        const h = editHistory.current;
        const redo = e.key === 'y' || e.shiftKey;
        const item = redo ? h.redo.at(-1) : h.undo.at(-1);
        if (!item) return;
        // Hanya bila field masih berisi nilai hasil edit itu; kalau sudah diubah di tempat lain, riwayat basi.
        if (getCvPath(cvDataRef.current, item.path) !== (redo ? item.before : item.after)) {
          h.undo = [];
          h.redo = [];
          return;
        }
        e.preventDefault();
        (redo ? h.redo : h.undo).pop();
        (redo ? h.undo : h.redo).push(item);
        setCvData((prev) => setCvPath(prev, item.path, redo ? item.after : item.before));
        return;
      }

      // Ctrl+ArrowLeft → Previous step
      if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveStep((s) => Math.max(0, s - 1));
      }
      // Ctrl+ArrowRight → Next step
      if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveStep((s) => Math.min(6, s + 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCvData]);

  /* ── loading / error ── */

  if (isLoading) return <BuilderLoadingSkeleton />;
  if (fetchError) return <BuilderErrorState message={fetchError} />;

  /* ── main render ── */

  return (
    <AuthGuard>
      <div className="h-[100dvh] flex flex-col bg-background">
        <AppHeader />

        {/* ── STEPPER (connector lines style) ── */}
        <div className="w-full bg-surface-container-lowest border-b border-outline-variant/50 py-4 md:py-5 px-3 md:px-8 overflow-x-auto shrink-0">
          <StepperSteps steps={steps} activeStep={activeStep} setActiveStep={setActiveStep} sectionCompletion={sectionCompletion} sectionMeta={sectionMeta} />
        </div>

        {saveStatus === "conflict" && (
          <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shrink-0">
            <span className="flex-1 min-w-[16rem]">
              <strong>CV ini diubah di tab atau perangkat lain.</strong> Penyimpanan otomatis dihentikan agar tidak saling menimpa.
            </span>
            <button type="button" onClick={() => window.location.reload()} className="min-h-11 rounded-lg bg-amber-900 px-3 font-semibold text-white hover:bg-amber-950 sm:min-h-9">
              Muat versi terbaru
            </button>
            <button
              type="button"
              onClick={() =>
                setConfirm({
                  title: "Timpa dengan versi di sini?",
                  message: "Perubahan yang dibuat di tab atau perangkat lain akan hilang dan diganti isi CV di tab ini.",
                  confirmLabel: "Timpa",
                  cancelLabel: "Batal",
                  variant: "danger",
                  onConfirm: () => {
                    void overwriteServer().then((ok) =>
                      addToast(ok ? { type: "success", message: "Versi di tab ini sudah disimpan." } : { type: "error", message: "Gagal menyimpan. Coba lagi." }),
                    );
                  },
                })
              }
              className="min-h-11 rounded-lg border border-amber-900 px-3 font-semibold text-amber-950 hover:bg-amber-100 sm:min-h-9"
            >
              Timpa dengan versi di sini
            </button>
          </div>
        )}
        {saveStatus === "rejected" && saveErrorMessage && (
          <div role="alert" className="border-b border-error/30 bg-error-container px-4 py-2.5 text-sm text-on-error-container shrink-0">
            {saveErrorMessage}
          </div>
        )}

        {/* ── WORKSPACE LAYOUT ── */}
        <div
          ref={workspaceRef}
          className="flex-1 flex flex-col lg:flex-row overflow-hidden h-auto lg:h-[calc(100vh-64px-80px)]"
          style={{ "--left-w": `${leftPct}%` } as React.CSSProperties}
        >
          {/* ── LEFT PANEL ── (lebar diatur splitter di lg ke atas) */}
          <div className="w-full flex-1 min-h-0 lg:flex-none lg:w-[var(--left-w)] lg:shrink-0 bg-background border-b lg:border-b-0 border-outline-variant/50 overflow-y-auto custom-scrollbar">
            <div className="px-6 pt-8 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-green-deep text-xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">{sectionMeta[activeStep].icon}</span>
              </div>
              <div>
                <h2 className="font-headline-md text-on-surface">
                  {sectionMeta[activeStep].title}
                </h2>
                <p className="text-body-md text-on-surface-variant mt-0.5">
                  {sectionMeta[activeStep].desc}
                </p>
              </div>
            </div>
            {/* ── AI Keyword Suggestions Banner ── */}
            {aiJdKeywords && aiJdKeywords.length > 0 && activeStep !== 1 && activeStep !== 6 && (
              <div className="flex flex-wrap items-center gap-2 px-1 py-2 mb-2 bg-primary/5 border border-primary/10 rounded-xl">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-green-deep shrink-0">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">travel_explore</span>
                  <span>{t("builder.keywords-label")}</span>
                </div>
                {aiJdKeywords.slice(0, 10).map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 bg-surface-container-lowest rounded-full text-[10px] font-medium text-green-deep border border-green-deep/20 cursor-default hover:bg-lime/25 transition-colors">
                    {kw}
                  </span>
                ))}
                {aiJdKeywords.length > 10 && (
                  <span className="text-[10px] text-on-surface-variant">+{aiJdKeywords.length - 10} {t("builder.keywords-more").replace("{n}", String(aiJdKeywords.length - 10))}</span>
                )}
              </div>
            )}
 
            <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="px-4 md:px-6 pb-32 space-y-6"
            >
              {activeStep === 0 && (
                <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft space-y-5">
                  <Field cvField="fullName" label={t("builder.field-fullname")} value={cvData.fullName} onChange={(v) => updateField("fullName", v)} />
                  <Field cvField="phone" label={t("builder.field-phone")} type="tel" value={cvData.phone} onChange={(v) => updateField("phone", v)} />
                  <Field cvField="email" label={t("builder.field-email")} type="email" value={cvData.email} onChange={(v) => updateField("email", v)} />
                  <Field cvField="address" label={t("builder.field-address")} value={cvData.address} onChange={(v) => updateField("address", v)} />
                  <Field cvField="linkedin" label={t("builder.field-linkedin")} value={cvData.linkedin} onChange={(v) => updateField("linkedin", v)} />
                  <Field cvField="portfolioUrl" label={t("builder.field-portfolio")} type="url" value={cvData.portfolioUrl || ""} onChange={(v) => updateField("portfolioUrl", v)} />
                  <Field cvField="professionalTitle" label={t("builder.field-motto")} value={cvData.professionalTitle || ""} onChange={(v) => updateField("professionalTitle", v)} />
                  
                  <SummarySection
                    employmentStatus={cvData.employmentStatus || ""}
                    customFields={cvData.customFields || []}
                    onEmploymentStatusChange={(v) => updateField("employmentStatus", v)}
                    onCustomFieldsChange={(fields) => updateField("customFields", fields)}
                    summary={cvData.summary}
                    fullName={cvData.fullName}
                    jobTitle={cvData.jobTitle}
                    professionalTitle={cvData.professionalTitle}
                    skills={aiSkillNames(cvData.skills)}
                    workHistorySummary={cvData.workHistory.map(w => w.position && w.company ? `${w.position} @ ${w.company}` : "").filter(Boolean).join("; ")}
                    eduSummary={cvData.education.map(e => e.degree ? `${e.degree}${e.field ? ` di ${e.field}` : ""}` : "").filter(Boolean).join("; ")}
                    certSummary={(cvData.certifications || []).map(c => c.name).filter(Boolean)}
                    cvId={cvId}
                    onChange={(v) => updateField("summary", v)}
                    onAISuggest={(texts) => {
                      setAiModal({
                        open: true,
                        mode: "suggest",
                        title: t("builder.ai-suggest-title"),
                        suggestions: texts.map((s: any) => ({
                          bullet: s.text,
                          actionVerb: s.label,
                          metric: s.style,
                          description: s.description,
                        })),
                        original: cvData.summary,
                        onAccept: (text: string) => {
                          updateField("summary", text);
                          setAiModal((prev) => ({ ...prev, open: false }));
                        },
                      });
                    }}
                    onAIRevise={(versions, explanation, tip) => {
                      setAiModal({
                        open: true,
                        mode: "revise",
                        title: t("builder.ai-revise-title"),
                        original: cvData.summary,
                        versions,
                        explanation,
                        tip,
                        onAccept: (text: string) => {
                          updateField("summary", text);
                          setAiModal((prev) => ({ ...prev, open: false }));
                        },
                      });
                    }}
                    onError={(msg) => addToast({ type: "error", message: msg })}
                  />
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-4">
                  <SortableList
                    ids={cvData.workHistory.map((w) => w.id)}
                    onMove={moveEntry("workHistory")}
                    itemLabel={(_id, i) => cvData.workHistory[i]?.position || `Pengalaman ${i + 1}`}
                    className="space-y-4"
                  >
                  {(_id, i, handle) => { const work = cvData.workHistory[i]; return (<WorkCard
  key={work.id}
  dragHandle={handle}
  work={work}
  index={i}
  totalItems={cvData.workHistory.length}
  isCollapsed={collapsedWorkIds.has(work.id)}
  skills={aiSkillNames(cvData.skills)}
  cvId={cvId}
  jobTitle={cvData.jobTitle}
  jobDescription={cvData.jobDescription}
                      onToggleCollapse={(id) => {
                        setCollapsedWorkIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(id)) next.delete(id); else next.add(id);
                          return next;
                        });
                      }}
                      onUpdate={updateWork}
                      onRemove={removeWork}
                      onMoveUp={moveWorkUp}
                      onMoveDown={moveWorkDown}
                      onToggleVisibility={toggleWorkVisible}
                      onAISuggest={(title, suggestions, onAccept) => {
                        setAiModal({
                          open: true, mode: "suggest", title, suggestions,
                          onAccept: (text, mode) => {
                            onAccept(text, mode);
                            setAiModal((prev) => ({ ...prev, open: false }));
                          },
                        });
                      }}
                      onAIRevise={(title, original, versions, explanation, tip, onAccept) => {
                        setAiModal({
                          open: true, mode: "revise", title, original, versions, explanation, tip,
                          asBullets: work.descriptionType !== "paragraph",
                          onAccept: (text) => {
                            onAccept(text);
                            setAiModal((prev) => ({ ...prev, open: false }));
                          },
                        });
                      }}
                      onError={(msg) => addToast({ type: "error", message: msg })}
                      onUpdateDescription={(idx, text) => {
                        setCvData((prev) => {
                          const arr = [...prev.workHistory];
                          arr[idx] = { ...arr[idx], description: text };
                          return { ...prev, workHistory: arr };
                        });
                      }}
                    />
                  ); }}
                  </SortableList>
                  <button type="button" onClick={addWork}
                    className="w-full border-2 border-dashed border-outline/30 rounded-xl py-4 flex items-center justify-center gap-2 text-body-md text-on-surface-variant hover:border-green-deep hover:text-green-deep transition-colors duration-200"
                  >
                    <span className="material-symbols-outlined text-lg">add</span> {t("builder.add-experience")}
                  </button>
                </div>
              )}
              {activeStep === 1 && (<TargetPekerjaanSection
  jobTitle={cvData.jobTitle}
  jobDescription={cvData.jobDescription}
  aiKeywords={aiJdKeywords}
  skills={aiSkillNames(cvData.skills)}
  onJobTitleChange={(v) => updateField("jobTitle", v)}
                  onJobDescriptionChange={(v) => updateField("jobDescription", v)}
                />
              )}

              {activeStep === 3 && (
                <div className="space-y-4">
                  <SortableList
                    ids={cvData.education.map((e) => e.id)}
                    onMove={moveEntry("education")}
                    itemLabel={(_id, i) => cvData.education[i]?.institution || `Pendidikan ${i + 1}`}
                    className="space-y-4"
                  >
                  {(_id, i, handle) => { const edu = cvData.education[i]; return (<EducationCard
  key={edu.id}
  dragHandle={handle}
  edu={edu}
  index={i}
  totalItems={cvData.education.length}
  jobTitle={cvData.jobTitle}
  skills={aiSkillNames(cvData.skills)}
  jobDescription={cvData.jobDescription}
  onUpdate={updateEducation}
                      onRemove={removeEducation}
                      onMoveUp={moveEduUp}
                      onMoveDown={moveEduDown}
                      onToggleVisibility={toggleEduVisible}
                    />
                  ); }}
                  </SortableList>
                  <button type="button" onClick={addEducation}
                    className="w-full border-2 border-dashed border-outline/30 rounded-xl py-4 flex items-center justify-center gap-2 text-body-md text-on-surface-variant hover:border-green-deep hover:text-green-deep transition-colors duration-200"
                  >
                    <span className="material-symbols-outlined text-lg">add</span> {t("builder.add-education")}
                  </button>
                </div>
              )}

              {activeStep === 4 && (isSectionUnused("organizations") ? (
                <UnusedSectionCard label="Organisasi" onRestore={() => restoreUnused("organizations")} hasContent={sectionHasSavedContent(cvData, "organizations")} onPurge={() => requestPurgeSection("organizations")} />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <RemoveSectionButton label="Organisasi" onRemove={() => requestRemoveSection("organizations")} />
                  </div>
                  <SortableList
                    ids={cvData.organisations.map((o) => o.id)}
                    onMove={moveEntry("organisations")}
                    itemLabel={(_id, i) => cvData.organisations[i]?.name || `Organisasi ${i + 1}`}
                    className="space-y-4"
                  >
                  {(_id, i, handle) => { const org = cvData.organisations[i]; return (<OrgCard
  key={org.id}
  dragHandle={handle}
  org={org}
  index={i}
  totalItems={cvData.organisations.length}
  jobTitle={cvData.jobTitle}
  skills={aiSkillNames(cvData.skills)}
  jobDescription={cvData.jobDescription}
  onUpdate={updateOrganization}
                      onSetPresent={(idx, isPresent) => {
                        setCvData((prev) => {
                          const arr = [...prev.organisations];
                          arr[idx] = { ...arr[idx], isPresent, endDate: isPresent ? "" : arr[idx].endDate };
                          return { ...prev, organisations: arr };
                        });
                      }}
                      onRemove={removeOrganization}
                      onMoveUp={moveOrgUp}
                      onMoveDown={moveOrgDown}
                      onToggleVisibility={toggleOrgVisible}
                    />
                  ); }}
                  </SortableList>
                  <button type="button" onClick={addOrganization}
                    className="w-full border-2 border-dashed border-outline/30 rounded-xl py-4 flex items-center justify-center gap-2 text-body-md text-on-surface-variant hover:border-green-deep hover:text-green-deep transition-colors duration-200"
                  >
                    <span className="material-symbols-outlined text-lg">add</span> {t("builder.add-org")}
                  </button>
                </div>
              ))}

              {activeStep === 5 && (
                <SkillSection
                  skills={cvData.skills}
                  certifications={cvData.certifications || []}
                  lainnyaContent={customSections.find(cs => cs.id === "lainnya")?.content || ""}
                  lainnyaContentType={customSections.find(cs => cs.id === "lainnya")?.contentType === "paragraph" ? "paragraph" : "bullets"}
                  onLainnyaContentTypeChange={helpers.updateLainnyaContentType}
                  selfEvaluation={cvData.selfEvaluation || ""}
                  onSkillChange={updateSkill}
                  onSkillRemove={removeSkill}
                  onSkillAdd={addSkill}
                  onCertChange={updateCertification}
                  onCertRemove={removeCertification}
                  onCertAdd={addCertification}
                  onLainnyaChange={updateLainnyaContent}
                  onSelfEvaluationChange={(v) => updateField("selfEvaluation", v)}
                  isSectionHidden={isSectionHidden}
                  onShowSection={showSection}
                  isSectionUnused={isSectionUnused}
                  onRemoveSection={requestRemoveSection}
                  onRestoreSection={restoreUnused}
                  hasSavedContent={(k) => sectionHasSavedContent(cvData, k)}
                  onPurgeSection={requestPurgeSection}
                />
              )}
              {activeStep === 5 && customOnly.map((cs) => isSectionUnused(cs.id) ? (
                <UnusedSectionCard
                  key={cs.id}
                  label={labelOf(cs.id)}
                  hasContent={!!cs.content.trim()}
                  onRestore={() => restoreUnused(cs.id)}
                  onPurge={() => requestPurgeSection(cs.id)}
                />
              ) : (
                <CustomSectionCard
                  key={cs.id}
                  section={cs}
                  onChange={(patch) => setCvData((prev) => updateCustomSection(prev, cs.id, patch))}
                  onRemove={() => requestRemoveSection(cs.id)}
                  hiddenNotice={cs.content.trim() && isSectionHidden(cs.id) ? <HiddenSectionNotice onShow={() => showSection(cs.id)} /> : null}
                />
              ))}
              {activeStep === 5 && (
                <div className="rounded-xl bg-surface-container-lowest p-6 shadow-soft">
                  <h3 className="mb-1 font-label-bold text-on-surface">Tambah bagian</h3>
                  <p className="mb-3 text-xs text-on-surface-variant">Bagian tambahan muncul di CV setelah diisi, dan bisa diurutkan lewat Urutan Section.</p>
                  <AddSectionPanel
                    unused={unusedForPanel}
                    onRestore={restoreUnused}
                    onAddCustom={addCustom}
                    customCount={customSections.length}
                    existingTitles={customSections.map((c) => c.title)}
                  />
                </div>
              )}

              {activeStep === 6 && (
                <ReviewStep cvData={cvData} sectionCompletion={sectionCompletion} customSections={customSections} cvId={cvId} />
              )}

            </motion.div>
            </AnimatePresence>
          </div>

          <PanelSplitter value={leftPct} onChange={setLeftPct} containerRef={workspaceRef} />

          {/* ── RIGHT PANEL ── */}
          {/* Layar < lg: pratinjau dibuka penuh lewat tombol "Lihat CV", bukan strip sempit di bawah form. */}
          <div
            className={`${mobilePreviewOpen ? "fixed inset-0 z-50 flex bg-background" : "hidden"} lg:static lg:z-auto lg:flex lg:bg-surface-dim/20 w-full lg:w-auto lg:flex-1 lg:min-w-0 flex-col overflow-hidden h-full`}
            {...(mobilePreviewOpen ? { role: "dialog", "aria-modal": true, "aria-label": "Pratinjau CV" } : {})}
          >
            {/* ── FORMATTING TOOLBAR ── */}
            <FormatToolbar
              cvCompleteness={cvCompleteness}
              saveStatus={saveStatus === "conflict" || saveStatus === "rejected" ? "error" : saveStatus}
              lastSaved={lastSaved}
              computeAtsScore={computeAtsScore}
              block={blockControls}
              fontFamily={effFont}
              fontSize={effSize}
              textAlign={effAlign}
              showDividers={allDividers}
              reducedMotion={reducedMotion}
              isPdfExporting={isPdfExporting}
              onFontFamilyChange={(v) => (activeTarget ? setSectionStyle(activeTarget, { fontFamily: v }) : setFontFamily(v))}
              onFontSizeChange={(v) => (activeTarget ? setSectionStyle(activeTarget, { fontSize: v }) : setFontSize(v))}
              onTextAlignChange={(v) => (activeTarget ? setSectionStyle(activeTarget, { textAlign: v }) : setTextAlign(v))}
              onDividersToggle={() => setShowDividers(!allDividers)}
              onOpenSectionOrder={() => setShowSectionOrderModal(true)}
              onOpenDisplaySettings={() => setShowDisplaySettings(true)}
              onNavigateToCheckout={() => router.push(`/cv/${cvId}/checkout`)}
              onExportPdf={handleExportPdf}
              templateId={selectedTemplateId}
              onTemplateChange={(id) => {
                setTemplateTouched(true);
                setSelectedTemplateId(id);
              }}
              hasStyleOverrides={hasStyleOverrides}
              onCloseMobilePreview={() => setMobilePreviewOpen(false)}
              onResetStyle={() =>
                setConfirm({
                  title: "Kembalikan ke gaya template?",
                  message: "Font, ukuran huruf, rata teks, warna, dan gaya per bagian pilihanmu dihapus lalu mengikuti template. Urutan, spasi, margin, dan isi CV tidak berubah.",
                  confirmLabel: "Kembalikan",
                  cancelLabel: "Batal",
                  onConfirm: format.resetToTemplateStyle,
                })
              }
            />

            {/* ── PREVIEW AREA, scrollable continuous with page break indicators ── */}
            <div className="flex-1 flex flex-col items-center bg-surface-dim/20 custom-scrollbar" style={{ minHeight: 0, overflowY: 'auto' }}>
              <div className="w-full max-w-[calc(210mm+30mm)] px-2 sm:px-4 lg:px-[15mm] py-4 md:py-6">
                {/* Page count badge */}
                {allPageCount > 1 && (
                  <div className="mb-3 flex items-center gap-2 text-[11px] font-medium text-on-surface-variant bg-surface-container-lowest/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-outline-variant/40 shadow-sm w-fit">
                    <span className="material-symbols-outlined text-sm">description</span>
                    {t("builder.page-badge").replace("{pages}", String(allPageCount)).replace("{margin}", marginMode === "tight" ? "10" : marginMode === "normal" ? "20" : "30")}
                  </div>
                )}
                {/* Halaman A4 nyata: ukuran pt/mm sama dengan PDF */}
                <div ref={previewRef} className="relative" onFocus={onPreviewFocus} onBlur={onPreviewBlur} onClick={onPreviewClick} onMouseEnter={onPreviewEnter}>
                {editHint && (
                  <div role="status" className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-inverse-surface py-1 pl-3 pr-1 text-xs font-medium text-inverse-on-surface shadow-md">
                    Klik teks untuk mengedit
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeHint();
                      }}
                      aria-label="Tutup petunjuk"
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/15"
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
                    </button>
                  </div>
                )}
                <FitA4>
                  <CvPagedPreview pageCount={allPageCount} marginMm={marginPadding} measureRef={contentRef} activePage={focusPage}>
                    {previewContent}
                  </CvPagedPreview>
                </FitA4>
                </div>
              </div>

              {/* ATS Score Insight */}
              {computeAtsScore > 0 && <AtsScoreInsight score={computeAtsScore} />}
            </div>
          </div>
        </div>

        {/* ── AI PROPOSAL MODAL ── */}
        <AIProposalModal
          open={aiModal.open}
          onClose={() => setAiModal((prev) => ({ ...prev, open: false }))}
          mode={aiModal.mode}
          title={aiModal.title}
          suggestions={aiModal.suggestions}
          original={aiModal.original}
          versions={aiModal.versions}
          explanation={aiModal.explanation}
          tip={aiModal.tip}
          asBullets={aiModal.asBullets}
          onAccept={aiModal.onAccept}
        />

        {/* ── SECTION ORDER MODAL ── */}
        <SectionOrderModal
          open={showSectionOrderModal}
          onClose={() => setShowSectionOrderModal(false)}
          sectionOrder={sectionOrder}
          sectionVisibility={sectionVisibility}
          labelOf={labelOf}
          onMove={moveSection}
          hasDivider={hasDivider}
          onToggleDivider={toggleDivider}
          allDividers={allDividers}
          onAllDividersChange={setShowDividers}
          isRemovable={(key) => isRemovableSection(cvData, key)}
          onRemove={requestRemoveSection}
          unused={unusedForPanel}
          onRestore={restoreUnused}
          onAddCustom={addCustom}
          customCount={customSections.length}
          customTitles={customSections.map((c) => c.title)}
        />

        <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} />

        {/* ── DISPLAY SETTINGS MODAL ── */}
        <DisplaySettingsModal
          open={showDisplaySettings}
          customPrimaryColor={customPrimaryColor}
          spacingMode={spacingMode}
          headerLayout={headerLayout}
          marginMode={marginMode}
          sectionVisibility={sectionVisibility}
          showSkillLevel={showSkillLevel}
          onShowSkillLevelChange={setShowSkillLevel}
          onClose={() => setShowDisplaySettings(false)}
          onPrimaryColorChange={setCustomPrimaryColor}
          onSpacingModeChange={setSpacingMode}
          onHeaderLayoutChange={setHeaderLayout}
          onMarginModeChange={setMarginMode}
          onSectionVisibilityChange={(key, visible) =>
            setSectionVisibility((prev) => ({ ...prev, [key]: visible }))
          }
        />

        {!mobilePreviewOpen && (
          <button
            type="button"
            onClick={() => setMobilePreviewOpen(true)}
            className="fixed bottom-24 right-4 z-40 flex min-h-12 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary shadow-lg lg:hidden"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">description</span>
            Lihat CV
          </button>
        )}

        {/* ── BOTTOM NAV ── */}
        <BottomNav steps={steps} activeStep={activeStep} setActiveStep={setActiveStep} sectionCompletion={sectionCompletion} sectionMeta={sectionMeta} handleSave={handleSave} isSaving={isSaving} />
      </div>
    </AuthGuard>
  );
}

/** Satu perubahan dari pratinjau (sesi fokus → blur). */
interface PreviewEdit {
  path: string;
  before: string;
  after: string;
}
const EDIT_HISTORY_MAX = 50;
const EDIT_HINT_KEY = "cv_builder_edit_hint_seen";

/** Nama file dari header Content-Disposition server (satu sumber penamaan). */
function fileNameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim());
    } catch {
      return null;
    }
  }
  const plain = /filename="([^"]+)"/i.exec(header);
  return plain ? plain[1] : null;
}
