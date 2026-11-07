import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
    // Muncul juga di "Mulai dari sini" karena skornya termasuk tiga terendah.
    expect(screen.getAllByText("Deskripsi pengalaman").length).toBeGreaterThanOrEqual(1);
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

describe("LinkedInResultView: daftar isi, mulai dari sini, centang", () => {
  const result = buildLinkedInResult({
    ...fixture,
    experience: [
      { company: "PT Maju", title: "Data Analyst", period: "", bullets: ["Satu", "Dua", "Tiga", "Empat", "Lima"] },
    ],
  })!;

  it("menampilkan 3 bagian skor terendah dengan label, tanpa menit", () => {
    render(
      <LanguageProvider>
        <LinkedInResultView result={result} branding="" resultId="lo1" />
      </LanguageProvider>,
    );
    const start = document.getElementById("lo-mulai")!;
    const items = start.querySelectorAll("li");
    expect(items).toHaveLength(3);
    // education 4, experience_descriptions 5, about 6
    expect(items[0].textContent).toContain("Pendidikan");
    expect(start.textContent).toContain("skor terendah");
    expect(start.textContent).not.toMatch(/menit/);
  });

  it("melipat rewrite pengalaman panjang dan menyimpan centang per id", () => {
    localStorage.clear();
    const first = render(
      <LanguageProvider>
        <LinkedInResultView result={result} branding="" resultId="lo1" />
      </LanguageProvider>,
    );
    expect(screen.queryByText(/Empat/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Tampilkan 2 baris lagi/ }));
    expect(screen.getByText(/Empat/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("checkbox", { name: "Sudah diterapkan" })[0]);
    expect(JSON.parse(localStorage.getItem("lo_done:lo1") ?? "[]")).toEqual(["headline"]);
    first.unmount();
    render(
      <LanguageProvider>
        <LinkedInResultView result={result} branding="" resultId="lo1" />
      </LanguageProvider>,
    );
    expect(screen.getAllByRole("checkbox", { name: "Sudah diterapkan" })[0]).toBeChecked();
  });
});
