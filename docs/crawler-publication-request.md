# Prompt for curling-crawler-ai

Historical initial request. API delivery has since been selected and the upstream proposal received. Use `crawler-api-implementation-request.md` for the next request.

Curling HQ's launch will display only data you currently gather: event browsing, available schedules, game scores, and available participating teams/players. We do not need new ranking, news, image, or broadcast ingestion to launch.

Inspect your implementation and implement a versioned, compact website publication model for event summaries/details, event entries, available player lineups, draw schedules, and game details. First document the proposed contract and any domain decisions needed. Keep HTTP API versus atomic JSON export transport open until deployment is decided.

Include stable IDs where established, otherwise explicitly provisional source-scoped IDs; relationships between records; selected display names; source URLs; last successful observation timestamps per relevant data group; explicit unknown/missing values; and coverage/quality indicators. Publish only supported fields. Preserve unknown timezones rather than assuming one, and do not infer live status from scheduled start time. Represent upcoming fixtures separately if the archive's Game definition requires it.

Game detail should expose the available end-by-end score, totals, outcome/status, sheet, event/stage/draw references, scheduled time, both entries, and known players/positions. Distinguish an event roster from the lineup that played a particular game. Publish scores when rosters are incomplete. Event listing and game search need a compact index of event and entry display names and relationships.

Do not expose raw snapshots or the evidence archive to browsers. Distinguish collected facts from derived values. Explain how publication is consistent across linked records and how corrections replace previous published values.

Report current coverage from actual stored records, not just extractors or historical claim counts. Identify which requested fields cannot yet be supplied, and distinguish implemented refresh behavior from ADR plans. Propose separate, scoped follow-up work for live refresh and missing data after the publication contract is agreed.
