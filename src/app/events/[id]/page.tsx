import { drawFilter, drawSelection } from "@/lib/browse";
import { DrawSelect } from "@/components/draw-select";
import { LiveScores, ScoreStatus } from "@/components/live-scores";
import Link from "next/link";
import { api } from "@/lib/api";
import { detailUrl, routeId } from "@/lib/model";
import {
  Checked,
  Empty,
  EventDates,
  GameCard,
  PageNext,
  Problem,
} from "@/components/ui";
export const dynamic = "force-dynamic";
type Query = {
  generation?: string;
  entry_id?: string;
  source_draw_id?: string;
  state?: string;
  cursor?: string;
  entries_cursor?: string;
  draws_cursor?: string;
};
export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Query>;
}) {
  const { id: segment } = await params;
  const id = routeId(segment);
  const q = await searchParams;
  let response, games;
  try {
    response = await api.event(id, {
      generation: q.generation,
      entries_cursor: q.entries_cursor,
      draws_cursor: q.draws_cursor,
      limit: "50",
    });
    games = await api.games(response.data.event.id, {
      generation: response.meta.generation_id,
      entry_id: q.entry_id,
      source_draw_id: drawFilter(q.source_draw_id, response.data.event),
      state: q.state,
      cursor: q.cursor,
      limit: "24",
    });
  } catch (error) {
    return (
      <LiveScores failed>
        <div className="container">
          <Problem error={error} />
        </div>
      </LiveScores>
    );
  }
  const ev = response.data.event;
  const generation = response.meta.generation_id;
  const namedEntries = response.data.entries.filter((entry) =>
    entry.display_name?.trim(),
  );
  const path = `/events/${encodeURIComponent(ev.id)}`;
  return (
    <LiveScores generation={generation}>
      <div className="container detail">
        <Link className="breadcrumb" href="/">
          ← All events
        </Link>
        <p className="eyebrow">EVENT CENTRE</p>
        <h1>{ev.title ?? "Event name unavailable"}</h1>
        <p className="detail-sub">
          <EventDates event={ev} />
        </p>
        <Checked at={ev.last_successful_observed_at} />
        <div className="event-tabs">
          <a href="#games">Games & scores</a>
          <a href="#entries">Teams</a>
        </div>
        <section id="games">
          <div className="section-heading">
            <h2>Games & scores</h2>
            <span>Scores by draw</span>
          </div>
          <form className="filter-form" action={path}>
            <input type="hidden" name="generation" value={generation} />
            <DrawSelect
              name="source_draw_id"
              id="draw"
              value={drawSelection(q.source_draw_id)}
              latest={ev.latest_scored_draw_id}
              draws={ev.source_draws ?? []}
              submit
            />
            <div>
              <label htmlFor="state">Game status</label>
              <select name="state" id="state" defaultValue={q.state ?? ""}>
                <option value="">All statuses</option>
                <option value="open">In progress when checked</option>
                <option value="completed">Final</option>
                <option value="conceded">Conceded</option>
                <option value="forfeited">Forfeit</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label htmlFor="entry">Team</label>
              <select
                name="entry_id"
                id="entry"
                defaultValue={q.entry_id ?? ""}
              >
                <option value="">All available teams</option>
                {q.entry_id &&
                  !namedEntries.some((e) => e.id === q.entry_id) && (
                    <option value={q.entry_id}>Selected team</option>
                  )}
                {namedEntries.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.display_name ?? "Name unavailable"}
                  </option>
                ))}
              </select>
            </div>
            <button className="button secondary">Apply filters</button>
          </form>
          {games.data.length ? (
            <div className="game-grid">
              {games.data.map((g) => (
                <GameCard game={g} context={games} key={g.id} />
              ))}
            </div>
          ) : (
            <Empty title="No games in this view">
              Try another draw, status, or team. This does not establish
              complete event coverage.
            </Empty>
          )}
          <PageNext
            cursor={games.page?.next_cursor ?? null}
            params={{
              generation,
              entry_id: q.entry_id,
              state: q.state,
              source_draw_id: drawSelection(q.source_draw_id),
            }}
            path={path}
            label="Next games"
          />
        </section>
        <section id="entries" className="entries-section">
          <div className="section-heading">
            <h2>Teams in this event</h2>
            <span>
              {ev.entry_completeness === "complete"
                ? "Published entries"
                : "Entry coverage may be partial"}
            </span>
          </div>
          <div className="entry-grid">
            {namedEntries.map((e) => (
              <Link
                key={e.id}
                href={`${detailUrl("events", ev.id, generation)}&entry_id=${encodeURIComponent(e.id)}`}
              >
                <span>{e.display_name ?? "Team name unavailable"}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
          {!response.data.entries.length && (
            <p>No team entries published yet.</p>
          )}
          {response.data.related_pages.entries.next_cursor && (
            <Link
              className="more-games"
              href={`${path}?${new URLSearchParams({ generation, entries_cursor: response.data.related_pages.entries.next_cursor, ...(q.draws_cursor ? { draws_cursor: q.draws_cursor } : {}) })}`}
            >
              Next teams →
            </Link>
          )}
        </section>
        <aside className="coverage-note">
          <strong>Schedule coverage is incomplete.</strong>
          <p>
            Upcoming fixtures are not available yet. Game times are displayed as
            reported by the source, with unknown timezones labelled.
          </p>
        </aside>
      </div>
    </LiveScores>
  );
}
