"use client";

import { useCallback } from "react";
import { AIPolishButton } from "@/components/ai/AIPolishDialog";

/* ───────── Field Component ───────── */

interface FieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  /** Enable AI Polish button for text fields */
  enableAiPolish?: boolean;
  /** Field name for AI Polish context */
  fieldName?: string;
  /** CV Context for smarter polish */
  jobTitle?: string;
  skills?: string[];
  jobDescription?: string;
}

export function Field({
  label,
  type = "text",
  value,
  onChange,
  disabled,
  required,
  placeholder,
  enableAiPolish = false,
  fieldName,
  jobTitle,
  skills,
  jobDescription,
}: FieldProps) {
  const isEmpty = required && !value;
  const isFilled = !!value && !disabled;

  // Handle AI Polish apply
  const handlePolishApply = useCallback(
    (polishedContent: string) => {
      onChange(polishedContent);
    },
    [onChange]
  );

  return (
    <div>
      <label className="block text-label-bold text-on-surface mb-1.5">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary text-body-md disabled:opacity-50 disabled:cursor-not-allowed transition-shadow duration-200 ${
            isEmpty ? "ring-2 ring-red-300 bg-red-50" : ""
          } ${enableAiPolish && !disabled ? "pr-10" : ""}`}
        />
        
        {/* AI Polish Button — inline, one-click */}
        {enableAiPolish && !disabled && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            <AIPolishButton
              content={value}
              onApply={handlePolishApply}
              jobTitle={jobTitle}
              skills={skills}
              jobDescription={jobDescription}
              field={fieldName || label}
              size="sm"
            />
          </span>
        )}

        {/* Filled checkmark */}
        {isFilled && required && !enableAiPolish && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              check_circle
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
