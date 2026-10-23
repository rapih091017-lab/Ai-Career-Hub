import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/lib/i18n";
import { LinkedInResultView } from "@/components/linkedin/LinkedInResultView";
import { buildLinkedInResult } from "@/lib/linkedin-optimizer/result";

const fixture = {
  verdict: "Arah karier sudah jelas, bukti angka masih tipis.",
  sections: [
    { key: "headline", score: 8, issues: ["Belum menyebut fokus"], suggestion: "Sebut React." },
    { key: "about", score: 6, issues: [], suggestion: "" },
    { key: "experience_titles", score: 7, issues: [], suggestion: "" },
    { key: "experience_descriptions", score: 5, issues: ["Bullet masih tugas"], suggestion: "Hasil dulu." },
    { key: "skills", score: 9, issues: [], suggestion: "" },
    { key: "education", score: 4, issues: [], suggestion: "" },
  ],
  headline: { text: "Data Analyst | SQL, Python", why: "Jelas dan ringkas." },
  about: { text: "Data Analyst dengan [angka] tahun pengalaman.", why: "" },
  experience: [
    {
      company: "PT Maju",
      title: "Data Analyst",
      period: "Mar 2023 - Sekarang",
      bullets: ["Membangun dashboard", "Mengotomasi laporan"],
    },
  ],
  skills: { text: "Bahasa: SQL, Python", note: "" },
};

describe("LinkedInResultView", () => {
  const result = buildLinkedInResult(fixture)!;

  it("menampilkan skor total, grade, dan vonis", () => {
    render(
      <LanguageProvider>
        <LinkedInResultView result={result} branding="Data Analyst fintech" />
      </LanguageProvider>,
    );

    expect(screen.getByText("66%")).toBeInTheDocument();
    expect(screen.getByText(/Grade C/)).toBeInTheDocument();
    expect(screen.getByText(/Arah karier sudah jelas/)).toBeInTheDocument();
    expect(screen.getByText(/Data Analyst fintech/)).toBeInTheDocument();
  });

  it("menampilkan rincian bagian dengan bobotnya", () => {
    render(
      <LanguageProvider>
        <LinkedInResultView result={result} branding="" />
      </LanguageProvider>,
    );

    // "Headline" muncul dua kali: label bagian dan judul kartu rewrite.
    expect(screen.getAllByText("Headline").length).toBeGreaterThanOrEqual(1);
    // Headline dan deskripsi pengalaman sama-sama berbobot 25%.
    expect(screen.getAllByText("Bobot 25%")).toHaveLength(2);
    expect(screen.getByText("Deskripsi pengalaman")).toBeInTheDocument();
    expect(screen.getByText("Bobot 15%")).toBeInTheDocument();
  });

  it("menampilkan teks siap tempel dan tombol salin", () => {
    render(
      <LanguageProvider>
        <LinkedInResultView result={result} branding="" />
      </LanguageProvider>,
    );

    expect(screen.getByText("Data Analyst | SQL, Python")).toBeInTheDocument();
    expect(screen.getByText("PT Maju · Mar 2023 - Sekarang")).toBeInTheDocument();
    expect(screen.getByText((_, node) => node?.textContent === "Membangun dashboard\nMengotomasi laporan")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Salin/ }).length).toBeGreaterThanOrEqual(4);
    // Placeholder di About diperingatkan, bukan disalin diam-diam.
    expect(screen.getByText(/Masih ada bagian \[angka\]/)).toBeInTheDocument();
  });
});
