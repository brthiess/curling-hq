# Curling HQ

A mobile-first, ad-free curling frontend using Next.js, TypeScript, and the read-only v1 API prepared by `curling-crawler-ai`.

## Run locally

Requires Node 22 (Node 20.9+ also supported).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Without an API URL, development uses clearly labelled synthetic examples copied from the crawler's API proposal. They are not real results and do not imply collection coverage. Production does not automatically use examples.

To connect real data, copy `.env.example` to `.env.local` and set:

```dotenv
CURLING_API_URL=https://your-crawler-api.onrender.com/v1
CURLING_DEMO_MODE=false
```

Restart the frontend after changing environment variables. Requests are server-side, with a ten-second timeout and schema/generation validation. An API failure shows an error, never synthetic fallback results. No crawler, evidence archive, credentials, or raw snapshots are included in the website.

Run `npm run check:api` after configuring the real service. It checks browsing, generation-pinned pagination where available, event/game details, and entry-name search against the actual API. It always disables synthetic data and clearly reports missing configuration or unavailable coverage.

## Included views

- Initial scoreboard shows recent events with published games; Browse all events includes editions without collected games. Name search, optional date filters and cursor pagination remain available.
- Available game cards grouped by event; bounded previews link to the event's games.
- Event details, entry selection, game-status filters, and separate pagination for games and entries.
- Event-entry name search linking to that entry's games; identical names are not merged across events.
- Game detail with end-by-end scores, blank/extra ends, available playing lineups, source links, unknown timezones, and score-specific observation timestamps.
- Loading, empty, missing-record, unavailable-API, and expired-generation states.

`open` is displayed as “In progress when checked”, never current “Live”. Global live/upcoming feeds, discipline filters, reliable time-ordered game schedules, standings, accounts, and favourites are outside initial coverage. Unknown player names/positions remain unknown. Roster-only alternates are not filled into game lineups.

Browse links pin the API's `generation_id`; requests must return the matching `X-Publication-Generation`. Cursor navigation preserves filters and limits. Expired generations prompt a restart without combining datasets. New browsing starts on the latest generation; no automatic live polling is claimed.

## Render

Use the repository's `render.yaml` Blueprint or create a Node web service:

- Build: `npm ci && npm run build`
- Start: `npm start` (Next respects Render's `PORT`)
- Node: 22
- Set `CURLING_API_URL` to the crawler API base URL including `/v1`.
- Keep `CURLING_DEMO_MODE=false`.
- Health check: /api/health verifies that the configured API returns an available, matching generation.

The sibling crawler now implements publication and read-only serving over the existing archive. Start it locally on port 8000 or deploy its prepared release on Render, then configure the site with its /v1 URL. See ../curling-crawler-ai/docs/api-operations.md. Public deployment has not been performed. For a temporary production design preview only, explicitly set `CURLING_DEMO_MODE=true`; the synthetic-data banner remains visible.

## Verification

```sh
npm test
npm run typecheck
npm run build
npm run format:check
npm run check:api
npm run check:preview # requires site/API running and Microsoft Edge
```

Tests validate upstream examples, missing lineups, blank ends, freshness, opaque-ID encoding, generation integrity, cursor query encoding, and API failures. Desktop/mobile browser checks cover the core browse → game and search → event paths. Fonts use Google Fonts with system fallbacks.

Product decisions and terminology live in `docs/product-decisions.md` and `CONTEXT.md`. The earlier handoff in docs/crawler-api-implementation-request.md is now implemented in the sibling crawler.


## Frequent local score updates

Run the sibling crawler's continuous score worker using its
[operations guide](../curling-crawler-ai/docs/score-worker-operations.md).
HQ polls prepared publications every 60 seconds on visible score pages; it never triggers crawling.
Hidden tabs suspend polling and check immediately when visible again.

Generation switches preserve event/team/status/date filters and scroll position, and remove pagination cursors.
Search results and manually paginated views stay pinned until the visitor chooses Update scores.
Unapplied filter edits pause replacements. Refresh failures keep the last displayed results.
Open games show Score delayed after five minutes without an accepted score observation.

The read-only /api/publication route checks publication status and preflights replacement API responses.
Operational status comes from /v1/capabilities; publication time stays separate from score observation time.
Local operation is implemented; Render deployment remains deferred.

Controlled browser verification:
initialize the crawler's tests/live_browser_fixture.py in a temporary root,
run its API on port 8001, and start an HQ instance on port 3002 with
CURLING_API_URL=http://127.0.0.1:8001/v1. Then run npx tsx scripts/verify-live.ts.
The test uses controlled HTML corrections and leaves the real archive untouched.


Homepage correction: latest events are shown before game coverage exists; Past results explicitly selects events with games. Homepage rendering and refresh preflight share the same filters. Current source draw pointers in meta-refresh URLs are discovered by the score worker.

To reproduce the current-score regression check against the local live API, set
`HQ_REQUIRE_CURRENT_SCORES=true` before running `npm run check:preview`. This
requires games on all four current homepage events and checks the source-captured
Prestige result (Marco Hoesli 7–4 Kim Schwaller, seven played ends) through the API
and game page. Screenshots are saved under `docs/previews/`.
`npx tsx scripts/verify-current-refresh.ts` verifies a visible page changes generation
when the running collector publishes real updates within its 150-second check window.

Game pages also display source-listed team profiles (player names and positions)
and reported draw/stage labels, sheet, local time/timezone, and location. Run
`npx tsx scripts/verify-game-details.ts` against the local API/HQ to verify the
source-captured Hoesli–Schwaller game, all eight profile players, and desktop/mobile
layouts. Set `HQ_DETAILS_GENERATION` to an older retained generation to also verify
that an already pinned game page receives the enriched publication.
