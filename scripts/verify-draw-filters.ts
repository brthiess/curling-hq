import assert from "node:assert/strict";
import { chromium } from "playwright";
async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const id = "src:cz:event:9492",
      path = "/events/" + encodeURIComponent(id);
    const event = await (
      await page.request.get("http://127.0.0.1:8000/v1" + path + "?limit=50")
    ).json();
    assert.equal(event.data.entries.length, 24);
    assert.ok(event.data.entries.every((e: any) => e.display_name));
    assert.ok(event.data.event.source_draws.some((d: any) => d.label === "QF"));
    const generation = event.meta.generation_id;
    await page.goto(
      "http://127.0.0.1:3001" + path + "?generation=" + generation,
      { waitUntil: "networkidle" },
    );
    const teams = await page.locator("#entry option").allTextContents();
    assert.equal(teams.length, 25);
    assert.ok(!teams.some((x) => /unavailable/i.test(x)));
    const draw = page.locator("#draw");
    await draw.selectOption("7");
    await page.waitForURL((u) => u.searchParams.get("source_draw_id") === "7");
    await page.waitForLoadState("networkidle");
    const expected = await (
      await page.request.get(
        "http://127.0.0.1:8000/v1" +
          path +
          "/games?source_draw_id=7&generation=" +
          generation,
      )
    ).json();
    assert.equal(expected.data.length, 4);
    const cards = page.locator("#games .game-card");
    assert.equal(await cards.count(), 4);
    const links = await cards.evaluateAll((nodes) =>
      nodes.map((n) => decodeURIComponent((n as HTMLAnchorElement).pathname)),
    );
    for (const game of expected.data)
      assert.ok(
        links.some((link) => link.endsWith(game.id)),
        game.id,
      );
    await page.locator("#entry").selectOption("src:cz:entry:9492:1006084");
    await page.getByRole("button", { name: "Apply" }).click();
    await page.waitForLoadState("networkidle");
    assert.equal(new URL(page.url()).searchParams.get("source_draw_id"), "7");
    assert.equal(await cards.count(), 1);
    await draw.selectOption("6");
    await page.waitForURL((u) => u.searchParams.get("source_draw_id") === "6");
    await page.waitForLoadState("networkidle");
    assert.equal(
      new URL(page.url()).searchParams.get("entry_id"),
      "src:cz:entry:9492:1006084",
    );
    await page.goto(
      "http://127.0.0.1:3001" +
        path +
        "?generation=" +
        generation +
        "&source_draw_id=7",
      { waitUntil: "networkidle" },
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
    });
    await page.screenshot({
      path: "docs/previews/draw-event-desktop.png",
      fullPage: true,
    });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      if (width === 390)
        await page.evaluate(() => {
          if (document.activeElement instanceof HTMLElement)
            document.activeElement.blur();
        });
      await page.screenshot({
        path: "docs/previews/draw-event-mobile.png",
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("http://127.0.0.1:3001/?generation=" + generation, {
      waitUntil: "networkidle",
    });
    const section = page.locator('[id="event-' + id + '"]');
    assert.equal(await section.count(), 1);
    await section.locator("select").selectOption("7");
    await page.waitForURL((u) => u.searchParams.get("draw_" + id) === "7");
    await page.waitForLoadState("networkidle");
    assert.equal(await section.locator(".game-card").count(), 4);
    const homeLinks = await section
      .locator(".game-card")
      .evaluateAll((nodes) =>
        nodes.map((n) => decodeURIComponent((n as HTMLAnchorElement).pathname)),
      );
    for (const game of expected.data)
      assert.ok(homeLinks.some((link) => link.endsWith(game.id)));
    const view = section.getByRole("link", { name: /View event/ });
    assert.ok((await view.getAttribute("href"))?.includes("source_draw_id=7"));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
    });
    await page.screenshot({
      path: "docs/previews/draw-home-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
    });
    await page.screenshot({
      path: "docs/previews/draw-home-mobile.png",
      fullPage: true,
    });
    await section.locator("select").selectOption("all");
    await page.waitForURL((u) => u.searchParams.get("draw_" + id) === "all");
    await page.goto(
      "http://127.0.0.1:3001/games/" +
        encodeURIComponent("src:cz:game:9492:7:392456"),
      { waitUntil: "networkidle" },
    );
    assert.equal(
      await page.getByText("Blank ends score 0–0.", { exact: false }).count(),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      "Verified: all 24 team names, event/home draw filtering against API games, team filter preservation, draw reset, links, removed blank-end text, desktop/mobile layouts.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
