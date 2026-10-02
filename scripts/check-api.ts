import { loadEnvConfig } from "@next/env";
import { api, ApiError } from "../src/lib/api";

loadEnvConfig(process.cwd());
process.env.CURLING_DEMO_MODE = "false";

async function main() {
  if (!process.env.CURLING_API_URL) {
    console.error(
      "Set CURLING_API_URL in .env.local to the crawler API URL ending in /v1. The crawler publisher/API still needs implementation.",
    );
    process.exitCode = 1;
    return;
  }
  const first = await api.events({ limit: "1" });
  const generation = first.meta.generation_id;
  console.log(
    `Event browsing validated. Dataset: ${generation}. Coverage: ${first.meta.coverage.state}.`,
  );
  if (first.page?.has_more && first.page.next_cursor) {
    await api.events({
      limit: "1",
      cursor: first.page.next_cursor,
      generation,
    });
    console.log("Generation-pinned cursor pagination validated.");
  }
  const event = first.data[0];
  if (!event) {
    console.log("No published events; detail checks cannot run yet.");
    return;
  }
  const detail = await api.event(event.id, { generation, limit: "1" });
  const games = await api.games(event.id, { generation, limit: "1" });
  console.log("Event details and game listing validated.");
  const game = games.data[0];
  if (game) {
    await api.game(game.id, { generation });
    console.log("Game scores and available lineups validated.");
  } else
    console.log(
      "This event has no published games; game-detail check skipped.",
    );
  const entry = detail.data.entries.find(
    (e) => (e.display_name?.trim().length ?? 0) >= 2,
  );
  if (entry?.display_name) {
    await api.search({
      q: entry.display_name.trim().slice(0, 120),
      limit: "1",
      generation,
    });
    console.log("Team entry search validated.");
  }
  console.log(
    "API connection checks completed. No sources were crawled or records modified.",
  );
}

main().catch((error) => {
  console.error(
    error instanceof ApiError
      ? `API check failed: ${error.code} (HTTP ${error.status}).`
      : "API check failed. Verify the service URL and its v1 contract.",
  );
  process.exitCode = 1;
});
