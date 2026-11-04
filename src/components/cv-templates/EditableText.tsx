"use client";

import { memo, useEffect, useLayoutEffect, useRef } from "react";
import type { CvEditTextProps } from "@/components/cv-templates";

/**
 * Teks CV yang bisa diedit langsung di pratinjau.
 *
 * - Isi tidak dikontrol React: textContent diset lewat ref hanya saat
 *   elemen tidak fokus, jadi render ulang (autosave, paginasi) tidak
 *   memindah caret dan node fokus tidak pernah di-remount.
 * - Commit ke cvData saat mengetik (debounce ringan) dan saat blur. Selama
 *   IME menyusun huruf (isComposing) tidak ada commit.
 * - Nilai kosong baru dikirim saat blur: kalau dikirim saat mengetik,
 *   bagian yang kosong hilang dari pratinjau bersama node yang sedang fokus.
 * - Enter = selesai (blur), Escape = batal ke nilai sebelum fokus.
 * - Paste selalu teks polos.
 */

const COMMIT_DELAY_MS = 150;

let plaintextOnly: boolean | null = null;
function supportsPlaintextOnly(): boolean {
  if (plaintextOnly === null) {
    try {
      const d = document.createElement("div");
      d.contentEditable = "plaintext-only";
      plaintextOnly = d.contentEditable === "plaintext-only";
    } catch {
      plaintextOnly = false;
    }
  }
  return plaintextOnly;
}

/** Teks satu baris: baris baru dari paste/IME diganti spasi. */
const readText = (el: HTMLElement) => (el.textContent ?? "").replace(/\r?\n/g, " ");

// Nilai sebelum sesi edit per path; bertahan saat fokus dipindah ke salinan di halaman lain.
const sessionStart = new Map<string, string>();
let transferring = false;

export const EditableText = memo(function EditableText({ path, value, placeholder, editable, onEdit, onSession, onConflict }: CvEditTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const focused = useRef(false);
  const composing = useRef(false);
  // Waktu compositionend terakhir: Safari mengirim keydown Enter (konfirmasi IME) sesudahnya.
  const composedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const valueRef = useRef(value);
  valueRef.current = value;
  // Nilai terakhir yang dikirim/diketahui komponen ini selama fokus. Nilai
  // lain yang datang saat fokus berarti diubah dari luar (form, undo, AI).
  const known = useRef(value);
  const external = useRef(false);

  // Sinkron dari data hanya saat tidak fokus.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!focused.current) {
      if (el.textContent !== value) el.textContent = value;
    } else if (value !== known.current) {
      external.current = true;
    } else {
      // Data baru dari ketikan sendiri: periksa apakah caret masih terlihat setelah reflow.
      scheduleCaretCheck();
    }
  }, [value, editable]);

  useEffect(() => {
    const el = ref.current;
    // Salinan di halaman 2+ tidak masuk urutan Tab; klik tetap bisa.
    if (el && el.closest("[data-cv-page]")?.getAttribute("data-cv-page") !== "1") el.tabIndex = -1;
    // Fallback contentEditable=true menerima Ctrl+B/I/U dan format lain; teks CV harus polos.
    const block = (e: InputEvent) => {
      if (e.inputType.startsWith("format") || e.inputType === "insertParagraph" || e.inputType === "insertFromDrop") e.preventDefault();
    };
    el?.addEventListener("beforeinput", block);
    return () => {
      clearTimeout(timer.current);
      el?.removeEventListener("beforeinput", block);
    };
    // editable: elemen edit baru dipasang saat mode edit aktif.
  }, [editable]);

  if (!editable) {
    return <span data-cv-path={path}>{value || placeholder}</span>;
  }

  const commit = (final: boolean) => {
    clearTimeout(timer.current);
    const el = ref.current;
    if (!el) return;
    // Data sudah diubah dari luar: teks lama di sini tidak boleh menimpanya.
    if (external.current) return;
    const text = readText(el);
    if (!final && !text.trim()) return;
    if (text !== valueRef.current) {
      known.current = text;
      onEdit(path, text);
    }
  };
  const schedule = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(false), COMMIT_DELAY_MS);
  };

  return (
    <span
      ref={ref}
      data-cv-path={path}
      data-cv-edit=""
      data-placeholder={placeholder}
      contentEditable={supportsPlaintextOnly() ? "plaintext-only" : true}
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-label={placeholder ? `Edit ${placeholder}` : "Edit teks"}
      onFocus={() => {
        focused.current = true;
        known.current = valueRef.current;
        external.current = false;
        if (!sessionStart.has(path)) sessionStart.set(path, valueRef.current);
      }}
      onBlur={() => {
        commit(true);
        focused.current = false;
        if (external.current) {
          // Pakai nilai baru dari luar; ketikan di pratinjau dibuang.
          external.current = false;
          if (!transferring) sessionStart.delete(path);
          const el = ref.current;
          if (el) el.textContent = valueRef.current;
          if (!transferring) onConflict?.(path);
          return;
        }
        if (transferring) return;
        const before = sessionStart.get(path);
        sessionStart.delete(path);
        const el = ref.current;
        if (el) {
          const after = readText(el);
          if (before !== undefined && before !== after) onSession(path, before, after);
          // Setelah blur, tampilkan nilai yang tersimpan (mis. paste yang dirapikan).
          if (el.textContent !== after) el.textContent = after;
        }
      }}
      onInput={(e) => {
        if (composing.current || (e.nativeEvent as InputEvent).isComposing) return;
        schedule();
      }}
      onCompositionStart={() => {
        composing.current = true;
        clearTimeout(timer.current);
      }}
      onCompositionEnd={() => {
        composing.current = false;
        composedAt.current = performance.now();
        schedule();
      }}
      onKeyDown={(e) => {
        // keyCode 229 = tombol diproses IME; Enter < 1 frame setelah compositionend = konfirmasi IME (Safari).
        if (e.nativeEvent.isComposing || composing.current || e.keyCode === 229) return;
        if (e.key === "Enter" && performance.now() - composedAt.current < 20) {
          e.preventDefault();
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          ref.current?.blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          const el = ref.current;
          const before = sessionStart.get(path) ?? valueRef.current;
          if (el) el.textContent = before;
          clearTimeout(timer.current);
          if (before !== valueRef.current) onEdit(path, before);
          el?.blur();
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain").replace(/\s*\r?\n\s*/g, " ");
        // execCommand menjaga riwayat undo bawaan contentEditable.
        if (!document.execCommand("insertText", false, text)) {
          const sel = window.getSelection();
          if (!sel?.rangeCount) return;
          const r = sel.getRangeAt(0);
          r.deleteContents();
          r.insertNode(document.createTextNode(text));
          r.collapse(false);
          schedule();
        }
      }}
      onDrop={(e) => e.preventDefault()}
    />
  );
});

