"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import type { LetterTemplate } from "./letterTemplates";

/**
 * A4 Letter Preview — render surat lamaran/cover letter dalam format A4.
 * Menggunakan inline styles (bukan Tailwind) agar serialisasi HTML ke
 * pdf-server menghasilkan layout yang sama persis.
 *
 * Format visual bisa disesuaikan per template (font, aksen, gaya header).
 *
 * Scaling: transform scale() DIKELOLA oleh wrapper luar (bukan element
 * A4 itu sendiri). Ini penting karena:
 *  1. Preview selalu muat di kolom sempit (mobile/tablet) — tidak "gepeng".
 *  2. Element A4 yang di-ref tetap bebas transform → serializePreviewHtml
 *     tidak membawa scale ke PDF.
 */
export interface LetterData {
  subject: string;
  content: string;
  language: "id" | "en";
  style?: string;
  letterNumber?: string | null;
  attachment?: string | null;
  sender?: {
    fullName?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

const A4_WIDTH_MM = 210;
// Tinggi A4 penuh (297mm). Surat di-export dengan margin 0mm (padding elemen
// A4 yang menyediakan ruang), jadi preview harus 297mm penuh agar MATCH PDF.
// Sebelumnya 261mm (297 - 2x18mm) membuat preview lebih pendek dari PDF,
// sehingga PDF punya strip putih di bawah yang tidak terlihat di preview.
const A4_HEIGHT_MM = 297;
const MM_TO_PX = 96 / 25.4;

const DEFAULT_FORMAT: NonNullable<LetterTemplate["format"]> = {
  fontFamily: "'Calibri', 'Segoe UI', 'Arial', 'Helvetica', sans-serif",
  accentColor: "#111111",
  headerStyle: "modern",
  subjectUppercase: true,
  bodyAlign: "left",
  bodySize: "12pt",
};

export const LetterPreview = forwardRef<
  HTMLDivElement,
  { letter: LetterData; maxWidth?: number; format?: Partial<LetterTemplate["format"]> }
>(function LetterPreview({ letter, maxWidth = A4_WIDTH_MM, format = {} }, ref) {
  const fmt = { ...DEFAULT_FORMAT, ...format };
  // Gaya formal_lengkap / template dengan kop surat
  const isLetterhead = letter.style === "formal_lengkap" || fmt.headerStyle === "kop" || fmt.letterhead === true;
  const sender = letter.sender || {};

  // ── Scale responsif: ukur lebar container, sesuaikan scale ──
  const wrapRef = useRef<HTMLDivElement>(null);
  // Tinggi konten AKTUAL elemen A4 (dalam px) — bukan A4_HEIGHT tetap,
  // karena surat bisa lebih panjang dari satu halaman dan TIDAK boleh
  // terpotong di bawah. Wrapper height = kontenH * scale.
  const [contentHeightPx, setContentHeightPx] = useState(A4_HEIGHT_MM * MM_TO_PX);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const compute = () => {
      const containerW = el.clientWidth;
      const a4W = maxWidth * MM_TO_PX;
      setScale(Math.min(1, containerW / a4W));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth]);

  // Ukur tinggi aktual elemen A4 (follow konten, bukan fixed 261mm).
  // Pakai max(offsetHeight, scrollHeight): offsetHeight = tinggi item
  // (bisa dipaksa stretch oleh flex parent height:0), scrollHeight =
  // tinggi konten penuh — pilih yang lebih besar agar surat panjang TIDAK
  // terpotong di bawah.
  useEffect(() => {
    const el = (ref as React.RefObject<HTMLDivElement | null>).current;
    if (!el) return;
    const measure = () => setContentHeightPx(Math.max(el.offsetHeight, el.scrollHeight));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, letter.content]);

  // Pecah paragraf: baris kosong ganda = paragraf baru
  // Guard ?? "" — content bisa null/undefined untuk surat lama / daftar tanpa detail
  const paragraphs = (letter.content ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const accent = fmt.accentColor;
  const isWarm = fmt.headerStyle === "warm";
  const isModern = fmt.headerStyle === "modern";

  return (
    <div
      ref={wrapRef}
      className="w-full flex justify-center overflow-hidden"
      style={{ height: `${contentHeightPx * scale}px` }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          width: 0,
          height: 0,
          display: "flex",
          justifyContent: "center",
          // align-items flex-start: jangan stretch elemen A4 ke tinggi 0
          // (parent height:0) — biarkan elemen tumbuh mengikuti isi surat
          // agar surat panjang tidak terpotong.
          alignItems: "flex-start",
        }}
      >
        <div
          ref={ref}
          className="a4-preview a4-letter shrink-0"
          style={{
            width: `${maxWidth}mm`,
            minHeight: `${A4_HEIGHT_MM}mm`,
            padding: isLetterhead ? "14mm 20mm" : "20mm 22mm",
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            margin: "0 auto",
            fontFamily: fmt.fontFamily,
            fontSize: fmt.bodySize,
            lineHeight: 1.6,
            color: "#111111",
            boxSizing: "border-box",
            height: "auto",
            overflow: "visible",
          }}
        >
          {isLetterhead ? (
            <>
              {/* ═══ KOP SURAT ═══ */}
              <div
                style={{
                  textAlign: "center",
                  paddingBottom: "4mm",
                  marginBottom: "6mm",
                  borderBottom: `2.5pt solid ${accent}`,
                }}
              >
                <div
                  style={{
                    fontSize: "16pt",
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: accent,
                  }}
                >
                  {sender.fullName || "[Nama Lengkap]"}
                </div>
                <div style={{ fontSize: "10pt", marginTop: "1mm", color: "#333333" }}>
                  {[sender.address, sender.phone, sender.email]
                    .filter(Boolean)
                    .join("  •  ") || "[Alamat]  •  [Telepon]  •  [Email]"}
                </div>
              </div>

              {/* Nomor / Lampiran / Perihal */}
              <div style={{ marginBottom: "6mm" }}>
                {letter.letterNumber && (
                  <div style={{ display: "flex", fontSize: "11pt", lineHeight: 1.7 }}>
                    <span style={{ width: "26mm", fontWeight: 600 }}>Nomor</span>
                    <span style={{ width: "8mm" }}>:</span>
                    <span>{letter.letterNumber}</span>
                  </div>
                )}
                <div style={{ display: "flex", fontSize: "11pt", lineHeight: 1.7 }}>
                  <span style={{ width: "26mm", fontWeight: 600 }}>Lampiran</span>
                  <span style={{ width: "8mm" }}>:</span>
                  <span>{letter.attachment || "1 (satu) berkas"}</span>
                </div>
                <div style={{ display: "flex", fontSize: "11pt", lineHeight: 1.7 }}>
                  <span style={{ width: "26mm", fontWeight: 600 }}>Perihal</span>
                  <span style={{ width: "8mm" }}>:</span>
                  <span style={{ fontWeight: 600 }}>{letter.subject}</span>
                </div>
              </div>
            </>
          ) : (
            /* Subject — Perihal (gaya modern / warm) */
            <div style={{ marginBottom: "6mm" }}>
              {isModern ? (
                <div
                  style={{
                    display: "inline-block",
                    padding: "1.5mm 4mm",
                    background: `${accent}14`,
                    borderLeft: `2.5pt solid ${accent}`,
                    fontSize: "11pt",
                    fontWeight: 700,
                    textTransform: fmt.subjectUppercase ? "uppercase" : "none",
                    letterSpacing: 0.4,
                    color: accent,
                  }}
                >
                  {letter.language === "id" ? "Perihal" : "Subject"}: {letter.subject}
                </div>
              ) : (
                <span
                  style={{
                    fontSize: "11pt",
                    fontWeight: 700,
                    textTransform: fmt.subjectUppercase ? "uppercase" : "none",
                    letterSpacing: 0.5,
                    color: isWarm ? accent : "#111111",
                  }}
                >
                  {letter.language === "id" ? "Perihal" : "Subject"}:{" "}
                </span>
              )}
              {!isModern && (
                <span style={{ fontSize: "11pt", fontWeight: 600 }}>{letter.subject}</span>
              )}
            </div>
          )}

          {/* Body */}
          <div style={{ whiteSpace: "pre-wrap" }}>
            {paragraphs.length > 0 ? (
              paragraphs.map((p, i) => (
                <p key={i} style={{ margin: "0 0 4mm 0", textAlign: fmt.bodyAlign }}>
                  {p}
                </p>
              ))
            ) : (
              <p style={{ margin: 0, color: "#999999" }}>
                {letter.language === "id"
                  ? "Hasil AI akan muncul di sini. Klik \"Generate Surat\" untuk mulai."
                  : "AI-generated letter will appear here. Click \"Generate Letter\" to start."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
