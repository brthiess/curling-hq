import assert from "node:assert/strict";
import { chromium } from "playwright";
import { gameResponse } from "../src/lib/model";
async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const id = "src:cz:game:9492:7:392456";
    const response = await page.request.get(
      "http://127.0.0.1:8000/v1/games/" + encodeURIComponent(id),
    );
    assert.equal(response.status(), 200);
    const api = gameResponse.parse(await response.json());
    assert.equal(api.data.team_profiles?.[0]?.members.length, 4);
    assert.equal(api.data.team_profiles?.[1]?.members.length, 4);
    assert.equal(api.included.persons.length, 8);
    assert.equal(api.data.source_stage_label, "A-Semifinal");
    assert.equal(api.data.sheet_label, "1");
    assert.equal(api.data.scheduled_time?.timezone, "PDT");
    const pin = process.env.HQ_DETAILS_GENERATION;
    await page.goto(
      "http://127.0.0.1:3001/games/" +
        encodeURIComponent(id) +
        (pin ? "?generation=" + pin : ""),
      { waitUntil: "networkidle" },
    );
    // Also tests an already pinned page receiving the enriched publication.
    await page
      .getByText("Philipp Hoesli", { exact: true })
      .waitFor({ timeout: 75000 });
    const profiles = page.locator(".lineup");
    assert.equal(await profiles.count(), 2);
    for (let side = 0; side < 2; side++) {
      const rows = profiles.nth(side).locator("li");
      assert.equal(await rows.count(), 4);
      for (let index = 0; index < 4; index++) {
        const expected: { display_name: string; source_position: string } =
          api.data.team_profiles![side]!.members[index]!;
        assert.equal(
          await rows.nth(index).locator("span").innerText(),
          expected.display_name,
        );
        assert.equal(
          await rows.nth(index).locator("small").innerText(),
          expected.source_position,
        );
      }
    }
    const details = await page.locator(".facts").innerText();
    for (const value of ["16:00 PDT", "Draw 7", "A-Semifinal", "Vernon, BC"])
      assert.ok(details.includes(value), value + " missing");
    assert.equal(await page.locator(".facts dd").nth(2).innerText(), "1");
    assert.equal(
      await page
        .getByText("Playing lineup not reported for this game.", {
          exact: true,
        })
        .count(),
      0,
    );
    assert.deepEqual(
      await page.locator(".match-side strong").allTextContents(),
      ["7", "4"],
    );
    await page.screenshot({
      path: "docs/previews/game-details-desktop.png",
      fullPage: true,
    });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
        false,
      );
      if (width === 390)
        await page.screenshot({
          path: "docs/previews/game-details-mobile.png",
          fullPage: true,
        });
    }
    assert.deepEqual(errors, []);
    console.log(
      "Verified both teams, all eight players and positions, draw/stage, sheet, source clock/timezone, location, unchanged 7–4 score, pinned-generation refresh, and desktop/mobile layouts.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
