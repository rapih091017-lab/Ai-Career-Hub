"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { CvData } from "@/components/cv-templates";

/* ───────── AI & Scoring Logic ───────── */

interface UseBuilderAIProps {
  cvData: CvData;
  setCvData: React.Dispatch<React.SetStateAction<CvData>>;
  cvId: string;
  activeStep: number;
  setActiveStep: (step: number) => void;
  addToast: (toast: { type: "success" | "info" | "error" | "warning"; message: string; duration?: number }) => void;
}

export function useBuilderAI({
  cvData,
  setCvData,
  cvId,
  activeStep,
  setActiveStep,
  addToast,
}: UseBuilderAIProps) {
  /* ── AI JD Suggestions state ── */
  const prevActiveStep = useRef(activeStep);
  const [aiJdSuggestions, setAiJdSuggestions] = useState(null as any[] | null);
  const [aiJdKeywords, setAiJdKeywords] = useState(null as string[] | null);
  const [aiJdTriggered, setAiJdTriggered] = useState(false);

  /* ── Reduced motion preference ── */
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* ── Reset AI trigger when Target Pekerjaan data changes ── */
  useEffect(() => {
    if (aiJdTriggered && (activeStep === 1 || prevActiveStep.current === 1)) {
      setAiJdTriggered(false);
    }
  }, [cvData.jobTitle, cvData.jobDescription, aiJdTriggered, activeStep]);

  /* ── AI Trigger: generate suggestions after Target Pekerjaan filled ── */
  useEffect(() => {
    const justLeftTargetPekerjaan = prevActiveStep.current === 1 && activeStep > 1;
    const hasTargetData = cvData.jobTitle || cvData.jobDescription;

    if (justLeftTargetPekerjaan && hasTargetData && !aiJdTriggered) {
      setAiJdTriggered(true);
      const skills = cvData.skills
        .filter((s) => s.level === "advanced" || s.level === "intermediate")
        .map((s) => s.name);

      fetch(`/api/cv-documents/${cvId}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "suggest",
          section: "general",
          currentText: cvData.jobDescription,
          jobTitle: cvData.jobTitle,
          jobDescription: cvData.jobDescription,
          skills,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.suggestions?.length > 0) {
            setAiJdSuggestions(data.suggestions);
            addToast({
              type: "success",
              message: "AI menganalisis deskripsi pekerjaan! Saran kata kunci tersedia di setiap section.",
              duration: 5000,
            });
          }
          if (data.keywords?.length > 0) {
            setAiJdKeywords(data.keywords);
          }
        })
        .catch(() => {
          addToast({
            type: "info",
            message: "Isi setiap section dengan kata kunci dari deskripsi pekerjaan agar CV lebih optimal.",
            duration: 4000,
          });
        });
    }

    prevActiveStep.current = activeStep;
  }, [activeStep, cvData.jobTitle, cvData.jobDescription, cvData.skills, cvId, addToast, aiJdTriggered]);

  /* ── ATS Score ── */
  const computeAtsScore = useMemo((): number => {
    const stem = (word: string): string => {
      return word
        .replace(/(an|kan|nya|ing|tion|ment|ness|ly|ed|er|est)$/, "")
        .replace(/(.+)\1$/, "$1");
    };

    const tokenize = (text: string): string[] => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .map(stem);
    };

    const jd = cvData.jobDescription || "";
    const jdTokens = [...new Set(tokenize(jd))];
    if (!jdTokens.length) return 0;

    const contentFields = [
      cvData.summary,
      ...(cvData.workHistory || []).map((w) => w.description),
      ...(cvData.education || []).map((e) => `${e.degree} ${e.field} ${e.institution}`),
      ...(cvData.skills || []).map((s) => s.name),
      ...(cvData.organisations || []).map((o) => o.description),
    ]
      .filter(Boolean)
      .join(" ");

    const cvTokens = tokenize(contentFields);
    const cvTokensSet = new Set(cvTokens);

    let totalScore = 0;
    for (const kw of jdTokens) {
      if (cvTokensSet.has(kw)) {
        totalScore += 1;
        continue;
      }
      const partialMatch = cvTokens.some((ct) => ct.includes(kw) || kw.includes(ct));
      if (partialMatch) totalScore += 0.5;
    }

    return Math.round((totalScore / jdTokens.length) * 100);
  }, [cvData]);

  /* ── Section Completion ── */
  const sectionCompletion = useMemo((): boolean[] => {
    return [
      // 0: Data Pribadi
      !!cvData.fullName && (!!cvData.email || !!cvData.phone),
      // 1: Target Pekerjaan
      !!cvData.jobTitle || !!cvData.jobDescription,
      // 2: Pengalaman Kerja
      cvData.workHistory.some((w) => !!w.position || !!w.company),
      // 3: Pendidikan
      cvData.education.some((e) => !!e.institution || !!e.degree),
      // 4: Organisasi
      cvData.organisations.some((o) => !!o.name),
      // 5: Skill
      cvData.skills.some((s) => !!s.name),
      // 6: Review — always accessible
      true,
    ];
  }, [cvData]);

  /* ── CV Completeness percentage ── */
  const cvCompleteness = useMemo((): number => {
    const filled = sectionCompletion.slice(0, 6).filter(Boolean).length;
    return Math.round((filled / 6) * 100);
  }, [sectionCompletion]);

  /* ── AI Modal state ── */
  const [aiModal, setAiModal] = useState<{
    open: boolean;
    mode: "suggest" | "revise";
    title: string;
    suggestions?: { bullet: string; actionVerb?: string; metric?: string }[];
    original?: string;
    versions?: { conservative: string; improved: string; bold: string };
    explanation?: string;
    tip?: string;
    onAccept: (text: string) => void;
  }>({ open: false, mode: "suggest", title: "", onAccept: () => {} });

  /* ── Section label map for modals ── */
  const SECTION_LABEL_MAP: Record<string, string> = {
    summary: "Ringkasan Profesional",
    experience: "Pengalaman Kerja",
    education: "Pendidikan",
    skills: "Keahlian & Sertifikasi",
    organizations: "Organisasi",
    lainnya: "Lainnya (Key Achievements, dll.)",
  };

  return {
    // AI suggestions
    aiJdSuggestions,
    aiJdKeywords,
    setAiJdKeywords,
    // Reduced motion
    reducedMotion,
    // Scoring
    computeAtsScore,
    sectionCompletion,
    cvCompleteness,
    // AI Modal
    aiModal,
    setAiModal,
    // Section labels
    SECTION_LABEL_MAP,
  };
}
