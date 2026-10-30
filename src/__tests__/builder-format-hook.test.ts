import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useBuilderFormat } from "@/hooks/useBuilderFormat";

// Effect simpan dulu jalan sebelum effect muat sehingga format tersimpan
// tertimpa nilai default di render pertama.
describe("useBuilderFormat — muat sebelum simpan", () => {
  beforeEach(() => localStorage.clear());

  it("tidak menimpa format tersimpan dengan nilai default", async () => {
    localStorage.setItem("cv_fmt_a", JSON.stringify({ fontSize: 14, marginMode: "wide" }));
    const { result } = renderHook(() => useBuilderFormat({ cvId: "a" }));
    await waitFor(() => expect(result.current.fontSize).toBe(14));
    expect(result.current.marginMode).toBe("wide");
    const saved = JSON.parse(localStorage.getItem("cv_fmt_a")!);
    expect(saved.fontSize).toBe(14);
    expect(saved.marginMode).toBe("wide");
  });

  it("data rusak diabaikan dan default tetap dipakai", async () => {
    localStorage.setItem("cv_fmt_b", "{rusak");
    const { result } = renderHook(() => useBuilderFormat({ cvId: "b" }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem("cv_fmt_b")!).fontSize).toBe(11));
    expect(result.current.fontSize).toBe(11);
  });
});
