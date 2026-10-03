import { demoMode } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  if (demoMode()) return Response.json({ status: "demo" });
  const base = process.env.CURLING_API_URL;
  if (!base)
    return Response.json({ status: "api_not_configured" }, { status: 503 });
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/capabilities`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const body = await response.json();
    const generation = response.headers.get("X-Publication-Generation");
    if (!response.ok || !generation || generation !== body.meta?.generation_id)
      throw new Error();
    return Response.json({ status: "ok", generation_id: generation });
  } catch {
    return Response.json({ status: "api_unavailable" }, { status: 503 });
  }
}
