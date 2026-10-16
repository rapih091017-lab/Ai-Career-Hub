import { describe, expect, it } from "vitest";
import { parseInline, safeHref } from "@/lib/article-format";

describe("tautan di dalam teks artikel", () => {
  it("[teks](url) jadi tautan", () => {
    expect(parseInline("Cek di [AI CV Checker](https://aicareerhub.my.id/checker)")).toEqual([
      { bold: false, value: "Cek di " },
      { bold: false, value: "AI CV Checker", href: "https://aicareerhub.my.id/checker" },
    ]);
  });

  it("tautan tetap jalan di dalam teks tebal", () => {
    const tokens = parseInline("**Baca [panduan](https://contoh.id/a)**");
    expect(tokens).toEqual([
      { bold: true, value: "Baca " },
      { bold: true, value: "panduan", href: "https://contoh.id/a" },
    ]);
  });

  it("skema yang berbahaya ditolak dan ditampilkan sebagai teks", () => {
    for (const url of [
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox",
      "ftp://contoh.id/f",
    ]) {
      expect(safeHref(url)).toBeUndefined();
      expect(parseInline(`[klik](${url})`)[0].href).toBeUndefined();
    }
  });

  it("alamat yang bukan URL tidak jadi tautan", () => {
    expect(safeHref("bukan url")).toBeUndefined();
    expect(parseInline("[klik](bukan url)")).toEqual([{ bold: false, value: "[klik](bukan url)" }]);
  });

  it("teks biasa dan tebal tidak berubah", () => {
    expect(parseInline("**tebal** biasa")).toEqual([
      { bold: true, value: "tebal" },
      { bold: false, value: " biasa" },
    ]);
  });
});