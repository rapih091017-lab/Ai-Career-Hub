"use client";

/**
 * Kolom isi artikel dengan toolbar format dan penomoran otomatis.
 *
 * Isi artikel disimpan sebagai teks biasa dengan penanda ringan (`**tebal**`,
 * `1. `, `- `, `@center`), bukan HTML. Alasannya tidak menyimpan HTML: setiap
 * baris baru berarti harus disanitasi, dan satu kesalahan sanitasi adalah
 * celah XSS.
 *
 * Penomoran otomatis memakai helper yang sama dengan form lowongan, jadi
 * mengetik `1.` lalu Enter langsung melanjutkan ke `2.`.
 */

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { backspaceClearsListMarker, listContinuation } from "@/lib/list-continuation";

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  rows?: number;
  maxLength?: number;
}

type ToolbarAction =
  | "bold"
  | "h2"
  | "numbered"
  | "bullet"
  | "quote"
  | "align-left"
  | "align-center"
  | "align-right";

export default function ArticleEditor({ value, onChange, className, rows = 16, maxLength }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [hint, setHint] = useState<string | null>(null);
  // Posisi kursor yang harus dikembalikan setelah React menggambar ulang.
  // Tanpa ini, setiap kali nilai berubah React memindahkan kursor ke akhir,
  // sehingga teks terasa melompat ke bawah dan选 pilihan hilang saat toolbar
  // dipakai.
  const pendingCaret = useRef<{ start: number; end: number } | null>(null);

  const showHint = (message: string) => {
    setHint(message);
    window.setTimeout(() => setHint(null), 2600);
  };

  /**
   * Terapkan posisi kursor yang tersimpan.
   *
   * Harus lewat useLayoutEffect, bukan langsung setelah onChange: saat itu
   * textarea masih berisi teks lama, jadi penanda dan nomor ditulis ke posisi
   * yang salah. Efeknya kursor melompat dan penomoran terasa rusak.
   */
  useLayoutEffect(() => {
    const target = pendingCaret.current;
    if (!target || !ref.current) return;
    pendingCaret.current = null;
    ref.current.focus();
    ref.current.setSelectionRange(target.start, target.end);
  }, [value]);

  /** Bungkus pilihan saat ini dengan penanda, atau sisipkan penanda. */
  const wrap = (before: string, after: string, placeholder: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next = selected
      ? `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`
      : `${value.slice(0, start)}${before}${placeholder}${after}${value.slice(end)}`;
    onChange(next);
    // Kursor diletakkan di dalam penanda supaya bisa langsung mengetik.
    const caret = selected ? start + before.length + selected.length + after.length : start + before.length;
    pendingCaret.current = { start: caret, end: caret };
  };

  /** Ubah penanda awal baris saat ini, mis."Rrata tengah". */
  const toggleLinePrefix = (prefix: string, label: string) => {
    const el = ref.current;
    if (!el) return;
    const caret = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", caret - 1) + 1;
    const lineEndIndex = value.indexOf("\n", caret);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
    const line = value.slice(lineStart, lineEnd);
    const withoutPrefix = line.replace(/^(@center|@right)\s*/i, "");
    const nextLine = withoutPrefix.toLowerCase().startsWith(prefix.toLowerCase())
      ? withoutPrefix
      : `${prefix}${withoutPrefix}`;
    const next = value.slice(0, lineStart) + nextLine + value.slice(lineEnd);
    onChange(next);
    const caretOffset = nextLine.length - line.length;
    pendingCaret.current = { start: caret + caretOffset, end: caret + caretOffset };
    showHint(`${label} untuk baris ini`);
  };

  /** Ubah satu baris menjadi daftar bernomor atau bullet. */
  const toList = (kind: "ordered" | "bullet") => {
    const el = ref.current;
    if (!el) return;
    const caret = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", caret - 1) + 1;
    const lineEndIndex = value.indexOf("\n", caret);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
    const lines = value.slice(lineStart, lineEnd).split("\n");
    const marked = lines.map((line, index) => {
      const clean = line.replace(/^\s*(\d{1,3}[.)]|[-*•])\s+/, "");
      return kind === "ordered" ? `${index + 1}. ${clean}` : `- ${clean}`;
    });
    const next = value.slice(0, lineStart) + marked.join("\n") + value.slice(lineEnd);
    onChange(next);
    const endOfList = lineStart + marked.join("\n").length;
    pendingCaret.current = { start: endOfList, end: endOfList };
    showHint(kind === "ordered" ? "Daftar bernomor dimulai" : "Daftar bullet dimulai");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    const caret = el.selectionStart ?? value.length;
    const before = value.slice(0, caret);

    if (event.key === "Enter" && !event.shiftKey) {
      const result = listContinuation(before);
      if (result.endsList) {
        event.preventDefault();
        const lineStart = before.lastIndexOf("\n") + 1;
        const indent = (before.slice(lineStart).match(/^\s*/) ?? [""])[0];
        const next = before + (indent ? `\n${indent}` : "\n");
        onChange(next);
        pendingCaret.current = { start: next.length, end: next.length };
        return;
      }
      if (result.insert) {
        event.preventDefault();
        const next = before + result.insert + value.slice(caret);
        onChange(next);
        const nextCaret = caret + result.insert.length + result.caretOffset;
        pendingCaret.current = { start: nextCaret, end: nextCaret };
      }
      return;
    }

    if (event.key === "Backspace" && caret === el.selectionEnd) {
      const lineStart = before.lastIndexOf("\n") + 1;
      if (caret > lineStart && backspaceClearsListMarker(before)) {
        event.preventDefault();
        const next = value.slice(0, lineStart) + value.slice(caret);
        onChange(next);
        pendingCaret.current = { start: lineStart, end: lineStart };
      }
    }
  };

  const buttons: { action: ToolbarAction; icon: string; label: string }[] = [
    { action: "bold", icon: "format_bold", label: "Tebalkan (pilihan teks)" },
    { action: "h2", icon: "title", label: "Jadikan judul (##)" },
    { action: "numbered", icon: "format_list_numbered", label: "Daftar bernomor (1. 2. 3.)" },
    { action: "bullet", icon: "format_list_bulleted", label: "Daftar bullet (-)" },
    { action: "quote", icon: "format_quote", label: "Kutipan (>)" },
    { action: "align-left", icon: "format_align_left", label: "Rata kiri" },
    { action: "align-center", icon: "format_align_center", label: "Rata tengah" },
    { action: "align-right", icon: "format_align_right", label: "Rata kanan" },
  ];

  const run = (action: ToolbarAction) => {
    switch (action) {
      case "bold":
        return wrap("**", "**", "teks tebal");
      case "h2":
        return wrap("## ", "", "Judul bagian");
      case "quote":
        return wrap("> ", "", "Kutipan");
      case "numbered":
        return toList("ordered");
      case "bullet":
        return toList("bullet");
      case "align-left":
        return toggleLinePrefix("", "Rata kiri");
      case "align-center":
        return toggleLinePrefix("@center ", "Rata tengah");
      case "align-right":
        return toggleLinePrefix("@right ", "Rata kanan");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-outline-variant/50 bg-surface-container-low p-1">
        {buttons.map((button) => (
          <button
            key={button.action}
            type="button"
            title={button.label}
            aria-label={button.label}
            onClick={() => run(button.action)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-lowest hover:text-primary"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              {button.icon}
            </span>
          </button>
        ))}
        {hint && <span className="ml-2 text-xs text-primary">{hint}</span>}
      </div>
      <textarea
        ref={ref}
        aria-label="Isi artikel"
        className={className}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={rows}
        maxLength={maxLength}
      />
      <p className="text-xs text-on-surface-variant">
        Ketik <code className="rounded bg-surface-container px-1">1.</code> lalu Enter untuk daftar
        bernomor otomatis. Tanda <code className="rounded bg-surface-container px-1">**teks**</code>{" "}
        membuat tebal, <code className="rounded bg-surface-container px-1">## </code> membuat judul.
      </p>
    </div>
  );
}