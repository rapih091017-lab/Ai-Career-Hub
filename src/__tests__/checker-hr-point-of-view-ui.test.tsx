import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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

afterEach(() => {
  // LanguageProvider baca localStorage saat mount. Kalau "en" bocor ke test
  // berikutnya, panel akan diam-diam dirender dalam bahasa Inggris dan
  // assertion Indonesia lolos karena tidak menulis apa-apa.
  localStorage.removeItem("lang");
});

describe("panel Sisi HR", () => {
  it("menampilkan temuan berhenti dan lanjut beserta kutipannya", () => {
    renderPanel(RESULT);
    expect(screen.getByText(/bikin saya berhenti/i)).toBeInTheDocument();
    expect(screen.getByText(/bikin saya lanjut baca/i)).toBeInTheDocument();
    expect(screen.getByText("JavaScript, React")).toBeInTheDocument();
    expect(screen.getByText("Bangun dashboard untuk 40 user")).toBeInTheDocument();
  });

  it("menampilkan level terbaca dan arah karier", () => {
    renderPanel(RESULT);
    expect(screen.getByText(/dibaca sebagai level/i)).toBeInTheDocument();
    expect(screen.getByText(/naik/i)).toBeInTheDocument();
    expect(screen.getByText(/arah karier/i)).toBeInTheDocument();
  });

  it("tidak menampilkan kotak kutipan kalau kutipannya tidak ada", () => {
    const { container } = renderPanel({
      atsPredictionDetail: {
        risk_factors: [{ text: "Ada tabel", severity: "high", source_excerpt: null }],
        strengths: [],
      },
    });
    expect(screen.getByText("Ada tabel")).toBeInTheDocument();
    // Assertion lama mencocokkan string dari fixture lain, jadi tetap lulus
    // walau komponen merender kotak kutipan kosong. Yang diuji sekarang:
    // di dalam list item tidak boleh ada paragraf kosong — itu bentuk
    // "kotak kutipan tanpa isi" yang paling sering muncul.
    const item = screen.getByText("Ada tabel").closest("li");
    expect(item).not.toBeNull();
    const paragraphs = Array.from(item!.querySelectorAll("p"));
    expect(paragraphs.length).toBeGreaterThan(0);
    for (const paragraph of paragraphs) {
      expect(paragraph.textContent?.trim()).not.toBe("");
    }
    expect(container.querySelector("p.font-mono")).toBeNull();
  });

  it("saat kosong, jujur dan mengarahkan tanpa menyebut judul halaman lain", () => {
    renderPanel({ atsPredictionDetail: { risk_factors: [], strengths: [] } });
    expect(screen.getByText(/tidak menghasilkan temuan sisi HR/i)).toBeInTheDocument();
    // Petunjuk harus tetap berlaku di dua halaman yang punya judul berbeda,
    // jadi jangan menyebut nama judul section secara harfiah.
    expect(screen.getByText(/ada di bawah/i)).toBeInTheDocument();
    expect(screen.queryByText(/skor per section/i)).not.toBeInTheDocument();
    // Tidak boleh menjanjikan CV-nya bagus.
    expect(screen.queryByText(/sudah bagus|udah bagus/i)).not.toBeInTheDocument();
  });

  it("tidak error saat hasil kosong total", () => {
    renderPanel(null);
    expect(screen.getByText(/tidak menghasilkan temuan sisi HR/i)).toBeInTheDocument();
  });

  it("level dan arah karier tetap tampil walau daftar temuan kosong", () => {
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
    const pace = screen.getByText(/laju karier/i);
    expect(pace).toHaveTextContent("Laju karier: pelan");
    expect(pace).not.toHaveTextContent("Arah karier");
  });

  it("pakai prefix kunci halaman hasil tersimpan", () => {
    // Kalau kunci `checker.detail.*` belum ada, t() mengembalikan kunci mentah
    // dan kalimat panel ini akan hilang.
    renderPanel(RESULT, "checker.detail.");
    expect(screen.getByText("Sisi HR")).toBeInTheDocument();
    expect(screen.queryByText(/hrview-title/)).not.toBeInTheDocument();
  });

  it("judul panel memakai token headline yang benar", () => {
    // Preflight membuat heading jadi `font-size: inherit`, jadi heading yang
    // memakai token tak dikenal diam-diam turun ke ukuran body dan hierarki
    // panel terbalik. Assertion ini menangkap kelas yang tidak ada di config.
    renderPanel(RESULT);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.className).toContain("font-headline-md");
    expect(heading.className).toContain("text-headline-md");
  });

  it("tidak memakai token Tailwind yang tidak didefinisikan", () => {
    const { container } = renderPanel(RESULT);
    const phantom = /\b(font|text)-(headline-sm|body-sm)\b/;
    for (const element of Array.from(container.querySelectorAll("*"))) {
      expect(element.className).not.toMatch(phantom);
    }
  });

  it("dua panel di satu halaman tidak bentrok id", () => {
    render(
      <LanguageProvider>
        <HrPointOfView result={RESULT as any} />
        <HrPointOfView result={RESULT as any} />
      </LanguageProvider>,
    );
    const ids = screen.getAllByRole("heading", { level: 2 }).map((node) => node.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    const sections = Array.from(document.querySelectorAll("section[aria-labelledby]"));
    for (const section of sections) {
      expect(ids).toContain(section.getAttribute("aria-labelledby"));
    }
  });

  it("kolom yang kosong menjelaskan dirinya sendiri", () => {
    renderPanel({
      atsPredictionDetail: {
        risk_factors: [{ text: "TypeScript tidak ada", severity: "critical", source_excerpt: null }],
        strengths: [],
      },
    });
    expect(screen.getByText("Nggak ada yang bikin saya lanjut baca.")).toBeInTheDocument();
    expect(screen.queryByText("Nggak ada yang bikin saya berhenti.")).not.toBeInTheDocument();
  });

  it("label severity pakai kata yang benar dan bedakan tingkatnya", () => {
    renderPanel({
      atsPredictionDetail: {
        risk_factors: [
          { text: "Bikin stop", severity: "critical", source_excerpt: null },
          { text: "Agak kecil", severity: "low", source_excerpt: null },
        ],
        strengths: [],
      },
    });
    // "Ringan" itu pinjaman arti, bukan padanan "Low".
    const critical = screen.getByText("Kritis");
    const low = screen.getByText("Rendah");
    // Kalau keduanya kelasnya sama persis, yang berat sama saja kelihatan
    // dengan yang ringan. Warna boleh beda, tapi kata wajib beda juga.
    expect(critical.className).not.toBe(low.className);
    expect(critical.className).toContain("text-error");
  });

  it("menampilkan panel dalam bahasa Inggris", () => {
    localStorage.setItem("lang", "en");
    renderPanel(RESULT, "checker.detail.");
    expect(screen.getByText("The HR View")).toBeInTheDocument();
    expect(screen.getByText("What made me stop")).toBeInTheDocument();
    expect(screen.getByText("What made me keep reading")).toBeInTheDocument();
    expect(screen.getByText(/This CV reads as level/i)).toBeInTheDocument();
    expect(screen.getByText(/Career trajectory/i)).toBeInTheDocument();
    expect(screen.getByText(/Career pace/i)).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
    // Kalau satu kunci Inggris salah ketik, t() mengembalikan kunci mentahnya.
    expect(screen.queryByText(/hrview-/)).not.toBeInTheDocument();
  });

  it("kalimat kosong dan kolom kosong juga benar dalam bahasa Inggris", () => {
    localStorage.setItem("lang", "en");
    // Satu sisi saja: kalau dua-duanya kosong, panel ganti ke kalimat empty
    // dan kolom tidak dirender sama sekali — jalur yang diuji test sebelumnya.
    renderPanel({
      atsPredictionDetail: { risk_factors: [], strengths: [{ text: "Ada metrik", source_excerpt: null }] },
      meta: { detected_seniority: "senior" },
    });
    expect(screen.getByText("Nothing made me stop.")).toBeInTheDocument();
    expect(screen.queryByText("Nothing made me keep reading.")).not.toBeInTheDocument();

    renderPanel({ atsPredictionDetail: { risk_factors: [], strengths: [] }, meta: { detected_seniority: "senior" } });
    expect(screen.getByText(/produced no HR-side findings/i)).toBeInTheDocument();
    expect(screen.getByText(/below/i)).toBeInTheDocument();
    expect(screen.queryByText(/Scores per Section/i)).not.toBeInTheDocument();
  });
});
