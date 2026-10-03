import { homeEvents } from "@/lib/home-events";
import { drawFilter } from "@/lib/browse";
import { z } from "zod";
import { api, demoMode, request } from "@/lib/api";
export const dynamic = "force-dynamic";
const capabilities = z.object({
  meta: z.object({
    generation_id: z.string(),
    refresh: z.object({ mode: z.string() }),
  }),
  data: z.object({
    worker_status: z
      .object({
        state: z.string().optional(),
        heartbeat: z.string().optional(),
        failures: z.array(z.unknown()).optional(),
        cycle_overrun: z.boolean().optional(),
      })
      .optional(),
  }),
});
export async function GET(req: Request) {
  const input = new URL(req.url).searchParams;
  const page = input.get("page") ?? "/";
  const query = new URLSearchParams(input.get("query") ?? "");
  try {
    if (demoMode())
      return Response.json({ generation_id: "g-demo-001", scheduled: false });
    const cap = await request("/capabilities", capabilities);
    const generation = input.get("generation") ?? cap.meta.generation_id;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(generation))
      throw new Error("Invalid generation");
    if (input.get("ready") === "true") {
      if (page === "/") {
        const results = await homeEvents({
          ...Object.fromEntries(query),
          cursor: undefined,
          generation,
        });
        await Promise.all(
          results.data.map((event) =>
            api.games(event.id, {
              generation,
              limit: "4",
              source_draw_id: drawFilter(
                query.get(`draw_${event.id}`) ?? undefined,
                event,
              ),
            }),
          ),
        );
      } else if (page === "/search") {
        if (query.get("q"))
          await api.search({ generation, q: query.get("q")!, limit: "24" });
      } else {
        const match = /^\/(events|games)\/([^/]+)$/.exec(page);
        if (!match)
          return Response.json({ error: "Unsupported page" }, { status: 400 });
        const id = decodeURIComponent(match[2]);
        if (match[1] === "games") await api.game(id, { generation });
        else {
          const event = await api.event(id, { generation, limit: "50" });
          await api.games(id, {
            generation,
            limit: "24",
            entry_id: query.get("entry_id") ?? undefined,
            source_draw_id: drawFilter(
              query.get("source_draw_id") ?? undefined,
              event.data.event,
            ),
            state: query.get("state") ?? undefined,
          });
        }
      }
    }
    return Response.json(
      {
        generation_id: cap.meta.generation_id,
        scheduled: cap.meta.refresh.mode === "scheduled",
        worker: cap.data.worker_status,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Publication unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
