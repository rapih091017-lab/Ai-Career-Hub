import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/toast";

vi.mock("motion/react", async () => (await import("./motion-stub.helpers")).motionStub());
vi.mock("@/hooks/useCoverLetterQuota", () => ({ useCoverLetterQuota: () => ({ isUnlimited: false, remaining: 1, limit: 1 }) }));

import { FieldHelp } from "@/components/builder/FieldHelp";
import { BulletEditor } from "@/components/builder/BulletEditor";
import { CustomSectionCard, UnusedSectionCard, RemoveSectionButton } from "@/components/builder/SectionControls";
import { SkillSection } from "@/components/builder/SkillSection";
import { EducationCard } from "@/components/builder/EducationCard";
import { ReviewStep } from "@/components/builder/ReviewStep";
import { DisplaySettingsModal } from "@/components/builder/DisplaySettingsModal";
import { AddSectionPanel } from "@/components/builder/AddSectionPanel";
import { PORTFOLIO_HELP } from "@/lib/portfolio-help";
import { HiddenNote } from "@/components/portfolio/builder/BuilderEditor";
import { hiddenEntryNote } from "@/lib/portfolio/visibility";
import { BUILDER_HELP } from "@/lib/builder-help";
import type { CvData } from "@/components/cv-templates";

/**
 * Saat bahasa UI = English, komponen kunci tidak boleh memuat kata Indonesia
 * umum. Teks diambil dari markup (textContent + atribut yang dibaca orang).
 */
const INDONESIAN = /\b(Tambah|Hapus|Simpan|bagian|Bagian|Batal|Tutup|Pilih|Belum|Tampilkan|Sembunyikan|Keahlian|Pendidikan|Pengalaman|Sertifikasi|Contoh|Judul|Isi|Urungkan|Pindah|Seret|poin|Poin|tidak|sudah|Gagal)\b/;

function englishText(container: HTMLElement): string {
  const attrs = Array.from(container.querySelectorAll("[aria-label],[title],[placeholder],[alt]"))
    .flatMap((el) => ["aria-label", "title", "placeholder", "alt"].map((a) => el.getAttribute(a) ?? ""));
  return [container.textContent ?? "", ...attrs].join(" \n ");
}

async function renderEn(ui: ReactNode) {
  const view = render(<LanguageProvider><ToastProvider>{ui}</ToastProvider></LanguageProvider>, { container: document.body.appendChild(document.createElement("div")) });
  // LanguageProvider membaca pilihan dari localStorage di effect.
  await waitFor(() => expect(document.documentElement.lang).toBe("en"));
  return view;
}

const noop = () => {};

beforeEach(() => {
  localStorage.setItem("lang", "en");
});
afterEach(() => {
  cleanup();
  localStorage.removeItem("lang");
  document.documentElement.lang = "";
});

describe("UI berbahasa Inggris tanpa teks Indonesia mentah", () => {
  it("html lang mengikuti bahasa UI", async () => {
    await renderEn(<span>x</span>);
    expect(document.documentElement.lang).toBe("en");
  });

  it("FieldHelp builder dan portofolio", async () => {
    const { container } = await renderEn(
      <>
        <FieldHelp topic="summary" />
        <FieldHelp topic={PORTFOLIO_HELP.heroBio} />
      </>,
    );
    expect(container.querySelector('[data-field-help="summary"]')).toHaveAttribute("aria-label", "Help: Professional summary");
    expect(englishText(container)).not.toMatch(INDONESIAN);
  });

  it("BulletEditor dan kontrol section", async () => {
    const { container } = await renderEn(
      <>
        <BulletEditor label="Duties" value={"First\nSecond"} onChange={noop} mode="bullets" onModeChange={noop} />
        <RemoveSectionButton label="Awards" onRemove={noop} />
        <UnusedSectionCard label="Awards" onRestore={noop} hasContent onPurge={noop} />
        <CustomSectionCard section={{ id: "cs1", title: "", content: "", contentType: "bullets" }} onChange={noop} onRemove={noop} />
      </>,
    );
    expect(englishText(container)).not.toMatch(INDONESIAN);
  });

  it("SkillSection, EducationCard, AddSectionPanel", async () => {
    const { container } = await renderEn(
      <>
        <SkillSection
          skills={[{ id: "s1", name: "Excel", category: "tools", level: "intermediate" }]}
          certifications={[{ id: "c1", name: "", issuer: "", year: "" }]}
          lainnyaContent=""
          lainnyaTitle=""
          onLainnyaTitleChange={noop}
          selfEvaluation=""
          onSkillChange={noop}
          onSkillRemove={noop}
          onSkillAdd={noop}
          onCertChange={noop}
          onCertRemove={noop}
          onCertAdd={noop}
          onLainnyaChange={noop}
          onSelfEvaluationChange={noop}
          onRemoveSection={noop}
        />
        <EducationCard
          edu={{ id: "e1", institution: "", degree: "", field: "", startDate: "", endDate: "" }}
          index={0}
          totalItems={2}
          onUpdate={noop}
          onRemove={noop}
          onMoveUp={noop}
          onMoveDown={noop}
          onToggleVisibility={noop}
        />
        <AddSectionPanel unused={[{ key: "certifications", label: "Certifications", hasContent: true }]} onRestore={noop} onAddCustom={noop} customCount={0} existingTitles={[]} />
      </>,
    );
    const text = englishText(container);
    expect(text).not.toMatch(INDONESIAN);
    // Judul cepat ikut bahasa UI.
    expect(text).toContain("Awards");
  });

  it("ReviewStep dan DisplaySettingsModal", async () => {
    const cv = { fullName: "A", workHistory: [], education: [], organisations: [], skills: [] } as unknown as CvData;
    const { container } = await renderEn(
      <>
        <ReviewStep cvData={cv} sectionCompletion={[]} customSections={[]} cvId="cv1" />
        <DisplaySettingsModal
          open
          customPrimaryColor=""
          spacingMode="normal"
          headerLayout="centered"
          marginMode="normal"
          sectionVisibility={{}}
          showSkillLevel={false}
          onClose={noop}
          onPrimaryColorChange={noop}
          onSpacingModeChange={noop}
          onHeaderLayoutChange={noop}
          onMarginModeChange={noop}
          onSectionVisibilityChange={noop}
          onShowSkillLevelChange={noop}
        />
      </>,
    );
    // Modal dirender lewat portal ke body.
    expect(englishText(document.body)).not.toMatch(INDONESIAN);
    expect(container).toBeTruthy();
  });

  it("catatan portofolio tersembunyi dan data bantuan berbahasa Inggris", async () => {
    const { container } = await renderEn(<HiddenNote>{hiddenEntryNote("project", "en")}</HiddenNote>);
    expect(englishText(container)).not.toMatch(INDONESIAN);
    for (const h of Object.values(BUILDER_HELP)) {
      expect(h.en, h.title).toBeDefined();
      expect([h.en!.title, h.en!.what, h.en!.weakWhy].join(" ")).not.toMatch(INDONESIAN);
    }
  });
});
