"use client";

import type { ReactNode } from "react";

/**
 * Teks saran dengan placeholder "[angka]" disorot lewat <mark>.
 * Dipotong potongan demi potongan, bukan lewat innerHTML — teks dari AI tidak
 * pernah diparse sebagai HTML.
 */
export function PlaceholderText({ text, className }: { text: string; className?: string }) {
  if (typeof text !== "string" || !text) return <span className={className} />;

  const nodes: ReactNode[] = [];
  let cursor = 0;
  let markIndex = 0;
  const pattern = /\[[^\]\n]{1,40}\]/g;

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <mark
        key={`ph-${markIndex++}`}
        className="rounded bg-tertiary-container px-0.5 font-semibold text-on-tertiary-container"
      >
        {match[0]}
      </mark>,
    );
    cursor = start + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return <span className={className}>{nodes}</span>;
}
