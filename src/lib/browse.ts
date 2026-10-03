import type { Event } from "./model";
export type HomeQuery = Record<string, string | undefined>;
export function homeBrowse(
  query: HomeQuery,
  today = new Date().toISOString().slice(0, 10),
) {
  const recent = !query.q && !query.from && !query.to && !query.view;
  const week = new Date(today + "T00:00:00Z");
  week.setUTCDate(week.getUTCDate() - 7);
  return {
    has_games:
      query.has_games ??
      (recent || query.view === "results" ? "true" : undefined),
    sort: query.sort ?? (recent ? "score_activity_desc" : undefined),
    activity_since:
      query.activity_since ??
      (recent ? week.toISOString().slice(0, 10) : undefined),
    q: query.q,
    from: query.from,
    to: query.to,
    cursor: query.cursor,
    generation: query.generation,
  };
}
export function drawSelection(value: string | undefined) {
  return value ?? "latest";
}
export function drawFilter(value: string | undefined, event: Event) {
  return value === undefined || value === "latest"
    ? (event.latest_scored_draw_id ?? undefined)
    : value === "all" || value === ""
      ? undefined
      : value;
}
