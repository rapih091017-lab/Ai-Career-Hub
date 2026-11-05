"use client";

import { memo, useRef, useState } from "react";
import type { CvEditDateProps } from "@/components/cv-templates";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Tanggal di pratinjau: klik → input bulan kecil di tempat. Nilai dikomit
 * saat blur/Enter (bukan tiap perubahan) supaya pratinjau tidak dirender
 * ulang selama memilih. Escape = batal. Tanpa perubahan, data tidak disentuh
 * (nilai lama non-"YYYY-MM" tidak ikut terhapus).
 */
export const EditableDate = memo(function EditableDate({ path, value, display, onEdit, onSession }: CvEditDateProps) {
  const [open, setOpen] = useState(false);
  const initial = useRef("");
  const cancelled = useRef(false);

  if (!open) {
    return (
      <span
        data-cv-edit=""
        data-cv-date={path}
        role="button"
        tabIndex={0}
        aria-label={`Ubah tanggal ${display}`}
        title="Klik untuk ubah tanggal"
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          initial.current = MONTH_RE.test(value) ? value : "";
          cancelled.current = false;
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          e.stopPropagation();
          initial.current = MONTH_RE.test(value) ? value : "";
          cancelled.current = false;
          setOpen(true);
        }}
      >
        {display}
      </span>
    );
  }

  return (
    <input
      type="month"
      data-cv-edit=""
      data-cv-date={path}
      aria-label="Ubah tanggal"
      autoFocus
      defaultValue={initial.current}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancelled.current = true;
          e.currentTarget.blur();
        }
      }}
      onBlur={(e) => {
        const next = e.currentTarget.value;
        setOpen(false);
        if (cancelled.current || next === initial.current) return;
        if (next !== "" && !MONTH_RE.test(next)) return;
        onEdit(path, next);
        onSession(path, value, next);
      }}
      style={{ font: "inherit", fontSize: "inherit", width: "9em", padding: 0, margin: 0, border: "1px solid #9ca3af", borderRadius: 2, background: "#fff", color: "inherit" }}
    />
  );
});
