"use client";

import { useState, useRef, useEffect } from "react";

interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  /** If true, shows "Sampai Sekarang" checkbox */
  showPresent?: boolean;
  isPresent?: boolean;
  onPresentChange?: (present: boolean) => void;
}

export default function DateField({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  label,
  showPresent = false,
  isPresent = false,
  onPresentChange,
}: DateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (value) {
      const parts = value.split("/");
      if (parts.length === 2) {
        return { month: parseInt(parts[0]), year: parseInt(parts[1]) };
      }
    }
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPicker]);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];

  const handleSelect = (month: number, year: number) => {
    onChange(`${String(month).padStart(2, "0")}/${year}`);
    setShowPicker(false);
  };

  const prevYear = () => setSelectedMonth(m => ({ ...m, year: m.year - 1 }));
  const nextYear = () => setSelectedMonth(m => ({ ...m, year: m.year + 1 }));

  const inputClass = "w-full px-3 py-2 rounded-lg border text-sm bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all cursor-pointer";

  return (
    <div className="relative">
      {label && <label className="block text-[11px] font-medium text-on-surface-variant mb-1">{label}</label>}

      {showPresent && isPresent ? (
        <div
          className={inputClass + " flex items-center text-on-surface-variant"}
          style={{ cursor: "default" }}
        >
          Sekarang
        </div>
      ) : (
        <div
          className={inputClass + " flex items-center justify-between"}
          onClick={() => setShowPicker(!showPicker)}
        >
          <span style={{ color: value ? "inherit" : "var(--p-text-secondary, #5c5a63)" }}>
            {value || placeholder}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-on-surface-variant">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
      )}

      {/* Date Picker Dropdown */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute z-50 mt-1 p-3 rounded-xl shadow-xl border"
          style={{
            background: "var(--p-bg-secondary, #fff)",
            borderColor: "var(--p-border, rgba(0,0,0,0.1))",
            minWidth: 240,
          }}
        >
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevYear} className="p-1 rounded hover:bg-surface-container-low transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <span className="text-sm font-semibold">{selectedMonth.year}</span>
            <button onClick={nextYear} className="p-1 rounded hover:bg-surface-container-low transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {months.map((m, i) => {
              const monthNum = i + 1;
              const isSelected = value === `${String(monthNum).padStart(2, "0")}/${selectedMonth.year}`;
              return (
                <button
                  key={m}
                  onClick={() => handleSelect(monthNum, selectedMonth.year)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-on-primary"
                      : "hover:bg-surface-container-low text-on-surface"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sampai Sekarang Toggle */}
      {showPresent && onPresentChange && (
        <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={isPresent}
            onChange={e => {
              onPresentChange(e.target.checked);
              if (e.target.checked) onChange("");
            }}
            className="w-3.5 h-3.5 rounded border-outline-variant text-primary focus:ring-primary/30"
          />
          <span className="text-[11px] text-on-surface-variant group-hover:text-on-surface transition-colors">
            Sampai Sekarang
          </span>
        </label>
      )}
    </div>
  );
}
