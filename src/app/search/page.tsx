import { LiveScores } from "@/components/live-scores";
import Link from "next/link";
import { api } from "@/lib/api";
import { detailUrl } from "@/lib/model";
import { Empty, PageNext, Problem } from "@/components/ui";
export const dynamic = "force-dynamic";
export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursor?: string; generation?: string }>;
}) {
  const p = await searchParams;
  let r: Awaited<ReturnType<typeof api.search>> | undefined;
  let error: unknown;
  if (p.q && p.q.trim().length >= 2) {
    try {
      r = await api.search({ ...p, limit: "24" });
    } catch (e) {
      error = e;
    }
  }
  return (
    <LiveScores generation={r?.meta.generation_id} failed={Boolean(error)}>
      <div className="container detail">
        <Link className="breadcrumb" href="/">
          ← Scores & events
        </Link>
        <p className="eyebrow">FIND YOUR TEAM</p>
        <h1>Who are you following?</h1>
        <p className="detail-sub">
          Search a team name to find its entries and games by event.
        </p>
        <form className="team-search" action="/search">
          <label className="sr-only" htmlFor="team-q">
            Team name
          </label>
          <input
            id="team-q"
            type="search"
            name="q"
            minLength={2}
            maxLength={120}
            required
            defaultValue={p.q}
            placeholder="Enter a team name…"
          />
          <button className="button">
            Search <span aria-hidden="true">→</span>
          </button>
        </form>
        {error ? (
          <Problem error={error} restart="/search" />
        ) : r ? (
          <>
            <div className="section-heading">
              <h2>Team entries</h2>
              <span>Each result belongs to one event</span>
            </div>
            {r.data.length ? (
              <div className="search-results">
                {r.data.map((item) => (
                  <Link
                    key={item.entry.id}
                    href={`${detailUrl("events", item.event_id, r.meta.generation_id)}&entry_id=${encodeURIComponent(item.entry.id)}`}
                  >
                    <span className="search-symbol" aria-hidden="true">
                      ◒
                    </span>
                    <div>
                      <h3>{item.entry.display_name ?? "Name unavailable"}</h3>
                      <p>
                        {r.included.events.find((e) => e.id === item.event_id)
                          ?.title ?? "Event name unavailable"}
                      </p>
                    </div>
                    <span className="text-link">View games →</span>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty title="No matching teams">
                Try another spelling or a shorter name. Search covers collected
                event-entry names.
              </Empty>
            )}
            <PageNext
              cursor={r.page?.next_cursor ?? null}
              params={{ q: p.q, generation: r.meta.generation_id }}
              path="/search"
            />
          </>
        ) : (
          <Empty title="A name is all you need">
            Enter at least two characters to explore available team entries.
          </Empty>
        )}
      </div>
    </LiveScores>
  );
}
