"use client";

import { useCallback } from "react";
import type {
  CvData,
  WorkEntry,
  EducationEntry,
  OrganizationEntry,
  SkillEntry,
  CertificationEntry,
  CustomSectionEntry,
  SectionKey,
} from "@/components/cv-templates";

/* ───────── Builder CRUD Helpers ───────── */

interface UseBuilderHelpersProps {
  setCvData: React.Dispatch<React.SetStateAction<CvData>>;
  setCustomSections: React.Dispatch<React.SetStateAction<CustomSectionEntry[]>>;
  setSectionOrder: React.Dispatch<React.SetStateAction<(SectionKey | string)[]>>;
}

export function useBuilderHelpers({
  setCvData,
  setCustomSections,
  setSectionOrder,
}: UseBuilderHelpersProps) {
  /* ── Generic field updater ── */
  const updateField = useCallback(
    <K extends keyof CvData>(key: K, value: CvData[K]) => {
      setCvData((prev) => ({ ...prev, [key]: value }));
    },
    [setCvData],
  );

  /* ── Work History ── */
  const addWork = useCallback(() => {
    const entry: WorkEntry = {
      id: "work_" + Date.now(),
      position: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    setCvData((prev) => ({
      ...prev,
      workHistory: [...prev.workHistory, entry],
    }));
  }, [setCvData]);

  const updateWork = useCallback(
    (index: number, field: keyof WorkEntry, value: string) => {
      setCvData((prev) => {
        const arr = [...prev.workHistory];
        arr[index] = { ...arr[index], [field]: value };
        return { ...prev, workHistory: arr };
      });
    },
    [setCvData],
  );

  const removeWork = useCallback(
    (index: number) => {
      setCvData((prev) => ({
        ...prev,
        workHistory: prev.workHistory.filter((_, i) => i !== index),
      }));
    },
    [setCvData],
  );

  const moveWorkUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      setCvData((prev) => {
        const arr = [...prev.workHistory];
        [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
        return { ...prev, workHistory: arr };
      });
    },
    [setCvData],
  );

  const moveWorkDown = useCallback(
    (index: number) => {
      setCvData((prev) => {
        if (index >= prev.workHistory.length - 1) return prev;
        const arr = [...prev.workHistory];
        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
        return { ...prev, workHistory: arr };
      });
    },
    [setCvData],
  );

  const toggleWorkVisible = useCallback(
    (index: number) => {
      setCvData((prev) => {
        const arr = [...prev.workHistory];
        arr[index] = { ...arr[index], visible: arr[index].visible === false ? true : false };
        return { ...prev, workHistory: arr };
      });
    },
    [setCvData],
  );

  /* ── Education ── */
  const addEducation = useCallback(() => {
    const entry: EducationEntry = {
      id: "edu_" + Date.now(),
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
    };
    setCvData((prev) => ({
      ...prev,
      education: [...prev.education, entry],
    }));
  }, [setCvData]);

  const updateEducation = useCallback(
    (index: number, field: keyof EducationEntry, value: string) => {
      setCvData((prev) => {
        const arr = [...prev.education];
        arr[index] = { ...arr[index], [field]: value };
        return { ...prev, education: arr };
      });
    },
    [setCvData],
  );

  const removeEducation = useCallback(
    (index: number) => {
      setCvData((prev) => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== index),
      }));
    },
    [setCvData],
  );

  const moveEduUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      setCvData((prev) => {
        const arr = [...prev.education];
        [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
        return { ...prev, education: arr };
      });
    },
    [setCvData],
  );

  const moveEduDown = useCallback(
    (index: number) => {
      setCvData((prev) => {
        if (index >= prev.education.length - 1) return prev;
        const arr = [...prev.education];
        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
        return { ...prev, education: arr };
      });
    },
    [setCvData],
  );

  const toggleEduVisible = useCallback(
    (index: number) => {
      setCvData((prev) => {
        const arr = [...prev.education];
        arr[index] = { ...arr[index], visible: arr[index].visible === false ? true : false };
        return { ...prev, education: arr };
      });
    },
    [setCvData],
  );

  /* ── Organizations ── */
  const addOrganization = useCallback(() => {
    const entry: OrganizationEntry = {
      id: "org_" + Date.now(),
      name: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
      isPresent: false,
    };
    setCvData((prev) => ({
      ...prev,
      organisations: [...prev.organisations, entry],
    }));
  }, [setCvData]);

  const updateOrganization = useCallback(
    (index: number, field: keyof OrganizationEntry, value: string) => {
      setCvData((prev) => {
        const arr = [...prev.organisations];
        arr[index] = { ...arr[index], [field]: value };
        return { ...prev, organisations: arr };
      });
    },
    [setCvData],
  );

  const removeOrganization = useCallback(
    (index: number) => {
      setCvData((prev) => ({
        ...prev,
        organisations: prev.organisations.filter((_, i) => i !== index),
      }));
    },
    [setCvData],
  );

  const moveOrgUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      setCvData((prev) => {
        const arr = [...prev.organisations];
        [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
        return { ...prev, organisations: arr };
      });
    },
    [setCvData],
  );

  const moveOrgDown = useCallback(
    (index: number) => {
      setCvData((prev) => {
        if (index >= prev.organisations.length - 1) return prev;
        const arr = [...prev.organisations];
        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
        return { ...prev, organisations: arr };
      });
    },
    [setCvData],
  );

  const toggleOrgVisible = useCallback(
    (index: number) => {
      setCvData((prev) => {
        const arr = [...prev.organisations];
        arr[index] = { ...arr[index], visible: arr[index].visible === false ? true : false };
        return { ...prev, organisations: arr };
      });
    },
    [setCvData],
  );

  /* ── Skills ── */
  const addSkill = useCallback(() => {
    const entry: SkillEntry = {
      id: "sk_" + Date.now(),
      name: "",
      level: "intermediate",
    };
    setCvData((prev) => ({
      ...prev,
      skills: [...prev.skills, entry],
    }));
  }, [setCvData]);

  const updateSkill = useCallback(
    (index: number, field: keyof SkillEntry, value: string) => {
      setCvData((prev) => {
        const arr = [...prev.skills];
        arr[index] = { ...arr[index], [field]: value };
        return { ...prev, skills: arr };
      });
    },
    [setCvData],
  );

  const removeSkill = useCallback(
    (index: number) => {
      setCvData((prev) => ({
        ...prev,
        skills: prev.skills.filter((_, i) => i !== index),
      }));
    },
    [setCvData],
  );

  /* ── Certifications ── */
  const addCertification = useCallback(() => {
    const entry: CertificationEntry = {
      id: "cert_" + Date.now(),
      name: "",
      issuer: "",
      year: "",
    };
    setCvData((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), entry],
    }));
  }, [setCvData]);

  const updateCertification = useCallback(
    (index: number, field: keyof CertificationEntry, value: string) => {
      setCvData((prev) => {
        const arr = [...(prev.certifications || [])];
        arr[index] = { ...arr[index], [field]: value };
        return { ...prev, certifications: arr };
      });
    },
    [setCvData],
  );

  const removeCertification = useCallback(
    (index: number) => {
      setCvData((prev) => ({
        ...prev,
        certifications: (prev.certifications || []).filter((_, i) => i !== index),
      }));
    },
    [setCvData],
  );

  /* ── Custom Sections (Lainnya) ── */
  const updateLainnyaContent = useCallback(
    (content: string) => {
      setCustomSections((prev) =>
        prev.map((cs) =>
          cs.id === "lainnya" ? { ...cs, content } as CustomSectionEntry : cs,
        ),
      );
    },
    [setCustomSections],
  );

  /* ── Section Order ── */
  const moveSectionUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      setSectionOrder((prev) => {
        const arr = [...prev];
        [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
        return arr;
      });
    },
    [setSectionOrder],
  );

  const moveSectionDown = useCallback(
    (index: number) => {
      setSectionOrder((prev) => {
        if (index >= prev.length - 1) return prev;
        const arr = [...prev];
        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
        return arr;
      });
    },
    [setSectionOrder],
  );

  /* ── Organization "is present" toggle ── */
  const setOrgPresent = useCallback(
    (idx: number, isPresent: boolean) => {
      setCvData((prev) => {
        const arr = [...prev.organisations];
        arr[idx] = { ...arr[idx], isPresent, endDate: isPresent ? "" : arr[idx].endDate };
        return { ...prev, organisations: arr };
      });
    },
    [setCvData],
  );

  /* ── Work description inline update ── */
  const updateWorkDescription = useCallback(
    (idx: number, text: string) => {
      setCvData((prev) => {
        const arr = [...prev.workHistory];
        arr[idx] = { ...arr[idx], description: text };
        return { ...prev, workHistory: arr };
      });
    },
    [setCvData],
  );

  /* ── Collapsed work IDs helper ── */
  const toggleWorkCollapse = useCallback(
    (id: string) => {
      return (prev: Set<string>) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      };
    },
    [],
  );

  return {
    // Generic
    updateField,
    // Work
    addWork, updateWork, removeWork, moveWorkUp, moveWorkDown, toggleWorkVisible,
    updateWorkDescription, toggleWorkCollapse,
    // Education
    addEducation, updateEducation, removeEducation, moveEduUp, moveEduDown, toggleEduVisible,
    // Organizations
    addOrganization, updateOrganization, removeOrganization, moveOrgUp, moveOrgDown, toggleOrgVisible,
    setOrgPresent,
    // Skills
    addSkill, updateSkill, removeSkill,
    // Certifications
    addCertification, updateCertification, removeCertification,
    // Custom Sections
    updateLainnyaContent,
    // Section Order
    moveSectionUp, moveSectionDown,
  };
}
