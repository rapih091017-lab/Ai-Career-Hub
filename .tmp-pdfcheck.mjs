import puppeteer from "puppeteer-core";

const CHROME =
  "C:/Users/Acer/.cache/puppeteer/chrome/win64-150.0.7871.24/chrome-win64/chrome.exe";

const url = process.argv[2] || "http://localhost:3001/pdf-test";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
});

try {
  const page = await browser.newPage();
  page.on("console", (m) => console.log("[console]", m.type(), m.text().slice(0, 500)));
  page.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 800)));
  page.on("requestfailed", (r) =>
    console.log("[requestfailed]", r.url().slice(0, 200), r.failure()?.errorText)
  );

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  try {
    await page.waitForFunction(
      () =>
        document.body.innerText.includes("done:") ||
        document.body.innerText.includes("error:"),
      { timeout: 90000, polling: 500 }
    );
  } catch {
    console.log("[warn] timed out waiting for terminal status");
  }

  const text = await page.evaluate(() => document.body.innerText);
  console.log("=== PAGE TEXT ===");
  console.log(text);
} finally {
  await browser.close();
}
