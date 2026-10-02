# Consume a prepared read-only crawler API

Curling HQ uses a versioned read-only API owned by curling-crawler-ai instead of reading the evidence archive or downloading full JSON exports. This supports browsing a growing archive with bounded event/game pages and search while keeping collection and fact resolution upstream. Navigation pins the publication generation across pages; an expired generation requires a fresh browse session rather than mixing records.
