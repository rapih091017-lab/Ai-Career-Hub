import { it, expect } from "vitest";
import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { CvPdfDocument } from "@/lib/pdf/CvPdfDocument";
import { TEMPLATE_STYLES } from "@/components/cv-templates";
import { sampleCv } from "./cv-pdf.fixture";
import { writeFileSync } from "fs";

function ensureDomPolyfills() {
  if (typeof (globalThis as any).DOMMatrix === "undefined") {
    class DOMMatrix2D {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      constructor(init?: string | number[]) {
        if (typeof init === "string" && init.trim()) {
          const p = init.split(/[\s,]+/).map(Number);
          if (p.length >= 6) [this.a, this.b, this.c, this.d, this.e, this.f] = p;
        } else if (Array.isArray(init) && init.length >= 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        }
      }
      setMatrixValue(v: string) { const p = v.split(/[\s,]+/).map(Number); if (p.length >= 6) [this.a, this.b, this.c, this.d, this.e, this.f] = p; return this; }
      multiply(other: any) { const m = new DOMMatrix2D(); m.a = this.a * other.a + this.c * other.b; m.b = this.b * other.a + this.d * other.b; m.c = this.a * other.c + this.c * other.d; m.d = this.b * other.c + this.d * other.d; m.e = this.a * other.e + this.c * other.f + this.e; m.f = this.b * other.e + this.d * other.f + this.f; return m; }
      translate(tx: number, ty: number) { this.e += tx; this.f += ty; return this; }
      scale(sx: number, sy?: number) { const s = sy ?? sx; this.a *= sx; this.b *= s; this.c *= sx; this.d *= s; return this; }
      rotate(angle: number) { const rad = (angle * Math.PI) / 180; const c = Math.cos(rad), s = Math.sin(rad); const na = this.a * c + this.c * s; const nb = this.b * c + this.d * s; const nc = this.a * -s + this.c * c; const nd = this.b * -s + this.d * c; this.a = na; this.b = nb; this.c = nc; this.d = nd; return this; }
      transformPoint(pt: any) { return { x: this.a * pt.x + this.c * pt.y + this.e, y: this.b * pt.x + this.d * pt.y + this.f }; }
    }
    (globalThis as any).DOMMatrix = DOMMatrix2D;
  }
}

it("dump text via pdfjs", async () => {
  const blob = await pdf(
    createElement(CvPdfDocument, {
      data: sampleCv,
      templateStyle: TEMPLATE_STYLES["industrial-pro"],
      sectionOrder: ["summary", "experience", "education", "skills", "organizations"],
      marginMm: 15,
    }) as any
  ).toBlob();
  const buf = Buffer.from(await blob.arrayBuffer());
  writeFileSync("/tmp/cv-test.pdf", buf);

  ensureDomPolyfills();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise;
  let full = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    full += tc.items.map((item: any) => item.str).join(" ") + "\n";
  }
  console.log("=== PDFJS TEXT ===");
  console.log(full.slice(0, 1500));
  expect(true).toBe(true);
});