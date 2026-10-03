import { chromium } from "playwright";
async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.goto("http://127.0.0.1:3001/", { waitUntil: "networkidle" });
    const before = await page
      .locator(".refresh-bar")
      .getAttribute("data-generation");
    console.log("Already-open page generation:", before);
    await page.waitForFunction(
      (old) => {
        const generation = document
          .querySelector(".refresh-bar")
          ?.getAttribute("data-generation");
        return Boolean(generation && generation !== old);
      },
      before,
      { timeout: 150000 },
    );
    const cards = await page.locator("a.game-card").allTextContents();
    if (
      !cards.some(
        (card) =>
          card.includes("Marco Hoesli") && card.includes("Kim Schwaller"),
      )
    )
      throw new Error(
        "Current Prestige game disappeared during automatic refresh",
      );
    await page.screenshot({
      path: "docs/previews/current-scores-auto-refresh.png",
      fullPage: true,
    });
    console.log(
      "Automatic real publication refresh:",
      await page.locator(".refresh-bar").getAttribute("data-generation"),
      "game cards:",
      cards.length,
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
