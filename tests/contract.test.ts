import { test } from "node:test";
import assert from "node:assert/strict";
import examples from "../src/fixtures/api-examples.json";
import {
  eventResponse,
  eventsResponse,
  gameResponse,
  gamesResponse,
  searchResponse,
  detailUrl,
  stateLabel,
  scoreObserved,
  clock,
  routeId,
  fieldObserved,
} from "../src/lib/model";
test("upstream examples validate for all supported views", () => {
  eventsResponse.parse(examples.event_browse);
  eventResponse.parse(examples.event_detail);
  gamesResponse.parse(examples.event_games);
  searchResponse.parse(examples.team_search);
  gameResponse.parse(examples.game_detail);
});
test("blank ends and partial/unknown lineups are retained", () => {
  const r = gameResponse.parse(examples.game_detail);
  assert.deepEqual(r.data.scoreline?.ends?.[1], [0, 0]);
  assert.equal(r.data.lineups[0]?.completeness, "partial");
  assert.equal(r.data.lineups[1], null);
});
test("opaque IDs are encoded once as full path segments and generation is pinned", () => {
  assert.equal(routeId("src%3Acz%3Agame%3Aa%253Ab%3A1"), "src:cz:game:a%3Ab:1");
  assert.equal(
    detailUrl("games", "src:cz:game:a%3Ab:1", "g 1"),
    "/games/src%3Acz%3Agame%3Aa%253Ab%3A1?generation=g%201",
  );
});
test("open games and unzoned clocks do not imply current live or converted time", () => {
  const g = gameResponse.parse(examples.game_detail).data;
  assert.equal(stateLabel(g.state), "In progress when checked");
  assert.match(clock(g), /timezone unknown/);
});
test("freshness comes from score evidence, not generation or newer unrelated fields", () => {
  const r = gameResponse.parse(examples.game_detail);
  r.data.last_successful_observed_at = "2099-01-01T00:00:00Z";
  assert.equal(scoreObserved(r.data, r), "2026-10-02T17:58:00Z");
});
test("lineup evidence retains its independent older freshness", () => {
  const r = gameResponse.parse(examples.game_detail);
  assert.equal(fieldObserved(r.data, r, "/lineups/0"), "2026-10-01T16:00:00Z");
  assert.equal(
    fieldObserved(r.data, r, "/lineups/0/person_ids"),
    "2026-10-01T16:00:00Z",
  );
});

test("current game team profiles preserve listed names, positions and source timezone", () => {
  const payload = structuredClone(examples.game_detail) as Record<string, any>;
  payload.data.team_profiles = [
    {
      basis: "team_profile",
      members: [
        {
          person_id: null,
          display_name: "Philipp Hoesli",
          source_position: "Fourth",
          kind: "team_member",
        },
      ],
    },
    null,
  ];
  payload.data.source_draw_label = "Draw 7";
  payload.data.source_stage_label = "A-Semifinal";
  payload.data.location_label = "Vernon, BC";
  payload.data.scheduled_time = {
    local_date: null,
    month_day: "10-02",
    local_time: "16:00",
    timezone: "PDT",
    utc_offset: null,
    instant: null,
  };
  const g = gameResponse.parse(payload).data;
  assert.equal(g.team_profiles?.[0]?.members[0].display_name, "Philipp Hoesli");
  assert.equal(g.team_profiles?.[0]?.members[0].source_position, "Fourth");
  assert.equal(g.source_stage_label, "A-Semifinal");
  assert.equal(clock(g), "10-02 · 16:00 PDT");
  assert.equal(g.scheduled_time?.instant, null);
});
