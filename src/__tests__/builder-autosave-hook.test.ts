import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "@/hooks/useAutoSave";
import type { CvData } from "@/components/cv-templates";

const cv = (fullName: string) => ({ fullName }) as CvData;

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("useAutoSave", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn(async () => ({ ok: true }) as Response);
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("tidak mengirim PUT saat data selesai dimuat", async () => {
    const { rerender } = renderHook(({ d, on }) => useAutoSave("x", d, on), {
      initialProps: { d: cv(""), on: false },
    });
    rerender({ d: cv("Budi"), on: true });
    await advance(5000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mengirim tailoredContent setelah user mengubah data", async () => {
    const { rerender, result } = renderHook(({ d }) => useAutoSave("x", d, true), {
      initialProps: { d: cv("Budi") },
    });
    rerender({ d: cv("Budi S") });
    await advance(2100);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({ tailoredContent: { fullName: "Budi S" } });
    expect(result.current.saveStatus).toBe("saved");
  });

  it("gagal → coba ulang 3x (2/4/8 dtk), status error bertahan sampai berhasil", async () => {
    fetchMock.mockImplementation(async () => ({ ok: false }) as Response);
    const { rerender, result } = renderHook(({ d }) => useAutoSave("x", d, true), {
      initialProps: { d: cv("A") },
    });
    rerender({ d: cv("B") });
    await advance(2000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advance(2000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await advance(4000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await advance(8000);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(result.current.saveStatus).toBe("error");
    await advance(10000);
    expect(result.current.saveStatus).toBe("error");

    // Perubahan berikutnya: masih dianggap belum tersimpan, error tetap tampil sampai sukses.
    fetchMock.mockImplementation(async () => ({ ok: true }) as Response);
    rerender({ d: cv("C") });
    await advance(2000);
    expect(result.current.saveStatus).toBe("saved");
  });

  it("flush dengan keepalive saat unmount bila ada perubahan belum terkirim", async () => {
    const { rerender, unmount } = renderHook(({ d }) => useAutoSave("x", d, true), {
      initialProps: { d: cv("A") },
    });
    rerender({ d: cv("B") });
    unmount();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0][1] as RequestInit).keepalive).toBe(true);
  });

  it("flush saat pagehide", async () => {
    const { rerender } = renderHook(({ d }) => useAutoSave("x", d, true), {
      initialProps: { d: cv("A") },
    });
    rerender({ d: cv("B") });
    window.dispatchEvent(new Event("pagehide"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advance(3000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
