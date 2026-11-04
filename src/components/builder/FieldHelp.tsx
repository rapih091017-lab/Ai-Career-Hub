"use client";

import { Popover } from "@/components/ui/popover";
import { BUILDER_HELP, type BuilderHelpKey } from "@/lib/builder-help";

/** Ikon (i) di samping label: popover berisi apa itu, contoh baik, dan contoh kurang. */
export function FieldHelp({ topic }: { topic: BuilderHelpKey }) {
  const h = BUILDER_HELP[topic];
  return (
    <Popover
      label={`Bantuan: ${h.title}`}
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label={`Bantuan: ${h.title}`}
          data-field-help={topic}
          // Area sentuh 32px walau ikonnya kecil.
          className="-my-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full align-middle text-on-surface-variant hover:bg-surface-container hover:text-on-surface aria-expanded:bg-surface-container aria-expanded:text-on-surface"
        >
          <span className="material-symbols-outlined text-[17px]" aria-hidden="true">info</span>
        </button>
      )}
    >
      <div className="space-y-2.5 text-xs leading-relaxed">
        <p className="text-sm font-semibold text-on-surface">{h.title}</p>
        <p className="text-on-surface-variant">{h.what}</p>
        <div>
          <p className="font-semibold text-green-deep">Contoh baik</p>
          <p className="mt-0.5 rounded-lg bg-lime/10 px-2 py-1.5 text-on-surface">{h.good}</p>
        </div>
        <div>
          <p className="font-semibold text-on-surface-variant">Contoh kurang</p>
          <p className="mt-0.5 rounded-lg bg-surface-container-low px-2 py-1.5 text-on-surface-variant">{h.weak}</p>
          <p className="mt-1 text-on-surface-variant">{h.weakWhy}</p>
        </div>
      </div>
    </Popover>
  );
}
