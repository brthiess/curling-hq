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

- Event browsing with event-name search, optional date-overlap filters, and cursor pagination.
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
- Health check: `/api/health` confirms frontend configuration; it does not claim upstream readiness.

The API contract is still a proposal: real-data integration and public launch require an implemented publisher/API and its base URL. For a temporary production design preview only, explicitly set `CURLING_DEMO_MODE=true`; the synthetic-data banner remains visible.

## Verification

```sh
npm test
npm run typecheck
npm run build
npm run format:check
```

Tests validate upstream examples, missing lineups, blank ends, freshness, opaque-ID encoding, generation integrity, cursor query encoding, and API failures. Desktop/mobile browser checks cover the core browse → game and search → event paths. Fonts use Google Fonts with system fallbacks.

Product decisions and terminology live in `docs/product-decisions.md` and `CONTEXT.md`. The next upstream implementation prompt is `docs/crawler-api-implementation-request.md`.
