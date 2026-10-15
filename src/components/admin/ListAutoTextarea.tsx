"use client";

/**
 * Textarea dengan perilaku daftar otomatis.
 *
 * Dipakai di form admin lowongan: mengetik `1.` lalu Enter membuat baris
 * berikutnya otomatis bernomor, dan Enter di baris penanda yang kosong
 * mengakhiri daftar. Logikanya ada di `lib/list-continuation` supaya bisa
 * diuji tanpa browser.
 */

import { useRef, type KeyboardEvent } from "react";
import { backspaceClearsListMarker, listContinuation } from "@/lib/list-continuation";

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  id?: string;
  "aria-label"?: string;
}

export default function ListAutoTextarea({
  value,
  onChange,
  className,
  rows = 5,
  maxLength,
  placeholder,
  id,
  "aria-label": ariaLabel,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    const caret = el.selectionStart ?? value.length;
    const before = value.slice(0, caret);

    if (event.key === "Enter" && !event.shiftKey) {
      const result = listContinuation(before);
      if (result.endsList) {
        event.preventDefault();
        // Penanda dihapus, sisa baris (mis. indentasi) dipertahankan supaya
        // keluar dari daftar tidak membuat teks melompat ke kolom nol.
        const lineStart = before.lastIndexOf("\n") + 1;
        const line = before.slice(lineStart);
        const indent = (line.match(/^\s*/) ?? [""])[0];
        const nextValue = before + (indent ? `\n${indent}` : "\n");
        onChange(nextValue);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = nextValue.length;
        });
        return;
      }
      if (result.insert) {
        event.preventDefault();
        const nextValue = before + result.insert + value.slice(caret);
        onChange(nextValue);
        const nextCaret = caret + result.insert.length + result.caretOffset;
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = nextCaret;
        });
      }
      return;
    }

    if (event.key === "Backspace" && caret === el.selectionEnd) {
      const lineStart = before.lastIndexOf("\n") + 1;
      // Penanda daftar dihapus utuh, jadi tidak ada sisa spasi yang tersembunyi.
      if (caret > lineStart && backspaceClearsListMarker(before)) {
        event.preventDefault();
        const nextValue = value.slice(0, lineStart) + value.slice(caret);
        onChange(nextValue);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = lineStart;
        });
      }
    }
  };

  return (
    <textarea
      id={id}
      ref={ref}
      aria-label={ariaLabel}
      className={className}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={handleKeyDown}
      rows={rows}
      maxLength={maxLength}
      placeholder={placeholder}
    />
  );
}