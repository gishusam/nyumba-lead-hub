import assert from "node:assert/strict";
import test from "node:test";

import { API_BASE_URL, dashboardApi } from "./api.ts";

test("dashboard by-area ignores TanStack query context objects", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";

  globalThis.fetch = (async (input: string | URL | Request) => {
    requestedUrl = String(input);
    return new Response("[]", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    await dashboardApi.byArea({
      queryKey: ["dashboard", "by-area"],
    } as never);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    requestedUrl,
    `${API_BASE_URL}/api/dashboard/by-area`,
  );
});
