import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { useBuilderFormat } from "@/hooks/useBuilderFormat";
import type { CvData } from "@/components/cv-templates";
import { sampleCv } from "./cv-pdf.fixture";

function useHarness(initial: CvData, flush?: () => Promise<boolean>) {
  const [cvData, setCvData] = useState(initial);
  const format = useBuilderFormat({ cvId: "a", cvData, setCvData, ready: true, templateId: "industrial-pro", flush });
  return { cvData, format };
}

describe("useBuilderFormat — layout di cvData", () => {
  beforeEach(() => localStorage.clear());

  it("CV tanpa layout memakai nilai lama builder dan tidak membuat layout", () => {
    const { result } = renderHook(() => useHarness({ ...sampleCv, layout: undefined }));
    expect(result.current.format.fontSize).toBe(11);
    expect(result.current.format.fontFamily).toBe("'Inter', sans-serif");
    expect(result.current.cvData.layout).toBeUndefined();
  });

  it("setter menulis ke cvData.layout", () => {
    const { result } = renderHook(() => useHarness({ ...sampleCv, layout: undefined }));
    act(() => result.current.format.setFontSize(13));
    expect(result.current.cvData.layout?.fontSize).toBe(13);
    // Nilai lain diawali dari nilai lama, jadi tampilan tidak berubah.
    expect(result.current.cvData.layout?.fontFamily).toBe("'Inter', sans-serif");
  });

  it("migrasi sekali dari localStorage, key dihapus setelah tersimpan", async () => {
    localStorage.setItem(
      "cv_fmt_a",
      JSON.stringify({ fontSize: 14, marginMode: "wide", customSections: [{ id: "lainnya", title: "Lainnya", content: "Juara 1" }] }),
    );
    const flush = vi.fn(async () => true);
    const { result } = renderHook(() => useHarness({ ...sampleCv, layout: undefined, customSections: undefined }, flush));
    await waitFor(() => expect(result.current.cvData.layout?.fontSize).toBe(14));
    expect(result.current.cvData.layout?.marginMode).toBe("wide");
    expect(result.current.cvData.customSections?.[0].content).toBe("Juara 1");
    await waitFor(() => expect(localStorage.getItem("cv_fmt_a")).toBeNull());
    expect(flush).toHaveBeenCalled();
  });

  it("key lama tidak dihapus bila simpan gagal", async () => {
    localStorage.setItem("cv_fmt_a", JSON.stringify({ fontSize: 14 }));
    const flush = vi.fn(async () => false);
    const { result } = renderHook(() => useHarness({ ...sampleCv, layout: undefined }, flush));
    await waitFor(() => expect(result.current.cvData.layout?.fontSize).toBe(14));
    await waitFor(() => expect(flush).toHaveBeenCalled());
    expect(localStorage.getItem("cv_fmt_a")).not.toBeNull();
  });

  it("layout di server menang atas localStorage; key lama dibuang", async () => {
    localStorage.setItem("cv_fmt_a", JSON.stringify({ fontSize: 14 }));
    const { result } = renderHook(() => useHarness({ ...sampleCv, layout: { fontSize: 9 } }));
    await waitFor(() => expect(localStorage.getItem("cv_fmt_a")).toBeNull());
    expect(result.current.format.fontSize).toBe(9);
  });

  it("toggle global garis menghapus override per section", () => {
    const { result } = renderHook(() => useHarness({ ...sampleCv, layout: { dividers: { skills: true } } }));
    act(() => result.current.format.toggleDivider("education"));
    expect(result.current.cvData.layout?.dividers).toEqual({ skills: true, education: true });
    act(() => result.current.format.setShowDividers(true));
    expect(result.current.cvData.layout?.dividers).toEqual({});
    expect(result.current.cvData.layout?.showDividers).toBe(true);
  });

  it("kembalikan ke gaya template menghapus font/ukuran/rata/warna saja", () => {
    const { result } = renderHook(() =>
      useHarness({ ...sampleCv, layout: { fontFamily: "Arial", fontSize: 12, textAlign: "justify", primaryColor: "#ff0000", marginMode: "wide" } }),
    );
    act(() => result.current.format.resetToTemplateStyle());
    expect(result.current.cvData.layout).toEqual({ marginMode: "wide" });
    expect(result.current.format.fontFamily).toContain("CV Carlito");
  });
});
