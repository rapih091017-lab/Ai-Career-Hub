"use client";

import { useState, useEffect, useRef } from "react";
import type { CvData } from "@/components/cv-templates";

interface UseAutoSaveReturn {
  saveStatus: "idle" | "saving" | "saved" | "error";
  lastSaved: Date | null;
}

export function useAutoSave(cvId: string, cvData: CvData): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const prevCvData = useRef(cvData);

  useEffect(() => {
    if (!cvId || JSON.stringify(cvData) === JSON.stringify(prevCvData.current)) return;
    prevCvData.current = cvData;

    const timer = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/cv-documents/${cvId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tailoredContent: cvData }),
        });
        if (res.ok) {
          setSaveStatus("saved");
          setLastSaved(new Date());
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      }
      setTimeout(() => setSaveStatus((s) => (s === "saved" || s === "error" ? "idle" : s)), 2000);
    }, 2000);

    return () => clearTimeout(timer);
  }, [cvData, cvId]);

  return { saveStatus, lastSaved };
}
