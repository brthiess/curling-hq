import assert from "node:assert/strict";
import test from "node:test";
import { nextGenerationUrl, stableBrowse, scoreDelayed } from "../src/lib/live";
test("generation updates preserve filters and scroll anchors and drop every cursor", () => {
  const url = nextGenerationUrl(
    "http://hq.test/events/abc?generation=old&entry_id=team&state=open&source_draw_id=7&draw_src%3Acz%3Aevent%3A9492=6&from=2026-10-01&cursor=x&entries_cursor=y&draws_cursor=z#games",
    "new",
  );
  const parsed = new URL(url, "http://hq.test");
  assert.equal(parsed.searchParams.get("generation"), "new");
  assert.equal(parsed.searchParams.get("entry_id"), "team");
  assert.equal(parsed.searchParams.get("state"), "open");
  assert.equal(parsed.searchParams.get("source_draw_id"), "7");
  assert.equal(parsed.searchParams.get("draw_src:cz:event:9492"), "6");
  assert.equal(parsed.searchParams.get("from"), "2026-10-01");
  assert.equal(parsed.hash, "#games");
  for (const key of ["cursor", "entries_cursor", "draws_cursor"])
    assert.equal(parsed.searchParams.has(key), false);
});
test("searches and manually paginated browsing remain stable", () => {
  assert.equal(stableBrowse("/search", new URLSearchParams()), true);
  assert.equal(stableBrowse("/", new URLSearchParams("q=Scotties")), true);
  assert.equal(
    stableBrowse("/events/a", new URLSearchParams("cursor=abc")),
    true,
  );
  assert.equal(
    stableBrowse("/events/a", new URLSearchParams("entry_id=team&state=open")),
    false,
  );
});
test("score delay is based on accepted observation and starts at five minutes", () => {
  const now = Date.parse("2026-10-02T12:05:00Z");
  assert.equal(scoreDelayed("2026-10-02T12:00:00Z", now), true);
  assert.equal(scoreDelayed("2026-10-02T12:00:01Z", now), false);
  assert.equal(scoreDelayed(null, now), true);
  assert.equal(scoreDelayed("invalid", now), true);
});
