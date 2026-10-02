import { z } from "zod";
import examples from "@/fixtures/api-examples.json";
import {
  eventsResponse,
  eventResponse,
  gamesResponse,
  gameResponse,
  searchResponse,
} from "./model";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
export const demoMode = () =>
  process.env.CURLING_DEMO_MODE === "true" ||
  (!process.env.CURLING_API_URL && process.env.NODE_ENV !== "production");
type Params = Record<string, string | undefined>;
export function apiPath(path: string, params: Params = {}) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value) q.set(key, value);
  return `${path}${q.size ? "?" + q : ""}`;
}
function demo(path: string, params: Params) {
  if (params.generation && params.generation !== "g-demo-001")
    throw new ApiError(410, "generation_expired");
  if (path === "/events") {
    const r = structuredClone(examples.event_browse);
    r.data = r.data.filter(
      (e) =>
        (!params.q ||
          params.q
            .toLowerCase()
            .split(/\s+/)
            .every((t) => e.title.toLowerCase().includes(t))) &&
        (!params.from || e.dates.end >= params.from) &&
        (!params.to || e.dates.start <= params.to),
    );
    return r;
  }
  if (path === "/search/teams") {
    const r = structuredClone(examples.team_search);
    r.data = r.data.filter((e) =>
      (params.q ?? "")
        .toLowerCase()
        .split(/\s+/)
        .every((t) => e.entry.display_name.toLowerCase().includes(t)),
    );
    return r;
  }
  const id = decodeURIComponent(path.split("/")[2] ?? "");
  if (path.startsWith("/games/")) {
    if (id !== examples.game_detail.data.id)
      throw new ApiError(404, "game_not_found");
    return examples.game_detail;
  }
  if (path.endsWith("/games")) {
    const r = structuredClone(examples.event_games);
    r.data = r.data.filter(
      (g) =>
        g.event_id === id &&
        (!params.entry_id || g.entry_ids.includes(params.entry_id)) &&
        (!params.state || g.state === params.state),
    );
    return r;
  }
  const ev = examples.event_browse.data.find((e) => e.id === id);
  if (!ev) throw new ApiError(404, "event_not_found");
  if (id === examples.event_detail.data.event.id) return examples.event_detail;
  return {
    ...examples.event_detail,
    data: { ...examples.event_detail.data, event: ev, entries: [], draws: [] },
  };
}
export async function request<S extends z.ZodType>(
  path: string,
  schema: S,
  params: Params = {},
): Promise<z.infer<S>> {
  let raw: unknown;
  if (demoMode()) raw = demo(path, params);
  else {
    const base = process.env.CURLING_API_URL;
    if (!base) throw new ApiError(503, "not_configured");
    let response: Response;
    try {
      response = await fetch(
        `${base.replace(/\/$/, "")}${apiPath(path, params)}`,
        { cache: "no-store", signal: AbortSignal.timeout(10000) },
      );
    } catch {
      throw new ApiError(503, "connection_failed");
    }
    raw = await response.json().catch(() => null);
    if (!response.ok) {
      const error = raw as { error?: { code?: string } } | null;
      throw new ApiError(
        response.status,
        error?.error?.code ?? "publication_unavailable",
      );
    }
    const header = response.headers.get("X-Publication-Generation");
    if (
      !header ||
      header !==
        (raw as { meta?: { generation_id?: string } })?.meta?.generation_id
    )
      throw new ApiError(502, "invalid_generation");
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw new ApiError(502, "invalid_response");
  const response = result.data as { meta?: { generation_id: string } };
  if (params.generation && response.meta?.generation_id !== params.generation)
    throw new ApiError(502, "invalid_generation");
  return result.data;
}
export const api = {
  events: (p: Params = {}) => request("/events", eventsResponse, p),
  search: (p: Params) => request("/search/teams", searchResponse, p),
  event: (id: string, p: Params) =>
    request(`/events/${encodeURIComponent(id)}`, eventResponse, p),
  games: (id: string, p: Params) =>
    request(`/events/${encodeURIComponent(id)}/games`, gamesResponse, p),
  game: (id: string, p: Params) =>
    request(`/games/${encodeURIComponent(id)}`, gameResponse, p),
};
