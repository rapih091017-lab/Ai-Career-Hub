import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import HrPointOfView from "@/components/checker/HrPointOfView";
import { LanguageProvider } from "@/lib/i18n";
import { AnalysisResultSchema } from "@/lib/ai/prompts/schemas";

/** useTranslation membaca context, jadi komponen harus selalu dibungkus provider. */
function renderPanel(result: unknown, keyPrefix?: string) {
  return render(
    <LanguageProvider>
      <HrPointOfView result={result as any} keyPrefix={keyPrefix} />
    </LanguageProvider>,
  );
}

/** Panel produksi menerima hasil yang sudah lolos schema, bukan fixture mentah.
 *  Parse dulu supaya tes membaca jalur yang sama dengan produksi — kalau tidak,
 *  tes tidak akan pernah melihat nilai yang disuntik schema. */
function parsedResult(raw: unknown) {
  const result = AnalysisResultSchema.parse(raw);
  return {
    meta: result.meta ?? null,
    careerVelocity: result.career_velocity ?? null,
    atsPredictionDetail: typeof result.ats_prediction === "object" ? result.ats_prediction : null,
    narrativeFeedback: result.narrative_feedback ?? null,
  };
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
    // Dikunci ke heading kolom: sejak ada kalimat keputusan, frasa
    // "bikin saya berhenti" juga muncul di kalimat itu.
    expect(screen.getByRole("heading", { name: /Yang bikin saya berhenti/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Yang bikin saya lanjut baca/i })).toBeInTheDocument();
    expect(screen.getByText(/JavaScript, React/)).toBeInTheDocument();
    expect(screen.getByText(/Bangun dashboard untuk 40 user/)).toBeInTheDocument();
  });

  it("menampilkan level terbaca dan arah karier", () => {
    renderPanel(RESULT);
    expect(screen.getByText(/terbaca di level/i)).toBeInTheDocument();
    expect(screen.getByText(/naik/i)).toBeInTheDocument();
    expect(screen.getByText(/arah karier/i)).toBeInTheDocument();
  });

  it("tidak menampilkan kotak kutipan kalau kutipannya tidak ada", () => {
    renderPanel({
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
    // Cek di dalam list item, bukan seluruh panel: panel punya pita label
    // mono sendiri (SectionKicker), jadi selector global akan menangkapnya.
    expect(item!.querySelector("p.font-mono")).toBeNull();
  });

  it("saat kosong, jujur dan mengarahkan tanpa menyebut judul halaman lain", () => {
    renderPanel({ atsPredictionDetail: { risk_factors: [], strengths: [] } });
    expect(screen.getByText(/catatan dari sisi HR/i)).toBeInTheDocument();
    // Petunjuk harus tetap berlaku di dua halaman yang punya judul berbeda,
    // jadi jangan menyebut nama judul section secara harfiah.
    expect(screen.getByText(/ada di bawah/i)).toBeInTheDocument();
    expect(screen.queryByText(/skor per section/i)).not.toBeInTheDocument();
    // Tidak boleh menjanjikan CV-nya bagus.
    expect(screen.queryByText(/sudah bagus|udah bagus/i)).not.toBeInTheDocument();
  });

  it("tidak error saat hasil kosong total", () => {
    renderPanel(null);
    expect(screen.getByText(/catatan dari sisi HR/i)).toBeInTheDocument();
  });

  it("satu risk factor rusak tidak menghapus dua yang valid", () => {
    // Sekarang item rusak dikirim langsung ke schema: satu severity salah
    // kapital atau null nyasar dulu bikin seluruh array gugur, lalu panel
    // mengklaim analisis tidak punya temuan.
    renderPanel(
      parsedResult({
        ats_prediction: {
          result: "Borderline",
          match_confidence: 60,
          risk_factors: [
            { text: "TypeScript tidak ada", severity: "critical", source_excerpt: "JavaScript, React" },
            { text: "Severity salah kapital", severity: "CRITICAL", source_excerpt: null },
            "Belum ada metrik angka",
            null,
          ],
          strengths: [],
        },
      }),
    );
    expect(screen.getByText("TypeScript tidak ada")).toBeInTheDocument();
    expect(screen.getByText("Belum ada metrik angka")).toBeInTheDocument();
    expect(screen.queryByText("Severity salah kapital")).not.toBeInTheDocument();
  });

  it("semua risk factor rusak: panel kosong dengan copy yang tidak mengklaim CV tanpa temuan", () => {
    renderPanel(
      parsedResult({
        ats_prediction: {
          result: "Borderline",
          match_confidence: 60,
          risk_factors: [{ text: "Severity salah kapital", severity: "CRITICAL", source_excerpt: null }, null, 42],
          strengths: [42, null],
        },
      }),
    );
    // Kalimat kosong harus menyatakan apa yang kembali dari analisis ini,
    // bukan mengklaim CV-nya tidak punya temuan.
    expect(
      screen.getByText("Belum ada catatan dari sisi HR. Catatan per bagian ada di bawah."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/tidak menghasilkan temuan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cv[^.!?]*(tidak|nggak)\b[^.!?]*temuan/i)).not.toBeInTheDocument();
  });

  it("level dan arah karier tetap tampil walau daftar temuan kosong", () => {
    renderPanel({
      meta: { detected_seniority: "lead" },
      careerVelocity: { title_progression: "Declining", growth_rate: "Slow" },
      atsPredictionDetail: { risk_factors: [], strengths: [] },
    });
    expect(screen.getByText(/catatan dari sisi HR/i)).toBeInTheDocument();
    expect(screen.getByText(/terbaca di level/i)).toBeInTheDocument();
    expect(screen.getByText(/turun/i)).toBeInTheDocument();
  });

  it("hanya laju karier yang ada, arahnya tidak dikarang", () => {
    renderPanel({ careerVelocity: { growth_rate: "Slow" } });
    const pace = screen.getByText(/laju karier/i);
    expect(pace).toHaveTextContent("Laju karier: pelan");
    expect(pace).not.toHaveTextContent("Arah karier");
  });

  it("meta null tidak mengarang baris level", () => {
    renderPanel(parsedResult({ meta: null }));
    expect(screen.queryByText(/terbaca di level/i)).not.toBeInTheDocument();
  });

  it("meta tanpa seniority tidak mengarang baris level", () => {
    renderPanel(parsedResult({ meta: { cv_word_count: 300 } }));
    expect(screen.queryByText(/terbaca di level/i)).not.toBeInTheDocument();
  });

  it("career_velocity tanpa arah dan laju tidak mengarang baris", () => {
    renderPanel(
      parsedResult({
        career_velocity: {
          time_in_role_analysis: "2 tahun di role yang sama",
          responsibility_arc: "Eksekusi task → ownership fitur",
          recommendations: [],
        },
      }),
    );
    expect(screen.queryByText(/arah karier/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/laju karier/i)).not.toBeInTheDocument();
  });

  it("hanya laju yang dikirim AI lewat schema, arahnya tidak ikut dikarang", () => {
    renderPanel(
      parsedResult({
        career_velocity: {
          time_in_role_analysis: "2 tahun di role yang sama",
          responsibility_arc: "Eksekusi task → ownership fitur",
          growth_rate: "Slow",
          recommendations: [],
        },
      }),
    );
    const pace = screen.getByText(/laju karier/i);
    expect(pace).toHaveTextContent("Laju karier: pelan");
    expect(screen.queryByText(/arah karier/i)).not.toBeInTheDocument();
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
    // Warnanya datang dari severityMeta yang dipakai kartu lain. Token yang
    // dikunci adalah token tema (error untuk kritis, netral untuk rendah),
    // bukan palet Tailwind mentah yang tidak berbalik di mode gelap.
    expect(critical.className).toContain("bg-error-container");
    expect(low.className).toContain("bg-surface-container-low");
  });

  it("menampilkan panel dalam bahasa Inggris", () => {
    localStorage.setItem("lang", "en");
    renderPanel(RESULT, "checker.detail.");
    expect(screen.getByText("The HR View")).toBeInTheDocument();
    expect(screen.getByText("What made me stop")).toBeInTheDocument();
    expect(screen.getByText("What made me keep reading")).toBeInTheDocument();
    expect(screen.getByText(/This CV reads at level/i)).toBeInTheDocument();
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
    expect(screen.getByText(/No notes from the HR side yet/i)).toBeInTheDocument();
    expect(screen.getByText(/below/i)).toBeInTheDocument();
    expect(screen.queryByText(/Scores per Section/i)).not.toBeInTheDocument();
  });
});

