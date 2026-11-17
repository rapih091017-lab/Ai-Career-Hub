"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Action = { label: string; href?: string; onClick?: () => void };

/** Empty state yang menjelaskan isi daftar ini dan memberi satu tombol langkah pertama. */
export function GuidedEmptyState({
  icon,
  title,
  desc,
  action,
  secondary,
  className = "",
  children,
}: {
  icon: string;
  title: string;
  desc: string;
  action: Action;
  secondary?: Action;
  className?: string;
  children?: ReactNode;
}) {
  const primary =
    "inline-flex min-h-[44px] items-center gap-2 rounded-full border-[2.5px] border-ink bg-lime px-5 py-2.5 font-bold text-on-light shadow-[0_3px_0_rgb(var(--c-ink))] transition-all hover:-translate-y-0.5 active:scale-[0.98]";
  const quiet = "inline-flex min-h-[44px] items-center px-2 text-sm font-semibold text-green-deep underline underline-offset-4";
  const render = (a: Action, cls: string) =>
    a.href ? (
      <Link href={a.href} className={cls}>
        {a.label}
      </Link>
    ) : (
      <button type="button" onClick={a.onClick} className={cls}>
        {a.label}
      </button>
    );
  return (
    <div data-empty-state className={`rounded-[14px] border-2 border-dashed border-ink/25 bg-paper p-8 text-center shadow-hard-sm ${className}`}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[14px] border-2 border-ink bg-lime">
        <span className="material-symbols-outlined text-3xl text-ink select-none" aria-hidden="true">{icon}</span>
      </div>
      <h3 className="mb-2 font-display text-ink">{title}</h3>
      <p className="mx-auto mb-6 max-w-[46ch] text-body-md text-ink-soft">{desc}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {render(action, primary)}
        {secondary && render(secondary, quiet)}
      </div>
      {children}
    </div>
  );
}
