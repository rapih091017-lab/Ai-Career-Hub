"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";

export interface NavItem { title: string; description: string; icon: string; href: string; }

export default function NavDropdown({ label, items }: { label: string; items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", key); };
  }, [open]);
  return <div ref={root} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
    <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((value) => !value)} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); } }} className="flex min-h-11 items-center gap-1 rounded-lg px-3 text-label-bold text-on-surface-variant hover:bg-surface-container hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
      {label}<span aria-hidden className="material-symbols-outlined text-[18px]">{open ? "expand_less" : "expand_more"}</span>
    </button>
    <AnimatePresence>
      {open ? <motion.div initial={reduce ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: reduce ? 0 : 0.14 }} className="absolute left-1/2 top-full z-50 mt-2 w-[min(360px,calc(100vw-32px))] -translate-x-1/2 rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-2 shadow-premium-lg" role="menu" aria-label={label}>
        {items.map((item) => <Link key={item.href} role="menuitem" href={item.href} onClick={() => setOpen(false)} className="group flex min-h-14 items-start gap-3 rounded-lg p-3 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary">
          <span aria-hidden className="material-symbols-outlined mt-0.5 text-[20px] text-primary">{item.icon}</span><span className="min-w-0"><span className="block text-label-bold text-on-surface group-hover:text-primary">{item.title}</span><span className="mt-0.5 block text-label-sm text-on-surface-variant">{item.description}</span></span>
        </Link>)}
      </motion.div> : null}
    </AnimatePresence>
  </div>;
}
