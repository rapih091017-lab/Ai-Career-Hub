"use client";

import { memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { newId } from "@/lib/id";
import {
  linesFromValue,
  mergeWithPrevious,
  moveLine,
  pasteAt,
  removeLine,
  shouldSplitPaste,
  splitAt,
  valueFromLines,
} from "@/lib/bullet-editor-ops";
import { joinAsParagraph, splitSentences } from "@/lib/bullet-lines";

export type BulletMode = "bullets" | "paragraph";

interface BulletEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Mode tampilan; default "bullets" (perilaku lama). */
  mode?: BulletMode;
  /** Tanpa handler, toggle Poin/Paragraf tidak ditampilkan. */
  onModeChange?: (mode: BulletMode) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  /** Slot di kanan judul (mis. tombol Poles AI). */
  headerAction?: React.ReactNode;
}

interface Focus {
  index: number;
  caret: number;
}

const ICON_BTN =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30 disabled:hover:bg-transparent sm:h-8 sm:w-8";

function fitHeight(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

/** Textarea satu poin; tingginya mengikuti isi. */
function AutoTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { inputRef?: (el: HTMLTextAreaElement | null) => void }) {
  const { inputRef, ...rest } = props;
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) fitHeight(el);
  }, [rest.value]);
  // Lebar berubah (tombol muncul saat fokus, layar diputar): hitung ulang tinggi.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let lastWidth = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === lastWidth) return;
      lastWidth = el.clientWidth;
      fitHeight(el);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <textarea
      {...rest}
      rows={1}
      ref={(el) => {
        ref.current = el;
        inputRef?.(el);
      }}
    />
  );
}

