import { homeBrowse } from "../src/lib/browse";
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

async function main() {
  const base = process.env.HQ_PREVIEW_URL ?? "http://127.0.0.1:3001";
  await mkdir("docs/previews", { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.screenshot({
    path: "docs/previews/real-data-home-desktop.png",
    fullPage: true,
  });
  if (
    await page
      .getByText("Scores are temporarily unavailable", { exact: true })
      .count()
  )
    throw new Error("Home API failed");
  const nextLink = page.locator(".pagination a");
  const nextEvents = (await nextLink.count())
    ? await nextLink.getAttribute("href")
    : null;
  if (nextEvents) {
    await page.goto(base + nextEvents, { waitUntil: "networkidle" });
    if (await page.locator(".problem").count())
      throw new Error("Home cursor navigation failed");
    await page.goto(base, { waitUntil: "networkidle" });
  }
  await page.screenshot({
    path: "docs/previews/real-data-home-desktop-viewport.png",
    fullPage: false,
  });
  // Default scoreboard follows recent game activity, independently of event start dates.
  const latestDate = await page.locator(".event-date").first().innerText();
  console.log("Latest event date:", latestDate);
  const pin = await page
    .locator(".refresh-bar")
    .getAttribute("data-generation");
  const latestQuery = new URLSearchParams(
    Object.entries({
      ...homeBrowse({}),
      limit: "100",
      ...(pin ? { generation: pin } : {}),
    }).filter(([, v]) => v !== undefined) as [string, string][],
  );
  const apiBase = process.env.CURLING_API_URL ?? "http://127.0.0.1:8000/v1";
  const newest = await page.request.get(apiBase + "/events?" + latestQuery);
  const newestData = await newest.json();
  if (
    newest.status() !== 200 ||
    (await page.locator(".event-block").first().getAttribute("id")) !==
      "event-" + newestData.data[0]?.id
  )
    throw new Error(
      "The newest published events are missing from the homepage",
    );
  if (process.env.HQ_REQUIRE_CURRENT_SCORES === "true") {
    for (const block of await page.locator(".event-block").all()) {
      if (!(await block.locator("a.game-card").count()))
        throw new Error(
          "A source-verified current homepage event still has no games: " +
            (await block.locator("h3").innerText()),
        );
    }
    const current = await page.request.get(
      apiBase + "/games/" + encodeURIComponent("src:cz:game:9492:7:392456"),
    );
    const payload = await current.json();
    if (
      current.status() !== 200 ||
      JSON.stringify(payload.data.scoreline?.totals) !== "[7,4]" ||
      payload.data.scoreline?.played_end_count !== 7
    )
      throw new Error(
        "Current Prestige score differs from the real source fixture",
      );
    await page.goto(base + "/games/" + encodeURIComponent(payload.data.id), {
      waitUntil: "networkidle",
    });
    const rows = await page.locator(".score-table tbody tr").allTextContents();
    if (
      !rows[0]?.includes("Marco Hoesli") ||
      !rows[1]?.includes("Kim Schwaller") ||
      (await page
        .locator(".score-table tbody tr")
        .first()
        .locator("td")
        .count()) !== 8
    )
      throw new Error(
        "Current game names or seven played ends are missing in HQ",
      );
    await page.goto(base, { waitUntil: "networkidle" });
  }
  if (!(await page.locator("a.game-card").count())) {
    await page.getByRole("link", { name: "Past results", exact: true }).click();
    await page.locator("a.game-card").first().waitFor();
  }
  const game = page.locator("a.game-card").first();
  if (!(await game.count()))
    throw new Error("Recent results have no game cards");
  const gameUrl = await game.getAttribute("href");
  console.log("First real game:", await game.innerText());
  const logo = await page.locator(".brand").boundingBox();
  const nav = await page.locator("header nav").boundingBox();
  if (
    logo &&
    nav &&
    Math.abs(logo.y + logo.height / 2 - nav.y - nav.height / 2) > 3
  )
    throw new Error("Header alignment");
  await page.goto(base + gameUrl, { waitUntil: "networkidle" });
  await page.screenshot({
    path: "docs/previews/real-data-game-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/previews/real-data-game-mobile.png",
    fullPage: true,
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.screenshot({
    path: "docs/previews/real-data-home-mobile.png",
    fullPage: true,
  });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    if (overflow) throw new Error("Horizontal page overflow at " + width);
  }
  await page.goto(base + "/search?q=Gushue", { waitUntil: "networkidle" });
  await page.screenshot({
    path: "docs/previews/real-data-search-mobile.png",
    fullPage: true,
  });
  const searchText = await page.locator("main").innerText();
  if (searchText.includes("temporarily unavailable"))
    throw new Error("Search API failed");
  const searchResult = await page
    .locator(".search-results > a")
    .first()
    .getAttribute("href");
  if (!searchResult) throw new Error("No real team entry search results");
  await page.goto(base + searchResult, { waitUntil: "networkidle" });
  if (await page.locator(".problem").count())
    throw new Error("Search to filtered event failed");
  await page.screenshot({
    path: "docs/previews/real-data-event-mobile.png",
    fullPage: true,
  });
  const health = await page.request.get(base + "/api/health");
  if (health.status() !== 200 || !(await health.json()).generation_id)
    throw new Error("HQ readiness check failed");
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "Desktop/mobile screenshots, real game navigation, team search, overflow and readiness passed.",
  );
  await browser.close();
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
