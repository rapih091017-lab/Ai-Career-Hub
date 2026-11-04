import { bulletList } from "@/lib/bullet-lines";

/**
 * Operasi murni untuk BulletEditor. Daftar poin disimpan sebagai array teks;
 * nilai field = poin digabung "\n". Poin kosong boleh ada selama mengetik
 * (renderer CV membuang baris kosong).
 */

export function linesFromValue(value: string): string[] {
  if (!value) return [""];
  return value.replace(/\r\n?/g, "\n").split("\n");
}

export function valueFromLines(lines: string[]): string {
  // Baris kosong di ujung dibuang supaya data tersimpan tetap rapi.
  const out = [...lines];
  while (out.length > 0 && out[out.length - 1].trim() === "") out.pop();
  return out.join("\n");
}

/** Enter: pecah poin di posisi kursor; sisa teks pindah ke poin baru. */
export function splitAt(lines: string[], index: number, caret: number): { lines: string[]; focus: number; caret: number } {
  const text = lines[index] ?? "";
  const before = text.slice(0, caret);
  const after = text.slice(caret);
  const next = [...lines];
  next.splice(index, 1, before, after);
  return { lines: next, focus: index + 1, caret: 0 };
}

/**
 * Backspace di awal poin: poin kosong dihapus, poin berisi digabung ke poin
 * sebelumnya. Kursor ditaruh di sambungan.
 */
export function mergeWithPrevious(lines: string[], index: number): { lines: string[]; focus: number; caret: number } | null {
  if (index <= 0 || index >= lines.length) return null;
  const prev = lines[index - 1];
  const cur = lines[index];
  const next = [...lines];
  next.splice(index - 1, 2, prev + cur);
  return { lines: next, focus: index - 1, caret: prev.length };
}

/** Tempel teks multi-baris di posisi kursor: tiap baris menjadi poin. */
export function pasteAt(
  lines: string[],
  index: number,
  selStart: number,
  selEnd: number,
  pasted: string,
): { lines: string[]; focus: number; caret: number } {
  const parts = bulletList(pasted);
  // Baris baru di awal/akhir teks tempel berarti mulai/akhiri poin baru, bukan disambung.
  if (parts.length > 0 && /^[ \t]*\r?\n/.test(pasted)) parts.unshift("");
  if (parts.length > 0 && /\r?\n[ \t]*$/.test(pasted)) parts.push("");
  const text = lines[index] ?? "";
  const before = text.slice(0, selStart);
  const after = text.slice(selEnd);
  if (parts.length === 0) {
    const next = [...lines];
    next[index] = before + after;
    return { lines: next, focus: index, caret: before.length };
  }
  const inserted = [...parts];
  inserted[0] = before + inserted[0];
  const lastIdx = inserted.length - 1;
  const caret = inserted[lastIdx].length;
  inserted[lastIdx] = inserted[lastIdx] + after;
  const next = [...lines];
  next.splice(index, 1, ...inserted);
  return { lines: next, focus: index + lastIdx, caret };
}

export function moveLine(lines: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= lines.length || to >= lines.length) return lines;
  const next = [...lines];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function removeLine(lines: string[], index: number): string[] {
  const next = lines.filter((_, i) => i !== index);
  return next.length === 0 ? [""] : next;
}

/** Hanya tempel multi-baris yang dipecah; tempel satu baris dibiarkan apa adanya. */
export function shouldSplitPaste(text: string): boolean {
  return /\r|\n/.test(text.trim());
}
