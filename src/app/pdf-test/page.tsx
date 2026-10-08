"use client";

import { useEffect, useState } from "react";
import { generateCvPdfBlob } from "@/lib/pdf/generate-cv-pdf";
import { TEMPLATE_STYLES } from "@/components/cv-templates";

const sample: any = {
  fullName: "Budi Santoso",
  phone: "0812-3456-7890",
  email: "budi@email.com",
  address: "Jakarta Selatan, Indonesia",
  linkedin: "linkedin.com/in/budisantoso",
  portfolioUrl: "budisantoso.dev",
  professionalTitle: "Senior Frontend Engineer",
  employmentStatus: "Bekerja",
  summary:
    "Frontend engineer dengan 5 tahun pengalaman membangun aplikasi React yang melayani 100.000+ pengguna, spesialis performa web dan sistem desain.",
  jobTitle: "Senior Frontend Engineer",
  jobDescription: "",
  workHistory: [
    {
      id: "w1",
      position: "Frontend Engineer",
      company: "PT Teknologi Maju",
      location: "Jakarta",
      startDate: "2022-01",
      endDate: "",
      isCurrent: true,
      description: "Memimpin migrasi aplikasi ke Next.js\nMeningkatkan skor Lighthouse dari 62 ke 95",
      achievement: "Mengurangi waktu load halaman 40% melalui code-splitting",
      projectUrl: "github.com/budi/next-app",
    },
    {
      id: "w2",
      position: "Junior Web Developer",
      company: "Studio Kreatif",
      location: "Bandung",
      startDate: "2020-03",
      endDate: "2021-12",
      description: "Membangun landing page dan aplikasi internal untuk 20+ klien",
    },
  ],
  education: [
    { id: "e1", institution: "Universitas Indonesia", degree: "S1", field: "Ilmu Komputer", startDate: "2016", endDate: "2020", gpa: "3.75" },
  ],
  organisations: [],
  skills: [
    { id: "s1", name: "React", level: "advanced", category: "technical" },
    { id: "s2", name: "TypeScript", level: "advanced", category: "technical" },
  ],
  certifications: [{ id: "c1", name: "AWS Solutions Architect", issuer: "Amazon", year: "2024" }],
};

export default function PdfTestPage() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    (async () => {
      try {
        const blob = await generateCvPdfBlob(sample, {
          templateStyle: TEMPLATE_STYLES["industrial-pro"],
          sectionOrder: ["summary", "experience", "education", "skills"],
          marginMm: 15,
        });
        const b64 = await blob.arrayBuffer().then((b) => {
          let binary = "";
          const bytes = new Uint8Array(b);
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
          }
          return btoa(binary);
        });
        const res = await fetch("/api/pdf-test-save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: b64 }),
        });
        const data = await res.json();
        setStatus(`done: ${JSON.stringify(data)}`);
      } catch (err) {
        setStatus(`error: ${err instanceof Error ? err.message : String(err)}`);
      }
    })();
  }, []);

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>PDF Browser Test</h1>
      <p>Status: {status}</p>
    </main>
  );
}