/* ───────── Caret tetap terlihat saat paginasi berubah ───────── */

/** Kotak terlihat halaman tempat elemen berada (area konten yang memotong kolom lain). */
function clipBox(el: HTMLElement): DOMRect | null {
  const page = el.closest<HTMLElement>("[data-cv-page]");
  const clip = page?.firstElementChild as HTMLElement | null;
  return clip ? clip.getBoundingClientRect() : null;
}

function caretOffset(el: HTMLElement): number | null {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return null;
  const r = sel.getRangeAt(0);
  if (!el.contains(r.endContainer)) return null;
  const pre = document.createRange();
  pre.selectNodeContents(el);
  pre.setEnd(r.endContainer, r.endOffset);
  return pre.toString().length;
}

function rangeAt(el: HTMLElement, offset: number): Range | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let left = offset;
  let node = walker.nextNode() as Text | null;
  while (node) {
    if (left <= node.length) {
      const r = document.createRange();
      r.setStart(node, left);
      r.collapse(true);
      return r;
    }
    left -= node.length;
    node = walker.nextNode() as Text | null;
  }
  return null;
}

function caretVisible(el: HTMLElement, offset: number): boolean {
  const box = clipBox(el);
  if (!box) return true;
  const r = rangeAt(el, offset);
  const rects = r?.getClientRects();
  const rect = rects && rects.length ? rects[0] : el.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  return rect.left >= box.left - 1 && rect.left <= box.right + 1 && midY >= box.top && midY <= box.bottom;
}

let caretFrame = 0;
/** Satu rAF untuk semua pemicu (commit ketikan, jumlah halaman berubah) per frame. */
export function scheduleCaretCheck() {
  if (caretFrame) return;
  caretFrame = requestAnimationFrame(() => {
    caretFrame = 0;
    keepCaretVisible();
  });
}

/**
 * Bila teks yang sedang diketik mengalir ke halaman lain, caret di salinan
 * yang fokus jadi terpotong. Fokus dipindah ke salinan di halaman tempat
 * caret itu sekarang terlihat, dengan posisi caret yang sama.
 */
export function keepCaretVisible() {
  const el = document.activeElement as HTMLElement | null;
  if (!el || !el.hasAttribute("data-cv-edit")) return;
  const offset = caretOffset(el);
  // Kasus umum (caret terlihat) selesai di sini tanpa mencari salinan di DOM.
  if (offset === null || caretVisible(el, offset)) return;
  const path = el.getAttribute("data-cv-path") ?? "";
  const copies = document.querySelectorAll<HTMLElement>(`[data-cv-edit][data-cv-path="${CSS.escape(path)}"]`);
  const text = el.textContent ?? "";
  for (const copy of copies) {
    if (copy === el) continue;
    if (copy.textContent !== text) copy.textContent = text;
    if (!caretVisible(copy, offset)) continue;
    transferring = true;
    try {
      copy.focus({ preventScroll: true });
      // Gulir pratinjau (bukan kotak halaman, yang overflow: clip) ke salinan yang kini fokus.
      copy.scrollIntoView({ block: "nearest" });
      const r = rangeAt(copy, offset);
      const sel = window.getSelection();
      if (r && sel) {
        sel.removeAllRanges();
        sel.addRange(r);
      }
    } finally {
      transferring = false;
    }
    return;
  }
}
