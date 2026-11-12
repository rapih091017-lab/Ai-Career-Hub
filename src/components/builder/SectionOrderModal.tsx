"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { SortableList } from "./SortableList";
import { AddSectionPanel } from "./AddSectionPanel";
import { fill, useTranslation } from "@/lib/i18n";

interface SectionOrderModalProps {
  open: boolean;
  onClose: () => void;
  sectionOrder: string[];
  sectionVisibility: Record<string, boolean | undefined>;
  labelOf: (key: string) => string;
  /** Pindahkan section dari indeks `from` ke `to`. */
  onMove: (from: number, to: number) => void;
  /** Garis di atas section (nilai efektif). */
  hasDivider: (key: string) => boolean;
  onToggleDivider: (key: string) => void;
  /** true = semua garis tampil. */
  allDividers: boolean;
  onAllDividersChange: (on: boolean) => void;
  isRemovable: (key: string) => boolean;
  onRemove: (key: string) => void;
  unused: { key: string; label: string; hasContent?: boolean }[];
  onRestore: (key: string) => void;
  onAddCustom: (title: string) => void;
  customCount: number;
  customTitles: string[];
}

const ICON_BTN =
  "inline-flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-30 sm:h-9";

export function SectionOrderModal({
  open,
  onClose,
  sectionOrder,
  sectionVisibility,
  labelOf,
  onMove,
  hasDivider,
  onToggleDivider,
  allDividers,
  onAllDividersChange,
  isRemovable,
  onRemove,
  unused,
  onRestore,
  onAddCustom,
  customCount,
  customTitles,
}: SectionOrderModalProps) {
  const [adding, setAdding] = useState(false);
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} title={t("order.title")} size="max-w-md">
      <div className="space-y-3">
        <p className="text-xs text-on-surface-variant">
          {t("order.help-a")} <span className="material-symbols-outlined align-middle text-[14px]" aria-hidden="true">drag_indicator</span>{" "}
          {t("order.help-b")}
        </p>
        <SortableList ids={sectionOrder} onMove={onMove} itemLabel={(key) => labelOf(key)} className="space-y-1.5">
          {(key, idx, handle) => {
            const label = labelOf(key);
            const visible = sectionVisibility[key] !== false;
            const divider = idx > 0 && hasDivider(key);
            return (
              <div
                className={`flex items-center gap-1 rounded-xl border py-1 pl-1 pr-1.5 ${
                  visible
                    ? "border-outline-variant/50 bg-surface-container-lowest"
                    : "border-dashed border-outline-variant/40 bg-surface-dim/30"
                }`}
              >
                {handle}
                <span className={`min-w-0 flex-1 truncate text-sm font-medium ${visible ? "text-on-surface" : "text-on-surface-variant"}`}>
                  {label}
                  {!visible && <span className="ml-1.5 text-[11px] font-normal">{t("order.hidden")}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleDivider(key)}
                  disabled={idx === 0}
                  aria-pressed={divider}
                  aria-label={fill(t("order.divider-aria"), { label })}
                  title={idx === 0 ? t("order.divider-first") : divider ? t("order.divider-remove") : t("order.divider-add")}
                  className={`${ICON_BTN} ${divider ? "bg-primary/10 text-primary" : ""}`}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">horizontal_rule</span>
                </button>
                <button type="button" onClick={() => onMove(idx, idx - 1)} disabled={idx === 0} className={ICON_BTN} aria-label={fill(t("order.up"), { label })}>
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_upward</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMove(idx, idx + 1)}
                  disabled={idx === sectionOrder.length - 1}
                  className={ICON_BTN}
                  aria-label={fill(t("order.down"), { label })}
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_downward</span>
                </button>
                {isRemovable(key) && (
                  <button type="button" onClick={() => onRemove(key)} className={`${ICON_BTN} hover:text-error`} aria-label={fill(t("order.remove"), { label })}>
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                  </button>
                )}
              </div>
            );
          }}
        </SortableList>

        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3 text-sm text-on-surface">
          {t("order.all-dividers")}
          <input type="checkbox" checked={allDividers} onChange={(e) => onAllDividersChange(e.target.checked)} className="h-4 w-4 accent-primary" />
        </label>

        {adding ? (
          <div className="rounded-xl border border-outline-variant/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-on-surface">{t("order.add")}</p>
              <button type="button" onClick={() => setAdding(false)} className="text-xs font-semibold text-on-surface-variant hover:text-on-surface">
                {t("common.close")}
              </button>
            </div>
            <AddSectionPanel unused={unused} onRestore={onRestore} onAddCustom={onAddCustom} customCount={customCount} existingTitles={customTitles} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-outline/30 text-sm font-medium text-on-surface-variant hover:border-primary/60 hover:text-primary"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">add</span> {t("order.add")}
          </button>
        )}
      </div>
    </Modal>
  );
}
