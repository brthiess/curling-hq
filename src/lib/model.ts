import { z } from "zod";
const base = z.object({
  id: z.string(),
  last_successful_observed_at: z.iso.datetime().nullable(),
  evidence_ids: z.array(z.string()),
  field_evidence: z.record(z.string(), z.array(z.string())),
  issues: z.array(z.string()),
});
export const eventSchema = base.extend({
  latest_scored_draw_id: z.string().nullable().optional(),
  score_activity: z
    .object({ at: z.string(), basis: z.string() })
    .nullable()
    .optional(),
  title: z.string().nullable(),
  source_draws: z
    .array(z.object({ id: z.string(), label: z.string() }))
    .optional(),
  location_label: z.string().nullable(),
  dates: z
    .object({ start: z.iso.date(), end: z.iso.date(), basis: z.string() })
    .nullable(),
  schedule_completeness: z.string(),
  entry_completeness: z.string(),
});
export const entrySchema = base.extend({
  event_id: z.string(),
  display_name: z.string().nullable(),
});
const personSchema = base.extend({ display_name: z.string().nullable() });
export const gameSchema = base.extend({
  event_id: z.string(),
  stage_id: z.string().nullable(),
  draw_id: z.string().nullable(),
  entry_ids: z.tuple([z.string(), z.string()]),
  state: z.enum(["open", "completed", "conceded", "forfeited", "unknown"]),
  winner_entry_id: z.string().nullable(),
  sheet_label: z.string().nullable(),
  venue_label: z.string().nullable(),
  scheduled_time: z
    .object({
      local_date: z.string().nullable(),
      local_time: z.string().nullable(),
      month_day: z.string().nullable(),
      timezone: z.string().nullable(),
      utc_offset: z.string().nullable(),
      instant: z.string().nullable(),
    })
    .nullable(),
  source_draw_id: z.string().nullable().optional(),
  source_draw_label: z.string().nullable().optional(),
  source_stage_label: z.string().nullable().optional(),
  location_label: z.string().nullable().optional(),
  team_profiles: z
    .array(
      z
        .object({
          basis: z.literal("team_profile"),
          members: z.array(
            z.object({
              person_id: z.string().nullable(),
              display_name: z.string(),
              source_position: z.string(),
              kind: z.string(),
            }),
          ),
        })
        .nullable(),
    )
    .length(2)
    .optional(),
  scoreline: z
    .object({
      ends: z
        .array(z.tuple([z.number().nonnegative(), z.number().nonnegative()]))
        .nullable(),
      played_end_count: z.number().nullable(),
      totals: z.tuple([z.number(), z.number()]).nullable(),
      totals_basis: z.string().nullable(),
      listed_final: z.tuple([z.number(), z.number()]).nullable(),
    })
    .nullable(),
  lineups: z.tuple([
    z
      .object({
        person_ids: z.array(z.string()),
        completeness: z.string(),
        duties: z
          .array(
            z.object({
              person_id: z.string(),
              duty: z.string(),
              ends: z.array(z.number()).nullable(),
            }),
          )
          .nullable(),
        deliveries: z
          .array(
            z.object({
              person_id: z.string(),
              slots: z.array(z.number()),
              ends: z.array(z.number()).nullable(),
            }),
          )
          .nullable(),
      })
      .nullable(),
    z
      .object({
        person_ids: z.array(z.string()),
        completeness: z.string(),
        duties: z
          .array(
            z.object({
              person_id: z.string(),
              duty: z.string(),
              ends: z.array(z.number()).nullable(),
            }),
          )
          .nullable(),
        deliveries: z
          .array(
            z.object({
              person_id: z.string(),
              slots: z.array(z.number()),
              ends: z.array(z.number()).nullable(),
            }),
          )
          .nullable(),
      })
      .nullable(),
  ]),
});
const page = z.object({
  limit: z.number(),
  has_more: z.boolean(),
  next_cursor: z.string().nullable(),
});
const envelope = z.object({
  meta: z.object({
    schema_version: z.string().refine((v) => v.startsWith("1.")),
    generation_id: z.string(),
    generated_at: z.iso.datetime(),
    coverage: z.object({ state: z.string(), limitations: z.array(z.string()) }),
    refresh: z.object({
      mode: z.string(),
      target_interval_seconds: z.number().nullable(),
    }),
  }),
  included: z.object({
    events: z.array(eventSchema),
    entries: z.array(entrySchema),
    persons: z.array(personSchema),
    stages: z.array(z.object({ id: z.string(), name: z.string().nullable() })),
    draws: z.array(z.object({ id: z.string(), label: z.string().nullable() })),
  }),
  evidence: z.record(
    z.string(),
    z.object({
      url: z.string().nullable(),
      last_successful_observed_at: z.iso.datetime().nullable(),
    }),
  ),
  page: page.nullable(),
  links: z.object({ self: z.string(), next: z.string().nullable() }),
});
export const eventsResponse = envelope.extend({ data: z.array(eventSchema) });
export const gamesResponse = envelope.extend({ data: z.array(gameSchema) });
export const gameResponse = envelope.extend({ data: gameSchema });
export const searchResponse = envelope.extend({
  data: z.array(
    z.object({
      kind: z.literal("event_entry"),
      entry: entrySchema,
      event_id: z.string(),
    }),
  ),
});
export const eventResponse = envelope.extend({
  data: z.object({
    event: eventSchema,
    entries: z.array(entrySchema),
    draws: z.array(z.object({ id: z.string(), label: z.string().nullable() })),
    fixtures: z.array(z.unknown()),
    byes: z.array(z.unknown()),
    related_pages: z.object({
      entries: page.extend({ next: z.string().nullable() }),
      draws: page.extend({ next: z.string().nullable() }),
    }),
  }),
});
export type Event = z.infer<typeof eventSchema>;
export type Game = z.infer<typeof gameSchema>;
export type Context = z.infer<typeof envelope>;
export function detailUrl(
  kind: "events" | "games",
  id: string,
  generation: string,
) {
  return `/${kind}/${encodeURIComponent(id)}?generation=${encodeURIComponent(generation)}`;
}
// Next 16 passes the captured URL segment encoded. Decode transport encoding
// once; percent-encoded components inside an opaque publication ID stay intact.
export function routeId(segment: string) {
  return decodeURIComponent(segment);
}
export function stateLabel(state: Game["state"]) {
  return {
    open: "In progress when checked",
    completed: "Final",
    conceded: "Conceded",
    forfeited: "Forfeit",
    unknown: "Status unavailable",
  }[state];
}
export function scoreObserved(game: Game, context: Context) {
  return fieldObserved(game, context, "/scoreline");
}
export function fieldObserved(game: Game, context: Context, path: string) {
  const ancestor = Object.keys(game.field_evidence)
    .filter((key) => key === "/" || key === path || path.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0];
  const ids = ancestor ? game.field_evidence[ancestor] : game.evidence_ids;
  const dates = ids
    .map((id) => context.evidence[id]?.last_successful_observed_at)
    .filter((v): v is string => Boolean(v))
    .sort();
  return dates[0] ?? null;
}
export function clock(game: Game) {
  const t = game.scheduled_time;
  if (!t) return "Time unavailable";
  if (t.instant) return `${t.instant.replace("T", " ").replace("Z", " UTC")}`;
  return `${t.local_date ?? t.month_day ?? "Date unknown"} · ${t.local_time ?? "Time unknown"} ${t.timezone ?? t.utc_offset ?? "(source local; timezone unknown)"}`;
}
