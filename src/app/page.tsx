import Link from "next/link";
import { api } from "@/lib/api";
import { detailUrl } from "@/lib/model";
import {
  Empty,
  EventDates,
  GameCard,
  PageNext,
  Problem,
} from "@/components/ui";
export const dynamic = "force-dynamic";
type Query = {
  q?: string;
  from?: string;
  to?: string;
  cursor?: string;
  generation?: string;
};
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const q = await searchParams;
  let response;
  try {
    response = await api.events({ ...q, limit: "6" });
  } catch (error) {
    return (
      <div className="container">
        <Problem error={error} />
      </div>
    );
  }
  const generation = response.meta.generation_id;
  const blocks = await Promise.all(
    response.data.map(async (event) => ({
      event,
      result: await api
        .games(event.id, { generation, limit: "4" })
        .then((data) => ({ data, error: null }))
        .catch((error: unknown) => ({ data: null, error })),
    })),
  );
  return (
    <div className="container">
      <section className="hero">
        <div>
          <p className="eyebrow">
            <span /> YOUR CURLING HOME
          </p>
          <h1>
            Curling, <em>at a glance.</em>
          </h1>
          <p className="hero-copy">
            Scores, teams, and every played end. All in one place.
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <svg viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="82" fill="#e1e9ec" />
            <circle cx="100" cy="100" r="57" fill="#f6f7f5" />
            <circle cx="100" cy="100" r="34" fill="#d58a84" />
            <circle cx="100" cy="100" r="12" fill="#f6f7f5" />
            <path
              d="M100 0v200M0 100h200"
              stroke="#a1b4be"
              strokeOpacity=".35"
            />
          </svg>
        </div>
      </section>
      <div className="browse-top">
        <div>
          <p className="eyebrow">THE SCOREBOARD</p>
          <h2>Scores & events</h2>
        </div>
        <span className="quiet-label">Clear scores. No distractions.</span>
      </div>
      <form className="search-form" action="/">
        <div className="search-input">
          <label htmlFor="q">Find an event</label>
          <input
            id="q"
            name="q"
            type="search"
            minLength={2}
            maxLength={120}
            placeholder="Search event name…"
            defaultValue={q.q}
          />
        </div>
        <details className="date-filters" open={Boolean(q.from || q.to)}>
          <summary>Filter by date</summary>
          <div className="date-fields">
            <div>
              <label htmlFor="from">From</label>
              <input id="from" name="from" type="date" defaultValue={q.from} />
            </div>
            <div>
              <label htmlFor="to">To</label>
              <input id="to" name="to" type="date" defaultValue={q.to} />
            </div>
          </div>
        </details>
        <button className="button">
          Find events <span aria-hidden="true">→</span>
        </button>
        {(q.q || q.from || q.to) && (
          <Link className="clear" href="/">
            Clear
          </Link>
        )}
      </form>
      <div className="browse-note">
        <span className="note-dot" />
        Published results · open games reflect their last check.
        <Link href="/search">Looking for a team? →</Link>
      </div>
      {blocks.length === 0 ? (
        <Empty title="No matching events">
          Try a different name or broaden the date range. Events with unknown
          dates are excluded by date filters.
        </Empty>
      ) : (
        blocks.map(({ event, result }) => (
          <section className="event-block" key={event.id}>
            <div className="event-heading">
              <div>
                <p className="event-date">
                  <EventDates event={event} />
                </p>
                <h3>
                  <Link href={detailUrl("events", event.id, generation)}>
                    {event.title ?? "Event name unavailable"}
                  </Link>
                </h3>
              </div>
              <Link
                className="text-link"
                href={detailUrl("events", event.id, generation)}
              >
                View event <span aria-hidden="true">↗</span>
              </Link>
            </div>
            {result.data ? (
              <>
                {result.data.data.length ? (
                  <div className="game-grid">
                    {result.data.data.map((game) => (
                      <GameCard
                        game={game}
                        context={result.data!}
                        key={game.id}
                      />
                    ))}
                  </div>
                ) : (
                  <Empty title="No published games yet">
                    Game coverage may be incomplete. Open the event for
                    available details.
                  </Empty>
                )}
                {result.data.page?.has_more && (
                  <Link
                    className="more-games"
                    href={detailUrl("events", event.id, generation)}
                  >
                    See more games →
                  </Link>
                )}
              </>
            ) : (
              <Problem error={result.error} />
            )}
          </section>
        ))
      )}
      <PageNext
        cursor={response.page?.next_cursor ?? null}
        params={{ ...q, generation, limit: undefined }}
        path="/"
        label="Next events"
      />
      <aside className="coverage-note">
        <strong>A clear view of what’s available.</strong>
        <p>
          Upcoming fixtures and automatic live updates aren’t available in
          launch coverage. Missing details stay visible as unknowns.
        </p>
      </aside>
    </div>
  );
}
