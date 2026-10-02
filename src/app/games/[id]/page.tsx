import Link from "next/link";
import { api } from "@/lib/api";
import { detailUrl, stateLabel, scoreObserved, routeId } from "@/lib/model";
import {
  Checked,
  GameFacts,
  Lineups,
  Problem,
  ScoreTable,
} from "@/components/ui";
export const dynamic = "force-dynamic";
export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ generation?: string }>;
}) {
  const { id: segment } = await params;
  const id = routeId(segment);
  const q = await searchParams;
  let r;
  try {
    r = await api.game(id, q);
  } catch (error) {
    return (
      <div className="container">
        <Problem error={error} />
      </div>
    );
  }
  const g = r.data;
  const ev = r.included.events.find((e) => e.id === g.event_id);
  const sources = [
    ...new Set(
      g.evidence_ids
        .map((id) => r.evidence[id]?.url)
        .filter(
          (url): url is string => Boolean(url) && /^https?:\/\//.test(url!),
        ),
    ),
  ];
  return (
    <div className="container detail">
      <Link
        className="breadcrumb"
        href={detailUrl("events", g.event_id, r.meta.generation_id)}
      >
        ← {ev?.title ?? "Back to event"}
      </Link>
      <div className="game-title">
        <p className="eyebrow">GAME CENTRE</p>
        <span className={`status ${g.state === "open" ? "open" : ""}`}>
          {stateLabel(g.state)}
        </span>
      </div>
      <h1 className="sr-only">
        {g.entry_ids
          .map(
            (id) =>
              r.included.entries.find((e) => e.id === id)?.display_name ??
              "Unknown team",
          )
          .join(" vs ")}
      </h1>
      <section className="match-hero" aria-label="Game score">
        {g.entry_ids.map((id, i) => (
          <div
            className={`match-side ${g.winner_entry_id === id ? "match-winner" : ""}`}
            key={id}
          >
            <span className={`team-mark side-${i}`} aria-hidden="true" />
            <h2>
              {r.included.entries.find((e) => e.id === id)?.display_name ??
                "Team name unavailable"}
            </h2>
            <strong>{g.scoreline?.totals?.[i] ?? "—"}</strong>
            {g.winner_entry_id === id && (
              <span className="winner-label">Winner</span>
            )}
          </div>
        ))}
        <span className="match-divider" aria-hidden="true">
          :
        </span>
      </section>
      <div className="match-caption">
        <span>
          {g.scoreline?.played_end_count != null
            ? `${g.scoreline.played_end_count} ends played`
            : "End count unavailable"}
        </span>
        <Checked at={scoreObserved(g, r)} label="Score checked" />
      </div>
      {g.state === "open" && (
        <p className="inline-note">
          This game was open at its last check. The score may have changed since
          then.
        </p>
      )}
      <ScoreTable game={g} context={r} />
      <Lineups game={g} context={r} />
      <section className="game-info">
        <div className="section-heading">
          <h2>Game details</h2>
        </div>
        <GameFacts game={g} context={r} />
      </section>
      {g.issues.length > 0 && (
        <p className="inline-note">
          Some game or lineup details are incomplete or require verification.
          Only available accepted information is displayed.
        </p>
      )}
      <div className="source-links">
        <span>Source information</span>
        {sources.map((url, i) => (
          <a key={url} href={url} target="_blank" rel="noopener noreferrer">
            View source {sources.length > 1 ? i + 1 : ""} ↗
          </a>
        ))}
      </div>
    </div>
  );
}
