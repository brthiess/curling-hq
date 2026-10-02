import { test } from "node:test";
import assert from "node:assert/strict";
import examples from "../src/fixtures/api-examples.json";
import { ApiError, api, apiPath } from "../src/lib/api";
test("API requests preserve query encoding and reject mixed or malformed generations", async () => {
  const env = {
    url: process.env.CURLING_API_URL,
    demo: process.env.CURLING_DEMO_MODE,
  };
  const original = globalThis.fetch;
  process.env.CURLING_API_URL = "https://example.invalid/v1";
  process.env.CURLING_DEMO_MODE = "false";
  try {
    let requested = "";
    globalThis.fetch = async (input) => {
      requested = String(input);
      return Response.json(examples.game_detail, {
        headers: { "X-Publication-Generation": "g-demo-001" },
      });
    };
    const id = examples.game_detail.data.id;
    const result = await api.game(id, { generation: "g-demo-001" });
    assert.equal(result.data.id, id);
    assert.equal(
      requested,
      `https://example.invalid/v1/games/${encodeURIComponent(id)}?generation=g-demo-001`,
    );
    await assert.rejects(
      () => api.game(id, { generation: "other" }),
      (e: unknown) => e instanceof ApiError && e.code === "invalid_generation",
    );
    globalThis.fetch = async () =>
      Response.json(examples.game_detail, {
        headers: { "X-Publication-Generation": "wrong" },
      });
    await assert.rejects(
      () => api.game(id, {}),
      (e: unknown) => e instanceof ApiError && e.code === "invalid_generation",
    );
    globalThis.fetch = async () =>
      Response.json(
        { meta: { generation_id: "g-demo-001" } },
        { headers: { "X-Publication-Generation": "g-demo-001" } },
      );
    await assert.rejects(
      () => api.game(id, {}),
      (e: unknown) => e instanceof ApiError && e.code === "invalid_response",
    );
  } finally {
    globalThis.fetch = original;
    if (env.url === undefined) delete process.env.CURLING_API_URL;
    else process.env.CURLING_API_URL = env.url;
    if (env.demo === undefined) delete process.env.CURLING_DEMO_MODE;
    else process.env.CURLING_DEMO_MODE = env.demo;
  }
});
test("API expiry and connection failures stay errors rather than falling back to synthetic results", async () => {
  const url = process.env.CURLING_API_URL;
  const demo = process.env.CURLING_DEMO_MODE;
  const original = globalThis.fetch;
  process.env.CURLING_API_URL = "https://example.invalid/v1";
  process.env.CURLING_DEMO_MODE = "false";
  try {
    globalThis.fetch = async () =>
      Response.json(examples.generation_expired, { status: 410 });
    await assert.rejects(
      () => api.events({ generation: "old" }),
      (e: unknown) =>
        e instanceof ApiError &&
        e.status === 410 &&
        e.code === "generation_expired",
    );
    globalThis.fetch = async () => {
      throw new Error("offline");
    };
    await assert.rejects(
      () => api.events(),
      (e: unknown) => e instanceof ApiError && e.code === "connection_failed",
    );
  } finally {
    globalThis.fetch = original;
    if (url === undefined) delete process.env.CURLING_API_URL;
    else process.env.CURLING_API_URL = url;
    if (demo === undefined) delete process.env.CURLING_DEMO_MODE;
    else process.env.CURLING_DEMO_MODE = demo;
  }
});
test("new filter queries omit empty controls and escape cursor values", () => {
  assert.equal(
    apiPath("/events", { q: "", cursor: "a+/=", generation: "g1" }),
    "/events?cursor=a%2B%2F%3D&generation=g1",
  );
});
