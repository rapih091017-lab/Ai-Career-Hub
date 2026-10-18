import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HrPointOfView from "@/components/checker/HrPointOfView";
import { LanguageProvider } from "@/lib/i18n";

/** useTranslation membaca context, jadi komponen harus selalu dibungkus provider. */
function renderPanel(result: unknown, keyPrefix?: string) {
  return render(
    <LanguageProvider>
      <HrPointOfView result={result as any} keyPrefix={keyPrefix} />
    </LanguageProvider>,
  );
}

const RESULT = {
  meta: { detected_seniority: "entry" },
  careerVelocity: { title_progression: "Upward", growth_rate: "Fast" },
  atsPredictionDetail: {
    risk_factors: [{ text: "TypeScript tidak ada", severity: "critical", source_excerpt: "JavaScript, React" }],
    strengths: [{ text: "Ada metrik dampak", source_excerpt: "Bangun dashboard untuk 40 user" }],
  },
};

describe("panel Sisi HR", () => {
  it("menampilkan temuan berhenti dan lanjut beserta kutipannya", () => {
    renderPanel(RESULT);
    expect(screen.getByText(/bikin saya berhenti/i)).toBeInTheDocument();
    expect(screen.getByText(/bikin saya lanjut/i)).toBeInTheDocument();
    expect(screen.getByText("JavaScript, React")).toBeInTheDocument();
    expect(screen.getByText("Bangun dashboard untuk 40 user")).toBeInTheDocument();
  });

  it("menampilkan level terbaca dan perjalanan karier", () => {
    renderPanel(RESULT);
    expect(screen.getByText(/dibaca sebagai level/i)).toBeInTheDocument();
    expect(screen.getByText(/naik/i)).toBeInTheDocument();
  });

  it("tidak menampilkan kotak kutipan kalau kutipannya tidak ada", () => {
    renderPanel({
      atsPredictionDetail: {
        risk_factors: [{ text: "Ada tabel", severity: "high", source_excerpt: null }],
        strengths: [],
      },
    });
    expect(screen.getByText("Ada tabel")).toBeInTheDocument();
    expect(screen.queryByText(/JavaScript, React/)).not.toBeInTheDocument();
  });

  it("saat kosong, jujur dan mengarahkan ke bagian lain", () => {
    renderPanel({ atsPredictionDetail: { risk_factors: [], strengths: [] } });
    expect(screen.getByText(/tidak menghasilkan temuan sisi HR/i)).toBeInTheDocument();
    expect(screen.getByText(/skor per section/i)).toBeInTheDocument();
    // Tidak boleh menjanjikan CV-nya bagus.
    expect(screen.queryByText(/sudah bagus|udah bagus/i)).not.toBeInTheDocument();
  });

  it("tidak error saat hasil kosong total", () => {
    renderPanel(null);
    expect(screen.getByText(/tidak menghasilkan temuan sisi HR/i)).toBeInTheDocument();
  });

  it("level dan perjalanan tetap tampil walau daftar temuan kosong", () => {
    renderPanel({
      meta: { detected_seniority: "lead" },
      careerVelocity: { title_progression: "Declining", growth_rate: "Slow" },
      atsPredictionDetail: { risk_factors: [], strengths: [] },
    });
    expect(screen.getByText(/tidak menghasilkan temuan sisi HR/i)).toBeInTheDocument();
    expect(screen.getByText(/dibaca sebagai level/i)).toBeInTheDocument();
    expect(screen.getByText(/turun/i)).toBeInTheDocument();
  });

  it("hanya laju karier yang ada, arahnya tidak dikarang", () => {
    renderPanel({ careerVelocity: { growth_rate: "Slow" } });
    const journey = screen.getByText(/laju karier/i);
    expect(journey).toHaveTextContent("Laju karier: pelan");
    expect(journey).not.toHaveTextContent("Perjalanan");
  });

  it("pakai prefix kunci halaman hasil tersimpan", () => {
    // Kalau kunci `checker.detail.*` belum ada, t() mengembalikan kunci mentah
    // dan kalimat panel ini akan hilang.
    renderPanel(RESULT, "checker.detail.");
    expect(screen.getByText("Sisi HR")).toBeInTheDocument();
    expect(screen.queryByText(/hrview-title/)).not.toBeInTheDocument();
  });
});