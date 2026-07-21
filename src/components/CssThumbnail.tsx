"use client";

import { TEMPLATE_STYLES, type TemplateStyle } from "@/components/cv-templates/index";

/* ── Per-template visual configs ── */
const THUMBNAIL_CONFIGS: Record<string, {
  headerBg: string | null;
  headerHeight: string;
  sectionCount: number;
  hasColorAccent: boolean;
  layoutHint: "centered" | "left" | "bold-header";
}> = {
  "industrial-pro": {
    headerBg: null,
    headerHeight: "18%",
    sectionCount: 4,
    hasColorAccent: false,
    layoutHint: "bold-header",
  },
  "clean-slate": {
    headerBg: null,
    headerHeight: "15%",
    sectionCount: 4,
    hasColorAccent: false,
    layoutHint: "left",
  },
  "executive-serif": {
    headerBg: null,
    headerHeight: "20%",
    sectionCount: 4,
    hasColorAccent: false,
    layoutHint: "centered",
  },
  "fresh-graduate": {
    headerBg: null,
    headerHeight: "16%",
    sectionCount: 5,
    hasColorAccent: true,
    layoutHint: "left",
  },
  "compact-pro": {
    headerBg: null,
    headerHeight: "14%",
    sectionCount: 5,
    hasColorAccent: false,
    layoutHint: "left",
  },
};

interface CssThumbnailProps {
  templateId: string;
  className?: string;
}

export default function CssThumbnail({ templateId, className = "" }: CssThumbnailProps) {
  const style = TEMPLATE_STYLES[templateId] ?? TEMPLATE_STYLES["industrial-pro"];
  const config = THUMBNAIL_CONFIGS[templateId] ?? THUMBNAIL_CONFIGS["industrial-pro"];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg bg-white ${className}`}
      style={{ aspectRatio: "210 / 297", fontFamily: style.bodyFont }}
    >
      {/* Header area */}
      <div
        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center"
        style={{
          height: config.headerHeight,
          backgroundColor: config.headerBg || "transparent",
          color: style.headerText,
        }}
      >
        {/* Name */}
        <div
          className="rounded"
          style={{
            height: "14%",
            width: "40%",
            backgroundColor: style.headerText,
            opacity: 0.9,
            borderRadius: 2,
          }}
        />
        {/* Contact line */}
        <div
          className="mt-1 rounded"
          style={{
            height: "6%",
            width: "55%",
            backgroundColor: style.headerText,
            opacity: 0.3,
            borderRadius: 1,
          }}
        />
      </div>

      {/* Content area */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{ top: config.headerHeight }}
      >
        {/* Sections */}
        {Array.from({ length: config.sectionCount }).map((_, i) => (
          <div
            key={i}
            className="px-[8%] mb-[3%]"
          >
            {/* Section title */}
            <div
              className="mb-[2%] rounded"
              style={{
                height: "5%",
                width: `${30 + i * 5}%`,
                backgroundColor: config.hasColorAccent && i === 0 ? style.primary : style.sectionTitle,
                opacity: 0.8,
                borderRadius: 1,
              }}
            />
            {/* Content lines */}
            {Array.from({ length: 2 + (i % 2) }).map((_, j) => (
              <div
                key={j}
                className="mb-[1.5%] rounded"
                style={{
                  height: "3.5%",
                  width: `${85 - j * (10 + i * 3)}%`,
                  backgroundColor: style.headerText,
                  opacity: 0.2 + (j * 0.05),
                  borderRadius: 1,
                }}
              />
            ))}
            {/* Divider line */}
            {i < config.sectionCount - 1 && (
              <div
                className="my-[2%] rounded"
                style={{
                  height: 1,
                  width: "100%",
                  backgroundColor: style.sectionTitle,
                  opacity: 0.15,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
