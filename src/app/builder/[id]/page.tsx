"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import AppHeader from "@/components/AppHeader";
import AuthGuard from "@/components/AuthGuard";
import { AtsBaseRenderer, TEMPLATE_STYLES, type CvData } from "@/components/cv-templates";
import { exportPdfViaServer } from "@/lib/pdf-export";
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
import { DisplaySettingsModal } from "@/components/builder/DisplaySettingsModal";
import { ReviewStep } from "@/components/builder/ReviewStep";
import { SectionOrderModal } from "@/components/builder/SectionOrderModal";
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
  const { addToast } = useToast();

  /* ── Data Fetch ── */
  const { cvData, isLoading, fetchError, selectedTemplateId, setCvData, setSelectedTemplateId } = useFetchCvData(cvId);

  /* ── Auto-Save ── */
  const { saveStatus, lastSaved } = useAutoSave(cvId, cvData);

  /* ── Format Settings Hook ── */
  const format = useBuilderFormat({ cvId });

  /* ── Compute margin & page dimensions ── */
  const contentRef = useRef<HTMLDivElement>(null);
  const [allPageCount, setAllPageCount] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  // Detect multi-page overflow via content height measurement
  const initialMeasureDoneRef = useRef(false);
  useEffect(() => {
    if (!contentRef.current) return;
    const mmToPx = (mm: number) => mm * (96 / 25.4);
    const contentHeightPx = mmToPx(contentAreaMm);

    if (!initialMeasureDoneRef.current) {
      const h = contentRef.current.offsetHeight;
      if (h > 0) {
        initialMeasureDoneRef.current = true;
        const pages = Math.max(1, Math.ceil(h / contentHeightPx));
        setAllPageCount(pages);
      }
    }

    if (roRef.current) {
      roRef.current.disconnect();
      roRef.current = null;
    }
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const h = e.contentBoxSize?.[0]?.blockSize || e.contentRect.height;
        const pages = Math.max(1, Math.ceil(h / contentHeightPx));
        setAllPageCount(pages);
      }
    });
    ro.observe(contentRef.current);
    roRef.current = ro;
    return () => {
      ro.disconnect();
      roRef.current = null;
    };
  });

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
    updateLainnyaContent, moveSectionUp, moveSectionDown,
  } = helpers;

  const {
    fontFamily, setFontFamily, fontSize, setFontSize, textAlign, setTextAlign,
    showDividers, setShowDividers, customPrimaryColor, setCustomPrimaryColor,
    spacingMode, setSpacingMode, headerLayout, setHeaderLayout,
    marginMode, setMarginMode, sectionOrder, setSectionOrder,
    sectionVisibility, setSectionVisibility, customSections, setCustomSections,
    showDisplaySettings, setShowDisplaySettings, showSectionOrderModal, setShowSectionOrderModal,
    isPdfExporting, setIsPdfExporting, MARGIN_VALUES, marginPadding, contentAreaMm,
  } = format;

  const {
    aiJdKeywords, setAiJdKeywords, reducedMotion, computeAtsScore,
    sectionCompletion, cvCompleteness, aiModal, setAiModal, SECTION_LABEL_MAP,
  } = ai;



  /* ── PDF Export ── */

  const handleExportPdf = async () => {
    if (!previewRef.current) return;
    const el = previewRef.current;
    setIsPdfExporting(true);
    try {
      const result = await exportPdfViaServer(
        el,
        `${cvData.fullName || "CV"}_AI_Career_Hub.pdf`,
        marginPadding,
        contentAreaMm
      );
      if (!result.ok) {
        if (result.redirectUrl) {
          addToast({ 
            type: "warning", 
            message: result.error || t("builder.pdf-quota") 
          });
          setTimeout(() => router.push(result.redirectUrl!), 1500);
        } else {
          addToast({ type: "error", message: result.error || t("builder.pdf-export-failed") });
        }
      }
    } catch (err) {
      console.error("PDF Export Error:", err);
      addToast({ type: "error", message: t("builder.pdf-export-error") });
    } finally {
      setIsPdfExporting(false);
    }
  };



  /* ── save ── */

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/cv-documents/${cvId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cvData),
      });
      if (!res.ok) throw new Error(`${t("builder.save-failed")} (${res.status})`);
      addToast({ type: "success", message: t("builder.save-success") });
    } catch (err: any) {
      addToast({ type: "error", message: err.message });
    } finally {
      setIsSaving(false);
    }
  }, [cvId, cvData, addToast, t]);

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
  }, []);

  /* ── loading / error ── */

  if (isLoading) return <BuilderLoadingSkeleton />;
  if (fetchError) return <BuilderErrorState message={fetchError} />;

  /* ── main render ── */

  return (
    <AuthGuard>
      <div className="h-[100dvh] flex flex-col bg-background">
        <AppHeader />

        {/* ── STEPPER (connector lines style) ── */}
        <div className="w-full bg-white border-b border-outline-variant/30 py-4 md:py-5 px-3 md:px-8 overflow-x-auto shrink-0">
          <StepperSteps steps={steps} activeStep={activeStep} setActiveStep={setActiveStep} sectionCompletion={sectionCompletion} sectionMeta={sectionMeta} />
        </div>

        {/* ── WORKSPACE LAYOUT ── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-auto lg:h-[calc(100vh-64px-80px)]">
          {/* ── LEFT PANEL ── */}
          <div className="w-full lg:w-1/2 bg-background border-b lg:border-b-0 lg:border-r border-outline-variant/30 overflow-y-auto custom-scrollbar">
            <div className="px-6 pt-8 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">{sectionMeta[activeStep].icon}</span>
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
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary shrink-0">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">travel_explore</span>
                  <span>{t("builder.keywords-label")}</span>
                </div>
                {aiJdKeywords.slice(0, 10).map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white rounded-full text-[10px] font-medium text-primary border border-primary/20 cursor-default hover:bg-primary/10 transition-colors">
                    {kw}
                  </span>
                ))}
                {aiJdKeywords.length > 10 && (
                  <span className="text-[10px] text-outline">+{aiJdKeywords.length - 10} {t("builder.keywords-more").replace("{n}", String(aiJdKeywords.length - 10))}</span>
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
                <div className="bg-white rounded-xl p-6 shadow-soft space-y-5">
                  <Field label={t("builder.field-fullname")} value={cvData.fullName} onChange={(v) => updateField("fullName", v)} />
                  <Field label={t("builder.field-phone")} type="tel" value={cvData.phone} onChange={(v) => updateField("phone", v)} />
                  <Field label={t("builder.field-email")} type="email" value={cvData.email} onChange={(v) => updateField("email", v)} />
                  <Field label={t("builder.field-address")} value={cvData.address} onChange={(v) => updateField("address", v)} />
                  <Field label={t("builder.field-linkedin")} value={cvData.linkedin} onChange={(v) => updateField("linkedin", v)} />
                  <Field label={t("builder.field-portfolio")} type="url" value={cvData.portfolioUrl || ""} onChange={(v) => updateField("portfolioUrl", v)} />
                  <Field label={t("builder.field-motto")} value={cvData.professionalTitle || ""} onChange={(v) => updateField("professionalTitle", v)} />
                  
                  <SummarySection
                    employmentStatus={cvData.employmentStatus || ""}
                    customFields={cvData.customFields || []}
                    onEmploymentStatusChange={(v) => updateField("employmentStatus", v)}
                    onCustomFieldsChange={(fields) => updateField("customFields", fields)}
                    summary={cvData.summary}
                    fullName={cvData.fullName}
                    jobTitle={cvData.jobTitle}
                    professionalTitle={cvData.professionalTitle}
                    skills={cvData.skills.filter(s => s.level === "advanced" || s.level === "intermediate").map(s => s.name)}
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
                  {cvData.workHistory.map((work, i) => (<WorkCard
  key={work.id}
  work={work}
  index={i}
  totalItems={cvData.workHistory.length}
  isCollapsed={collapsedWorkIds.has(work.id)}
  skills={cvData.skills.filter(s => s.level === "advanced" || s.level === "intermediate").map(s => s.name)}
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
                        setAiModal({ open: true, mode: "suggest", title, suggestions, onAccept });
                      }}
                      onAIRevise={(title, original, versions, explanation, tip, onAccept) => {
                        setAiModal({ open: true, mode: "revise", title, original, versions, explanation, tip, onAccept });
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
                  ))}
                  <button type="button" onClick={addWork}
                    className="w-full border-2 border-dashed border-outline/30 rounded-xl py-4 flex items-center justify-center gap-2 text-body-md text-outline hover:border-primary/50 hover:text-primary transition-colors duration-200"
                  >
                    <span className="material-symbols-outlined text-lg">add</span> {t("builder.add-experience")}
                  </button>
                </div>
              )}
              {activeStep === 1 && (<TargetPekerjaanSection
  jobTitle={cvData.jobTitle}
  jobDescription={cvData.jobDescription}
  aiKeywords={aiJdKeywords}
  skills={cvData.skills.filter(s => s.level === "advanced" || s.level === "intermediate").map(s => s.name)}
  onJobTitleChange={(v) => updateField("jobTitle", v)}
                  onJobDescriptionChange={(v) => updateField("jobDescription", v)}
                />
              )}

              {activeStep === 3 && (
                <div className="space-y-4">
                  {cvData.education.map((edu, i) => (<EducationCard
  key={edu.id}
  edu={edu}
  index={i}
  totalItems={cvData.education.length}
  jobTitle={cvData.jobTitle}
  skills={cvData.skills.filter(s => s.level === "advanced" || s.level === "intermediate").map(s => s.name)}
  jobDescription={cvData.jobDescription}
  onUpdate={updateEducation}
                      onRemove={removeEducation}
                      onMoveUp={moveEduUp}
                      onMoveDown={moveEduDown}
                      onToggleVisibility={toggleEduVisible}
                    />
                  ))}
                  <button type="button" onClick={addEducation}
                    className="w-full border-2 border-dashed border-outline/30 rounded-xl py-4 flex items-center justify-center gap-2 text-body-md text-outline hover:border-primary/50 hover:text-primary transition-colors duration-200"
                  >
                    <span className="material-symbols-outlined text-lg">add</span> {t("builder.add-education")}
                  </button>
                </div>
              )}

              {activeStep === 4 && (
                <div className="space-y-4">
                  {cvData.organisations.map((org, i) => (<OrgCard
  key={org.id}
  org={org}
  index={i}
  totalItems={cvData.organisations.length}
  jobTitle={cvData.jobTitle}
  skills={cvData.skills.filter(s => s.level === "advanced" || s.level === "intermediate").map(s => s.name)}
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
                  ))}
                  <button type="button" onClick={addOrganization}
                    className="w-full border-2 border-dashed border-outline/30 rounded-xl py-4 flex items-center justify-center gap-2 text-body-md text-outline hover:border-primary/50 hover:text-primary transition-colors duration-200"
                  >
                    <span className="material-symbols-outlined text-lg">add</span> {t("builder.add-org")}
                  </button>
                </div>
              )}

              {activeStep === 5 && (
                <SkillSection
                  skills={cvData.skills}
                  certifications={cvData.certifications || []}
                  lainnyaContent={customSections.find(cs => cs.id === "lainnya")?.content || ""}
                  selfEvaluation={cvData.selfEvaluation || ""}
                  onSkillChange={updateSkill}
                  onSkillRemove={removeSkill}
                  onSkillAdd={addSkill}
                  onCertChange={updateCertification}
                  onCertRemove={removeCertification}
                  onCertAdd={addCertification}
                  onLainnyaChange={updateLainnyaContent}
                  onSelfEvaluationChange={(v) => updateField("selfEvaluation", v)}
                />
              )}

              {activeStep === 6 && (
                <ReviewStep cvData={cvData} sectionCompletion={sectionCompletion} customSections={customSections} cvId={cvId} />
              )}

            </motion.div>
            </AnimatePresence>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="w-full lg:w-1/2 flex flex-col bg-surface-dim/20 relative overflow-hidden h-full">
            {/* ── FORMATTING TOOLBAR ── */}
            <FormatToolbar
              cvCompleteness={cvCompleteness}
              saveStatus={saveStatus}
              lastSaved={lastSaved}
              computeAtsScore={computeAtsScore}
              fontFamily={fontFamily}
              fontSize={fontSize}
              textAlign={textAlign}
              showDividers={showDividers}
              reducedMotion={reducedMotion}
              isPdfExporting={isPdfExporting}
              onFontFamilyChange={setFontFamily}
              onFontSizeChange={(v) => setFontSize(v)}
              onTextAlignChange={setTextAlign}
              onDividersToggle={() => setShowDividers((d) => !d)}
              onOpenSectionOrder={() => setShowSectionOrderModal(true)}
              onOpenDisplaySettings={() => setShowDisplaySettings(true)}
              onNavigateToCheckout={() => router.push(`/cv/${cvId}/checkout`)}
              onExportPdf={handleExportPdf}
            />

            {/* ── PREVIEW AREA — scrollable continuous with page break indicators ── */}
            <div className="flex-1 flex flex-col items-center bg-surface-dim/20 custom-scrollbar" style={{ minHeight: 0, overflowY: 'auto' }}>
              <div className="w-full max-w-[210mm] px-[15mm] py-4 md:py-6">
                {/* Page count badge */}
                {allPageCount > 1 && (
                  <div className="mb-3 flex items-center gap-2 text-[11px] font-medium text-outline bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-outline-variant/20 shadow-sm w-fit">
                    <span className="material-symbols-outlined text-sm">description</span>
                    {t("builder.page-badge").replace("{pages}", String(allPageCount)).replace("{margin}", marginMode === "tight" ? "10" : marginMode === "normal" ? "20" : "30")}
                  </div>
                )}
                {/* A4 Paper Preview — scrollable continuous paper */}
                <div
                  ref={previewRef}
                  className="a4-preview origin-top scale-[0.85] lg:scale-100 max-w-full shrink-0"
                  style={{
                    fontFamily,
                    width: '210mm',
                    padding: `${marginPadding}mm`,
                    position: 'relative',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    margin: '0 auto',
                  }}
                >
                  <div
                    ref={contentRef}
                    style={{
                      minHeight: `${contentAreaMm}mm`,
                      background: '#ffffff',
                      backgroundImage: `repeating-linear-gradient(
                        to bottom,
                        transparent 0,
                        transparent calc(${contentAreaMm}mm - 0.5px),
                        #ddd calc(${contentAreaMm}mm - 0.5px),
                        #ddd ${contentAreaMm}mm
                      )`,
                      position: 'relative',
                    }}
                  >
                    <AtsBaseRenderer
                    data={{ ...cvData, customSections }}
                    lang={cvData.cvLang}
                    style={{
                      ...(TEMPLATE_STYLES[selectedTemplateId] || TEMPLATE_STYLES["industrial-pro"]),
                      bodySize: fontSize,
                      bodyFont: fontFamily,
                      headingFont: fontFamily,
                      textAlign,
                      ...(customPrimaryColor ? { primary: customPrimaryColor, sectionTitle: customPrimaryColor } : {}),
                    }}
                    sectionOrder={sectionOrder.filter(key => sectionVisibility[key] !== false)}
                    showDividers={showDividers}
                    headerLayout={headerLayout}
                    lineHeight={spacingMode === "compact" ? 1.3 : spacingMode === "spacious" ? 1.8 : 1.5}
                    onSectionClick={(sectionKey) => {
                      const sectionStepMap: Record<string, number> = {
                        "summary": 0,
                        "experience": 2,
                        "education": 3,
                        "skills": 5,
                        "organizations": 4,
                      };
                      const step = sectionStepMap[sectionKey];
                      if (step !== undefined) setActiveStep(step);
                    }}
                  />

                  {/* Page number indicators at page breaks */}
                  {allPageCount > 1 && Array.from({ length: allPageCount - 1 }, (_, i) => (
                    <div
                      key={i}
                      data-page-indicator="true"
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: `${(i + 1) * contentAreaMm}mm`,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        pointerEvents: 'none',
                        zIndex: 5,
                        transform: 'translateY(-50%)',
                      }}
                    >
                      <span style={{ flex: 1, height: 0, borderTop: '0.5px dashed #ccc' }} />
                      <span style={{
                        background: '#ffffff',
                        padding: '0 10px',
                        fontSize: '9px',
                        color: '#b0b0b0',
                        fontWeight: 500,
                        letterSpacing: '1px',
                        whiteSpace: 'nowrap',
                        lineHeight: 1,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ flex: 1, height: 0, borderTop: '0.5px dashed #ccc' }} />
                    </div>
                  ))}
                </div>
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
          onAccept={aiModal.onAccept}
        />

        {/* ── SECTION ORDER MODAL ── */}
        <SectionOrderModal
          open={showSectionOrderModal}
          onClose={() => setShowSectionOrderModal(false)}
          sectionOrder={sectionOrder}
          sectionVisibility={sectionVisibility}
          SECTION_LABEL_MAP={SECTION_LABEL_MAP}
          onMoveUp={moveSectionUp}
          onMoveDown={moveSectionDown}
        />

        {/* ── DISPLAY SETTINGS MODAL ── */}
        <DisplaySettingsModal
          open={showDisplaySettings}
          customPrimaryColor={customPrimaryColor}
          spacingMode={spacingMode}
          headerLayout={headerLayout}
          marginMode={marginMode}
          sectionVisibility={sectionVisibility}
          onClose={() => setShowDisplaySettings(false)}
          onPrimaryColorChange={setCustomPrimaryColor}
          onSpacingModeChange={setSpacingMode}
          onHeaderLayoutChange={setHeaderLayout}
          onMarginModeChange={setMarginMode}
          onSectionVisibilityChange={(key, visible) =>
            setSectionVisibility((prev) => ({ ...prev, [key]: visible }))
          }
        />

        {/* ── BOTTOM NAV ── */}
        <BottomNav steps={steps} activeStep={activeStep} setActiveStep={setActiveStep} sectionCompletion={sectionCompletion} sectionMeta={sectionMeta} handleSave={handleSave} isSaving={isSaving} />
      </div>
    </AuthGuard>
  );
}