describe("kalimat keputusan panel", () => {
  it("menjawab ya saat tidak ada yang bikin berhenti", () => {
    renderPanel(
      parsedResult({
        ats_prediction: {
          result: "Likely Pass",
          risk_factors: [],
          strengths: [{ text: "Ada metrik dampak", source_excerpt: null }],
        },
      }),
    );
    expect(screen.getByText(/langsung lanjut baca/i)).toBeInTheDocument();
  });

  it("menjawab ya-tapi saat kedua sisi ada isinya", () => {
    renderPanel(RESULT);
    expect(screen.getByText(/tapi saya tetap lanjut baca/i)).toBeInTheDocument();
  });

  it("tidak menjanjikan kelanjutan saat hanya ada kabar buruk", () => {
    renderPanel(
      parsedResult({
        ats_prediction: {
          result: "Likely Fail",
          risk_factors: [{ text: "TypeScript tidak ada", severity: "critical", source_excerpt: null }],
          strengths: [],
        },
      }),
    );
    // Kolom kanan bilang tidak ada alasan lanjut, jadi keputusan tidak boleh
    // bilang tetap lanjut baca - itu akan menyesuaikan diri dengan data.
    expect(screen.queryByText(/tetap lanjut baca/i)).not.toBeInTheDocument();
    expect(screen.getByText(/bikin saya berhenti dulu/i)).toBeInTheDocument();
  });
});

