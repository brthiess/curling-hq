import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { join } from "node:path";
async function main() {
  const base = "http://127.0.0.1:3002";
  const crawler = join(process.cwd(), "..", "curling-crawler-ai");
  const root =
    process.env.HQ_LIVE_TEST_ROOT ??
    join(process.env.TEMP!, "curling-hq-live-20261003");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.install();
    const path = "/games/" + encodeURIComponent("src:cz:game:8886:10:362808");
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.waitForFunction(
      () =>
        !document
          .querySelector(".refresh-bar")
          ?.textContent?.includes("Checking"),
    );
    const old = await page
      .locator(".refresh-bar")
      .getAttribute("data-generation");
    assert.equal(
      await page.locator(".match-side strong").first().innerText(),
      "9",
    );
    await page.evaluate(() => window.scrollTo(0, 400));
    const scroll = await page.evaluate(() => window.scrollY);
    execFileSync(
      "python",
      ["tests/live_browser_fixture.py", "advance", "--root", root],
      { cwd: crawler, stdio: "pipe" },
    );
    await page.clock.runFor(60_000);
    await page.waitForFunction(
      () => document.querySelector(".match-side strong")?.textContent === "8",
    );
    assert.notEqual(
      await page.locator(".refresh-bar").getAttribute("data-generation"),
      old,
    );
    assert.ok(
      Math.abs((await page.evaluate(() => window.scrollY)) - scroll) < 3,
    );
    const second = await page
      .locator(".refresh-bar")
      .getAttribute("data-generation");
    const search = await browser.newPage();
    await search.clock.install();
    await search.goto(base + "/search?q=Kerry", { waitUntil: "networkidle" });
    const searchGen = await search
      .locator(".refresh-bar")
      .getAttribute("data-generation");
    const editing = await browser.newPage();
    await editing.clock.install();
    await editing.goto(
      base +
        "/events/" +
        encodeURIComponent("src:cz:event:8886") +
        "?state=completed&entry_id=" +
        encodeURIComponent("src:cz:entry:8886:190490"),
      { waitUntil: "networkidle" },
    );
    const editGen = await editing
      .locator(".refresh-bar")
      .getAttribute("data-generation");
    await editing.locator("#state").selectOption("open");
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    execFileSync(
      "python",
      [
        "tests/live_browser_fixture.py",
        "advance",
        "--root",
        root,
        "--score",
        "7",
      ],
      { cwd: crawler, stdio: "pipe" },
    );
    await page.clock.runFor(120_000);
    assert.equal(
      await page.locator(".refresh-bar").getAttribute("data-generation"),
      second,
    );
    await editing.clock.runFor(60_000);
    assert.equal(
      await editing.locator(".refresh-bar").getAttribute("data-generation"),
      editGen,
    );
    assert.equal(await editing.locator("#state").inputValue(), "open");
    await search.clock.runFor(60_000);
    await search.getByRole("button", { name: "Update scores" }).waitFor();
    assert.equal(
      await search.locator(".refresh-bar").getAttribute("data-generation"),
      searchGen,
    );
    await search.getByRole("button", { name: "Update scores" }).click();
    await search.waitForFunction(
      (oldGen) =>
        document
          .querySelector(".refresh-bar")
          ?.getAttribute("data-generation") !== oldGen,
      searchGen,
    );
    assert.equal(new URL(search.url()).searchParams.get("q"), "Kerry");
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForFunction(
      () => document.querySelector(".match-side strong")?.textContent === "7",
    );
    const current = await page
      .locator(".refresh-bar")
      .getAttribute("data-generation");
    await page.route("**/api/publication?**", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"error":"unavailable"}',
      }),
    );
    await page.clock.runFor(60_000);
    await page
      .getByText("Updates unavailable · showing the last loaded results")
      .waitFor();
    assert.equal(
      await page.locator(".match-side strong").first().innerText(),
      "7",
    );
    assert.equal(
      await page.locator(".refresh-bar").getAttribute("data-generation"),
      current,
    );
    await page.unroute("**/api/publication?**");
    await page.getByRole("button", { name: "Refresh", exact: false }).click();
    await page.waitForFunction(
      () =>
        !document
          .querySelector(".refresh-bar")
          ?.textContent?.includes("unavailable"),
    );
    await page.screenshot({
      path: "docs/previews/live-update-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "docs/previews/live-update-mobile.png",
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
      false,
    );
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(
      "Changed HTML → worker → API → open HQ: 9–6 → 8–6 → 7–6. Visibility suspension, immediate resume, search stability, editing protection, scroll preservation and failure recovery passed.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
