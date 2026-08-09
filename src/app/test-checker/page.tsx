"use client";

import { useRef } from "react";
import AuthGuard from "@/components/AuthGuard";

declare const pdfjsLib: any;

function loadPdfScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat pdf.js"));
    document.head.appendChild(script);
  });
}

export default function TestCheckerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const resultRef = useRef<HTMLPreElement>(null);

  const handleExtract = async () => {
    const status = statusRef.current!;
    const result = resultRef.current!;
    const fileInput = fileInputRef.current!;

    const file = fileInput.files?.[0];
    if (!file) {
      alert("Silakan pilih file terlebih dahulu.");
      return;
    }

    status.textContent = "Membaca file di browser...";
    result.textContent = "";

    try {
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error("Gagal membaca file"));
        reader.readAsArrayBuffer(file);
      });

      await loadPdfScript();

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
      }

      result.textContent = fullText.trim() || "(Tidak ada teks yang ditemukan)";
      status.textContent = "Selesai. Teks berhasil diekstrak di sisi browser.";
    } catch (err) {
      status.textContent = `Error: ${err instanceof Error ? err.message : "Gagal mengekstrak teks"}`;
      result.textContent = "";
    }
  };

  return (
    <AuthGuard>
      <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: "1rem" }}>Test Checker - Extract Text (Client-side)</h1>

      <div style={{ marginBottom: "1rem" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          id="fileInput"
          style={{ marginRight: "0.5rem" }}
        />
        <button
          onClick={handleExtract}
          style={{
            padding: "0.5rem 1rem",
            cursor: "pointer",
          }}
        >
          Extract Text
        </button>
      </div>

      <p ref={statusRef} id="status" style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
        Menunggu file...
      </p>

      <pre
        ref={resultRef}
        id="result"
        style={{
          background: "#f5f5f5",
          padding: "1rem",
          borderRadius: "4px",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          minHeight: "100px",
        }}      />
      </div>
    </AuthGuard>
  );
}