interface RowProps {
  id: string;
  index: number;
  total: number;
  text: string;
  disabled?: boolean;
  placeholder?: string;
  // Handler stabil milik editor; posisi poin dibaca dari data-index elemen.
  registerInput: (id: string, el: HTMLTextAreaElement | null) => void;
  onText: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onMoveClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onRemoveClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const BulletRow = memo(function BulletRow({ id, index, total, text, disabled, placeholder, registerInput, onText, onKeyDown, onPaste, onMoveClick, onRemoveClick }: RowProps) {
  const inputRef = useCallback((el: HTMLTextAreaElement | null) => registerInput(id, el), [id, registerInput]);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const n = index + 1;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-start gap-1 rounded-lg ${isDragging ? "relative z-10 bg-surface-container shadow-soft" : ""}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Seret poin ${n}`}
        aria-roledescription="poin yang bisa diurutkan"
        disabled={disabled}
        className={`${ICON_BTN} cursor-grab touch-none active:cursor-grabbing`}
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">drag_indicator</span>
      </button>
      <span aria-hidden="true" className="mt-[11px] select-none text-on-surface-variant sm:mt-[5px]">•</span>
      <AutoTextarea
        inputRef={inputRef}
        data-index={index}
        value={text}
        disabled={disabled}
        placeholder={index === 0 ? placeholder : undefined}
        aria-label={`Poin ${n} dari ${total}`}
        onChange={onText}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        className="min-h-11 min-w-0 flex-1 resize-none overflow-hidden rounded-lg border-none bg-transparent px-2 py-2.5 text-body-md leading-snug focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary sm:min-h-8 sm:py-1"
      />
      <div className="hidden shrink-0 items-start group-focus-within:flex sm:flex">
        <button type="button" className={ICON_BTN} aria-label={`Naikkan poin ${n}`} disabled={disabled || index === 0} data-index={index} data-to={index - 1} onClick={onMoveClick}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_upward</span>
        </button>
        <button type="button" className={ICON_BTN} aria-label={`Turunkan poin ${n}`} disabled={disabled || index === total - 1} data-index={index} data-to={index + 1} onClick={onMoveClick}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_downward</span>
        </button>
      </div>
      <button type="button" className={`${ICON_BTN} hover:text-error`} aria-label={`Hapus poin ${n}`} disabled={disabled} data-index={index} onClick={onRemoveClick}>
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
      </button>
    </li>
  );
});

/**
 * Editor field poin: satu input per poin. Nilai tetap disimpan sebagai teks
 * satu baris per poin, jadi kompatibel dengan data lama dan renderer CV.
 */
export function BulletEditor({
  label,
  value,
  onChange,
  mode = "bullets",
  onModeChange,
  placeholder,
  maxLength,
  disabled,
  headerAction,
}: BulletEditorProps) {
  const labelId = useId();
  const [lines, setLines] = useState<string[]>(() => linesFromValue(value));
  const [ids, setIds] = useState<string[]>(() => linesFromValue(value).map(() => newId("pt")));
  const lastEmitted = useRef(value);
  const inputs = useRef(new Map<string, HTMLTextAreaElement>());
  const pendingFocus = useRef<Focus | null>(null);
  const [status, setStatus] = useState("");
  // Tawaran/urungkan setelah ganti mode, supaya user tidak mengira teks hilang.
  const [notice, setNotice] = useState<
    | { kind: "split"; count: number }
    | { kind: "undo"; message: string; value: string; mode: BulletMode }
    | null
  >(null);
  // Konversi terakhir Poin → Paragraf; kembali ke Poin tanpa edit memulihkan teks persis.
  const lastJoin = useRef<{ before: string; after: string } | null>(null);

  const changeMode = (next: BulletMode) => {
    if (!onModeChange || next === mode) return;
    if (next === "paragraph") {
      const joined = joinAsParagraph(value);
      lastJoin.current = { before: value, after: joined };
      if (joined !== value) {
        onChange(joined);
        setNotice({ kind: "undo", message: "Poin digabung jadi satu paragraf.", value, mode: "bullets" });
      } else setNotice(null);
      onModeChange("paragraph");
      return;
    }
    const j = lastJoin.current;
    if (j && j.after === value) {
      onChange(j.before);
      setNotice(null);
    } else {
      const count = splitSentences(value).length;
      setNotice(count > linesFromValue(value).filter((l) => l.trim()).length ? { kind: "split", count } : null);
    }
    lastJoin.current = null;
    onModeChange("bullets");
  };

  const splitPerSentence = () => {
    const before = value;
    onChange(splitSentences(value).join("\n"));
    setNotice({ kind: "undo", message: "Paragraf dipecah per kalimat.", value: before, mode: "bullets" });
  };

  const undoNotice = () => {
    if (notice?.kind !== "undo") return;
    onChange(notice.value);
    if (notice.mode !== mode) onModeChange?.(notice.mode);
    setNotice(null);
  };

  // Nilai berubah dari luar (Saran AI, impor, undo): susun ulang daftar poin.
  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    const next = linesFromValue(value);
    setLines(next);
    setIds(next.map(() => newId("pt")));
  }, [value]);

  useLayoutEffect(() => {
    const f = pendingFocus.current;
    if (!f) return;
    pendingFocus.current = null;
    const el = inputs.current.get(ids[f.index]);
    if (el) {
      el.focus();
      el.setSelectionRange(f.caret, f.caret);
    }
  });

  const commit = useCallback(
    (nextLines: string[], nextIds: string[], focus?: Focus) => {
      const nextValue = valueFromLines(nextLines);
      // Tolak perubahan yang menambah panjang melewati batas.
      if (maxLength != null && nextValue.length > maxLength && nextValue.length > lastEmitted.current.length) {
        setStatus(`Batas ${maxLength} karakter tercapai.`);
        return;
      }
      setLines(nextLines);
      setIds(nextIds);
      setNotice(null);
      if (focus) pendingFocus.current = focus;
      if (nextValue !== lastEmitted.current) {
        lastEmitted.current = nextValue;
        onChange(nextValue);
      }
    },
    [maxLength, onChange],
  );

  const setText = (index: number, text: string) => {
    const next = [...lines];
    next[index] = text;
    commit(next, ids);
  };

  const move = (from: number, to: number, keepFocus = true) => {
    if (to < 0 || to >= lines.length) return;
    commit(moveLine(lines, from, to), moveLine(ids, from, to), keepFocus ? { index: to, caret: lines[from].length } : undefined);
    setStatus(`Poin ${from + 1} dipindah ke posisi ${to + 1}.`);
  };

  const remove = (index: number) => {
    const nextLines = removeLine(lines, index);
    const nextIds = lines.length === 1 ? [newId("pt")] : ids.filter((_, i) => i !== index);
    // Fokus pindah ke poin sebelumnya (atau poin pertama) supaya keyboard tidak tersesat.
    const focusIndex = index > 0 ? index - 1 : 0;
    commit(nextLines, nextIds, { index: focusIndex, caret: nextLines[focusIndex].length });
    setStatus(`Poin ${index + 1} dihapus.`);
  };

  const add = () => {
    // Poin kosong di ujung dipakai ulang, bukan ditumpuk.
    if (lines[lines.length - 1].trim() === "") {
      pendingFocus.current = { index: lines.length - 1, caret: 0 };
      setLines([...lines]);
      return;
    }
    commit([...lines, ""], [...ids, newId("pt")], { index: lines.length, caret: 0 });
  };

  const keyDown = (index: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Saat IME menyusun karakter (mis. keyboard Jepang/Android), biarkan browser.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (e.key === "Enter") {
      e.preventDefault();
      const r = splitAt(lines, index, start);
      // Teks terpilih ikut terhapus seperti perilaku Enter biasa.
      if (end > start) r.lines[index + 1] = lines[index].slice(end);
      const nextIds = [...ids];
      nextIds.splice(index + 1, 0, newId("pt"));
      commit(r.lines, nextIds, { index: r.focus, caret: r.caret });
      return;
    }
    if (e.key === "Backspace" && start === 0 && end === 0 && index > 0) {
      e.preventDefault();
      const r = mergeWithPrevious(lines, index);
      if (!r) return;
      commit(r.lines, ids.filter((_, i) => i !== index), { index: r.focus, caret: r.caret });
      return;
    }
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      move(index, e.key === "ArrowUp" ? index - 1 : index + 1);
      return;
    }
    if (e.key === "ArrowUp" && start === 0 && end === 0 && index > 0) {
      e.preventDefault();
      pendingFocus.current = { index: index - 1, caret: lines[index - 1].length };
      setLines([...lines]);
      return;
    }
    if (e.key === "ArrowDown" && start === el.value.length && index < lines.length - 1) {
      e.preventDefault();
      pendingFocus.current = { index: index + 1, caret: 0 };
      setLines([...lines]);
    }
  };

  const paste = (index: number, e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text/plain");
    if (!shouldSplitPaste(text)) return;
    e.preventDefault();
    const el = e.currentTarget;
    const r = pasteAt(lines, index, el.selectionStart, el.selectionEnd, text);
    const added = r.lines.length - lines.length;
    const nextIds = [...ids];
    nextIds.splice(index + 1, 0, ...Array.from({ length: added }, () => newId("pt")));
    commit(r.lines, nextIds, { index: r.focus, caret: r.caret });
    if (added > 0) setStatus(`${added + 1} poin ditempel.`);
  };

  // Handler stabil: membaca versi terbaru lewat ref supaya BulletRow (memo) tidak
  // ikut render ulang setiap kali poin lain diketik.
  const latest = useRef({ setText, move, remove, keyDown, paste });
  latest.current = { setText, move, remove, keyDown, paste };
  const indexOf = (el: HTMLElement) => Number(el.dataset.index);
  const registerInput = useCallback((id: string, el: HTMLTextAreaElement | null) => {
    if (el) inputs.current.set(id, el);
    else inputs.current.delete(id);
  }, []);
  const onText = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    latest.current.setText(indexOf(e.currentTarget), e.target.value.replace(/\r?\n/g, " "));
  }, []);
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    latest.current.keyDown(indexOf(e.currentTarget), e);
  }, []);
  const onPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    latest.current.paste(indexOf(e.currentTarget), e);
  }, []);
  const onMoveClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    latest.current.move(indexOf(e.currentTarget), Number(e.currentTarget.dataset.to));
  }, []);
  const onRemoveClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    latest.current.remove(indexOf(e.currentTarget));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = ids.indexOf(String(e.active.id));
    const to = ids.indexOf(String(e.over.id));
    if (from < 0 || to < 0) return;
    move(from, to, false);
  };

  const posOf = (id: string | number) => ids.indexOf(String(id)) + 1;

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span id={labelId} className="block text-label-bold text-on-surface">{label}</span>
        <div className="flex items-center gap-2">
          {onModeChange && (
            <div role="group" aria-label="Bentuk penulisan" className="inline-flex rounded-lg bg-surface-container-low p-0.5 text-xs font-semibold">
              {(["bullets", "paragraph"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  disabled={disabled}
                  onClick={() => changeMode(m)}
                  className={`min-h-11 rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-8 ${
                    mode === m ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {m === "bullets" ? "Poin" : "Paragraf"}
                </button>
              ))}
            </div>
          )}
          {headerAction}
        </div>
      </div>

      {mode === "paragraph" ? (
        <AutoTextarea
          aria-labelledby={labelId}
          value={value}
          disabled={disabled}
          maxLength={maxLength}
          placeholder={placeholder}
          // lastEmitted sengaja tidak diubah: saat kembali ke mode Poin, daftar disusun ulang dari nilai ini.
          onChange={(e) => {
            setNotice(null);
            onChange(e.target.value);
          }}
          className="min-h-24 w-full resize-none overflow-hidden rounded-xl border-none bg-surface-container-low px-3 py-2 text-body-md focus:ring-2 focus:ring-primary"
        />
      ) : (
        <div className="rounded-xl bg-surface-container-low p-1.5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            accessibility={{
              screenReaderInstructions: {
                draggable: "Tekan spasi atau Enter untuk mengangkat poin, panah atas/bawah untuk memindah, spasi lagi untuk meletakkan, Escape untuk batal.",
              },
              announcements: {
                onDragStart: ({ active }) => `Poin ${posOf(active.id)} diangkat.`,
                onDragOver: ({ over }) => (over ? `Di atas posisi ${posOf(over.id)}.` : "Di luar daftar."),
                onDragEnd: ({ over }) => (over ? `Poin diletakkan di posisi ${posOf(over.id)}.` : "Poin dilepas."),
                onDragCancel: () => "Pemindahan dibatalkan.",
              },
            }}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <ul aria-labelledby={labelId} className="space-y-0.5">
                {lines.map((text, i) => (
                  <BulletRow
                    key={ids[i]}
                    id={ids[i]}
                    index={i}
                    total={lines.length}
                    text={text}
                    disabled={disabled}
                    placeholder={placeholder}
                    registerInput={registerInput}
                    onText={onText}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    onMoveClick={onMoveClick}
                    onRemoveClick={onRemoveClick}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <button
            type="button"
            onClick={add}
            disabled={disabled}
            className="mt-1 inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 sm:min-h-8"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            Tambah poin
          </button>
        </div>
      )}
      {notice && (
        <div role="status" className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-surface-container px-3 py-2 text-xs text-on-surface">
          {notice.kind === "split" ? (
            <>
              <span>Teks ini bisa dipecah jadi {notice.count} poin, satu per kalimat.</span>
              <button type="button" onClick={splitPerSentence} className="min-h-11 rounded-md px-2 font-semibold text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-8">
                Pecah per kalimat
              </button>
              <button type="button" onClick={() => setNotice(null)} className="min-h-11 rounded-md px-2 font-semibold text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-8">
                Biarkan
              </button>
            </>
          ) : (
            <>
              <span>{notice.message}</span>
              <button type="button" onClick={undoNotice} className="min-h-11 rounded-md px-2 font-semibold text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-8">
                Urungkan
              </button>
            </>
          )}
        </div>
      )}
      <p className="sr-only" aria-live="polite">{status}</p>
    </div>
  );
}
