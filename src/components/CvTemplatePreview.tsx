"use client";

import { AtsBaseRenderer, TEMPLATE_STYLES, type CvData } from "@/components/cv-templates/index";

/* ───────── dummy data for preview ───────── */

const DUMMY_CV_DATA: CvData = {
  fullName: "Budi Santoso",
  phone: "+62 812 3456 7890",
  email: "budi.santoso@email.com",
  address: "Jakarta, Indonesia",
  linkedin: "linkedin.com/in/budisantoso",
  summary:
    "Profesional berpengalaman di bidang pengembangan perangkat lunak dengan lebih dari 5 tahun pengalaman. Terampil dalam membangun aplikasi web modern menggunakan React, TypeScript, dan Node.js.",
  jobTitle: "Frontend Developer",
  jobDescription: "",
  workHistory: [
    {
      id: "dummy-w-1",
      position: "Senior Frontend Developer",
      company: "Tech Corp Indonesia",
      location: "Jakarta",
      startDate: "2021-01",
      endDate: "",
      isCurrent: true,
      description:
        "Memimpin tim frontend dalam pengembangan aplikasi web\nBerkolaborasi dengan tim desain untuk implementasi UI/UX\nMengoptimalkan performa aplikasi hingga 40%",
    },
    {
      id: "dummy-w-2",
      position: "Frontend Developer",
      company: "StartUp Digital",
      location: "Bandung",
      startDate: "2019-03",
      endDate: "2020-12",
      description:
        "Mengembangkan fitur-fitur baru menggunakan React\nMelakukan code review dan mentoring junior developer",
    },
  ],
  education: [
    {
      id: "dummy-e-1",
      institution: "Universitas Gadjah Mada",
      degree: "S.Kom.",
      field: "Ilmu Komputer",
      startDate: "2015",
      endDate: "2019",
    },
  ],
  organisations: [],
  skills: [
    { id: "dummy-s-1", name: "React", level: "advanced" },
    { id: "dummy-s-2", name: "TypeScript", level: "advanced" },
    { id: "dummy-s-3", name: "Node.js", level: "intermediate" },
    { id: "dummy-s-4", name: "Tailwind CSS", level: "advanced" },
    { id: "dummy-s-5", name: "PostgreSQL", level: "intermediate" },
  ],
};

/* ───────── component ───────── */

interface CvTemplatePreviewProps {
  /** Template style ID */
  templateId?: string;
}

/**
 * Renders a scaled-down preview of the ATS Profesional CV template
 * using the actual AtsBaseRenderer with dummy data.
 *
 * The preview container uses `transform: scale()` to shrink the
 * full-size render into a small card, preserving text layout fidelity.
 */
export default function CvTemplatePreview({ templateId = "industrial-pro" }: CvTemplatePreviewProps) {
  const style = TEMPLATE_STYLES[templateId] ?? TEMPLATE_STYLES["industrial-pro"];

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-white"
      style={{ aspectRatio: "210 / 297" /* A4 ratio */ }}
    >
      {/* Clipped container that shows only the top portion */}
      <div
        className="absolute top-0 left-0"
        style={{
          width: 400,
          height: 400,
          transform: "scale(0.35)",
          transformOrigin: "top left",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <AtsBaseRenderer data={DUMMY_CV_DATA} style={style} />
      </div>
    </div>
  );
}
