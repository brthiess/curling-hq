import Link from "next/link";
import { ApiError } from "@/lib/api";
import {
  Context,
  Event,
  Game,
  clock,
  detailUrl,
  scoreObserved,
  fieldObserved,
  stateLabel,
} from "@/lib/model";
export function Checked({
  at,
  label = "Checked",
}: {
  at: string | null;
  label?: string;
}) {
  return (
    <span className="checked">
      {label}{" "}
      {at ? (
        <time dateTime={at}>
          {new Intl.DateTimeFormat("en", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
          }).format(new Date(at))}{" "}
          UTC
        </time>
      ) : (
        "time unavailable"
      )}
    </span>
  );
}
export function EventDates({ event }: { event: Event }) {
  return (
    <>
      {event.dates
        ? `${event.dates.start} — ${event.dates.end}`
        : "Dates unavailable"}
      {event.location_label && ` · ${event.location_label}`}
    </>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-stone" aria-hidden="true">
        ◒
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Problem({
  error,
  restart = "/",
}: {
  error: unknown;
  restart?: string;
}) {
  const code = error instanceof ApiError ? error.code : "";
  const expired = [
    "generation_expired",
    "cursor_expired",
    "generation_not_found",
    "invalid_generation",
    "cursor_context_mismatch",
  ].includes(code);
  const missing = [
    "event_not_found",
    "game_not_found",
    "record_withdrawn",
  ].includes(code);
  const invalid = [
    "invalid_parameter",
    "unsupported_filter",
    "invalid_cursor",
  ].includes(code);
  return (
    <section className="problem" role="status">
      <h2>
        {expired
          ? "This browse session needs a fresh start"
          : invalid
            ? "These filters couldn’t be used"
            : missing
              ? "This record is unavailable"
              : "Scores are temporarily unavailable"}
      </h2>
      <p>
        {expired
          ? "The dataset changed or this session expired. Start again to view one consistent set of results."
          : invalid
            ? "Clear the filters and try a valid name, date range, or game status."
            : missing
              ? "The requested game or event is absent or has been withdrawn from this dataset."
              : "We couldn’t load the published data. Please try again shortly."}
      </p>
      <Link className="button" href={restart}>
        {expired ? "Restart browsing" : "Back to events"}
      </Link>
    </section>
  );
}
export function GameCard({ game, context }: { game: Game; context: Context }) {
  const names = game.entry_ids.map(
    (id) =>
      context.included.entries.find((e) => e.id === id)?.display_name ??
      "Name unavailable",
  );
  return (
    <Link
      className="game-card"
      href={detailUrl("games", game.id, context.meta.generation_id)}
    >
      <div className="card-meta">
        <span className={`status ${game.state === "open" ? "open" : ""}`}>
          {stateLabel(game.state)}
        </span>
        <span>
          {game.sheet_label ? `Sheet ${game.sheet_label}` : "Sheet unavailable"}
        </span>
      </div>
      <div className="teams">
        {names.map((name, i) => (
          <div
            className={`team-row ${game.winner_entry_id === game.entry_ids[i] ? "winner" : ""}`}
            key={game.entry_ids[i]}
          >
            <span className={`team-mark side-${i}`} aria-hidden="true" />
            <span>{name}</span>
            <strong>{game.scoreline?.totals?.[i] ?? "—"}</strong>
          </div>
        ))}
      </div>
      <div className="card-bottom">
        <span>
          {game.scoreline?.played_end_count != null
            ? `${game.scoreline.played_end_count} ends played`
            : "End count unavailable"}
        </span>
        <span className="arrow" aria-hidden="true">
          ↗
        </span>
      </div>
      <Checked at={scoreObserved(game, context)} />
    </Link>
  );
}
export function ScoreTable({
  game,
  context,
}: {
  game: Game;
  context: Context;
}) {
  const ends = game.scoreline?.ends;
  return (
    <div className="score-section">
      <div className="section-heading">
        <h2>End by end</h2>
        <span>
          {ends ? `${ends.length} played ends` : "End history unavailable"}
        </span>
      </div>
      <div
        className="score-scroll"
        tabIndex={0}
        role="region"
        aria-label="End by end score; scroll horizontally for extra ends"
      >
        <table className="score-table">
          <caption className="sr-only">
            Scores by played end, including blank and extra ends
          </caption>
          <thead>
            <tr>
              <th scope="col">Team</th>
              {ends?.map((_, i) => (
                <th scope="col" key={i}>
                  {i + 1}
                </th>
              ))}
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {game.entry_ids.map((id, side) => (
              <tr key={id}>
                <th scope="row">
                  {context.included.entries.find((e) => e.id === id)
                    ?.display_name ?? "Name unavailable"}
                </th>
                {ends?.map((end, i) => (
                  <td key={i} className={end[side] > 0 ? "scored" : ""}>
                    {end[side]}
                  </td>
                ))}
                <td className="total">
                  {game.scoreline?.totals?.[side] ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="score-foot">
        <span>Only played ends are shown. Blank ends score 0–0.</span>
        <Checked at={scoreObserved(game, context)} label="Score checked" />
      </div>
    </div>
  );
}
export function Lineups({ game, context }: { game: Game; context: Context }) {
  return (
    <section>
      <div className="section-heading">
        <h2>Who’s playing</h2>
        <span>Available game lineups</span>
      </div>
      <div className="lineup-grid">
        {game.entry_ids.map((id, side) => {
          const lineup = game.lineups[side];
          return (
            <article className="lineup" key={id}>
              <h3>
                <span className={`team-mark side-${side}`} aria-hidden="true" />
                {context.included.entries.find((e) => e.id === id)
                  ?.display_name ?? "Name unavailable"}
              </h3>
              {lineup && lineup.person_ids.length > 0 ? (
                <>
                  <ul>
                    {lineup.person_ids.map((person) => {
                      const duties = lineup.duties?.filter(
                        (d) => d.person_id === person,
                      );
                      return (
                        <li key={person}>
                          <span>
                            {context.included.persons.find(
                              (p) => p.id === person,
                            )?.display_name ?? "Player name unavailable"}
                          </span>
                          <small>
                            {duties
                              ?.map(
                                (d) =>
                                  `${d.duty === "vice_skip" ? "Vice-skip" : "Skip"}${d.ends ? ` · ends ${d.ends.join(", ")}` : ""}`,
                              )
                              .join(" · ") || "Position not reported"}
                          </small>
                        </li>
                      );
                    })}
                  </ul>
                  {lineup.completeness !== "complete" && (
                    <p className="lineup-note">
                      Partial lineup · additional players may be unreported.
                    </p>
                  )}
                  <Checked
                    at={fieldObserved(game, context, `/lineups/${side}`)}
                    label="Lineup checked"
                  />
                </>
              ) : (
                <p className="lineup-note">
                  Playing lineup not reported for this game.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
export function GameFacts({ game, context }: { game: Game; context: Context }) {
  const stage = context.included.stages.find((s) => s.id === game.stage_id);
  const draw = context.included.draws.find((d) => d.id === game.draw_id);
  return (
    <dl className="facts">
      <div>
        <dt>Scheduled time</dt>
        <dd>{clock(game)}</dd>
      </div>
      <div>
        <dt>Draw / stage</dt>
        <dd>
          {[draw?.label, stage?.name].filter(Boolean).join(" · ") ||
            "Not reported"}
        </dd>
      </div>
      <div>
        <dt>Sheet</dt>
        <dd>{game.sheet_label ?? "Not reported"}</dd>
      </div>
      <div>
        <dt>Venue</dt>
        <dd>{game.venue_label ?? "Not reported"}</dd>
      </div>
    </dl>
  );
}
export function PageNext({
  cursor,
  params,
  path,
  label = "More results",
}: {
  cursor: string | null;
  params: Record<string, string | undefined>;
  path: string;
  label?: string;
}) {
  if (!cursor) return null;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, cursor }))
    if (v) q.set(k, v);
  return (
    <div className="pagination">
      <Link className="button secondary" href={`${path}?${q}`}>
        {label} →
      </Link>
    </div>
  );
}
