# Product decisions

## Agreed — October 2, 2026

- Primary audience: dedicated curling fans following multiple events.
- Core promise: quickly see live games, recent results, and upcoming games, then navigate into an event or game.
- Coverage ambition: competitive curling worldwide, with filters for discipline, country, and event level. Launch scope remains open.
- Primary journey: find a game, open it, and understand its score, teams, and players.
- Design priorities: intuitive navigation, readable mobile layouts, clear information hierarchy, and relief from the confusing layout and heavy advertising the user experiences on CurlingZone. Advertising policy remains open.
- Repository boundary: curling-crawler-ai gathers and stores source data; curling-hq presents it to visitors. Upstream gaps will be supplied as actionable prompts for the crawler repository.
- Launch scope is limited to data the crawler currently gathers: events, available schedules, game scores, and available team/player lineups. Do not require new source categories to launch. Complete roster coverage and upcoming fixtures remain conditional on available data.
- Homepage: games grouped by event, with Live / Upcoming / Results views, date and discipline filters, and prominent team/event search. Views and filters require explicit data support; scheduled time alone does not establish a live game.
- Game detail: end-by-end score, status, both teams' available players and positions, available scheduled time/stage/sheet, event navigation, and last successful score observation. Missing information is clearly labelled.
- Launch is ad-free. Future restrained sponsorship may appear outside score and navigation areas.
- Team/player pages follow the launch core; rankings and viewing links follow later.
- Visual direction: light background, dark navy text, restrained red accents, readable score tables, and minimal decoration; mobile game cards link directly to game details.
- Periodic results are acceptable for launch. Show last-checked timestamps and avoid implying verified live coverage from unknown status or old data.
- Implementation stack: Next.js and TypeScript. Hosting preference: Render.
- Initial launch has no accounts or membership. Saved favourites are deferred to keep anonymous browsing simple.

## Implementation authorized

The user confirmed shared understanding and authorized the build. API delivery is selected, using `curling-crawler-ai/docs/curling-hq-api-contract-v1.md` and its response examples. The API is still an upstream implementation dependency; it has no deployed base URL yet. Local design previews use explicitly labelled synthetic examples, never as a fallback for an API failure.

Launch navigation adapts to API capabilities: event-grouped games, event-date filtering, event-name search, event-entry name search, and per-event game-status filtering. Global live/upcoming feeds, discipline filters, and chronological game sorting are unsupported by v1 and are deferred.

## Crawler audit observations

The current crawler persists an evidence archive in JSON/SQLite and a limited canonical JSON sidecar. It has no HTTP API or complete website read model. Score and lineup claims exist, but publication of event summaries, entries/rosters, schedules, and game details remains necessary. Future fixtures need explicit representation because the archive glossary reserves Game for contests that have happened. Live refresh is documented but a scheduler was not found in the inspected implementation. Rankings and watch links have no observed ingestion.

These are implementation observations, not product decisions. Confirm the publication and freshness contract with the crawler repository before integrating.

## Upstream proposal reviewed — October 2, 2026

Read the response in the chat "Define Curling HQ publication schema" and `curling-crawler-ai/docs/curling-hq-publication-contract-v1.md`. This is a documentation proposal, not an implemented publisher. It distinguishes fixtures from games, uses provisional source-scoped IDs, and defines generation-consistent records, provenance, missingness, scorelines, and lineups.

Additional launch constraints: upcoming fixture extraction currently loses slot identity/participants; lineup cards may include non-playing alternates; automatic polling and latest-read score correction are still planned. Do not advertise upcoming coverage or confirmed playing participation beyond evidence. Prefer publishing valid existing scores and entries first, with supported lineup details and clear unknowns.
