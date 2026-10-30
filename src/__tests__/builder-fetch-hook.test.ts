import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFetchCvData } from "@/hooks/useFetchCvData";

describe("useFetchCvData — AbortController", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("respons CV lama yang terlambat tidak menimpa CV yang sedang dibuka", async () => {
    const resolvers: Record<string, (v: Response) => void> = {};
    const signals: Record<string, AbortSignal> = {};
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init: RequestInit) => {
        const id = url.split("/").pop()!;
        signals[id] = init.signal!;
        return new Promise<Response>((r) => (resolvers[id] = r));
      }),
    );
    const res = (name: string) =>
      ({ ok: true, status: 200, json: async () => ({ tailoredContent: { fullName: name } }) }) as Response;

    const { result, rerender } = renderHook(({ id }) => useFetchCvData(id), { initialProps: { id: "a" } });
    rerender({ id: "b" });
    expect(signals.a.aborted).toBe(true);
    resolvers.b(res("B"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    resolvers.a(res("A"));
    await new Promise((r) => setTimeout(r, 10));
    expect(result.current.cvData.fullName).toBe("B");
  });
});
