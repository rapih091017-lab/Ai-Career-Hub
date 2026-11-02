"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AtsScoreRing } from "@/components/builder/AtsScoreRing";
import MagneticButton from "@/components/MagneticButton";
import { PdfExportButton } from "@/components/checker/PdfExportButton";
import { useTranslation } from "@/lib/i18n";
import { CV_FONTS, cvFontValue, resolveCvFont } from "@/lib/cv-fonts";
import { TemplatePopover } from "@/components/builder/TemplatePopover";

const FONT_OPTIONS = [
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Plus Jakarta Sans', sans-serif", label: "Plus Jakarta Sans" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "Roboto, sans-serif", label: "Roboto" },
];

/** Pilihan font untuk gaya per bagian: hanya font CV (sesuai sanitasi). */
const BLOCK_FONT_OPTIONS = CV_FONTS.map((f) => ({ value: cvFontValue(f), label: f.label }));

const LINE_HEIGHT_OPTIONS = [1, 1.15, 1.3, 1.5, 1.8, 2];

/** Konteks toolbar: tanpa bagian terpilih = gaya global. */
export interface BlockStyleControls {
  targets: { key: string; label: string }[];
  /** Bagian yang sedang diatur; null = semua (global). */
  target: string | null;
  onTargetChange: (key: string | null) => void;
  /** Bagian terpilih punya gaya sendiri. */
  hasStyle: boolean;
  lineHeight: number;
  titleColor: string;
  onLineHeightChange: (v: number | undefined) => void;
  onTitleColorChange: (v: string | undefined) => void;
  onApplyAll: () => void;
  onReset: () => void;
}

interface FormatToolbarProps {
  block: BlockStyleControls;
  cvCompleteness: number;
  saveStatus: "idle" | "saving" | "saved" | "error";
  lastSaved: Date | null;
  computeAtsScore: number;
  fontFamily: string;
  fontSize: number;
  textAlign: "left" | "center" | "right" | "justify";
  showDividers: boolean;
  reducedMotion: boolean;
  isPdfExporting: boolean;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onTextAlignChange: (value: "left" | "center" | "right" | "justify") => void;
  onDividersToggle: () => void;
  onOpenSectionOrder: () => void;
  onOpenDisplaySettings: () => void;
  onNavigateToCheckout: () => void;
  onExportPdf: () => Promise<void>;
  templateId: string;
  onTemplateChange: (id: string) => void;
  hasStyleOverrides: boolean;
  onResetStyle: () => void;
  /** Layar < lg: tombol kembali dari pratinjau penuh ke form. */
  onCloseMobilePreview?: () => void;
}

