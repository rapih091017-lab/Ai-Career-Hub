import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen, renderHook, waitFor } from "@testing-library/react";
import { useRef, useState } from "react";
import { PanelSplitter, clampSplit, usePanelSplit } from "@/components/builder/PanelSplitter";

function Harness() {
  const [v, setV] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref}>
      <PanelSplitter value={v} onChange={setV} containerRef={ref} />
    </div>
  );
}

describe("splitter panel builder", () => {
  beforeEach(() => localStorage.clear());

  it("panah kiri/kanan 5%, batas 30–70, dobel klik 50%", () => {
    render(<Harness />);
    const sep = screen.getByRole("separator");
    expect(sep).toHaveAttribute("aria-valuenow", "50");
    fireEvent.keyDown(sep, { key: "ArrowRight" });
    expect(sep).toHaveAttribute("aria-valuenow", "55");
    for (let i = 0; i < 10; i++) fireEvent.keyDown(sep, { key: "ArrowLeft" });
    expect(sep).toHaveAttribute("aria-valuenow", "30");
    fireEvent.keyDown(sep, { key: "End" });
    expect(sep).toHaveAttribute("aria-valuenow", "70");
    fireEvent.doubleClick(sep);
    expect(sep).toHaveAttribute("aria-valuenow", "50");
  });

  it("clamp & simpan ke localStorage", async () => {
    expect(clampSplit(10)).toBe(30);
    expect(clampSplit(99)).toBe(70);
    localStorage.setItem("builder_split_pct", "64");
    const { result } = renderHook(() => usePanelSplit());
    await waitFor(() => expect(result.current[0]).toBe(64));
    localStorage.setItem("builder_split_pct", "5");
    const { result: r2 } = renderHook(() => usePanelSplit());
    expect(r2.current[0]).toBe(50);
  });
});
