/**
 * OCR utility — extract text from images using Tesseract.js.
 *
 * Thread-safe: uses a processing queue (promise chain) so concurrent
 * requests don't race on the same worker.
 *
 * Timeout-safe: no Promise.race — let the HTTP timeout handle hangs.
 */

import type { Worker } from "tesseract.js";

let workerPromise: Promise<Worker> | null = null;
let processingQueue = Promise.resolve(); // mutex-like serial queue

/**
 * Initialize or get cached Tesseract.js worker.
 * Worker is created once and reused across all requests (singleton).
 * Language: eng+ind (English + Indonesian).
 */
async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker("eng+ind", 1, {
        langPath: "/tmp/tessdata",
        // Logger — hanya di development
        logger:
          process.env.NODE_ENV === "development"
            ? (m: any) => {
                if (m.status === "recognizing")
                  console.log(`[ocr] ${Math.round(m.progress * 100)}%`);
              }
            : undefined,
      });
      console.log("[ocr] Worker created (eng+ind)");
      return worker;
    })();
  }
  return workerPromise;
}

/**
 * Jalankan OCR pada satu buffer gambar.
 * Requests diproses secara serial (queue) untuk menghindari race condition
 * pada singleton worker.
 */
export async function ocrImage(imageBuffer: ArrayBuffer | Buffer): Promise<string> {
  const buf = Buffer.isBuffer(imageBuffer) ? imageBuffer : Buffer.from(imageBuffer);

  // Queue processing untuk thread safety
  const result = await new Promise<string>((resolve, reject) => {
    processingQueue = processingQueue.then(async () => {
      try {
        const worker = await getWorker();
        const { data } = await worker.recognize(buf);
        resolve((data.text || "").trim());
      } catch (err) {
        reject(err);
      }
    });
  });

  return result;
}

/**
 * Terminate worker (panggil saat server shutdown / cleanup).
 */
export async function terminateOcrWorker() {
  if (workerPromise) {
    try {
      const worker = await workerPromise;
      await worker.terminate();
    } catch {}
    workerPromise = null;
    console.log("[ocr] Worker terminated");
  }
}
