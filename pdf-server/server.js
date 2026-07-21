/**
 * pdf-server — Puppeteer-based PDF generation service.
 *
 * Accepts HTML content via POST, renders with headless Chrome,
 * and returns an ATS-friendly, text-selectable PDF.
 *
 * Usage:
 *   POST /generate-pdf
 *   Body: { html: "<!DOCTYPE html>...", margin?: "10mm", fileName?: "CV.pdf" }
 *
 * Run: node server.js (default port 3001)
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Railway: use puppeteer-core + system Chromium via PUPPETEER_EXECUTABLE_PATH
// Local dev: use full puppeteer (downloads its own Chromium)
const useSystemChrome = !!process.env.PUPPETEER_EXECUTABLE_PATH;
const puppeteer = useSystemChrome ? require("puppeteer-core") : require("puppeteer");

console.log(`[pdf] Mode: ${useSystemChrome ? "Railway (system Chromium)" : "Local (bundled Chromium)"}`);

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PDF_SERVER_PORT || 3001;
const TMP_DIR = path.join(__dirname, "tmp");

// Ensure tmp dir exists
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// ── Cleanup old temp files every hour ──
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour
  try {
    const files = fs.readdirSync(TMP_DIR);
    for (const file of files) {
      const filePath = path.join(TMP_DIR, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile() && stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.error("[cleanup] Error:", err.message);
  }
}, 60 * 60 * 1000).unref();

// ── Browser instance (lazy init) ──
let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    const launchOpts = {
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--font-render-hinting=none",
      ],
    };
    // Railway: point to system-installed Chromium
    if (useSystemChrome) {
      launchOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    browserPromise = puppeteer.launch(launchOpts);
  }
  return browserPromise;
}

// ── Health check ──
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── Generate PDF ──
app.post("/generate-pdf", async (req, res) => {
  const startTime = Date.now();

  try {
    const { html, margin = "20mm", fileName = "document.pdf" } = req.body;

    if (!html || typeof html !== "string") {
      return res.status(400).json({ error: "Field 'html' is required and must be a string." });
    }

    // ── Construct full HTML document ──
    // Wrap raw HTML with Tailwind CDN + Material Symbols + Geist fonts
    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page {
      size: A4 portrait;
      margin: ${margin};
    }
    @media print {
      body { background: white; }
    }
    body {
      font-family: 'Inter', 'Geist', sans-serif;
      background: white;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* A4 container */
    .a4-page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 0;
      background: white;
    }
    /* Ensure images and SVGs are crisp */
    svg, img {
      shape-rendering: geometricPrecision;
    }
    /* Prevent page breaks inside sections */
    section, .cv-section {
      page-break-inside: avoid;
    }
    /* Optimize for text readability */
    p, li, span, div {
      orphans: 3;
      widows: 3;
    }
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
</head>
<body>
  ${html}
</body>
</html>`;

    // ── Write temp file ──
    const tmpId = crypto.randomBytes(8).toString("hex");
    const tmpFile = path.join(TMP_DIR, `${tmpId}.html`);
    fs.writeFileSync(tmpFile, fullHtml, "utf-8");

    // ── Render with Puppeteer ──
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      // Set content via file:// URL for proper asset loading
      await page.goto(`file://${tmpFile.replace(/\\/g, "/")}`, {
        waitUntil: "networkidle0",
        timeout: 30_000,
      });

      // Wait for fonts to load
      await page.evaluate(() => document.fonts.ready);
      // Extra settle time for layout
      await new Promise((r) => setTimeout(r, 200));

      // ── Generate PDF ──
      const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
          top: margin,
          right: margin,
          bottom: margin,
          left: margin,
        },
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
      });

      // ── Send response ──
      const elapsed = Date.now() - startTime;
      console.log(`[pdf] Generated ${(pdfBuffer.length / 1024).toFixed(1)}KB in ${elapsed}ms — ${fileName}`);

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Content-Length": pdfBuffer.length,
        "X-Generation-Time": `${elapsed}ms`,
      });
      res.send(pdfBuffer);
    } finally {
      await page.close();
      // Cleanup temp file
      try {
        fs.unlinkSync(tmpFile);
      } catch (_) {
        /* ignore */
      }
    }
  } catch (error) {
    console.error("[pdf] Error:", error.message);
    res.status(500).json({
      error: "PDF_GENERATION_FAILED",
      message: error.message,
    });
  }
});

// ── Start server ──
// Railway: listen on 0.0.0.0 (required for container networking)
// Local:   listen on 127.0.0.1 (local only, secure)
const HOST = process.env.RAILWAY_PUBLIC_DOMAIN ? "0.0.0.0" : "127.0.0.1";
app.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log(`📄 PDF Server running on ${url}`);
  console.log(`   POST /generate-pdf  —  { html, margin?, fileName? }`);
  console.log(`   GET  /health        —  health check`);
  if (useSystemChrome) {
    console.log(`   Chromium: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
  }
});
