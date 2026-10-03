# Curling HQ

The public site for following competitive curling.

## Language

**Event**:
One held edition of a recurring competition, such as the 2026 World Men's Championship.
_Avoid_: series, tour, schedule

**Game**:
A contest between two entries at an Event that was started, completed, conceded, or awarded by forfeit.
_Avoid_: match

**Scoreline**:
The end-by-end scoring record of one Game.
_Avoid_: box score

**Entry**:
A team's berth in one Event, carrying that Event's displayed team name. Entries with the same displayed name in different Events remain distinct.
_Avoid_: team identity

**Playing Lineup**:
The known Persons who participated in a particular Game, with supported duties and delivery assignments. It is distinct from an Event roster that may include alternates or coaches.
_Avoid_: roster

**Fixture**:
A scheduled contest that has not yet become a Game. A fixture may have unresolved participants and can be postponed or cancelled without establishing a Game.
_Avoid_: upcoming game

## Real-data API integration — October 2, 2026

Projects now reside under C:/Users/brthi/Projects/crawler-and-hq.
Local HQ uses http://127.0.0.1:8000/v1 with demo mode false.
The crawler supplies retained generation-pinned publications and read-only HTTP serving; frequent publications share a versioned SQLite store.
Coverage and Render procedures are in the crawler's docs/api-operations.md.
Screenshot verification is repeatable with npm run check:preview.


## Frequent scores — October 3, 2026

Local worker cadence targets 120 seconds; source delays and overruns are exposed.
Visible homepage, event and game pages check for new generations every 60 seconds.
Search/paginated results require an Update scores action; unapplied filters pause replacement.
Accepted score evidence determines the five-minute delayed badge. Failed refreshes preserve displayed results.
Desktop/mobile screenshots and the controlled HTML → worker → API → open browser test passed.
Operations: ../curling-crawler-ai/docs/score-worker-operations.md.


Homepage correction: latest events are shown before game coverage exists; Past results explicitly selects events with games. Homepage rendering and refresh preflight share the same filters. Current source draw pointers in meta-refresh URLs are discovered by the score worker.
