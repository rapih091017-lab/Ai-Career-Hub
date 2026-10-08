import puppeteer from "puppeteer-core";

const CHROME =
  "C:/Users/Acer/.cache/puppeteer/chrome/win64-150.0.7871.24/chrome-win64/chrome.exe";

const url = process.argv[2];
const headed = process.argv[3] === "headed";
const tag = process.argv[4] || "page";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: !headed,
  ignoreDefaultArgs: ["--enable-automation"],
  userDataDir: headed ? "D:/tmp/teal-profile" : undefined,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-blink-features=AutomationControlled",
    "--window-size=1512,950",
  ],
  defaultViewport: { width: 1512, height: 950 },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });

  // give Cloudflare interstitial time to clear in headed mode
  for (let i = 0; i < 12; i++) {
    await sleep(2500);
    const t = await page.title().catch(() => "");
    const body = await page.evaluate(() => document.body.innerText.slice(0, 200)).catch(() => "");
    if (!/Cloudflare|Attention Required|Just a moment|blocked/i.test(t + body)) break;
    console.log(`[wait ${i}] title=${t}`);
  }

  console.log("URL:", page.url());
  console.log("TITLE:", await page.title());
  const text = await page.evaluate(() => document.body.innerText);
  console.log("=== PAGE TEXT (first 4000) ===");
  console.log(text.slice(0, 4000));
  const inputs = await page.evaluate(() =>
    [...document.querySelectorAll("input,button,a")].slice(0, 50).map((el) => ({
      tag: el.tagName,
      type: el.getAttribute("type"),
      name: el.getAttribute("name"),
      text: (el.innerText || el.getAttribute("placeholder") || "").trim().slice(0, 60),
      href: el.getAttribute("href")?.slice(0, 80),
    }))
  );
  console.log("=== INPUTS/BUTTONS ===");
  console.log(JSON.stringify(inputs, null, 1));
  await page.screenshot({ path: `D:/tmp/teal-${tag}.png` });
  console.log("screenshot:", `D:/tmp/teal-${tag}.png`);
  console.log("FINAL_URL:", page.url());
} finally {
  await browser.close();
}
