export function nextGenerationUrl(href: string, generation: string) {
  const url = new URL(href, "http://localhost");
  url.searchParams.set("generation", generation);
  for (const key of ["cursor", "entries_cursor", "draws_cursor"])
    url.searchParams.delete(key);
  return url.pathname + url.search + url.hash;
}
export function stableBrowse(path: string, query: URLSearchParams) {
  return (
    path === "/search" ||
    Boolean(query.get("q")) ||
    ["cursor", "entries_cursor", "draws_cursor"].some((key) => query.has(key))
  );
}
export function scoreDelayed(at: string | null, timestamp = Date.now()) {
  return (
    !at ||
    !Number.isFinite(Date.parse(at)) ||
    timestamp - Date.parse(at) >= 300_000
  );
}
