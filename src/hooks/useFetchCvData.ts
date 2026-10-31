"use client";

import { useState, useEffect } from "react";
import type { CvData } from "@/components/cv-templates";
import { EMPTY_CV_DATA, normalizeCvDocument } from "@/lib/cv-normalize";

interface UseFetchCvDataReturn {
  cvData: CvData;
  isLoading: boolean;
  fetchError: string | null;
  selectedTemplateId: string;
  /** updatedAt CV saat dimuat (ISO), dasar deteksi perubahan dari tab lain. */
  loadedUpdatedAt: string | null;
  setCvData: React.Dispatch<React.SetStateAction<CvData>>;
  setSelectedTemplateId: React.Dispatch<React.SetStateAction<string>>;
  setFetchError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useFetchCvData(cvId: string): UseFetchCvDataReturn {
  const [cvData, setCvData] = useState<CvData>(EMPTY_CV_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("industrial-pro");
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!cvId) return;

    // Batalkan request lama bila cvId berganti / komponen unmount, agar
    // respons yang terlambat tidak menimpa data CV yang sedang dibuka.
    const controller = new AbortController();
    setIsLoading(true);
    setFetchError(null);

    fetch(`/api/cv-documents/${cvId}`, { signal: controller.signal })
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
        if (controller.signal.aborted) return;
        setCvData(normalizeCvDocument(data));
        setSelectedTemplateId(data?.templateId || "industrial-pro");
        setLoadedUpdatedAt(typeof data?.updatedAt === "string" ? data.updatedAt : null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setFetchError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [cvId]);

  return {
    cvData,
    isLoading,
    fetchError,
    selectedTemplateId,
    loadedUpdatedAt,
    setCvData,
    setSelectedTemplateId,
    setFetchError,
  };
}
