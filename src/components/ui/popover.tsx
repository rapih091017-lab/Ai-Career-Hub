"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

const GAP = 6;
const EDGE = 8;

/**
 * Posisi `fixed` untuk panel melayang di dekat anchor. Dirender lewat portal agar tidak
 * terpotong kontainer ber-overflow (panel form, toolbar). Ikut bergeser saat scroll/resize.
 */
function useFloatingPosition(anchorRef: RefObject<HTMLElement | null>, panelRef: RefObject<HTMLElement | null>, open: boolean) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const update = useCallback(() => {
    const a = anchorRef.current;
    const p = panelRef.current;
    if (!a || !p) return;
    const r = a.getBoundingClientRect();
    const w = p.offsetWidth;
    const h = p.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    // Rata kiri dengan anchor, tetap di dalam layar.
    const left = Math.min(Math.max(EDGE, r.left), Math.max(EDGE, vw - w - EDGE));
    // Di bawah anchor; pindah ke atas bila tidak muat.
    const below = r.bottom + GAP;
    const top = below + h > vh - EDGE && r.top - GAP - h >= EDGE ? r.top - GAP - h : below;
    setPos({ top, left });
  }, [anchorRef, panelRef]);
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    update();
  }, [open, update]);
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, update]);
  return pos;
}

function Floating({ panelRef, pos, id, role, label, className, children, onKeyDown }: {
  panelRef: RefObject<HTMLDivElement | null>;
  pos: { top: number; left: number } | null;
  id: string;
  role: "tooltip" | "dialog";
  label?: string;
  className: string;
  children: ReactNode;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role={role}
      aria-label={label}
      tabIndex={role === "dialog" ? -1 : undefined}
      onKeyDown={onKeyDown}
      // Sebelum posisi dihitung panel tidak terlihat, agar tidak berkedip di pojok layar.
      style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? "visible" : "hidden" }}
      className={className}
    >
      {children}
    </div>,
    document.body,
  );
}

const TOUCH_TOOLTIP_MS = 2500;

/**
 * Tooltip satu kalimat untuk kontrol toolbar. Muncul saat hover, fokus keyboard, dan tap
 * (layar sentuh, hilang sendiri). Tidak menghalangi aksi kontrolnya. Escape menutup.
 */
export function Tooltip({ text, children }: { text: string; children: ReactElement<{ "aria-describedby"?: string }> }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pos = useFloatingPosition(anchorRef, panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => () => clearTimeout(touchTimer.current), []);

  const child = isValidElement(children) ? cloneElement(children, { "aria-describedby": open ? id : undefined }) : children;

  return (
    <span
      ref={anchorRef}
      className="inline-flex"
      onMouseEnter={(e) => {
        if ((e.nativeEvent as PointerEvent).pointerType !== "touch") setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
      onFocus={(e) => {
        // Hanya fokus dari keyboard; klik mouse tidak perlu memunculkan tooltip lagi.
        if ((e.target as HTMLElement).matches(":focus-visible")) setOpen(true);
      }}
      onBlur={() => setOpen(false)}
      onPointerDown={(e) => {
        if (e.pointerType !== "touch") return;
        setOpen(true);
        clearTimeout(touchTimer.current);
        touchTimer.current = setTimeout(() => setOpen(false), TOUCH_TOOLTIP_MS);
      }}
    >
      {child}
      {open && (
        <Floating
          panelRef={panelRef}
          pos={pos}
          id={id}
          role="tooltip"
          className="pointer-events-none z-[80] max-w-[min(16rem,calc(100vw-16px))] rounded-lg bg-inverse-surface px-2.5 py-1.5 text-xs leading-snug text-inverse-on-surface shadow-md"
        >
          {text}
        </Floating>
      )}
    </span>
  );
}

/**
 * Popover yang dibuka dengan klik/tap pada tombol pemicu. Escape atau klik di luar menutup;
 * Escape mengembalikan fokus ke pemicu. Isi bisa berisi tombol (fokus bisa masuk).
 */
export function Popover({
  trigger,
  label,
  children,
  panelClassName = "",
  open: openProp,
  onOpenChange,
}: {
  /** Render tombol pemicu; props wajib dipasang ke elemen <button>. */
  trigger: (props: {
    ref: RefObject<HTMLButtonElement | null>;
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-controls": string;
    "aria-haspopup": "dialog";
  }) => ReactNode;
  label: string;
  children: ReactNode | ((close: () => void) => ReactNode);
  panelClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = useCallback(
    (v: boolean) => {
      if (openProp === undefined) setInnerOpen(v);
      onOpenChange?.(v);
    },
    [openProp, onOpenChange],
  );
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pos = useFloatingPosition(triggerRef, panelRef, open);
  const close = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Escape hanya untuk popover ini; jangan ikut menutup dialog/pratinjau di belakangnya.
      e.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, setOpen]);

  // Panel dirender di akhir <body>: fokus dipindah ke panel agar pembaca layar & Tab langsung masuk.
  const focused = useRef(false);
  useEffect(() => {
    if (!open) {
      focused.current = false;
      return;
    }
    if (pos && !focused.current) {
      focused.current = true;
      panelRef.current?.focus({ preventScroll: true });
    }
  }, [open, pos]);

  return (
    <>
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen(!open),
        "aria-expanded": open,
        "aria-controls": id,
        "aria-haspopup": "dialog",
      })}
      {open && (
        <Floating
          panelRef={panelRef}
          pos={pos}
          id={id}
          role="dialog"
          label={label}
          // Tab dari tombol terakhir di panel kembali ke pemicu, bukan lompat ke akhir dokumen.
          onKeyDown={(e) => {
            if (e.key !== "Tab") return;
            const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("button, a[href], input, textarea, select") ?? []);
            const active = document.activeElement;
            const atEdge = e.shiftKey
              ? active === panelRef.current || active === items[0]
              : !items.length || active === items[items.length - 1];
            if (atEdge) {
              e.preventDefault();
              close();
              triggerRef.current?.focus();
            }
          }}
          className={`z-[80] outline-none w-[min(20rem,calc(100vw-16px))] rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3 text-sm text-on-surface shadow-lg ${panelClassName}`}
        >
          {typeof children === "function" ? children(close) : children}
        </Floating>
      )}
    </>
  );
}
