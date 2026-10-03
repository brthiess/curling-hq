import test from "node:test";
import assert from "node:assert/strict";
import { homeBrowse, drawFilter, drawSelection } from "../src/lib/browse";
test("homepage includes score activity from the last week, newest games first", () => {
  const query = homeBrowse({}, "2026-10-03");
  assert.equal(query.has_games, "true");
  assert.equal(query.activity_since, "2026-09-26");
  assert.equal(query.sort, "score_activity_desc");
  assert.equal(query.to, undefined);
});
test("past-results view explicitly selects events with games", () => {
  assert.equal(homeBrowse({ view: "results" }, "2026-10-03").has_games, "true");
  assert.equal(homeBrowse({ view: "all" }, "2026-10-03").to, undefined);
});
test("explicit filters and pinned pagination retain their values", () => {
  const query = homeBrowse(
    {
      q: "Classic",
      from: "2026-10-01",
      to: "2026-10-04",
      generation: "old",
      cursor: "page2",
      has_games: "false",
    },
    "2026-10-03",
  );
  assert.equal(query.q, "Classic");
  assert.equal(query.from, "2026-10-01");
  assert.equal(query.to, "2026-10-04");
  assert.equal(query.generation, "old");
  assert.equal(query.cursor, "page2");
  assert.equal(query.has_games, "false");
});

test("latest defaults track scored draws while manual and all-draw choices remain stable", () => {
  const event = { latest_scored_draw_id: "7" } as Parameters<
    typeof drawFilter
  >[1];
  assert.equal(drawFilter(undefined, event), "7");
  assert.equal(drawFilter("latest", event), "7");
  assert.equal(drawFilter("4", event), "4");
  assert.equal(drawFilter("all", event), undefined);
  assert.equal(drawSelection(undefined), "latest");
  event.latest_scored_draw_id = "8";
  assert.equal(drawFilter(undefined, event), "8");
  assert.equal(drawFilter("4", event), "4");
});
