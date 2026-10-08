/**
 * OCR di browser memakai tesseract.js. Semua aset (worker, core wasm, data
 * bahasa) di-host lokal di /tesseract dan /tessdata: tidak ada fetch ke CDN
 * eksternal dan tidak bergantung pada server (cold start + batas fungsi).
 * Dipakai checker dan modal import profil.
 */

export interface OcrMsgs {
  preparing: string;
  core: string;
  lang: string;
  init: string;
  reading: (p: number) => string;
  page: (i: number, total: number) => string;
}

/** Pesan status default (Bahasa Indonesia); call site bisa mengirim terjemahan. */
export const DEFAULT_OCR_MSGS: OcrMsgs = {
  preparing: "Menyiapkan mesin OCR...",
  core: "Memuat mesin OCR...",
  lang: "Memuat kamus bahasa (sekali saja)...",
  init: "Menginisialisasi OCR...",
  reading: (p) => `Membaca teks... ${p}%`,
  page: (i, total) => `Membaca halaman ${i}/${total}...`,
};

export async function runClientOcr(
  inputs: Array<Blob | File>,
  onStatus: (status: string) => void,
  msgs: OcrMsgs = DEFAULT_OCR_MSGS,
): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  onStatus(msgs.preparing);
  const worker = await createWorker("eng+ind", 1 /* OEM.LSTM_ONLY */, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract/",
    langPath: "/tessdata/",
    logger: (m: any) => {
      if (!m || !m.status) return;
      const status = String(m.status);
      if (status === "recognizing text" && typeof m.progress === "number") {
        onStatus(msgs.reading(Math.round(m.progress * 100)));
      } else if (status === "loading tesseract core") {
        onStatus(msgs.core);
      } else if (status === "loading language traineddata") {
        onStatus(msgs.lang);
      } else if (status === "initializing tesseract") {
        onStatus(msgs.init);
      }
    },
  });

  try {
    const parts: string[] = [];
    for (let i = 0; i < inputs.length; i++) {
      if (inputs.length > 1) onStatus(msgs.page(i + 1, inputs.length));
      const { data } = await worker.recognize(inputs[i]);
      parts.push((data.text || "").trim());
    }
    return parts.join("\n\n").trim();
  } finally {
    try {
      await worker.terminate();
    } catch {}
  }
}
