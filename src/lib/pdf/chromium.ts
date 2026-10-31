import type { Browser } from "puppeteer-core";

/**
 * Luncurkan headless Chromium untuk mencetak PDF di server.
 *
 * Di Vercel/Linux, @sparticuz/chromium mengekstrak binary Lambda-nya.
 * Di dev Windows/macOS, binari itu tidak bisa jalan; pakai browser lokal
 * yang terpasang (Edge/Chrome) supaya hasilnya sama-sama PDF teks.
 * PENTING: args @sparticuz (single-process dsb) membuat Chromium desktop
 * crash "Target closed" saat printToPDF, jadi browser lokal memakai args
 * minimal miliknya sendiri.
 *
 * Pemanggil wajib menutup browser (`browser.close()`) di blok finally.
 */
export async function launchPdfBrowser(): Promise<Browser> {
  const [{ default: puppeteer }, chromiumMod] = await Promise.all([
    import("puppeteer-core"),
    import("@sparticuz/chromium"),
  ]);
  const chromium = chromiumMod.default;
  const localBrowserPath = await resolveLocalBrowserPath();
  return puppeteer.launch({
    args: localBrowserPath
      ? ["--no-sandbox", "--disable-gpu", "--font-render-hinting=none"]
      : [...chromium.args, "--font-render-hinting=none"],
    executablePath: localBrowserPath ?? (await chromium.executablePath()),
    headless: true,
  });
}

/** Cari browser Chromium lokal untuk mode pengembangan (non-Vercel).
 * Urutan: env PDF_CHROME_PATH → Edge → Chrome. Return null di Linux agar
 * jalur @sparticuz/chromium tetap dipakai di Vercel. */
export async function resolveLocalBrowserPath(): Promise<string | null> {
  if (process.env.PDF_CHROME_PATH) return process.env.PDF_CHROME_PATH;
  if (process.platform !== "win32" && process.platform !== "darwin") return null;

  const { access } = await import("node:fs/promises");
  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        ]
      : [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // lanjut ke kandidat berikutnya
    }
  }
  return null;
}

/**
 * Cetak HTML mandiri ke PDF A4. Ukuran & margin halaman diambil dari CSS
 * (`@page`). Semua permintaan jaringan diblokir kecuali data: dan about:,
 * jadi HTML hanya bisa memakai aset yang sudah disematkan.
 */
export async function printStandaloneHtml(html: string): Promise<Uint8Array> {
  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();
      if (url.startsWith("data:") || url.startsWith("about:")) void req.continue();
      else void req.abort();
    });
    await page.setContent(html, { waitUntil: "load", timeout: 45_000 });
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({ printBackground: true, preferCSSPageSize: true });
  } finally {
    // Selalu tutup browser, di serverless instance menggantung = memori bocor
    await browser.close().catch(() => {});
  }
}
