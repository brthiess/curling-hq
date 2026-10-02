# Next prompt for curling-crawler-ai

Curling HQ's initial Next.js frontend now consumes the v1 API contract and validates your synthetic response examples. Implement the prepared-data publisher and read-only API described in `docs/curling-hq-api-contract-v1.md`; that contract is currently a proposal, not a deployed service.

The frontend uses these routes: `/v1/events` with `q`, `from`, `to`, `limit`, `cursor`, `generation`; `/v1/search/teams` with `q`, `limit`, `cursor`, `generation`; `/v1/events/{id}` with `limit`, `entries_cursor`, `draws_cursor`, `generation`; `/v1/events/{id}/games` with `entry_id`, `state`, `limit`, `cursor`, `generation`; and `/v1/games/{id}` with `generation`. It requires the `X-Publication-Generation` header to match response metadata, and displays source-evidence freshness independently of publication time.

First publish current events, entry labels, accepted scores, and supported playing lineups. Explicitly declare missing fixtures and partial rosters; no new sources or live scheduler are required for launch. Preserve blank/extra ends and unknown timezones. Serve prepared consumer data only, without request-triggered crawling or archive access. Implement the contract's pagination, ID/alias handling, retained generations, validation, and error semantics, with meaningful integration tests.

Provide a Render-compatible service configuration, a real-data preparation command, and the deployed or locally runnable API base URL ending in `/v1`. Keep preparation failures from replacing the last valid publication. Tell us which dataset is actually published and which capabilities remain unavailable.
