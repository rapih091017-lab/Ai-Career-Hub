"use client";

import Modal from "@/components/Modal";

interface SectionOrderModalProps {
  open: boolean;
  onClose: () => void;
  sectionOrder: string[];
  sectionVisibility: Record<string, boolean | undefined>;
  SECTION_LABEL_MAP: Record<string, string>;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function SectionOrderModal({
  open,
  onClose,
  sectionOrder,
  sectionVisibility,
  SECTION_LABEL_MAP,
  onMoveUp,
  onMoveDown,
}: SectionOrderModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Urutan Section CV" size="max-w-sm">
      <div className="space-y-1.5">
        <p className="text-xs text-on-surface-variant mb-3">
          Atur urutan tampilan section di CV. Seret atau gunakan tombol panah.
        </p>
        {sectionOrder.map((key, idx) => {
          const label = SECTION_LABEL_MAP[key] || key;
          const visible = sectionVisibility[key] !== false;
          return (
            <div
              key={key}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                visible
                  ? "bg-white border-outline-variant/30"
                  : "bg-surface-dim/30 border-dashed border-outline-variant/20 opacity-50"
              }`}
            >
              <span className="material-symbols-outlined text-outline-variant text-base shrink-0" aria-hidden="true">
                drag_indicator
              </span>

              <span className="flex-1 text-sm font-medium text-on-surface">{label}</span>

              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  visible ? "text-green-700 bg-green-50" : "text-outline bg-surface-dim"
                }`}
              >
                {visible ? "Tampil" : "Sembunyi"}
              </span>

              <button
                onClick={() => onMoveUp(idx)}
                disabled={idx === 0}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-outline"
                aria-label="Pindah ke atas"
              >
                <span className="material-symbols-outlined text-sm">arrow_upward</span>
              </button>

              <button
                onClick={() => onMoveDown(idx)}
                disabled={idx === sectionOrder.length - 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-outline"
                aria-label="Pindah ke bawah"
              >
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