export function FormatToolbar({
  block,
  cvCompleteness,
  saveStatus,
  lastSaved,
  computeAtsScore,
  fontFamily,
  fontSize,
  textAlign,
  showDividers,
  isPdfExporting,
  onFontFamilyChange,
  onFontSizeChange,
  onTextAlignChange,
  onDividersToggle,
  onOpenSectionOrder,
  onOpenDisplaySettings,
  onNavigateToCheckout,
  onExportPdf,
  templateId,
  onTemplateChange,
  hasStyleOverrides,
  onResetStyle,
  onCloseMobilePreview,
}: FormatToolbarProps) {
  const sectionMode = block.target !== null;
  const fontOptions = sectionMode ? BLOCK_FONT_OPTIONS : FONT_OPTIONS;
  // Font dari template (bukan salah satu pilihan) tetap ditampilkan apa adanya.
  const fontKnown = fontOptions.some((o) => o.value === fontFamily);
  const sizeMin = sectionMode ? 8 : 9;
  const sizeMax = sectionMode ? 14 : 12;
  const targetLabel = block.targets.find((x) => x.key === block.target)?.label ?? "";
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectCls = "bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs px-2 py-1.5 min-h-9 focus:ring-1 focus:ring-primary";

  const targetSelect = (
    <label className="flex items-center gap-1 text-xs text-on-surface-variant">
      <span className="whitespace-nowrap">Atur bagian</span>
      <select
        value={block.target ?? ""}
        onChange={(e) => block.onTargetChange(e.target.value || null)}
        className={`${selectCls} max-w-[160px] ${sectionMode ? "border-primary text-on-surface font-semibold" : ""}`}
      >
        <option value="">Semua bagian</option>
        {block.targets.map((x) => (
          <option key={x.key} value={x.key}>{x.label}</option>
        ))}
      </select>
    </label>
  );

  const fontControls = (
    <>
      <select value={fontFamily} onChange={(e) => onFontFamilyChange(e.target.value)} aria-label="Font" className={`${selectCls} max-w-[140px]`}>
        {!fontKnown && <option value={fontFamily}>{resolveCvFont(fontFamily).label}{sectionMode ? "" : " (template)"}</option>}
        {fontOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <div className="flex items-center gap-1 bg-surface-container-low rounded-lg px-1.5 py-1">
        <button onClick={() => onFontSizeChange(Math.max(sizeMin, fontSize - 1))} disabled={fontSize <= sizeMin} className="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant disabled:opacity-40" aria-label={t("builder.font-small")}>
          <span className="material-symbols-outlined text-sm" aria-hidden="true">remove</span>
        </button>
        <span className="text-xs font-bold w-8 text-center select-none" aria-live="polite">{fontSize}pt</span>
        <button onClick={() => onFontSizeChange(Math.min(sizeMax, fontSize + 1))} disabled={fontSize >= sizeMax} className="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant disabled:opacity-40" aria-label={t("builder.font-large")}>
          <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
        </button>
      </div>

      <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 gap-0.5" role="group" aria-label="Rata teks">
        {(["left", "center", "right", "justify"] as const).map((align) => {
          const label =
            align === "left"
              ? t("builder.align-left")
              : align === "center"
                ? t("builder.align-center")
                : align === "right"
                  ? t("builder.align-right")
                  : t("builder.align-justify");
          return (
            <button key={align} onClick={() => onTextAlignChange(align)} aria-pressed={textAlign === align}
              className={`p-1.5 rounded ${textAlign === align ? "bg-surface-container-lowest shadow-sm" : "hover:bg-surface-container-highest/60"}`}
              title={label}
              aria-label={label}
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">{align === "left" ? "format_align_left" : align === "center" ? "format_align_center" : align === "right" ? "format_align_right" : "format_align_justify"}</span>
            </button>
          );
        })}
      </div>
    </>
  );

  // Kontrol yang jarang dipakai: di desktop masuk menu "Lainnya", di layar kecil ada di sheet Format.
  const moreItems = (close: () => void) => (
    <>
      {sectionMode && (
        <>
          <label className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span>Jarak baris bagian ini</span>
            <select value={String(block.lineHeight)} onChange={(e) => block.onLineHeightChange(Number(e.target.value))} className={selectCls}>
              {!LINE_HEIGHT_OPTIONS.includes(block.lineHeight) && <option value={String(block.lineHeight)}>{block.lineHeight}</option>}
              {LINE_HEIGHT_OPTIONS.map((v) => (
                <option key={v} value={String(v)}>{v}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span>Warna judul bagian ini</span>
            <input type="color" value={block.titleColor} onChange={(e) => block.onTitleColorChange(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border border-outline-variant/50 bg-transparent p-0" />
          </label>
          <hr className="my-1 border-outline-variant/40" />
        </>
      )}
      <MenuItem icon="horizontal_rule" onClick={() => { onDividersToggle(); close(); }} pressed={showDividers}>
        {showDividers ? "Hapus semua garis bagian" : "Garis di antara bagian"}
      </MenuItem>
      <MenuItem icon="reorder" onClick={() => { onOpenSectionOrder(); close(); }}>{t("builder.section-order-tip")}</MenuItem>
      <MenuItem icon="palette" onClick={() => { onOpenDisplaySettings(); close(); }}>{t("builder.display-tip")}</MenuItem>
    </>
  );

  const saveBadge = (
    <AnimatePresence>
      {saveStatus !== "idle" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: -8 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 8 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold shrink-0 shadow-sm ${
            saveStatus === "saving" ? "text-amber-700 bg-amber-50 border border-amber-200" :
            saveStatus === "saved" ? "text-green-deep bg-green/10 border border-green/25" :
            "text-on-error-container bg-error-container border border-error/30 animate-[shake_0.3s_ease-in-out]"
          }`}
        >
          <span className={`material-symbols-outlined text-[14px] ${saveStatus === "saving" ? "animate-spin" : ""}`} aria-hidden="true">
            {saveStatus === "saving" ? "sync" : saveStatus === "saved" ? "check_circle" : "error"}
          </span>
          <span>
            {saveStatus === "saving" ? t("builder.saving-short") : saveStatus === "saved" ? t("builder.saved") : t("builder.save-error")}
          </span>
          {saveStatus === "saved" && lastSaved && (
            <span className="text-[9px] text-green-600/60 font-normal ml-0.5 hidden sm:inline">
              {lastSaved.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const aiButton = (
    <MagneticButton>
      <button onClick={onNavigateToCheckout}
        className="relative flex min-h-[36px] items-center gap-1.5 px-3 py-1.5 rounded-full border-[2.5px] border-ink bg-lime text-xs font-bold text-on-light shadow-[0_2px_0_rgb(var(--c-ink))] overflow-hidden"
        title="Buka halaman pembelian revisi CV oleh AI"
        aria-label="Revisi CV dengan AI (berbayar)"
      >
        <span className="material-symbols-outlined text-sm relative z-10" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">auto_awesome</span>
        <span className="relative z-10 hidden sm:inline">Revisi dengan AI</span>
      </button>
    </MagneticButton>
  );

  const pdfButton = (
    <PdfExportButton
      targetRef={{ current: null }}
      mode="builder"
      onBuilderExport={onExportPdf}
      externalLoading={isPdfExporting}
      label="PDF"
      fileName="CV.pdf"
    />
  );

  return (
    <div className="relative h-auto px-3 md:px-4 py-2 border-b border-outline-variant/50 flex flex-wrap items-center gap-2 bg-surface-container-lowest shadow-sm z-20 shrink-0">
      {/* ── Layar kecil: satu baris ringkas ── */}
      <div className="flex w-full items-center gap-2 lg:hidden">
        {onCloseMobilePreview && (
          <button type="button" onClick={onCloseMobilePreview} className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-on-surface hover:bg-surface-container">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
            Form
          </button>
        )}
        <button type="button" onClick={() => setSheetOpen(true)} aria-haspopup="dialog"
          className="flex min-h-11 items-center gap-1 rounded-lg bg-surface-container-low px-3 text-sm font-semibold text-on-surface hover:bg-surface-variant"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">text_format</span>
          Format
        </button>
        {saveBadge}
        <div className="ml-auto flex items-center gap-2">
          {aiButton}
          {pdfButton}
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden lg:contents">
        <div className="flex items-center gap-1.5 shrink-0" title={`Kelengkapan CV: ${cvCompleteness}%`}>
          <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width,background-color] duration-500 ${
                cvCompleteness >= 100 ? "bg-green/100" : cvCompleteness >= 50 ? "bg-primary" : "bg-amber-500"
              }`}
              style={{ width: `${cvCompleteness}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-on-surface-variant whitespace-nowrap">Lengkap {cvCompleteness}%</span>
        </div>

        {saveBadge}

        <AtsScoreRing score={computeAtsScore} />

        <TemplatePopover templateId={templateId} onSelect={onTemplateChange} hasOverrides={hasStyleOverrides} onResetStyle={onResetStyle} />

        {targetSelect}
        {fontControls}

        <MoreMenu>{moreItems}</MoreMenu>

        <div className="ml-auto flex items-center gap-2">
          {aiButton}
          {pdfButton}
        </div>
      </div>

      {sectionMode && (
        <div className="flex w-full flex-wrap items-center gap-2 border-t border-outline-variant/40 pt-2 text-xs">
          <span className="font-semibold text-on-surface">Mengatur: {targetLabel}</span>
          <span className="text-on-surface-variant">{block.hasStyle ? "Gaya khusus bagian ini" : "Masih ikut gaya global"}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" onClick={block.onApplyAll} disabled={!block.hasStyle}
              className="min-h-9 rounded-lg bg-surface-container-low px-2.5 font-medium text-on-surface hover:bg-surface-variant disabled:opacity-50"
            >
              Terapkan ke semua
            </button>
            <button type="button" onClick={block.onReset} disabled={!block.hasStyle}
              className="min-h-9 rounded-lg bg-surface-container-low px-2.5 font-medium text-on-surface hover:bg-surface-variant disabled:opacity-50"
            >
              Reset bagian ini
            </button>
            <button type="button" onClick={() => block.onTargetChange(null)}
              className="min-h-9 rounded-lg px-2.5 font-medium text-on-surface-variant hover:bg-surface-variant"
            >
              Selesai
            </button>
          </div>
        </div>
      )}

      {/* ── Sheet Format (layar kecil) ── */}
      {sheetOpen && (
        <FormatSheet onClose={() => setSheetOpen(false)}>
          <div className="space-y-3">
            <TemplatePopover templateId={templateId} onSelect={onTemplateChange} hasOverrides={hasStyleOverrides} onResetStyle={onResetStyle} />
            {targetSelect}
            <div className="flex flex-wrap items-center gap-2">{fontControls}</div>
            <div className="rounded-xl border border-outline-variant/50">{moreItems(() => setSheetOpen(false))}</div>
            <p className="text-xs text-on-surface-variant">Kelengkapan CV: {cvCompleteness}% · Kecocokan kata kunci: {computeAtsScore > 0 ? `${computeAtsScore}%` : "isi deskripsi lowongan dulu"}</p>
          </div>
        </FormatSheet>
      )}
    </div>
  );
}

function MenuItem({ icon, onClick, pressed, children }: { icon: string; onClick: () => void; pressed?: boolean; children: ReactNode }) {
  return (
    <button type="button" role={pressed === undefined ? "menuitem" : "menuitemcheckbox"} onClick={onClick} aria-checked={pressed}
      className="flex w-full min-h-11 items-center gap-2 px-3 text-left text-sm text-on-surface hover:bg-surface-container focus-visible:bg-surface-container focus-visible:outline-none"
    >
      <span className="material-symbols-outlined text-[18px] text-on-surface-variant" aria-hidden="true">{icon}</span>
      {children}
    </button>
  );
}

/** Menu "Lainnya" (desktop): tutup dengan klik di luar atau Escape. */
function MoreMenu({ children }: { children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}
        className="flex min-h-9 items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-container-low text-on-surface-variant hover:bg-surface-variant"
      >
        Lainnya
        <span className="material-symbols-outlined text-sm" aria-hidden="true">expand_more</span>
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-30 mt-1 w-64 rounded-xl border border-outline-variant/50 bg-surface-container-lowest py-1 shadow-lg">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/** Sheet bawah untuk kontrol format di layar kecil. */
function FormatSheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/40 lg:hidden" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Format CV" onClick={(e) => e.stopPropagation()}
        className="max-h-[80dvh] w-full overflow-y-auto rounded-t-2xl bg-surface-container-lowest p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-on-surface">Format CV</h2>
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-primary">Selesai</button>
        </div>
        {children}
      </div>
    </div>
  );
}
