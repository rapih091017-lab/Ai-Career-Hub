import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { useUndoGuard } from "@/hooks/useUndoGuard";

function useField() {
  const [v, setV] = useState("asli");
  const guard = useUndoGuard(v);
  return { v, setV, guard };
}

describe("Urungkan hasil AI", () => {
  it("boleh selama nilai masih hasil terima", () => {
    const { result } = renderHook(() => useField());
    let unchanged!: () => boolean;
    act(() => {
      result.current.setV("hasil AI");
      unchanged = result.current.guard.markApplied();
    });
    expect(unchanged()).toBe(true);
  });

  it("ditolak bila kolom sudah diedit setelah diterima", () => {
    const { result } = renderHook(() => useField());
    let unchanged!: () => boolean;
    act(() => {
      result.current.setV("hasil AI");
      unchanged = result.current.guard.markApplied();
    });
    act(() => result.current.setV("hasil AI + editan"));
    expect(unchanged()).toBe(false);
  });
});
