import { describe, it, expect } from "vitest";
import {
  linesFromValue, valueFromLines, splitAt, mergeWithPrevious, pasteAt, moveLine, removeLine, shouldSplitPaste,
} from "@/lib/bullet-editor-ops";

describe("bullet-editor-ops", () => {
  it("nilai <-> baris kompatibel dengan data lama", () => {
    expect(linesFromValue("")).toEqual([""]);
    expect(linesFromValue("a\nb")).toEqual(["a", "b"]);
    expect(valueFromLines(["a", "", "b", "", ""])).toBe("a\n\nb");
    expect(valueFromLines([""])).toBe("");
  });

  it("Enter memecah di kursor dan fokus ke poin baru", () => {
    expect(splitAt(["abcd"], 0, 2)).toEqual({ lines: ["ab", "cd"], focus: 1, caret: 0 });
    expect(splitAt(["a", "b"], 0, 1)).toEqual({ lines: ["a", "", "b"], focus: 1, caret: 0 });
  });

  it("Backspace di awal poin menggabung/menghapus", () => {
    expect(mergeWithPrevious(["ab", ""], 1)).toEqual({ lines: ["ab"], focus: 0, caret: 2 });
    expect(mergeWithPrevious(["ab", "cd"], 1)).toEqual({ lines: ["abcd"], focus: 0, caret: 2 });
    expect(mergeWithPrevious(["ab"], 0)).toBeNull();
  });

  it("tempel multi-baris dipecah jadi poin", () => {
    expect(pasteAt(["Xy"], 0, 1, 1, "• a\n- b\n3. c")).toEqual({ lines: ["Xa", "b", "cy"], focus: 2, caret: 1 });
    expect(pasteAt(["hapus"], 0, 0, 5, "- satu\n- dua")).toEqual({ lines: ["satu", "dua"], focus: 1, caret: 3 });
    expect(pasteAt(["ab"], 0, 1, 1, "\n\n")).toEqual({ lines: ["ab"], focus: 0, caret: 1 });
    // Baris baru di awal: poin tempel tidak menyambung ke teks sebelumnya.
    expect(pasteAt(["ab"], 0, 2, 2, "\n• x\n• y")).toEqual({ lines: ["ab", "x", "y"], focus: 2, caret: 1 });
    // Baris baru di akhir: sisa teks setelah kursor jadi poin sendiri.
    expect(pasteAt(["ab"], 0, 1, 1, "x\ny\n")).toEqual({ lines: ["ax", "y", "b"], focus: 2, caret: 0 });
  });

  it("pindah dan hapus poin", () => {
    expect(moveLine(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveLine(["a"], 0, 1)).toEqual(["a"]);
    expect(removeLine(["a", "b"], 0)).toEqual(["b"]);
    expect(removeLine(["a"], 0)).toEqual([""]);
  });

  it("shouldSplitPaste", () => {
    expect(shouldSplitPaste("teks biasa")).toBe(false);
    expect(shouldSplitPaste("https://a-b.com")).toBe(false);
    expect(shouldSplitPaste("a\nb")).toBe(true);
    expect(shouldSplitPaste("• a")).toBe(true);
  });
});
