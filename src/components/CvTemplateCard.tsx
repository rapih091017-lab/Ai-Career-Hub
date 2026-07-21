"use client";

import { type CVTemplate } from "@/lib/templates";
import CssThumbnail from "@/components/CssThumbnail";

interface CvTemplateCardProps {
  template: CVTemplate;
  onClick?: () => void;
  compact?: boolean;
}

/**
 * CvTemplateCard — Mini preview CV template card.
 * Shows a miniature A4-like preview with the actual
 * AtsBaseRenderer rendering, scaled down to fit.
 */
export default function CvTemplateCard({ template, onClick, compact }: CvTemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-2xl"
    >
      <div
        className={`
          relative overflow-hidden rounded-2xl border-2 border-outline-variant/40
          bg-white transition-[transform,box-shadow,border-color] duration-300
          ${onClick ? "cursor-pointer hover:-translate-y-1.5 hover:shadow-xl hover:border-gray-400" : ""}
          ${compact ? "p-2" : "p-3"}
        `}
      >
        {/* Real Rendered Preview */}
        <div
          className={`
            relative mx-auto rounded-lg overflow-hidden bg-white
            ${compact ? "h-24 w-full" : "h-36 sm:h-44 w-full"}
          `}
        >
          <CssThumbnail templateId={template.id} />
        </div>

        {/* Template Info */}
        <div className="mt-2 sm:mt-3 px-0.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs sm:text-sm tracking-tight text-gray-900">
              {template.name}
            </h3>
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 border-gray-800 bg-gray-800/20" />
          </div>
          <p className="text-[10px] sm:text-xs text-on-surface-variant mt-0.5 line-clamp-1">
            {template.description}
          </p>
        </div>
      </div>
    </button>
  );
}
