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

  it("pagehide gagal → perubahan tetap belum tersimpan", async () => {
    fetchMock.mockImplementation(async () => ({ ok: false }) as Response);
    const { rerender, result } = renderHook(({ d }) => useAutoSave("x", d, true), {
      initialProps: { d: cv("A") },
    });
    rerender({ d: cv("B") });
    window.dispatchEvent(new Event("pagehide"));
    fetchMock.mockImplementation(async () => ({ ok: true }) as Response);
    let ok = false;
    await act(async () => {
      ok = await result.current.flush();
    });
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("flush menunggu PUT; gagal semua percobaan → false", async () => {
    fetchMock.mockImplementation(async () => ({ ok: false }) as Response);
    const { rerender, result } = renderHook(({ d }) => useAutoSave("x", d, true), {
      initialProps: { d: cv("A") },
    });
    rerender({ d: cv("B") });
    let ok: boolean | undefined;
    act(() => {
      void result.current.flush().then((v) => (ok = v));
    });
    await advance(15000);
    expect(ok).toBe(false);
  });

  it("updatedAt dari GET lalu diperbarui dari respons PUT", async () => {
    fetchMock.mockImplementation(async () => ({ ok: true, json: async () => ({ updatedAt: "2026-10-31T10:00:00.000Z" }) }) as Response);
    const { rerender, result } = renderHook(({ d }) => useAutoSave("x", d, true, "2026-10-31T09:00:00.000Z"), {
      initialProps: { d: cv("A") },
    });
    expect(result.current.getUpdatedAt()).toBe("2026-10-31T09:00:00.000Z");
    rerender({ d: cv("B") });
    await advance(2100);
    expect(result.current.getUpdatedAt()).toBe("2026-10-31T10:00:00.000Z");
  });
});

describe("useAutoSave — konflik & penolakan", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("kirim expectedUpdatedAt; 409 menghentikan autosave tanpa retry; timpa mengirim tanpa cek", async () => {
    const fetchMock = vi.fn(async (_u: string, _i: RequestInit) => ({ ok: false, status: 409 }) as Response);
    vi.stubGlobal("fetch", fetchMock);
    const { rerender, result } = renderHook(({ d }) => useAutoSave("x", d, true, "2026-10-31T09:00:00.000Z"), {
      initialProps: { d: cv("A") },
    });
    rerender({ d: cv("B") });
    await advance(20000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body)).expectedUpdatedAt).toBe("2026-10-31T09:00:00.000Z");
    expect(result.current.saveStatus).toBe("conflict");
    rerender({ d: cv("C") });
    await advance(5000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockImplementation(async () => ({ ok: true, status: 200, json: async () => ({ updatedAt: "2026-11-01T00:00:00.000Z" }) }) as unknown as Response);
    let ok = false;
    await act(async () => {
      ok = await result.current.overwrite();
    });
    expect(ok).toBe(true);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body)).expectedUpdatedAt).toBeUndefined();
    expect(result.current.saveStatus).toBe("saved");
  });

  it("413 tidak di-retry dan memberi pesan ukuran", async () => {
    const fetchMock = vi.fn(async (_u: string, _i: RequestInit) => ({ ok: false, status: 413 }) as Response);
    vi.stubGlobal("fetch", fetchMock);
    const { rerender, result } = renderHook(({ d }) => useAutoSave("x", d, true), { initialProps: { d: cv("A") } });
    rerender({ d: cv("B") });
    await advance(20000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.saveStatus).toBe("rejected");
    expect(result.current.errorMessage).toMatch(/200KB/);
  });
});
