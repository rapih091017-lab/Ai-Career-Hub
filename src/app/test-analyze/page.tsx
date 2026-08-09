"use client";

import { useRef } from "react";
import AuthGuard from "@/components/AuthGuard";
import { anonIdHeaders } from "@/lib/anon-id";

export default function TestAnalyzePage() {
  const cvRef = useRef<HTMLTextAreaElement>(null);
  const jdRef = useRef<HTMLTextAreaElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const resultRef = useRef<HTMLPreElement>(null);

  const handleAnalyze = async () => {
    const status = statusRef.current!;
    const result = resultRef.current!;
    const cvText = cvRef.current!.value;
    const jdText = jdRef.current!.value;

    if (!cvText.trim()) {
      alert("Silakan isi teks CV terlebih dahulu.");
      return;
    }

    status.textContent = "Menganalisis...";
    result.textContent = "";

    try {
      const res = await fetch("/api/checker/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Fingerprint anonim per-browser — supaya kuota 2x tidak dishare semua user
          ...anonIdHeaders(),
        },
        body: JSON.stringify({
          extractedText: cvText,
          jobDescription: jdText,
          originalFileName: "test.pdf",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        result.textContent = JSON.stringify(data, null, 2);
      } else {
        status.textContent = `Error: ${data.message || data.error || "Terjadi kesalahan"}`;
        result.textContent = JSON.stringify(data, null, 2);
        return;
      }
    } catch (err) {
      status.textContent = `Error: ${err instanceof Error ? err.message : "Network error"}`;
      return;
    }

    status.textContent = "Selesai";
  };

  return (
    <AuthGuard>
      <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: "1rem" }}>Test Analyze CV</h1>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: "bold" }}>
          Teks CV:
        </label>
        <textarea
          ref={cvRef}
          id="cvText"
          rows={10}
          style={{ width: "100%", padding: "0.5rem", fontFamily: "monospace" }}
          placeholder="Tempel teks CV di sini..."
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: "bold" }}>
          Job Description:
        </label>
        <textarea
          ref={jdRef}
          id="jdText"
          rows={6}
          style={{ width: "100%", padding: "0.5rem", fontFamily: "monospace" }}
          placeholder="Tempel teks Job Description di sini..."
        />
      </div>

      <button
        onClick={handleAnalyze}
        style={{ padding: "0.5rem 1.5rem", cursor: "pointer", marginBottom: "1rem" }}
      >
        Analyze CV
      </button>

      <p ref={statusRef} id="status" style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
        Menunggu input...
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
