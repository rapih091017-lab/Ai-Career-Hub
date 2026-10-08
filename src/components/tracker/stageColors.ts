import type { StageColor } from "@/lib/tracker";

/** Kelas Tailwind per token warna tahap. Ditulis sebagai string literal utuh
 * supaya Tailwind JIT ikut membundelnya; jangan merangkai nama kelas dinamis. */
export const STAGE_COLOR_CLASSES: Record<StageColor, { dot: string; soft: string; text: string }> = {
  slate: { dot: "bg-slate-400", soft: "bg-slate-400/10", text: "text-slate-600" },
  teal: { dot: "bg-teal-500", soft: "bg-teal-500/10", text: "text-teal-700" },
  sky: { dot: "bg-sky-500", soft: "bg-sky-500/10", text: "text-sky-700" },
  amber: { dot: "bg-amber-500", soft: "bg-amber-500/10", text: "text-amber-700" },
  violet: { dot: "bg-violet-500", soft: "bg-violet-500/10", text: "text-violet-700" },
  rose: { dot: "bg-rose-500", soft: "bg-rose-500/10", text: "text-rose-700" },
  emerald: { dot: "bg-emerald-500", soft: "bg-emerald-500/10", text: "text-emerald-700" },
  orange: { dot: "bg-orange-500", soft: "bg-orange-500/10", text: "text-orange-700" },
};

export function stageColorClasses(color: string) {
  return STAGE_COLOR_CLASSES[color as StageColor] ?? STAGE_COLOR_CLASSES.slate;
}
