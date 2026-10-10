"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { NavItem } from "./NavDropdown";

export default function NavMobileDropdown({ label, items, onItemClick }: { label: string; items: NavItem[]; onItemClick?: () => void }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return <div>
    <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-left font-label-bold text-on-surface-variant hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary">
      {label}<span aria-hidden className="material-symbols-outlined text-[20px]">{open ? "expand_less" : "expand_more"}</span>
    </button>
    <AnimatePresence initial={false}>{open ? <motion.div initial={reduce ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: reduce ? 0 : 0.16 }} className="overflow-hidden"><div className="space-y-1 py-1 pl-3">{items.map((item) => <Link key={item.href} href={item.href} onClick={onItemClick} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-on-surface-variant hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"><span aria-hidden className="material-symbols-outlined text-[18px] text-primary">{item.icon}</span>{item.title}</Link>)}</div></motion.div> : null}</AnimatePresence>
  </div>;
}