describe("urutan di layar", () => {
  it("arah dan laju karier tampil sebelum daftar temuan, bukan di akhir panel", () => {
    renderPanel(RESULT);
const journey = screen.getByText(/Arah karier/i);
    const kolomKiri = screen.getByRole("heading", { name: /Yang bikin saya berhenti/i });
    const kolomKanan = screen.getByRole("heading", { name: /Yang bikin saya lanjut baca/i });
// Urutan DOM = urutan baca. Dulu baris karier menutup panel dengan
    // catatan terendah ("turun - pelan") tepat sebelum skor.
    const posisiKiri = journey.compareDocumentPosition(kolomKiri);
    const posisiKanan = journey.compareDocumentPosition(kolomKanan);
    expect(posisiKiri & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(posisiKanan & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("presentasi kutipan dan severity", () => {
  it("kutipan ditandai tanda kutip dan bukan monospace", () => {
    renderPanel(RESULT);
    const kutipan = screen.getByText(/JavaScript, React/);
    expect(kutipan.textContent).toMatch(/^\u201c.*\u201d$/);
    expect(kutipan.className).not.toContain("font-mono");
    expect(kutipan.className).toContain("italic");
  });

  it("severity jadi lencana, bukan kata yatim", () => {
    renderPanel(RESULT);
    const lencana = screen.getByText("Kritis");
    expect(lencana.className).toContain("inline-flex");
    expect(lencana.parentElement).not.toBeNull();
  });

it("lencana memakai label dan warna yang sama dengan kartu lain", () => {
    // severityMeta dipakai SectionScoreCard dan ResultComponents. Memakai
    // fungsi yang sama mencegah dua sumber kebenaran untuk 4 kata severity.
    const source = readFileSync("src/components/checker/HrPointOfView.tsx", "utf8");
    expect(source).toContain("severityMeta");
    expect(source).not.toContain("SEVERITY_LABEL");
  });
});
