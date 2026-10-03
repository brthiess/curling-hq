import { api } from "./api";
import { homeBrowse, type HomeQuery } from "./browse";
// Fetch all recent score-active events in one pinned generation. Explicit
// searches and archive browsing keep their existing pagination.
export async function homeEvents(query: HomeQuery) {
  const browse = homeBrowse(query);
  const recent = Boolean(browse.activity_since);
  const params = { ...browse, limit: recent ? "100" : "4" };
  const result = await api.events(params);
  if (!recent) return result;
  let cursor = result.page?.next_cursor;
  const seen = new Set<string>();
  while (cursor) {
    if (seen.has(cursor)) throw new Error("Repeated publication cursor");
    seen.add(cursor);
    const next = await api.events({
      ...params,
      generation: result.meta.generation_id,
      cursor,
    });
    result.data.push(...next.data);
    Object.assign(result.evidence, next.evidence);
    cursor = next.page?.next_cursor;
  }
  result.page = null;
  result.links.next = null;
  return result;
}
