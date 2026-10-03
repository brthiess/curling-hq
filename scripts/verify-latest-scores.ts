import assert from "node:assert/strict";
import { chromium } from "playwright";
import { homeBrowse } from "../src/lib/browse";
async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const browse = homeBrowse({});
    const query = new URLSearchParams(
      Object.entries(browse).filter(([, v]) => v !== undefined) as [
        string,
        string,
      ][],
    );
    query.set("limit", "100");
    const response = await page.request.get(
      "http://127.0.0.1:8000/v1/events?" + query,
    );
    assert.equal(response.status(), 200);
    const result = await response.json();
    const generation = result.meta.generation_id;
    assert.ok(result.data.length > 4);
    assert.equal(result.page.has_more, false);
    const times = result.data.map((e: any) =>
      Date.parse(
        e.score_activity.at +
          (e.score_activity.basis === "source_local_timezone_unknown"
            ? "Z"
            : ""),
      ),
    );
    assert.deepEqual(
      times,
      [...times].sort((a, b) => b - a),
    );
    await page.goto("http://127.0.0.1:3001/?generation=" + generation, {
      waitUntil: "networkidle",
    });
    const sections = page.locator('[id^="event-src:"]');
    assert.equal(await sections.count(), result.data.length);
    assert.deepEqual(
      await sections.evaluateAll((nodes) =>
        nodes.map((n) => n.id.replace("event-", "")),
      ),
      result.data.map((e: any) => e.id),
    );
    for (const event of result.data) {
      const section = page.locator('[id="event-' + event.id + '"]');
      assert.equal(await section.locator("select").inputValue(), "latest");
      if (event.latest_scored_draw_id) {
        const links = await section
          .locator(".game-card")
          .evaluateAll((nodes) =>
            nodes.map((n) =>
              decodeURIComponent((n as HTMLAnchorElement).pathname),
            ),
          );
        const api = await (
          await page.request.get(
            "http://127.0.0.1:8000/v1/events/" +
              encodeURIComponent(event.id) +
              "/games?generation=" +
              generation +
              "&source_draw_id=" +
              event.latest_scored_draw_id +
              "&limit=4",
          )
        ).json();
        assert.ok(api.data.length);
        assert.deepEqual(
          links.map((link) => link.replace("/games/", "")),
          api.data.map((g: any) => g.id),
        );
      }
    }
    await page.screenshot({
      path: "docs/previews/latest-home-desktop.png",
      fullPage: false,
    });
    const id = "src:cz:event:9492",
      event = result.data.find((e: any) => e.id === id);
    assert.equal(event.latest_scored_draw_id, "7");
    const section = page.locator('[id="event-' + id + '"]');
    await section.locator("select").selectOption("4");
    await page.waitForURL((u) => u.searchParams.get("draw_" + id) === "4");
    await page.waitForLoadState("networkidle");
    assert.equal(await section.locator("select").inputValue(), "4");
    await section.locator("select").selectOption("latest");
    await page.waitForURL((u) => !u.searchParams.has("draw_" + id));
    await page.waitForLoadState("networkidle");
    assert.equal(await section.locator("select").inputValue(), "latest");
    await section.locator("select").selectOption("all");
    await page.waitForURL((u) => u.searchParams.get("draw_" + id) === "all");
    await page.waitForLoadState("networkidle");
    assert.equal(await section.locator("select").inputValue(), "all");
    await page.goto(
      "http://127.0.0.1:3001/events/" +
        encodeURIComponent(id) +
        "?generation=" +
        generation,
      { waitUntil: "networkidle" },
    );
    assert.equal(await page.locator("#draw").inputValue(), "latest");
    assert.equal(await page.locator("#games .game-card").count(), 4);
    await page.locator("#draw").selectOption("4");
    await page.waitForURL((u) => u.searchParams.get("source_draw_id") === "4");
    await page.waitForLoadState("networkidle");
    assert.equal(await page.locator("#draw").inputValue(), "4");
    await page.locator("#draw").selectOption("all");
    await page.waitForURL(
      (u) => u.searchParams.get("source_draw_id") === "all",
    );
    await page.waitForLoadState("networkidle");
    assert.ok((await page.locator("#games .game-card").count()) > 4);
    await page.locator("#draw").selectOption("latest");
    await page.waitForURL(
      (u) => u.searchParams.get("source_draw_id") === "latest",
    );
    await page.waitForLoadState("networkidle");
    assert.equal(await page.locator("#games .game-card").count(), 4);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
    });
    await page.screenshot({
      path: "docs/previews/latest-event-desktop.png",
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
        await page.screenshot({
          path: "docs/previews/latest-event-mobile.png",
          fullPage: false,
        });
    }
    await page.goto("http://127.0.0.1:3001/?generation=" + generation, {
      waitUntil: "networkidle",
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "docs/previews/latest-home-mobile.png",
      fullPage: false,
    });
    const preflight = await page.request.get(
      "http://127.0.0.1:3001/api/publication?ready=true&generation=" +
        generation,
    );
    assert.equal(preflight.status(), 200);
    assert.deepEqual(errors, []);
    console.log(
      `Verified ${result.data.length} weekly score-active events in newest-game order, latest scored draws on both pages, explicit older/all draw selection and reset, pinned refresh preflight, desktop/mobile layouts.`,
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
