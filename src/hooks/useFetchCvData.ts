"use client";

import { useState, useEffect } from "react";
import type { CvData } from "@/components/cv-templates";

const emptyCvData: CvData = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  linkedin: "",
  portfolioUrl: "",
  summary: "",
  selfEvaluation: "",
  employmentStatus: "",
  jobTitle: "",
  jobDescription: "",
  professionalTitle: "",
  workHistory: [],
  education: [],
  organisations: [],
  skills: [],
  certifications: [],
  customFields: [],
  cvLang: "id",
};

interface UseFetchCvDataReturn {
  cvData: CvData;
  isLoading: boolean;
  fetchError: string | null;
  selectedTemplateId: string;
  setCvData: React.Dispatch<React.SetStateAction<CvData>>;
  setSelectedTemplateId: React.Dispatch<React.SetStateAction<string>>;
  setFetchError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useFetchCvData(cvId: string): UseFetchCvDataReturn {
  const [cvData, setCvData] = useState<CvData>(emptyCvData);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("industrial-pro");

  useEffect(() => {
    if (!cvId) return;

    setIsLoading(true);
    setFetchError(null);

    fetch(`/api/cv-documents/${cvId}`)
      .then(async (res) => {
        if (res.status === 404) {
          throw new Error("CV tidak ditemukan (404).");
        }
        if (!res.ok) {
          throw new Error(`Gagal mengambil data (${res.status}).`);
        }
        return res.json();
      })
      .then((data) => {
        const tc = data.tailoredContent;
        if (tc && typeof tc === "object") {
          const isNested = "personalInfo" in tc;
          if (isNested) {
            const pi = tc.personalInfo || {};
            const merged: CvData = {
              ...emptyCvData,
              fullName: pi.fullName || "",
              phone: pi.phone || "",
              email: pi.email || "",
              address: pi.address || "",
              linkedin: pi.linkedin || "",
              portfolioUrl: pi.portfolioUrl || "",
              summary: pi.summary || "",
              selfEvaluation: tc.selfEvaluation || pi.selfEvaluation || "",
              employmentStatus: tc.employmentStatus || pi.employmentStatus || "",
              professionalTitle: pi.professionalTitle || "",
              jobTitle: data.jobTitle || "",
              jobDescription: data.jobDescription || "",
              customFields: (tc.customFields || pi.customFields || []).map(
                (f: any, i: number) => ({
                  id: f.id || `cf_${i}_${Date.now()}`,
                  label: f.label || "",
                  value: f.value || "",
                })
              ),
              workHistory: (tc.workHistory || []).map((w: any, i: number) => ({
                id: w.id || `wh_${i}_${Date.now()}`,
                position: w.position || "",
                company: w.company || "",
                companyDescription: w.companyDescription || "",
                location: w.location || "",
                startDate: w.startDate || "",
                endDate: w.endDate || "",
                description: w.description || "",
                achievement: w.achievement || "",
                visible: w.visible !== false,
                projectUrl: w.projectUrl || "",
              })),
              education: (tc.education || []).map((e: any, i: number) => ({
                id: e.id || `edu_${i}_${Date.now()}`,
                institution: e.institution || "",
                degree: e.degree || "",
                field: e.field || "",
                startDate: e.startDate || "",
                endDate: e.endDate || "",
                gpa: e.gpa || "",
                visible: e.visible !== false,
              })),
              organisations: (tc.organisations || []).map((o: any, i: number) => ({
                id: o.id || `org_${i}_${Date.now()}`,
                name: o.name || "",
                position: o.position || "",
                startDate: o.startDate || "",
                endDate: o.endDate || "",
                description: o.description || "",
                isPresent: o.isPresent || false,
                visible: o.visible !== false,
              })),
              skills: (tc.skills || []).map((s: any, i: number) => ({
                id: s.id || `sk_${i}_${Date.now()}`,
                name: s.name || "",
                level: s.level || "intermediate",
                category: s.category || "technical",
              })),
              certifications: (tc.certifications || []).map((c: any, i: number) => ({
                id: c.id || `cert_${i}_${Date.now()}`,
                name: c.name || "",
                issuer: c.issuer || "",
                year: c.year || "",
              })),
            };
            setCvData(merged);
          } else {
            setCvData({ ...emptyCvData, ...tc });
          }
        } else {
          setCvData({ ...emptyCvData });
        }
        if (data.templateId) setSelectedTemplateId(data.templateId);
        else setSelectedTemplateId("industrial-pro");
      })
      .catch((err) => {
        setFetchError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [cvId]);

  return {
    cvData,
    isLoading,
    fetchError,
    selectedTemplateId,
    setCvData,
    setSelectedTemplateId,
    setFetchError,
  };
}
