export function GET() {
  const configured =
    Boolean(process.env.CURLING_API_URL) ||
    process.env.CURLING_DEMO_MODE === "true";
  return Response.json(
    { status: configured ? "ok" : "api_not_configured" },
    { status: configured ? 200 : 503 },
  );
}
